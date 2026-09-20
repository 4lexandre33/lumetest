import type { PhraseSuggestion } from "./write-menu.ts";
import { stripAnotacoesSlice } from "./annotations.ts";
import { compileNotebook } from "./notebook.ts";

export type ProseHitKind = "entity" | "phrase" | "annotation";

export type ProseHit = {
  kind: ProseHitKind;
  label: string;
  detail: string;
  token: string;
  start: number;
  end: number;
  entityId?: string;
  insert?: string;
};

export type WriteRule = {
  id: string;
  on: string;
  ifs: string[];
  narrative: string;
  dos: string[];
};

export type WriteSuggestion = {
  id: string;
  title: string;
  narrative: string;
  dos: string[];
};

const SKIP = new Set([
  "quando",
  "se",
  "narre",
  "cause",
  "marque",
  "entenda",
  "caderno",
  "autora",
  "autor",
  "tem",
  "esta",
  "está",
  "herda",
  "grupo",
  "trait",
  "contem",
  "contém",
  "padrao",
  "padrão",
]);

const MIN = 3;
const CAP = 8;

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function isWordChar(ch: string): boolean {
  return /[\p{L}\p{N}_]/u.test(ch);
}

export function tokenAt(source: string, offset: number): { token: string; start: number; end: number } {
  const clamped = Math.max(0, Math.min(offset, source.length));
  let start = clamped;
  let end = clamped;
  while (start > 0 && isWordChar(source[start - 1]!)) start -= 1;
  while (end < source.length && isWordChar(source[end]!)) end += 1;
  return { token: source.slice(start, end), start, end };
}

function matches(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  if (haystack === needle) return true;
  if (haystack.startsWith(needle)) return true;
  for (const word of haystack.split(/[\s_/.-]+/)) {
    if (word === needle || word.startsWith(needle)) return true;
  }
  return haystack.includes(needle);
}

export function proseTriggers(
  source: string,
  offset: number,
  opts: {
    entities?: { id: string; name?: string }[];
    phrases?: PhraseSuggestion[];
    annotations?: { quote: string; do: string }[];
  },
): ProseHit[] {
  const { token, start, end } = tokenAt(source, offset);
  const t = fold(token);
  if (t.length < MIN || SKIP.has(t) || /^\d+$/.test(t)) return [];
  const out: ProseHit[] = [];
  const seen = new Set<string>();
  const push = (hit: ProseHit) => {
    const key = `${hit.kind}:${hit.label}:${hit.insert ?? hit.entityId ?? ""}`;
    if (seen.has(key) || out.length >= CAP) return;
    seen.add(key);
    out.push(hit);
  };

  for (const entity of opts.entities ?? []) {
    const idFold = fold(entity.id);
    const nameFold = fold(entity.name ?? "");
    if (matches(idFold, t) || (nameFold && matches(nameFold, t))) {
      push({
        kind: "entity",
        label: entity.id,
        detail: "vincular mutação",
        token,
        start,
        end,
        entityId: entity.id,
      });
    }
  }

  for (const phrase of opts.phrases ?? []) {
    if (matches(fold(phrase.insert), t) || matches(fold(phrase.label), t)) {
      push({
        kind: "phrase",
        label: phrase.label,
        detail: "inserir frase",
        token,
        start,
        end,
        insert: phrase.insert,
      });
    }
  }

  for (const annotation of opts.annotations ?? []) {
    if (!matches(fold(annotation.quote), t)) continue;
    push({
      kind: "annotation",
      label: annotation.quote,
      detail: annotation.do,
      token,
      start,
      end,
    });
  }

  return out;
}

export function caretAnchor(source: string, offset: number, opts?: { linePx?: number; padTop?: number; gutter?: number; charW?: number }): { left: number; top: number; line: number } {
  const linePx = opts?.linePx ?? 24;
  const padTop = opts?.padTop ?? 16;
  const gutter = opts?.gutter ?? 56;
  const charW = opts?.charW ?? 8.4;
  const clamped = Math.max(0, Math.min(offset, source.length));
  const line = source.slice(0, clamped).split("\n").length;
  const lineStart = source.lastIndexOf("\n", clamped - 1) + 1;
  const col = clamped - lineStart;
  return {
    left: gutter + 16 + col * charW,
    top: padTop + line * linePx,
    line,
  };
}

