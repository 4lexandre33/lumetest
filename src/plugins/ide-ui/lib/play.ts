import type { StatValue } from "../../narrative-engine/index.ts";

export type PlayHud = {
  title: string;
  turn: number;
  score: number | null;
};

function numericStat(stats: Record<string, StatValue> | Record<string, number> | undefined, key: string): number | null {
  const value = stats?.[key];
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "value" in value && typeof value.value === "number") return value.value;
  return null;
}

export function playHud(
  title: string,
  historyLength: number,
  stats: Record<string, StatValue> | Record<string, number> | undefined,
): PlayHud {
  const score = numericStat(stats, "score");
  return { title, turn: Math.max(0, historyLength - 1), score };
}