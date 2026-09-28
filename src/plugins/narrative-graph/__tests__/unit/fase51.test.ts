import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileEntityFile } from "../../../narrative-engine/index.ts";
import { cronologiaDe } from "../../index.ts";

describe("fase 51", () => {
  it("antes numa frase comum não muda a ordem nem cria aresta", () => {
    const compiled = compileEntityFile("@maria.{ name: 'Maria'; tags: agent; }\n@ana.{ name: 'Ana'; tags: agent; }");
    assert.equal(compiled.errors.length, 0);
    const comum = ["### Sala", "", "Maria entrou.", "", "### Rua", "", "Ana esperou."].join("\n");
    const comAntes = ["### Sala", "", "Maria entrou antes.", "", "### Rua", "", "Ana esperou antes."].join("\n");
    const ordem = cronologiaDe(compiled.worldModel, comum);
    const outra = cronologiaDe(compiled.worldModel, comAntes);
    assert.equal(ordem.ordem.length, 2);
    assert.deepEqual(ordem.ordem, outra.ordem);
    assert.deepEqual(ordem.simultaneo, []);
    assert.deepEqual(outra.simultaneo, []);
    assert.deepEqual(outra.duracao, []);
    assert.deepEqual(outra.analepse, []);
    assert.deepEqual(outra.causas, []);
    assert.equal(outra.grafo.arestas.some((aresta) => aresta.evidencia.toLowerCase().includes("antes")), false);
    assert.equal(ordem.grafo.arestas.length, outra.grafo.arestas.length);
  });
});
