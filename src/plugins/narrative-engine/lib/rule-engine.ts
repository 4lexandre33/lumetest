import { makeIssue, ParseError, stripLineComment, tokenize, TokenCursor } from "./lexer.ts";
import { matchesEntity, parseMatcher, queryHasResults, specificityOf } from "./query.ts";
import type { CompiledTaxonomy } from "./taxonomy.ts";
import type { ChangeAST, ChangeField, ChangeTarget, Entity, Issue, MatcherAST, PathDrawer, Token, WorldModel } from "./types.ts";
import { isPathDrawer } from "./types.ts";
import { cloneEntity, cloneWorldModel, parseDottedEntity, assignLink, clearLink, readStat, writeStat, destroyEntityInWorld, instantiateFromTemplate, syncLinks, createEmptyEntity, findEntityByQuad, assertEntityId, getLink } from "./world-model.ts";

export const SEMANTIC_KINDS = [
  "constraint",
  "transformation",
  "lifecycle",
  "relation",
  "cognition",
  "agency",
  "process",
] as const;

export type SemanticKind = (typeof SEMANTIC_KINDS)[number];

export type EffectOp = {
  verb: string;
  args: string[];
  source: string;
  line: number;
};

export type Rule = {
  id: string;
  index: number;
  trigger: MatcherAST;
  conditions: MatcherAST[];
  changes: ChangeAST[];
  effects: EffectOp[];
  semantics: SemanticKind[];
  funcao: string;
  narrative: string;
  voices: Record<string, string>;
  source: string;
  startLine: number;
};

export type RuleMatch = { rule: Rule; score: number };

export type DoLine = { change?: ChangeAST; effect?: EffectOp };

const KW_RE = /^(ON|IF|DO|NARRATIVA|NARRATIVE|SEMANTIC|SEMANTICS|FUNCAO|FUNÇÃO|FUNCTION)\s*:/i;
const EFFECT_VERBS = new Set(["EMIT", "INTENT", "KNOW", "WAIT", "TICK", "THEN", "LIVE"]);
const EFFECT_ALLOW_EMPTY = new Set(["TICK", "LIVE"]);
const WORLD_VERBS = new Set(["CREATE", "DESTROY", "SPAWN"]);
const LIST_VERBS = new Set(["PUSH", "POP", "REMOVE", "CLEAR", "ADD_UNIQUE"]);
const NAMED_DO_VERBS = new Set([
  "ADD_TAG",
  "REMOVE_TAG",
  "SET_STAT",
  "ADD_STAT",
  "MUL_STAT",
  "SET_FLAG",
  "SET_ENUM",
  "SET_LINK",
  "SET_PHRASE",
  "UNLINK",
  "CLEAR_LINK",
  "SET_FUSE",
]);
const SEMANTIC_SET = new Set<string>(SEMANTIC_KINDS);

function fail(detail: string, t: Token, file = "rules"): never {
  throw new ParseError(makeIssue("E000", "error", { detail }, { file, line: t.line, column: t.column }));
}

function parseLinkLookup(cur: TokenCursor, file: string): { entityId: string; key: string } {
  cur.expect("LPAREN", file, "esperado (");
  const kw = cur.expect("IDENT", file, "esperado 'link'");
  if (kw.value.toLowerCase() !== "link") fail("esperado 'link'", kw, file);
  const idTok = cur.at("DOLLAR") ? cur.consume() : cur.expect("IDENT", file, "esperado id");
  cur.expect("DOT", file, "esperado . depois do id no lookup");
  const keyTok = cur.expect("IDENT", file, "esperado chave do link");
  cur.expect("RPAREN", file, "esperado )");
  return { entityId: idTok.value, key: keyTok.value };
}

function parseTarget(cur: TokenCursor, file: string): ChangeTarget {
  if (cur.at("DOLLAR")) {
    cur.consume();
    return { kind: "trigger" };
  }
  if (cur.at("LPAREN")) {
    const look = parseLinkLookup(cur, file);
    return { kind: "linkLookup", entityId: look.entityId, key: look.key };
  }
  const t = cur.expect("IDENT", file, "esperado id alvo");
  return { kind: "id", id: t.value };
}

