import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createCore, Core } from "../../../../core/index.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin } from "../../../narrative-engine/index.ts";
import type { NarrativeEngineService } from "../../../narrative-engine/types.ts";
import { INTENT_ENGINE_MANIFEST, createIntentEnginePlugin } from "../../index.ts";
import type { IntentCatalogService, IntentEngineService } from "../../types.ts";
import { createExampleProject } from "../../../narrative-engine/index.ts";

describe("Intent Engine capabilities", () => {
  let core: Core;
  let engine: IntentEngineService;
  let catalog: IntentCatalogService;
  let narrative: NarrativeEngineService;

  beforeEach(async () => {
    core = createCore();
    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    core.registerPlugin(INTENT_ENGINE_MANIFEST, createIntentEnginePlugin);
    await core.activatePlugin("lume-narrative-engine");
    await core.activatePlugin("lume-intent-engine");
    engine = core.getService<IntentEngineService>("IntentEngine");
    catalog = core.getService<IntentCatalogService>("IntentCatalog");
    narrative = core.getService<NarrativeEngineService>("NarrativeEngine");
  });

  it("registers both capabilities after activation", () => {
    assert.ok(engine);
    assert.ok(catalog);
    assert.ok(core.listActivePlugins().includes("lume-intent-engine"));
    assert.equal(engine.getCatalog(), catalog);
  });

  it("parses commands through the IntentEngine service without touching the world", () => {
    const parsed = engine.parse("intent.action.interact.attack.@goblin");
    assert.equal(parsed.status, "complete");
    assert.equal(parsed.family, "action");
    assert.deepEqual(parsed.operation, ["interact", "attack"]);
    assert.equal(parsed.args.target, "@goblin");

    const children = catalog.getChildren("intent.");
    assert.deepEqual(
      children.map((n) => n.token),
      ["action", "cognize", "perceive"],
    );
  });

  it("resolves suggestions through QueryEngine with effective taxonomy", () => {
    const project = createExampleProject("goblin-cave");
    const compiled = narrative.compileProject(project);
    const game = narrative.createGame(
      compiled.worldModel,
      compiled.rules,
      project.settings.playerEntityId,
      compiled.taxonomy,
    );

    assert.deepEqual(
      engine.suggest("intent.action.interact.take.", game).map((s) => s.token),
      ["@tocha"],
    );
    assert.equal(engine.resolve("intent.action.interact.attack.@goblin", game).status, "TARGET_UNAVAILABLE");

    game.worldModel.get("@jogador")!.links.current_location = "@caverna";
    const attack = engine.resolve("intent.action.interact.attack.@goblin", game);
    assert.equal(attack.status, "VALID");
    assert.equal(attack.resolvedArgs?.target, "@goblin");
  });

  it("executes take through NarrativeEngine.interact and strips intent links", () => {
    const project = createExampleProject("goblin-cave");
    const compiled = narrative.compileProject(project);
    const game = narrative.createGame(
      compiled.worldModel,
      compiled.rules,
      project.settings.playerEntityId,
      compiled.taxonomy,
    );

    const result = engine.execute("intent.action.interact.take.@tocha", game);
    assert.equal(result.executed, true);
    assert.equal(result.triggerId, "@tocha");
    assert.equal(game.worldModel.get("@tocha")?.links.current_location, "@entrada");
    assert.equal(result.game.worldModel.get("@tocha")?.links.current_location, "@jogador");
    const actor = result.game.worldModel.get("@jogador");
    assert.ok(actor);
    assert.equal(actor.links.intent, undefined);
    assert.equal(actor.links.intent_target, undefined);
  });

  it("maps a preview choice to an Intent command", () => {
    const project = createExampleProject("goblin-cave");
    const compiled = narrative.compileProject(project);
    const game = narrative.createGame(
      compiled.worldModel,
      compiled.rules,
      project.settings.playerEntityId,
      compiled.taxonomy,
    );
    assert.equal(engine.commandFromChoice(game, "@tocha"), "intent.action.interact.take.@tocha");
    assert.equal(engine.commandFromChoice(game, "@caverna"), "intent.action.move.@caverna");
  });

  it("completes command tokens for the CommandBar", () => {
    assert.equal(engine.applySuggestion("intent.action.", "move"), "intent.action.move.");
    assert.equal(engine.applySuggestion("intent.action.move.", "@caverna"), "intent.action.move.@caverna");
  });
});
