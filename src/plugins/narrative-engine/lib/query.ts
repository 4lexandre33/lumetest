import { makeIssue, ParseError, tokenize, TokenCursor } from "./lexer.ts";
import { depthOf, explainTagMatch, matchesTag, type CompiledTaxonomy, type TagMatchMode } from "./taxonomy.ts";
import type { Comparator, Entity, MatcherAST, MatcherBranch, MatcherClause, MatcherPossess, MatcherSelector, MatcherValue, PathDrawer, Token, WorldModel } from "./types.ts";
import { isPathDrawer, matcherBranches } from "./types.ts";
import { findEntityByQuad, getLink, readStat, withInheritedDrawers } from "./world-model.ts";

function fail(detail: string, t: Token, file = "rules"): never {
  throw new ParseError(makeIssue("E000", "error", { detail }, { file, line: t.line, column: t.column }));
}

function parseValue(cur: TokenCursor, file: string): MatcherValue {
  if (cur.at("LPAREN")) {
    cur.consume();
    const kw = cur.expect("IDENT", file, "esperado 'link'");
    if (kw.value.toLowerCase() !== "link") fail("esperado 'link'", kw, file);
    const idTok = cur.at("DOLLAR") ? cur.consume() : cur.expect("IDENT", file, "esperado id");
    cur.expect("DOT", file, "esperado . depois do id no lookup");
    const keyTok = cur.expect("IDENT", file, "esperado chave do link");
    cur.expect("RPAREN", file, "esperado )");
    return { kind: "linkLookup", entityId: idTok.value, key: keyTok.value };
  }
  if (cur.at("NUMBER")) {
    const t = cur.consume();
    return { kind: "number", value: t.number ?? Number(t.value) };
  }
  if (cur.at("DOLLAR")) {
    cur.consume();
    return { kind: "trigger" };
  }
  const t = cur.expect("IDENT", file, "esperado valor");
  return { kind: "id", id: t.value };
}

function parseDrawerKey(cur: TokenCursor, file: string): { drawer?: PathDrawer; key: string; negated: boolean } {
  let negated = false;
  if (cur.at("BANG")) {
    cur.consume();
    negated = true;
  }
  const first = cur.expect("IDENT", file, "esperado tag/stat/link");
  if (isPathDrawer(first.value) && cur.at("DOT")) {
    cur.consume();
    if (cur.at("BANG")) {
      cur.consume();
      negated = true;
    }
    const keyTok = cur.expect("IDENT", file, "esperado chave da gaveta");
    return { drawer: first.value, key: keyTok.value, negated };
  }
  return { key: first.value, negated };
}

function parseClause(cur: TokenCursor, file: string): MatcherClause {
  const path = parseDrawerKey(cur, file);
  let op: Comparator | undefined;
  let value: MatcherValue | undefined;
  const p = cur.peek();
  if (p.kind === "EQ" || p.kind === "GT" || p.kind === "LT" || p.kind === "GTE" || p.kind === "LTE") {
    cur.consume();
    op = (p.kind === "EQ" ? "=" : p.value) as Comparator;
    value = parseValue(cur, file);
  }
  return { negated: path.negated, key: path.key, drawer: path.drawer, op, value };
}

function parseSelector(cur: TokenCursor, file: string): MatcherSelector {
  if (cur.at("STAR")) {
    cur.consume();
    return { kind: "any" };
  }
  if (cur.at("DOLLAR")) {
    cur.consume();
    return { kind: "trigger" };
  }
  const t = cur.expect("IDENT", file, "esperado seletor (*, $, id, #XXXX ou ()");
  return { kind: "id", id: t.value };
}

function cartesianClauses(left: MatcherClause[][], right: MatcherClause[][]): MatcherClause[][] {
  const out: MatcherClause[][] = [];
  for (const a of left) for (const b of right) out.push([...a, ...b]);
  return out;
}

