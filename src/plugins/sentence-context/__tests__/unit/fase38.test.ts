import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createCore } from "../../../../core/index.ts";
import { SENTENCE_CONTEXT_MANIFEST, createSentenceContextPlugin, type SentenceContextService } from "../../index.ts";
import { MANUSCRIPT_MANIFEST, createManuscriptPlugin } from "../../../manuscript/index.ts";

describe("fase 38", () => {
  it("o contexto é capability e não manda o livro", async () => {
    assert.equal(existsSync("src/plugins/notebook/lib/sentence-context.ts"), false);
    const core = createCore();
    core.registerPlugin(MANUSCRIPT_MANIFEST, createManuscriptPlugin);
    core.registerPlugin(SENTENCE_CONTEXT_MANIFEST, createSentenceContextPlugin);
    await core.activatePlugin("lume-manuscript");
    await core.activatePlugin("lume-sentence-context");
    const prosa = "### Sala\n\nMaria entrou.\n\n### Rua\n\nAna esperou.";
    const ctx = core.getService<SentenceContextService>("SentenceContext").daFrase(prosa, prosa.indexOf("Maria"), "@maria.{ name: 'Maria'; tags: agent; }");
    assert.equal(ctx?.text, "Maria entrou.");
    assert.equal(ctx?.cena.texto.includes("Ana esperou"), false);
    assert.equal(JSON.stringify(ctx).includes(prosa), false);
  });
});
