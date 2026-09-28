import { intentLeaf, pathOfLeaf } from "./verbs.ts";
import { lineWarning } from "../../vocab/index.ts";
import { VOCAB_ENTITY_ID, VOCAB_LOCALE } from "../../vocab/index.ts";
import type { GrammarLine } from "../../vocab/types.ts";
import { formatFuseValue, formatStatInput, isLinkTarget, shortCodeFromSlug } from "../../narrative-engine/index.ts";
import { compileNotebookCached, resetNotebookCache } from "./cache.ts";
import {
  applyNamedDoToDraft,
  cadernoBookRanges,
  doLines,
  isAnotacoesMarker,
  parseAnotacoesSlice,
  rebindAnnotation,
  stripAnotacoesSlice,
  targetIdOfDo,
  type MutableDraft,
} from "./annotations.ts";

export { resetNotebookCache, hashString } from "./cache.ts";

export type NotebookIssue = {
  severity: "error" | "warning";
  message: string;
  line?: number;
  code?: string;
};

export type NotebookCompile = {
  entitiesSource: string;
  rulesSource: string;
  taxonomySource: string;
  extras: Record<string, Record<string, string>>;
  patterns: string;
  issues: NotebookIssue[];
  dirty: string[];
};

export const EMPTY_NOTEBOOK: NotebookCompile = {
  entitiesSource: "",
  rulesSource: "",
  taxonomySource: "",
  extras: {},
  patterns: "",
  issues: [],
  dirty: [],
};

export const RULE_SLOW_THRESHOLD = 500;

type Draft = MutableDraft & {
  name: string;
  extra: Record<string, string>;
};

type RuleDraft = {
  id: string;
  on: string;
  ifs: string[];
  dos: string[];
  narrative: string;
  sempre?: boolean;
};

type PatternDraft = {
  id: string;
  name: string;
  events: string[];
  weight?: string;
};

type SectionKind = "place" | "object" | "agent" | "channel" | "story" | null;

const DIRS: Record<string, string> = {
  norte: "n",
  sul: "s",
  este: "e",
  leste: "e",
  oeste: "w",
  nordeste: "ne",
  noroeste: "nw",
  sudeste: "se",
  sudoeste: "sw",
  cima: "u",
  acima: "u",
  baixo: "d",
  abaixo: "d",
  dentro: "in",
  fora: "out",
};

const OPPOSITE: Record<string, string> = {
  n: "s",
  s: "n",
  e: "w",
  w: "e",
  ne: "sw",
  sw: "ne",
  nw: "se",
  se: "nw",
  u: "d",
  d: "u",
  in: "out",
  out: "in",
};

const TAG_WORDS: Record<string, string[]> = {
  arma: ["object", "weapon"],
  weapon: ["object", "weapon"],
  objeto: ["object"],
  objecto: ["object"],
  amaldicoada: ["cursed"],
  amaldicoado: ["cursed"],
  cursed: ["cursed"],
  hostil: ["agent", "vivo", "hostile"],
  hostile: ["agent", "vivo", "hostile"],
  covarde: ["agent", "vivo", "covarde"],
  consumivel: ["object"],
};

const STAT_ALIAS: Record<string, string> = {
  vida: "hp",
  hp: "hp",
  mana: "mana",
  ouro: "ouro",
  gold: "ouro",
  dano: "dano",
  damage: "dano",
};

const TEM_N_DE = new Set(["vida", "hp", "mana", "ouro", "dano"]);

const EH_UM_TIPO: Record<string, { tag: string; vivo?: boolean }> = {
  agent: { tag: "agent" },
  agente: { tag: "agent", vivo: true },
  npc: { tag: "agent", vivo: true },
  objeto: { tag: "object" },
  object: { tag: "object" },
  objecto: { tag: "object" },
  lugar: { tag: "place" },
  place: { tag: "place" },
  sala: { tag: "place" },
  abstrato: { tag: "abstract" },
  abstract: { tag: "abstract" },
  informacao: { tag: "info" },
  info: { tag: "info" },
  evento: { tag: "event" },
  event: { tag: "event" },
};

const PERSON_WORDS = new Set([
  "goblin",
  "guarda",
  "rei",
  "rainha",
  "filho",
  "filha",
  "mago",
  "npc",
  "jogador",
  "homem",
  "mulher",
  "pessoa",
  "orc",
  "troll",
  "aldeao",
  "padre",
  "soldado",
  "capitao",
]);

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function stripCadernoComment(line: string): string {
  return line.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\*[^*]*$/, "");
}

function stripArticle(text: string): string {
  return text.replace(/^(o|a|os|as|um|uma|uns|umas)\s+/i, "").trim();
}

export function slugOf(name: string): string {
  const core = stripArticle(name.trim());
  const folded = core
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_|_$/g, "");
  return folded.toUpperCase();
}

export const PLAYER_ID = "@jogador";

function isPlayerName(raw: string): boolean {
  const t = raw.trim();
  if (t === PLAYER_ID || t === "@jogador" || t === "@JOGADOR") return true;
  const folded = fold(stripArticle(t));
  return folded === "jogador" || folded === "jogadora";
}

export function entityIdOf(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (t === "start") return t;
  if (isPlayerName(t)) return PLAYER_ID;
  const slug = slugOf(t);
  return slug ? `@${slug.toLowerCase()}` : slug;
}

function stripHeadingNumber(title: string): string {
  return title.replace(/^\d+(?:\.\d+)*\s+/, "").trim();
}

const NAME_STOP = new Set(["de", "da", "do", "das", "dos", "e", "ou", "em", "no", "na", "nos", "nas"]);

const AMBIG = "*";

type Heading = { line: number; level: 2 | 3; title: string; number: string | null; active: boolean };

function parseHeadingTitle(raw: string): { number: string | null; title: string } {
  const trimmed = raw.trim();
  const m = trimmed.match(/^(\d+(?:\.\d+)*)\s+(.*)$/);
  if (m) return { number: m[1]!, title: m[2]!.trim() };
  return { number: null, title: trimmed };
}

