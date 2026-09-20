import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createCore, type Core } from "../../../../core/index.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin } from "../../../narrative-engine/index.ts";
import type { NarrativeEngineService } from "../../../narrative-engine/types.ts";
import { KNOWLEDGE_MANIFEST, createKnowledgePlugin } from "../../index.ts";
import type { KnowledgeService } from "../../types.ts";

describe("Knowledge", () => {
  let core: Core;
  let narrative: NarrativeEngineService;
  let knowledge: KnowledgeService;

  beforeEach(async () => {
    core = createCore();
    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    core.registerPlugin(KNOWLEDGE_MANIFEST, createKnowledgePlugin);
    await core.activatePlugin("lume-narrative-engine");
    await core.activatePlugin("lume-knowledge");
    narrative = core.getService<NarrativeEngineService>("NarrativeEngine");
    knowledge = core.getService<KnowledgeService>("Knowledge");
  });

  it("declares Knowledge capability", () => {
    assert.equal(KNOWLEDGE_MANIFEST.name, "lume-knowledge");
    assert.ok(KNOWLEDGE_MANIFEST.capabilities?.provides?.some((c) => c.name === "Knowledge"));
  });

  it("KNOW writes cognition on the agent and does not mutate INFORMATION", () => {
    const project = narrative.createProject("know", {
      entitiesSource: `@jogador.{ tags: agent; stats: ; links: current_location=@sala; }
@lore.{ tags: information; stats: ; links: current_location=@sala; name: Pergaminho; }
@sala.{ tags: place; stats: ; links: ; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# ler
ON: @lore
DO: KNOW @jogador.@lore
narrativa: "leu"
`,
    });
    const compiled = narrative.compileProject(project);
    assert.equal(compiled.errors.length, 0);
    let game = narrative.bootGame(
      narrative.createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy),
    );
    const loreBefore = game.worldModel.get("@lore")!;
    game = narrative.interact(game, "@lore");
    assert.equal(knowledge.knows(game.worldModel, "@jogador", "@lore"), true);
    assert.deepEqual(knowledge.factsFor(game.worldModel, "@jogador"), ["@lore"]);
    assert.ok(game.worldModel.get("@lore")?.tags.has("information"));
    assert.equal(game.worldModel.get("@lore")?.links.current_location, loreBefore.links.current_location);
    assert.equal(game.worldModel.get("@jogador")?.tags.has("information"), false);
    assert.equal(knowledge.knows(game.worldModel, "@jogador", "@sala"), false);
  });
});
