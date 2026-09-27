import { makeIssue, ParseError, stripLineComment, tokenize, TokenCursor } from "./lexer.ts";
import { effectiveTags, type CompiledTaxonomy } from "./taxonomy.ts";
import {
  CATEGORY_TAGS,
  type Entity,
  type EnumState,
  type Issue,
  type StatValue,
  type TickFuse,
  type WorldModel,
} from "./types.ts";

const FILE = "entities";

export type EntityDef = { source: string; startLine: number; endLine: number; kind: "dotted" | "block" | "start" };

export type EntityPatch = Partial<Omit<Entity, "id" | "tags">> & { id?: string; tags?: Iterable<string> };

const SECTION_KEYS =
  "id|slug|shortCode|templateId|name|description|tags|stats|flags|enums|phrases|hardLinks|softLinks|links|lists|fuses|struct|voice|aliases";

const SECTION_NORM: Record<string, string> = {
  id: "shortCode",
  slug: "slug",
  shortcode: "shortCode",
  templateid: "templateId",
  name: "name",
  description: "description",
  tags: "tags",
  stats: "stats",
  flags: "flags",
  enums: "enums",
  phrases: "phrases",
  hardlinks: "hardLinks",
  softlinks: "softLinks",
  links: "links",
  lists: "lists",
  fuses: "fuses",
  struct: "struct",
  voice: "voice",
  aliases: "aliases",
};

function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function shortCodeFromSlug(slug: string): string {
  const core = slug.replace(/^@/, "").toUpperCase();
  const hex = fnv1a(core).toString(16).toUpperCase().padStart(4, "0");
  return `#${hex.slice(-4)}`;
}

