import type { WorldModel } from "../../narrative-engine/index.ts";
import type { WriteRule } from "./prose-triggers.ts";
import {
  addAnnotation,
  cadernoBookRanges,
  doLines,
  headingOf,
  nextAnnotationId,
  parseAnotacoesSlice,
  rebindAnnotation,
} from "./annotations.ts";

export function propostasAbertas<T extends { id: string; dos: readonly string[] }>(
  suggestions: readonly T[],
  refused: readonly string[],
  acceptedDos: readonly string[],
): T[] {
  const no = new Set(refused);
  const done = new Set(acceptedDos.map((item) => item.trim()).filter(Boolean));
  return suggestions.filter((item) => {
    if (no.has(item.id)) return false;
    if (item.dos.length > 0 && item.dos.every((line) => done.has(line.trim()))) return false;
    return true;
  });
}

export function dosNaLinha(text: string, line: number): string[] {
  const out: string[] = [];
  for (const item of parseAnotacoesSlice(text)) {
    const hit = rebindAnnotation(text, item);
    if (!("line" in hit) || hit.line !== line) continue;
    out.push(...doLines(item.do));
  }
  return out;
}

function flagOf(line: string): { id: string; key: string; want: boolean } | null {
  const match = line.trim().match(/^SET_FLAG\s+(@[\p{L}_][\p{L}\p{N}_]*)(?:\.([\p{L}_][\p{L}\p{N}_]*)|\s+([\p{L}_][\p{L}\p{N}_]*))\s+(true|false)\s*$/iu);
  if (!match) return null;
  return { id: match[1]!, key: match[2] || match[3] || "", want: match[4]!.toLowerCase() === "true" };
}

export function avisoDe(world: WorldModel, doLine: string): string | null {
  const flag = flagOf(doLine);
  if (!flag || !flag.key) return null;
  const entity = world.get(flag.id);
  if (!entity) return `${flag.id} não existe`;
  if (!Object.prototype.hasOwnProperty.call(entity.flags, flag.key)) return null;
  const has = entity.flags[flag.key] === true;
  if (has === flag.want) return null;
  return `${flag.id}.${flag.key} está ${has} e a lei sempre pede ${flag.want}`;
}

export function decidirSempre(
  world: WorldModel,
  rules: readonly WriteRule[],
  already: readonly string[],
): { aplicar: WriteRule[]; avisos: string[] } {
  const done = new Set(already.map((item) => item.trim()).filter(Boolean));
  const aplicar: WriteRule[] = [];
  const avisos: string[] = [];
  for (const rule of rules) {
    const clashes = rule.dos.map((line) => avisoDe(world, line)).filter((item): item is string => Boolean(item));
    if (clashes.length) {
      avisos.push(...clashes);
      continue;
    }
    const fresh = rule.dos.filter((line) => !done.has(line.trim()));
    if (fresh.length) aplicar.push({ ...rule, dos: fresh });
  }
  return { aplicar, avisos };
}

export function aceitarProposta(
  text: string,
  line: number,
  proposal: { dos: readonly string[] },
): { text: string; id: string } | { error: "missing" | "empty" } {
  const lines = text.replace(/^\uFEFF/, "").split(/\n/);
  const raw = lines[line - 1] ?? "";
  const quote = raw.trim();
  const doText = proposal.dos.map((item) => item.trim()).filter(Boolean).join("\n");
  if (!doText) return { error: "empty" };
  if (!quote || line < 1 || line > lines.length) return { error: "missing" };
  const existing = parseAnotacoesSlice(text);
  const already = existing.find((item) => {
    if (item.do.trim() !== doText) return false;
    if (item.quote.trim() === quote) return true;
    const hit = rebindAnnotation(text, item);
    return "line" in hit && hit.line === line;
  });
  if (already) return { text, id: already.id };
  const book = cadernoBookRanges(text).find((range) => line - 1 >= range.start && line - 1 < range.end);
  const id = nextAnnotationId(existing);
  const column = raw.indexOf(quote);
  return {
    text: addAnnotation(text, {
      id,
      book: book?.id ?? "book-0",
      heading: headingOf(text, line),
      quote,
      do: doText,
      ...(column >= 0 ? { column } : {}),
    }),
    id,
  };
}
