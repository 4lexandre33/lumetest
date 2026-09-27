import type { FbeDrawer, MutationDraft } from "./write-menu.ts";
import { FBE_DRAWERS, flagBit, isKnownLinkTarget, listItems, emitEntityId } from "./write-menu.ts";
import { formatFuseValue, formatStatInput, isLinkTarget } from "../../narrative-engine/lib/world-model.ts";

export const ANOTACOES_SLICE_START = "# --- lume-anotacoes ---";
export const ANOTACOES_SLICE_END = "# --- /lume-anotacoes ---";

export type NotebookAnnotation = {
  id: string;
  book: string;
  heading: string;
  quote: string;
  do: string;
  column?: number;
};

export type MutableDraft = {
  id: string;
  tags: Set<string>;
  stats: Record<string, number | string>;
  links: Record<string, string>;
  flags: Record<string, string>;
  enums: Record<string, string>;
  phrases: Record<string, string>;
  hardLinks: Record<string, string>;
  lists: Record<string, string[]>;
  fuses: Record<string, string>;
  struct: Record<string, string>;
};

const SUPER = "⁰¹²³⁴⁵⁶⁷⁸⁹";

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function isCadernoLine(line: string): boolean {
  return /^caderno\s*:/.test(fold(line.trim()));
}

export function isAnotacoesMarker(line: string): boolean {
  return /^#\s*---\s*\/?lume-anotacoes\s*---\s*$/.test(line.trim());
}

export function anotacoesStartIndex(text: string): number | null {
  const lines = text.replace(/^\uFEFF/, "").split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    if (/^#\s*---\s*lume-anotacoes\s*---\s*$/.test((lines[i] ?? "").trim())) return i;
  }
  return null;
}

export function stripAnotacoesSlice(source: string): string {
  const start = source.indexOf(ANOTACOES_SLICE_START);
  if (start < 0) return source;
  const end = source.indexOf(ANOTACOES_SLICE_END, start);
  const before = source.slice(0, start).replace(/\n+$/, "");
  const after = end < 0 ? "" : source.slice(end + ANOTACOES_SLICE_END.length).replace(/^\n+/, "");
  if (!before) return after;
  if (!after) return before.endsWith("\n") ? before : `${before}\n`;
  return `${before}\n\n${after}`.replace(/\n+$/, "\n");
}

export function parseAnotacoesSlice(source: string): NotebookAnnotation[] {
  const start = source.indexOf(ANOTACOES_SLICE_START);
  if (start < 0) return [];
  const end = source.indexOf(ANOTACOES_SLICE_END, start);
  const body = end < 0 ? source.slice(start + ANOTACOES_SLICE_START.length) : source.slice(start + ANOTACOES_SLICE_START.length, end);
  const out: NotebookAnnotation[] = [];
  for (const raw of body.split(/\n/)) {
    const trimmed = raw.trim();
    if (!trimmed || isAnotacoesMarker(trimmed)) continue;
    const m = trimmed.match(/^(?:\d+\s+)?(\{.*\})\s*$/);
    if (!m) continue;
    try {
      const parsed = JSON.parse(m[1]!) as Partial<NotebookAnnotation>;
      if (!parsed.id || !parsed.do) continue;
      out.push({
        id: String(parsed.id),
        book: String(parsed.book ?? "book-0"),
        heading: String(parsed.heading ?? ""),
        quote: String(parsed.quote ?? ""),
        do: String(parsed.do),
        ...(typeof parsed.column === "number" ? { column: parsed.column } : {}),
      });
    } catch {
      /* linha lixo na fatia */
    }
  }
  return out;
}

export function writeAnotacoesSlice(text: string, annotations: NotebookAnnotation[]): string {
  const base = stripAnotacoesSlice(text).replace(/\n+$/, "");
  if (!annotations.length) return base ? `${base}\n` : "";
  const body = annotations.map((item, i) => `${i + 1} ${JSON.stringify(item)}`).join("\n");
  const head = base ? `${base}\n\n` : "";
  return `${head}${ANOTACOES_SLICE_START}\n${body}\n${ANOTACOES_SLICE_END}\n`;
}

export function nextAnnotationId(existing: readonly NotebookAnnotation[]): string {
  let n = 1;
  const used = new Set(existing.map((item) => item.id));
  while (used.has(`a${n}`)) n += 1;
  return `a${n}`;
}