export function systemIdFromSlug(slug: string): string {
  const core = slug.replace(/^@/, "").toUpperCase();
  const a = fnv1a(`lume:${core}`).toString(16).padStart(8, "0");
  const b = fnv1a(`lume:${core}#`).toString(16).padStart(8, "0");
  const c = fnv1a(`#lume:${core}`).toString(16).padStart(8, "0");
  const d = fnv1a(`${core}${core}`).toString(16).padStart(8, "0");
  const h = (a + b + c + d).slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function cloneStats(stats: Record<string, StatValue>): Record<string, StatValue> {
  const out: Record<string, StatValue> = {};
  for (const [key, value] of Object.entries(stats)) {
    out[key] = typeof value === "number" ? value : { ...value };
  }
  return out;
}

function cloneLists(lists: Entity["lists"]): Entity["lists"] {
  const out: Entity["lists"] = {};
  for (const [key, value] of Object.entries(lists)) out[key] = [...value];
  return out;
}

function cloneFuses(fuses: Entity["fuses"]): Entity["fuses"] {
  const out: Entity["fuses"] = {};
  for (const [key, value] of Object.entries(fuses)) out[key] = { ...value };
  return out;
}

export function syncLinks(entity: Entity): Entity {
  entity.links = { ...entity.hardLinks, ...entity.softLinks };
  return entity;
}

export function createEmptyEntity(id: string, patch: EntityPatch = {}): Entity {
  const slug = patch.slug ?? id;
  const entity: Entity = {
    id,
    slug,
    systemId: patch.systemId ?? systemIdFromSlug(slug),
    shortCode: patch.shortCode ?? shortCodeFromSlug(slug),
    templateId: patch.templateId,
    name: patch.name ?? "",
    description: patch.description ?? "",
    tags: new Set(patch.tags ?? []),
    stats: cloneStats(patch.stats ?? {}),
    flags: { ...(patch.flags ?? {}) },
    enums: cloneEnums(patch.enums),
    phrases: { ...(patch.phrases ?? {}) },
    hardLinks: { ...(patch.hardLinks ?? {}) },
    softLinks: { ...(patch.softLinks ?? {}) },
    links: { ...(patch.links ?? {}) },
    lists: cloneLists(patch.lists ?? {}),
    fuses: cloneFuses(patch.fuses ?? {}),
    struct: { ...(patch.struct ?? {}) },
    extra: patch.extra ? { ...patch.extra } : undefined,
  };
  if (!entity.shortCode.startsWith("#")) entity.shortCode = `#${entity.shortCode}`;
  return syncLinks(entity);
}

export function isStartDecl(text: string): boolean {
  return /^start\s*\(\s*\)\s*;?$/i.test(text.trim());
}

export function makeStartEntity(): Entity {
  return createEmptyEntity("start", { tags: ["hidden"] });
}

export function isSystemEntityId(id: string): boolean {
  return id === "start" || id === "__VOCAB__";
}

export function isCanonicalEntityId(id: string): boolean {
  return /^@[a-z][a-z0-9_]*$/.test(id);
}

export function isLegacyEntityId(id: string): boolean {
  return /^[A-Z_][A-Z0-9_]*$/.test(id);
}

export function canonicalEntityId(raw: string): string {
  const t = raw.trim();
  if (t.toLowerCase() === "start" || t.toLowerCase() === "@start") return "start";
  if (t === "__VOCAB__") return t;
  if (t.startsWith("@")) return `@${t.slice(1).toLowerCase()}`;
  return `@${t.toLowerCase()}`;
}

export function assertEntityId(raw: string, line = 1): string {
  const t = raw.trim();
  if (isSystemEntityId(t)) return t;
  if (t === "@start") throw new ParseError(makeIssue("E040", "error", { id: t }, { file: FILE, line, column: 1 }));
  if (isCanonicalEntityId(t)) return t;
  throw new ParseError(makeIssue("E040", "error", { id: t || raw }, { file: FILE, line, column: 1 }));
}

export function cloneEntity(entity: Entity): Entity {
  return createEmptyEntity(entity.id, {
    slug: entity.slug,
    systemId: entity.systemId,
    shortCode: entity.shortCode,
    templateId: entity.templateId,
    name: entity.name,
    description: entity.description,
    tags: entity.tags,
    stats: entity.stats,
    flags: entity.flags,
    enums: entity.enums,
    phrases: entity.phrases,
    hardLinks: entity.hardLinks,
    softLinks: entity.softLinks,
    links: entity.links,
    lists: entity.lists,
    fuses: entity.fuses,
    struct: entity.struct,
    extra: entity.extra,
  });
}

export function cloneWorldModel(world: WorldModel): WorldModel {
  const next: WorldModel = new Map();
  for (const [id, entity] of world) next.set(id, cloneEntity(entity));
  return next;
}

export function getLink(world: WorldModel, id: string, key: string, taxonomy?: CompiledTaxonomy | null): string | null {
  const raw = world.get(id) ?? findEntityByQuad(world, id);
  if (!raw) return null;
  const entity = withInheritedDrawers(raw, world, taxonomy);
  const value = entity.links[key] ?? entity.softLinks[key] ?? entity.hardLinks[key];
  if (value == null || value === "") return null;
  return value;
}

/** Resolve Quad-ID: HumanSlug, shortCode `#A8F2` ou systemId UUID. */
export function findEntityByQuad(world: WorldModel, token: string): Entity | undefined {
  const raw = token.trim();
  if (!raw) return undefined;
  const direct = world.get(raw);
  if (direct) return direct;
  const code = raw.startsWith("#") ? raw.toUpperCase() : `#${raw.toUpperCase()}`;
  for (const entity of world.values()) {
    if (entity.slug === raw) return entity;
    if (entity.shortCode.toUpperCase() === code) return entity;
    if (entity.systemId === raw) return entity;
  }
  return undefined;
}

function donorForTag(world: WorldModel, tag: string): Entity | undefined {
  if (tag === "hidden") return undefined;
  const id = tag.startsWith("@") ? tag : `@${tag}`;
  return world.get(id) ?? world.get(tag) ?? findEntityByQuad(world, id);
}

function copyStat(value: StatValue): StatValue {
  return typeof value === "number" ? value : { ...value };
}

/** Preenche gavetas em falta. Não copia tags, name nem description. A chave já presente ganha. */
function takeMissingDrawers(dst: Entity, src: Entity): boolean {
  let took = false;
  for (const [key, value] of Object.entries(src.stats)) {
    if (key in dst.stats) continue;
    dst.stats[key] = copyStat(value);
    took = true;
  }
  for (const [key, value] of Object.entries(src.flags)) {
    if (key in dst.flags) continue;
    dst.flags[key] = value;
    took = true;
  }
  for (const [key, value] of Object.entries(src.enums)) {
    if (key in dst.enums) continue;
    dst.enums[key] = { current: value.current, states: [...value.states] };
    took = true;
  }
  for (const [key, value] of Object.entries(src.phrases)) {
    if (key in dst.phrases) continue;
    dst.phrases[key] = value;
    took = true;
  }
  for (const [key, value] of Object.entries(src.hardLinks)) {
    if (key in dst.hardLinks || key in dst.softLinks) continue;
    dst.hardLinks[key] = value;
    took = true;
  }
  for (const [key, value] of Object.entries(src.softLinks)) {
    if (key in dst.softLinks || key in dst.hardLinks) continue;
    dst.softLinks[key] = value;
    took = true;
  }
  for (const [key, value] of Object.entries(src.lists)) {
    if (key in dst.lists) continue;
    dst.lists[key] = [...value];
    took = true;
  }
  for (const [key, value] of Object.entries(src.fuses)) {
    if (key in dst.fuses) continue;
    dst.fuses[key] = { ...value };
    took = true;
  }
  for (const [key, value] of Object.entries(src.struct)) {
    if (key in dst.struct) continue;
    dst.struct[key] = value;
    took = true;
  }
  return took;
}

/**
 * Vista de leitura. O objeto guardado no mundo não muda.
 * O pai é a entidade com o mesmo nome da tag ancestral (`escudeiro → guarda` lê `@guarda`).
 */
export function withInheritedDrawers(entity: Entity, world: WorldModel, taxonomy?: CompiledTaxonomy | null): Entity {
  if (!taxonomy || taxonomy.parents.size === 0 || entity.tags.size === 0) return entity;
  const donors: Entity[] = [];
  const seen = new Set<string>([entity.id]);
  for (const tag of entity.tags) {
    const chain = taxonomy.ancestors.get(tag);
    if (!chain) continue;
    for (const ancestor of chain) {
      const donor = donorForTag(world, ancestor);
      if (!donor || seen.has(donor.id)) continue;
      seen.add(donor.id);
      donors.push(donor);
    }
  }
  if (!donors.length) return entity;
  const next = cloneEntity(entity);
  let took = false;
  for (const donor of donors) took = takeMissingDrawers(next, donor) || took;
  return took ? syncLinks(next) : entity;
}

export function readStat(entity: Entity, key: string): number {
  const value = entity.stats[key];
  if (value == null) return 0;
  return typeof value === "number" ? value : value.value;
}

export function writeStat(entity: Entity, key: string, next: number): void {
  const current = entity.stats[key];
  if (current && typeof current === "object") {
    current.value = Math.min(current.max, Math.max(current.min, next));
    return;
  }
  entity.stats[key] = next;
}

export function getStat(world: WorldModel, id: string, key: string): number | null {
  const entity = world.get(id);
  if (!entity || !(key in entity.stats)) return null;
  return readStat(entity, key);
}

export function hasTag(world: WorldModel, id: string, tag: string): boolean {
  return world.get(id)?.tags.has(tag) ?? false;
}

export function assignLink(entity: Entity, key: string, dest: string, kind: "hard" | "soft" | "auto" = "auto"): void {
  if (kind === "hard" || (kind === "auto" && Object.prototype.hasOwnProperty.call(entity.hardLinks, key))) {
    entity.hardLinks[key] = dest;
    delete entity.softLinks[key];
  } else {
    entity.softLinks[key] = dest;
  }
  syncLinks(entity);
}

export function clearLink(entity: Entity, key: string): void {
  delete entity.hardLinks[key];
  delete entity.softLinks[key];
  syncLinks(entity);
}

function cloneEnums(src: Record<string, EnumState> | undefined): Record<string, EnumState> {
  const out: Record<string, EnumState> = {};
  if (!src) return out;
  for (const [key, value] of Object.entries(src)) {
    if (!value || !Array.isArray(value.states)) continue;
    const states = value.states.map((item) => String(item)).filter(Boolean);
    const current = states.includes(value.current) ? value.current : states[0];
    if (!current || states.length < 2) continue;
    out[key] = { current, states };
  }
  return out;
}

export function assignEnum(entity: Entity, key: string, value: string, line = 1): void {
  const slot = entity.enums[key];
  if (!slot || !slot.states.includes(value)) fail(`enum ${key} não aceita ${value}`, line);
  slot.current = value;
}

function fail(detail: string, line: number, column = 1): never {
  throw new ParseError(makeIssue("E000", "error", { detail }, { file: FILE, line, column }));
}

function isTrueToken(raw: string): boolean {
  return /^(true|sim|yes)$/i.test(raw);
}
function isFalseToken(raw: string): boolean {
  return /^(false|nao|não|no)$/i.test(raw);
}

function applyField(entity: Entity, key: string, raw: string | undefined, line: number, column: number) {
  const nk = key.toLowerCase();
  if (nk === "name") {
    entity.name = raw ?? "";
    return;
  }
  if (nk === "description") {
    entity.description = raw ?? "";
    return;
  }
  if (nk === "templateid") {
    entity.templateId = raw || undefined;
    return;
  }
  if (nk === "slug") {
    if (raw) entity.slug = raw;
    return;
  }
  if (nk === "shortcode") {
    if (raw) entity.shortCode = raw.startsWith("#") ? raw : `#${raw}`;
    return;
  }
  if (nk === "id" || nk === "systemid") {
    if (raw) entity.systemId = raw;
    return;
  }
  if (raw === undefined) {
    entity.tags.add(key);
    return;
  }
  if (isTrueToken(raw) || isFalseToken(raw)) {
    entity.flags[key] = isTrueToken(raw);
    return;
  }
  if (/^-?\d+(\.\d+)?$/.test(raw) || /^-?\d+(\.\d+)?\s*\[/.test(raw)) {
    if (key in entity.links || key in entity.hardLinks || key in entity.softLinks) {
      throw new ParseError(makeIssue("E004", "error", { key }, { file: FILE, line, column, endColumn: column + key.length }));
    }
    entity.stats[key] = parseStatValue(raw, line);
    return;
  }
  if (key in entity.stats) {
    throw new ParseError(makeIssue("E004", "error", { key }, { file: FILE, line, column, endColumn: column + key.length }));
  }
  assignLink(entity, key, raw, "soft");
}

export function parseDottedEntity(line: string, startLine = 1): Entity {
  const { code } = stripLineComment(line);
  const trimmed = code.trim();
  if (!trimmed) fail("linha de entidade vazia", startLine);
  const tokens = tokenize(trimmed, { file: FILE, startLine });
  const cur = new TokenCursor(tokens);
  const idTok = cur.expect("IDENT", FILE, "esperado id de entidade");
  const entity = createEmptyEntity(assertEntityId(idTok.value, startLine));
  while (cur.at("DOT")) {
    cur.consume();
    const keyTok = cur.expect("IDENT", FILE, "esperado tag, stat ou link");
    if (cur.at("EQ")) {
      cur.consume();
      const valueTok = cur.peek();
      if (valueTok.kind === "NUMBER") {
        cur.consume();
        applyField(entity, keyTok.value, String(valueTok.number ?? valueTok.value), keyTok.line, keyTok.column);
      } else if (valueTok.kind === "IDENT" || valueTok.kind === "DOLLAR") {
        cur.consume();
        applyField(entity, keyTok.value, valueTok.value, keyTok.line, keyTok.column);
      } else fail("esperado número ou id depois de =", valueTok.line, valueTok.column);
    } else {
      entity.tags.add(keyTok.value);
    }
  }
  if (!cur.at("EOF")) {
    const t = cur.peek();
    fail(`token inesperado '${t.value}'`, t.line, t.column);
  }
  return syncLinks(entity);
}

function splitSections(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = new RegExp(`(${SECTION_KEYS})\\s*:`, "gi");
  const hits: { key: string; index: number; end: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(body))) {
    hits.push({ key: SECTION_NORM[match[1]!.toLowerCase()] ?? match[1]!.toLowerCase(), index: match.index, end: match.index + match[0].length });
  }
  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i]!;
    const until = hits[i + 1]?.index ?? body.length;
    let raw = body.slice(hit.end, until).trim();
    if (raw.endsWith(";")) raw = raw.slice(0, -1).trim();
    out[hit.key] = raw;
  }
  return out;
}

