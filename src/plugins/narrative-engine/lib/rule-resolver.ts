import { findMatchingRule, findMatchingRules, type Rule, type RuleMatch } from "./rule-engine.ts";
import type { CompiledTaxonomy } from "./taxonomy.ts";
import type { WorldModel } from "./types.ts";

/** A única porta de casamento. Por baixo está um só `findMatchingRule`. */
export function resolveRule(
  triggerId: string,
  rules: readonly Rule[],
  world: WorldModel,
  taxonomy?: CompiledTaxonomy | null,
): Rule | null {
  return findMatchingRule(triggerId, rules, world, taxonomy);
}

export function resolveRules(
  triggerId: string,
  rules: readonly Rule[],
  world: WorldModel,
  taxonomy?: CompiledTaxonomy | null,
): RuleMatch[] {
  return findMatchingRules(triggerId, rules, world, taxonomy);
}

export type RuleResolver = {
  resolveRule: typeof resolveRule;
  resolveRules: typeof resolveRules;
};

export function ruleResolver(): RuleResolver {
  return { resolveRule, resolveRules };
}
