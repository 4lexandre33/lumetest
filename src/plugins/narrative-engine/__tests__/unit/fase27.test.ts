import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCore } from "../../../../core/index.ts";
import {
  NARRATIVE_ENGINE_MANIFEST,
  createNarrativeEnginePlugin,
  compileProject,
  createProject,
  findMatchingRule,
  type RuleResolver,
} from "../../index.ts";
import type { GameState } from "../../lib/runtime.ts";

describe("fase 27", () => {
  it("separa quem casa, quem aplica e quem corre, com um só matcher", async () => {
    const core = createCore();
    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    await core.activatePlugin("lume-narrative-engine");
    const resolver = core.getService<RuleResolver>("RuleResolver");
    const effects = core.getService<{ apply: unknown }>("RuleEffects");
    const runtime = core.getService<{ createGame: (...args: never[]) => GameState; interactWith: (state: GameState, id: string) => GameState }>("RuleRuntime");
    assert.equal(typeof effects.apply, "function");

    const compiled = compileProject(createProject("turno", {
      entitiesSource: "@goblin.{ tags: agent; stats: hp=1; }\n",
      rulesSource: "#r\non: @goblin\ndo: @goblin.hp+1\n",
    }));
    assert.equal(compiled.errors.length, 0, compiled.errors.map((issue) => issue.message).join("\n"));
    const direct = findMatchingRule("@goblin", compiled.rules, compiled.worldModel, compiled.taxonomy);
    const via = resolver.resolveRule("@goblin", compiled.rules, compiled.worldModel, compiled.taxonomy);
    assert.equal(via?.id, direct?.id);
    assert.equal(via?.id, "r");

    const after = runtime.interactWith(runtime.createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy), "@goblin");
    assert.equal(after.worldModel.get("@goblin")?.stats.hp, 2);
    assert.equal(after.lastRule?.id, "r");

    const effectsSrc = readFileSync("src/plugins/narrative-engine/lib/rule-effects.ts", "utf8");
    const runtimeSrc = readFileSync("src/plugins/narrative-engine/lib/runtime.ts", "utf8");
    assert.equal(effectsSrc.includes("findMatchingRule"), false);
    assert.equal(runtimeSrc.includes("findMatchingRule"), false);
    const defs = readFileSync("src/plugins/narrative-engine/lib/rule-engine.ts", "utf8").match(/export function findMatchingRule\(/g) ?? [];
    assert.equal(defs.length, 1);
  });
});
