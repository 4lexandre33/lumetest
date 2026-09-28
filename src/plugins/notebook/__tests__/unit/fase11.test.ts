import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileEntityFile } from "../../../narrative-engine/index.ts";
import { believes, factsFor, ignorantOf, ignores, knows } from "../../../knowledge/index.ts";
import { contextoDaFrase } from "../../../sentence-context/index.ts";
import { causasDeclaradas } from "../../lib/causa.ts";

const entities = "@maria.{ name: 'Maria'; tags: agent, knows_porta, believes_fantasma, ignores_segredo; }";

const prose = [
  "### Sala",
  "",
  "tempo: noite",
  "causa: @tocha -> @sala porque acendeu",
  "Maria entrou. Era noite porque estava frio.",
  "",
  "### Rua",
  "",
  "tempo: dia",
  "causa: @ana -> @rua porque saiu",
  "Ana esperou.",
].join("\n");

describe("fase 11", () => {
  it("separa os três tempos, crença e ignorância, e não inventa causa", () => {
    const ctx = contextoDaFrase(prose, prose.indexOf("Maria"), entities, 9);
    assert.ok(ctx);
    assert.equal(ctx!.tempo.linha, ctx!.tempos.discurso.linha);
    assert.notEqual(ctx!.tempos.discurso.linha, ctx!.tempos.simulacao.passo);
    assert.equal(ctx!.tempos.simulacao.passo, 9);
    assert.equal(ctx!.tempos.historia.marca, "noite");
    assert.equal(ctx!.cena.texto.includes("tempo: dia"), false);
    assert.deepEqual(ctx!.sabem, [{ quem: "@maria", factos: ["porta"] }]);
    assert.deepEqual(ctx!.creem, [{ quem: "@maria", factos: ["fantasma"] }]);
    assert.deepEqual(ctx!.ignoram, [{ quem: "@maria", factos: ["segredo"] }]);
    assert.deepEqual(ctx!.causas, [{ de: "@tocha", para: "@sala", porque: "acendeu" }]);
    assert.equal(JSON.stringify(ctx).includes("porque saiu"), false);

    const world = compileEntityFile(entities).worldModel;
    assert.equal(knows(world, "@maria", "porta"), true);
    assert.equal(knows(world, "@maria", "fantasma"), false);
    assert.equal(believes(world, "@maria", "fantasma"), true);
    assert.equal(believes(world, "@maria", "porta"), false);
    assert.equal(ignores(world, "@maria", "segredo"), true);
    assert.equal(ignores(world, "@maria", "porta"), false);
    assert.deepEqual(factsFor(world, "@maria"), ["porta"]);
    assert.deepEqual(ignorantOf(world, "@maria"), ["segredo"]);

    const frase = "Era noite porque estava frio.";
    assert.deepEqual(causasDeclaradas(frase), []);
    const semMarca = contextoDaFrase("### Sala\n\nMaria entrou.", "### Sala\n\nMaria entrou.".indexOf("Maria"), entities, 1);
    assert.equal(semMarca?.tempos.historia.marca, null);
    assert.deepEqual(semMarca?.causas, []);
  });
});
