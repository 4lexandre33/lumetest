import type { GameBeat } from "../narrative-engine/index.ts";
import type { SiftHit, SiftPattern } from "../narrative-engine/index.ts";

export interface SiftService {
  id: "sift";
  parse(source: string): SiftPattern[];
  match(history: readonly Pick<GameBeat, "triggerId">[], patterns: readonly SiftPattern[]): SiftHit[];
  banner(hits: readonly SiftHit[]): string;
}
