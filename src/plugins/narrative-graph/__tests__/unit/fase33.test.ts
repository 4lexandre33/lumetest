import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileEntityFile } from "../../../narrative-engine/index.ts";
import { contextoDaFrase } from "../../../sentence-context/index.ts";
import { cronologiaDe } from "../../index.ts";

describe("fase 33", () => {
  it("põe duração, simultâneo e analepse só por marca, e a causa vem do grafo", () => {
    const compiled = compileEntityFile("@rua.{ tags: place; }\n@sala.{ tags: place; }\n@maria.{ name: 'Maria'; tags: agent; }");
    assert.equal(compiled.errors.length, 0, compiled.errors.map((issue) => issue.message).join("\n"));
    const prosa = [
      "### Sala",
      "",
      "tempo: noite",
      "duracao: 2h",
      "duracao: @rua -> @sala 1h",
      "simultaneo: @rua = @sala",
      "analepse: @sala",
      "causa: @maria -> @sala porque convite",
      "Maria entrou ao mesmo tempo, antes, porque estava frio.",
    ].join("\n");
    const cronologia = cronologiaDe(compiled.worldModel, prosa);
    assert.deepEqual(cronologia.duracao.map((marca) => marca.valor), ["2h", "1h"]);
    assert.equal(cronologia.duracao[1]!.de, "@rua");
    assert.equal(cronologia.duracao[1]!.para, "@sala");
    assert.deepEqual(cronologia.simultaneo, [{ de: "@rua", para: "@sala", evidencia: "simultaneo: @rua = @sala" }]);
    assert.equal(cronologia.analepse[0]!.no, "@sala");
    assert.equal(cronologia.causas.length, 1);
    assert.equal(cronologia.causas[0]!.de, "@maria");
    assert.equal(cronologia.causas.some((aresta) => aresta.evidencia.includes("frio")), false);
    const frase = prosa.indexOf("Maria");
    const ctx = contextoDaFrase(prosa, frase, "@maria.{ name: 'Maria'; tags: agent; }", 3);
    assert.equal(ctx?.tempos.discurso.linha, ctx?.tempo.linha);
    assert.equal(ctx?.tempos.historia.marca, "noite");
    assert.equal(ctx?.tempos.simulacao.passo, 3);
    const semMarca = cronologiaDe(compiled.worldModel, "Maria entrou ao mesmo tempo, antes, porque estava frio.");
    assert.deepEqual(semMarca.duracao, []);
    assert.deepEqual(semMarca.simultaneo, []);
    assert.deepEqual(semMarca.analepse, []);
    assert.deepEqual(semMarca.causas, []);
  });
});