function unquote(raw: string): string {
  const t = raw.trim();
  if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) {
    return t.slice(1, -1);
  }
  return t;
}

function wordsOf(text: string): string[] {
  return fold(text)
    .split(/[^\p{L}\p{N}_]+/u)
    .filter(Boolean);
}

export function tagsOf(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /#([\p{L}_][\p{L}\p{N}_]*)/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const tag = fold(m[1] ?? "");
    if (tag.length < MIN || SKIP.has(tag) || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

export function rulesFromSource(rulesSource: string): WriteRule[] {
  const out: WriteRule[] = [];
  let cur: WriteRule | null = null;
  const flush = () => {
    if (cur) out.push(cur);
    cur = null;
  };
  for (const raw of rulesSource.split("\n")) {
    const line = raw.trim();
    if (/^PADRAO\b/i.test(line)) {
      flush();
      continue;
    }
    if (/^#\s+\S/.test(line) && !/^#\s+---/.test(line)) {
      flush();
      cur = { id: line.replace(/^#\s+/, "").trim(), on: "", ifs: [], narrative: "", dos: [] };
      continue;
    }
    if (!cur) continue;
    if (/^ON:\s*/i.test(line)) cur.on = line.replace(/^ON:\s*/i, "").trim();
    else if (/^IF:\s*/i.test(line)) cur.ifs.push(line.replace(/^IF:\s*/i, "").trim());
    else if (/^DO:\s*/i.test(line)) cur.dos.push(line.replace(/^DO:\s*/i, "").trim());
    else if (/^narrativa:\s*/i.test(line)) cur.narrative = unquote(line.replace(/^narrativa:\s*/i, ""));
    else if (cur.dos.length && /^\S/.test(raw) === false && line) cur.dos.push(line);
  }
  flush();
  return out;
}

function paragraphAt(lines: string[], index: number): string {
  let a = index;
  let b = index;
  while (a > 0 && (lines[a - 1] ?? "").trim()) a -= 1;
  while (b + 1 < lines.length && (lines[b + 1] ?? "").trim()) b += 1;
  return lines
    .slice(a, b + 1)
    .filter((line) => !/^##\s+\/?regras\s*$/i.test(line.trim()))
    .join("\n");
}

function haystackOf(rule: WriteRule): string {
  return `${rule.on} ${rule.ifs.join(" ")}`;
}

function ruleHits(rule: WriteRule, tags: string[]): boolean {
  const words = new Set(wordsOf(haystackOf(rule)));
  return tags.some((tag) => words.has(tag));
}

export function regrasFenceBody(text: string): string {
  const lines = stripAnotacoesSlice(text).replace(/^\uFEFF/, "").split("\n");
  const out: string[] = [];
  let on = false;
  for (const line of lines) {
    if (/^##\s+regras\s*$/i.test(line.trim())) {
      on = true;
      continue;
    }
    if (/^##\s+\/regras\s*$/i.test(line.trim())) {
      on = false;
      continue;
    }
    if (on) out.push(line);
  }
  return out.join("\n");
}

export function writeSuggestionRules(prose: string): WriteRule[] {
  const body = regrasFenceBody(prose);
  if (!body.trim()) return [];
  return rulesFromSource(compileNotebook(`CADERNO:\n${body}`).rulesSource);
}

export function writeSuggestions(prose: string, lineNo: number, rules?: WriteRule[]): WriteSuggestion[] {
  const list = rules ?? writeSuggestionRules(prose);
  if (!list.length) return [];
  const lines = stripAnotacoesSlice(prose).replace(/^\uFEFF/, "").split("\n");
  const index = Math.max(0, Math.min(lines.length - 1, lineNo - 1));
  const tags = tagsOf(paragraphAt(lines, index));
  if (!tags.length) return [];
  const out: WriteSuggestion[] = [];
  const seen = new Set<string>();
  for (const rule of list) {
    if (!ruleHits(rule, tags) || seen.has(rule.id)) continue;
    seen.add(rule.id);
    out.push({
      id: rule.id,
      title: rule.on || rule.id,
      narrative: rule.narrative,
      dos: rule.dos,
    });
    if (out.length >= CAP) break;
  }
  return out;
}
