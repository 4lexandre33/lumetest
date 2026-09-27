import { lineColumnFromOffset } from "./source-ops.ts";
import type { CompletionContext, CompletionItem, Vocabulary } from "./complete.ts";
import type { CompiledTaxonomy } from "./taxonomy.ts";
import type { Entity, FbeDrawer, WorldModel } from "./types.ts";
import { FBE_DRAWERS } from "./types.ts";
import { withInheritedDrawers } from "./world-model.ts";

const DRAWERS = new Set<string>(FBE_DRAWERS);
const VERBS = [
  "ADD_TAG",
  "REMOVE_TAG",
  "SET_STAT",
  "ADD_STAT",
  "MUL_STAT",
  "SET_FLAG",
  "SET_ENUM",
  "SET_LINK",
  "UNLINK",
  "SET_PHRASE",
  "SET_FUSE",
  "PUSH",
  "POP",
  "REMOVE",
  "CLEAR",
  "ADD_UNIQUE",
  "CREATE",
  "DESTROY",
  "SPAWN",
] as const;

const VERB_DRAWER: Record<string, FbeDrawer | "create" | "destroy" | "spawn"> = {
  ADD_TAG: "tags",
  REMOVE_TAG: "tags",
  SET_STAT: "stats",
  ADD_STAT: "stats",
  MUL_STAT: "stats",
  SET_FLAG: "flags",
  SET_ENUM: "enums",
  SET_LINK: "links" as FbeDrawer,
  UNLINK: "links" as FbeDrawer,
  SET_PHRASE: "phrases",
  SET_FUSE: "fuses",
  PUSH: "lists",
  POP: "lists",
  REMOVE: "lists",
  CLEAR: "lists",
  ADD_UNIQUE: "lists",
  CREATE: "create",
  DESTROY: "destroy",
  SPAWN: "spawn",
};

const VALUE_VERBS = new Set(["SET_FLAG", "SET_ENUM", "SET_LINK"]);

function dotCompletion(before: string): boolean {
  return /\.[\p{L}\p{N}_]*$/u.test(before);
}

function ctxOf(source: string, offset: number, replaceStart: number, prefix: string): CompletionContext {
  const { line, column } = lineColumnFromOffset(source, offset);
  return { slot: "degrau", prefix, replaceStart, replaceEnd: offset, line, column };
}

function ownerId(source: string, offset: number): string | null {
  const before = source.slice(0, offset);
  const re = /@([\p{L}_][\p{L}\p{N}\p{M}_]*)\.\{|\}/gu;
  let depth = 0;
  let owner: string | null = null;
  let match: RegExpExecArray | null;
  while ((match = re.exec(before))) {
    if (match[0] === "}") {
      depth = Math.max(0, depth - 1);
      if (depth === 0) owner = null;
    } else {
      if (depth === 0) owner = `@${match[1]}`;
      depth += 1;
    }
  }
  return depth > 0 ? owner : null;
}

function bareKeys(entity: Entity, drawer: string): string[] {
  if (drawer === "tags") return [...entity.tags];
  if (drawer === "links") return Object.keys(entity.links);
  const rec = entity[drawer as FbeDrawer];
  if (!rec || typeof rec !== "object" || rec instanceof Set) return [];
  return Object.keys(rec as Record<string, unknown>);
}

function keyed(entity: Entity, world: WorldModel, taxonomy: CompiledTaxonomy | null | undefined, drawer: string): { key: string; inherited: boolean }[] {
  const own = new Set(bareKeys(entity, drawer));
  const view = withInheritedDrawers(entity, world, taxonomy);
  const all = new Set([...own, ...bareKeys(view, drawer)]);
  return [...all].sort().map((key) => ({ key, inherited: !own.has(key) }));
}

function entityOf(vocab: Vocabulary, id: string): Entity | null {
  const world = vocab.worldModel;
  if (!world) return null;
  return world.get(id) ?? null;
}

function ids(vocab: Vocabulary): CompletionItem[] {
  return (vocab.entityIds ?? []).map((id) => ({ label: id, insert: id, kind: "id" as const, detail: "entidade" }));
}

function drawerItems(): CompletionItem[] {
  return FBE_DRAWERS.map((drawer) => ({
    label: drawer,
    insert: drawer,
    kind: "keyword" as const,
    detail: "gaveta",
  }));
}

