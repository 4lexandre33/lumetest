import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createCore } from "../../../../core/index.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin, compileEntityFile } from "../../../narrative-engine/index.ts";
import { MUTATION_GATEWAY_MANIFEST, createMutationGatewayPlugin, descerMutacao, type MutationGatewayService } from "../../index.ts";

describe("fase 26", () => {
  it("a gateway saiu do narrative-engine e o do: continua a ser a mutação", async () => {
    assert.equal(existsSync("src/plugins/narrative-engine/lib/mutation-gateway.ts"), false);
    assert.equal(existsSync("src/plugins/mutation-gateway/lib/gateway.ts"), true);
    const core = createCore();
    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    core.registerPlugin(MUTATION_GATEWAY_MANIFEST, createMutationGatewayPlugin);
    await core.activatePlugin("lume-narrative-engine");
    await core.activatePlugin("lume-mutation-gateway");
    const gateway = core.getService<MutationGatewayService>("MutationGateway");
    const world = compileEntityFile("@goblin.{ tags: agent; stats: hp=1; }").worldModel;
    const prose = "O goblin recua.";
    const decision = gateway.descerMutacao("modelo", "SET_STAT @goblin.hp 4", world, prose);
    assert.equal(decision.ok, true);
    assert.equal(decision.prose, prose);
    assert.equal(decision.world.get("@goblin")?.stats.hp, 4);
    const undone = decision.undo?.();
    assert.equal(undone?.prose, prose);
    assert.equal(undone?.world.get("@goblin")?.stats.hp, 1);
    const same = descerMutacao("comando", "narrativa: 'oi'", world, prose);
    assert.equal(same.ok, false);
    assert.equal(same.prose, prose);
  });
});
