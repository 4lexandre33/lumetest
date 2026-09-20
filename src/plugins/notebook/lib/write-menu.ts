import { FBE_DRAWERS, type FbeDrawer } from "../../narrative-engine/lib/types.ts";
import { formatStatInput, isLinkTarget } from "../../narrative-engine/lib/world-model.ts";

export { FBE_DRAWERS, type FbeDrawer, isLinkTarget, formatStatInput };

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

export function entityGuess(quote: string, ids: readonly string[]): string {
  const t = quote.trim();
  if (!t) return ids[0] ?? "";
  const folded = t.toLocaleUpperCase();
  return ids.find((id) => id === t || id.toLocaleUpperCase() === folded) ?? ids[0] ?? "";
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
    if (value != null && String(value).trim()) out.add(String(value).trim());
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
