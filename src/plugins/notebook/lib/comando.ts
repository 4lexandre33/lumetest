import type { Entity, StatValue } from "../../narrative-engine/lib/types.ts";
import { canonicalEntityId, cloneEntity, compileEntityFile, formatFuseValue, formatStatInput, isCanonicalEntityId, isSystemEntityId, serializeEntityBlock, shortCodeFromSlug } from "../../narrative-engine/lib/world-model.ts";
import { deleteEntityBlock, handwrittenInsertAt, inCadernoSlice, insertEntity, locateEntityBlock } from "../../narrative-engine/lib/source-ops.ts";
import { FBE_DRAWERS, type FbeDrawer } from "../../narrative-engine/lib/types.ts";
import { headingOf, rebindAnnotation } from "./annotations.ts";

export type CartaoComando = {
  ok: boolean;
  titulo: string;
  linhas: string[];
};

/** A lista que `> help` mostra. */
export const LISTA_COMANDOS = [
  "ent — criar, mostrar, listar, apagar",
  "id — nome e descrição",
  "mut — gavetas",
  "inst — molde e cópia",
  "link — ligação",
  "kno — o que alguém sabe",
  "que — perguntar ao mundo",
  "sea — buscar",
  "aud — o que não fecha",
  "rul — leis",
  "snip — moldes",
  "help — esta lista",
  "exp — levar a prosa",
];

export type AnotacaoComando = {
  heading: string;
  quote: string;
  do: string;
  column: number;
};

export type EfeitoComando = {
  cartao: CartaoComando;
  entities: string;
  mut?: { do: string; linhas: string[]; id: string };
};

/** O corpo se a linha é comando (`>`). `null` se não é. */
export function corpoComando(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith(">")) return null;
  return trimmed.slice(1).trim();
}

function fail(titulo: string, entities: string): EfeitoComando {
  return { cartao: { ok: false, titulo, linhas: [] }, entities };
}

function ok(titulo: string, linhas: string[], entities: string): EfeitoComando {
  return { cartao: { ok: true, titulo, linhas }, entities };
}

function lex(corpo: string): string[] | null {
  const out: string[] = [];
  let i = 0;
  while (i < corpo.length) {
    while (corpo[i] === " " || corpo[i] === "\t") i += 1;
    if (i >= corpo.length) break;
    const ch = corpo[i];
    if (ch === '"') return null;
    if (ch === "'") {
      const end = corpo.indexOf("'", i + 1);
      if (end < 0) return null;
      out.push(corpo.slice(i, end + 1));
      i = end + 1;
      continue;
    }
    let j = i;
    while (j < corpo.length && corpo[j] !== " " && corpo[j] !== "\t") j += 1;
    out.push(corpo.slice(i, j));
    i = j;
  }
  return out;
}

function asId(raw: string): string | null {
  if (!raw || raw.startsWith("'") || raw.startsWith('"')) return null;
  const id = canonicalEntityId(raw);
  return isCanonicalEntityId(id) ? id : null;
}

function quoted(raw: string | undefined): string | null {
  if (!raw || raw[0] !== "'") return null;
  const m = raw.match(/^'([^']*)'$/);
  return m ? m[1]! : null;
}

function blockAt(source: string, line: number): number {
  const lines = source.split("\n");
  let at = 0;
  for (let i = 0; i < line - 1; i++) at += (lines[i]?.length ?? 0) + 1;
  return at;
}

function vemDoCaderno(source: string, id: string): boolean {
  const loc = locateEntityBlock(source, id);
  if (!loc) return false;
  return inCadernoSlice(source, blockAt(source, loc.startLine));
}

function setField(source: string, id: string, field: "name" | "description", value: string): string | null {
  const loc = locateEntityBlock(source, id);
  if (!loc) return null;
  const lines = source.split("\n");
  const nextLine = `  ${field}: ${value ? `'${value}'` : ""};`;
  const re = new RegExp(`^\\s*${field}\\s*:`, "i");
  for (let i = loc.startLine - 1; i < loc.endLine; i++) {
    if (re.test(lines[i] ?? "")) {
      lines[i] = nextLine;
      return lines.join("\n");
    }
  }
  lines.splice(loc.endLine - 1, 0, nextLine);
  return lines.join("\n");
}

function mundo(entities: string) {
  return compileEntityFile(entities).worldModel;
}

function drawerOf(raw: string): FbeDrawer | null {
  const want = raw.toLowerCase() === "list" ? "lists" : raw.toLowerCase();
  return FBE_DRAWERS.find((drawer) => drawer.toLowerCase() === want) ?? null;
}

function pathOf(raw: string): { id: string; key: string } | null {
  const head = raw.split(".")[0] ?? "";
  const id = asId(head);
  if (!id) return null;
  const dot = raw.indexOf(".");
  const key = dot < 0 ? "" : raw.slice(dot + 1);
  if (key.includes(".")) return null;
  return { id, key };
}

function identOf(raw: string | undefined): string | null {
  if (!raw || !/^[\p{L}_][\p{L}\p{N}_]*$/u.test(raw)) return null;
  return raw;
}

function itemOf(raw: string | undefined): string | null {
  if (!raw) return null;
  const text = quoted(raw);
  if (text != null) return text.includes(";") ? null : text;
  if (raw.startsWith("'") || raw.startsWith('"')) return null;
  if (identOf(raw) || /^-?\d+(?:[.,]\d+)?$/.test(raw) || raw === "true" || raw === "false") return raw;
  return null;
}

function knownId(raw: string, entities: string): string | null {
  const id = asId(raw);
  if (!id) return null;
  const world = mundo(entities);
  if (world.has(id) || locateEntityBlock(entities, id)) return id;
  return null;
}

