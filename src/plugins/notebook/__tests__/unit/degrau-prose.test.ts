import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { inRegrasFence, proseDegrau } from "../../lib/degrau-prose.ts";

describe("E3 prosa", () => {
  it("o ponto da prosa lista um nível, e a frase só no seguinte", () => {
    const phrases = [
      { owner: "@guarda", key: "fala", insert: "Alto lá." },
      { owner: "pegar", key: "pegar", insert: "A mão fecha." },
    ];
    const root = proseDegrau(".\n", 1, ["@guarda", "@escudeiro"], phrases, [
      { id: "lei", title: "combate", narrative: "O ferro canta.", dos: [] },
    ]);
    assert.ok(root);
    assert.ok(root.items.some((item) => item.label === "@guarda" && item.detail === "entidade"));
    assert.ok(root.items.some((item) => item.label === "frases"));
    assert.ok(root.items.some((item) => item.label === "combate"));
    assert.equal(root.items.some((item) => item.insert === "Alto lá."), false);

    const owners = proseDegrau("frases.", 7, ["@guarda"], phrases);
    assert.ok(owners?.items.some((item) => item.label === "@guarda"));
    assert.equal(owners?.items.some((item) => item.insert === "Alto lá."), false);

    const leaf = proseDegrau("frases.@guarda.", "frases.@guarda.".length, ["@guarda"], phrases);
    assert.deepEqual(leaf?.items.map((item) => item.insert), ["Alto lá."]);

    const sentence = proseDegrau("Ele entrou.", "Ele entrou.".length, ["@guarda"], phrases);
    assert.equal(sentence, null);

    const book = "## regras\non: .\n## /regras\n";
    assert.equal(inRegrasFence(book, book.indexOf("on: .") + 5), true);
    assert.equal(inRegrasFence(book, book.length), false);
  });
});