export function parseChangeLine(source: string, options: { file?: string; startLine?: number } = {}): ChangeAST {
  const file = options.file ?? "rules";
  const startLine = options.startLine ?? 1;
  const tokens = tokenize(source.trim(), { file, startLine });
  const cur = new TokenCursor(tokens);
  const target = parseTarget(cur, file);
  const fields: ChangeField[] = [];
  while (cur.at("DOT")) {
    cur.consume();
    if (cur.at("MINUS")) {
      cur.consume();
      const tag = cur.expect("IDENT", file, "esperado tag para remover");
      fields.push({ kind: "removeTag", tag: tag.value });
      continue;
    }
    const first = cur.expect("IDENT", file, "esperado campo");
    let drawer: PathDrawer | undefined;
    let keyTok = first;
    if (isPathDrawer(first.value) && cur.at("DOT")) {
      drawer = first.value;
      cur.consume();
      if (cur.at("MINUS")) {
        cur.consume();
        const tag = cur.expect("IDENT", file, "esperado tag para remover");
        fields.push({ kind: "removeTag", tag: tag.value });
        continue;
      }
      keyTok = cur.expect("IDENT", file, "esperado chave da gaveta");
    }
    if (drawer === "lists" || drawer === "fuses" || drawer === "struct") {
      fail(`gaveta ${drawer} não aceita caminho compacto no do:`, cur.peek(), file);
    }
    if (cur.at("EQ")) {
      cur.consume();
      const v = cur.peek();
      if (v.kind === "NUMBER") {
        cur.consume();
        if (drawer === "flags") {
          fields.push({ kind: "setFlag", key: keyTok.value, value: v.number !== 0 });
        } else if (drawer === "enums") {
          fields.push({ kind: "setEnum", key: keyTok.value, value: String(v.number ?? v.value) });
        } else if (drawer === "phrases") {
          fields.push({ kind: "setPhrase", key: keyTok.value, value: String(v.number ?? v.value) });
        } else if (drawer === "hardLinks" || drawer === "softLinks" || drawer === "links") {
          fail("esperado id de entidade", v, file);
        } else {
          fields.push({ kind: "setStat", key: keyTok.value, value: v.number ?? Number(v.value) });
        }
      } else if (v.kind === "LPAREN") {
        const look = parseLinkLookup(cur, file);
        const value: ChangeTarget = { kind: "linkLookup", entityId: look.entityId, key: look.key };
        const linkKind = drawer === "hardLinks" ? "hard" : drawer === "softLinks" ? "soft" : undefined;
        fields.push(linkKind ? { kind: "setLink", key: keyTok.value, value, linkKind } : { kind: "setLink", key: keyTok.value, value });
      } else if (v.kind === "DOLLAR" || v.kind === "IDENT") {
        cur.consume();
        if (drawer === "stats") fail("esperado número", v, file);
        if (drawer === "phrases") {
          fields.push({ kind: "setPhrase", key: keyTok.value, value: v.value });
        } else if (v.kind === "IDENT" && /^(true|false|sim|nao|não|yes|no)$/i.test(v.value)) {
          fields.push({ kind: "setFlag", key: keyTok.value, value: /^(true|sim|yes)$/i.test(v.value) });
        } else if (drawer === "enums" && v.kind === "IDENT") {
          fields.push({ kind: "setEnum", key: keyTok.value, value: v.value });
        } else if (drawer === "flags") {
          fail("esperado true ou false", v, file);
        } else {
          const value: ChangeTarget = v.kind === "DOLLAR" ? { kind: "trigger" } : { kind: "id", id: v.value };
          const linkKind = drawer === "hardLinks" ? "hard" : drawer === "softLinks" ? "soft" : undefined;
          fields.push(linkKind ? { kind: "setLink", key: keyTok.value, value, linkKind } : { kind: "setLink", key: keyTok.value, value });
        }
      } else fail("esperado número ou id", v, file);
    } else if (cur.at("PLUS") || cur.at("MINUS")) {
      const sign = cur.consume().kind === "MINUS" ? -1 : 1;
      if (cur.at("NUMBER")) {
        const n = cur.consume();
        fields.push({ kind: "deltaStat", key: keyTok.value, delta: sign * (n.number ?? Number(n.value)) });
      } else {
        const from = parseTarget(cur, file);
        cur.expect("DOT", file, "esperado .stat da origem");
        let statTok = cur.expect("IDENT", file, "esperado stat da origem");
        if (isPathDrawer(statTok.value) && cur.at("DOT")) {
          cur.consume();
          statTok = cur.expect("IDENT", file, "esperado chave da gaveta");
        }
        fields.push({ kind: "deltaStatFrom", key: keyTok.value, sign, from, stat: statTok.value });
      }
    } else if (cur.at("STAR")) {
      cur.consume();
      const n = cur.expect("NUMBER", file, "esperado fator");
      fields.push({ kind: "mulStat", key: keyTok.value, factor: n.number ?? Number(n.value) });
    } else if (cur.at("NUMBER")) {
      const n = cur.consume();
      fields.push({ kind: "deltaStat", key: keyTok.value, delta: n.number ?? Number(n.value) });
    } else {
      fields.push({ kind: "addTag", tag: keyTok.value });
    }
  }
  return { target, fields, source: source.trim(), line: startLine };
}