function addClauses(branches: MatcherBranch[], groups: MatcherClause[][]): MatcherBranch[] {
  const out: MatcherBranch[] = [];
  for (const branch of branches) {
    for (const group of groups) {
      const next: MatcherBranch = { selector: branch.selector, clauses: [...branch.clauses, ...group] };
      if (branch.possess) next.possess = branch.possess;
      out.push(next);
    }
  }
  return out;
}

function parseClauseAtom(cur: TokenCursor, file: string): MatcherClause[][] {
  if (cur.at("LPAREN")) {
    cur.consume();
    const inner = parseClauseDnf(cur, file);
    cur.expect("RPAREN", file, "esperado )");
    return inner;
  }
  return [[parseClause(cur, file)]];
}

function parseClauseAndDnf(cur: TokenCursor, file: string): MatcherClause[][] {
  let dnf = parseClauseAtom(cur, file);
  while (cur.at("DOT")) {
    cur.consume();
    dnf = cartesianClauses(dnf, parseClauseAtom(cur, file));
  }
  return dnf;
}

function parseClauseDnf(cur: TokenCursor, file: string): MatcherClause[][] {
  let dnf = parseClauseAndDnf(cur, file);
  while (cur.at("SLASH")) {
    cur.consume();
    dnf = dnf.concat(parseClauseAndDnf(cur, file));
  }
  return dnf;
}

function foldKw(raw: string): string {
  return raw.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
}

function temOp(raw: string): "tem" | "nao_tem" | null {
  const f = foldKw(raw);
  if (f === "NAO_TEM" || f === "NAOTEM") return "nao_tem";
  if (f === "TEM") return "tem";
  return null;
}

function astFromBranches(branches: MatcherBranch[], source = ""): MatcherAST {
  const first = branches[0];
  if (!first) fail("matcher vazio", { kind: "IDENT", value: "", line: 1, column: 1, index: 0 });
  const ast: MatcherAST = { selector: first.selector, clauses: first.clauses, source };
  if (first.possess) ast.possess = first.possess;
  if (branches.length > 1) ast.branches = branches;
  return ast;
}

function tryParseLinkSelector(cur: TokenCursor): { entityId: string; key: string } | null {
  const mark = cur.mark();
  if (!cur.at("LPAREN")) return null;
  cur.consume();
  if (!cur.at("IDENT") || cur.peek().value.toLowerCase() !== "link") {
    cur.reset(mark);
    return null;
  }
  cur.consume();
  if (!(cur.at("DOLLAR") || cur.at("IDENT"))) {
    cur.reset(mark);
    return null;
  }
  const idTok = cur.consume();
  if (!cur.at("DOT")) {
    cur.reset(mark);
    return null;
  }
  cur.consume();
  if (!cur.at("IDENT")) {
    cur.reset(mark);
    return null;
  }
  const keyTok = cur.consume();
  if (!cur.at("RPAREN")) {
    cur.reset(mark);
    return null;
  }
  cur.consume();
  return { entityId: idTok.value, key: keyTok.value };
}

function parseSelectorAtom(cur: TokenCursor, file: string): MatcherBranch[] {
  const look = tryParseLinkSelector(cur);
  if (look) return [{ selector: { kind: "linkLookup", entityId: look.entityId, key: look.key }, clauses: [] }];
  if (cur.at("LPAREN")) {
    cur.consume();
    const inner = parseOr(cur, file);
    cur.expect("RPAREN", file, "esperado )");
    return inner;
  }
  return [{ selector: parseSelector(cur, file), clauses: [] }];
}

function parseSuffixes(cur: TokenCursor, file: string, branches: MatcherBranch[]): MatcherBranch[] {
  if (!cur.at("DOT")) return branches;
  cur.consume();
  return addClauses(branches, parseClauseAndDnf(cur, file));
}

function parsePossessed(cur: TokenCursor, file: string): MatcherBranch[] {
  return parseSuffixes(cur, file, parseSelectorAtom(cur, file));
}

