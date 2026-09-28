import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { lerManuscrito } from "../../../manuscript/index.ts";

describe("fase 5", () => {
  it("lê livro, capítulo, cena, parágrafo e sentença sem reescrever a prosa", () => {
    const prose = [
      "CADERNO: Casa",
      "",
      "## Parte",
      "",
      "### Sala",
      "",
      "João abriu a porta. O lugar estava silencioso.",
      "",
      "Sobre a mesa havia uma chave.",
      "",
      "## regras",
      "ON: @porta",
      "## /regras",
      "",
      "> ent.list",
    ].join("\n");
    const manuscript = lerManuscrito(prose);
    assert.equal(manuscript.prose, prose);
    assert.equal(manuscript.books.length, 1);
    assert.equal(manuscript.books[0]!.title, "Casa");
    assert.equal(manuscript.books[0]!.chapters.length, 1);
    const chapter = manuscript.books[0]!.chapters[0]!;
    assert.equal(chapter.title, "Parte");
    assert.equal(chapter.scenes.length, 1);
    const scene = chapter.scenes[0]!;
    assert.equal(scene.title, "Sala");
    assert.equal(scene.paragraphs.length, 2);
    assert.deepEqual(scene.paragraphs[0]!.sentences.map((sentence) => sentence.text), [
      "João abriu a porta.",
      "O lugar estava silencioso.",
    ]);
    assert.equal(scene.paragraphs[1]!.sentences[0]!.text, "Sobre a mesa havia uma chave.");
    assert.equal(manuscript.prose.includes("ON: @porta"), true);

    const again = lerManuscrito(prose);
    assert.equal(again.books[0]!.id, manuscript.books[0]!.id);
    assert.equal(again.books[0]!.chapters[0]!.id, chapter.id);
    assert.equal(again.books[0]!.chapters[0]!.scenes[0]!.paragraphs[0]!.sentences[0]!.id, scene.paragraphs[0]!.sentences[0]!.id);

    const edited = prose.replace("estava silencioso.", "ficou em silêncio.");
    const next = lerManuscrito(edited);
    const nextSentences = next.books[0]!.chapters[0]!.scenes[0]!.paragraphs[0]!.sentences;
    assert.equal(next.prose, edited);
    assert.equal(nextSentences[0]!.id, scene.paragraphs[0]!.sentences[0]!.id);
    assert.notEqual(nextSentences[1]!.id, scene.paragraphs[0]!.sentences[1]!.id);
    assert.equal(prose.includes("estava silencioso."), true);
  });

  it("um ### sozinho é capítulo com uma cena, e o id repete-se só quando o texto é o mesmo", () => {
    const prose = "### Sala\n\nOlá.\n\nOlá.\n";
    const manuscript = lerManuscrito(prose);
    assert.equal(manuscript.prose, prose);
    const chapter = manuscript.books[0]!.chapters[0]!;
    assert.equal(chapter.title, "Sala");
    assert.equal(chapter.scenes.length, 1);
    assert.equal(chapter.scenes[0]!.title, "Sala");
    assert.notEqual(chapter.id, chapter.scenes[0]!.id);
    const sentences = chapter.scenes[0]!.paragraphs.map((paragraph) => paragraph.sentences[0]!.id);
    assert.equal(sentences[0] !== sentences[1], true);
    assert.match(sentences[1]!, /-2$/);
  });
});