function splitList(raw: string): string[] {
  const out: string[] = [];
  let buf = "";
  let quote: string | null = null;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!;
    if (quote) {
      if (ch === "\\") {
        buf += ch + (raw[i + 1] ?? "");
        i += 1;
        continue;
      }
      buf += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === ",") {
      if (buf.trim()) out.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

export function isLinkTarget(raw: string): boolean {
  const t = unquote(raw).trim();
  if (!t) return false;
  if (/^#[0-9A-Fa-f]{4}$/.test(t)) return true;
  if (isCanonicalEntityId(t) || isSystemEntityId(t)) return true;
  return false;
}

function quoteSingle(s: string): string {
  return `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

export function formatStatInput(raw: string): string | null {
  const t = raw.trim();
  const bounded = t.match(/^(-?\d+(?:[.,]\d+)?)\s*\[\s*(-?\d+(?:[.,]\d+)?)\s*\.\.\s*(-?\d+(?:[.,]\d+)?)\s*\]$/);
  if (bounded) {
    const value = Number(bounded[1]!.replace(",", "."));
    const min = Number(bounded[2]!.replace(",", "."));
    const max = Number(bounded[3]!.replace(",", "."));
    if (![value, min, max].every(Number.isFinite) || min > max) return null;
    const clamped = Math.min(max, Math.max(min, value));
    return `${clamped}[${min}..${max}]`;
  }
  if (!/^-?\d+(?:[.,]\d+)?$/.test(t)) return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return String(n);
}

function parseStatValue(raw: string, line: number): StatValue {
  const bounded = raw.trim().match(/^(-?\d+(?:\.\d+)?)\s*\[\s*(-?\d+(?:\.\d+)?)\s*\.\.\s*(-?\d+(?:\.\d+)?)\s*\]$/);
  if (bounded) {
    const value = Number(bounded[1]);
    const min = Number(bounded[2]);
    const max = Number(bounded[3]);
    return { value: Math.min(max, Math.max(min, value)), min, max };
  }
  if (!/^-?\d+(\.\d+)?$/.test(raw.trim())) fail(`stat precisa de número ou gauge: ${raw}`, line);
  return Number(raw.trim());
}

export function formatStat(value: StatValue): string {
  if (typeof value === "number") return String(value);
  return `${value.value}[${value.min}..${value.max}]`;
}

function parsePairs(raw: string, line: number): { key: string; value: string }[] {
  const items = splitList(raw);
  const pairs: { key: string; value: string }[] = [];
  for (const item of items) {
    const eq = item.indexOf("=");
    if (eq < 0) fail(`par sem = : ${item}`, line);
    pairs.push({ key: item.slice(0, eq).trim(), value: item.slice(eq + 1).trim() });
  }
  return pairs;
}

function parseEnumDrawer(raw: string, line: number): Record<string, EnumState> {
  const enums: Record<string, EnumState> = {};
  const s = raw.trim();
  if (!s) return enums;
  let i = 0;
  while (i < s.length) {
    while (i < s.length && (s[i] === "," || /\s/.test(s[i]!))) i += 1;
    if (i >= s.length) break;
    const rest = s.slice(i);
    const head = rest.match(/^([\p{L}_][\p{L}\p{N}\p{M}_]*)\s*=\s*/u);
    if (!head) fail(`enum precisa de nome=[estado, estado]: ${rest}`, line);
    i += head[0].length;
    const name = head[1]!;
    if (s[i] !== "[") fail(`enum ${name} precisa de nome=[estado, estado]`, line);
    i += 1;
    let inner = "";
    let closed = false;
    while (i < s.length) {
      const ch = s[i]!;
      if (ch === "]") {
        closed = true;
        i += 1;
        break;
      }
      inner += ch;
      i += 1;
    }
    if (!closed) fail(`enum ${name} sem ]`, line);
    const states = splitList(inner).map((item) => unquote(item)).filter(Boolean);
    if (states.length < 2) fail(`enum ${name} precisa de pelo menos 2 estados`, line);
    enums[name] = { current: states[0]!, states };
  }
  return enums;
}

function parseListDrawer(raw: string, line: number): Record<string, Array<string | number>> {
  const lists: Record<string, Array<string | number>> = {};
  const s = raw.trim();
  if (!s) return lists;
  let i = 0;
  while (i < s.length) {
    while (i < s.length && (s[i] === "," || /\s/.test(s[i]!))) i += 1;
    if (i >= s.length) break;
    const rest = s.slice(i);
    const head = rest.match(/^([\p{L}_][\p{L}\p{N}\p{M}_]*)\s*=\s*/u);
    if (!head) fail(`lista precisa de nome=[…]: ${rest}`, line);
    i += head[0].length;
    const name = head[1]!;
    if (s[i] !== "[") fail(`lista ${name} precisa de […]`, line);
    i += 1;
    let inner = "";
    let quote: string | null = null;
    let closed = false;
    while (i < s.length) {
      const ch = s[i]!;
      if (quote) {
        inner += ch;
        if (ch === "\\" && i + 1 < s.length) {
          inner += s[i + 1];
          i += 2;
          continue;
        }
        if (ch === quote) quote = null;
        i += 1;
        continue;
      }
      if (ch === "'" || ch === '"') {
        quote = ch;
        inner += ch;
        i += 1;
        continue;
      }
      if (ch === "]") {
        closed = true;
        i += 1;
        break;
      }
      inner += ch;
      i += 1;
    }
    if (!closed) fail(`lista ${name} sem ]`, line);
    lists[name] = inner.trim() ? splitList(inner).map(coerceListItem) : [];
  }
  return lists;
}

function coerceListItem(raw: string): string | number {
  const t = unquote(raw);
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : t;
}

export function formatFuseValue(raw: string): string | null {
  const m = raw.trim().match(/^(-?\d+)(?:\s*[.>:→]\s*(@?[\p{L}_][\p{L}\p{N}\p{M}_]*))?$/u);
  if (!m) return null;
  return m[2] ? `${m[1]}>${m[2]}` : m[1]!;
}

function parseFuse(raw: string, line: number): TickFuse {
  const m = raw.trim().match(/^(-?\d+)(?:\s*[>→:]\s*(@?[\p{L}_][\p{L}\p{N}\p{M}_]*))?$/u);
  if (!m) fail(`fuse inválido: ${raw}`, line);
  return { remaining: Number(m[1]), targetId: m[2] ?? "" };
}

function parseStructValue(raw: string): unknown {
  const text = unquote(raw).trim();
  if (!text) return {};
  if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      /* compact form */
    }
  }
  if (text.includes(":")) {
    const obj: Record<string, unknown> = {};
    for (const part of splitList(text)) {
      const colon = part.indexOf(":");
      if (colon < 0) continue;
      const key = part.slice(0, colon).trim();
      const val = part.slice(colon + 1).trim();
      obj[key] = /^-?\d+(\.\d+)?$/.test(val) ? Number(val) : unquote(val);
    }
    return obj;
  }
  return text;
}

export function parseBlockEntity(id: string, body: string, startLine = 1): Entity {
  const entity = createEmptyEntity(id);
  const sections = splitSections(body);
  if (sections.slug) entity.slug = unquote(sections.slug);
  if (sections.systemId) entity.systemId = unquote(sections.systemId);
  if (sections.shortCode) {
    const code = unquote(sections.shortCode);
    entity.shortCode = code.startsWith("#") ? code : `#${code}`;
  }
  if (sections.templateId) entity.templateId = unquote(sections.templateId);
  if (sections.name) entity.name = unquote(sections.name);
  if (sections.description) entity.description = unquote(sections.description);

  for (const item of splitList(sections.tags ?? "")) {
    const tag = item.replace(/;$/, "").trim();
    if (tag) entity.tags.add(tag);
  }
  if (sections.stats) {
    for (const { key, value } of parsePairs(sections.stats, startLine)) {
      entity.stats[key] = parseStatValue(value, startLine);
    }
  }
  if (sections.flags) {
    for (const item of splitList(sections.flags)) {
      const eq = item.indexOf("=");
      if (eq < 0) fail(`flag precisa de =true ou =false: ${item}`, startLine);
      const key = item.slice(0, eq).trim();
      const val = item.slice(eq + 1).trim();
      if (!/^(true|false)$/i.test(val)) fail(`flag precisa de =true ou =false: ${item}`, startLine);
      entity.flags[key] = /^true$/i.test(val);
    }
  }
  if (sections.enums) Object.assign(entity.enums, parseEnumDrawer(sections.enums, startLine));
  if (sections.phrases) {
    for (const { key, value } of parsePairs(sections.phrases, startLine)) {
      entity.phrases[key] = unquote(value);
    }
  }
  if (sections.hardLinks) {
    for (const { key, value } of parsePairs(sections.hardLinks, startLine)) {
      const dest = unquote(value);
      if (dest && !isLinkTarget(dest)) fail(`link precisa de ID ou #A8F2: ${key}=${value}`, startLine);
      entity.hardLinks[key] = dest;
    }
  }
  if (sections.softLinks) {
    for (const { key, value } of parsePairs(sections.softLinks, startLine)) {
      const dest = unquote(value);
      if (dest && !isLinkTarget(dest)) fail(`link precisa de ID ou #A8F2: ${key}=${value}`, startLine);
      entity.softLinks[key] = dest;
    }
  }
  if (sections.links) {
    for (const { key, value } of parsePairs(sections.links, startLine)) {
      const dest = unquote(value);
      if (dest && !isLinkTarget(dest)) fail(`link precisa de ID ou #A8F2: ${key}=${value}`, startLine);
      if (!(key in entity.hardLinks)) entity.softLinks[key] = dest;
    }
  }
  if (sections.lists) entity.lists = parseListDrawer(sections.lists, startLine);
  if (sections.fuses) {
    for (const { key, value } of parsePairs(sections.fuses, startLine)) {
      const fuse = parseFuse(value, startLine);
      if (!fuse.targetId) fuse.targetId = key;
      entity.fuses[key] = fuse;
    }
  }
  if (sections.struct) {
    for (const { key, value } of parsePairs(sections.struct, startLine)) {
      entity.struct[key] = parseStructValue(value);
    }
  }
  if (sections.voice || sections.aliases) {
    entity.extra = {
      ...(entity.extra ?? {}),
      ...(sections.voice ? { voice: unquote(sections.voice) } : {}),
      ...(sections.aliases ? { aliases: unquote(sections.aliases) } : {}),
    };
  }
  if (!entity.name && entity.extra?.name) entity.name = entity.extra.name;
  if (!entity.description && entity.extra?.description) entity.description = entity.extra.description;
  return syncLinks(entity);
}