function attachPossess(branches: MatcherBranch[], negated: boolean, item: MatcherAST): MatcherBranch[] {
  return branches.map((branch) => ({ ...branch, possess: { negated, item } }));
}

function parseAnd(cur: TokenCursor, file: string): MatcherBranch[] {
  if (cur.at("IDENT")) {
    const op = temOp(cur.peek().value);
    if (op) {
      cur.consume();
      const item = astFromBranches(parsePossessed(cur, file));
      return [{ selector: { kind: "trigger" }, clauses: [], possess: { negated: op === "nao_tem", item } }];
    }
  }
  let branches = parseSuffixes(cur, file, parseSelectorAtom(cur, file));
  if (cur.at("IDENT")) {
    const op = temOp(cur.peek().value);
    if (op) {
      cur.consume();
      branches = attachPossess(branches, op === "nao_tem", astFromBranches(parsePossessed(cur, file)));
    }
  }
  return branches;
}

function parseOr(cur: TokenCursor, file: string): MatcherBranch[] {
  const arms = [...parseAnd(cur, file)];
  while (cur.at("SLASH")) {
    cur.consume();
    arms.push(...parseAnd(cur, file));
  }
  return arms;
}

export function parseMatcher(source: string, options: { file?: string; startLine?: number } = {}): MatcherAST {
  const file = options.file ?? "rules";
  const tokens = tokenize(source.trim(), { file, startLine: options.startLine ?? 1 });
  const cur = new TokenCursor(tokens);
  const branches = parseOr(cur, file);
  if (!cur.at("EOF")) fail(`token extra '${cur.peek().value}'`, cur.peek(), file);
  const ast = astFromBranches(branches, source.trim());
  return ast;
}

function resolveValue(
  value: MatcherValue | undefined,
  world: WorldModel,
  triggerId: string,
  taxonomy?: CompiledTaxonomy | null,
): string | number | null {
  if (!value) return null;
  if (value.kind === "number") return value.value;
  if (value.kind === "id") return value.id;
  if (value.kind === "trigger") return triggerId;
  const id = value.entityId === "$" ? triggerId : value.entityId;
  return getLink(world, id, value.key, taxonomy);
}

function cmp(left: number, op: Comparator, right: number): boolean {
  if (op === "=") return left === right;
  if (op === ">") return left > right;
  if (op === "<") return left < right;
  if (op === ">=") return left >= right;
  if (op === "<=") return left <= right;
  return false;
}

function wantFlag(resolved: string | number | null): boolean {
  return resolved === 1 || String(resolved).toLowerCase() === "true";
}

function selectorMatches(
  selector: MatcherSelector,
  entityId: string,
  world: WorldModel,
  triggerId: string,
  taxonomy?: CompiledTaxonomy | null,
): boolean {
  const entity = world.get(entityId);
  if (!entity) return false;
  if (selector.kind === "any") return true;
  if (selector.kind === "trigger") return entity.id === triggerId;
  if (selector.kind === "linkLookup") {
    const from = selector.entityId === "$" ? triggerId : selector.entityId;
    const dest = getLink(world, from, selector.key, taxonomy);
    return dest != null && dest !== "" && findEntityByQuad(world, dest)?.id === entity.id;
  }
  const hit = findEntityByQuad(world, selector.id);
  return hit?.id === entity.id;
}

function isHeldBy(item: Entity, holder: Entity): boolean {
  const loc = item.links.current_location || item.softLinks.current_location || item.hardLinks.current_location;
  if (loc === holder.id) return true;
  const inside = item.links.in || item.softLinks.in || item.hardLinks.in;
  if (inside === holder.id) return true;
  for (const list of Object.values(holder.lists)) {
    if (list.some((entry) => entry === item.id || String(entry) === item.id)) return true;
  }
  return false;
}

