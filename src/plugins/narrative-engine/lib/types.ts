export type EntityId = string;

/** Gauge com clamping automático `[min..max]`. */
export type BoundedStat = { value: number; min: number; max: number };
export type StatValue = number | BoundedStat;

/** Temporizador por turno. Ao chegar a 0 dispara `targetId`. */
export type TickFuse = { remaining: number; targetId: string };

export type ListOp = "PUSH" | "POP" | "REMOVE" | "CLEAR" | "ADD_UNIQUE";

export const FBE_DRAWERS = [
  "tags",
  "stats",
  "flags",
  "enums",
  "phrases",
  "hardLinks",
  "softLinks",
  "lists",
  "fuses",
  "struct",
] as const;
export type FbeDrawer = (typeof FBE_DRAWERS)[number];
export type PathDrawer = FbeDrawer | "links";

const PATH_DRAWER_SET = new Set<string>([...FBE_DRAWERS, "links"]);
export function isPathDrawer(name: string): name is PathDrawer {
  return PATH_DRAWER_SET.has(name);
}

export const ENTITY_SECTIONS = [
  "id",
  "slug",
  "shortCode",
  "templateId",
  "name",
  "description",
  ...FBE_DRAWERS,
  "links",
  "voice",
  "aliases",
] as const;

/**
 * Feature-Based Entity (FBE).
 *
 * Quad-IDs:
 * 1. `systemId` — UUID de máquina, imutável (camada System ID). Gerado; não se escreve na DSL.
 * 2. `slug` / `id` — HumanSlug, chave do WorldModel (`@pessoa`).
 *    O matcher, as regras e `world.get("@pessoa")` usam o slug — um só `findMatchingRule`.
 * 3. `shortCode` — código compacto `#A8F2` (gerado, estável por slug). Na DSL, `id:`.
 * 4. `templateId` — protótipo opcional para SPAWN.
 *
 * `id` permanece o HumanSlug para o matcher, query, regras e `world.get("@pessoa")`.
 * A gaveta `extra` não faz parte do modelo base; o plugin entity-extras usa-a
 * só para metadados de apresentação (voice/aliases).
 */
export type Entity = {
  id: EntityId;
  slug: string;
  systemId: string;
  shortCode: string;
  templateId?: string;
  name: string;
  description: string;
  tags: Set<string>;
  stats: Record<string, StatValue>;
  flags: Record<string, boolean>;
  enums: Record<string, string>;
  phrases: Record<string, string>;
  hardLinks: Record<string, EntityId>;
  softLinks: Record<string, EntityId>;
  /** União hard+soft para matcher / query / runtime. */
  links: Record<string, EntityId>;
  lists: Record<string, Array<string | number>>;
  fuses: Record<string, TickFuse>;
  struct: Record<string, unknown>;
  extra?: Record<string, string>;
};

export type WorldModel = Map<EntityId, Entity>;

export type IssueSeverity = "error" | "warning";
export type IssueLocation = { file: string; line: number; column?: number; endColumn?: number };
export type Issue = { code: string; severity: IssueSeverity; message: string; location: IssueLocation };

export type MatcherSelector =
  | { kind: "any" }
  | { kind: "trigger" }
  | { kind: "id"; id: EntityId }
  | { kind: "linkLookup"; entityId: EntityId; key: string };
export type MatcherValue =
  | { kind: "number"; value: number }
  | { kind: "id"; id: EntityId }
  | { kind: "trigger" }
  | { kind: "linkLookup"; entityId: EntityId; key: string };
export type Comparator = "=" | ">" | "<" | ">=" | "<=";
export type MatcherClause = { negated: boolean; key: string; drawer?: PathDrawer; op?: Comparator; value?: MatcherValue };
export type MatcherPossess = { negated: boolean; item: MatcherAST };
export type MatcherBranch = { selector: MatcherSelector; clauses: MatcherClause[]; possess?: MatcherPossess };
export type MatcherAST = {
  selector: MatcherSelector;
  clauses: MatcherClause[];
  source: string;
  /** Ramos OU. Ausente num matcher simples — `selector`/`clauses` são o único ramo. */
  branches?: MatcherBranch[];
  /** TEM / NAO_TEM no ramo simples. */
  possess?: MatcherPossess;
};

export function matcherBranches(ast: MatcherAST): MatcherBranch[] {
  return ast.branches ?? [{ selector: ast.selector, clauses: ast.clauses, possess: ast.possess }];
}

export type ChangeTarget =
  | { kind: "id"; id: EntityId }
  | { kind: "trigger" }
  | { kind: "linkLookup"; entityId: EntityId; key: string };
export type ChangeField =
  | { kind: "addTag"; tag: string }
  | { kind: "removeTag"; tag: string }
  | { kind: "setStat"; key: string; value: number }
  | { kind: "deltaStat"; key: string; delta: number }
  | { kind: "deltaStatFrom"; key: string; sign: number; from: ChangeTarget; stat: string }
  | { kind: "mulStat"; key: string; factor: number }
  | { kind: "setLink"; key: string; value: ChangeTarget; linkKind?: "hard" | "soft" }
  | { kind: "setFlag"; key: string; value: boolean }
  | { kind: "setEnum"; key: string; value: string }
  | { kind: "setPhrase"; key: string; value: string }
  | { kind: "clearLink"; key: string }
  | { kind: "setFuse"; key: string; remaining: number; targetId: string }
  | { kind: "listOp"; list: string; op: ListOp; value?: string | number }
  | { kind: "createEntity"; entity: Entity }
  | { kind: "destroyEntity" };
export type ChangeAST = { target: ChangeTarget; fields: ChangeField[]; source: string; line?: number };

export type TokenKind =
  | "IDENT"
  | "NUMBER"
  | "DOT"
  | "EQ"
  | "GT"
  | "LT"
  | "GTE"
  | "LTE"
  | "BANG"
  | "STAR"
  | "DOLLAR"
  | "LPAREN"
  | "RPAREN"
  | "SLASH"
  | "PLUS"
  | "MINUS"
  | "COLON"
  | "LBRACE"
  | "RBRACE"
  | "COMMA"
  | "SEMI"
  | "EOF";

export type Token = {
  kind: TokenKind;
  value: string;
  number?: number;
  line: number;
  column: number;
  index: number;
};

export const CATEGORY_TAGS = ["agent", "object", "place", "event", "information", "abstract"] as const;
export type CategoryTag = (typeof CATEGORY_TAGS)[number];
export const CATEGORY_LABEL: Record<CategoryTag, string> = {
  agent: "Agent",
  object: "Object",
  place: "Place",
  event: "Event",
  information: "Information",
  abstract: "Abstract",
};
export const BUILTIN_TAGS = [...CATEGORY_TAGS, "hidden"] as const;
export const VIEW_TAGS = new Set<string>(CATEGORY_TAGS);

export function isCategoryTag(tag: string): tag is CategoryTag {
  return (CATEGORY_TAGS as readonly string[]).includes(tag);
}

export function migrateLegacyTags(source: string): string {
  if (!source) return source;
  return source
    .replace(/\.character\b/g, ".agent")
    .replace(/\.item\b/g, ".object")
    .replace(/\.location\b/g, ".place")
    .replace(/!character\b/g, "!agent")
    .replace(/!item\b/g, "!object")
    .replace(/!location\b/g, "!place");
}
