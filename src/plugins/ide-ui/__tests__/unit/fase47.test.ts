import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCore } from "../../../../core/index.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin } from "../../../narrative-engine/index.ts";
import { MUTATION_GATEWAY_MANIFEST, createMutationGatewayPlugin } from "../../../mutation-gateway/index.ts";
import { MANUSCRIPT_MANIFEST, createManuscriptPlugin } from "../../../manuscript/index.ts";
import { SENTENCE_CONTEXT_MANIFEST, createSentenceContextPlugin } from "../../../sentence-context/index.ts";
import { NOTEBOOK_MANIFEST, createNotebookPlugin } from "../../../notebook/index.ts";
import { AI_RUNTIME_MANIFEST, createAiRuntimePlugin } from "../../../ai-runtime/index.ts";
import { AUTHORING_RUNTIME_MANIFEST, createAuthoringRuntimePlugin } from "../../../authoring-runtime/index.ts";
import { lerFrase } from "../../lib/leitura.ts";

describe("fase 47", () => {
  it("a superfície pede a autoria e o caderno não junta as leituras", async () => {
    const core = createCore();
    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    core.registerPlugin(MUTATION_GATEWAY_MANIFEST, createMutationGatewayPlugin);
    core.registerPlugin(MANUSCRIPT_MANIFEST, createManuscriptPlugin);
    core.registerPlugin(SENTENCE_CONTEXT_MANIFEST, createSentenceContextPlugin);
    core.registerPlugin(NOTEBOOK_MANIFEST, createNotebookPlugin);
    core.registerPlugin(AI_RUNTIME_MANIFEST, createAiRuntimePlugin);
    core.registerPlugin(AUTHORING_RUNTIME_MANIFEST, createAuthoringRuntimePlugin);
    await core.activatePlugin("lume-narrative-engine");
    await core.activatePlugin("lume-mutation-gateway");
    await core.activatePlugin("lume-manuscript");
    await core.activatePlugin("lume-sentence-context");
    await core.activatePlugin("lume-notebook");
    await core.activatePlugin("lume-ai-runtime");
    await core.activatePlugin("lume-authoring-runtime");
    const anterior = globalThis.__LUME_CORE__;
    globalThis.__LUME_CORE__ = core;
    const prosa = "### Sala\n\nMaria entrou.\n\n### Rua\n\nAna esperou.";
    const leitura = lerFrase(prosa, prosa.indexOf("Maria"), "@maria.{ name: 'Maria'; tags: agent; }");
    globalThis.__LUME_CORE__ = anterior;
    assert.equal(leitura?.historia, prosa);
    assert.equal(leitura?.contexto?.text, "Maria entrou.");
    assert.equal(leitura?.contexto?.cena.texto.includes("Ana esperou"), false);
    assert.equal(leitura?.proposta.desceu, false);

    const caderno = readFileSync("src/plugins/notebook/index.ts", "utf8");
    assert.equal(caderno.includes("lerManuscrito"), false);
    assert.equal(caderno.includes("contextoDaFrase"), false);
    const painel = readFileSync("src/plugins/ide-ui/lib/components/SalaPainel.tsx", "utf8");
    assert.equal(painel.includes("lerFrase"), true);
    const app = readFileSync("src/plugins/ide-ui/lib/components/IdeApp.tsx", "utf8");
    assert.equal(app.includes("AuthoringRuntime"), false);
  });
});