function possessHolds(
  possess: MatcherPossess,
  holderId: string,
  world: WorldModel,
  triggerId: string,
  taxonomy?: CompiledTaxonomy | null,
  mode: TagMatchMode = "effective",
): boolean {
  const stored = world.get(holderId);
  if (!stored) return possess.negated;
  const holder = withInheritedDrawers(stored, world, taxonomy);
  let found = false;
  for (const [id, item] of world) {
    if (id === holderId) continue;
    const seen = withInheritedDrawers(item, world, taxonomy);
    if (!isHeldBy(seen, holder)) continue;
    if (matchesEntity(possess.item, id, world, triggerId, taxonomy, mode)) {
      found = true;
      break;
    }
  }
  return possess.negated ? !found : found;
}

function clauseHolds(
  c: MatcherClause,
  entityId: string,
  world: WorldModel,
  triggerId: string,
  taxonomy?: CompiledTaxonomy | null,
  mode: TagMatchMode = "effective",
): boolean {
  const stored = world.get(entityId);
  if (!stored) return false;
  const entity = withInheritedDrawers(stored, world, taxonomy);
  const drawer = c.drawer;
  if (!c.op) {
    if (!drawer || drawer === "tags") return matchesTag(entity, c.key, taxonomy, mode);
    if (drawer === "stats") return Object.prototype.hasOwnProperty.call(entity.stats, c.key);
    if (drawer === "flags") return entity.flags[c.key] === true;
    if (drawer === "enums") return Object.prototype.hasOwnProperty.call(entity.enums, c.key);
    if (drawer === "phrases") return Object.prototype.hasOwnProperty.call(entity.phrases, c.key);
    if (drawer === "hardLinks") return Boolean(entity.hardLinks[c.key]);
    if (drawer === "softLinks") return Boolean(entity.softLinks[c.key]);
    if (drawer === "links") return Boolean(entity.links[c.key]);
    if (drawer === "lists") return Object.prototype.hasOwnProperty.call(entity.lists, c.key);
    if (drawer === "fuses") return Object.prototype.hasOwnProperty.call(entity.fuses, c.key);
    if (drawer === "struct") return Object.prototype.hasOwnProperty.call(entity.struct, c.key);
    return false;
  }
  const resolved = resolveValue(c.value, world, triggerId, taxonomy);
  if (drawer === "stats" || (!drawer && Object.prototype.hasOwnProperty.call(entity.stats, c.key))) {
    return typeof resolved === "number" && cmp(readStat(entity, c.key), c.op, resolved);
  }
  if (drawer === "flags" || (!drawer && Object.prototype.hasOwnProperty.call(entity.flags, c.key))) {
    return c.op === "=" && entity.flags[c.key] === wantFlag(resolved);
  }
  if (drawer === "enums" || (!drawer && Object.prototype.hasOwnProperty.call(entity.enums, c.key))) {
    return c.op === "=" && entity.enums[c.key]?.current === String(resolved);
  }
  if (drawer === "phrases" || (!drawer && Object.prototype.hasOwnProperty.call(entity.phrases, c.key))) {
    return c.op === "=" && entity.phrases[c.key] === String(resolved);
  }
  if (drawer === "hardLinks") {
    return c.op === "=" && resolved !== null && entity.hardLinks[c.key] === String(resolved);
  }
  if (drawer === "softLinks") {
    return c.op === "=" && resolved !== null && entity.softLinks[c.key] === String(resolved);
  }
  if (drawer === "links" || (!drawer && Object.prototype.hasOwnProperty.call(entity.links, c.key))) {
    return c.op === "=" && resolved !== null && entity.links[c.key] === String(resolved);
  }
  if (drawer === "lists") {
    const list = entity.lists[c.key];
    if (!list) return false;
    const needle = resolved === null ? "" : resolved;
    return c.op === "=" && list.some((item) => item === needle || String(item) === String(needle));
  }
  if (drawer === "fuses") {
    const fuse = entity.fuses[c.key];
    if (!fuse) return false;
    if (typeof resolved === "number") return cmp(fuse.remaining, c.op, resolved);
    return c.op === "=" && fuse.targetId === String(resolved);
  }
  if (drawer === "struct") {
    return c.op === "=" && String(entity.struct[c.key] ?? "") === String(resolved);
  }
  if (drawer === "tags") return c.op === "=" && matchesTag(entity, c.key, taxonomy, mode) === wantFlag(resolved);
  return false;
}

