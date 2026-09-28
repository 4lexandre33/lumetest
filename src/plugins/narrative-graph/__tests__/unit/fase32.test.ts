import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCore } from "../../../../core/index.ts";
import { compileEntityFile } from "../../../narrative-engine/index.ts";
import { linksOf } from "../../../spatial/index.ts";
import { NARRATIVE_GRAPH_MANIFEST, createNarrativeGraphPlugin, grafoDe, type NarrativeGraphService } from "../../index.ts";

describe("fase 32", () => {
  it("só liga o que foi declarado ou resolvido, e o lugar é uma aresta", async () => {
    const core = createCore();
    core.registerPlugin(NARRATIVE_GRAPH_MANIFEST, createNarrativeGraphPlugin);
    await core.activatePlugin("lume-narrative-graph");
    const compiled = compileEntityFile([
      "@rua.{ tags: place; links: exit_n=@sala; }",
      "@sala.{ tags: place; }",
      "@maria.{ name: 'Maria'; tags: agent; links: current_location=@rua; }",
    ].join("\n"));
    assert.equal(compiled.errors.length, 0, compiled.errors.map((issue) => issue.message).join("\n"));
    const prosa = ["Maria entrou porque estava tarde.", "causa: @maria -> @rua porque convite", "tempo: @rua -> @sala", "", "### Sala", "", "Maria parou."].join("\n");
    const grafo = core.getService<NarrativeGraphService>("NarrativeGraph").grafoDe(compiled.worldModel, prosa);
    assert.equal(grafo.arestas.some((aresta) => aresta.tipo === "CAUSE" && aresta.evidencia === "estava tarde"), false);
    assert.equal(grafo.arestas.some((aresta) => aresta.tipo === "CAUSE" && aresta.de === "@maria" && aresta.para === "@rua"), true);
    assert.equal(grafo.arestas.some((aresta) => aresta.tipo === "BEFORE" && aresta.de === "@rua" && aresta.para === "@sala"), true);
    assert.equal(grafo.arestas.some((aresta) => aresta.tipo === "RELATES_TO" && aresta.de === "@maria" && aresta.para === "@rua"), true);
    assert.equal(grafo.nos.some((no) => no.tipo === "SCENE"), true);
    const lugares = grafo.arestas.filter((aresta) => aresta.tipo === "LOCATED_AT");
    assert.equal(lugares.length, linksOf(compiled.worldModel).length);
    assert.equal(lugares.some((aresta) => aresta.de === "@rua" && aresta.para === "@sala"), true);
    const mudo = grafoDe(compiled.worldModel, "Maria olhou para a sala.");
    assert.equal(mudo.arestas.some((aresta) => aresta.tipo === "CAUSE" || aresta.tipo === "BEFORE"), false);
    assert.equal(prosa.includes("porque estava tarde"), true);
  });
});
