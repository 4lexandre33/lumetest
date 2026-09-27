import { cloneWorldModel, createEmptyEntity } from "./world-model.ts";
import { createGame, interactWith, type GameState } from "./runtime.ts";
import type { Rule } from "./rule-engine.ts";
import type { SiftPattern } from "./sift.ts";
import type { CompiledTaxonomy } from "./taxonomy.ts";
import type { Entity, EnumState, StatValue, TickFuse, WorldModel } from "./types.ts";

export type SessionEntity = {
  id: string;
  slug?: string;
  systemId?: string;
  shortCode?: string;
  templateId?: string;
  name?: string;
  description?: string;
  tags: string[];
  stats: Record<string, StatValue>;
  flags?: Record<string, boolean>;
  enums?: Record<string, EnumState>;
  phrases?: Record<string, string>;
  hardLinks?: Record<string, string>;
  softLinks?: Record<string, string>;
  links: Record<string, string>;
  lists?: Record<string, Array<string | number>>;
  fuses?: Record<string, TickFuse>;
  struct?: Record<string, unknown>;
  extra?: Record<string, string>;
};

export type SessionJson = {
  seed: string;
  initialWorld: SessionEntity[];
  triggerIds: string[];
};

function entityToSession(entity: Entity): SessionEntity {
  return {
    id: entity.id,
    slug: entity.slug,
    systemId: entity.systemId,
    shortCode: entity.shortCode,
    templateId: entity.templateId,
    name: entity.name,
    description: entity.description,
    tags: [...entity.tags].sort(),
    stats: { ...entity.stats },
    flags: { ...entity.flags },
    enums: Object.fromEntries(
      Object.entries(entity.enums).map(([key, value]) => [key, { current: value.current, states: [...value.states] }]),
    ),
    phrases: { ...entity.phrases },
    hardLinks: { ...entity.hardLinks },
    softLinks: { ...entity.softLinks },
    links: { ...entity.links },
    lists: Object.fromEntries(Object.entries(entity.lists).map(([k, v]) => [k, [...v]])),
    fuses: { ...entity.fuses },
    struct: { ...entity.struct },
    extra: entity.extra ? { ...entity.extra } : undefined,
  };
}

export function worldToSession(world: WorldModel): SessionEntity[] {
  return [...world.values()].sort((a, b) => a.id.localeCompare(b.id)).map(entityToSession);
}

export function worldFromSession(entities: readonly SessionEntity[]): WorldModel {
  const world: WorldModel = new Map();
  for (const raw of entities) {
    if (!raw || typeof raw.id !== "string" || !raw.id) continue;
    const entity = createEmptyEntity(raw.id, {
      slug: raw.slug,
      systemId: raw.systemId,
      shortCode: raw.shortCode,
      templateId: raw.templateId,
      name: raw.name,
      description: raw.description,
      tags: Array.isArray(raw.tags) ? raw.tags.filter((t) => typeof t === "string") : [],
      stats: raw.stats && typeof raw.stats === "object" ? { ...raw.stats } : {},
      flags: raw.flags && typeof raw.flags === "object" ? { ...raw.flags } : {},
      enums: raw.enums && typeof raw.enums === "object" ? { ...raw.enums } : {},
      phrases: raw.phrases && typeof raw.phrases === "object" ? { ...raw.phrases } : {},
      hardLinks: raw.hardLinks && typeof raw.hardLinks === "object" ? { ...raw.hardLinks } : {},
      softLinks: raw.softLinks && typeof raw.softLinks === "object" ? { ...raw.softLinks } : {},
      links: raw.links && typeof raw.links === "object" ? { ...raw.links } : {},
      lists: raw.lists && typeof raw.lists === "object" ? { ...raw.lists } : {},
      fuses: raw.fuses && typeof raw.fuses === "object" ? { ...raw.fuses } : {},
      struct: raw.struct && typeof raw.struct === "object" ? { ...raw.struct } : {},
      extra: raw.extra && typeof raw.extra === "object" ? { ...raw.extra } : undefined,
    });
    world.set(entity.id, entity);
  }
  return world;
}

export function parseSession(raw: unknown): SessionJson | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (!Array.isArray(value.triggerIds) || !Array.isArray(value.initialWorld)) return null;
  const triggerIds = value.triggerIds.filter((id): id is string => typeof id === "string" && id.length > 0);
  const seed = value.seed == null ? "" : String(value.seed);
  return { seed, initialWorld: value.initialWorld as SessionEntity[], triggerIds };
}

export function exportSession(state: GameState): SessionJson {
  return {
    seed: state.seed ?? "",
    initialWorld: worldToSession(state.initialWorld),
    triggerIds: state.history.map((beat) => beat.triggerId),
  };
}

export function replaySession(
  session: SessionJson,
  rules: readonly Rule[],
  playerEntityId = "@jogador",
  taxonomy?: CompiledTaxonomy,
  patterns: readonly SiftPattern[] = [],
): GameState {
  const world = cloneWorldModel(worldFromSession(session.initialWorld));
  let game = createGame(world, rules, playerEntityId, taxonomy, patterns, { seed: session.seed });
  for (const id of session.triggerIds) game = interactWith(game, id);
  return game;
}