function branchHolds(
  branch: MatcherBranch,
  entityId: string,
  world: WorldModel,
  triggerId: string,
  taxonomy?: CompiledTaxonomy | null,
  mode: TagMatchMode = "effective",
): boolean {
  if (!selectorMatches(branch.selector, entityId, world, triggerId, taxonomy)) return false;
  for (const c of branch.clauses) {
    const inner = clauseHolds(c, entityId, world, triggerId, taxonomy, mode);
    if (c.negated ? inner : !inner) return false;
  }
  if (branch.possess && !possessHolds(branch.possess, entityId, world, triggerId, taxonomy, mode)) return false;
  return true;
}

export function matchesEntity(
  ast: MatcherAST,
  entityId: string,
  world: WorldModel,
  triggerId: string,
  taxonomy?: CompiledTaxonomy | null,
  mode: TagMatchMode = "effective",
): boolean {
  const entity = world.get(entityId);
  if (!entity) return false;
  return matcherBranches(ast).some((branch) => branchHolds(branch, entityId, world, triggerId, taxonomy, mode));
}

export type ClauseExplain = {
  source: string;
  matched: boolean;
  kind: "selector" | "tag" | "stat" | "link";
  detail: string;
  path?: string[];
};

export type MatcherExplain = {
  matched: boolean;
  clauses: ClauseExplain[];
};

function clauseSource(c: MatcherClause): string {
  const bang = c.negated ? "!" : "";
  const prefix = c.drawer ? `${c.drawer}.` : "";
  if (!c.op) return bang + prefix + c.key;
  const val =
    c.value?.kind === "number"
      ? c.value.value
      : c.value?.kind === "id"
        ? c.value.id
        : c.value?.kind === "trigger"
          ? "$"
          : "";
  return `${bang}${prefix}${c.key}${c.op}${val}`;
}

