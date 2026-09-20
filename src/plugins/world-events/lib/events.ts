import { cloneWorldModel, createEmptyEntity } from "../../narrative-engine/lib/world-model.ts";
import type { GameState } from "../../narrative-engine/types.ts";

export function ensureEventEntity(game: GameState, eventId: string): GameState {
  if (game.worldModel.has(eventId)) return game;
  const world = cloneWorldModel(game.worldModel);
  world.set(eventId, createEmptyEntity(eventId, { tags: ["event"] }));
  return { ...game, worldModel: world };
}