function mutDe(parts: string[], entities: string): EfeitoComando | null {
  const verb = (parts[0] ?? "").toLowerCase();
  if (!verb.startsWith("mut.") && verb !== "mut") return null;
  const bits = verb.split(".");
  if (bits.length < 2 || !bits[1]) return fail("Falta o comando.", entities);
  let op = bits[1];
  let drawer: FbeDrawer | null = null;
  if (op === "flag") {
    drawer = "flags";
    op = bits[2] === "on" || bits[2] === "off" ? bits[2] : "";
    if (!op || bits.length > 3) return fail("Não entendi.", entities);
  } else if (op === "enum") {
    drawer = "enums";
    if (bits.length !== 2) return fail("Não entendi.", entities);
  } else if (op === "text") {
    drawer = "phrases";
    if (bits.length !== 2) return fail("Não entendi.", entities);
  } else {
    if (bits.length !== 3) return fail("Não entendi.", entities);
    drawer = drawerOf(bits[2] ?? "");
    if (!drawer) return fail("Não entendi.", entities);
  }
  if (!drawer) return fail("Não entendi.", entities);
  const args = parts.slice(1);
  const path = pathOf(args[0] ?? "");
  if (!path) return args[0] ? fail("Id inválido.", entities) : fail("Falta o id.", entities);
  const id = knownId(path.id, entities);
  if (!id) return fail(`Não achei ${path.id}.`, entities);

  const keyFrom = (fallback: string | undefined): string | null => path.key || identOf(fallback);
  const gloss = (text: string, doLine: string): EfeitoComando => ({
    cartao: { ok: true, titulo: "Marquei ¹", linhas: [text] },
    entities,
    mut: { do: doLine, linhas: [text], id },
  });

  if (op === "add" || op === "sub") {
    if (drawer !== "stats" || args.length !== 2 || !path.key) return fail("Não entendi.", entities);
    const shown = formatStatInput(args[1] ?? "");
    if (!shown || shown.includes("[") || shown.startsWith("-")) return fail("Não entendi.", entities);
    const delta = op === "sub" ? `-${shown}` : shown;
    const sign = op === "sub" ? "-" : "+";
    return gloss(`${id}.${path.key} ${sign} ${shown}`, `ADD_STAT ${id}.${path.key} ${delta}`);
  }

  if (op === "on" || op === "off") {
    const key = keyFrom(args[1]);
    if (!key || args.length > 2 || (path.key && args.length !== 1) || (!path.key && args.length !== 2)) return fail("Não entendi.", entities);
    const bit = op === "on" ? "true" : "false";
    return gloss(`${id}.${key} = ${bit}`, `SET_FLAG ${id}.${key} ${bit}`);
  }

  if (op === "enum") {
    const state = identOf(args[1]);
    if (!path.key || !state || args.length !== 2) return fail("Não entendi.", entities);
    return gloss(`${id}.${path.key} = ${state}`, `SET_ENUM ${id}.${path.key} ${state}`);
  }

  if (op === "text" || (op === "set" && drawer === "phrases")) {
    const text = quoted(args[1]);
    if (!path.key || text == null || text.includes(";") || args.length !== 2) return fail(text == null ? "O texto fica entre ' '." : "Não entendi.", entities);
    return gloss(`${id}.${path.key} = '${text}'`, `SET_PHRASE ${id}.${path.key} ${text}`);
  }

  if (op === "set" && drawer === "struct") {
    const text = quoted(args[1]);
    if (!path.key || text == null || text.includes(";") || args.length !== 2) return fail(text == null ? "O texto fica entre ' '." : "Não entendi.", entities);
    return gloss(`${id}.${path.key} = '${text}'`, `STRUCT ${id}.${path.key} ${text}`);
  }

  if (op === "push" || (op === "set" && drawer === "tags")) {
    if (drawer !== "lists" && drawer !== "tags") return fail("Não entendi.", entities);
    const item = drawer === "tags" ? keyFrom(args[1]) : itemOf(path.key ? args[1] : undefined);
    const tag = drawer === "tags" ? item : null;
    if (drawer === "tags") {
      if (!tag || (path.key && args.length !== 1) || (!path.key && args.length !== 2)) return fail("Não entendi.", entities);
      return gloss(`tag ${tag} em ${id}`, `ADD_TAG ${id} ${tag}`);
    }
    if (!path.key || !item || args.length !== 2) return fail("Não entendi.", entities);
    return gloss(`${id}.${path.key} + ${item}`, `PUSH ${id}.${path.key} ${item}`);
  }

  if (op === "pull") {
    if (drawer === "stats" || drawer === "enums" || drawer === "phrases" || drawer === "fuses") return fail("Esta gaveta não se tira.", entities);
    if (drawer === "tags") {
      const tag = keyFrom(args[1]);
      if (!tag || (path.key && args.length !== 1) || (!path.key && args.length !== 2)) return fail("Não entendi.", entities);
      return gloss(`tirei ${tag} de ${id}`, `REMOVE_TAG ${id} ${tag}`);
    }
    if (drawer === "flags") {
      const key = keyFrom(args[1]);
      if (!key || (path.key && args.length !== 1) || (!path.key && args.length !== 2)) return fail("Não entendi.", entities);
      return gloss(`${id}.${key} = false`, `SET_FLAG ${id}.${key} false`);
    }
    if (drawer === "lists") {
      const item = itemOf(args[1]);
      if (!path.key || !item || args.length !== 2) return fail("Não entendi.", entities);
      return gloss(`${id}.${path.key} − ${item}`, `REMOVE ${id}.${path.key} ${item}`);
    }
    if (!path.key || args.length !== 1) return fail("Não entendi.", entities);
    if (drawer === "struct") return gloss(`tirei ${id}.${path.key}`, `STRUCT ${id}.${path.key}`);
    return gloss(`tirei ${id}.${path.key}`, `UNLINK ${id}.${path.key}`);
  }

  if (op !== "set") return fail("Não entendi.", entities);
  if (drawer === "lists") return fail("A lista usa push e pull.", entities);
  if (drawer === "stats") {
    if (!path.key || args.length !== 2) return fail("Não entendi.", entities);
    const shown = formatStatInput(args[1] ?? "");
    if (!shown) return fail("Não entendi.", entities);
    return gloss(`${id}.${path.key} = ${shown}`, `SET_STAT ${id}.${path.key} ${shown}`);
  }
  if (drawer === "flags") {
    const key = keyFrom(args[1] && !path.key ? args[1] : undefined);
    const raw = path.key ? args[1] : args[2];
    if (!key || !raw) return fail("Não entendi.", entities);
    const bit = raw === "true" || raw === "false" ? raw : null;
    if (!bit || (path.key && args.length !== 2) || (!path.key && args.length !== 3)) return fail("Não entendi.", entities);
    return gloss(`${id}.${key} = ${bit}`, `SET_FLAG ${id}.${key} ${bit}`);
  }
  if (drawer === "enums") {
    const state = identOf(args[1]);
    if (!path.key || !state || args.length !== 2) return fail("Não entendi.", entities);
    return gloss(`${id}.${path.key} = ${state}`, `SET_ENUM ${id}.${path.key} ${state}`);
  }
  if (drawer === "fuses") {
    if (!path.key || args.length !== 2) return fail("Não entendi.", entities);
    const fuse = formatFuseValue(args[1] ?? "");
    if (!fuse) return fail("Não entendi.", entities);
    return gloss(`${id}.${path.key} = ${fuse}`, `SET_FUSE ${id}.${path.key} ${fuse}`);
  }
  if (drawer === "hardLinks" || drawer === "softLinks") {
    const dest = asId(args[1] ?? "");
    if (!path.key || !dest || args.length !== 2) return fail(args[1] ? "Id inválido." : "Não entendi.", entities);
    const slot = drawer === "hardLinks" ? "hardLinks" : "softLinks";
    return gloss(`${id}.${path.key} → ${dest}`, `SET_LINK ${id}.${slot}.${path.key} ${dest}`);
  }
  return fail("Não entendi.", entities);
}

function insertBlock(source: string, block: string): string {
  const at = handwrittenInsertAt(source);
  const left = source.slice(0, at).replace(/\n+$/, "");
  const right = source.slice(at).replace(/^\n+/, "");
  const mid = block.replace(/\n+$/, "") + "\n";
  if (!left && !right) return mid;
  if (!left) return `${mid}\n${right}`.replace(/\n+$/, "\n");
  if (!right) return `${left}\n\n${mid}`;
  return `${left}\n\n${mid}\n${right}`;
}

function isMolde(entity: { id: string; tags: { has: (tag: string) => boolean } }): boolean {
  return entity.tags.has("molde");
}

function copyNumber(entities: string, moldId: string): number {
  let max = 0;
  const re = new RegExp(`^${moldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}_(\\d+)$`);
  for (const id of mundo(entities).keys()) {
    const hit = re.exec(id);
    if (hit) max = Math.max(max, Number(hit[1]));
  }
  return max + 1;
}

function copyName(moldName: string, moldId: string, n: number): string {
  const base = moldName.trim() || moldId.slice(1);
  return `${base.charAt(0).toUpperCase()}${base.slice(1)} ${n}`;
}

function markMolde(source: string, id: string): string | null {
  const loc = locateEntityBlock(source, id);
  if (!loc) return null;
  const lines = source.split("\n");
  for (let i = loc.startLine - 1; i < loc.endLine; i++) {
    if (!/^\s*tags\s*:/i.test(lines[i] ?? "")) continue;
    const line = lines[i]!;
    if (/(^|[,\s])molde\s*(,|;|$)/.test(line)) return source;
    if (/tags\s*:\s*;/.test(line)) {
      lines[i] = line.replace(/tags\s*:\s*;/, "tags: molde;");
      return lines.join("\n");
    }
    lines[i] = line.replace(/;\s*$/, ", molde;");
    return lines.join("\n");
  }
  lines.splice(loc.endLine - 1, 0, "  tags: molde;");
  return lines.join("\n");
}

