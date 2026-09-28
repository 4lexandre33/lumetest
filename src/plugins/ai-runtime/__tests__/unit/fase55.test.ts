import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createCore } from "../../../../core/index.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin, compileEntityFile } from "../../../narrative-engine/index.ts";
import { MUTATION_GATEWAY_MANIFEST, createMutationGatewayPlugin, definirPolitica } from "../../../mutation-gateway/index.ts";
import { MANUSCRIPT_MANIFEST, createManuscriptPlugin } from "../../../manuscript/index.ts";
import { SENTENCE_CONTEXT_MANIFEST, createSentenceContextPlugin } from "../../../sentence-context/index.ts";
import { AI_RUNTIME_MANIFEST, createAiRuntimePlugin, definirPoliticaIa, definirProvider, propor } from "../../index.ts";

function textos(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "__tests__") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) textos(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(readFileSync(path, "utf8"));
  }
  return out;
}

describe("fase 55", () => {
  it("a política pode recusar e o texto do modelo não se aplica sem a gateway", async () => {
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

    const entities = "@maria.{ name: 'Maria'; tags: agent; stats: hp=10; }";
    const prosa = "### Sala\n\nMaria entrou.\n\n### Rua\n\nAna esperou.";
    const world = compileEntityFile(entities).worldModel;
    let visto = "";
    definirProvider({
      id: "teste",
      propor(frase) {
        visto = JSON.stringify(frase);
        return "Ana esperou na rua.";
      },
    });
    definirPoliticaIa({ allow: () => false });
    const recusada = propor(prosa, prosa.indexOf("Maria"), entities, world);
    assert.equal(visto.includes("Ana esperou"), false);
    assert.equal(visto.includes(prosa), false);
    assert.equal(recusada.desceu, false);
    assert.equal(recusada.decision, null);
    assert.equal(world.get("@maria")?.stats.hp, 10);
    assert.equal(prosa.includes("Ana esperou."), true);

    definirPoliticaIa(null);
    const pelaGateway = propor(prosa, prosa.indexOf("Maria"), entities, world);
    assert.equal(pelaGateway.decision != null, true);
    assert.equal(pelaGateway.decision?.prose, prosa);
    assert.equal(prosa.includes("Ana esperou na rua."), false);

    const fonte = textos("src/plugins/ai-runtime").join("\n");
    assert.equal(fonte.includes("applyChanges"), false);
    assert.equal(fonte.includes("descerMutacao"), true);
    definirPolitica(null);
    definirPoliticaIa(null);
    definirProvider(null);
  });
});
