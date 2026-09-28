import { lineColumnFromOffset } from "../../narrative-engine/index.ts";
import type { CompletionItem } from "../../narrative-engine/index.ts";
import { writeSuggestions, type WriteSuggestion } from "./prose-triggers.ts";

export type PhraseLeaf = { owner: string; key: string; insert: string };

function ctx(source: string, offset: number, replaceStart: number, prefix: string) {
  const { line, column } = lineColumnFromOffset(source, offset);
  return { slot: "degrau" as const, prefix, replaceStart, replaceEnd: offset, line, column };
}

export function inRegrasFence(source: string, offset: number): boolean {
  const lines = source.slice(0, offset).split("\n");
  const current = lines[lines.length - 1] ?? "";
  if (/^##\s+\/?regras\s*$/i.test(current.trim())) return false;
  let on = false;
  for (const line of lines.slice(0, -1)) {
    if (/^##\s+regras\s*$/i.test(line.trim())) on = true;
    else if (/^##\s+\/regras\s*$/i.test(line.trim())) on = false;
  }
  return on;
}

export function proseDegrau(
  source: string,
  offset: number,
  entityIds: readonly string[],
  phrases: readonly PhraseLeaf[],
  suggestions: readonly WriteSuggestion[] = writeSuggestions(source, source.slice(0, offset).split("\n").length),
): { ctx: ReturnType<typeof ctx>; items: CompletionItem[] } | null {
  const lineStart = source.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
  const before = source.slice(lineStart, offset);
  const body = before.trimStart();
  const indent = before.length - body.length;
  const at = (from: number, prefix: string) => ctx(source, offset, lineStart + indent + from, prefix);
  if (!/\.[\p{L}\p{N}_@]*$/u.test(body)) return null;

  const frasesKey = body.match(/^frases\.(@[\p{L}_][\p{L}\p{N}\p{M}_]*|[\p{L}_][\p{L}\p{N}\p{M}_]*)\.([\p{L}\p{N}_]*)$/u);
  if (frasesKey) {
    const owner = frasesKey[1]!;
    const prefix = frasesKey[2] ?? "";
    const items = phrases
      .filter((item) => item.owner === owner)
      .map((item) => ({ label: item.key, insert: item.insert, kind: "prop" as const, detail: "frase" }));
    return { ctx: at(0, prefix), items };
  }
  const frases = body.match(/^frases\.([\p{L}\p{N}_@]*)$/u);
  if (frases) {
    const owners = [...new Set(phrases.map((item) => item.owner))].sort();
    return {
      ctx: at(body.lastIndexOf(".") + 1, frases[1] ?? ""),
      items: owners.map((owner) => ({ label: owner, insert: `${owner}.`, kind: "id" as const, detail: "frases" })),
    };
  }
  const entity = body.match(/^(@[\p{L}_][\p{L}\p{N}\p{M}_]*)\.([\p{L}\p{N}_]*)$/u);
  if (entity) {
    const owner = entity[1]!;
    const prefix = entity[2] ?? "";
    const items = phrases
      .filter((item) => item.owner === owner)
      .map((item) => ({ label: item.key, insert: item.insert, kind: "prop" as const, detail: "frase" }));
    return { ctx: at(0, prefix), items };
  }
  const root = body.match(/^\.([\p{L}\p{N}_]*)$/u);
  if (!root) return null;
  const prefix = root[1] ?? "";
  const items: CompletionItem[] = [
    ...entityIds.map((id) => ({ label: id, insert: id, kind: "id" as const, detail: "entidade" })),
    { label: "frases", insert: "frases.", kind: "prop", detail: "frases desta história" },
    ...suggestions.map((item) => ({
      label: item.title || item.id,
      insert: item.narrative || item.title,
      kind: "keyword" as const,
      detail: item.narrative || "lei",
    })),
  ];
  return { ctx: at(0, prefix), items };
}