export function preprocessEntityFile(source: string): { defs: EntityDef[] } {
  const lines = source.replace(/^\uFEFF/, "").split(/\n/);
  const defs: EntityDef[] = [];
  let i = 0;
  while (i < lines.length) {
    const { code } = stripLineComment(lines[i] ?? "");
    const trimmed = code.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      i += 1;
      continue;
    }
    if (isStartDecl(trimmed)) {
      defs.push({ source: "start()", startLine: i + 1, endLine: i + 1, kind: "start" });
      i += 1;
      continue;
    }
    const block = trimmed.match(/^(@?[\p{L}_][\p{L}\p{N}\p{M}_]*)\s*\.\s*\{(.*)$/u);
    if (block) {
      const id = block[1]!;
      const startLine = i + 1;
      let buf = block[2] ?? "";
      if (buf.includes("}")) {
        const cut = buf.indexOf("}");
        defs.push({ source: id + ".{\n" + buf.slice(0, cut) + "\n}", startLine, endLine: i + 1, kind: "block" });
        i += 1;
        continue;
      }
      let end = i;
      while (end + 1 < lines.length) {
        end += 1;
        buf += "\n" + (lines[end] ?? "");
        if ((lines[end] ?? "").includes("}")) break;
      }
      const inner = buf.replace(/\}[^}]*$/, "");
      defs.push({ source: `${id}.{${inner}}`, startLine, endLine: end + 1, kind: "block" });
      i = end + 1;
      continue;
    }
    if (trimmed.startsWith(".")) {
      i += 1;
      continue;
    }
    let joined = trimmed;
    const startLine = i + 1;
    let end = i;
    while (end + 1 < lines.length) {
      const next = stripLineComment(lines[end + 1] ?? "").code.trim();
      if (!next.startsWith(".")) break;
      joined += next;
      end += 1;
    }
    defs.push({ source: joined, startLine, endLine: end + 1, kind: "dotted" });
    i = end + 1;
  }
  return { defs };
}

