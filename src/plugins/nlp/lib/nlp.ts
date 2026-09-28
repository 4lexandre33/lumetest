import type { WorldModel } from "../../narrative-engine/types.ts";
import { lines, lookup } from "../../vocab/index.ts";
import { verbPrefixes } from "../../vocab/index.ts";
import { VOCAB_ENTITY_ID } from "../../vocab/index.ts";
import { arityOf } from "../../vocab/index.ts";
import type { GrammarLine } from "../../vocab/types.ts";
import type { NlpHit, NlpScope } from "../types.ts";

const STOP = new Set(
  [
    "a",
    "o",
    "as",
    "os",
    "um",
    "uma",
    "uns",
    "umas",
    "the",
    "to",
    "at",
    "with",
    "on",
    "in",
    "into",
    "onto",
    "from",
    "of",
    "da",
    "das",
    "do",
    "dos",
    "de",
    "na",
    "nas",
    "no",
    "nos",
    "para",
    "pro",
    "pra",
    "com",
    "sobre",
    "em",
    "ao",
    "aos",
    "pelo",
    "pela",
    "and",
    "e",
    "then",
    "depois",
    "about",
    "up",
    "off",
  ].map(fold),
);

const DRY_PREFIXES = [
  "would i be able to",
  "am i able to",
  "is it possible to",
  "could i",
  "can i",
  "may i",
  "sera que posso",
  "sera que consigo",
  "poderia",
  "posso",
  "consigo",
].map(fold);

export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function looksLikeIntent(text: string): boolean {
  const head = text.trim().split(";")[0]?.trim() ?? "";
  if (!head) return false;
  return /^intent(?:\.|\s|$)/i.test(head);
}

