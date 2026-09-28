import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contextoDaFrase } from "../../lib/sentence-context.ts";

const entities = [
  "@maria.{ name: 'Maria'; tags: agent, knows_porta; }",
  "@ana.{ name: 'Ana'; tags: agent, knows_segredo; }",
  "@sala.{ name: 'Sala'; tags: place; }",
].join("\n");

const prose = ["### Sala", "", "Maria entrou.", "", "### Rua", "", "Ana esperou. O segredo ficou na rua."].join("\n");

describe("fase 8", () => {
  it("o contexto da frase traz quem está, o que sabe, a cena e a linha, sem o resto do livro e sem modelo", () => {
    const at = prose.indexOf("Maria");
    const ctx = contextoDaFrase(prose, at, entities);
    assert.ok(ctx);
    assert.equal(ctx!.text, "Maria entrou.");
    assert.equal(ctx!.cena.title, "Sala");
    assert.equal(ctx!.cena.texto.includes("Maria entrou."), true);
    assert.equal(ctx!.cena.texto.includes("Ana esperou"), false);
    assert.deepEqual(ctx!.presentes, ["@maria"]);
    assert.deepEqual(ctx!.sabem, [{ quem: "@maria", factos: ["porta"] }]);
    assert.equal(ctx!.tempo.linha, 3);
    assert.equal("modelo" in ctx!, false);
    const packed = JSON.stringify(ctx);
    assert.equal(packed.includes("Ana esperou"), false);
    assert.equal(packed.includes("segredo"), false);
    assert.equal(packed.includes(prose), false);

    const rua = contextoDaFrase(prose, prose.indexOf("Ana"), entities);
    assert.equal(rua?.cena.title, "Rua");
    assert.deepEqual(rua?.presentes, ["@ana"]);
    assert.deepEqual(rua?.sabem, [{ quem: "@ana", factos: ["segredo"] }]);
    assert.equal(rua?.cena.texto.includes("Maria entrou"), false);
    assert.equal(contextoDaFrase(prose, 0, entities), null);
  });
});
