import type { GameState, WorldModel } from "../narrative-engine/types.ts";

export interface KnowledgeService {
  remember(game: GameState, agentId: string, factId: string): GameState;
  knows(world: WorldModel, agentId: string, factId: string): boolean;
  factsFor(world: WorldModel, agentId: string): string[];
  believes(world: WorldModel, agentId: string, factId: string): boolean;
  beliefsFor(world: WorldModel, agentId: string): string[];
  ignores(world: WorldModel, agentId: string, factId: string): boolean;
  ignorantOf(world: WorldModel, agentId: string): string[];
}
