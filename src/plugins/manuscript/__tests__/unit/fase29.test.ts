import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createCore } from "../../../../core/index.ts";
import { MANUSCRIPT_MANIFEST, createManuscriptPlugin, type ManuscriptService } from "../../index.ts";

describe("fase 29", () => {
  it("o manuscrito é capability e o caderno não calcula", async () => {
    assert.equal(existsSync("src/plugins/notebook/lib/manuscript.ts"), false);
    const core = createCore();
    core.registerPlugin(MANUSCRIPT_MANIFEST, createManuscriptPlugin);
    await core.activatePlugin("lume-manuscript");
    const prose = "### Sala\n\nJoão abriu a porta.\n";
    const manuscript = core.getService<ManuscriptService>("Manuscript").ler(prose);
    assert.equal(manuscript.prose, prose);
    assert.equal(manuscript.books[0]!.chapters[0]!.title, "Sala");
    assert.equal(manuscript.books[0]!.chapters[0]!.scenes[0]!.paragraphs[0]!.sentences[0]!.text, "João abriu a porta.");
    const again = core.getService<ManuscriptService>("Manuscript").ler(prose);
    assert.equal(again.books[0]!.id, manuscript.books[0]!.id);
    assert.equal(again.books[0]!.chapters[0]!.scenes[0]!.paragraphs[0]!.sentences[0]!.id, manuscript.books[0]!.chapters[0]!.scenes[0]!.paragraphs[0]!.sentences[0]!.id);
  });
});