function stripNameWrap(text: string): string {
  return text.trim().replace(/^['"`«]+/, "").replace(/['"`»]+$/, "").trim();
}

function parseEhUmTipo(trimmed: string): { subject: string; tipo: string } | null {
  const raw = trimmed.replace(/[.:]+$/, "").trim();
  const m = raw.match(/^(.+?)\s+é\s+(uma?)\s+(\S+)$/iu);
  if (!m) return null;
  const tipo = fold(m[3]!);
  if (!EH_UM_TIPO[tipo]) return null;
  const subject = stripNameWrap(m[1]!);
  if (!subject) return null;
  return { subject, tipo };
}

function tagSlug(text: string): string {
  return fold(text)
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_|_$/g, "");
}

function applyKindSpec(draft: Draft, tipo: string): boolean {
  const spec = EH_UM_TIPO[tipo];
  if (!spec) return false;
  draft.tags.add(spec.tag);
  if (spec.vivo) draft.tags.add("vivo");
  return true;
}

function applyEhUmPred(draft: Draft, pred: string): boolean {
  const m = pred.trim().match(/^(uma?|uns|umas)\s+(.+)$/i);
  if (!m) return false;
  const parts = m[2]!.split(/\s+e\s+|,\s*/).map((part) => part.trim()).filter(Boolean);
  for (const part of parts) {
    if (applyKindSpec(draft, fold(part))) continue;
    const mapped = TAG_WORDS[fold(part)];
    if (mapped) {
      for (const tag of mapped) draft.tags.add(tag);
      continue;
    }
    const tag = tagSlug(part);
    if (tag) draft.tags.add(tag);
  }
  return true;
}

function statKeyOf(raw: string): string {
  const f = fold(raw);
  return STAT_ALIAS[f] ?? tagSlug(raw);
}

function parseStatNumber(raw: string): number | null {
  const n = raw.trim().replace(",", ".");
  if (!/^-?\d+(?:\.\d+)?$/.test(n)) return null;
  const value = Number(n);
  return Number.isFinite(value) ? value : null;
}

function ofPhrase(name: string): string | null {
  const f = fold(stripArticle(name));
  const m = f.match(/^(.+?)\s+d(?:a|o|e|as|os)\s+(.+)$/);
  return m ? m[2]!.trim() : null;
}

function headNoun(name: string): string {
  const parts = fold(stripArticle(name))
    .split(/\s+/)
    .filter((w) => w && !NAME_STOP.has(w));
  return parts[0] ?? fold(stripArticle(name));
}

function kindFromSection(title: string): SectionKind {
  const f = fold(stripHeadingNumber(title));
  if (/(^|\b)(sala|salas|lugar|lugares)(\b|$)/.test(f)) return "place";
  if (/(^|\b)(objeto|objecto|objetos|objectos|item|itens)(\b|$)/.test(f)) return "object";
  if (/(^|\b)(pessoa|pessoas|gente|npc|npcs|agente|agentes)(\b|$)/.test(f)) return "agent";
  if (/(^|\b)(canal|canais|channel|channels)(\b|$)/.test(f)) return "channel";
  if (/(^|\b)(historia|historias|padrao|padroes|story|stories)(\b|$)/.test(f)) return "story";
  return null;
}

export function isRegrasFence(line: string): boolean {
  return /^##\s+\/?regras\s*$/i.test(line.trim());
}

export function isMoldesFence(line: string): boolean {
  return /^##\s+\/?moldes\s*$/i.test(line.trim());
}

function isSkipLine(folded: string): boolean {
  if (!folded) return true;
  if (folded === "---") return true;
  if (/^(caderno|autora|autor|data|dedicatoria)\b/.test(folded)) return true;
  if (/^(activa|ativa)\s*:/.test(folded)) return true;
  if (/^peso\s*:/.test(folded)) return true;
  if (/^\d+\.\s+\S+$/.test(folded)) return true;
  return false;
}

function isDeferredLine(folded: string): boolean {
  return /^a cada turno\b/.test(folded);
}

function quoteNarr(text: string): string {
  return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function quotedChunks(text: string): string[] {
  const out: string[] = [];
  const re = /["“«']([^"”»']+)["”»']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[1]!.trim());
  return out.filter(Boolean);
}

function patternOfQuoted(quoted: string): { verb: string; tokens: string[] } {
  const parts = quoted.trim().split(/\s+/).filter(Boolean);
  const verbWords: string[] = [];
  const tokens: string[] = [];
  let inTokens = false;
  for (const part of parts) {
    if (/^\[.+\]$/.test(part) || inTokens) {
      inTokens = true;
      tokens.push(part);
    } else verbWords.push(part);
  }
  return { verb: verbWords.join(" ") || quoted.trim(), tokens };
}

function blankDraft(id: string, name: string): Draft {
  return {
    id,
    name,
    tags: new Set(),
    links: {},
    extra: {},
    stats: {},
    flags: {},
    enums: {},
    phrases: {},
    hardLinks: {},
    lists: {},
    fuses: {},
    struct: {},
  };
}

function emitEnums(rec: Record<string, string>): string {
  return Object.entries(rec)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .flatMap(([key, value]) => {
      const raw = value.trim();
      const inner = raw.startsWith("[") && raw.endsWith("]") ? raw.slice(1, -1) : "";
      if (!inner) return [];
      const states = inner.split(",").map((item) => item.trim()).filter(Boolean);
      if (states.length < 2) return [];
      return [`${key}=[${states.join(", ")}]`];
    })
    .join(", ");
}

function emitPairs(rec: Record<string, string>): string {
  return Object.entries(rec)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => (value ? `${key}=${value}` : key))
    .join(", ");
}

function emitFlags(rec: Record<string, string>): string {
  return Object.entries(rec)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => {
      const folded = value.trim().toLowerCase();
      const bit = folded === "false" || folded === "nao" || folded === "não" || folded === "no" || folded === "0" ? "false" : "true";
      return `${key}=${bit}`;
    })
    .join(", ");
}

function emitDraft(draft: Draft): string {
  const tags = [...draft.tags].sort().join(", ");
  const links = Object.entries(draft.links)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .filter(([, value]) => !value || isLinkTarget(value))
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
  const stats = Object.entries(draft.stats)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .flatMap(([key, value]) => {
      const shown = typeof value === "number" && Number.isFinite(value) ? String(value) : formatStatInput(String(value));
      return shown ? [`${key}=${shown}`] : [];
    })
    .join(", ");
  const lists = Object.entries(draft.lists)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, items]) => `${key}=[${items.join(", ")}]`)
    .join(", ");
  const fuses = Object.entries(draft.fuses)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .flatMap(([key, value]) => {
      const shown = formatFuseValue(value);
      return shown ? [`${key}=${shown}`] : [];
    })
    .join(", ");
  const lines = [
    `${draft.id}.{`,
    `  id: ${shortCodeFromSlug(draft.id)};`,
    `  name: ${draft.name};`,
    `  description: ${draft.extra.description ?? ""};`,
    `  tags: ${tags};`,
    `  stats: ${stats};`,
    `  flags: ${emitFlags(draft.flags)};`,
    `  enums: ${emitEnums(draft.enums)};`,
    `  phrases: ${emitPairs(draft.phrases)};`,
    `  hardLinks: ${emitPairs(draft.hardLinks)};`,
    `  softLinks: ${links};`,
    `  lists: ${lists};`,
    `  fuses: ${fuses};`,
    `  struct: ${emitPairs(draft.struct)};`,
  ];
  if (draft.extra.aliases) lines.push(`  aliases: ${draft.extra.aliases};`);
  lines.push("}");
  return lines.join("\n");
}

function emitPattern(pattern: PatternDraft): string {
  const lines = [`PADRAO ${pattern.id}`];
  if (pattern.events.length) lines.push(`  eventos: ${pattern.events.join(", ")}`);
  if (pattern.name) lines.push(`  nome: ${pattern.name}`);
  if (pattern.weight) lines.push(`  extra: weight=${pattern.weight}`);
  return lines.join("\n");
}

function emitRule(rule: RuleDraft): string {
  const mark = rule.sempre ? " /* sempre */" : "";
  const lines = [`# ${rule.id}${mark}`, `on: ${rule.on}`];
  for (const cond of rule.ifs) lines.push(`if: ${cond}`);
  if (rule.dos.length) {
    lines.push(`do: ${rule.dos[0]}`);
    for (const change of rule.dos.slice(1)) lines.push(`    ${change}`);
  }
  if (rule.narrative) lines.push(`narrativa: ${quoteNarr(rule.narrative)}`);
  return lines.join("\n");
}

function parseHpSe(folded: string): string | null {
  const m = folded.match(/menos de\s+(\d+)\s+de vida/);
  return m ? `${PLAYER_ID}.hp<${m[1]}` : null;
}

function parsePossessPhrase(rest: string): { negated: boolean; subject: string; item: string } | null {
  const raw = rest.replace(/[.:]+$/, "").trim();
  const m = raw.match(/^(.+?)\s+(não\s+tem|nao\s+tem|não_tem|nao_tem|tem)\s+(.+)$/iu);
  if (!m) return null;
  const op = fold(m[2]!).replace(/\s+/g, "_");
  return { negated: op !== "tem", subject: m[1]!.trim(), item: m[3]!.trim() };
}

