import type { Entity, EntityId, WorldModel } from "./types.ts";
import { assignLink, clearLink, destroyEntityInWorld } from "./world-model.ts";

/** Porta do mundo. Não conhece regra, texto nem IR. */
export type WorldPort = {
  read(id: EntityId): Entity | undefined;
  query(pred: (entity: Entity) => boolean): Entity[];
  create(entity: Entity): void;
  update(id: EntityId, patch: (entity: Entity) => void): boolean;
  destroy(id: EntityId): void;
  relate(id: EntityId, key: string, dest: EntityId, kind: "hard" | "soft"): boolean;
  unrelate(id: EntityId, key: string): boolean;
  current(): WorldModel;
  replace(next: WorldModel): void;
};

/** Outro sítio onde o mundo vive. O adaptador é que o torna `WorldPort`. */
export type WorldBackend = {
  load(): WorldModel;
  save(world: WorldModel): void;
};

export function memoryBackend(world: WorldModel): WorldBackend {
  let current = world;
  return {
    load: () => current,
    save: (next) => {
      current = next;
    },
  };
}

export function adaptWorld(backend: WorldBackend): WorldPort {
  return {
    read: (id) => backend.load().get(id),
    query: (pred) => [...backend.load().values()].filter(pred).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    create: (entity) => {
      const current = backend.load();
      current.set(entity.id, entity);
      backend.save(current);
    },
    update: (id, patch) => {
      const current = backend.load();
      const entity = current.get(id);
      if (!entity) return false;
      patch(entity);
      backend.save(current);
      return true;
    },
    destroy: (id) => {
      const current = backend.load();
      destroyEntityInWorld(current, id);
      backend.save(current);
    },
    relate: (id, key, dest, kind) => {
      const current = backend.load();
      const entity = current.get(id);
      if (!entity || !key || !dest) return false;
      assignLink(entity, key, dest, kind);
      backend.save(current);
      return true;
    },
    unrelate: (id, key) => {
      const current = backend.load();
      const entity = current.get(id);
      if (!entity) return false;
      clearLink(entity, key);
      backend.save(current);
      return true;
    },
    current: () => backend.load(),
    replace: (next) => backend.save(next),
  };
}

export function worldPort(world: WorldModel): WorldPort {
  return adaptWorld(memoryBackend(world));
}
