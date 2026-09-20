import { stripLineComment } from "./lexer.ts";
import { DEFAULT_PROP_KEYWORD_NAMES } from "./narrative.ts";
import { lineColumnFromOffset, offsetOfLine } from "./source-ops.ts";
import type { SourceKind } from "./highlight.ts";
import type { WorldModel } from "./types.ts";
import { BUILTIN_TAGS, CATEGORY_LABEL, isCategoryTag } from "./types.ts";
import { compileTaxonomy, type CompiledTaxonomy } from "./taxonomy.ts";
import { compileEntityFile } from "./world-model.ts";

export type CompletionKind = "id" | "tag" | "stat" | "link" | "keyword" | "prop" | "snippet" | "star" | "bang";
export type CompletionItem = { label: string; insert: string; kind: CompletionKind; detail: string; documentation?: string };
export type CompletionContext = { slot: string; prefix: string; replaceStart: number; replaceEnd: number; line: number; column: number };
export type Vocabulary = { entityIds: string[]; tags: string[]; statKeys: string[]; linkKeys: string[]; propKeywords: string[] };

export const COMPLETION_TRIGGER_CHARS = [".", "=", "!", ":", " ", ">"] as const;
export const BUILTIN_LINKS = ["current_location"] as const;

const RULE_KEYWORDS: CompletionItem[] = [
  { label: "on:", insert: "on: ", kind: "keyword", detail: "gatilho" },
  { label: "if:", insert: "if: ", kind: "keyword", detail: "condição" },
  { label: "do:", insert: "do: ", kind: "keyword", detail: "mudanças" },
  { label: "narrativa:", insert: "narrativa: ", kind: "keyword", detail: "texto" },
];

const POSSESS_KEYWORDS: CompletionItem[] = [
  { label: "TEM", insert: "TEM ", kind: "keyword", detail: "possui (conteúdo)" },
  { label: "NAO_TEM", insert: "NAO_TEM ", kind: "keyword", detail: "não possui" },
];

const LINK_SELECTOR: CompletionItem = { label: "(link", insert: "(link ", kind: "keyword", detail: "andar o link" };

const NAMED_DO_KEYWORDS: CompletionItem[] = [
  { label: "ADD_TAG", insert: "ADD_TAG ", kind: "keyword", detail: "põe tag" },
  { label: "REMOVE_TAG", insert: "REMOVE_TAG ", kind: "keyword", detail: "tira tag" },
  { label: "SET_STAT", insert: "SET_STAT ", kind: "keyword", detail: "põe número" },
  { label: "ADD_STAT", insert: "ADD_STAT ", kind: "keyword", detail: "soma número" },
  { label: "MUL_STAT", insert: "MUL_STAT ", kind: "keyword", detail: "multiplica" },
  { label: "SET_FLAG", insert: "SET_FLAG ", kind: "keyword", detail: "põe flag" },
  { label: "SET_ENUM", insert: "SET_ENUM ", kind: "keyword", detail: "põe enum" },
  { label: "SET_LINK", insert: "SET_LINK ", kind: "keyword", detail: "põe link" },
  { label: "SET_PHRASE", insert: "SET_PHRASE ", kind: "keyword", detail: "põe phrase" },
  { label: "UNLINK", insert: "UNLINK ", kind: "keyword", detail: "parte o link" },
  { label: "SET_FUSE", insert: "SET_FUSE ", kind: "keyword", detail: "arma o fusível" },
  { label: "PUSH", insert: "PUSH ", kind: "keyword", detail: "põe na lista" },
  { label: "POP", insert: "POP ", kind: "keyword", detail: "tira o último" },
  { label: "REMOVE", insert: "REMOVE ", kind: "keyword", detail: "tira da lista" },
  { label: "CLEAR", insert: "CLEAR ", kind: "keyword", detail: "esvazia lista" },
  { label: "ADD_UNIQUE", insert: "ADD_UNIQUE ", kind: "keyword", detail: "põe se faltar" },
  { label: "CREATE", insert: "CREATE ", kind: "keyword", detail: "cria entidade" },
  { label: "DESTROY", insert: "DESTROY ", kind: "keyword", detail: "apaga entidade" },
  { label: "SPAWN", insert: "SPAWN ", kind: "keyword", detail: "instancia molde" },
];