export function splitPhrases(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (looksLikeIntent(trimmed)) return [trimmed];
  return trimmed
    .split(/(?:\s*(?:[.!?;]|\band then\b|\bthen\b|\be depois\b|\bdepois\b)\s*)+/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map((token) => token.replace(/^[^\p{L}\p{N}_]+|[^\p{L}\p{N}_]+$/gu, ""))
    .filter((token) => token.length > 0)
    .map(fold);
}

function stripDryRun(tokens: string[]): { tokens: string[]; dryRun: boolean } {
  const joined = tokens.join(" ");
  for (const prefix of DRY_PREFIXES) {
    if (joined === prefix || joined.startsWith(`${prefix} `)) {
      const rest = tokens.slice(prefix.split(" ").length);
      return { tokens: rest, dryRun: true };
    }
  }
  return { tokens, dryRun: false };
}

function needlesOf(world: WorldModel, allowed: Set<string> | null): { id: string; aliases: string[] }[] {
  const out: { id: string; aliases: string[] }[] = [];
  for (const entity of world.values()) {
    if (allowed && !allowed.has(entity.id)) continue;
    const aliases = new Set<string>([fold(entity.id.replace(/^@/, ""))]);
    if (typeof entity.name === "string" && entity.name.trim()) aliases.add(fold(entity.name.trim()));
    if (typeof entity.extra?.name === "string" && entity.extra.name.trim()) aliases.add(fold(entity.extra.name.trim()));
    const extraAliases = entity.extra?.aliases;
    if (typeof extraAliases === "string") {
      for (const alias of extraAliases.split(",")) {
        const piece = alias.trim();
        if (piece) aliases.add(fold(piece));
      }
    }
    out.push({ id: entity.id, aliases: [...aliases] });
  }
  return out;
}

function isSnapshot(scope: NlpScope): scope is Exclude<NlpScope, readonly string[]> {
  return !Array.isArray(scope);
}

function scopeAll(scope: NlpScope | undefined): Set<string> | null {
  if (scope == null) return null;
  if (!isSnapshot(scope)) return new Set(scope);
  const ids = [...(scope.see ?? []), ...(scope.hear ?? []), ...(scope.touch ?? []), ...(scope.inventory ?? [])];
  if (scope.place) ids.push(scope.place);
  return new Set(ids);
}

function scopeForSlot(scope: NlpScope | undefined, slot: string | null): Set<string> | null {
  const all = scopeAll(scope);
  if (all == null) return null;
  if (slot === "held" && scope && isSnapshot(scope)) {
    const held = scope.inventory ?? [];
    if (held.length > 0) return new Set(held);
  }
  return all;
}

function scoreOf(id: string, scope: NlpScope | undefined, slot: string | null): number {
  let score = 0;
  const all = scopeAll(scope);
  if (all == null || all.has(id)) score += 4;
  if (slot === "held" && scope && isSnapshot(scope) && (scope.inventory ?? []).includes(id)) score += 2;
  if (scope && isSnapshot(scope) && (scope.see ?? []).includes(id)) score += 1;
  return score;
}

function matchAt(
  tokens: string[],
  start: number,
  needles: { id: string; aliases: string[] }[],
  scope: NlpScope | undefined,
  slot: string | null,
): { id: string; len: number } | "ambiguous" | null {
  for (let len = tokens.length - start; len >= 1; len--) {
    const span = tokens.slice(start, start + len).join(" ");
    const hits = needles.filter((needle) => needle.aliases.includes(span));
    if (hits.length === 0) continue;
    if (hits.length === 1) return { id: hits[0]!.id, len };
    const ranked = hits
      .map((hit) => ({ id: hit.id, score: scoreOf(hit.id, scope, slot) }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0]!;
    const second = ranked[1]!;
    if (best.score > second.score) return { id: best.id, len };
    return "ambiguous";
  }
  return null;
}

function commandOf(path: string, ids: string[]): string {
  const parts = ["intent", ...path.split("."), ...ids];
  return parts.filter(Boolean).join(".");
}

function isSlot(piece: string): string | null {
  const m = /^\[(.+)\]$/.exec(piece);
  return m?.[1] ?? null;
}

function isFiller(token: string): boolean {
  if (STOP.has(token)) return true;
  const entry = lookup(token);
  return !!entry?.flags.includes("descriptor");
}

function skipFillers(tokens: string[], start: number, keepLiteral?: string): number {
  let i = start;
  while (i < tokens.length && isFiller(tokens[i]!) && tokens[i] !== keepLiteral) i += 1;
  return i;
}

function matchLineTokens(
  tokens: string[],
  pattern: string[],
  world: WorldModel,
  scope: NlpScope | undefined,
): string[] | null {
  let i = 0;
  const ids: string[] = [];
  for (const piece of pattern) {
    const slot = isSlot(piece);
    if (slot === "texto") {
      i = skipFillers(tokens, i);
      if (i >= tokens.length) return null;
      ids.push(tokens.slice(i).join("_"));
      i = tokens.length;
      continue;
    }
    if (slot === "número") {
      i = skipFillers(tokens, i);
      const entry = lookup(tokens[i] ?? "");
      if (!entry?.flags.includes("number") || entry.number === undefined) return null;
      ids.push(String(entry.number));
      i += 1;
      continue;
    }
    if (slot) {
      i = skipFillers(tokens, i);
      if (i >= tokens.length) return null;
      const needles = needlesOf(world, scopeForSlot(scope, slot));
      const hit = matchAt(tokens, i, needles, scope, slot);
      if (!hit || hit === "ambiguous") return null;
      ids.push(hit.id);
      i += hit.len;
      continue;
    }
    const lit = fold(piece);
    i = skipFillers(tokens, i, lit);
    if (tokens[i] !== lit) return null;
    i += 1;
  }
  i = skipFillers(tokens, i);
  if (i !== tokens.length) return null;
  return ids;
}

function startsWith(tokens: string[], prefix: string[]): boolean {
  if (tokens.length < prefix.length) return false;
  return prefix.every((word, i) => tokens[i] === word);
}

function projectLines(world: WorldModel): GrammarLine[] {
  const raw = world.get(VOCAB_ENTITY_ID)?.extra?.grammar;
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as GrammarLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((line) => line && typeof line.verb === "string" && Array.isArray(line.tokens) && typeof line.path === "string");
  } catch {
    return [];
  }
}

function matchGrammar(
  tokens: string[],
  world: WorldModel,
  scope: NlpScope | undefined,
): { path: string; ids: string[] } | null {
  for (const line of [...projectLines(world), ...lines()]) {
    for (const prefix of verbPrefixes(line)) {
      if (!startsWith(tokens, prefix)) continue;
      const ids = matchLineTokens(tokens.slice(prefix.length), line.tokens, world, scope);
      if (ids) return { path: line.path, ids };
    }
  }
  return null;
}

function phraseToCommand(
  phrase: string,
  world: WorldModel,
  scope: NlpScope | undefined,
): { command: string; dryRun: boolean } | null {
  const stripped = stripDryRun(tokenize(phrase));
  if (stripped.tokens.length === 0) return null;
  const grammar = matchGrammar(stripped.tokens, world, scope);
  if (!grammar) return null;
  const ids =
    grammar.ids.length === 0 && arityOf(grammar.path) === "opt" ? ["local"] : grammar.ids;
  return { command: commandOf(grammar.path, ids), dryRun: stripped.dryRun };
}

export function interpret(text: string, world: WorldModel, scope?: NlpScope): NlpHit | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (looksLikeIntent(trimmed)) return null;
  const phrases = splitPhrases(trimmed);
  if (phrases.length === 0) return null;
  const commands: string[] = [];
  let dryRun = false;
  for (const phrase of phrases) {
    if (looksLikeIntent(phrase)) return null;
    const hit = phraseToCommand(phrase, world, scope);
    if (!hit) return null;
    commands.push(hit.command);
    if (hit.dryRun) dryRun = true;
  }
  return { command: commands.join("; "), dryRun };
}
