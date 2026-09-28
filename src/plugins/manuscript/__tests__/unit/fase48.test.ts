import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fraseNoOffset, frasePorId, lerManuscrito } from "../../index.ts";
import { contextoDaFrase } from "../../../sentence-context/index.ts";
import { lerIr } from "../../../notebook/lib/narrative-ir.ts";

describe("fase 48", () => {
  it("o mesmo offset não recria ids e a outra frase não entra no contexto", () => {
    const prosa = "### Sala\n\nMaria entrou.\n\n### Rua\n\nAna esperou.";
    const primeiro = lerManuscrito(prosa);
    const segundo = lerManuscrito(prosa);
    assert.equal(primeiro, segundo);
    const offset = prosa.indexOf("Maria");
    const frase = fraseNoOffset(primeiro, offset);
    const outra = fraseNoOffset(segundo, offset);
    assert.equal(frase?.sentence.id, outra?.sentence.id);
    assert.equal(frasePorId(primeiro, frase!.sentence.id)?.scene.title, "Sala");
    assert.equal(frasePorId(primeiro, frase!.sentence.id)?.sentence.text, "Maria entrou.");
    const ctx = contextoDaFrase(prosa, offset, "@maria.{ name: 'Maria'; tags: agent; }");
    const deNovo = contextoDaFrase(prosa, offset, "@maria.{ name: 'Maria'; tags: agent; }");
    assert.equal(ctx?.sentenceId, deNovo?.sentenceId);
    assert.equal(ctx?.text, "Maria entrou.");
    assert.equal(ctx?.cena.texto.includes("Ana esperou"), false);
    assert.equal(lerIr(prosa).version, "3.0");
    const acto = lerIr(prosa).acts.find((act) => act.text === "Maria entrou.")!;
    assert.equal(acto.focalizacao, null);
    assert.equal(acto.aspecto, null);
    assert.equal(acto.negacao, null);
  });
});
