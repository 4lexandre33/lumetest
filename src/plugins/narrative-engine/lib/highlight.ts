import { stripLineComment, tokenize } from "./lexer.ts";
import type { Token } from "./types.ts";

export type SynClass =
  | "syn-id"
  | "syn-tag"
  | "syn-stat"
  | "syn-link"
  | "syn-num"
  | "syn-op"
  | "syn-comment"
  | "syn-plain"
  | "syn-kw"
  | "syn-brace"
  | "syn-err";
export type HighlightSpan = { text: string; cls: SynClass };
export type SourceKind = "entities" | "rules" | "taxonomy" | "notebook";

const RULE_KW_RE = /^(ON|IF|DO|NARRATIVE|NARRATIVA|SEMANTIC|SEMANTICS|FUNCAO|FUNÇÃO|FUNCTION|PADRAO)\s*:?/i;
const SECTION_RE = /^\s*(id|slug|shortCode|templateId|name|description|tags|stats|flags|enums|phrases|hardLinks|softLinks|links|lists|fuses|struct|voice|aliases)\s*:/i;
const TAXONOMY_TOKEN_RE = /[\p{L}_][\p{L}\p{N}\p{M}_]*|→|->/gu;

const NAMED_DO_KWS = new Set([
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

function foldKw(raw: string): string {
  return raw.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
}

function isTemKw(raw: string): boolean {
  const f = foldKw(raw);
  return f === "TEM" || f === "NAO_TEM" || f === "NAOTEM";
}

function tokenClass(tokens: Token[], index: number, isFirstId: boolean): SynClass {
  const t = tokens[index]!;
  switch (t.kind) {
    case "IDENT": {
      if (isTemKw(t.value)) return "syn-kw";
      if (NAMED_DO_KWS.has(foldKw(t.value))) return "syn-kw";
      const prev = tokens[index - 1];
      if (foldKw(t.value) === "LINK" && prev?.kind === "LPAREN") return "syn-kw";
      if (isFirstId && index === 0) return "syn-id";
      const next = tokens[index + 1];
      if (next && (next.kind === "EQ" || next.kind === "GT" || next.kind === "LT" || next.kind === "GTE" || next.kind === "LTE" || next.kind === "PLUS" || next.kind === "MINUS" || next.kind === "STAR")) {
        const after = tokens[index + 2];
        return after?.kind === "NUMBER" ? "syn-stat" : "syn-link";
      }
      return "syn-tag";
    }
    case "NUMBER":
      return "syn-num";
    case "STAR":
    case "BANG":
    case "DOLLAR":
      return "syn-kw";
    case "DOT":
    case "EQ":
    case "GT":
    case "LT":
    case "GTE":
    case "LTE":
    case "PLUS":
    case "MINUS":
    case "SLASH":
    case "LPAREN":
    case "RPAREN":
    case "COLON":
    case "COMMA":
    case "SEMI":
    case "LBRACE":
    case "RBRACE":
      return "syn-op";
    default:
      return "syn-plain";
  }
}

function spansFromLine(line: string, kind: SourceKind): HighlightSpan[] {
  if ((kind === "rules" || kind === "entities") && line.includes("//") && !line.includes("/*")) {
    const idx = line.indexOf("//");
    return [...spansFromLine(line.slice(0, idx), kind).filter((s) => s.text), { text: line.slice(idx), cls: "syn-err" }];
  }
  const { code } = stripLineComment(line);
  const spans: HighlightSpan[] = [];
  const kw = kind === "rules" ? code.match(RULE_KW_RE) : code.match(SECTION_RE);
  let rest = code;
  if (kw) {
    spans.push({ text: kw[0]!, cls: "syn-kw" });
    rest = code.slice(kw[0]!.length);
  }
  try {
    const tokens = tokenize(rest, { startColumn: 1 }).filter((t) => t.kind !== "EOF");
    let cursor = 0;
    tokens.forEach((t, i) => {
      const rel = Math.max(0, t.column - 1);
      if (rel > cursor) spans.push({ text: rest.slice(cursor, rel), cls: "syn-plain" });
      spans.push({ text: t.value, cls: tokenClass(tokens, i, !kw) });
      cursor = rel + t.value.length;
    });
    if (cursor < rest.length) spans.push({ text: rest.slice(cursor), cls: "syn-plain" });
  } catch {
    spans.push({ text: rest, cls: "syn-plain" });
  }
  const comment = stripLineComment(line).comment;
  if (comment && line.includes("/*")) {
    const idx = line.indexOf("/*");
    if (idx >= 0) return [...spansFromLine(line.slice(0, idx), kind).filter((s) => s.text), { text: line.slice(idx), cls: "syn-comment" }];
  }
  if (spans.length === 0) spans.push({ text: line || " ", cls: "syn-plain" });
  return spans;
}

function highlightTaxonomyLine(line: string): HighlightSpan[] {
  if (/^\s*\/\*/.test(line)) return [{ text: line || " ", cls: "syn-comment" }];
  if (/^\s*#/.test(line)) return [{ text: line || " ", cls: "syn-err" }];
  const { code, comment } = stripLineComment(line);
  const spans: HighlightSpan[] = [];
  TAXONOMY_TOKEN_RE.lastIndex = 0;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = TAXONOMY_TOKEN_RE.exec(code))) {
    if (m.index > last) spans.push({ text: code.slice(last, m.index), cls: "syn-plain" });
    const tok = m[0]!;
    spans.push({ text: tok, cls: tok === "→" || tok === "->" ? "syn-op" : "syn-tag" });
    last = m.index + tok.length;
  }
  if (last < code.length) spans.push({ text: code.slice(last), cls: "syn-plain" });
  if (comment !== "" || line.includes("/*")) {
    const idx = line.indexOf("/*");
    if (idx >= 0) spans.push({ text: line.slice(idx), cls: "syn-comment" });
  }
  if (spans.length === 0) spans.push({ text: line || " ", cls: "syn-plain" });
  return spans;
}

function highlightNotebookLine(line: string): HighlightSpan[] {
  const t = line.trim();
  if (/^\s*\/\*/.test(line)) {
    return [{ text: line || " ", cls: "syn-comment" }];
  }
  if (/^#\s*---/.test(t)) return [{ text: line || " ", cls: "syn-comment" }];
  if (/^#[0-9A-Fa-f]{4}\s*$/.test(t)) return [{ text: line || " ", cls: "syn-id" }];
  if (/^#[\p{Ll}_][\p{L}\p{N}_]*\s*$/u.test(t)) return [{ text: line || " ", cls: "syn-tag" }];
  if (/^\s*#/.test(line) && !/^#{2,3}\s/.test(t)) {
    return [{ text: line || " ", cls: "syn-err" }];
  }
  if (line.includes("/*")) {
    const idx = line.indexOf("/*");
    return [...highlightNotebookLine(line.slice(0, idx)).filter((s) => s.text), { text: line.slice(idx), cls: "syn-comment" }];
  }
  if (line.includes("//")) {
    const idx = line.indexOf("//");
    return [...highlightNotebookLine(line.slice(0, idx)).filter((s) => s.text), { text: line.slice(idx), cls: "syn-err" }];
  }
  if (/^\s*---\s*$/.test(line)) return [{ text: line || " ", cls: "syn-op" }];
  if (/^\s*#{2,3}\s+/.test(line)) {
    const m = line.match(/^(\s*#{2,3}\s+)(.*)$/);
    if (m) return [{ text: m[1]!, cls: "syn-op" }, { text: m[2] || " ", cls: "syn-id" }];
  }
  const phrases = [
    "entenda",
    "a cada turno",
    "veja também",
    "também chamada",
    "significância",
    "significancia",
    "é uma",
    "é um",
    "histórias",
    "historias",
    "caderno",
    "autora",
    "quando",
    "narre",
    "cause",
    "marque",
    "padrão",
    "padrao",
    "canais",
    "activa",
    "ativa",
    "contém",
    "contem",
    "carrega",
    "herda",
    "grupo",
    "trait",
    "está",
    "esta",
    "não tem",
    "nao tem",
    "não_tem",
    "nao_tem",
    "tem",
    "peso",
    "data",
    "leva",
    "live",
    "then",
    "wait",
    "se",
  ];
  const spans: HighlightSpan[] = [];
  let i = 0;
  const lower = line.toLowerCase();
  while (i < line.length) {
    let hit: { len: number; cls: SynClass } | null = null;
    if (/\d/.test(line[i]!)) {
      let j = i;
      while (j < line.length && /[\d.]/.test(line[j]!)) j += 1;
      hit = { len: j - i, cls: "syn-num" };
    } else {
      for (const phrase of phrases) {
        if (lower.startsWith(phrase, i) && !/[\p{L}\p{N}_]/u.test(lower[i + phrase.length] ?? "")) {
          hit = { len: phrase.length, cls: "syn-kw" };
          break;
        }
      }
    }
    if (hit) {
      spans.push({ text: line.slice(i, i + hit.len), cls: hit.cls });
      i += hit.len;
      continue;
    }
    let j = i + 1;
    while (j < line.length) {
      const slice = lower.slice(j);
      const kw = phrases.some((p) => slice.startsWith(p) && !/[\p{L}\p{N}_]/u.test(slice[p.length] ?? ""));
      if (kw || /\d/.test(line[j]!)) break;
      j += 1;
    }
    spans.push({ text: line.slice(i, j), cls: "syn-plain" });
    i = j;
  }
  if (!spans.length) spans.push({ text: line || " ", cls: "syn-plain" });
  return spans;
}

export function highlightSource(source: string, kind: SourceKind): HighlightSpan[][] {
  return source.split("\n").map((line) => {
    if (kind === "notebook") {
      const spans = highlightNotebookLine(line);
      return spans.length ? spans : [{ text: " ", cls: "syn-plain" as const }];
    }
    if (kind === "taxonomy") {
      const spans = highlightTaxonomyLine(line);
      return spans.length ? spans : [{ text: " ", cls: "syn-plain" as const }];
    }
    if (kind === "entities" && /^\s*start\s*\(\s*\)\s*;?\s*$/i.test(line)) {
      return [{ text: line || " ", cls: "syn-kw" as const }];
    }
    if (line.trim().startsWith("#") && kind === "rules") return [{ text: line || " ", cls: "syn-comment" as const }];
    const brace = line.indexOf("{");
    if (kind === "rules" && brace >= 0) {
      const before = line.slice(0, brace);
      return [...spansFromLine(before, kind), { text: line.slice(brace), cls: "syn-brace" as const }];
    }
    const spans = spansFromLine(line, kind);
    return spans.length ? spans : [{ text: " ", cls: "syn-plain" as const }];
  });
}

export function identAtColumn(line: string, column: number): string | null {
  const { code } = stripLineComment(line);
  try {
    for (const t of tokenize(code, { startColumn: 1 })) {
      if ((t.kind === "IDENT" || t.kind === "DOLLAR") && column >= t.column && column <= t.column + t.value.length) return t.value;
    }
  } catch {
    return null;
  }
  return null;
}