function parseVerbRest(source: string): { verb: string; rest: string } | null {
  const trimmed = source.trim();
  const m = trimmed.match(/^([A-Za-z_][\w]*)\b/);
  if (!m) return null;
  return { verb: m[1]!.toUpperCase(), rest: trimmed.slice(m[0].length).trim() };
}

function parseCreateLine(rest: string, source: string, startLine: number): ChangeAST {
  if (!rest) {
    throw new ParseError(makeIssue("E000", "error", { detail: "CREATE requer um id" }, { file: "rules", line: startLine, column: 1 }));
  }
  const entity = parseDottedEntity(rest, startLine);
  return {
    target: { kind: "id", id: entity.id },
    fields: [{ kind: "createEntity", entity }],
    source: source.trim(),
    line: startLine,
  };
}

function parseSpawnLine(rest: string, source: string, startLine: number): ChangeAST {
  if (!rest) {
    throw new ParseError(makeIssue("E000", "error", { detail: "SPAWN requer um id" }, { file: "rules", line: startLine, column: 1 }));
  }
  const from = rest.trim().match(/^(@?[\p{L}_][\p{L}\p{N}\p{M}_]*)\s+(?:FROM|DE)\s+(@?[\p{L}_][\p{L}\p{N}\p{M}_]*)$/iu);
  if (from) {
    const entity = createEmptyEntity(assertEntityId(from[1]!, startLine), { templateId: from[2] });
    return {
      target: { kind: "id", id: entity.id },
      fields: [{ kind: "createEntity", entity }],
      source: source.trim(),
      line: startLine,
    };
  }
  const entity = parseDottedEntity(rest, startLine);
  return {
    target: { kind: "id", id: entity.id },
    fields: [{ kind: "createEntity", entity }],
    source: source.trim(),
    line: startLine,
  };
}

function parseDestroyLine(rest: string, source: string, startLine: number): ChangeAST {
  const id = rest.split(/\s+/)[0]?.replace(/\.$/, "") ?? "";
  if (!id) {
    throw new ParseError(makeIssue("E000", "error", { detail: "DESTROY requer um id" }, { file: "rules", line: startLine, column: 1 }));
  }
  const target: ChangeTarget = id === "$" ? { kind: "trigger" } : { kind: "id", id };
  return {
    target,
    fields: [{ kind: "destroyEntity" }],
    source: source.trim(),
    line: startLine,
  };
}