export function headingOf(source: string, line: number): string {
  const lines = source.replace(/^\uFEFF/, "").split(/\n/);
  for (let i = Math.min(line, lines.length) - 1; i >= 0; i--) {
    const trimmed = (lines[i] ?? "").trim();
    if (/^###\s+/.test(trimmed)) return trimmed.replace(/^###\s+/, "").replace(/^\d+(?:\.\d+)*\s+/, "").trim();
    if (/^##\s+/.test(trimmed) && !/^###/.test(trimmed)) return trimmed.replace(/^##\s+/, "").replace(/^\d+(?:\.\d+)*\s+/, "").trim();
  }
  return "";
}

function headingFold(title: string): string {
  return fold(title.replace(/^\d+(?:\.\d+)*\s+/, ""));
}

export type RebindHit = { line: number; column: number; length: number } | { error: "missing" | "ambiguous" };

export function rebindAnnotation(prose: string, annotation: NotebookAnnotation): RebindHit {
  const quote = annotation.quote.trim();
  if (!quote) return { error: "missing" };
  const want = headingFold(annotation.heading);
  const lines = prose.replace(/^\uFEFF/, "").split(/\n/);
  let heading = "";
  const hits: { line: number; column: number; length: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = (lines[i] ?? "").trim();
    if (/^###\s+/.test(trimmed)) heading = headingFold(trimmed.replace(/^###\s+/, ""));
    else if (/^##\s+/.test(trimmed) && !/^###/.test(trimmed)) heading = headingFold(trimmed.replace(/^##\s+/, ""));
    if (want && heading !== want) continue;
    if (!want && heading) continue;
    const column = (lines[i] ?? "").indexOf(quote);
    if (column < 0) continue;
    hits.push({ line: i + 1, column, length: quote.length });
  }
  if (hits.length === 1) return hits[0]!;
  if (hits.length > 1) {
    if (annotation.column != null) {
      const cols = hits.filter((hit) => hit.column === annotation.column);
      if (cols.length === 1) return cols[0]!;
    }
    return { error: "ambiguous" };
  }
  return { error: "missing" };
}

export function cadernoBookRanges(text: string): { id: string; start: number; end: number }[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\n/);
  const sliceAt = anotacoesStartIndex(text);
  const limit = sliceAt ?? lines.length;
  const starts: number[] = [];
  for (let i = 0; i < limit; i++) {
    if (isCadernoLine(lines[i] ?? "")) starts.push(i);
  }
  if (!starts.length) {
    if (!text.trim() || limit === 0) return [];
    return [{ id: "book-0", start: 0, end: limit }];
  }
  const ranges: { id: string; start: number; end: number }[] = [];
  let lead = 0;
  while (lead < starts[0]! && !(lines[lead] ?? "").trim()) lead += 1;
  if (lead < starts[0]!) ranges.push({ id: `book-${ranges.length}`, start: 0, end: starts[0]! });
  for (let s = 0; s < starts.length; s++) {
    ranges.push({
      id: `book-${ranges.length}`,
      start: starts[s]!,
      end: s + 1 < starts.length ? starts[s + 1]! : limit,
    });
  }
  return ranges.filter((range) => range.start < range.end);
}

export function doLines(doText: string): string[] {
  return doText.split(/\n/).map((line) => line.trim()).filter(Boolean);
}

export function doFromDraft(draft: MutationDraft, knownIds?: readonly string[]): string | null {
  const id = emitEntityId(draft.entityId, knownIds);
  if (!id) return null;
  const key = draft.key.trim();
  const value = draft.value.trim();
  const unset = draft.op === "unset";
  if ((draft.kind ?? "drawer") === "world") {
    if (unset) return `DESTROY ${id}`;
    if (id.includes(".")) return null;
    if (key && (FBE_DRAWERS as readonly string[]).includes(key)) return null;
    return key ? `CREATE ${id}.${key}` : `CREATE ${id}`;
  }
  const drawer: FbeDrawer = draft.drawer;
  switch (drawer) {
    case "tags": {
      const tag = key || value;
      if (!tag) return null;
      return unset ? `REMOVE_TAG ${id} ${tag}` : `ADD_TAG ${id} ${tag}`;
    }
    case "stats": {
      if (unset) return null;
      const shown = formatStatInput(value);
      return key && shown ? `SET_STAT ${id}.${key} ${shown}` : null;
    }
    case "flags": {
      if (!key) return null;
      if (unset) return `SET_FLAG ${id}.${key} false`;
      const bit = flagBit(value);
      if (!bit) return null;
      return `SET_FLAG ${id}.${key} ${bit}`;
    }
    case "enums":
      if (unset) return null;
      return key && value && !value.includes(",") ? `SET_ENUM ${id}.${key} ${value}` : null;
    case "phrases":
      if (unset) return null;
      return key && value ? `SET_PHRASE ${id}.${key} ${value}` : null;
    case "hardLinks":
      if (unset) return key ? `UNLINK ${id}.${key}` : null;
      if (!key || !value) return null;
      const dest = emitEntityId(value, knownIds);
      if (!dest || !isLinkTarget(dest)) return null;
      if (knownIds && !isKnownLinkTarget(dest, knownIds)) return null;
      return `SET_LINK ${id}.hardLinks.${key} ${dest}`;
    case "softLinks":
      if (unset) return key ? `UNLINK ${id}.${key}` : null;
      if (!key || !value) return null;
      {
        const dest = emitEntityId(value, knownIds);
        if (!dest || !isLinkTarget(dest)) return null;
        if (knownIds && !isKnownLinkTarget(dest, knownIds)) return null;
        return `SET_LINK ${id}.softLinks.${key} ${dest}`;
      }
    case "lists": {
      if (!key) return null;
      const items = listItems(value);
      if (unset) {
        if (!items.length) return `CLEAR ${id}.${key}`;
        return items.map((item) => `REMOVE ${id}.${key} ${item}`).join("\n");
      }
      return [`CLEAR ${id}.${key}`, ...items.map((item) => `PUSH ${id}.${key} ${item}`)].join("\n");
    }
    case "fuses": {
      if (unset) return null;
      const fuse = formatFuseValue(value);
      return key && fuse ? `SET_FUSE ${id}.${key} ${fuse}` : null;
    }
    case "struct":
      return null;
    default:
      return null;
  }
}

function takePath(rest: string): { id: string; parts: string[]; value: string } | null {
  const m = rest.trim().match(/^(\$|#[0-9A-Fa-f]{4}|@[\p{L}_][\p{L}\p{N}\p{M}_]*|[\p{L}_][\p{L}\p{N}\p{M}_]*)((?:\.(?:@?[#\p{L}_][\p{L}\p{N}\p{M}_]*))*)(?:\s+([\s\S]+))?$/u);
  if (!m) return null;
  const parts = (m[2] ?? "").split(".").filter(Boolean);
  return { id: m[1]!, parts, value: (m[3] ?? "").trim() };
}

function drawerKey(parts: string[]): { drawer?: string; key: string } | null {
  if (parts.length === 2) return { drawer: parts[0], key: parts[1]! };
  if (parts.length === 1) return { key: parts[0]! };
  return null;
}

export function targetIdOfDo(doLine: string): string | null {
  for (const line of doLines(doLine)) {
    const tagged = line.match(/^(ADD_TAG|REMOVE_TAG)\s+(\S+)/i);
    if (tagged) return tagged[2] ?? null;
    const rest = line.replace(/^[A-Z_]+\s+/i, "");
    const id = takePath(rest)?.id ?? null;
    if (id) return id;
  }
  return null;
}

function applyOneNamedDo(draft: MutableDraft, doLine: string): boolean {
  const t = doLine.trim();
  const verb = (t.match(/^([A-Z_]+)\b/i)?.[1] ?? "").toUpperCase();
  const rest = t.slice(verb.length).trim();
  if (verb === "ADD_TAG" || verb === "REMOVE_TAG") {
    const bits = rest.split(/\s+/);
    const tag = bits[1] ?? bits[0];
    if (!tag) return false;
    if (verb === "ADD_TAG") draft.tags.add(tag);
    else draft.tags.delete(tag);
    return true;
  }
  if (verb === "CREATE") {
    const path = takePath(rest);
    if (!path) return false;
    const tag = path.parts[0];
    if (tag) draft.tags.add(tag);
    return true;
  }
  if (verb === "DESTROY") return true;
  const path = takePath(rest);
  if (!path) return false;
  const dk = drawerKey(path.parts);
  if (!dk) return false;
  const key = dk.key;
  const value = path.value;
  if (verb === "SET_STAT") {
    const shown = formatStatInput(value);
    if (!shown) return false;
    draft.stats[key] = shown.includes("[") ? shown : Number(shown);
    return true;
  }
  if (verb === "ADD_STAT") {
    const n = Number(value.replace(",", "."));
    if (!Number.isFinite(n)) return false;
    const cur = draft.stats[key];
    const base = typeof cur === "number" ? cur : Number(String(cur ?? "").replace(",", ".")) || 0;
    draft.stats[key] = base + n;
    return true;
  }
  if (verb === "SET_FLAG") {
    draft.flags[key] = value || "true";
    return true;
  }
  if (verb === "SET_ENUM") {
    draft.enums[key] = value;
    return true;
  }
  if (verb === "SET_PHRASE") {
    draft.phrases[key] = value;
    return true;
  }
  if (verb === "SET_LINK") {
    if (value && !isLinkTarget(value)) return false;
    if (dk.drawer === "hardLinks") draft.hardLinks[key] = value;
    else draft.links[key] = value;
    return true;
  }
  if (verb === "UNLINK" || verb === "CLEAR_LINK") {
    delete draft.links[key];
    delete draft.hardLinks[key];
    return true;
  }
  if (verb === "PUSH" || verb === "ADD_UNIQUE") {
    const list = draft.lists[key] ?? (draft.lists[key] = []);
    if (verb === "ADD_UNIQUE" && list.includes(value)) return true;
    list.push(value);
    return true;
  }
  if (verb === "REMOVE") {
    draft.lists[key] = (draft.lists[key] ?? []).filter((item) => item !== value);
    return true;
  }
  if (verb === "CLEAR") {
    draft.lists[key] = [];
    return true;
  }
  if (verb === "POP") {
    const list = draft.lists[key] ?? [];
    list.pop();
    draft.lists[key] = list;
    return true;
  }
  if (verb === "SET_FUSE") {
    const fuse = formatFuseValue(value);
    if (!fuse) return false;
    draft.fuses[key] = fuse;
    return true;
  }
  if (verb === "STRUCT") {
    if (!value) {
      delete draft.struct[key];
      return true;
    }
    draft.struct[key] = value;
    return true;
  }
  return false;
}

export function applyNamedDoToDraft(draft: MutableDraft, doLine: string): boolean {
  const lines = doLines(doLine);
  if (!lines.length) return false;
  let ok = true;
  for (const line of lines) {
    if (!applyOneNamedDo(draft, line)) ok = false;
  }
  return ok;
}

export function superscriptsOf(index: number): string {
  const n = index + 1;
  return String(n)
    .split("")
    .map((d) => SUPER[Number(d)] ?? d)
    .join("");
}

export type MarkHit = { mark: string; id: string; column: number; length: number };

export function markHitsOnPage(prose: string, annotations: readonly NotebookAnnotation[]): Map<number, MarkHit[]> {
  const hits = new Map<number, MarkHit[]>();
  let ordinal = 0;
  for (const annotation of annotations) {
    const hit = rebindAnnotation(prose, annotation);
    if (!("line" in hit)) continue;
    const mark = superscriptsOf(ordinal);
    ordinal += 1;
    const list = hits.get(hit.line) ?? [];
    list.push({ mark, id: annotation.id, column: hit.column, length: hit.length });
    hits.set(hit.line, list);
  }
  return hits;
}

export function marksOnPage(prose: string, annotations: readonly NotebookAnnotation[]): Map<number, string[]> {
  const marks = new Map<number, string[]>();
  for (const [line, hits] of markHitsOnPage(prose, annotations)) {
    marks.set(line, hits.map((item) => item.mark));
  }
  return marks;
}

export function addAnnotation(text: string, annotation: NotebookAnnotation): string {
  return writeAnotacoesSlice(text, [...parseAnotacoesSlice(text), annotation]);
}

export function removeAnnotation(text: string, id: string): string {
  return writeAnotacoesSlice(text, parseAnotacoesSlice(text).filter((item) => item.id !== id));
}

export function insertBeforeAnotacoes(text: string, block: string): string {
  const sliceAt = text.indexOf(ANOTACOES_SLICE_START);
  const chunk = block.replace(/\n+$/, "");
  if (sliceAt < 0) {
    if (!text.trim()) return `${chunk}\n`;
    return `${text.replace(/\n+$/, "")}\n\n${chunk}\n`;
  }
  const before = text.slice(0, sliceAt).replace(/\n+$/, "");
  const after = text.slice(sliceAt);
  const head = before ? `${before}\n\n` : "";
  return `${head}${chunk}\n\n${after}`.replace(/\n{3,}/g, "\n\n");
}