const START_SNIPPET: CompletionItem = { label: "start()", insert: "start()", kind: "snippet", detail: "início da história" };

const ENTITY_SECTION: CompletionItem[] = [
  { label: "name:", insert: "name: ", kind: "prop", detail: "nome visível" },
  { label: "description:", insert: "description: ", kind: "prop", detail: "prosa base" },
  { label: "templateId:", insert: "templateId: ", kind: "prop", detail: "protótipo SPAWN" },
  { label: "tags:", insert: "tags: ", kind: "keyword", detail: "etiquetas" },
  { label: "stats:", insert: "stats: ", kind: "keyword", detail: "números / gauges" },
  { label: "flags:", insert: "flags: ", kind: "keyword", detail: "booleanos" },
  { label: "enums:", insert: "enums: ", kind: "keyword", detail: "FSM discreta" },
  { label: "phrases:", insert: "phrases: ", kind: "keyword", detail: "diálogos e títulos" },
  { label: "hardLinks:", insert: "hardLinks: ", kind: "keyword", detail: "posse / cascade" },
  { label: "softLinks:", insert: "softLinks: ", kind: "keyword", detail: "foco / posição" },
  { label: "lists:", insert: "lists: ", kind: "keyword", detail: "inventários / filas" },
  { label: "fuses:", insert: "fuses: ", kind: "keyword", detail: "temporizadores" },
  { label: "struct:", insert: "struct: ", kind: "keyword", detail: "objetos aninhados" },
];

const NOTEBOOK_KEYWORDS: CompletionItem[] = [
  { label: "Quando", insert: "Quando ", kind: "keyword", detail: "reação" },
  { label: "Se", insert: "Se ", kind: "keyword", detail: "condição" },
  { label: "Narre", insert: "Narre ", kind: "keyword", detail: "texto" },
  { label: "Cause", insert: "Cause ", kind: "keyword", detail: "efeito" },
  { label: "Marque", insert: "Marque ", kind: "keyword", detail: "tag" },
  { label: "start", insert: "start", kind: "snippet", detail: "início da história" },
];

const TAXONOMY_ARROW: CompletionItem = { label: "→", insert: "→ ", kind: "keyword", detail: "herda de" };

export function collectVocabulary(options: {
  worldModel?: WorldModel;
  extras?: Record<string, Record<string, string>>;
  taxonomy?: CompiledTaxonomy | null;
  taxonomySource?: string;
}): Vocabulary {
  const entityIds = new Set<string>();
  const tags = new Set<string>(BUILTIN_TAGS);
  const statKeys = new Set<string>();
  const linkKeys = new Set<string>(BUILTIN_LINKS);
  const propKeywords = new Set<string>([...DEFAULT_PROP_KEYWORD_NAMES]);
  const world = options.worldModel ?? compileEntityFile("").worldModel;
  for (const entity of world.values()) {
    entityIds.add(entity.id);
    for (const tag of entity.tags) tags.add(tag);
    for (const key of Object.keys(entity.stats)) statKeys.add(key);
    for (const key of Object.keys(entity.links)) linkKeys.add(key);
    for (const key of Object.keys(entity.hardLinks)) linkKeys.add(key);
    for (const key of Object.keys(entity.softLinks)) linkKeys.add(key);
    if (entity.name) propKeywords.add("name");
    if (entity.description) propKeywords.add("description");
    for (const key of Object.keys(entity.phrases)) propKeywords.add(key);
    if (entity.extra) for (const key of Object.keys(entity.extra)) propKeywords.add(key);
  }
  if (options.extras) for (const extra of Object.values(options.extras)) for (const key of Object.keys(extra)) propKeywords.add(key);
  const tax = options.taxonomy ?? (options.taxonomySource != null ? compileTaxonomy(options.taxonomySource) : null);
  if (tax) {
    for (const [child, parent] of tax.parents) {
      tags.add(child);
      tags.add(parent);
    }
  }
  return {
    entityIds: [...entityIds].sort(),
    tags: [...tags].sort(),
    statKeys: [...statKeys].sort(),
    linkKeys: [...linkKeys].sort(),
    propKeywords: [...propKeywords].sort(),
  };
}