export function explainMatcher(
  ast: MatcherAST,
  entityId: string,
  world: WorldModel,
  triggerId: string,
  taxonomy?: CompiledTaxonomy | null,
  mode: TagMatchMode = "effective",
): MatcherExplain {
  const stored = world.get(entityId);
  const clauses: ClauseExplain[] = [];
  if (!stored) {
    return { matched: false, clauses: [{ source: ast.source, matched: false, kind: "selector", detail: `${entityId} não existe` }] };
  }
  const entity = withInheritedDrawers(stored, world, taxonomy);
  const branches = matcherBranches(ast);
  const chosen =
    branches.find((branch) => branchHolds(branch, entityId, world, triggerId, taxonomy, mode)) ?? branches[0]!;
  const leaf: MatcherAST = { selector: chosen.selector, clauses: chosen.clauses, source: ast.source, possess: chosen.possess };
  if (leaf.selector.kind === "id") {
    const hit = selectorMatches(leaf.selector, entityId, world, triggerId, taxonomy);
    clauses.push({
      source: leaf.selector.id,
      matched: hit,
      kind: "selector",
      detail: hit ? `id ${entity.id}` : `${entity.id} não é ${leaf.selector.id}`,
    });
  } else if (leaf.selector.kind === "trigger") {
    clauses.push({
      source: "$",
      matched: entity.id === triggerId,
      kind: "selector",
      detail: entity.id === triggerId ? "é o gatilho" : "não é o gatilho",
    });
  } else if (leaf.selector.kind === "linkLookup") {
    const hit = selectorMatches(leaf.selector, entityId, world, triggerId, taxonomy);
    const from = leaf.selector.entityId;
    clauses.push({
      source: `(link ${from}.${leaf.selector.key})`,
      matched: hit,
      kind: "link",
      detail: hit ? `é o alvo de ${from}.${leaf.selector.key}` : `não é o alvo de ${from}.${leaf.selector.key}`,
    });
  } else {
    clauses.push({ source: "*", matched: true, kind: "selector", detail: "qualquer entidade" });
  }
  for (const c of leaf.clauses) {
    if (!c.op && (!c.drawer || c.drawer === "tags")) {
      const why = explainTagMatch(entity, c.key, taxonomy);
      const inner = mode === "direct" ? why.direct : why.matched;
      const matched = c.negated ? !inner : inner;
      clauses.push({
        source: clauseSource(c),
        matched,
        kind: "tag",
        detail: c.negated ? (inner ? `tem ${c.key}, negado` : `não tem ${c.key}`) : why.reason,
        path: why.path.length > 1 ? why.path : undefined,
      });
      continue;
    }
    const inner = clauseHolds(c, entityId, world, triggerId, taxonomy, mode);
    let kind: ClauseExplain["kind"] = c.drawer === "stats" || (!c.drawer && c.key in entity.stats) ? "stat" : c.drawer === "tags" ? "tag" : "link";
    let detail = `${clauseSource(c)} ${inner ? "casa" : "não casa"}`;
    if ((c.drawer === "stats" || (!c.drawer && Object.prototype.hasOwnProperty.call(entity.stats, c.key))) && c.op) {
      kind = "stat";
      detail = `${c.key}=${readStat(entity, c.key)} ${inner ? "casa" : "não casa"} ${c.op}${resolveValue(c.value, world, triggerId, taxonomy)}`;
    }
    clauses.push({ source: clauseSource(c), matched: c.negated ? !inner : inner, kind, detail });
  }
  if (leaf.possess) {
    const held = possessHolds(leaf.possess, entityId, world, triggerId, taxonomy, mode);
    clauses.push({
      source: leaf.possess.negated ? "NAO_TEM" : "TEM",
      matched: held,
      kind: "link",
      detail: held ? (leaf.possess.negated ? "não tem" : "tem") : leaf.possess.negated ? "ainda tem" : "não tem",
    });
  }
  return { matched: matchesEntity(ast, entityId, world, triggerId, taxonomy, mode), clauses };
}

export function query(
  matcher: string | MatcherAST,
  world: WorldModel,
  triggerId = "",
  taxonomy?: CompiledTaxonomy | null,
  mode: TagMatchMode = "effective",
): [string, ...unknown[]][] {
  const ast = typeof matcher === "string" ? parseMatcher(matcher) : matcher;
  const out: [string][] = [];
  for (const id of world.keys()) if (matchesEntity(ast, id, world, triggerId, taxonomy, mode)) out.push([id]);
  return out;
}

export function queryHasResults(
  matcher: string | MatcherAST,
  world: WorldModel,
  triggerId = "",
  taxonomy?: CompiledTaxonomy | null,
  mode: TagMatchMode = "effective",
): boolean {
  return query(matcher, world, triggerId, taxonomy, mode).length > 0;
}

export function matcherHasResults(
  ast: MatcherAST,
  world: WorldModel,
  triggerId = "",
  taxonomy?: CompiledTaxonomy | null,
  mode: TagMatchMode = "effective",
): boolean {
  return queryHasResults(ast, world, triggerId, taxonomy, mode);
}

function branchSpecificity(branch: MatcherBranch, taxonomy?: CompiledTaxonomy | null): number {
  let score = branch.selector.kind === "id" || branch.selector.kind === "linkLookup" ? 8 : 0;
  for (const c of branch.clauses) {
    if (!c.op) score += 1 + depthOf(c.key, taxonomy);
    else score += 1;
    if (c.drawer) score += 1;
  }
  if (branch.possess) score += 1 + specificityOf(branch.possess.item, taxonomy);
  return score;
}

export function specificityOf(ast: MatcherAST, taxonomy?: CompiledTaxonomy | null): number {
  const scores = matcherBranches(ast).map((branch) => branchSpecificity(branch, taxonomy));
  return scores.length ? Math.min(...scores) : 0;
}