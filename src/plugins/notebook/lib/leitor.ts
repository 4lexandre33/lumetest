import { isRegrasFence } from "./notebook.ts";

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function isMachine(line: string): boolean {
  const folded = fold(line);
  if (!folded) return true;
  if (folded === "---") return true;
  if (/^#\s*---/.test(line) || /^#[0-9a-f]{4}$/i.test(line)) return true;
  if (/^(caderno|autora|autor|data|dedicatoria)\s*:/.test(folded)) return true;
  if (/^(activa|ativa|peso)\s*:/.test(folded)) return true;
  if (/^\d+\.\s+\S+$/.test(folded)) return true;
  return false;
}

/** Prosa legível até onde o texto já foi cortado. Sem capa, cerca, fatia ou nota. */
export function lerProsa(source: string): string {
  const out: string[] = [];
  let fence = false;
  let slice = false;
  for (const raw of source.replace(/^\uFEFF/, "").split(/\n/)) {
    const trimmed = raw.trim();
    if (/^#\s*---/.test(trimmed)) {
      slice = !/^#\s*---\s*\//.test(trimmed);
      continue;
    }
    if (slice) continue;
    if (isRegrasFence(trimmed) || /^##\s+\/?moldes\s*$/i.test(trimmed)) {
      fence = isRegrasFence(trimmed) ? !/\/regras/i.test(trimmed) : !/\/moldes/i.test(trimmed);
      continue;
    }
    if (fence || isMachine(trimmed) || trimmed.startsWith(">")) {
      if (!fence && !trimmed && out.length && out[out.length - 1] !== "") out.push("");
      continue;
    }
    const text = trimmed
      .replace(/\/\*\s*.*?\s*\*\//g, "")
      .replace(/^#{2,3}\s+/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    out.push(text);
  }
  while (out[0] === "") out.shift();
  while (out.length && out[out.length - 1] === "") out.pop();
  return out.join("\n");
}

/** Prosa do caderno inteiro. O mesmo corte de lerProsa, sem parar na linha do cursor. */
export function lerLivro(source: string, range?: { start: number; end: number } | null): string {
  if (!range) return lerProsa(source);
  const lines = source.replace(/^\uFEFF/, "").split(/\n/);
  return lerProsa(lines.slice(range.start, range.end).join("\n"));
}
