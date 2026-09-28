import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCore } from "../../index.ts";
import { ordemDeBoot, type BootNode } from "../../boot-order.ts";
import { NARRATIVE_ENGINE_MANIFEST } from "../../../plugins/narrative-engine/index.ts";
import { MUTATION_GATEWAY_MANIFEST } from "../../../plugins/mutation-gateway/index.ts";
import { MANUSCRIPT_MANIFEST } from "../../../plugins/manuscript/index.ts";
import { SENTENCE_CONTEXT_MANIFEST } from "../../../plugins/sentence-context/index.ts";
import { NOTEBOOK_MANIFEST } from "../../../plugins/notebook/index.ts";
import { AI_RUNTIME_MANIFEST, createAiRuntimePlugin } from "../../../plugins/ai-runtime/index.ts";
import { AUTHORING_RUNTIME_MANIFEST } from "../../../plugins/authoring-runtime/index.ts";
import type { IPluginManifest } from "../../contracts/plugin-manifest.ts";

function no(manifest: IPluginManifest): BootNode {
  return {
    name: manifest.name,
    provides: manifest.capabilities?.provides?.map((item) => item.name) ?? [],
    requires: manifest.requires?.mandatory?.map((item) => item.name) ?? [],
  };
}

describe("fase 45", () => {
  it("o manifest declara as dependências e o registo continua manual", async () => {
    const core = createCore();
    core.registerPlugin(AI_RUNTIME_MANIFEST, createAiRuntimePlugin);
    await assert.rejects(() => core.activatePlugin("lume-ai-runtime"), /missing dependencies/);

    const ordem = ordemDeBoot([
      NARRATIVE_ENGINE_MANIFEST,
      MUTATION_GATEWAY_MANIFEST,
      AI_RUNTIME_MANIFEST,
      AUTHORING_RUNTIME_MANIFEST,
      MANUSCRIPT_MANIFEST,
      SENTENCE_CONTEXT_MANIFEST,
      NOTEBOOK_MANIFEST,
    ].map(no));
    assert.ok(ordem.indexOf("lume-manuscript") < ordem.indexOf("lume-sentence-context"));
    assert.ok(ordem.indexOf("lume-mutation-gateway") < ordem.indexOf("lume-ai-runtime"));
    assert.ok(ordem.indexOf("lume-ai-runtime") < ordem.indexOf("lume-authoring-runtime"));

    const boot = readFileSync("src/bootstrap.ts", "utf8");
    assert.equal(boot.includes("registerPlugin(AI_RUNTIME_MANIFEST"), true);
    assert.equal(boot.includes("readdir"), false);
  });
});