function keyItems(vocab: Vocabulary, id: string, drawer: string): CompletionItem[] {
  const entity = entityOf(vocab, id);
  if (!entity || !vocab.worldModel) return [];
  const kind = drawer === "tags" ? "tag" : drawer === "stats" ? "stat" : drawer === "links" || drawer === "hardLinks" || drawer === "softLinks" ? "link" : "prop";
  return keyed(entity, vocab.worldModel, vocab.taxonomy, drawer).map((item) => ({
    label: item.key,
    insert: item.key,
    kind: kind as CompletionItem["kind"],
    detail: item.inherited ? "herdada" : drawer === "links" ? "link" : drawer.replace(/s$/, ""),
  }));
}

function flagValues(): CompletionItem[] {
  return [
    { label: "true", insert: " true", kind: "prop", detail: "valor" },
    { label: "false", insert: " false", kind: "prop", detail: "valor" },
  ];
}

function enumValues(vocab: Vocabulary, id: string, key: string): CompletionItem[] {
  const entity = entityOf(vocab, id);
  if (!entity || !vocab.worldModel) return [];
  const view = withInheritedDrawers(entity, vocab.worldModel, vocab.taxonomy);
  const slot = view.enums[key];
  const states = slot?.states ?? [];
  return states.map((state) => ({ label: state, insert: ` ${state}`, kind: "prop" as const, detail: "estado" }));
}

function linkValues(vocab: Vocabulary): CompletionItem[] {
  return [
    ...ids(vocab),
    { label: "$", insert: " $", kind: "bang" as const, detail: "gatilho" },
  ];
}

function verbs(): CompletionItem[] {
  return VERBS.map((verb) => ({ label: verb, insert: `${verb} `, kind: "keyword" as const, detail: "verbo" }));
}

function triggers(vocab: Vocabulary): CompletionItem[] {
  return [
    ...ids(vocab),
    { label: "*", insert: "*", kind: "star", detail: "qualquer" },
    { label: "$", insert: "$", kind: "bang", detail: "gatilho" },
  ];
}

function conditions(vocab: Vocabulary): CompletionItem[] {
  return [
    { label: "TEM", insert: "TEM ", kind: "keyword", detail: "possui" },
    { label: "NAO_TEM", insert: "NAO_TEM ", kind: "keyword", detail: "não possui" },
    { label: "(link", insert: "(link ", kind: "keyword", detail: "andar o link" },
    ...ids(vocab),
  ];
}

