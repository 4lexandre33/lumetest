import type { WorldModel } from "../narrative-engine/types.ts";

export type NlpHit = {
  command: string;
  dryRun: boolean;
};

export type NlpScopeSnapshot = {
  place?: string | null;
  see?: readonly string[];
  hear?: readonly string[];
  touch?: readonly string[];
  inventory?: readonly string[];
};

export type NlpScope = readonly string[] | NlpScopeSnapshot;

export interface NlpService {
  interpret(text: string, world: WorldModel, scope?: NlpScope): NlpHit | null;
  splitPhrases(text: string): string[];
}
