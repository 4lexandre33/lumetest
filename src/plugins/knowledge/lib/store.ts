import { cloneWorldModel } from "../../narrative-engine/index.ts";
import type { GameState, WorldModel } from "../../narrative-engine/types.ts";

export const KNOWS_PREFIX = "knows_";
export const BELIEVES_PREFIX = "believes_";
export const IGNORES_PREFIX = "ignores_";

export function knowledgeTag(factId: string): string {
  return `${KNOWS_PREFIX}${factId}`;
}

function tagged(world: WorldModel, agentId: string, prefix: string): string[] {
  const tags = world.get(agentId)?.tags;
  if (!tags) return [];
  return [...tags].filter((tag) => tag.startsWith(prefix)).map((tag) => tag.slice(prefix.length)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function knows(world: WorldModel, agentId: string, factId: string): boolean {
  return world.get(agentId)?.tags.has(knowledgeTag(factId)) ?? false;
}

export function factsFor(world: WorldModel, agentId: string): string[] {
  return tagged(world, agentId, KNOWS_PREFIX);
}

export function believes(world: WorldModel, agentId: string, factId: string): boolean {
  return world.get(agentId)?.tags.has(`${BELIEVES_PREFIX}${factId}`) ?? false;
}

export function beliefsFor(world: WorldModel, agentId: string): string[] {
  return tagged(world, agentId, BELIEVES_PREFIX);
}

export function ignores(world: WorldModel, agentId: string, factId: string): boolean {
  return world.get(agentId)?.tags.has(`${IGNORES_PREFIX}${factId}`) ?? false;
}

export function ignorantOf(world: WorldModel, agentId: string): string[] {
  return tagged(world, agentId, IGNORES_PREFIX);
}

export function remember(game: GameState, agentId: string, factId: string): GameState {
  if (!factId || !game.worldModel.get(agentId)) return game;
  if (knows(game.worldModel, agentId, factId)) return game;
  const world = cloneWorldModel(game.worldModel);
  world.get(agentId)!.tags.add(knowledgeTag(factId));
  return { ...game, worldModel: world };
}