export function parseEntityLine(source: string, startLine = 1): Entity {
  const trimmed = source.trim();
  if (isStartDecl(trimmed)) return makeStartEntity();
  const block = trimmed.match(/^(@?[\p{L}_][\p{L}\p{N}\p{M}_]*)\s*\.\s*\{([\s\S]*)\}\s*$/u);
  if (block) return parseBlockEntity(assertEntityId(block[1]!, startLine), block[2] ?? "", startLine);
  return parseDottedEntity(source, startLine);
}

function isLiveLinkTarget(target: string): boolean {
  return Boolean(target) && target !== "$" && target !== '""';
}

export function compileEntityFile(source: string): { worldModel: WorldModel; errors: Issue[]; warnings: Issue[] } {
  const { defs } = preprocessEntityFile(source);
  const worldModel: WorldModel = new Map();
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  for (const def of defs) {
    try {
      const entity = parseEntityLine(def.source, def.startLine);
      if (worldModel.has(entity.id)) {
        errors.push(makeIssue("E007", "error", { id: entity.id }, { file: FILE, line: def.startLine, column: 1 }));
        continue;
      }
      worldModel.set(entity.id, entity);
    } catch (err) {
      if (err instanceof ParseError) errors.push(...err.issues);
      else errors.push(makeIssue("E000", "error", { detail: err instanceof Error ? err.message : String(err) }, { file: FILE, line: def.startLine, column: 1 }));
    }
  }
  if (!worldModel.has("start")) worldModel.set("start", makeStartEntity());
  for (const entity of worldModel.values()) {
    for (const [key, target] of Object.entries(entity.links)) {
      if (!isLiveLinkTarget(target)) continue;
      if (worldModel.has(target)) continue;
      errors.push(makeIssue("E001", "error", { id: target }, { file: FILE, line: 1, column: 1 }));
      void key;
    }
  }
  return { worldModel, errors, warnings };
}