function instDe(parts: string[], entities: string): EfeitoComando | null {
  const verb = (parts[0] ?? "").toLowerCase();
  if (!verb.startsWith("inst.") && verb !== "inst") return null;
  const args = parts.slice(1);
  const world = mundo(entities);

  if (verb === "inst.list") {
    if (args.length > 1) return fail("Não entendi.", entities);
    const only = args[0] ? asId(args[0]) : null;
    if (args[0] && !only) return fail("Id inválido.", entities);
    if (only && !world.has(only)) return fail(`Não achei ${only}.`, entities);
    if (only && !isMolde(world.get(only)!)) return fail("Não é molde.", entities);
    const molds = [...world.values()].filter((entity) => isMolde(entity) && (!only || entity.id === only));
    if (!molds.length) return ok("Nenhum molde.", [], entities);
    const linhas: string[] = [];
    for (const mold of molds.sort((a, b) => (a.id < b.id ? -1 : 1))) {
      linhas.push(mold.id);
      const copies = [...world.values()]
        .filter((entity) => entity.templateId === mold.id && entity.id !== mold.id)
        .sort((a, b) => (a.id < b.id ? -1 : 1));
      for (const copy of copies) linhas.push(`${copy.id} · ${copy.name || "—"}`);
    }
    return ok("Moldes", linhas, entities);
  }

  if (verb !== "inst.mark" && verb !== "inst.create" && verb !== "inst.destroy" && verb !== "inst.sync" && verb !== "inst.unset" && verb !== "inst.reparent") return fail("Não entendi.", entities);
  if (!args.length) return fail("Falta o id.", entities);
  const id = asId(args[0] ?? "");
  if (!id) return fail("Id inválido.", entities);
  const found = world.has(id) || locateEntityBlock(entities, id) != null;
  if (!found) return fail(`Não achei ${id}.`, entities);
  const entity = world.get(id);

  if (verb === "inst.mark") {
    if (args.length !== 1) return fail("Não entendi.", entities);
    if (entity?.templateId && entity.templateId !== id) return fail("Isto é uma cópia.", entities);
    if (entity && isMolde(entity)) return fail("Já é molde.", entities);
    if (vemDoCaderno(entities, id)) return fail("Esta entidade vem do caderno.", entities);
    const next = markMolde(entities, id);
    if (next == null) return fail(`Não achei ${id}.`, entities);
    return ok(`Marquei ${id} como molde`, [], next);
  }

  if (verb === "inst.destroy") {
    if (args.length !== 1) return fail("Não entendi.", entities);
    if (entity && isMolde(entity)) return fail("Isto é um molde.", entities);
    if (!entity?.templateId) return fail("Não é cópia.", entities);
    if (vemDoCaderno(entities, id)) return fail("Esta entidade vem do caderno.", entities);
    const next = deleteEntityBlock(entities, id);
    if (next == null) return fail(`Não achei ${id}.`, entities);
    return ok(`Apaguei ${id}`, [], next);
  }

  if (verb === "inst.sync" || verb === "inst.unset" || verb === "inst.reparent") {
    return aplicarPolitica(verb, id, args.slice(1), entities);
  }

  if (!entity || !isMolde(entity)) return fail("Não é molde.", entities);
  let stat: { key: string; value: string } | null = null;
  if (args.length === 2) {
    const hit = /^(stats)\.([A-Za-z_][\w]*)=(.+)$/.exec(args[1] ?? "");
    if (!hit) return fail("Não entendi.", entities);
    const shown = formatStatInput(hit[3] ?? "");
    if (!shown || shown.includes("[")) return fail("Não entendi.", entities);
    stat = { key: hit[2]!, value: shown };
  } else if (args.length !== 1) return fail("Não entendi.", entities);

  const n = copyNumber(entities, id);
  const copyId = `${id}_${n}`;
  const copy = cloneEntity(entity);
  copy.id = copyId;
  copy.slug = copyId;
  copy.templateId = id;
  copy.shortCode = shortCodeFromSlug(copyId);
  copy.name = copyName(entity.name, id, n);
  copy.tags.delete("molde");
  const toque = ["name"];
  if (stat) {
    copy.stats[stat.key] = Number(stat.value);
    toque.push(`stats.${stat.key}`);
  }
  const block = withMemoria(quotedName(serializeEntityBlock(copy), copy.name), lembrar(copy, toque));
  return ok(`Nasceu ${copyId}`, [`nome: ${copy.name}`], insertBlock(entities, block));
}

const SLOTS = ["stats", "flags", "enums", "phrases", "hardLinks", "softLinks", "lists", "fuses", "struct"] as const;
type Slot = (typeof SLOTS)[number];
type Memoria = { toque: Set<string>; visto: Map<string, string> };

function quotedName(block: string, name: string): string {
  return block.replace(/^(\s*name:\s*).*;$/m, `$1'${name.replace(/'/g, "")}';`);
}