function ruleStep(source: string, offset: number, before: string, lineStart: number, vocab: Vocabulary): { ctx: CompletionContext; items: CompletionItem[] } {
  const dot = before.lastIndexOf(".");
  const prefix = before.slice(dot + 1);
  const left = before.slice(0, dot).trim();
  const head = left.match(/^(on|if|do)\s*:\s*([\s\S]*)$/i);
  const gestureAt = lineStart + dot;
  const keepAt = gestureAt + 1;
  const empty = ctxOf(source, offset, keepAt, prefix);
  if (!head) return { ctx: empty, items: [] };
  const mode = head[1]!.toLowerCase();
  const rest = (head[2] ?? "").trim();
  const parts = rest.split(/\s+/).filter(Boolean);
  const verb = parts[0]?.toUpperCase() ?? "";
  const tail = parts.slice(1).join(" ");

  if (mode === "do" && rest === "") {
    return { ctx: ctxOf(source, offset, gestureAt, prefix), items: verbs() };
  }
  if ((mode === "on" || mode === "if") && rest === "") {
    return { ctx: ctxOf(source, offset, gestureAt, prefix), items: mode === "on" ? triggers(vocab) : conditions(vocab) };
  }
  if (mode === "if" && /^(TEM|NAO_TEM)$/i.test(rest)) {
    return { ctx: ctxOf(source, offset, gestureAt, prefix), items: ids(vocab) };
  }
  if (/^\(link$/i.test(rest)) {
    return { ctx: ctxOf(source, offset, gestureAt, prefix), items: ids(vocab) };
  }
  const walked = rest.match(/^\(link\s+(@[\p{L}_][\p{L}\p{N}\p{M}_]*)$/u);
  if (walked) return { ctx: ctxOf(source, offset, keepAt, prefix), items: keyItems(vocab, walked[1]!, "links") };

  if (mode === "do" && parts.length === 1 && VERB_DRAWER[verb]) {
    return { ctx: ctxOf(source, offset, gestureAt, prefix), items: ids(vocab) };
  }

  const path = (mode === "do" ? tail : rest).match(/^(@[\p{L}_][\p{L}\p{N}\p{M}_]*)(?:\.([\p{L}_][\p{L}\p{N}\p{M}_]*))?(?:\.([\p{L}_][\p{L}\p{N}\p{M}_]*))?$/u);
  if (!path) return { ctx: empty, items: [] };
  const id = path[1]!;
  const mid = path[2];
  const last = path[3];
  if (mode === "do" && VALUE_VERBS.has(verb) && last) {
    if (verb === "SET_FLAG") return { ctx: ctxOf(source, offset, gestureAt, prefix), items: flagValues() };
    if (verb === "SET_ENUM") return { ctx: ctxOf(source, offset, gestureAt, prefix), items: enumValues(vocab, id, last) };
    return { ctx: ctxOf(source, offset, gestureAt, prefix), items: linkValues(vocab) };
  }
  if (last) return { ctx: empty, items: [] };
  if (mid && DRAWERS.has(mid)) return { ctx: ctxOf(source, offset, keepAt, prefix), items: keyItems(vocab, id, mid) };
  if (mid && mode === "do") {
    const drawer = VERB_DRAWER[verb];
    if (drawer === "flags") return { ctx: ctxOf(source, offset, gestureAt, prefix), items: flagValues() };
    if (drawer === "enums") return { ctx: ctxOf(source, offset, gestureAt, prefix), items: enumValues(vocab, id, mid) };
    if (drawer === "links" && verb === "SET_LINK") return { ctx: ctxOf(source, offset, gestureAt, prefix), items: linkValues(vocab) };
    return { ctx: empty, items: [] };
  }
  if (!mid && mode === "do") {
    const drawer = VERB_DRAWER[verb];
    if (!drawer || drawer === "destroy" || drawer === "spawn") return { ctx: empty, items: [] };
    if (drawer === "create") return { ctx: ctxOf(source, offset, keepAt, prefix), items: keyItems(vocab, id, "tags") };
    return { ctx: ctxOf(source, offset, keepAt, prefix), items: keyItems(vocab, id, drawer) };
  }
  if (!mid) return { ctx: ctxOf(source, offset, keepAt, prefix), items: drawerItems() };
  return { ctx: empty, items: [] };
}

function entityStep(source: string, offset: number, before: string, lineStart: number, vocab: Vocabulary): { ctx: CompletionContext; items: CompletionItem[] } | null {
  const owner = ownerId(source, offset);
  if (!owner) return null;
  const indent = before.match(/^\s*/)?.[0].length ?? 0;
  const body = before.slice(indent);
  const dot = body.lastIndexOf(".");
  if (dot < 0) return null;
  const prefix = body.slice(dot + 1);
  const at = (from: number) => ctxOf(source, offset, lineStart + indent + from, prefix);
  if (dot === 0 && /^[\p{L}\p{N}_]*$/u.test(prefix)) {
    return {
      ctx: at(0),
      items: FBE_DRAWERS.map((drawer) => ({ label: drawer, insert: `${drawer}: `, kind: "keyword" as const, detail: "gaveta" })),
    };
  }
  const key = body.match(/^(tags|stats|flags|enums|phrases|hardLinks|softLinks|lists|fuses|struct)\.([\p{L}\p{N}_]*)$/u);
  if (key && body.endsWith(prefix) && dot === key[1]!.length) {
    return {
      ctx: at(0),
      items: keyItems(vocab, owner, key[1]!).map((item) => ({ ...item, insert: `${key[1]}: ${item.label}` })),
    };
  }
  const valued = body.match(/^(flags|enums)\.([\p{L}_][\p{L}\p{N}\p{M}_]*)\.([\p{L}\p{N}_]*)$/u);
  if (valued) {
    const drawer = valued[1]!;
    const name = valued[2]!;
    const items = drawer === "flags"
      ? flagValues().map((item) => ({ ...item, insert: `${drawer}: ${name}=${item.label}` }))
      : enumValues(vocab, owner, name).map((item) => ({ ...item, insert: `${drawer}: ${name}=${item.label}` }));
    return { ctx: at(0), items };
  }
  return { ctx: at(dot + 1), items: [] };
}

export function degrauAt(source: string, kind: string, offset: number, vocab: Vocabulary): { ctx: CompletionContext; items: CompletionItem[] } | null {
  const lineStart = source.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
  const before = source.slice(lineStart, offset);
  if (!dotCompletion(before)) return null;
  if (kind === "rules") return ruleStep(source, offset, before, lineStart, vocab);
  if (kind === "entities") return entityStep(source, offset, before, lineStart, vocab);
  return null;
}