export function primaryTag(entity: Entity, taxonomy?: CompiledTaxonomy | null): string {
  const tags = effectiveTags(entity.tags, taxonomy);
  for (const tag of CATEGORY_TAGS) if (tags.has(tag)) return tag;
  if (entity.tags.has("hidden")) return "hidden";
  return [...entity.tags][0] ?? "outro";
}

export function groupEntitiesByPrimaryTag(world: WorldModel, taxonomy?: CompiledTaxonomy | null): Map<string, Entity[]> {
  const groups = new Map<string, Entity[]>();
  for (const tag of CATEGORY_TAGS) groups.set(tag, []);
  for (const entity of world.values()) {
    const tag = primaryTag(entity, taxonomy);
    const list = groups.get(tag) ?? [];
    list.push(entity);
    groups.set(tag, list);
  }
  return groups;
}

export function attachEntityExtras(world: WorldModel, extras: Record<string, Record<string, string>>): WorldModel {
  const next = cloneWorldModel(world);
  for (const [id, extra] of Object.entries(extras)) {
    const entity = next.get(id);
    if (!entity) continue;
    entity.extra = { ...(entity.extra ?? {}), ...extra };
    if (!entity.name && extra.name) entity.name = extra.name;
    if (!entity.description && extra.description) entity.description = extra.description;
  }
  return next;
}

