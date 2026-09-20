import { FBE_DRAWERS, type Entity, type FbeDrawer, type WorldModel } from "../../narrative-engine/lib/types.ts";
import { applyChanges, parseDoLine } from "../../narrative-engine/lib/rule-engine.ts";
import { cloneWorldModel, compileEntityFile } from "../../narrative-engine/lib/world-model.ts";
import { compileNotebook } from "./notebook.ts";
import {
  cadernoBookRanges,
  doLines,
  parseAnotacoesSlice,
  rebindAnnotation,
  stripAnotacoesSlice,
  targetIdOfDo,
  type NotebookAnnotation,
} from "./annotations.ts";

export type DrawerSnap = {
  drawer: FbeDrawer;
  before: string;
  after: string;
  changed: boolean;
};

export type TimelineEntry = {
  annotation: NotebookAnnotation;
  line: number | null;
  book: string;
  entityId: string | null;
  after: Entity | null;
  diffs: DrawerSnap[];
};

function pairs(rec: Record<string, unknown> | undefined, map: (value: unknown) => string = String): string {
  if (!rec) return "";
  return Object.entries(rec)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${map(value)}`)
    .join(", ");
}

export function snapDrawer(entity: Entity | null | undefined, drawer: FbeDrawer): string {
  if (!entity) return "";
  switch (drawer) {
    case "tags":
      return [...entity.tags].sort().join(", ");
    case "stats":
      return pairs(entity.stats, (value) => (typeof value === "number" ? String(value) : String((value as { value: number }).value)));
    case "flags":
      return pairs(entity.flags, (value) => (value ? "true" : "false"));
    case "enums":
      return pairs(entity.enums);
    case "phrases":
      return pairs(entity.phrases);
    case "hardLinks":
      return pairs(entity.hardLinks);
    case "softLinks":
      return pairs(entity.softLinks);
    case "lists":
      return pairs(entity.lists, (value) => (Array.isArray(value) ? value.join("|") : String(value)));
    case "fuses":
      return pairs(entity.fuses, (value) => {
        const fuse = value as { remaining?: number; targetId?: string };
        return `${fuse.remaining ?? 0}>${fuse.targetId ?? ""}`;
      });
    case "struct":
      return pairs(entity.struct, (value) => JSON.stringify(value));
    default:
      return "";
  }
}

export function diffDrawers(before: Entity | null | undefined, after: Entity | null | undefined): DrawerSnap[] {
  return FBE_DRAWERS.map((drawer) => {
    const prev = snapDrawer(before, drawer);
    const next = snapDrawer(after, drawer);
    return { drawer, before: prev, after: next, changed: prev !== next };
  });
}

export function orderAnnotations(text: string, annotations: readonly NotebookAnnotation[]): { annotation: NotebookAnnotation; line: number | null; book: string }[] {
  const prose = stripAnotacoesSlice(text);
  const books = cadernoBookRanges(prose);
  const lines = prose.replace(/^\uFEFF/, "").split(/\n/);
  return annotations.map((annotation, index) => {
    const book = books.find((item) => item.id === annotation.book) ?? (books.length === 1 ? books[0] : undefined);
    const slice = book ? lines.slice(book.start, book.end).join("\n") : prose;
    const hit = rebindAnnotation(slice, annotation);
    const local = "line" in hit ? hit.line : null;
    const global = local != null ? (book ? book.start : 0) + local : null;
    return { annotation, line: global, book: annotation.book, index };
  }).sort((a, b) => {
    const bookCmp = a.book.localeCompare(b.book);
    if (bookCmp) return bookCmp;
    const la = a.line ?? Number.MAX_SAFE_INTEGER;
    const lb = b.line ?? Number.MAX_SAFE_INTEGER;
    if (la !== lb) return la - lb;
    return a.index - b.index;
  });
}

function applyDo(world: WorldModel, doLine: string, triggerId: string): WorldModel {
  let next = world;
  for (const line of doLines(doLine)) {
    try {
      const parsed = parseDoLine(line);
      if (!parsed.change) continue;
      next = applyChanges(next, [parsed.change], triggerId);
    } catch {
      /* do: inválido nesta linha */
    }
  }
  return next;
}

export function authorshipBaseWorld(text: string, entitiesSource = ""): WorldModel {
  const motor = compileEntityFile(entitiesSource).worldModel;
  const caderno = compileEntityFile(compileNotebook(stripAnotacoesSlice(text)).entitiesSource).worldModel;
  const world = cloneWorldModel(motor);
  const extra = cloneWorldModel(caderno);
  for (const [id, entity] of extra) {
    if (!world.has(id)) world.set(id, entity);
  }
  return world;
}

export function authorshipTimeline(text: string, entitiesSource = ""): TimelineEntry[] {
  const annotations = parseAnotacoesSlice(text);
  if (!annotations.length) return [];
  const ordered = orderAnnotations(text, annotations);
  let world = cloneWorldModel(authorshipBaseWorld(text, entitiesSource));
  const out: TimelineEntry[] = [];
  for (const item of ordered) {
    const entityId = targetIdOfDo(item.annotation.do);
    const before = cloneWorldModel(world);
    const beforeEnt = entityId ? before.get(entityId) ?? null : null;
    world = applyDo(world, item.annotation.do, entityId ?? "");
    const snapped = cloneWorldModel(world);
    const afterEnt = entityId ? snapped.get(entityId) ?? null : null;
    out.push({
      annotation: item.annotation,
      line: item.line,
      book: item.book,
      entityId,
      after: afterEnt,
      diffs: diffDrawers(beforeEnt, afterEnt),
    });
  }
  return out;
}

export function entityHistory(entries: readonly TimelineEntry[], entityId: string | null | undefined): TimelineEntry[] {
  if (!entityId) return [];
  return entries.filter((item) => item.entityId === entityId);
}

export function changedSnaps(entry: TimelineEntry): DrawerSnap[] {
  return entry.diffs.filter((snap) => snap.changed);
}

export type EntityOrigin = "caderno" | "anotacao" | "motor";

export function entityOrigin(id: string, text: string, entitiesSource = ""): EntityOrigin {
  const created = parseAnotacoesSlice(text).some((item) => {
    const target = targetIdOfDo(item.do);
    return target === id && /^(CREATE|DESTROY)\b/i.test(item.do.trim());
  });
  if (created) return "anotacao";
  const caderno = compileEntityFile(compileNotebook(stripAnotacoesSlice(text)).entitiesSource).worldModel;
  if (caderno.has(id)) return "caderno";
  if (compileEntityFile(entitiesSource).worldModel.has(id)) return "motor";
  return "anotacao";
}
