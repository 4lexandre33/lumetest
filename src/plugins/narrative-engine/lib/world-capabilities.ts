import type { Entity, EntityId, WorldModel } from "./types.ts";
import { cloneWorldModel } from "./world-model.ts";
import { adaptWorld, memoryBackend, type WorldBackend, type WorldPort } from "./world-port.ts";

export type WorldSource = WorldModel | WorldBackend;

function isBackend(source: WorldSource): source is WorldBackend {
  return typeof (source as WorldBackend).load === "function" && typeof (source as WorldBackend).save === "function";
}

function portOf(source: WorldSource): WorldPort {
  return adaptWorld(isBackend(source) ? source : memoryBackend(source));
}

/** Lê. Não escreve. */
export type WorldQuery = {
  read(source: WorldSource, id: EntityId): Entity | undefined;
  query(source: WorldSource, pred: (entity: Entity) => boolean): Entity[];
  current(source: WorldSource): WorldModel;
  snapshot(source: WorldSource): WorldModel;
};

/** Escreve pela porta. O adaptador fica por baixo. */
export type WorldMutation = {
  create(source: WorldSource, entity: Entity): void;
  update(source: WorldSource, id: EntityId, patch: (entity: Entity) => void): boolean;
  destroy(source: WorldSource, id: EntityId): void;
  relate(source: WorldSource, id: EntityId, key: string, dest: EntityId, kind: "hard" | "soft"): boolean;
  unrelate(source: WorldSource, id: EntityId, key: string): boolean;
  replace(source: WorldSource, next: WorldModel): void;
};

export function worldQuery(): WorldQuery {
  return {
    read: (source, id) => portOf(source).read(id),
    query: (source, pred) => portOf(source).query(pred),
    current: (source) => portOf(source).current(),
    snapshot: (source) => cloneWorldModel(portOf(source).current()),
  };
}

export function worldMutation(): WorldMutation {
  return {
    create: (source, entity) => portOf(source).create(entity),
    update: (source, id, patch) => portOf(source).update(id, patch),
    destroy: (source, id) => portOf(source).destroy(id),
    relate: (source, id, key, dest, kind) => portOf(source).relate(id, key, dest, kind),
    unrelate: (source, id, key) => portOf(source).unrelate(id, key),
    replace: (source, next) => portOf(source).replace(next),
  };
}
