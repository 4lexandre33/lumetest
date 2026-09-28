import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fraseNoOffset, lerManuscrito } from "../../../manuscript/index.ts";
import { contextoDaFrase } from "../../index.ts";

const entities = [
  "@maria.{ name: 'Maria'; tags: agent, knows_porta; }",
  "@ana.{ name: 'Ana'; tags: agent, knows_segredo; }",
  "@sala.{ name: 'Sala'; tags: place; }",
].join("\n");

const prose = ["### Sala", "", "Maria entrou.", "", "### Rua", "", "Ana esperou. O segredo ficou na rua."].join("\n");

describe("fase 50", () => {
  it("monta o contexto pelo índice, pelo mundo até à linha e pelo que se declara saber", () => {
    const at = prose.indexOf("Maria");
    const ctx = contextoDaFrase(prose, at, entities);
    const frase = fraseNoOffset(lerManuscrito(prose), at);
    assert.equal(ctx?.sentenceId, frase?.sentence.id);
    assert.equal(ctx?.text, "Maria entrou.");
    assert.deepEqual(ctx?.sabem, [{ quem: "@maria", factos: ["porta"] }]);
    assert.equal(JSON.stringify(ctx).includes("Ana esperou"), false);
    assert.equal(JSON.stringify(ctx).includes("segredo"), false);
    assert.equal(JSON.stringify(ctx).includes(prose), false);
    const fonte = readFileSync("src/plugins/sentence-context/lib/contexto.ts", "utf8");
    assert.equal(fonte.includes("fraseNoOffset"), true);
    assert.equal(fonte.includes("worldAte"), true);
    assert.equal(fonte.includes("factsFor"), true);
    assert.equal(fonte.includes("referenciasDe(prose"), false);
    assert.equal(fonte.includes("ai-runtime"), false);
  });
});
