import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCore } from "../../../../core/index.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin, compileEntityFile } from "../../../narrative-engine/index.ts";
import { MUTATION_GATEWAY_MANIFEST, createMutationGatewayPlugin, definirPolitica, descerMutacao } from "../../../mutation-gateway/index.ts";
import { MANUSCRIPT_MANIFEST, createManuscriptPlugin } from "../../../manuscript/index.ts";
import { SENTENCE_CONTEXT_MANIFEST, createSentenceContextPlugin } from "../../../sentence-context/index.ts";
import { AI_RUNTIME_MANIFEST, createAiRuntimePlugin, definirPoliticaIa, definirProvider, propor, type AiRuntimeService } from "../../index.ts";

const entities = "@maria.{ name: 'Maria'; tags: agent; stats: hp=10; }";
const prosa = "### Sala\n\nMaria entrou.\n\n### Rua\n\nAna esperou.";

function mundo() {
  const compiled = compileEntityFile(entities);
  assert.equal(compiled.errors.length, 0, compiled.errors.map((issue) => issue.message).join("\n"));
  return compiled.worldModel;
}

describe("fase 39", () => {
  it("a proposta desce à gateway como um comando e não vê o livro", async () => {
    definirPolitica(null);
    definirPoliticaIa(null);
    const core = createCore();
    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    core.registerPlugin(MUTATION_GATEWAY_MANIFEST, createMutationGatewayPlugin);
    core.registerPlugin(MANUSCRIPT_MANIFEST, createManuscriptPlugin);
    core.registerPlugin(SENTENCE_CONTEXT_MANIFEST, createSentenceContextPlugin);
    core.registerPlugin(AI_RUNTIME_MANIFEST, createAiRuntimePlugin);
    await core.activatePlugin("lume-narrative-engine");
    await core.activatePlugin("lume-mutation-gateway");
    await core.activatePlugin("lume-manuscript");
    await core.activatePlugin("lume-sentence-context");
    await core.activatePlugin("lume-ai-runtime");
    const api = core.getService<AiRuntimeService>("AiRuntime");
    let visto = "";
    api.definirProvider({
      id: "teste",
      propor(frase) {
        visto = JSON.stringify(frase);
        return "SET_STAT @maria.hp 4";
      },
    });
    const world = mundo();
    const antes = world.get("@maria")?.stats.hp;
    const proposta = api.propor(prosa, prosa.indexOf("Maria"), entities, world);
    assert.equal(proposta.contexto, "Maria entrou.");
    assert.equal(visto.includes("Ana esperou"), false);
    assert.equal(visto.includes(prosa), false);
    assert.equal(proposta.desceu, true);
    assert.equal(proposta.decision?.prose, prosa);
    assert.equal(proposta.decision?.world.get("@maria")?.stats.hp, 4);

    const outro = mundo();
    const comando = descerMutacao("comando", "SET_STAT @maria.hp 4", outro, prosa);
    assert.equal(comando.ok, true);
    assert.equal(comando.world.get("@maria")?.stats.hp, proposta.decision?.world.get("@maria")?.stats.hp);

    const recusado = mundo();
    api.definirPoliticaIa({ allow: () => false });
    const parado = propor(prosa, prosa.indexOf("Maria"), entities, recusado);
    assert.equal(parado.desceu, false);
    assert.equal(parado.decision, null);
    assert.equal(recusado.get("@maria")?.stats.hp, antes);

    api.definirPoliticaIa(null);
    definirPolitica({ allow: (_line, origem) => origem !== "modelo" });
    const pelaPorta = mundo();
    const barrado = propor(prosa, prosa.indexOf("Maria"), entities, pelaPorta);
    assert.equal(barrado.desceu, false);
    assert.equal(barrado.decision?.ok, false);
    assert.equal(barrado.decision?.world.get("@maria")?.stats.hp, antes);
    definirPolitica(null);
    definirProvider(null);

    const fonte = readFileSync("src/plugins/ai-runtime/index.ts", "utf8");
    const corpo = readFileSync("src/plugins/ai-runtime/lib/runtime.ts", "utf8");
    assert.equal(fonte.includes("descerMutacao"), true);
    assert.equal(corpo.includes("applyChanges"), false);
  });
});