function overlayTemplate(proto: Entity, overlay: Entity): Entity {
  const next = cloneEntity(proto);
  next.id = overlay.id;
  next.slug = overlay.slug;
  next.systemId = overlay.systemId;
  next.shortCode = overlay.shortCode;
  next.templateId = overlay.templateId ?? proto.id;
  if (overlay.name) next.name = overlay.name;
  if (overlay.description) next.description = overlay.description;
  for (const tag of overlay.tags) next.tags.add(tag);
  Object.assign(next.stats, overlay.stats);
  Object.assign(next.flags, overlay.flags);
  for (const [key, value] of Object.entries(overlay.enums)) {
    next.enums[key] = { current: value.current, states: [...value.states] };
  }
  Object.assign(next.phrases, overlay.phrases);
  Object.assign(next.hardLinks, overlay.hardLinks);
  Object.assign(next.softLinks, overlay.softLinks);
  Object.assign(next.lists, overlay.lists);
  Object.assign(next.fuses, overlay.fuses);
  Object.assign(next.struct, overlay.struct);
  return syncLinks(next);
}

export function instantiateFromTemplate(world: WorldModel, entity: Entity): Entity {
  const tid = entity.templateId;
  if (!tid) return entity;
  const proto = world.get(tid);
  if (!proto) return entity;
  return overlayTemplate(proto, entity);
}