function parseListOpLine(verb: string, rest: string, source: string, startLine: number): ChangeAST {
  const m = rest.trim().match(/^(\$|#[0-9A-Fa-f]{4}|@[\p{L}_][\p{L}\p{N}\p{M}_]*|[\p{L}_][\p{L}\p{N}\p{M}_]*)\.([\p{L}_][\p{L}\p{N}\p{M}_]*)(?:\s+(.+))?$/u);
  if (!m) {
    throw new ParseError(makeIssue("E000", "error", { detail: `${verb} requer ENTIDADE.lista` }, { file: "rules", line: startLine, column: 1 }));
  }
  const id = m[1]!;
  const list = m[2]!;
  const raw = m[3]?.trim();
  let value: string | number | undefined;
  if (raw) value = /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw;
  const op = verb as "PUSH" | "POP" | "REMOVE" | "CLEAR" | "ADD_UNIQUE";
  if ((op === "PUSH" || op === "REMOVE" || op === "ADD_UNIQUE") && value === undefined) {
    throw new ParseError(makeIssue("E000", "error", { detail: `${verb} requer um valor` }, { file: "rules", line: startLine, column: 1 }));
  }
  const target: ChangeTarget = id === "$" ? { kind: "trigger" } : { kind: "id", id };
  return {
    target,
    fields: [{ kind: "listOp", list, op, value }],
    source: source.trim(),
    line: startLine,
  };
}

type NamedPath = {
  target: ChangeTarget;
  drawer?: PathDrawer;
  key: string;
  valueRaw: string;
  compactHead: string;
};

function dummyToken(line: number, value = ""): Token {
  return { kind: "IDENT", value, line, column: 1, index: 0 };
}

function takeNamedIdent(s: string, i: number): { ident: string; next: number } | null {
  const slice = s.slice(i);
  const hash = slice.match(/^#[0-9A-Fa-f]{4}/);
  if (hash) return { ident: hash[0], next: i + hash[0].length };
  const at = slice.match(/^@[\p{L}_][\p{L}\p{N}\p{M}_]*/u);
  if (at) return { ident: at[0], next: i + at[0].length };
  const ident = slice.match(/^[\p{L}_][\p{L}\p{N}\p{M}_]*/u);
  if (ident) return { ident: ident[0], next: i + ident[0].length };
  return null;
}

function skipSpaces(s: string, i: number): number {
  while (i < s.length && /[ \t]/.test(s[i]!)) i += 1;
  return i;
}

function parseNamedPath(rest: string, verb: string, startLine: number): NamedPath {
  const s = rest.trim();
  if (!s) fail(`${verb} requer ENTIDADE.chave`, dummyToken(startLine, verb));
  let i = 0;
  let target: ChangeTarget;
  let compactHead: string;
  const link = s.match(/^\(\s*link\s+(\$|#[0-9A-Fa-f]{4}|@[\p{L}_][\p{L}\p{N}\p{M}_]*|[\p{L}_][\p{L}\p{N}\p{M}_]*)\.([\p{L}_][\p{L}\p{N}\p{M}_]*)\s*\)/u);
  if (link) {
    target = { kind: "linkLookup", entityId: link[1]!, key: link[2]! };
    compactHead = `(link ${link[1]}.${link[2]})`;
    i = link[0].length;
  } else if (s[0] === "$" && (s.length === 1 || /[\s.]/.test(s[1]!))) {
    target = { kind: "trigger" };
    compactHead = "$";
    i = 1;
  } else {
    const id = takeNamedIdent(s, 0);
    if (!id) fail(`${verb} requer um alvo`, dummyToken(startLine, s));
    target = { kind: "id", id: id.ident };
    compactHead = id.ident;
    i = id.next;
  }
  const parts: string[] = [];
  i = skipSpaces(s, i);
  if (s[i] === ".") {
    while (s[i] === ".") {
      i += 1;
      i = skipSpaces(s, i);
      const part = takeNamedIdent(s, i);
      if (!part) fail(`${verb} esperado chave depois de .`, dummyToken(startLine, verb));
      parts.push(part.ident);
      i = part.next;
      i = skipSpaces(s, i);
    }
  } else {
    const part = takeNamedIdent(s, i);
    if (!part) fail(`${verb} requer uma chave`, dummyToken(startLine, verb));
    parts.push(part.ident);
    i = part.next;
  }
  let drawer: PathDrawer | undefined;
  let key: string;
  if (parts.length >= 2 && isPathDrawer(parts[0]!)) {
    drawer = parts[0];
    key = parts[1]!;
    if (parts.length > 2) fail(`${verb} caminho a mais depois da chave`, dummyToken(startLine, parts[2]));
  } else if (parts.length === 1) {
    key = parts[0]!;
  } else {
    fail(`${verb} caminho inválido`, dummyToken(startLine, parts.join(".")));
    key = "";
  }
  let valueRaw = s.slice(i).trim();
  if (valueRaw.startsWith("=")) valueRaw = valueRaw.slice(1).trim();
  return { target, drawer, key, valueRaw, compactHead };
}

function pathWithDrawer(path: NamedPath, implied?: PathDrawer): string {
  const drawer = path.drawer ?? implied;
  return drawer ? `${drawer}.${path.key}` : path.key;
}

function namedCompact(path: NamedPath, suffix: string, source: string, startLine: number): ChangeAST {
  const change = parseChangeLine(`${path.compactHead}.${suffix}`, { startLine });
  change.source = source.trim();
  return change;
}

function requireValue(path: NamedPath, verb: string, startLine: number): string {
  if (!path.valueRaw) fail(`${verb} requer um valor`, dummyToken(startLine, verb));
  return path.valueRaw;
}

function parseFuseValue(raw: string, key: string, startLine: number): { remaining: number; targetId: string } {
  const m = raw.trim().match(/^(-?\d+)(?:\s*[>→:]\s*(\$|#[0-9A-Fa-f]{4}|@[\p{L}_][\p{L}\p{N}\p{M}_]*|[\p{L}_][\p{L}\p{N}\p{M}_]*))?$/u);
  if (!m) fail("SET_FUSE requer turnos ou turnos>alvo", dummyToken(startLine, raw));
  return { remaining: Number(m[1]), targetId: m[2] || key };
}

function parseNamedDoLine(verb: string, rest: string, source: string, startLine: number): ChangeAST {
  const path = parseNamedPath(rest, verb, startLine);
  if (verb === "ADD_TAG") {
    if (path.valueRaw) fail("ADD_TAG não aceita valor extra", dummyToken(startLine, path.valueRaw));
    return namedCompact(path, pathWithDrawer(path, "tags"), source, startLine);
  }
  if (verb === "REMOVE_TAG") {
    if (path.valueRaw) fail("REMOVE_TAG não aceita valor extra", dummyToken(startLine, path.valueRaw));
    const tag = path.key.replace(/^-/, "");
    return namedCompact(path, `tags.-${tag}`, source, startLine);
  }
  if (verb === "SET_STAT") {
    return namedCompact(path, `${pathWithDrawer(path, "stats")}=${requireValue(path, verb, startLine)}`, source, startLine);
  }
  if (verb === "ADD_STAT") {
    const value = requireValue(path, verb, startLine);
    const glued = value.startsWith("+") || value.startsWith("-") ? value : `+${value}`;
    return namedCompact(path, `${pathWithDrawer(path, "stats")}${glued}`, source, startLine);
  }
  if (verb === "MUL_STAT") {
    return namedCompact(path, `${pathWithDrawer(path, "stats")}*${requireValue(path, verb, startLine)}`, source, startLine);
  }
  if (verb === "SET_FLAG") {
    return namedCompact(path, `${pathWithDrawer(path, "flags")}=${requireValue(path, verb, startLine)}`, source, startLine);
  }
  if (verb === "SET_ENUM") {
    return namedCompact(path, `${pathWithDrawer(path, "enums")}=${requireValue(path, verb, startLine)}`, source, startLine);
  }
  if (verb === "SET_LINK") {
    const value = requireValue(path, verb, startLine);
    const drawer = path.drawer === "hardLinks" || path.drawer === "softLinks" || path.drawer === "links" ? path.drawer : undefined;
    return namedCompact(path, `${pathWithDrawer({ ...path, drawer }, drawer)}=${value}`, source, startLine);
  }
  if (verb === "SET_PHRASE") {
    return {
      target: path.target,
      fields: [{ kind: "setPhrase", key: path.key, value: stripNarrativeQuotes(path.valueRaw) }],
      source: source.trim(),
      line: startLine,
    };
  }
  if (verb === "UNLINK" || verb === "CLEAR_LINK") {
    if (path.valueRaw) fail(`${verb} não aceita valor extra`, dummyToken(startLine, path.valueRaw));
    return {
      target: path.target,
      fields: [{ kind: "clearLink", key: path.key }],
      source: source.trim(),
      line: startLine,
    };
  }
  if (verb === "SET_FUSE") {
    const fuse = parseFuseValue(requireValue(path, verb, startLine), path.key, startLine);
    return {
      target: path.target,
      fields: [{ kind: "setFuse", key: path.key, remaining: fuse.remaining, targetId: fuse.targetId }],
      source: source.trim(),
      line: startLine,
    };
  }
  fail(`verbo ${verb} desconhecido`, dummyToken(startLine, verb));
}

export function parseDoLine(source: string, options: { file?: string; startLine?: number } = {}): DoLine {
  const startLine = options.startLine ?? 1;
  const parsed = parseVerbRest(source);
  if (parsed && WORLD_VERBS.has(parsed.verb)) {
    if (parsed.verb === "DESTROY") return { change: parseDestroyLine(parsed.rest, source, startLine) };
    if (parsed.verb === "SPAWN") return { change: parseSpawnLine(parsed.rest, source, startLine) };
    return { change: parseCreateLine(parsed.rest, source, startLine) };
  }
  if (parsed && LIST_VERBS.has(parsed.verb)) {
    return { change: parseListOpLine(parsed.verb, parsed.rest, source, startLine) };
  }
  if (parsed && NAMED_DO_VERBS.has(parsed.verb)) {
    return { change: parseNamedDoLine(parsed.verb, parsed.rest, source, startLine) };
  }
  if (parsed && EFFECT_VERBS.has(parsed.verb)) {
    const args = parsed.rest
      .split(".")
      .map((p) => p.trim())
      .filter(Boolean);
    if (!args.length && !EFFECT_ALLOW_EMPTY.has(parsed.verb)) {
      throw new ParseError(
        makeIssue("E000", "error", { detail: `${parsed.verb} requer argumentos` }, { file: options.file ?? "rules", line: startLine, column: 1 }),
      );
    }
    return { effect: { verb: parsed.verb.toLowerCase(), args, source: source.trim(), line: startLine } };
  }
  return { change: parseChangeLine(source, options) };
}

function parseSemanticKinds(raw: string): SemanticKind[] {
  const out: SemanticKind[] = [];
  for (const part of raw.split(/[,\s]+/)) {
    const key = part.trim().toLowerCase();
    if (!key) continue;
    if (SEMANTIC_SET.has(key)) out.push(key as SemanticKind);
  }
  return out;
}

function slugRuleId(raw: string): string {
  return raw.trim().replace(/\s+/g, "_") || "";
}

function stripNarrativeQuotes(text: string): string {
  const t = text.trim();
  if ((t.startsWith('"') && t.endsWith('"') && t.length >= 2) || (t.startsWith("'") && t.endsWith("'") && t.length >= 2)) {
    return t.slice(1, -1);
  }
  return t;
}

function parseNarrativeAssignment(rest: string): { voice: string | null; text: string } {
  const trimmed = rest.trim();
  if (!trimmed) return { voice: null, text: "" };
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return { voice: null, text: stripNarrativeQuotes(trimmed) };
  }
  const m = trimmed.match(/^([\p{L}_][\p{L}\p{N}_]*)\s*:\s*(.*)$/u);
  if (m) return { voice: m[1]!.toLowerCase(), text: stripNarrativeQuotes(m[2] ?? "") };
  return { voice: null, text: stripNarrativeQuotes(trimmed) };
}

function parseFuncaoName(raw: string): string {
  return raw.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
}

export function parseRuleBlock(text: string, options: { file?: string; startLine?: number; id?: string } = {}): Omit<Rule, "index" | "source"> & { id: string } {
  const file = options.file ?? "rules";
  const startLine = options.startLine ?? 1;
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  let id: string | null = options.id ?? null;
  let trigger: MatcherAST | null = null;
  const conditions: MatcherAST[] = [];
  const changes: ChangeAST[] = [];
  const effects: EffectOp[] = [];
  let semantics: SemanticKind[] = [];
  let funcao = "";
  let narrative = "";
  const voices: Record<string, string> = {};
  let voiceKey: string | null = null;
  let section: "idle" | "on" | "if" | "do" | "narrative" | "semantic" | "function" = "idle";

  for (let i = 0; i < lines.length; i++) {
    const lineNo = startLine + i;
    const { code } = stripLineComment(lines[i] ?? "");
    const trimmed = code.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) {
      const rest = trimmed.slice(1).trim();
      if (rest && !id) id = slugRuleId(rest);
      continue;
    }
    const kw = trimmed.match(KW_RE);
    if (kw) {
      const keyword = kw[1]!.toUpperCase();
      const rest = trimmed.slice(trimmed.indexOf(":") + 1);
      if (keyword === "ON") {
        section = "on";
        trigger = parseMatcher(rest, { file, startLine: lineNo });
      } else if (keyword === "IF") {
        section = "if";
        conditions.push(parseMatcher(rest, { file, startLine: lineNo }));
      } else if (keyword === "DO") {
        section = "do";
        if (rest.trim()) {
          const parsed = parseDoLine(rest, { file, startLine: lineNo });
          if (parsed.change) changes.push(parsed.change);
          if (parsed.effect) effects.push(parsed.effect);
        }
      } else if (keyword === "SEMANTIC" || keyword === "SEMANTICS") {
        section = "semantic";
        semantics = parseSemanticKinds(rest);
      } else if (keyword === "FUNCAO" || keyword === "FUNÇÃO" || keyword === "FUNCTION") {
        section = "function";
        funcao = parseFuncaoName(rest);
      } else {
        section = "narrative";
        const assigned = parseNarrativeAssignment(rest);
        voiceKey = assigned.voice;
        if (assigned.voice) voices[assigned.voice] = assigned.text;
        else narrative = assigned.text;
      }
      continue;
    }
    if (section === "do") {
      const parsed = parseDoLine(trimmed, { file, startLine: lineNo });
      if (parsed.change) changes.push(parsed.change);
      if (parsed.effect) effects.push(parsed.effect);
    } else if (section === "narrative") {
      const extra = stripNarrativeQuotes(trimmed);
      if (voiceKey) voices[voiceKey] = voices[voiceKey] ? `${voices[voiceKey]}\n${extra}` : extra;
      else narrative += (narrative ? "\n" : "") + extra;
    } else if (section === "semantic") semantics = [...semantics, ...parseSemanticKinds(trimmed)];
    else if (section === "function") {
      if (!funcao) funcao = parseFuncaoName(trimmed);
    } else fail(`linha inesperada: ${trimmed}`, { kind: "IDENT", value: trimmed, line: lineNo, column: 1, index: 0 });
  }
  if (!trigger) throw new ParseError(makeIssue("E002", "error", { id: id ?? "?" }, { file, line: startLine, column: 1 }));
  return { id: id ?? `regra_${startLine}`, trigger, conditions, changes, effects, semantics, funcao, narrative, voices, startLine };
}

type RuleFileBlock = { startLine: number; lines: string[]; id: string | null };

function splitRuleFile(text: string): RuleFileBlock[] {
  const rawLines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const blocks: RuleFileBlock[] = [];
  let current: RuleFileBlock | null = null;
  const flush = () => {
    if (current && current.lines.some((l) => l.trim().length > 0)) blocks.push(current);
    current = null;
  };
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i] ?? "";
    const { code } = stripLineComment(line);
    const trimmed = code.trim();
    if (!trimmed) {
      flush();
      continue;
    }
    if (/^#\s*---\s*\/?lume-caderno\s*---\s*$/.test(trimmed)) {
      flush();
      continue;
    }
    const isHeader = trimmed.startsWith("#");
    if (isHeader && current) flush();
    if (!current) current = { startLine: i + 1, lines: [line], id: isHeader ? slugRuleId(trimmed.slice(1)) || null : null };
    else current.lines.push(line);
  }
  flush();
  return blocks;
}

export function compileRuleFile(
  source: string,
  world?: WorldModel,
  taxonomy?: CompiledTaxonomy | null,
): { rules: Rule[]; errors: Issue[]; warnings: Issue[] } {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const rules: Rule[] = [];
  const blocks = splitRuleFile(source);
  let index = 0;
  for (const block of blocks) {
    const text = block.lines.join("\n");
    if (!/^(ON|IF|DO|NARRATIVA|NARRATIVE|SEMANTIC|SEMANTICS|FUNCAO|FUNÇÃO|FUNCTION)\s*:/im.test(text) && !/#\s*\S+/.test(text)) continue;
    if (/^PADRAO\b/im.test(text) && !/^ON\s*:/im.test(text)) continue;
    try {
      const parsed = parseRuleBlock(text, { startLine: block.startLine, id: block.id ?? undefined });
      rules.push({ ...parsed, index, source: text, startLine: block.startLine });
      index += 1;
    } catch (err) {
      if (err instanceof ParseError) errors.push(...err.issues);
      else errors.push(makeIssue("E000", "error", { detail: err instanceof Error ? err.message : String(err) }, { file: "rules", line: block.startLine, column: 1 }));
    }
  }
  if (world) {
    for (const rule of rules) {
      const any = [...world.keys()].some((id) => matchesEntity(rule.trigger, id, world, id, taxonomy));
      if (!any) warnings.push(makeIssue("W001", "warning", { id: rule.id }, { file: "rules", line: rule.startLine, column: 1 }));
    }
  }
  return { rules, errors, warnings };
}

function resolveSpawn(entity: Entity, triggerId: string, world: WorldModel): Entity {
  const next = instantiateFromTemplate(world, cloneEntity(entity));
  for (const [key, value] of Object.entries(next.softLinks)) {
    if (value === "$" || value === "trigger") next.softLinks[key] = triggerId;
  }
  for (const [key, value] of Object.entries(next.hardLinks)) {
    if (value === "$" || value === "trigger") next.hardLinks[key] = triggerId;
  }
  for (const [key, value] of Object.entries(next.links)) {
    if (value === "$" || value === "trigger") next.links[key] = triggerId;
  }
  return syncLinks(next);
}

function resolveChangeTarget(world: WorldModel, target: ChangeTarget, triggerId: string): string | null {
  if (target.kind === "trigger") return triggerId;
  if (target.kind === "id") {
    return findEntityByQuad(world, target.id)?.id ?? target.id;
  }
  const from = target.entityId === "$" ? triggerId : target.entityId;
  const fromId = findEntityByQuad(world, from)?.id;
  if (!fromId) return null;
  return getLink(world, fromId, target.key);
}

function applyListOp(entity: Entity, list: string, op: "PUSH" | "POP" | "REMOVE" | "CLEAR" | "ADD_UNIQUE", value?: string | number) {
  const current = entity.lists[list] ? [...entity.lists[list]!] : [];
  if (op === "PUSH" && value !== undefined) current.push(value);
  else if (op === "POP") current.pop();
  else if (op === "REMOVE" && value !== undefined) {
    const idx = current.findIndex((item) => item === value);
    if (idx >= 0) current.splice(idx, 1);
  } else if (op === "CLEAR") current.length = 0;
  else if (op === "ADD_UNIQUE" && value !== undefined && !current.includes(value)) current.push(value);
  entity.lists[list] = current;
}

export function applyChanges(world: WorldModel, changes: readonly ChangeAST[], triggerId: string): WorldModel {
  const next = cloneWorldModel(world);
  for (const change of changes) {
    const id = resolveChangeTarget(next, change.target, triggerId);
    if (!id) continue;
    const destroy = change.fields.some((field) => field.kind === "destroyEntity");
    if (destroy) {
      destroyEntityInWorld(next, id);
      continue;
    }
    const spawn = change.fields.find((field) => field.kind === "createEntity");
    if (spawn && spawn.kind === "createEntity" && !next.has(id)) {
      next.set(id, resolveSpawn(spawn.entity, triggerId, next));
    }
    const entity = next.get(id);
    if (!entity) continue;
    for (const field of change.fields) {
      if (field.kind === "createEntity" || field.kind === "destroyEntity") continue;
      if (field.kind === "addTag") entity.tags.add(field.tag);
      else if (field.kind === "removeTag") entity.tags.delete(field.tag);
      else if (field.kind === "setStat") writeStat(entity, field.key, field.value);
      else if (field.kind === "deltaStat") writeStat(entity, field.key, readStat(entity, field.key) + field.delta);
      else if (field.kind === "deltaStatFrom") {
        const fromId = resolveChangeTarget(next, field.from, triggerId);
        const fromEntity = fromId ? next.get(fromId) : undefined;
        const amount = fromEntity ? readStat(fromEntity, field.stat) : 0;
        writeStat(entity, field.key, readStat(entity, field.key) + field.sign * amount);
      }
      else if (field.kind === "mulStat") writeStat(entity, field.key, readStat(entity, field.key) * field.factor);
      else if (field.kind === "setFlag") entity.flags[field.key] = field.value;
      else if (field.kind === "setEnum") entity.enums[field.key] = field.value;
      else if (field.kind === "setPhrase") entity.phrases[field.key] = field.value;
      else if (field.kind === "clearLink") clearLink(entity, field.key);
      else if (field.kind === "setFuse") entity.fuses[field.key] = { remaining: field.remaining, targetId: field.targetId || field.key };
      else if (field.kind === "listOp") applyListOp(entity, field.list, field.op, field.value);
      else if (field.kind === "setLink") {
        const dest = resolveChangeTarget(next, field.value, triggerId);
        if (dest == null) continue;
        if (field.linkKind === "hard") assignLink(entity, field.key, dest, "hard");
        else if (field.linkKind === "soft") assignLink(entity, field.key, dest, "soft");
        else if (Object.prototype.hasOwnProperty.call(entity.enums, field.key)) entity.enums[field.key] = dest;
        else if (Object.prototype.hasOwnProperty.call(entity.phrases, field.key)) entity.phrases[field.key] = dest;
        else assignLink(entity, field.key, dest);
      }
    }
  }
  return next;
}

export function ruleSpecificity(rule: Rule, taxonomy?: CompiledTaxonomy | null): number {
  return specificityOf(rule.trigger, taxonomy) + rule.conditions.reduce((s, c) => s + specificityOf(c, taxonomy), 0);
}

export function findMatchingRule(
  triggerId: string,
  rules: readonly Rule[],
  world: WorldModel,
  taxonomy?: CompiledTaxonomy | null,
): Rule | null {
  let best: Rule | null = null;
  let bestScore = -1;
  let bestIndex = Infinity;
  for (const rule of rules) {
    if (!matchesEntity(rule.trigger, triggerId, world, triggerId, taxonomy)) continue;
    if (!rule.conditions.every((c) => queryHasResults(c, world, triggerId, taxonomy))) continue;
    const score = ruleSpecificity(rule, taxonomy);
    if (score > bestScore || (score === bestScore && rule.index < bestIndex)) {
      best = rule;
      bestScore = score;
      bestIndex = rule.index;
    }
  }
  return best;
}

export function findMatchingRules(
  triggerId: string,
  rules: readonly Rule[],
  world: WorldModel,
  taxonomy?: CompiledTaxonomy | null,
): RuleMatch[] {
  const out: RuleMatch[] = [];
  for (const rule of rules) {
    if (!matchesEntity(rule.trigger, triggerId, world, triggerId, taxonomy)) continue;
    if (!rule.conditions.every((c) => queryHasResults(c, world, triggerId, taxonomy))) continue;
    out.push({ rule, score: ruleSpecificity(rule, taxonomy) });
  }
  return out.sort((a, b) => b.score - a.score || a.rule.index - b.rule.index);
}