function packMemoria(memoria: Memoria): string {
  const toque = [...memoria.toque].sort().join(",");
  const visto = [...memoria.visto.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join(",");
  return `// lume-inst toque=${toque} visto=${visto}`;
}

function withMemoria(block: string, memoria: Memoria): string {
  return `${packMemoria(memoria)}\n${block.replace(/\n$/, "")}\n`;
}

function memoriaOf(source: string, id: string): Memoria {
  const loc = locateEntityBlock(source, id);
  const empty = { toque: new Set<string>(), visto: new Map<string, string>() };
  if (!loc) return empty;
  const lines = source.split("\n");
  const line = lines[loc.startLine - 2] ?? "";
  if (!/\/\/\s*lume-inst\b/.test(line)) return empty;
  const toque = /toque=([^\s]*)/.exec(line)?.[1] ?? "";
  const visto = /visto=([^\s]*)/.exec(line)?.[1] ?? "";
  return {
    toque: new Set(toque.split(",").filter(Boolean)),
    visto: new Map(
      visto
        .split(",")
        .filter(Boolean)
        .map((item) => {
          const eq = item.indexOf("=");
          return [item.slice(0, eq), decodeURIComponent(item.slice(eq + 1))] as const;
        }),
    ),
  };
}

function lembrar(entity: Entity, toque: readonly string[]): Memoria {
  const memoria: Memoria = { toque: new Set(toque), visto: new Map() };
  memoria.toque.add("name");
  if (!memoria.toque.has("description")) memoria.visto.set("description", entity.description);
  for (const tag of entity.tags) {
    if (tag !== "molde" && !memoria.toque.has(`tags.${tag}`)) memoria.visto.set(`tags.${tag}`, "1");
  }
  for (const slot of SLOTS) {
    for (const key of slotKeys(entity, slot)) {
      const id = `${slot}.${key}`;
      if (memoria.toque.has(id)) continue;
      const text = slotText(entity, slot, key);
      if (text !== undefined) memoria.visto.set(id, text);
    }
  }
  return memoria;
}

function slotKeys(entity: Entity, slot: Slot): string[] {
  if (slot === "stats") return Object.keys(entity.stats);
  if (slot === "flags") return Object.keys(entity.flags);
  if (slot === "enums") return Object.keys(entity.enums);
  if (slot === "phrases") return Object.keys(entity.phrases);
  if (slot === "hardLinks") return Object.keys(entity.hardLinks);
  if (slot === "softLinks") return Object.keys(entity.softLinks);
  if (slot === "lists") return Object.keys(entity.lists);
  if (slot === "fuses") return Object.keys(entity.fuses);
  return Object.keys(entity.struct);
}

function slotText(entity: Entity, slot: Slot, key: string): string | undefined {
  if (slot === "stats") {
    const value = entity.stats[key];
    if (value === undefined) return undefined;
    return typeof value === "number" ? String(value) : `${value.value}[${value.min}..${value.max}]`;
  }
  if (slot === "flags") return key in entity.flags ? String(entity.flags[key]) : undefined;
  if (slot === "enums") {
    const value = entity.enums[key];
    return value ? `${value.current}/${value.states.join("|")}` : undefined;
  }
  if (slot === "phrases") return entity.phrases[key];
  if (slot === "hardLinks") return entity.hardLinks[key];
  if (slot === "softLinks") return entity.softLinks[key];
  if (slot === "lists") return entity.lists[key] ? entity.lists[key].join("|") : undefined;
  if (slot === "fuses") {
    const value = entity.fuses[key];
    return value ? `${value.remaining}>${value.targetId}` : undefined;
  }
  const value = entity.struct[key];
  return value === undefined ? undefined : typeof value === "string" ? value : JSON.stringify(value);
}

function assignSlot(copy: Entity, mold: Entity, slot: Slot, key: string): void {
  const has = slotText(mold, slot, key) !== undefined;
  if (slot === "stats") {
    if (!has) delete copy.stats[key];
    else {
      const value = mold.stats[key] as StatValue;
      copy.stats[key] = typeof value === "number" ? value : { ...value };
    }
  } else if (slot === "flags") {
    if (!has) delete copy.flags[key];
    else copy.flags[key] = mold.flags[key]!;
  } else if (slot === "enums") {
    if (!has) delete copy.enums[key];
    else copy.enums[key] = { current: mold.enums[key]!.current, states: [...mold.enums[key]!.states] };
  } else if (slot === "phrases") {
    if (!has) delete copy.phrases[key];
    else copy.phrases[key] = mold.phrases[key]!;
  } else if (slot === "hardLinks") {
    if (!has) delete copy.hardLinks[key];
    else copy.hardLinks[key] = mold.hardLinks[key]!;
  } else if (slot === "softLinks") {
    if (!has) delete copy.softLinks[key];
    else copy.softLinks[key] = mold.softLinks[key]!;
  } else if (slot === "lists") {
    if (!has) delete copy.lists[key];
    else copy.lists[key] = [...mold.lists[key]!];
  } else if (slot === "fuses") {
    if (!has) delete copy.fuses[key];
    else copy.fuses[key] = { ...mold.fuses[key]! };
  } else if (!has) delete copy.struct[key];
  else {
    const value = mold.struct[key];
    copy.struct[key] = value && typeof value === "object" ? { ...(value as Record<string, unknown>) } : value;
  }
}

function ownOrFollow(id: string, now: string | undefined, next: string | undefined, apply: () => void, memoria: Memoria): void {
  if (memoria.toque.has(id)) return;
  const known = memoria.visto.has(id);
  const seen = memoria.visto.get(id);
  if (known && now !== seen) {
    memoria.toque.add(id);
    return;
  }
  if (!known && now !== undefined && (next === undefined || now !== next)) {
    memoria.toque.add(id);
    return;
  }
  apply();
  if (next === undefined) memoria.visto.delete(id);
  else memoria.visto.set(id, next);
}

function seguir(copy: Entity, mold: Entity, memoria: Memoria): void {
  ownOrFollow("name", copy.name, mold.name, () => {
    copy.name = mold.name;
  }, memoria);
  ownOrFollow("description", copy.description, mold.description, () => {
    copy.description = mold.description;
  }, memoria);
  const tags = new Set<string>();
  for (const tag of copy.tags) if (tag !== "molde") tags.add(tag);
  for (const tag of mold.tags) if (tag !== "molde") tags.add(tag);
  for (const tag of tags) {
    const id = `tags.${tag}`;
    const now = copy.tags.has(tag) ? "1" : undefined;
    const next = mold.tags.has(tag) ? "1" : undefined;
    ownOrFollow(id, now, next, () => {
      if (next) copy.tags.add(tag);
      else copy.tags.delete(tag);
    }, memoria);
  }
  copy.tags.delete("molde");
  for (const slot of SLOTS) {
    const keys = new Set([...slotKeys(copy, slot), ...slotKeys(mold, slot)]);
    for (const key of keys) {
      const id = `${slot}.${key}`;
      ownOrFollow(id, slotText(copy, slot, key), slotText(mold, slot, key), () => assignSlot(copy, mold, slot, key), memoria);
    }
  }
}

function chainMold(world: ReturnType<typeof mundo>, id: string): Entity | null {
  const mold = world.get(id);
  if (!mold) return null;
  const parentId = mold.templateId;
  if (!parentId || parentId === id) return mold;
  const parent = world.get(parentId);
  if (!parent || parent.id === id) return mold;
  const next = cloneEntity(parent);
  next.tags = new Set([...parent.tags, ...mold.tags]);
  if (mold.name) next.name = mold.name;
  if (mold.description) next.description = mold.description;
  for (const slot of SLOTS) {
    for (const key of slotKeys(mold, slot)) assignSlot(next, mold, slot, key);
  }
  next.tags.delete("molde");
  return next;
}

function replaceBlock(source: string, id: string, block: string): string | null {
  const loc = locateEntityBlock(source, id);
  if (!loc) return null;
  const lines = source.split("\n");
  let start = loc.startLine - 1;
  if (start > 0 && /\/\/\s*lume-inst\b/.test(lines[start - 1] ?? "")) start -= 1;
  lines.splice(start, loc.endLine - start, ...block.replace(/\n$/, "").split("\n"));
  return lines.join("\n");
}

function escreverCopia(source: string, copy: Entity, memoria: Memoria): string | null {
  return replaceBlock(source, copy.id, withMemoria(quotedName(serializeEntityBlock(copy), copy.name), memoria));
}

function aplicarPolitica(verb: string, id: string, args: string[], entities: string): EfeitoComando {
  const world = mundo(entities);
  const copy = world.get(id);
  if (!copy) return fail(`Não achei ${id}.`, entities);
  if (isMolde(copy) || !copy.templateId) return fail("Não é cópia.", entities);
  if (vemDoCaderno(entities, id)) return fail("Esta entidade vem do caderno.", entities);
  const moldId = verb === "inst.reparent" ? asId(args[0] ?? "") : copy.templateId;
  if (verb === "inst.reparent") {
    if (args.length !== 1) return fail("Não entendi.", entities);
    if (!moldId) return fail("Id inválido.", entities);
    if (!isMolde(world.get(moldId) ?? { id: moldId, tags: new Set<string>() })) return fail("Não é molde.", entities);
  } else if (verb === "inst.unset") {
    if (args.length !== 1) return fail("Não entendi.", entities);
  } else if (args.length) return fail("Não entendi.", entities);

  const mold = moldId ? chainMold(world, moldId) : null;
  if (!mold) return ok(`O molde de ${id} se foi`, [], entities);
  const memoria = memoriaOf(entities, id);
  if (!memoria.toque.size && !memoria.visto.size) {
    const fresh = lembrar(copy, ["name"]);
    memoria.toque = fresh.toque;
    memoria.visto = fresh.visto;
  }
  if (verb === "inst.reparent") copy.templateId = moldId!;
  if (verb === "inst.unset") {
    const key = chavePolitica(args[0] ?? "");
    if (!key) return fail("Não entendi.", entities);
    memoria.toque.delete(key);
    if (key === "name") copy.name = mold.name;
    else if (key === "description") copy.description = mold.description;
    else if (key.startsWith("tags.")) {
      const tag = key.slice(5);
      if (mold.tags.has(tag)) copy.tags.add(tag);
      else copy.tags.delete(tag);
    } else {
      const slot = key.slice(0, key.indexOf(".")) as Slot;
      assignSlot(copy, mold, slot, key.slice(slot.length + 1));
    }
    const now = key === "name" ? copy.name : key === "description" ? copy.description : key.startsWith("tags.") ? (copy.tags.has(key.slice(5)) ? "1" : undefined) : slotText(copy, key.slice(0, key.indexOf(".")) as Slot, key.slice(key.indexOf(".") + 1));
    if (now === undefined) memoria.visto.delete(key);
    else memoria.visto.set(key, now);
  } else seguir(copy, mold, memoria);
  const next = escreverCopia(entities, copy, memoria);
  if (next == null) return fail(`Não achei ${id}.`, entities);
  if (verb === "inst.unset") return ok(`Devolvi ${args[0]}`, [], next);
  if (verb === "inst.reparent") return ok(`${id} segue ${moldId}`, [], next);
  return ok(`Sincronizei ${id}`, [], next);
}

function chavePolitica(raw: string): string | null {
  if (raw === "name" || raw === "description") return raw;
  const hit = /^(stats|flags|enums|phrases|hardLinks|softLinks|lists|fuses|struct|tags)\.([A-Za-z_][\w]*)$/.exec(raw);
  if (!hit) return null;
  const drawer = hit[1] === "hardLinks" || hit[1] === "softLinks" ? hit[1] : hit[1];
  return `${drawer}.${hit[2]}`;
}

function linksOut(entity: Entity | undefined): string[] {
  if (!entity) return [];
  return [
    ...Object.entries(entity.hardLinks).filter(([, dest]) => dest).map(([key, dest]) => `${key} → ${dest}`),
    ...Object.entries(entity.softLinks).filter(([, dest]) => dest).map(([key, dest]) => `${key} ~ ${dest}`),
  ].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function linkDe(parts: string[], entities: string): EfeitoComando | null {
  const verb = (parts[0] ?? "").toLowerCase();
  if (!verb.startsWith("link.") && verb !== "link") return null;
  const bits = verb.split(".");
  if (bits.length < 2 || !bits[1]) return fail("Falta o comando.", entities);
  const op = bits[1]!;
  const rel = bits[2] ?? "";
  const args = parts.slice(1);
  const world = mundo(entities);
  const known = (raw: string): string | null => {
    const id = asId(raw);
    if (!id) return null;
    return world.has(id) || locateEntityBlock(entities, id) ? id : null;
  };
  const missing = (raw: string): EfeitoComando => {
    const id = asId(raw);
    return id ? fail(`Não achei ${id}.`, entities) : fail("Id inválido.", entities);
  };
  const marcar = (text: string, doLine: string, id: string): EfeitoComando => ({
    cartao: { ok: true, titulo: "Marquei ¹", linhas: [text] },
    entities,
    mut: { do: doLine, linhas: [text], id },
  });

  if (op === "from" || op === "where" || op === "tree") {
    if (bits.length !== 2 || args.length !== 1) return fail("Não entendi.", entities);
    if (!args[0]) return fail("Falta o id.", entities);
    const id = known(args[0]);
    if (!id) return missing(args[0]);
    if (op === "where") {
      const linhas: string[] = [];
      for (const other of world.values()) {
        if (isSystemEntityId(other.id)) continue;
        for (const [key, dest] of Object.entries(other.hardLinks)) if (dest === id) linhas.push(`${other.id}.${key} → ${id}`);
        for (const [key, dest] of Object.entries(other.softLinks)) if (dest === id) linhas.push(`${other.id}.${key} ~ ${id}`);
      }
      linhas.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      return ok(id, linhas.length ? linhas : ["Nenhuma."], entities);
    }
    const linhas = op === "from" ? linksOut(world.get(id)) : treeOf(world, id);
    return ok(id, linhas.length ? linhas : ["Nenhuma."], entities);
  }

  if (op === "to") {
    if (bits.length !== 2 || args.length !== 1) return fail("Não entendi.", entities);
    const path = pathOf(args[0] ?? "");
    if (!path?.key) return fail("Não entendi.", entities);
    const id = known(path.id);
    if (!id) return missing(path.id);
    const entity = world.get(id);
    const linhas = [entity?.hardLinks[path.key], entity?.softLinks[path.key]].filter((dest): dest is string => Boolean(dest));
    return ok(`${id}.${path.key}`, linhas.length ? linhas : ["Nenhuma."], entities);
  }

  if (op !== "set" && op !== "add" && op !== "pull" && op !== "clear") return fail("Não entendi.", entities);
  if (bits.length !== 3 || !/^[\p{L}_][\p{L}\p{N}_]*$/u.test(rel)) return fail("Não entendi.", entities);
  if (!args[0]) return fail("Falta o id.", entities);
  const from = known(args[0]);
  if (!from) return missing(args[0]);
  if (op === "clear") {
    if (args.length !== 1) return fail("Não entendi.", entities);
    return marcar(`tirei ${from}.${rel}`, `UNLINK ${from}.${rel}`, from);
  }
  if (op === "pull") {
    if (args.length !== 1 && args.length !== 2) return fail("Não entendi.", entities);
    if (args.length === 2) {
      const to = asId(args[1] ?? "");
      if (!to) return fail("Id inválido.", entities);
      const entity = world.get(from);
      if (entity?.hardLinks[rel] !== to && entity?.softLinks[rel] !== to) return fail("Não é esse destino.", entities);
    }
    return marcar(`tirei ${from}.${rel}`, `UNLINK ${from}.${rel}`, from);
  }
  if (args.length !== 2) return fail("Não entendi.", entities);
  const to = known(args[1] ?? "");
  if (!to) return missing(args[1] ?? "");
  const slot = op === "set" ? "hardLinks" : "softLinks";
  const arrow = op === "set" ? "→" : "~";
  return marcar(`${from}.${rel} ${arrow} ${to}`, `SET_LINK ${from}.${slot}.${rel} ${to}`, from);
}

function treeOf(world: ReturnType<typeof mundo>, id: string): string[] {
  const entity = world.get(id);
  const lines: string[] = [];
  if (!entity) return lines;
  const edges = [
    ...Object.entries(entity.hardLinks).filter(([, dest]) => dest).map(([key, dest]) => [`${key} → ${dest}`, dest] as const),
    ...Object.entries(entity.softLinks).filter(([, dest]) => dest).map(([key, dest]) => [`${key} ~ ${dest}`, dest] as const),
  ].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  for (const [label, dest] of edges) {
    lines.push(label);
    const child = dest === id ? undefined : world.get(dest);
    if (!child) continue;
    const nested = linksOut(child).map((item) => `  ${item}`);
    lines.push(...nested);
  }
  return lines;
}

function emitLists(lists: Entity["lists"]): string {
  return Object.entries(lists)
    .map(([key, items]) => `${key}=[${items.map((item) => (typeof item === "number" ? String(item) : `'${String(item)}'`)).join(", ")}]`)
    .join(", ");
}

function writeSabe(source: string, id: string, facts: string[]): string | null {
  const loc = locateEntityBlock(source, id);
  if (!loc) return null;
  const lists = { ...(mundo(source).get(id)?.lists ?? {}) };
  if (facts.length) lists.sabe = facts;
  else delete lists.sabe;
  const body = emitLists(lists);
  const lines = source.split("\n");
  for (let i = loc.startLine - 1; i < loc.endLine; i++) {
    if (!/^\s*lists\s*:/.test(lines[i] ?? "")) continue;
    const indent = /^\s*/.exec(lines[i]!)?.[0] ?? "  ";
    lines[i] = body ? `${indent}lists: ${body};` : `${indent}lists: ;`;
    return lines.join("\n");
  }
  lines.splice(loc.endLine - 1, 0, body ? `  lists: ${body};` : `  lists: ;`);
  return lines.join("\n");
}

function sabeOf(entities: string, id: string): string[] {
  return (mundo(entities).get(id)?.lists.sabe ?? []).map(String);
}

function knoDe(parts: string[], entities: string): EfeitoComando | null {
  const verb = (parts[0] ?? "").toLowerCase();
  if (!verb.startsWith("kno.") && verb !== "kno") return null;
  const op = verb.split(".")[1] ?? "";
  if (!op) return fail("Falta o comando.", entities);
  if (verb.split(".").length > 2) return fail("Não entendi.", entities);
  const args = parts.slice(1);
  if (!args.length) return fail("Falta o id.", entities);
  const id = asId(args[0] ?? "");
  if (!id) return fail("Id inválido.", entities);
  const world = mundo(entities);
  if (!world.has(id) && !locateEntityBlock(entities, id)) return fail(`Não achei ${id}.`, entities);

  if (op === "show" || op === "at") {
    if (args.length !== 1) return fail("Não entendi.", entities);
    const facts = sabeOf(entities, id);
    return ok(id, facts.length ? facts : ["Nada."], entities);
  }
  if (op !== "learn" && op !== "forget") return fail("Não entendi.", entities);
  if (args.length !== 2) return fail("O texto fica entre ' '.", entities);
  const fact = quoted(args[1]);
  if (fact == null) return fail("O texto fica entre ' '.", entities);
  if (!fact || /[;'\[\]]/.test(fact)) return fail("Não entendi.", entities);
  if (vemDoCaderno(entities, id)) return fail("Esta entidade vem do caderno.", entities);
  const facts = sabeOf(entities, id);
  if (op === "learn") {
    if (facts.includes(fact)) return ok("Já sabe.", [fact], entities);
    const next = writeSabe(entities, id, [...facts, fact]);
    if (next == null) return fail(`Não achei ${id}.`, entities);
    return ok("Aprendeu", [fact], next);
  }
  if (!facts.includes(fact)) return ok("Não sabia.", [], entities);
  const next = writeSabe(entities, id, facts.filter((item) => item !== fact));
  if (next == null) return fail(`Não achei ${id}.`, entities);
  return ok("Esqueceu", [fact], next);
}

function queDe(parts: string[], entities: string): EfeitoComando | null {
  const verb = (parts[0] ?? "").toLowerCase();
  if (!verb.startsWith("que.") && verb !== "que") return null;
  const bits = verb.split(".");
  const op = bits[1] ?? "";
  if (!op) return fail("Falta o comando.", entities);
  const args = parts.slice(1);
  const world = mundo(entities);
  const known = (raw: string): string | null => {
    const id = asId(raw);
    if (!id) return null;
    return world.has(id) || locateEntityBlock(entities, id) ? id : null;
  };

  if (op === "where") {
    if (bits.length > 3 || args.length !== 1) return fail("Não entendi.", entities);
    const id = known(args[0] ?? "");
    if (!id) return args[0] && asId(args[0]) ? fail(`Não achei ${asId(args[0])}.`, entities) : fail(args[0] ? "Id inválido." : "Falta o id.", entities);
    const rel = bits[2] ?? "";
    const linhas = linksOut(world.get(id)).filter((line) => !rel || line.startsWith(`${rel} `));
    return ok(rel ? `${id}.${rel}` : id, linhas.length ? linhas : ["Nenhuma."], entities);
  }

  if (op === "when") {
    if (bits.length !== 2 || args.length !== 1) return fail("Não entendi.", entities);
    const spec = args[0] ?? "";
    if (!spec.includes("=")) return fail("Não entendi.", entities);
    const linhas = [...world.values()]
      .filter((entity) => !isSystemEntityId(entity.id) && casaWhen(entity, spec))
      .map((entity) => entity.id)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    if (linhas.length === 0 && !specValida(spec)) return fail("Não entendi.", entities);
    return ok(spec, linhas.length ? linhas : ["Nenhuma."], entities);
  }

  if (op === "at") {
    if (args.length === 2) return fail("Não há relógio.", entities);
    if (bits.length !== 2 || args.length !== 1) return fail("Não entendi.", entities);
    const id = known(args[0] ?? "");
    if (!id) return args[0] && asId(args[0]) ? fail(`Não achei ${asId(args[0])}.`, entities) : fail(args[0] ? "Id inválido." : "Falta o id.", entities);
    const linhas = retrato(world.get(id)!);
    return ok(id, linhas.length ? linhas : ["Nada."], entities);
  }

  if (op === "knowledge") {
    if (bits.length !== 2 || args.length !== 1) return fail("Não entendi.", entities);
    const id = known(args[0] ?? "");
    if (!id) return args[0] && asId(args[0]) ? fail(`Não achei ${asId(args[0])}.`, entities) : fail(args[0] ? "Id inválido." : "Falta o id.", entities);
    const facts = sabeOf(entities, id);
    return ok(id, facts.length ? facts : ["Nada."], entities);
  }

  if (op === "timeline") {
    if (bits.length !== 2 || args.length !== 1) return fail("Não entendi.", entities);
    const raw = args[0] ?? "";
    const head = raw.split(".")[0] ?? "";
    const id = known(head);
    const key = raw.slice(head.length + 1);
    if (!id || !key) return id ? fail("Não entendi.", entities) : fail(head && asId(head) ? `Não achei ${asId(head)}.` : "Id inválido.", entities);
    const hit = valorAgora(world.get(id)!, key);
    return ok(`${id}.${key}`, hit ? [hit] : ["Nada."], entities);
  }

  return fail("Não entendi.", entities);
}

const AJUDA_BUSCA = [
  "termo — palavra",
  "a,b — as duas",
  "a/b — uma ou outra",
  "a|b — só uma",
  "!a — sem essa",
  "sea.find 'texto'",
  "sea.in tag 'texto'",
  "sea.tag nome",
];

function ficha(entity: Entity): string {
  return [
    entity.id,
    entity.name,
    entity.description,
    ...entity.tags,
    ...Object.entries(entity.stats).map(([key, value]) => `${key} ${statText(value) ?? ""}`),
    ...Object.entries(entity.flags).map(([key, value]) => `${key} ${value ? "true" : "false"}`),
    ...Object.values(entity.phrases),
    ...Object.values(entity.lists).flat().map(String),
    ...Object.values(entity.struct).map(String),
    ...Object.values(entity.hardLinks),
    ...Object.values(entity.softLinks),
  ].join(" ").toLowerCase();
}

function casaExpr(blob: string, expr: string): boolean | null {
  const e = expr.trim().toLowerCase();
  if (!e) return null;
  const comma = e.includes(",");
  const slash = e.includes("/");
  const pipe = e.includes("|");
  const bang = e.includes("!");
  if ([comma, slash, pipe, bang].filter(Boolean).length > 1) return null;
  if (bang) {
    if (!e.startsWith("!") || e.slice(1).includes("!")) return null;
    const term = e.slice(1).trim();
    if (!term) return null;
    return !blob.includes(term);
  }
  if (comma || slash || pipe) {
    const bits = e.split(comma ? "," : slash ? "/" : "|").map((part) => part.trim());
    if (bits.some((part) => !part)) return null;
    if (comma) return bits.every((part) => blob.includes(part));
    if (slash) return bits.some((part) => blob.includes(part));
    if (bits.length !== 2) return null;
    return bits.filter((part) => blob.includes(part)).length === 1;
  }
  return blob.includes(e);
}

function buscar(entities: string, expr: string, tag?: string): EfeitoComando {
  const linhas: string[] = [];
  for (const entity of mundo(entities).values()) {
    if (isSystemEntityId(entity.id)) continue;
    if (tag && !entity.tags.has(tag)) continue;
    const hit = casaExpr(ficha(entity), expr);
    if (hit == null) return fail("Não entendi.", entities);
    if (hit) linhas.push(entity.id);
  }
  linhas.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return ok(expr, linhas.length ? linhas : ["Nenhuma."], entities);
}

function seaDe(parts: string[], entities: string): EfeitoComando | null {
  const verb = (parts[0] ?? "").toLowerCase();
  if (!verb.startsWith("sea.") && verb !== "sea") return null;
  const bits = verb.split(".");
  const op = bits[1] ?? "";
  if (!op || bits.length > 2) return fail(op ? "Não entendi." : "Falta o comando.", entities);
  const args = parts.slice(1);

  if (op === "help") {
    if (args.length) return fail("Não entendi.", entities);
    return ok("Busca", [...AJUDA_BUSCA], entities);
  }
  if (op === "tag") {
    if (args.length !== 1 || !args[0] || args[0].startsWith("@") || args[0].includes("'")) return fail("Não entendi.", entities);
    const linhas = [...mundo(entities).values()]
      .filter((entity) => !isSystemEntityId(entity.id) && entity.tags.has(args[0]!))
      .map((entity) => entity.id)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return ok(args[0], linhas.length ? linhas : ["Nenhuma."], entities);
  }
  if (op === "find") {
    if (args.length !== 1) return fail("O texto fica entre ' '.", entities);
    const expr = quoted(args[0]);
    if (expr == null) return fail("O texto fica entre ' '.", entities);
    return buscar(entities, expr);
  }
  if (op === "in") {
    if (args.length !== 2) return fail("Não entendi.", entities);
    const tag = args[0] ?? "";
    const expr = quoted(args[1]);
    if (!tag || tag.startsWith("@") || expr == null) return fail(expr == null ? "O texto fica entre ' '." : "Não entendi.", entities);
    return buscar(entities, expr, tag);
  }
  return fail("Não entendi.", entities);
}

function specValida(spec: string): boolean {
  const eq = spec.indexOf("=");
  const path = spec.slice(0, eq);
  const bits = path.split(".");
  if (bits.length === 1) return bits[0] === "tags";
  if (bits.length !== 2) return false;
  return ["stats", "flags", "enums", "phrases", "hardLinks", "softLinks", "lists", "fuses", "struct"].includes(bits[0] ?? "");
}

function casaWhen(entity: Entity, spec: string): boolean {
  const eq = spec.indexOf("=");
  const path = spec.slice(0, eq);
  const value = spec.slice(eq + 1);
  const bits = path.split(".");
  if (!specValida(spec) || value === "") return false;
  if (bits[0] === "tags") return entity.tags.has(value);
  const [drawer, key] = bits as [string, string];
  if (drawer === "stats") return statText(entity.stats[key]) === value;
  if (drawer === "flags") return key in entity.flags && String(entity.flags[key]) === value;
  if (drawer === "enums") return entity.enums[key]?.current === value;
  if (drawer === "phrases") return entity.phrases[key] === value;
  if (drawer === "hardLinks") return entity.hardLinks[key] === value;
  if (drawer === "softLinks") return entity.softLinks[key] === value;
  if (drawer === "lists") return (entity.lists[key] ?? []).map(String).includes(value);
  if (drawer === "fuses") return entity.fuses[key] ? String(entity.fuses[key].remaining) === value : false;
  return entity.struct[key] === undefined ? false : String(entity.struct[key]) === value;
}

function statText(value: StatValue | undefined): string | null {
  if (value === undefined) return null;
  return typeof value === "number" ? String(value) : String(value.value);
}

function retrato(entity: Entity): string[] {
  const lines: string[] = [];
  if (entity.name) lines.push(`nome: ${entity.name}`);
  if (entity.description) lines.push(`descrição: ${entity.description}`);
  if (entity.tags.size) lines.push(`tags: ${[...entity.tags].sort().join(", ")}`);
  const stats = Object.entries(entity.stats).flatMap(([key, value]) => {
    const shown = statText(value);
    return shown == null ? [] : [`${key}=${shown}`];
  });
  if (stats.length) lines.push(`stats: ${stats.join(", ")}`);
  const flags = Object.entries(entity.flags).map(([key, value]) => `${key}=${value ? "true" : "false"}`);
  if (flags.length) lines.push(`flags: ${flags.join(", ")}`);
  const enums = Object.entries(entity.enums).map(([key, value]) => `${key}=${value.current}`);
  if (enums.length) lines.push(`enums: ${enums.join(", ")}`);
  if (linksOut(entity).length) lines.push(...linksOut(entity));
  const sabe = (entity.lists.sabe ?? []).map(String);
  if (sabe.length) lines.push(`sabe: ${sabe.join(", ")}`);
  return lines;
}

function valorAgora(entity: Entity, key: string): string | null {
  const dotted = key.split(".");
  if (dotted.length === 2) {
    const spec = `${dotted[0]}.${dotted[1]}=`;
    if (!specValida(`${dotted[0]}.${dotted[1]}=x`)) return null;
    if (dotted[0] === "stats") return statText(entity.stats[dotted[1]!]);
    if (dotted[0] === "flags") return dotted[1]! in entity.flags ? String(entity.flags[dotted[1]!]) : null;
    if (dotted[0] === "enums") return entity.enums[dotted[1]!]?.current ?? null;
    if (dotted[0] === "phrases") return entity.phrases[dotted[1]!] ?? null;
    if (dotted[0] === "hardLinks") return entity.hardLinks[dotted[1]!] || null;
    if (dotted[0] === "softLinks") return entity.softLinks[dotted[1]!] || null;
    if (dotted[0] === "lists") return (entity.lists[dotted[1]!] ?? []).map(String).join(", ") || null;
    if (dotted[0] === "fuses") return entity.fuses[dotted[1]!] ? String(entity.fuses[dotted[1]!]!.remaining) : null;
    return entity.struct[dotted[1]!] === undefined ? null : String(entity.struct[dotted[1]!]);
  }
  return statText(entity.stats[key]) ?? (key in entity.flags ? String(entity.flags[key]) : null) ?? entity.hardLinks[key] ?? entity.softLinks[key] ?? null;
}

export function correrComando(corpo: string, entities = ""): EfeitoComando {
  if (!corpo) return fail("Falta o comando.", entities);
  const parts = lex(corpo);
  if (!parts) return fail("O texto fica entre ' '.", entities);
  const verb = (parts[0] ?? "").toLowerCase();
  const args = parts.slice(1);

  if (verb === "help") {
    if (args.length) return fail("Não entendi.", entities);
    return ok("Comandos", [...LISTA_COMANDOS], entities);
  }

  const mutated = mutDe(parts, entities);
  if (mutated) return mutated;

  const inst = instDe(parts, entities);
  if (inst) return inst;

  const link = linkDe(parts, entities);
  if (link) return link;

  const kno = knoDe(parts, entities);
  if (kno) return kno;

  const que = queDe(parts, entities);
  if (que) return que;

  const sea = seaDe(parts, entities);
  if (sea) return sea;

  const aud = audDe(parts, entities);
  if (aud) return aud;

  if (verb === "ent.list") {
    if (args.length) return fail("Não entendi.", entities);
    const linhas = [...mundo(entities).keys()].filter((id) => !isSystemEntityId(id)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return ok("Entidades", linhas.length ? linhas : ["Nenhuma."], entities);
  }

  if (verb === "ent.create" || verb === "ent.show" || verb === "ent.delete" || verb === "id.rename" || verb === "id.describe") {
    if (!args.length) return fail("Falta o id.", entities);
    const id = asId(args[0]!);
    if (!id) return fail("Id inválido.", entities);
    const world = mundo(entities);
    const found = world.has(id) || locateEntityBlock(entities, id) != null;

    if (verb === "ent.create") {
      if (args.length !== 1) return fail("Não entendi.", entities);
      if (found) return fail(`Já existe ${id}.`, entities);
      return ok(`Nasceu ${id}`, [], insertEntity(entities, id).source);
    }

    if (verb === "ent.show") {
      if (args.length !== 1) return fail("Não entendi.", entities);
      const entity = world.get(id);
      if (!entity) return fail(`Não achei ${id}.`, entities);
      return ok(id, [`nome: ${entity.name || "—"}`, `descrição: ${entity.description || "—"}`], entities);
    }

    if (verb === "ent.delete") {
      if (args.length !== 1) return fail("Não entendi.", entities);
      if (!found) return fail(`Não achei ${id}.`, entities);
      if (vemDoCaderno(entities, id)) return fail("Esta entidade vem do caderno.", entities);
      const next = deleteEntityBlock(entities, id);
      if (next == null) return fail(`Não achei ${id}.`, entities);
      return ok(`Apaguei ${id}`, [], next);
    }

    if (args.length === 1) return fail("O texto fica entre ' '.", entities);
    if (args.length !== 2) return fail("Não entendi.", entities);
    const text = quoted(args[1]);
    if (text == null) return fail("O texto fica entre ' '.", entities);
    if (!found) return fail(`Não achei ${id}.`, entities);
    if (vemDoCaderno(entities, id)) return fail("Esta entidade vem do caderno.", entities);
    const field = verb === "id.rename" ? "name" : "description";
    const next = setField(entities, id, field, text);
    if (next == null) return fail(`Não achei ${id}.`, entities);
    if (field === "name") return ok(`${id} agora chama-se ${text || "—"}`, [], next);
    return ok(`${id} descrito`, [`descrição: ${text || "—"}`], next);
  }

  return fail("Não conheço este comando.", entities);
}

type Furos = { links: string[]; identities: string[]; instances: string[]; continuity: string[]; references: string[] };

function existe(ids: Set<string>, raw: string): boolean {
  if (!raw || raw === "$") return true;
  if (ids.has(raw)) return true;
  const id = asId(raw);
  return id ? ids.has(id) : true;
}

function furos(entities: string): Furos {
  const world = mundo(entities);
  const ids = new Set([...world.keys()].filter((id) => !isSystemEntityId(id)));
  const out: Furos = { links: [], identities: [], instances: [], continuity: [], references: [] };
  const byCode = new Map<string, string[]>();
  const cite = (raw: string) => (raw.startsWith("@") ? raw : `@${raw}`);
  for (const entity of world.values()) {
    if (isSystemEntityId(entity.id)) continue;
    const code = entity.shortCode.toUpperCase();
    byCode.set(code, [...(byCode.get(code) ?? []), entity.id]);
    for (const [key, dest] of Object.entries(entity.hardLinks)) {
      if (!dest) continue;
      if (dest === entity.id) out.links.push(`${entity.id}.${key} aponta para si`);
      else if (!existe(ids, dest)) out.links.push(`${entity.id}.${key} → ${dest}`);
    }
    for (const [key, dest] of Object.entries(entity.softLinks)) {
      if (!dest) continue;
      if (dest === entity.id) out.links.push(`${entity.id}.${key} aponta para si`);
      else if (!existe(ids, dest)) out.links.push(`${entity.id}.${key} ~ ${dest}`);
    }
    if (entity.templateId && entity.templateId !== entity.id && !existe(ids, entity.templateId)) {
      out.instances.push(`${entity.id} sem molde ${cite(entity.templateId)}`);
    }
    for (const [key, fuse] of Object.entries(entity.fuses)) {
      if (fuse.targetId && !existe(ids, fuse.targetId)) out.continuity.push(`${entity.id}.${key} → ${cite(fuse.targetId)}`);
    }
    const solto = (slot: string, value: string) => {
      if (value.startsWith("@") && !existe(ids, value)) out.references.push(`${entity.id}.${slot} → ${value}`);
    };
    for (const [key, text] of Object.entries(entity.phrases)) solto(key, text);
    for (const [key, items] of Object.entries(entity.lists)) for (const item of items) solto(key, String(item));
    for (const [key, value] of Object.entries(entity.struct)) if (typeof value === "string") solto(key, value);
  }
  for (const [code, group] of byCode) {
    if (group.length < 2) continue;
    group.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    out.identities.push(`${group.join(" e ")} usam ${code}`);
  }
  for (const key of Object.keys(out) as (keyof Furos)[]) out[key].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return out;
}

function audDe(parts: string[], entities: string): EfeitoComando | null {
  const verb = (parts[0] ?? "").toLowerCase();
  if (verb !== "aud" && !verb.startsWith("aud.")) return null;
  const bits = verb.split(".");
  const op = bits[1] ?? "all";
  if (bits.length > 2 || parts.length > 1) return fail("Não entendi.", entities);
  const holes = furos(entities);
  const show = (titulo: string, linhas: string[]) => ok(titulo, linhas.length ? linhas : ["Fecha."], entities);
  if (op === "all") {
    const linhas = [...holes.links, ...holes.identities, ...holes.instances, ...holes.continuity, ...holes.references];
    return show("Auditoria", linhas);
  }
  if (op === "links") return show("Ligações", holes.links);
  if (op === "identities") return show("Identidades", holes.identities);
  if (op === "instances") return show("Cópias", holes.instances);
  if (op === "continuity") return show("Continuidade", holes.continuity);
  if (op === "references") return show("Referências", holes.references);
  return fail("Não entendi.", entities);
}

function lineIndexAt(source: string, offset: number): number {
  const clamped = Math.max(0, Math.min(offset, source.length));
  let line = 0;
  for (let i = 0; i < clamped; i++) if (source[i] === "\n") line++;
  return line;
}

function withoutLine(source: string, index: number): { source: string; offset: number } {
  const lines = source.split("\n");
  lines.splice(index, 1);
  const next = lines.join("\n");
  if (index >= lines.length) return { source: next, offset: next.length };
  let at = 0;
  for (let i = 0; i < index; i++) at += lines[i]!.length + 1;
  return { source: next, offset: at };
}

/**
 * Corre a linha do cursor se ela começa por `>`.
 * Sucesso: a linha sai. Falha: a linha fica. `null` se não é comando.
 * `ent` e `id` gravam no editor de entidades. `mut` vira anotação.
 */
export function aplicarLinhaComando(
  source: string,
  offset: number,
  entities = "",
): { source: string; offset: number; cartao: CartaoComando; entities: string; anotacao?: AnotacaoComando } | null {
  const lines = source.split("\n");
  const index = lineIndexAt(source, offset);
  const corpo = corpoComando(lines[index] ?? "");
  if (corpo === null) return null;
  const efeito = correrComando(corpo, entities);
  if (!efeito.cartao.ok || !efeito.mut) {
    if (!efeito.cartao.ok) return { source, offset, cartao: efeito.cartao, entities };
    const next = withoutLine(source, index);
    return { source: next.source, offset: next.offset, cartao: efeito.cartao, entities: efeito.entities };
  }
  const anchor = anchorOf(lines, index, efeito.mut.id);
  if (!anchor) return { source, offset, cartao: { ok: false, titulo: "Não há prosa para marcar.", linhas: [] }, entities };
  const next = withoutLine(source, index);
  const heading = headingOf(next.source, anchor.line);
  const hit = rebindAnnotation(next.source, {
    id: "a0",
    book: "book-0",
    heading,
    quote: anchor.quote,
    do: efeito.mut.do,
    column: anchor.column,
  });
  if ("error" in hit) {
    const titulo = hit.error === "ambiguous" ? "Esta marca fica ambígua." : "Não há prosa para marcar.";
    return { source, offset, cartao: { ok: false, titulo, linhas: [] }, entities };
  }
  return {
    source: next.source,
    offset: next.offset,
    cartao: { ok: true, titulo: "Marquei ¹", linhas: efeito.mut.linhas },
    entities,
    anotacao: { heading, quote: anchor.quote, do: efeito.mut.do, column: anchor.column },
  };
}

function anchorOf(lines: string[], before: number, id: string): { line: number; quote: string; column: number } | null {
  const bare = id.slice(1);
  for (let i = before - 1; i >= 0; i--) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith(">") || trimmed.startsWith("#")) continue;
    if (/^(caderno|autora|autor|data|dedicatoria)\s*:/i.test(trimmed)) continue;
    if (/^##?\s+/.test(trimmed) || trimmed === "---") continue;
    for (const token of [id, bare]) {
      const at = raw.indexOf(token);
      if (at >= 0 && raw.indexOf(token, at + token.length) < 0) return { line: i + 1, quote: token, column: at };
    }
    const column = raw.indexOf(trimmed);
    if (column >= 0) return { line: i + 1, quote: trimmed, column };
  }
  return null;
}
