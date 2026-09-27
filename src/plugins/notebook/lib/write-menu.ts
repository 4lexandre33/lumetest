import { FBE_DRAWERS, type FbeDrawer } from "../../narrative-engine/lib/types.ts";
import { formatStatInput, isCanonicalEntityId, isLinkTarget, canonicalEntityId } from "../../narrative-engine/lib/world-model.ts";
import { locateEntityBlock } from "../../narrative-engine/lib/source-ops.ts";
import { correrComando, type EfeitoComando } from "./comando.ts";

export { FBE_DRAWERS, type FbeDrawer, isLinkTarget, formatStatInput };

function foldId(raw: string): string {
  return raw.replace(/^@/, "").toLocaleLowerCase();
}

export function emitEntityId(raw: string, knownIds?: readonly string[]): string {
  const t = raw.trim();
  if (!t || t === "start" || t === "$") return t;
  if (/^#[0-9A-Fa-f]{4}$/.test(t)) return t;
  if (knownIds) {
    const folded = foldId(t);
    const hit = knownIds.find((id) => foldId(id) === folded);
    if (hit && isCanonicalEntityId(hit)) return hit;
  }
  if (isCanonicalEntityId(t)) return t;
  return canonicalEntityId(t);
}

export function cadernoLive(mode: "write" | "play"): boolean {
  return mode === "write";
}

export type TextSelection = {
  start: number;
  end: number;
  line: number;
  text: string;
};

export type DrawerHost = {
  id: string;
  tags: Iterable<string>;
  stats: Record<string, unknown>;
  flags: Record<string, unknown>;
  enums: Record<string, unknown>;
  phrases: Record<string, unknown>;
  hardLinks: Record<string, unknown>;
  softLinks: Record<string, unknown>;
  lists: Record<string, unknown>;
  fuses: Record<string, unknown>;
  struct: Record<string, unknown>;
};

export type MutationOp = "set" | "unset";
export type MutationKind = "drawer" | "world";

export type MutationDraft = {
  entityId: string;
  drawer: FbeDrawer;
  key: string;
  value: string;
  quote: string;
  line: number;
  op: MutationOp;
  kind?: MutationKind;
  column?: number;
  into?: "rule" | "portrait";
};

export type PhraseSuggestion = {
  id: string;
  label: string;
  insert: string;
};

export function selectionOf(source: string, start: number, end: number): TextSelection {
  const lo = Math.max(0, Math.min(start, end, source.length));
  const hi = Math.max(lo, Math.min(Math.max(start, end), source.length));
  return {
    start: lo,
    end: hi,
    line: source.slice(0, lo).split("\n").length,
    text: source.slice(lo, hi),
  };
}

function charDeTrecho(ch: string): boolean {
  return /^[@#\p{L}\p{N}_]$/u.test(ch);
}

export function trechoDe(source: string, start: number, end: number): TextSelection & { erro?: string } {
  const sel = selectionOf(source, start, end);
  if (sel.text.includes("\n")) return { start: sel.start, end: sel.start, line: sel.line, text: "", erro: "O trecho fica na mesma linha." };
  if (sel.start !== sel.end) {
    const lead = sel.text.length - sel.text.trimStart().length;
    const text = sel.text.trim();
    if (!text) return { start: sel.start, end: sel.start, line: sel.line, text: "", erro: "marque a palavra" };
    const from = sel.start + lead;
    return { start: from, end: from + text.length, line: sel.line, text };
  }
  const lineStart = source.lastIndexOf("\n", Math.max(0, sel.start - 1)) + 1;
  const lineBreak = source.indexOf("\n", sel.start);
  const lineText = source.slice(lineStart, lineBreak < 0 ? source.length : lineBreak);
  const at = sel.start - lineStart;
  let i = at;
  if (!charDeTrecho(lineText[i] ?? "")) i = at - 1;
  if (!charDeTrecho(lineText[i] ?? "")) return { start: sel.start, end: sel.start, line: sel.line, text: "", erro: "marque a palavra" };
  let a = i;
  let b = i + 1;
  while (charDeTrecho(lineText[a - 1] ?? "")) a--;
  while (charDeTrecho(lineText[b] ?? "")) b++;
  return { start: lineStart + a, end: lineStart + b, line: sel.line, text: lineText.slice(a, b) };
}

export function insertAtSelection(source: string, start: number, end: number, insert: string): { source: string; offset: number } {
  const sel = selectionOf(source, start, end);
  return {
    source: source.slice(0, sel.start) + insert + source.slice(sel.end),
    offset: sel.start + insert.length,
  };
}

export function insertRegrasSection(source: string, offset: number): { source: string; offset: number } {
  const clamped = Math.max(0, Math.min(offset, source.length));
  const prefix = source.slice(0, clamped);
  const nl = !prefix.length || prefix.endsWith("\n") ? "" : "\n";
  const open = "## regras\n";
  const close = "## /regras\n";
  const insert = `${nl}${open}\n${close}`;
  return { source: prefix + insert + source.slice(clamped), offset: clamped + nl.length + open.length };
}

export function insertMoldesSection(source: string, offset: number): { source: string; offset: number } {
  const clamped = Math.max(0, Math.min(offset, source.length));
  const prefix = source.slice(0, clamped);
  const nl = !prefix.length || prefix.endsWith("\n") ? "" : "\n";
  const open = "## moldes\n### ";
  const close = "\n## /moldes\n";
  const insert = `${nl}${open}${close}`;
  return { source: prefix + insert + source.slice(clamped), offset: clamped + nl.length + open.length };
}

export type Molde = { id: string; title: string; body: string };
export type BibliotecaItem = PhraseSuggestion & { kind: "molde" | "frase" };

export function moldesOf(source: string): Molde[] {
  const out: Molde[] = [];
  let on = false;
  let title = "";
  let body: string[] = [];
  const flush = () => {
    const name = title.trim();
    const text = body.join("\n").replace(/^\n+|\n+$/g, "");
    if (name && text) out.push({ id: `molde:${name}`, title: name, body: text });
    title = "";
    body = [];
  };
  for (const raw of source.replace(/^\uFEFF/, "").split("\n")) {
    const trimmed = raw.trim();
    if (/^##\s+\/?moldes\s*$/i.test(trimmed)) {
      flush();
      on = !/\/moldes/i.test(trimmed);
      continue;
    }
    if (!on) continue;
    if (/^###\s+/.test(trimmed)) {
      flush();
      title = trimmed.replace(/^###\s+/, "").trim();
      continue;
    }
    if (title) body.push(raw.trimEnd());
  }
  flush();
  return out;
}

export function bibliotecaOf(source: string, phrases: readonly PhraseSuggestion[]): BibliotecaItem[] {
  return [
    ...moldesOf(source).map((item) => ({ id: item.id, label: item.title, insert: item.body, kind: "molde" as const })),
    ...phrases.map((item) => ({ ...item, kind: "frase" as const })),
  ];
}

export function entityGuess(quote: string, ids: readonly string[]): string {
  const t = quote.trim();
  if (!t) return ids[0] ?? "";
  const folded = foldId(t);
  const hit = ids.find((id) => foldId(id) === folded);
  if (hit && isCanonicalEntityId(hit)) return hit;
  if (!/\s/.test(t)) return emitEntityId(t, ids);
  for (const token of t.split(/\s+/)) {
    const id = emitEntityId(token, ids);
    if (isCanonicalEntityId(id) && ids.includes(id)) return id;
  }
  const first = emitEntityId(t.split(/\s+/)[0] ?? "", ids);
  return isCanonicalEntityId(first) ? first : ids[0] ?? "";
}

export const MENU_CURSOR = [
  "Isto é…",
  "Mudar isto",
  "Ela sabe…",
  "Ligar a…",
  "Mais um como esta",
  "Nesta linha",
  "Mais",
] as const;

export const MENU_MAIS = [
  "Adicionar nota",
  "Biblioteca",
  "Ver índices",
  "Linha do tempo",
  "Secção de regras",
  "Secção de moldes",
  "Separar secção",
] as const;

export type TipoNascer = "pessoa" | "lugar" | "objeto";

function semPalavra(entities: string): EfeitoComando {
  return { cartao: { ok: false, titulo: "marque a palavra", linhas: [] }, entities };
}

function idDaPalavra(word: string, ids: readonly string[]): string | null {
  const texto = word.trim();
  if (!texto) return null;
  const id = entityGuess(texto, ids);
  return isCanonicalEntityId(id) ? id : null;
}

function porTag(source: string, id: string, tag: TipoNascer): string | null {
  const loc = locateEntityBlock(source, id);
  if (!loc) return null;
  const lines = source.split("\n");
  for (let i = loc.startLine - 1; i < loc.endLine; i++) {
    if (!/^\s*tags\s*:/.test(lines[i] ?? "")) continue;
    const indent = /^\s*/.exec(lines[i]!)?.[0] ?? "  ";
    lines[i] = `${indent}tags: ${tag};`;
    return lines.join("\n");
  }
  return null;
}

export function nascerPalavra(entities: string, word: string, tag: TipoNascer): EfeitoComando {
  if (!word.trim()) return semPalavra(entities);
  const id = canonicalEntityId(word);
  if (!isCanonicalEntityId(id)) return { cartao: { ok: false, titulo: "Id inválido.", linhas: [] }, entities };
  const ran = correrComando(`ent.create ${id}`, entities);
  if (!ran.cartao.ok) return ran;
  const next = porTag(ran.entities, id, tag);
  return { cartao: { ok: true, titulo: `Nasceu ${id}`, linhas: [tag] }, entities: next ?? ran.entities };
}

export function saberPalavra(entities: string, word: string, ids: readonly string[], fact: string): EfeitoComando {
  const id = idDaPalavra(word, ids);
  if (!id) return semPalavra(entities);
  const texto = fact.trim();
  if (!texto || /['\n;\[\]]/.test(texto)) return { cartao: { ok: false, titulo: "O texto fica entre ' '.", linhas: [] }, entities };
  return correrComando(`kno.learn ${id} '${texto}'`, entities);
}

export function ligarPalavra(entities: string, word: string, ids: readonly string[], nome: string, destino: string): EfeitoComando {
  const id = idDaPalavra(word, ids);
  if (!id) return semPalavra(entities);
  const key = nome.trim().toLowerCase();
  const dest = idDaPalavra(destino, ids);
  if (!key || !/^[\p{L}_][\p{L}\p{N}_]*$/u.test(key) || !dest) {
    return { cartao: { ok: false, titulo: "Não entendi.", linhas: [] }, entities };
  }
  return correrComando(`link.set.${key} ${id} ${dest}`, entities);
}

export function maisUmPalavra(
  entities: string,
  word: string,
  hosts: readonly { id: string; tags: Iterable<string> }[],
): EfeitoComando {
  const id = idDaPalavra(word, hosts.map((item) => item.id));
  if (!id) return semPalavra(entities);
  const host = hosts.find((item) => item.id === id);
  if (!host || ![...host.tags].includes("molde")) {
    return { cartao: { ok: false, titulo: "marque como modelo primeiro", linhas: [] }, entities };
  }
  return correrComando(`inst.create ${id}`, entities);
}

export function cartaoNaLinha(
  anterior: number | null,
  linha: number,
  segurar: boolean,
): { limpar: boolean; linha: number; segurar: boolean } {
  if (segurar) return { limpar: false, linha, segurar: false };
  return { limpar: anterior != null && anterior !== linha, linha, segurar: false };
}

export function keysOfDrawer(entity: DrawerHost | undefined, drawer: FbeDrawer): string[] {
  if (!entity) return [];
  if (drawer === "tags") return [...entity.tags].map(String).sort();
  const rec = entity[drawer];
  return rec && typeof rec === "object" ? Object.keys(rec).sort() : [];
}

export function linkTargets(entities: readonly DrawerHost[]): string[] {
  return [...new Set(entities.map((item) => item.id).filter(Boolean))].sort();
}

export function isKnownLinkTarget(raw: string, ids: readonly string[]): boolean {
  const t = raw.trim();
  if (/^#[0-9A-Fa-f]{4}$/.test(t)) return true;
  return ids.includes(t);
}

export function enumStates(entities: readonly DrawerHost[], key: string): string[] {
  const want = key.trim();
  if (!want) return [];
  const out = new Set<string>();
  for (const entity of entities) {
    const rec = entity.enums;
    if (!rec || typeof rec !== "object") continue;
    const value = rec[want];
    if (typeof value === "string" && value.trim()) out.add(value.trim());
    else if (value && typeof value === "object") {
      const slot = value as { current?: unknown; states?: unknown };
      if (Array.isArray(slot.states)) {
        for (const state of slot.states) if (String(state).trim()) out.add(String(state).trim());
      } else if (slot.current != null && String(slot.current).trim()) out.add(String(slot.current).trim());
    }
  }
  return [...out].sort();
}

export function flagBit(raw: string): "true" | "false" | null {
  const t = raw.trim().toLowerCase();
  if (t === "" || t === "true") return "true";
  if (t === "false") return "false";
  return null;
}

export function listItems(raw: string): string[] {
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

export function describeMutation(draft: MutationDraft): string {
  if ((draft.kind ?? "drawer") === "world") {
    const tag = draft.key.trim();
    if (draft.op === "unset") return `DESTROY ${draft.entityId}`;
    return tag ? `CREATE ${draft.entityId}.${tag}` : `CREATE ${draft.entityId}`;
  }
  return `${draft.entityId}.${draft.drawer}.${draft.key}=${draft.value}`;
}

function stripNarrative(raw: string): string {
  const t = raw.trim();
  if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) return t.slice(1, -1);
  return t;
}

export function phrasesOfProject(world: Iterable<DrawerHost> | { values(): Iterable<DrawerHost> } | undefined, rules?: Iterable<{ id: string; narrative?: string }>): PhraseSuggestion[] {
  const entities = world ? ("values" in world && typeof world.values === "function" ? [...world.values()] : [...(world as Iterable<DrawerHost>)]) : [];
  const out: PhraseSuggestion[] = [];
  for (const entity of entities) {
    for (const [key, val] of Object.entries(entity.phrases ?? {})) {
      const insert = String(val ?? "");
      if (!insert) continue;
      out.push({ id: `${entity.id}.phrases.${key}`, label: `${entity.id}.${key}`, insert });
    }
  }
  if (rules) {
    for (const rule of rules) {
      const insert = stripNarrative(rule.narrative ?? "");
      if (!insert) continue;
      out.push({ id: `narrativa:${rule.id}`, label: rule.id, insert });
    }
  }
  return out;
}

export function canUnset(draft: MutationDraft): boolean {
  if ((draft.kind ?? "drawer") === "world") return true;
  return draft.drawer === "tags" || draft.drawer === "flags" || draft.drawer === "lists" || draft.drawer === "hardLinks" || draft.drawer === "softLinks";
}