function lastIdentPrefix(fragment: string): { prefix: string; startInFragment: number } {
  const m = fragment.match(/([\p{L}_][\p{L}\p{N}\p{M}_]*)$/u);
  if (m) return { prefix: m[1]!, startInFragment: fragment.length - m[1]!.length };
  if (fragment.endsWith("$")) return { prefix: "$", startInFragment: fragment.length - 1 };
  return { prefix: "", startInFragment: fragment.length };
}

export function analyzeCompletion(source: string, kind: SourceKind, offset: number): CompletionContext {
  const clamped = Math.max(0, Math.min(offset, source.length));
  const { line, column } = lineColumnFromOffset(source, clamped);
  const lineStart = offsetOfLine(source, line);
  const lines = source.split(/\n/);
  const lineText = lines[line - 1] ?? "";
  const col0 = clamped - lineStart;
  const { code } = stripLineComment(lineText);
  if (col0 > code.length) return { slot: "none", prefix: "", replaceStart: clamped, replaceEnd: clamped, line, column };
  const before = lineText.slice(0, col0);
  const { prefix, startInFragment } = lastIdentPrefix(before);

  if (kind === "taxonomy") {
    const block = before.indexOf("/*");
    if (block >= 0) {
      return { slot: "none", prefix: "", replaceStart: clamped, replaceEnd: clamped, line, column };
    }
    if (/(?:→|->)\s*[\p{L}_][\p{L}\p{N}\p{M}_]*$/u.test(before) || /(?:→|->)\s*$/u.test(before)) {
      return { slot: "taxonomy-parent", prefix, replaceStart: lineStart + startInFragment, replaceEnd: clamped, line, column };
    }
    if (/^\s*[\p{L}_][\p{L}\p{N}\p{M}_]*\s+$/u.test(before)) {
      return { slot: "taxonomy-arrow", prefix: "", replaceStart: clamped, replaceEnd: clamped, line, column };
    }
    return { slot: "taxonomy-child", prefix, replaceStart: lineStart + startInFragment, replaceEnd: clamped, line, column };
  }

  if (kind === "entities") {
    if (/^\s*(tags)\s*:/i.test(before) || /tags\s*:/i.test(before)) {
      return { slot: "entity-tag", prefix, replaceStart: lineStart + startInFragment, replaceEnd: clamped, line, column };
    }
    if (/^\s*(stats|flags|enums|phrases|lists|fuses|struct)\s*:/i.test(before)) {
      return { slot: "entity-stat", prefix, replaceStart: lineStart + startInFragment, replaceEnd: clamped, line, column };
    }
    if (/^\s*(hardLinks|softLinks|links)\s*:/i.test(before) || /=\s*[\p{L}_]*$/u.test(before)) {
      return { slot: "link-value", prefix, replaceStart: lineStart + startInFragment, replaceEnd: clamped, line, column };
    }
    if (/^\s*$/.test(before) || /^{\s*$/.test(before.trim()) || /;\s*$/.test(before)) {
      return { slot: "entity-section", prefix, replaceStart: lineStart + startInFragment, replaceEnd: clamped, line, column };
    }
  }

  if (kind === "rules") {
    const trimmed = before.trim();
    if (/^(ON|IF|DO|NARRATIVA|NARRATIVE)?$/i.test(trimmed)) {
      return { slot: "rule-keyword", prefix, replaceStart: lineStart + startInFragment, replaceEnd: clamped, line, column };
    }
    if (before.endsWith("!") || /!$/.test(before)) {
      return { slot: "bang-tag", prefix: "", replaceStart: clamped, replaceEnd: clamped, line, column };
    }
    if (before.endsWith(".") || /\.[\p{L}_][\p{L}\p{N}\p{M}_]*$/u.test(before)) {
      return { slot: "field", prefix: before.endsWith(".") ? "" : prefix, replaceStart: clamped - (before.endsWith(".") ? 0 : prefix.length), replaceEnd: clamped, line, column };
    }
    if (/^\s*do\s*:/i.test(before)) {
      return { slot: "do-verb", prefix, replaceStart: lineStart + startInFragment, replaceEnd: clamped, line, column };
    }
    return { slot: "selector", prefix, replaceStart: lineStart + startInFragment, replaceEnd: clamped, line, column };
  }

  if (kind === "notebook") {
    const trimmed = before.trim();
    if (!trimmed || /^(quando|se|narre|cause|marque)$/i.test(trimmed)) {
      return { slot: "notebook-keyword", prefix, replaceStart: lineStart + startInFragment, replaceEnd: clamped, line, column };
    }
  }
  return { slot: "none", prefix: "", replaceStart: clamped, replaceEnd: clamped, line, column };
}

function tags(vocab: Vocabulary): CompletionItem[] {
  return vocab.tags.map((tag) => ({
    label: tag,
    insert: tag,
    kind: "tag" as const,
    detail: isCategoryTag(tag) ? "categoria" : "tag",
    documentation: isCategoryTag(tag) ? CATEGORY_LABEL[tag] : undefined,
  }));
}
function ids(vocab: Vocabulary): CompletionItem[] {
  return vocab.entityIds.map((id) => ({ label: id, insert: id, kind: "id" as const, detail: "entidade" }));
}

export function completeAt(source: string, kind: SourceKind, offset: number, vocab: Vocabulary): { ctx: CompletionContext; items: CompletionItem[] } {
  const ctx = analyzeCompletion(source, kind, offset);
  let items: CompletionItem[] = [];
  switch (ctx.slot) {
    case "rule-keyword":
      items = RULE_KEYWORDS;
      break;
    case "do-verb":
      items = NAMED_DO_KEYWORDS;
      break;
    case "notebook-keyword":
      items = NOTEBOOK_KEYWORDS;
      break;
    case "entity-section": {
      const lineText = source.split("\n")[ctx.line - 1] ?? "";
      const top = /^\s*$/.test(lineText) || /^\s*start/i.test(lineText);
      items = top ? [START_SNIPPET, ...ENTITY_SECTION] : ENTITY_SECTION;
      break;
    }
    case "entity-tag":
    case "bang-tag":
      items = tags(vocab);
      break;
    case "entity-stat":
      items = vocab.statKeys.map((k) => ({ label: k, insert: k, kind: "stat" as const, detail: "stat" }));
      break;
    case "link-value":
      items = [...ids(vocab), { label: "$", insert: "$", kind: "bang", detail: "gatilho" }];
      break;
    case "field":
      items = [
        ...tags(vocab),
        ...vocab.statKeys.map((k) => ({ label: k, insert: k, kind: "stat" as const, detail: "stat" })),
        ...vocab.linkKeys.map((k) => ({ label: k, insert: k, kind: "link" as const, detail: "link" })),
      ];
      break;
    case "selector":
      items = [
        ...ids(vocab),
        { label: "*", insert: "*", kind: "star", detail: "qualquer" },
        { label: "$", insert: "$", kind: "bang", detail: "gatilho" },
        ...POSSESS_KEYWORDS,
        LINK_SELECTOR,
      ];
      break;
    case "taxonomy-child": {
      const lineText = source.split("\n")[ctx.line - 1] ?? "";
      const needsArrow = !/→|->/.test(lineText);
      items = tags(vocab).map((item) => ({ ...item, insert: needsArrow ? `${item.insert} → ` : item.insert }));
      break;
    }
    case "taxonomy-arrow":
      items = [TAXONOMY_ARROW];
      break;
    case "taxonomy-parent":
      items = tags(vocab);
      break;
    default:
      items = [];
  }
  const p = ctx.prefix.toLowerCase();
  const filtered = p ? items.filter((i) => i.label.toLowerCase().startsWith(p) || i.label.toLowerCase().includes(p)) : items;
  return { ctx, items: filtered };
}

function foldKey(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function tabAfterKeyword(source: string, kind: SourceKind, offset: number): { source: string; offset: number } | null {
  const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
  const before = source.slice(lineStart, offset);
  const indent = before.match(/^\s*/)?.[0] ?? "";
  const typed = before.slice(indent.length);
  if (!typed) return null;
  const table: [string, string][] =
    kind === "notebook"
      ? [
          ["quando", " "],
          ["entenda", " "],
          ["é uma", " "],
          ["é um", " "],
          ["narre", " "],
          ["cause", " "],
          ["marque", " "],
          ["caderno", ": "],
          ["autora", ": "],
          ["padrão", ": "],
          ["padrao", ": "],
          ["contém", " "],
          ["contem", " "],
          ["está", " "],
          ["esta", " "],
          ["herda", " "],
          ["grupo", " "],
          ["trait", " "],
          ["tem", " "],
        ]
      : kind === "rules"
        ? [
            ["on", ": "],
            ["if", ": "],
            ["do", ": "],
            ["narrativa", ": "],
            ["narrative", ": "],
          ]
        : kind === "entities"
          ? [
              ["name", ": "],
              ["description", ": "],
              ["templateId", ": "],
              ["tags", ": "],
              ["stats", ": "],
              ["flags", ": "],
              ["enums", ": "],
              ["phrases", ": "],
              ["hardLinks", ": "],
              ["softLinks", ": "],
              ["links", ": "],
              ["lists", ": "],
              ["fuses", ": "],
              ["struct", ": "],
              ["aliases", ": "],
            ]
          : kind === "taxonomy"
            ? []
            : [];
  if (kind !== "notebook" && /\s/.test(typed)) return null;
  const folded = foldKey(typed);
  const hit = table.find(([trigger]) => foldKey(trigger) === folded);
  if (!hit) return null;
  const insert = hit[1]!;
  if (kind === "rules") {
    const canon = hit[0]!;
    if (typed === canon && source.slice(offset, offset + insert.length) === insert) return null;
    if (insert.startsWith(":") && source[offset] === ":" && typed === canon) return null;
    return {
      source: source.slice(0, lineStart) + indent + canon + insert + source.slice(offset),
      offset: lineStart + indent.length + canon.length + insert.length,
    };
  }
  if (source.slice(offset, offset + insert.length) === insert) return null;
  if (insert.startsWith(":") && source[offset] === ":") return null;
  return {
    source: source.slice(0, offset) + insert + source.slice(offset),
    offset: offset + insert.length,
  };
}

export function indentOnEnter(source: string, offset: number): { source: string; offset: number } | null {
  const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
  const line = source.slice(lineStart, offset);
  if (!/:\s*$/.test(line)) return null;
  const indent = line.match(/^\s*/)?.[0] ?? "";
  const extra = `${indent}  `;
  const insert = `\n${extra}`;
  return {
    source: source.slice(0, offset) + insert + source.slice(offset),
    offset: offset + insert.length,
  };
}

export function insertSectionBreak(source: string, offset: number): { source: string; offset: number } {
  const insert = "\n\n---\n\n";
  return { source: source.slice(0, offset) + insert + source.slice(offset), offset: offset + insert.length };
}

export function addLineNote(source: string, line: number, note: string): string {
  const lines = source.split("\n");
  if (!lines.length) lines.push("");
  const i = Math.max(0, Math.min(lines.length - 1, line - 1));
  const stripped = (lines[i] ?? "").replace(/\s*\/\*[\s\S]*?\*\/\s*$/, "");
  const text = note.trim();
  lines[i] = text ? `${stripped.replace(/\s+$/, "")} /* ${text} */` : stripped;
  return lines.join("\n");
}

export function noteOnLine(line: string): string | null {
  const m = line.match(/\/\*\s*(.*?)\s*\*\/\s*$/);
  const text = m?.[1]?.trim() ?? "";
  return text || null;
}