export function compileNotebookFresh(text: string): NotebookCompile {
  if (text === "") {
    return {
      entitiesSource: "",
      rulesSource: "",
      taxonomySource: "",
      extras: {},
      patterns: "",
      issues: [],
      dirty: [],
    };
  }

  const drafts = new Map<string, Draft>();
  const order: string[] = [];
  const aliases = new Map<string, string>();
  const issues: NotebookIssue[] = [];
  const rules: RuleDraft[] = [];
  let currentId: string | null = null;
  let inRegrasFence = false;
  let inMoldesFence = false;
  let pendingSempre = false;
  let armedForLaw = false;
  let sectionKind: SectionKind = null;
  const frames: { rule: RuleDraft; indent: number }[] = [];
  let ruleSerial = 0;
  const patternDrafts: PatternDraft[] = [];
  let currentPattern: PatternDraft | null = null;
  let currentChannelId: string | null = null;
  let collectingStates = false;
  let collectingTransitions = false;
  let collectingStats = false;
  let collectingContents = false;
  let collectingGroupTag: string | null = null;
  let collectingTemplateKey: string | null = null;
  let patternSerial = 0;
  const templates = new Map<string, { stats: Record<string, number>; tags: Set<string> }>();
  const templateUses: { id: string; key: string }[] = [];
  const taxonomyLines: string[] = [];
  const grammarLines: GrammarLine[] = [];

  const stopLists = () => {
    collectingStats = false;
    collectingContents = false;
    collectingGroupTag = null;
    collectingTemplateKey = null;
  };

  const applyTemplate = (draft: Draft, tpl: { stats: Record<string, number>; tags: Set<string> }) => {
    for (const [key, value] of Object.entries(tpl.stats)) {
      if (draft.stats[key] == null) draft.stats[key] = value;
    }
    for (const tag of tpl.tags) {
      if (!draft.tags.has(tag)) draft.tags.add(tag);
    }
  };

  const addTaxonomy = (child: string, parent: string) => {
    if (!child || !parent || child === parent) return;
    const line = `${child} → ${parent}`;
    if (!taxonomyLines.includes(line)) taxonomyLines.push(line);
  };

  const remember = (id: string, name: string, line?: number) => {
    const keys = [fold(name), fold(stripArticle(name)), fold(id.replace(/_/g, " "))];
    const head = headNoun(name);
    if (head) keys.push(head);
    for (const key of keys) {
      if (!key) continue;
      const prev = aliases.get(key);
      if (!prev) aliases.set(key, id);
      else if (prev !== id && prev !== AMBIG) {
        aliases.set(key, AMBIG);
        if (line != null) {
          issues.push({
            severity: "error",
            code: "E020",
            message: `«${stripArticle(name)}» é ambíguo.`,
            line,
          });
        }
      }
    }
  };

  const lookupName = (raw: string): string | typeof AMBIG | null => {
    const folded = fold(raw);
    const hit = aliases.get(folded) ?? aliases.get(fold(stripArticle(raw)));
    return hit ?? null;
  };

  const ensure = (rawName: string, fallbackName?: string, forcedId?: string): Draft => {
    const name = fallbackName ?? stripHeadingNumber(rawName).trim();
    const id =
      forcedId ??
      (isPlayerName(rawName) ? PLAYER_ID : entityIdOf(name));
    let draft = drafts.get(id);
    if (!draft) {
      draft = blankDraft(id, id === PLAYER_ID ? "Jogador" : name);
      if (id === PLAYER_ID) draft.tags.add("agent");
      drafts.set(id, draft);
      order.push(id);
    }
    remember(id, name);
    remember(id, rawName);
    return draft;
  };

  const resolve = (raw: string, line?: number): string | null => {
    const trimmed = raw.trim();
    const folded = fold(trimmed);
    if (folded === "ela" || folded === "ele" || folded === "isso" || folded === "isto") return currentId;
    if (folded === "o jogador" || folded === "jogador" || folded === "a jogadora") return PLAYER_ID;
    const hit = lookupName(trimmed);
    if (hit === AMBIG) {
      if (line != null) {
        issues.push({
          severity: "error",
          code: "E020",
          message: `«${stripArticle(trimmed)}» é ambíguo.`,
          line,
        });
      }
      return null;
    }
    if (hit) return hit;
    const id = entityIdOf(trimmed);
    return id || null;
  };

  const prose = stripAnotacoesSlice(text);
  const annotations = parseAnotacoesSlice(text);
  const lines = prose.replace(/^\uFEFF/, "").split(/\n/);
  const ruleAtLine = new Map<number, RuleDraft>();
  const headings: Heading[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = stripCadernoComment(lines[i] ?? "").trim();
    if (/^###\s+/.test(trimmed)) {
      const parsed = parseHeadingTitle(trimmed.replace(/^###\s+/, ""));
      headings.push({ line: i + 1, level: 3, title: parsed.title, number: parsed.number, active: true });
    } else if (/^##\s+/.test(trimmed) && !isRegrasFence(trimmed)) {
      const parsed = parseHeadingTitle(trimmed.replace(/^##\s+/, ""));
      headings.push({ line: i + 1, level: 2, title: parsed.title, number: parsed.number, active: true });
    }
  }
  for (const h of headings) {
    for (let i = h.line; i < lines.length; i++) {
      const trimmed = stripCadernoComment(lines[i] ?? "").trim();
      if (!trimmed) continue;
      const meta = fold(trimmed).match(/^(activa|ativa)\s*:\s*(.+)$/);
      if (meta) {
        const value = fold(meta[2] ?? "");
        h.active = !/^(nao|no|off|0|false)$/.test(value);
      }
      break;
    }
  }

  const liveAt = (lineNo: number): boolean => {
    let sectionOn = true;
    let itemOn = true;
    for (const h of headings) {
      if (h.line > lineNo) break;
      if (h.level === 2) {
        sectionOn = h.active;
        itemOn = true;
      } else itemOn = h.active;
    }
    return sectionOn && itemOn;
  };

  const headingSectionKind = (h: Heading): SectionKind => {
    let kind: SectionKind = null;
    for (const item of headings) {
      if (item.line > h.line) break;
      if (item.level === 2) kind = kindFromSection(item.title);
    }
    return kind;
  };

  const idByLine = new Map<number, string>();
  for (const h of headings) {
    if (h.level !== 3 || !liveAt(h.line)) continue;
    if (headingSectionKind(h) === "story") continue;
    let id = entityIdOf(h.title);
    const of = ofPhrase(h.title);
    if (of) {
      const found = lookupName(of);
      if (found === AMBIG) {
        issues.push({
          severity: "error",
          code: "E020",
          message: `«${of}» é ambíguo.`,
          line: h.line,
        });
      } else if (found) id = found;
    }
    idByLine.set(h.line, id);
    remember(id, h.title, h.line);
    if (h.number) aliases.set(fold(h.number), aliases.get(fold(h.number)) ?? id);
  }
  for (const h of headings) {
    if (h.level !== 3 || !liveAt(h.line) || headingSectionKind(h) === "story") continue;
    const of = ofPhrase(h.title);
    if (!of) continue;
    const found = lookupName(of);
    const mine = idByLine.get(h.line);
    if (!found || found === AMBIG || !mine || found === mine) continue;
    idByLine.set(h.line, found);
    for (const [key, value] of aliases) {
      if (value === mine) aliases.set(key, found);
    }
    remember(found, h.title, h.line);
  }

  const headingExists = (query: string): boolean => {
    const stripped = fold(query)
      .replace(/^(secao|secção|seção)\s+/i, "")
      .trim();
    const split = stripped.split(/\s*[—–-]\s*/);
    const num = split[0]?.match(/^(\d+(?:\.\d+)*)$/);
    if (num && headings.some((h) => h.number === num[1])) return true;
    const title = (split.length > 1 ? split.slice(1).join(" - ") : stripped).trim();
    if (!title) return false;
    if (headings.some((h) => fold(h.title) === title || fold(stripArticle(h.title)) === title)) return true;
    const hit = lookupName(title);
    return Boolean(hit && hit !== AMBIG);
  };

  const markKind = (draft: Draft, kind: "place" | "object" | "agent") => {
    if (kind === "place") draft.tags.add("place");
    if (kind === "object") draft.tags.add("object");
    if (kind === "agent") {
      draft.tags.add("agent");
      draft.tags.add("vivo");
    }
  };

  const looksPerson = (name: string): boolean => {
    const head = fold(stripArticle(name)).split(/\s+/)[0] ?? "";
    return PERSON_WORDS.has(head);
  };

  const closeAt = (indent: number) => {
    while (frames.length && frames[frames.length - 1]!.indent >= indent) {
      const rule = frames.pop()!.rule;
      if (rule.dos.length || rule.narrative || rule.ifs.length) rules.push(rule);
    }
  };

  const closeRule = () => closeAt(0);

  const top = (): RuleDraft | null => frames[frames.length - 1]?.rule ?? null;

  const noteRule = (lineNo: number, rule?: RuleDraft | null) => {
    const target = rule ?? top();
    if (target) ruleAtLine.set(lineNo, target);
  };

  const frameFor = (indent: number): RuleDraft | null => {
    for (let i = frames.length - 1; i >= 0; i--) {
      if (frames[i]!.indent < indent) return frames[i]!.rule;
    }
    return null;
  };

  const pushFrame = (rule: RuleDraft, indent: number, lineNo?: number) => {
    if (armedForLaw) rule.sempre = true;
    armedForLaw = false;
    frames.push({ rule, indent });
    if (lineNo != null) noteRule(lineNo, rule);
  };

  const addDo = (rule: RuleDraft, line: string) => {
    if (!rule.dos.includes(line)) rule.dos.push(line);
  };

  const chainVerb = (subjectId: string, timed: boolean): string => {
    const draft = drafts.get(subjectId);
    if (draft?.tags.has("vivo")) return "LIVE";
    if (draft?.tags.has("channel")) return `THEN ${subjectId}`;
    if (timed) {
      ruleSerial += 1;
      return `WAIT 1.FUSE_${subjectId}_${ruleSerial}`;
    }
    return `THEN ${subjectId}`;
  };

  const warn = (line: number) => {
    issues.push({ severity: "warning", message: "Não percebi esta linha.", line });
  };

  const flushPattern = () => {
    if (currentPattern && currentPattern.events.length) patternDrafts.push(currentPattern);
    currentPattern = null;
  };

  const beginPattern = (name: string, forcedId?: string) => {
    flushPattern();
    const title = name.trim();
    patternSerial += 1;
    const id = forcedId || (title ? slugOf(title) : `PADRAO_${patternSerial}`);
    currentPattern = { id, name: title || id, events: [] };
  };

  const markChannel = (id: string) => {
    const draft = drafts.get(id);
    if (!draft) return;
    draft.tags.add("channel");
    if (draft.stats.state == null) draft.stats.state = 0;
  };

  const eventIdOf = (raw: string, lineNo?: number): string => {
    const hit = resolve(raw, lineNo);
    return hit ?? slugOf(raw);
  };

  const parseCanal = (trimmed: string): boolean => {
    const m = trimmed.match(/^(?:o|a)\s+canal\s+["“«]?([^"”»:]+?)["”»]?\s+tem\s+(.+?)\s+estados?:?\s*$/iu);
    if (!m) return false;
    closeRule();
    flushPattern();
    const name = m[1]!.trim();
    const draft = ensure(name);
    markChannel(draft.id);
    currentId = draft.id;
    currentChannelId = draft.id;
    collectingStates = true;
    collectingTransitions = false;
    return true;
  };

  const parseTransition = (trimmed: string, lineNo: number): boolean => {
    const m = trimmed.match(/^(.+?)\s*(?:→|->)\s+(.+?)(?:\s*\((.+)\))?\s*$/u);
    if (!m || !currentChannelId) return false;
    const channel = drafts.get(currentChannelId);
    if (!channel) return false;
    const states = (channel.extra.states ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const fromName = fold(stripArticle(m[1]!.trim()));
    const toName = fold(stripArticle(m[2]!.trim()));
    const from = states.findIndex((s) => fold(s) === fromName);
    const to = states.findIndex((s) => fold(s) === toName);
    if (from < 0 || to < 0) {
      warn(lineNo);
      return true;
    }
    const delta = to - from;
    ruleSerial += 1;
    const dos = [`${channel.id}.state ${delta >= 0 ? "+" : "-"} ${Math.abs(delta)}`];
    const destTag = slugOf(states[to] ?? "").toLowerCase();
    if (destTag) dos.push(`${channel.id}.${destTag}`);
    rules.push({
      id: `r_canal_${channel.id.toLowerCase()}_${ruleSerial}`,
      on: channel.id,
      ifs: [`${channel.id}.state=${from}`, `${channel.id}.intent=advance`],
      dos,
      narrative: (m[3] ?? "").trim(),
    });
    return true;
  };

  const parseBullet = (trimmed: string, lineNo: number): boolean => {
    const m = trimmed.match(/^[-*]\s+(.+)$/);
    if (!m) return false;
    const item = m[1]!.trim();
    if (collectingTemplateKey) {
      const tpl = templates.get(collectingTemplateKey);
      if (!tpl) return true;
      const traits = item.match(/^traits?\s*:\s*\[?(.+?)\]?\s*$/iu);
      if (traits) {
        for (const piece of traits[1]!.split(/[,/]/)) {
          const tag = tagSlug(piece.replace(/[\[\]]/g, ""));
          if (tag) tpl.tags.add(tag);
        }
        return true;
      }
      const pair = item.match(/^(.+?):\s*([+-]?\d+(?:[.,]\d+)?)\s*$/);
      if (pair) {
        const value = parseStatNumber(pair[2]!);
        if (value != null) {
          tpl.stats[statKeyOf(pair[1]!)] = value;
          return true;
        }
      }
      warn(lineNo);
      return true;
    }
    if (collectingStats && currentId) {
      const owned = drafts.get(currentId);
      const pair = item.match(/^(.+?):\s*([+-]?\d+(?:[.,]\d+)?)\s*$/);
      if (owned && pair) {
        const value = parseStatNumber(pair[2]!);
        if (value != null) {
          owned.stats[statKeyOf(pair[1]!)] = value;
          return true;
        }
      }
      warn(lineNo);
      return true;
    }
    if (collectingContents && currentId) {
      const box = drafts.get(currentId);
      if (box) putIn(box, item, lineNo);
      return true;
    }
    if (collectingGroupTag) {
      const keep = currentId;
      const member = ownedOf(item, lineNo);
      if (member) member.tags.add(collectingGroupTag);
      currentId = keep;
      return true;
    }
    if (currentPattern) {
      currentPattern.events.push(eventIdOf(item, lineNo));
      return true;
    }
    if (currentChannelId && collectingStates) {
      const channel = drafts.get(currentChannelId);
      if (!channel) return true;
      const label = fold(stripArticle(item));
      const prev = channel.extra.states ? channel.extra.states.split(", ").filter(Boolean) : [];
      if (!prev.includes(label)) prev.push(label);
      channel.extra.states = prev.join(", ");
      return true;
    }
    return false;
  };

  const applyBody = (trimmed: string, lineNo: number, indent: number): boolean => {
    const target = frameFor(indent);
    if (!target) return false;
    noteRule(lineNo, target);
    const folded = fold(trimmed);
    if (/^padrao\b/.test(folded)) {
      warn(lineNo);
      return true;
    }
    if (/^a cada turno:?$/.test(folded)) {
      const chain = chainVerb(target.on, true);
      addDo(target, chain);
      if (chain.startsWith("WAIT ")) {
        const fuseId = chain.replace(/^WAIT \d+\./, "");
        pushFrame({ id: `r_turno_${fuseId.toLowerCase()}`, on: fuseId, ifs: [], dos: [], narrative: "" }, indent, lineNo);
      }
      return true;
    }
    if (
      /^os npcs? (ao redor|a volta|em volta|a redor)\b/.test(folded) ||
      /\bficam preocupad/.test(folded)
    ) {
      addDo(target, "LIVE");
      return true;
    }
    const hp = parseHpSe(folded);
    if (/^se\b/.test(folded) && hp) {
      target.ifs.push(hp);
      return true;
    }
    const narre = trimmed.match(/^narre\s+["“«](.+?)["”»]\s*\.?$/iu);
    if (narre) {
      target.narrative = narre[1]!;
      return true;
    }
    const cause = trimmed.match(/^cause\s+(\d+)\s+de dano\s+(?:ao|a|à|para)\s+(.+?)\.?$/iu);
    if (cause) {
      const who = resolve(cause[2]!, lineNo);
      if (!who) return true;
      ensure(cause[2]!, cause[2], who);
      target.dos.push(`${who}.hp - ${cause[1]}`);
      return true;
    }
    const marque = trimmed.match(/^marque\s+(.+?)\s+como\s+["“]?([^"”]+)["”]?\s*\.?$/iu);
    if (marque) {
      const who = resolve(marque[1]!, lineNo);
      if (!who) return true;
      const tag = slugOf(marque[2]!).toLowerCase();
      ensure(marque[1]!, marque[1], who);
      target.dos.push(`${who}.${tag}`);
      return true;
    }
    warn(lineNo);
    return true;
  };

  const ownedOf = (raw: string, lineNo: number): Draft | null => {
    const subject = stripNameWrap(raw);
    const id = resolve(subject, lineNo);
    if (!id) {
      if (!issues.some((issue) => issue.line === lineNo && issue.code === "E020")) warn(lineNo);
      return null;
    }
    const owned = drafts.get(id) ?? ensure(subject, subject, id);
    currentId = owned.id;
    return owned;
  };

  const parseTem = (trimmed: string, lineNo: number): boolean => {
    const deQty = trimmed.match(/^(.+?)\s+tem\s+([+-]?\d+(?:[.,]\d+)?)\s+de\s+(\p{L}+)\.?\s*$/iu);
    if (deQty) {
      const key = fold(deQty[3]!);
      if (!TEM_N_DE.has(key)) return false;
      const value = parseStatNumber(deQty[2]!);
      const owned = ownedOf(deQty[1]!, lineNo);
      if (!owned || value == null) return true;
      owned.stats[statKeyOf(deQty[3]!)] = value;
      stopLists();
      return true;
    }
    const pair = trimmed.match(/^(.+?)\s+tem\s+([^:]+):\s*([+-]?\d+(?:[.,]\d+)?)\.?\s*$/iu);
    if (pair) {
      const value = parseStatNumber(pair[3]!);
      const owned = ownedOf(pair[1]!, lineNo);
      if (!owned || value == null) return true;
      owned.stats[statKeyOf(pair[2]!)] = value;
      stopLists();
      return true;
    }
    const header = trimmed.match(/^(.+?)\s+tem\s*:?\s*$/iu);
    if (!header) return false;
    const owned = ownedOf(header[1]!, lineNo);
    if (!owned) return true;
    stopLists();
    collectingStats = true;
    collectingStates = false;
    collectingTransitions = false;
    return true;
  };

  const putIn = (box: Draft, itemRaw: string, lineNo: number) => {
    const keep = currentId;
    const item = ownedOf(itemRaw, lineNo);
    if (item) item.links.in = box.id;
    currentId = keep ?? box.id;
  };

  const parseContem = (trimmed: string, lineNo: number): boolean => {
    const header = trimmed.match(/^(.+?)\s+(cont[eé]m|carrega)\s*:?\s*$/iu);
    if (header) {
      const box = ownedOf(header[1]!, lineNo);
      if (!box) return true;
      stopLists();
      collectingContents = true;
      collectingStates = false;
      collectingTransitions = false;
      currentId = box.id;
      return true;
    }
    const inline = trimmed.match(/^(.+?)\s+(cont[eé]m|carrega)\s+(.+?)\.?\s*$/iu);
    if (!inline) return false;
    const box = ownedOf(inline[1]!, lineNo);
    if (!box) return true;
    putIn(box, inline[3]!, lineNo);
    stopLists();
    currentId = box.id;
    return true;
  };

  const parseTrait = (trimmed: string, lineNo: number): boolean => {
    const m = trimmed.match(/^(.+?)\s+tem o trait\s+["“«']?([^"”»']+)["”»']?\s*\.?$/iu);
    if (!m) return false;
    const owned = ownedOf(m[1]!, lineNo);
    if (!owned) return true;
    const tag = tagSlug(m[2]!);
    if (tag) owned.tags.add(tag);
    stopLists();
    return true;
  };

  const parseGrupo = (trimmed: string, lineNo: number): boolean => {
    const header = trimmed.match(/^o grupo\s+["“«']([^"”»']+)["”»']\s+inclui\s*:?\s*$/iu);
    if (header) {
      const tag = tagSlug(header[1]!);
      if (!tag) return true;
      stopLists();
      collectingGroupTag = tag;
      collectingStates = false;
      collectingTransitions = false;
      return true;
    }
    const inline = trimmed.match(/^o grupo\s+["“«']([^"”»']+)["”»']\s+inclui\s+(.+?)\.?\s*$/iu);
    if (!inline) return false;
    const tag = tagSlug(inline[1]!);
    const keep = currentId;
    const member = ownedOf(inline[2]!, lineNo);
    if (tag && member) member.tags.add(tag);
    currentId = keep;
    stopLists();
    return true;
  };

  const parseHerda = (trimmed: string, lineNo: number): boolean => {
    const m = trimmed.match(/^(.+?)\s+herda de\s+(.+?)\.?\s*$/iu);
    if (!m) return false;
    const child = ownedOf(m[1]!, lineNo);
    if (!child) return true;
    const parentTag = tagSlug(stripArticle(m[2]!));
    const childTag = tagSlug(stripArticle(m[1]!));
    if (childTag) child.tags.add(childTag);
    addTaxonomy(childTag, parentTag);
    stopLists();
    return true;
  };

  const parseTipoDe = (trimmed: string, lineNo: number): boolean => {
    const m = trimmed.match(/^(.+?)\s+é uma? tipo de\s+(.+?)\.?\s*$/iu);
    if (!m) return false;
    const child = ownedOf(m[1]!, lineNo);
    if (!child) return true;
    const parentTag = tagSlug(stripArticle(m[2]!));
    const childTag = tagSlug(stripArticle(m[1]!));
    if (childTag) child.tags.add(childTag);
    addTaxonomy(childTag, parentTag);
    stopLists();
    return true;
  };

  const addAlias = (draft: Draft, raw: string) => {
    const name = raw.trim();
    if (!name) return;
    remember(draft.id, name);
    const prev = (draft.extra.aliases ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (!prev.some((part) => fold(part) === fold(name))) prev.push(name);
    draft.extra.aliases = prev.join(", ");
  };

  const parseEntenda = (trimmed: string, lineNo: number): boolean => {
    if (!fold(trimmed).startsWith("entenda ")) return false;
    stopLists();
    const comando = trimmed.match(/^entenda o comando\s+["“«']([^"”»']+)["”»']\s+como novo\.?$/iu);
    if (comando) {
      const quoted = comando[1]!.trim();
      const pattern = patternOfQuoted(quoted);
      const line: GrammarLine = {
        verb: pattern.verb,
        tokens: pattern.tokens,
        path: `novo.${slugOf(pattern.verb) || "comando"}`,
        locale: VOCAB_LOCALE,
      };
      const warning = lineWarning(line);
      if (warning) {
        issues.push({ severity: "warning", code: warning.code, message: warning.message, line: lineNo });
        return true;
      }
      grammarLines.push(line);
      return true;
    }
    const m = trimmed.match(/^entenda\s+(.+?)\s+como\s+(.+?)\.?\s*$/iu);
    if (!m) {
      warn(lineNo);
      return true;
    }
    const quotes = quotedChunks(m[1]!);
    if (!quotes.length) {
      warn(lineNo);
      return true;
    }
    const targetRaw = m[2]!.trim();
    const targetFold = fold(stripArticle(targetRaw));
    const asVerb = pathOfLeaf(targetFold);
    const hasArticle = /^(o|a|os|as)\s+/iu.test(targetRaw);
    if (asVerb && !hasArticle) {
      for (const quote of quotes) {
        const pattern = patternOfQuoted(quote);
        const line: GrammarLine = {
          verb: pattern.verb,
          tokens: pattern.tokens,
          path: asVerb,
          locale: VOCAB_LOCALE,
        };
        const warning = lineWarning(line);
        if (warning) {
          issues.push({ severity: "warning", code: warning.code, message: warning.message, line: lineNo });
          continue;
        }
        grammarLines.push(line);
      }
      return true;
    }
    const who = ownedOf(targetRaw, lineNo);
    if (!who) return true;
    for (const quote of quotes) addAlias(who, quote);
    currentId = who.id;
    return true;
  };

  const parseTemplate = (trimmed: string, lineNo: number): boolean => {
    const m = trimmed.match(/^template\s+["“«']([^"”»']+)["”»']\s*:?\s*$/iu);
    if (!m) return false;
    const key = tagSlug(m[1]!);
    if (!key) return true;
    stopLists();
    collectingTemplateKey = key;
    if (!templates.has(key)) templates.set(key, { stats: {}, tags: new Set() });
    collectingStates = false;
    collectingTransitions = false;
    return true;
  };

  const parsePosseSocial = (trimmed: string, lineNo: number): boolean => {
    const raw = trimmed.replace(/[.:]+$/, "").trim();
    const pertence = raw.match(/^(.+?)\s+pertence\s+(?:aos?|às?|à|a)\s+(.+)$/iu);
    if (pertence) {
      const item = ownedOf(pertence[1]!, lineNo);
      const who = ownedOf(pertence[2]!, lineNo);
      if (!item || !who) return true;
      item.links.owner = who.id;
      currentId = item.id;
      return true;
    }
    const dono = raw.match(/^(.+?)\s+é\s+don[oa]\s+(?:d(?:a|o|e|as|os))\s+(.+)$/iu);
    if (dono) {
      const who = ownedOf(dono[1]!, lineNo);
      const thing = ownedOf(dono[2]!, lineNo);
      if (!who || !thing) return true;
      thing.links.owner = who.id;
      currentId = who.id;
      return true;
    }
    const casado = raw.match(/^(.+?)\s+é\s+casad[oa]\s+com\s+(?:(?:o|a|os|as)\s+)?(.+)$/iu);
    if (casado) {
      const who = ownedOf(casado[1]!, lineNo);
      const other = ownedOf(casado[2]!, lineNo);
      if (!who || !other) return true;
      who.links.casado = other.id;
      currentId = who.id;
      return true;
    }
    const rel = raw.match(/^(.+?)\s+é\s+(amigo|rival|pai|membro)\s+(?:d(?:a|o|e|as|os))\s+(.+)$/iu);
    if (!rel) return false;
    const who = ownedOf(rel[1]!, lineNo);
    const other = ownedOf(rel[3]!, lineNo);
    if (!who || !other) return true;
    who.links[fold(rel[2]!)] = other.id;
    currentId = who.id;
    return true;
  };

  const startAconteceQuando = (trimmed: string, lineNo: number, indent: number): boolean => {
    const m = trimmed.match(/^(.+?)\s+acontece quando\s*:?\s*(.*)$/iu);
    if (!m) return false;
    collectingStats = false;
    collectingContents = false;
    collectingGroupTag = null;
    collectingTemplateKey = null;
    const rest = (m[2] ?? "").replace(/:$/, "").trim();
    if (rest) return startQuando(`Quando ${rest}:`, lineNo, indent);
    const owned = ownedOf(m[1]!, lineNo);
    if (!owned) return true;
    closeAt(indent);
    ruleSerial += 1;
    pushFrame(
      {
        id: `r_${owned.id.toLowerCase()}_acontece_${ruleSerial}`,
        on: owned.id,
        ifs: [],
        dos: [],
        narrative: "",
      },
      indent,
      lineNo,
    );
    return true;
  };

  const startQuando = (trimmed: string, lineNo: number, indent: number): boolean => {
    const folded = fold(trimmed.replace(/:$/, ""));
    if (!folded.startsWith("quando ")) return false;
    collectingStats = false;
    collectingContents = false;
    collectingGroupTag = null;
    collectingTemplateKey = null;
    closeAt(indent);
    const parent = indent > 0 ? top() : null;
    const rest = trimmed.replace(/^quando\s+/i, "").replace(/:$/, "").trim();
    const restFold = fold(rest);
    const marked = restFold.match(/^(.+?)\s+e marcad[oa] como\s+["']?(.+?)["']?$/);
    if (marked) {
      const subjectId = resolve(marked[1]!, lineNo);
      if (!subjectId) {
        if (!issues.some((issue) => issue.line === lineNo && issue.code === "E020")) warn(lineNo);
        return true;
      }
      const tag = slugOf(marked[2]!).toLowerCase();
      ensure(marked[1]!, marked[1], subjectId);
      if (parent) addDo(parent, chainVerb(subjectId, false));
      ruleSerial += 1;
      pushFrame(
        {
          id: `r_${subjectId.toLowerCase()}_${tag}_${ruleSerial}`,
          on: subjectId,
          ifs: [`${subjectId}.${tag}`],
          dos: [],
          narrative: "",
        },
        indent,
        lineNo,
      );
      return true;
    }
    const possess = parsePossessPhrase(rest);
    if (possess) {
      const holder = resolve(possess.subject, lineNo);
      const itemId = resolve(possess.item, lineNo);
      if (!holder || !itemId) {
        if (!issues.some((issue) => issue.line === lineNo && issue.code === "E020")) warn(lineNo);
        return true;
      }
      ensure(possess.subject, possess.subject, holder);
      ensure(possess.item, possess.item, itemId);
      const op = possess.negated ? "NAO_TEM" : "TEM";
      ruleSerial += 1;
      pushFrame(
        {
          id: `r_tem_${holder.toLowerCase()}_${itemId.toLowerCase()}_${ruleSerial}`,
          on: `${holder} ${op} ${itemId}`,
          ifs: [],
          dos: [],
          narrative: "",
        },
        indent,
        lineNo,
      );
      return true;
    }
    const acted = rest.match(/^(?:o|a)\s+jogador(?:a)?\s+(\S+)\s+(?:o|a|os|as)?\s*(.+)$/i);
    if (acted) {
      const leaf = intentLeaf(acted[1]!);
      if (!leaf) {
        warn(lineNo);
        return true;
      }
      const objectName = acted[2]!.replace(/^(?:com|para)(?:\s+(?:o|a|os|as))?\s+/i, "").trim();
      const objectId = resolve(objectName, lineNo);
      if (!objectId) {
        if (!issues.some((issue) => issue.line === lineNo && issue.code === "E020")) warn(lineNo);
        return true;
      }
      ensure(objectName, objectName, objectId);
      ensure(PLAYER_ID);
      if (parent) addDo(parent, chainVerb(objectId, false));
      ruleSerial += 1;
      pushFrame(
        {
          id: `r_${leaf}_${objectId.toLowerCase()}_${ruleSerial}`,
          on: objectId,
          ifs: [`${PLAYER_ID}.intent=${leaf}`],
          dos: [],
          narrative: "",
        },
        indent,
        lineNo,
      );
      return true;
    }
    warn(lineNo);
    return true;
  };

  const startSe = (trimmed: string, lineNo: number, indent: number): boolean => {
    const folded = fold(trimmed.replace(/:$/, ""));
    if (!folded.startsWith("se ")) return false;
    collectingStats = false;
    collectingContents = false;
    collectingGroupTag = null;
    collectingTemplateKey = null;
    const hp = parseHpSe(folded);
    if (hp) {
      if (indent > 0 && top()) {
        top()!.ifs.push(hp);
        noteRule(lineNo);
        return true;
      }
      closeAt(indent);
      ensure(PLAYER_ID);
      ruleSerial += 1;
      pushFrame(
        {
          id: `r_hp_${ruleSerial}`,
          on: PLAYER_ID,
          ifs: [hp],
          dos: [],
          narrative: "",
        },
        indent,
        lineNo,
      );
      return true;
    }
    const rest = trimmed.replace(/^se\s+/i, "").replace(/:$/, "").trim();
    const possess = parsePossessPhrase(rest);
    if (!possess) {
      warn(lineNo);
      return true;
    }
    const holder = resolve(possess.subject, lineNo);
    const itemId = resolve(possess.item, lineNo);
    if (!holder || !itemId) {
      if (!issues.some((issue) => issue.line === lineNo && issue.code === "E020")) warn(lineNo);
      return true;
    }
    ensure(possess.subject, possess.subject, holder);
    ensure(possess.item, possess.item, itemId);
    const matcher = `${holder} ${possess.negated ? "NAO_TEM" : "TEM"} ${itemId}`;
    if (indent > 0 && top()) {
      top()!.ifs.push(matcher);
      noteRule(lineNo);
      return true;
    }
    closeAt(indent);
    ruleSerial += 1;
    pushFrame(
      {
        id: `r_tem_${holder.toLowerCase()}_${itemId.toLowerCase()}_${ruleSerial}`,
        on: matcher,
        ifs: [],
        dos: [],
        narrative: "",
      },
      indent,
      lineNo,
    );
    return true;
  };

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const raw = lines[i] ?? "";
    const withoutComment = stripCadernoComment(raw);
    const indent = (withoutComment.match(/^\s*/)?.[0].length ?? 0);
    const trimmed = withoutComment.trim();
    const folded = fold(trimmed);
    if (/^caderno\s*:/.test(folded)) {
      closeRule();
      flushPattern();
      collectingStates = false;
      collectingTransitions = false;
      collectingStats = false;
    collectingContents = false;
    collectingGroupTag = null;
    collectingTemplateKey = null;
      currentChannelId = null;
      currentId = null;
      frames.length = 0;
      continue;
    }
    if (isSkipLine(folded)) continue;
    if (isAnotacoesMarker(trimmed)) continue;
    if (!liveAt(lineNo)) continue;
    if (inMoldesFence && !isMoldesFence(trimmed)) continue;
    if (inRegrasFence && /^sempre$/i.test(trimmed)) {
      pendingSempre = true;
      continue;
    }
    const lawLine = /^(quando|se)\b/i.test(folded) || /\sacontece quando\b/i.test(folded);
    if (pendingSempre && !lawLine) pendingSempre = false;

    const openLaw = (): boolean => {
      if (lawLine) {
        armedForLaw = pendingSempre;
        pendingSempre = false;
      }
      const hit = startAconteceQuando(trimmed, lineNo, indent) || startQuando(trimmed, lineNo, indent) || startSe(trimmed, lineNo, indent);
      armedForLaw = false;
      return hit;
    };

    if (indent > 0 && frames.length) {
      if (openLaw()) continue;
      applyBody(trimmed, lineNo, indent);
      continue;
    }

    if (/^##\s+/.test(trimmed) && !/^###/.test(trimmed)) {
      closeRule();
      flushPattern();
      collectingStates = false;
      collectingTransitions = false;
      collectingStats = false;
    collectingContents = false;
    collectingGroupTag = null;
    collectingTemplateKey = null;
      currentChannelId = null;
      if (isMoldesFence(trimmed)) {
        inMoldesFence = !/\/moldes/i.test(trimmed);
        continue;
      }
      if (isRegrasFence(trimmed)) {
        inRegrasFence = !/\/regras/i.test(trimmed);
      } else {
        sectionKind = kindFromSection(trimmed.replace(/^##\s+/, ""));
        currentId = null;
      }
      continue;
    }

    if (/^###\s+/.test(trimmed)) {
      closeRule();
      collectingStats = false;
    collectingContents = false;
    collectingGroupTag = null;
    collectingTemplateKey = null;
      if (inRegrasFence) continue;
      const title = stripHeadingNumber(trimmed.replace(/^###\s+/, "").trim());
      if (sectionKind === "story") {
        beginPattern(title);
        currentId = null;
        continue;
      }
      const id = idByLine.get(lineNo) ?? entityIdOf(title);
      const draft = ensure(title, title, id);
      currentId = draft.id;
      if (sectionKind === "place" || sectionKind === "object" || sectionKind === "agent") markKind(draft, sectionKind);
      if (sectionKind === "channel") {
        markChannel(draft.id);
        currentChannelId = draft.id;
        collectingStates = true;
        collectingTransitions = false;
      }
      remember(draft.id, title, lineNo);
      continue;
    }

    const veja = folded.match(/^veja tambem:?\s*(.*)$/);
    if (veja) {
      closeRule();
      const target = veja[1]!.replace(/[.:]+$/, "").trim();
      if (!target || !headingExists(target)) {
        issues.push({
          severity: "warning",
          code: "W014",
          message: `Não encontrei «${target || "?"}».`,
          line: lineNo,
        });
      }
      continue;
    }

    const aka = trimmed.match(/^também chamada:?\s+(.+?)\.?$/iu) ?? trimmed.match(/^tambem chamada:?\s+(.+?)\.?$/iu);
    if (aka) {
      closeRule();
      if (!currentId) warn(lineNo);
      else remember(currentId, aka[1]!.trim(), lineNo);
      continue;
    }

    if (/^transicoes:?$/.test(folded) || /^transições:?$/.test(trimmed.toLowerCase())) {
      closeRule();
      collectingStates = false;
      collectingStats = false;
    collectingContents = false;
    collectingGroupTag = null;
    collectingTemplateKey = null;
      collectingTransitions = Boolean(currentChannelId);
      continue;
    }

    const padraoHead = trimmed.match(/^(padr[aã]o)\s*:?\s*(.*)$/iu);
    if (padraoHead && !frames.length) {
      closeRule();
      collectingStates = false;
      collectingTransitions = false;
      collectingStats = false;
    collectingContents = false;
    collectingGroupTag = null;
    collectingTemplateKey = null;
      beginPattern((padraoHead[2] ?? "").trim());
      continue;
    }

    const signif = trimmed.match(/^signific[aâ]ncia\s*:\s*([0-9]+(?:[.,][0-9]+)?)\s*$/iu);
    if (signif && currentPattern) {
      const pattern: PatternDraft = currentPattern;
      pattern.weight = signif[1]!.replace(",", ".");
      continue;
    }

    if (parseCanal(trimmed)) continue;
    if (parseBullet(trimmed, lineNo)) continue;
    collectingStats = false;
    collectingContents = false;
    collectingGroupTag = null;
    collectingTemplateKey = null;
    if (collectingTransitions && parseTransition(trimmed, lineNo)) continue;

    if (openLaw()) continue;

    if (isDeferredLine(folded)) {
      closeRule();
      warn(lineNo);
      continue;
    }

    closeRule();

    const ehTipo = parseEhUmTipo(trimmed);
    if (ehTipo) {
      const subjectId = resolve(ehTipo.subject, lineNo);
      if (!subjectId) {
        if (!issues.some((issue) => issue.line === lineNo && issue.code === "E020")) warn(lineNo);
        continue;
      }
      const owned = drafts.get(subjectId) ?? ensure(ehTipo.subject, ehTipo.subject, subjectId);
      applyKindSpec(owned, ehTipo.tipo);
      currentId = owned.id;
      continue;
    }

    if (parseTrait(trimmed, lineNo)) continue;
    if (parseTem(trimmed, lineNo)) continue;
    if (parseContem(trimmed, lineNo)) continue;
    if (parseGrupo(trimmed, lineNo)) continue;
    if (parseTemplate(trimmed, lineNo)) continue;
    if (parseHerda(trimmed, lineNo)) continue;
    if (parseTipoDe(trimmed, lineNo)) continue;
    if (parseEntenda(trimmed, lineNo)) continue;

    const leva = trimmed.match(
      /^(?:(o|a|os|as)\s+)?(.+?)\s+leva ao\s+(\p{L}+)\s+para\s+(?:(o|a|os|as)\s+)?(.+?)\.?\s*$/iu,
    );
    if (leva) {
      const fromName = leva[2]!;
      const dirWord = fold(leva[3]!);
      const toName = leva[5]!;
      const dir = DIRS[dirWord];
      if (!dir) {
        warn(lineNo);
        continue;
      }
      const fromId = resolve(fromName, lineNo);
      const toId = resolve(toName, lineNo);
      if (!fromId || !toId) continue;
      const from = ensure(fromName, fromName, fromId);
      const to = ensure(toName, toName, toId);
      markKind(from, "place");
      markKind(to, "place");
      from.links[`exit_${dir}`] = to.id;
      const back = OPPOSITE[dir];
      if (back) to.links[`exit_${back}`] = from.id;
      currentId = from.id;
      continue;
    }

    const esta = trimmed.match(
      /^(?:(o|a|os|as)\s+)?(.+?)\s+est[aá]\s+(?:n[ao]|em)\s+(?:(o|a|os|as)\s+)?(.+?)\.?\s*$/iu,
    );
    if (esta) {
      const subjectName = stripNameWrap(esta[2]!);
      const placeName = stripNameWrap(esta[4]!);
      const subjectId = resolve(subjectName, lineNo);
      const placeId = resolve(placeName, lineNo);
      if (!subjectId || !placeId) continue;
      const subject = ensure(subjectName, subjectName, subjectId);
      const place = ensure(placeName, placeName, placeId);
      markKind(place, "place");
      subject.links.in = place.id;
      if (sectionKind === "agent" || looksPerson(subjectName)) markKind(subject, "agent");
      else if (sectionKind === "object") markKind(subject, "object");
      else if (!subject.tags.has("place") && !subject.tags.has("agent")) markKind(subject, "object");
      currentId = subject.id;
      continue;
    }

    if (parsePosseSocial(trimmed, lineNo)) continue;

    const eh = trimmed.match(/^(ela|ele|isso|isto|(?:o|a|os|as)\s+.+?|.+?)\s+é\s+(.+?)\.?\s*$/iu);
    if (eh) {
      const subjectRaw = stripNameWrap(eh[1]!);
      const pred = eh[2]!;
      const subjectId = resolve(subjectRaw, lineNo);
      if (!subjectId) {
        if (!issues.some((issue) => issue.line === lineNo && issue.code === "E020")) warn(lineNo);
        continue;
      }
      const owned = drafts.get(subjectId) ?? ensure(subjectRaw, subjectRaw, subjectId);
      const um = pred.match(/^(uma?|uns|umas)\s+(.+)$/i);
      if (um) {
        const rest = stripNameWrap(um[2]!);
        const key = tagSlug(rest);
        if (key && (templates.has(key) || (!/,|\s+e\s+/i.test(rest) && /\s/.test(rest)))) {
          templateUses.push({ id: owned.id, key });
          currentId = owned.id;
          continue;
        }
      }
      if (applyEhUmPred(owned, pred)) {
        currentId = owned.id;
        continue;
      }
      const parts = pred.split(/\s+e\s+|,\s*/).map((part) => part.trim()).filter(Boolean);
      let tagged = false;
      for (const part of parts) {
        const tags = TAG_WORDS[fold(part)];
        if (!tags) continue;
        tagged = true;
        for (const tag of tags) owned.tags.add(tag);
      }
      if (!tagged) {
        const sentence = trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
        owned.extra.description = owned.extra.description ? `${owned.extra.description} ${sentence}` : sentence;
        if (!owned.tags.has("object") && !owned.tags.has("agent")) owned.tags.add("place");
      }
      currentId = owned.id;
      continue;
    }

    warn(lineNo);
  }
  closeRule();
  flushPattern();

  for (const use of templateUses) {
    const draft = drafts.get(use.id);
    const tpl = templates.get(use.key);
    if (!draft) continue;
    if (tpl) applyTemplate(draft, tpl);
    else if (use.key) draft.tags.add(use.key);
  }

  const books = cadernoBookRanges(prose);
  for (const annotation of annotations) {
    const book = books.find((item) => item.id === annotation.book) ?? (books.length === 1 ? books[0] : undefined);
    const slice = book ? lines.slice(book.start, book.end).join("\n") : prose;
    const hit = rebindAnnotation(slice, annotation);
    if ("error" in hit) {
      if (hit.error === "ambiguous") {
        issues.push({
          severity: "error",
          code: "E020",
          message: `«${annotation.quote}» é ambíguo.`,
          line: book ? book.start + 1 : undefined,
        });
      } else {
        issues.push({ severity: "warning", message: "Não percebi esta linha." });
      }
      continue;
    }
    const globalLine = (book ? book.start : 0) + hit.line;
    const rule = ruleAtLine.get(globalLine);
    const worldOp = doLines(annotation.do).some((line) => /^(CREATE|DESTROY)\b/i.test(line));
    const portraitOnly = doLines(annotation.do).every((line) => /^STRUCT\b/i.test(line));
    if (rule && !portraitOnly && !worldOp) {
      for (const line of doLines(annotation.do)) addDo(rule, line);
      continue;
    }
    const targetId = targetIdOfDo(annotation.do);
    if (!targetId) {
      issues.push({ severity: "warning", message: "Não percebi esta linha." });
      continue;
    }
    if (doLines(annotation.do).some((line) => /^DESTROY\b/i.test(line))) {
      drafts.delete(targetId);
      const at = order.indexOf(targetId);
      if (at >= 0) order.splice(at, 1);
      continue;
    }
    const owned = drafts.get(targetId) ?? ensure(targetId, targetId, targetId);
    if (!applyNamedDoToDraft(owned, annotation.do)) {
      issues.push({ severity: "warning", message: "Não percebi esta linha." });
    }
  }

  const extras: Record<string, Record<string, string>> = {};
  for (const id of order) {
    const draft = drafts.get(id);
    if (!draft) continue;
    const extra: Record<string, string> = {};
    if (draft.extra.states) extra.states = draft.extra.states;
    if (draft.extra.aliases) extra.aliases = draft.extra.aliases;
    if (Object.keys(extra).length) extras[id] = extra;
  }
  if (grammarLines.length) {
    extras[VOCAB_ENTITY_ID] = { grammar: JSON.stringify(grammarLines) };
    if (!drafts.has(VOCAB_ENTITY_ID)) {
      const hidden = blankDraft(VOCAB_ENTITY_ID, "");
      hidden.tags.add("hidden");
      drafts.set(VOCAB_ENTITY_ID, hidden);
      order.push(VOCAB_ENTITY_ID);
    }
  }
  for (const pattern of patternDrafts) {
    if (pattern.weight) extras[pattern.id] = { ...(extras[pattern.id] ?? {}), weight: pattern.weight };
  }

  const hasChannel = order.some((id) => drafts.get(id)?.tags.has("channel"));
  const tax = [...(hasChannel ? ["channel → abstract"] : []), ...taxonomyLines];
  const taxonomySource = tax.length ? `${tax.join("\n")}\n` : "";
  const patterns = patternDrafts.map(emitPattern).join("\n\n");
  const entitiesSource = order
    .map((id) => drafts.get(id))
    .filter((draft): draft is Draft => Boolean(draft))
    .map(emitDraft)
    .join("\n\n");
  const compiledRules = rules.map(emitRule).join("\n\n");
  const rulesSource = [compiledRules, patterns].filter(Boolean).join("\n\n");
  if (rules.length > RULE_SLOW_THRESHOLD) {
    issues.push({
      severity: "warning",
      code: "W021",
      message: "Muitas regras; o play pode ficar lento.",
    });
  }
  return {
    entitiesSource,
    rulesSource,
    taxonomySource,
    extras,
    patterns,
    issues,
    dirty: [],
  };
}

export function compileNotebook(text: string): NotebookCompile {
  if (text === "") return EMPTY_NOTEBOOK;
  return compileNotebookCached(text, compileNotebookFresh);
}
