import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCore } from "../../index.ts";
import type { Envelope } from "../../contracts/envelope.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin, compileEntityFile } from "../../../plugins/narrative-engine/index.ts";
import { MUTATION_GATEWAY_MANIFEST, createMutationGatewayPlugin, descerMutacao } from "../../../plugins/mutation-gateway/index.ts";

describe("fase 44", () => {
  it("o serviço só mostra o método declarado e a mutação desce pelo envelope", async () => {
    const core = createCore();
    const api = { eco: () => "ola", escondido: () => "nao" };
    core.registerCapability({ name: "Eco", version: "1.0.0", provider: "t", api, methods: ["eco"] });
    const svc = core.getService<{ eco?: () => string; escondido?: () => string }>("Eco");
    assert.equal(svc.eco?.(), "ola");
    assert.equal(svc.escondido, undefined);
    assert.equal("escondido" in svc, false);
    assert.equal(api.escondido(), "nao");
    assert.equal(typeof core.getService, "function");

    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    core.registerPlugin(MUTATION_GATEWAY_MANIFEST, createMutationGatewayPlugin);
    await core.activatePlugin("lume-narrative-engine");
    await core.activatePlugin("lume-mutation-gateway");
    const entities = "@maria.{ name: 'Maria'; tags: agent; stats: hp=10; }";
    const prose = "Maria entrou.";
    const world = compileEntityFile(entities).worldModel;
    const outro = compileEntityFile(entities).worldModel;
    const envelope: Envelope = {
      id: "1",
      type: "descerMutacao",
      version: "1.0.0",
      source: "core",
      capability: "MutationGateway",
      payload: { origem: "comando", doLine: "SET_STAT @maria.hp 4", world, prose },
      correlationId: "corr",
      timestamp: "2026-01-01T00:00:00.000Z",
      permissions: ["MutationGateway"],
      mode: "write",
    };
    const peloEnvelope = await core.dispatch<{ ok: boolean; prose: string; world: typeof world }>(envelope);
    const directo = descerMutacao("comando", "SET_STAT @maria.hp 4", outro, prose);
    assert.equal(peloEnvelope.ok, true);
    if (!peloEnvelope.ok) return;
    assert.equal(peloEnvelope.value.prose, prose);
    assert.equal(directo.prose, prose);
    assert.equal(peloEnvelope.value.world.get("@maria")?.stats.hp, directo.world.get("@maria")?.stats.hp);
    assert.equal(directo.world.get("@maria")?.stats.hp, 4);
  });
});