export function destroyEntityInWorld(world: WorldModel, id: string, seen = new Set<string>()): void {
  if (seen.has(id)) return;
  seen.add(id);
  const entity = world.get(id);
  if (!entity) return;
  for (const child of Object.values(entity.hardLinks)) {
    if (child && child !== id) destroyEntityInWorld(world, child, seen);
  }
  world.delete(id);
  for (const other of world.values()) {
    for (const [key, target] of Object.entries(other.softLinks)) {
      if (target === id) {
        other.softLinks[key] = "";
      }
    }
    for (const [key, target] of Object.entries(other.hardLinks)) {
      if (target === id) delete other.hardLinks[key];
    }
    syncLinks(other);
  }
}

export function tickFuses(world: WorldModel): { world: WorldModel; fired: string[] } {
  const next = cloneWorldModel(world);
  const fired: string[] = [];
  let changed = false;
  for (const entity of next.values()) {
    for (const [key, fuse] of Object.entries(entity.fuses)) {
      if (fuse.remaining > 0) {
        fuse.remaining -= 1;
        changed = true;
      }
      if (fuse.remaining <= 0) {
        fired.push(fuse.targetId || key);
        delete entity.fuses[key];
        changed = true;
      }
    }
  }
  return { world: changed ? next : world, fired };
}

function emitDrawer(key: string, value: string, always = false): string {
  if (!always && !value.trim()) return "";
  return `\n  ${key}: ${value};`;
}

function formatEnumDrawer(enums: Entity["enums"]): string {
  return Object.entries(enums)
    .map(([key, value]) => `${key}=[${value.states.join(", ")}]`)
    .join(", ");
}

function formatListDrawer(lists: Entity["lists"]): string {
  return Object.entries(lists)
    .map(([key, items]) => `${key}=[${items.join(", ")}]`)
    .join(", ");
}

function quoteName(s: string): string {
  if (!s) return s;
  if (/[;']/.test(s)) return quoteSingle(s);
  return s;
}

export function serializeEntityBlock(entity: Entity): string {
  if (
    entity.id === "start" &&
    [...entity.tags].every((t) => t === "hidden") &&
    Object.keys(entity.stats).length === 0 &&
    Object.keys(entity.hardLinks).length === 0 &&
    Object.keys(entity.softLinks).length === 0
  ) {
    return "start()";
  }
  const tags = [...entity.tags].join(", ");
  const stats = Object.entries(entity.stats)
    .map(([k, v]) => `${k}=${formatStat(v)}`)
    .join(", ");
  const flags = Object.entries(entity.flags)
    .map(([k, v]) => `${k}=${v ? "true" : "false"}`)
    .join(", ");
  const enums = formatEnumDrawer(entity.enums);
  const phrases = Object.entries(entity.phrases)
    .map(([k, v]) => `${k}=${quoteSingle(v)}`)
    .join(", ");
  const hard = Object.entries(entity.hardLinks)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  const soft = Object.entries(entity.softLinks)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  const fuses = Object.entries(entity.fuses)
    .map(([k, v]) => `${k}=${v.remaining}${v.targetId && v.targetId !== k ? `>${v.targetId}` : ""}`)
    .join(", ");
  const struct = Object.entries(entity.struct)
    .map(([k, v]) => `${k}=${quoteSingle(typeof v === "string" ? v : JSON.stringify(v))}`)
    .join(", ");
  const voice = entity.extra?.voice ? `\n  voice: ${entity.extra.voice};` : "";
  const aliases = entity.extra?.aliases ? `\n  aliases: ${entity.extra.aliases};` : "";
  const template = entity.templateId ? `\n  templateId: ${entity.templateId};` : "";
  return `${entity.id}.{
  name: ${quoteName(entity.name)};
  description: ${entity.description ? quoteSingle(entity.description) : ""};${template}${emitDrawer("tags", tags, true)}${emitDrawer("stats", stats, true)}${emitDrawer("flags", flags)}${emitDrawer("enums", enums)}${emitDrawer("phrases", phrases)}${emitDrawer("hardLinks", hard)}${emitDrawer("softLinks", soft, true)}${emitDrawer("lists", formatListDrawer(entity.lists))}${emitDrawer("fuses", fuses)}${emitDrawer("struct", struct)}${voice}${aliases}
}`;
}

export function blankEntityBlock(id: string): string {
  if (id.toLowerCase() === "start" || id.toLowerCase() === "@start") return "start()";
  const canonical = isCanonicalEntityId(id) ? id : canonicalEntityId(id);
  const code = shortCodeFromSlug(canonical);
  return `${canonical}.{
  id: ${code};
  name: ;
  description: ;
  tags: ;
  stats: ;
  flags: ;
  enums: ;
  phrases: ;
  hardLinks: ;
  softLinks: ;
  lists: ;
  fuses: ;
  struct: ;
}`;
}
