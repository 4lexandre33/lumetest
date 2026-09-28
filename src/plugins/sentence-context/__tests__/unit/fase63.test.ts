import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contextoDaFrase } from "../../index.ts";

const entities = [
  "@joao.{ name: 'João'; tags: agent, knows_plano, ignores_segredo; }",
  "@pedro.{ name: 'Pedro'; tags: agent, knows_plano; }",
  "@espada.{ name: 'espada'; tags: object; }",
  "@ana.{ name: 'Ana'; tags: agent, knows_segredo; }",
].join("\n");

const prose = [
  "### Sala",
  "",
  "hora: 18:30",
  "evento: chegada",
  "causa: @joao -> @espada porque segurou",
  "João segurou a espada.",
  "",
  "### Rua",
  "",
  "evento: fuga",
  "Ana esperou.",
].join("\n");

describe("fase 63", () => {
  it("responde o contexto exacto da frase e não entrega o livro", () => {
    const ctx = contextoDaFrase(prose, prose.indexOf("João"), entities);
    assert.ok(ctx);
    assert.equal(ctx!.exacto.frase, ctx!.sentenceId);
    assert.equal(ctx!.exacto.cena, "Sala");
    assert.equal(ctx!.exacto.tempo, "18:30");
    assert.deepEqual(ctx!.exacto.presentes, ["@espada", "@joao"]);
    assert.deepEqual(ctx!.exacto.conhecimento, [{ quem: "@joao", sabe: ["plano"], ignora: ["segredo"] }]);
    assert.deepEqual(ctx!.exacto.eventos, ["chegada"]);
    assert.deepEqual(ctx!.exacto.causas, [{ de: "@joao", para: "@espada", porque: "segurou" }]);
    assert.equal(ctx!.exacto.grafo.nos.includes("chegada"), true);
    assert.equal(ctx!.exacto.grafo.nos.includes("@ana"), false);
    assert.equal(ctx!.exacto.grafo.nos.includes("fuga"), false);
    const packed = JSON.stringify(ctx);
    assert.equal(packed.includes("Ana esperou"), false);
    assert.equal(packed.includes("fuga"), false);
    assert.equal(packed.includes(prose), false);
    assert.equal(ctx!.presentes.includes("@pedro"), false);
  });
});
