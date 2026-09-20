import type { GrammarLine, VocabEntry, VocabFlag, VocabLocale } from "../types.ts";
import { LANGUAGE_SEEDS } from "./language.ts";
import { lineWarning, STANDARD_LINES, type VocabWarning } from "./grammar.ts";
import { VOCAB_LOCALE } from "./tokens.ts";
import { VERB_DEFS } from "./verbs.ts";

const ENTRIES = new Map<string, VocabEntry>();
const LINES: GrammarLine[] = [];
const WARNINGS: VocabWarning[] = [];

export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function addEntry(raw: string, patch: Omit<VocabEntry, "fold" | "raw">): void {
  const key = fold(raw);
  const prev = ENTRIES.get(key);
  if (!prev) {
    ENTRIES.set(key, { fold: key, raw, ...patch });
    return;
  }
  const flags = [...new Set<VocabFlag>([...prev.flags, ...patch.flags])];
  ENTRIES.set(key, {
    ...prev,
    flags,
    number: prev.number ?? patch.number,
    path: prev.path ?? patch.path,
    pronoun: prev.pronoun ?? patch.pronoun,
    descriptor: prev.descriptor ?? patch.descriptor,
    direction: prev.direction ?? patch.direction,
  });
}

export function addLine(line: GrammarLine): boolean {
  const warning = lineWarning(line);
  if (warning) {
    WARNINGS.push(warning);
    return false;
  }
  LINES.push({ ...line, locale: line.locale ?? VOCAB_LOCALE });
  return true;
}

for (const def of VERB_DEFS) {
  for (const raw of def.keys) {
    addEntry(raw, { flags: ["verb"], path: def.path });
  }
}

for (const seed of LANGUAGE_SEEDS) {
  addEntry(seed.raw, {
    flags: seed.flags,
    number: seed.number,
    pronoun: seed.pronoun,
    descriptor: seed.descriptor,
    direction: seed.direction,
  });
}

for (const line of STANDARD_LINES) addLine(line);

export function lookup(key: string): VocabEntry | null {
  const folded = fold(key);
  const hit = ENTRIES.get(folded);
  if (hit) return hit;
  if (!/^\d+$/.test(folded)) return null;
  const number = Number.parseInt(folded, 10);
  if (!Number.isFinite(number)) return null;
  const entry: VocabEntry = { fold: folded, raw: key.trim() || folded, flags: ["number"], number };
  ENTRIES.set(folded, entry);
  return entry;
}

export function lines(locale: VocabLocale = VOCAB_LOCALE): GrammarLine[] {
  return LINES.filter((line) => (line.locale ?? VOCAB_LOCALE) === locale);
}

export function linesFor(path: string, locale: VocabLocale = VOCAB_LOCALE): GrammarLine[] {
  return lines(locale).filter((line) => line.path === path);
}

export function warnings(): VocabWarning[] {
  return WARNINGS.slice();
}
