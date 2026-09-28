import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileEntityFile } from "../../../narrative-engine/index.ts";
import { grafoDe } from "../../index.ts";

describe("fase 61", () => {
  it("o grafo lê o IR e cada aresta traz a origem, sem inferir", () => {
    const compiled = compileEntityFile("@sala.{ tags: place; }\n@maria.{ name: 'Maria'; tags: agent; }\n@chave.{ name: 'Chave'; tags: object; }");
    assert.equal(compiled.errors.length, 0);
    const prosa = [
      "evento: festa",
      "instante: noite",
      "possui: @maria -> @chave",
      "sabe: @maria -> festa",
      "acredita: @maria -> noite",
      "parte: @chave -> festa",
      "ocorre: festa -> @sala",
      "depois: festa -> noite",
      "Maria segurou a chave.",
    ].join("\n");
    const grafo = grafoDe(compiled.worldModel, prosa);
    assert.equal(grafo.nos.find((no) => no.id === "@maria")?.tipo, "CHARACTER");
    assert.equal(grafo.nos.find((no) => no.id === "@sala")?.tipo, "PLACE");
    assert.equal(grafo.nos.some((no) => no.tipo === "EVENT" && no.id === "festa"), true);
    assert.equal(grafo.nos.some((no) => no.tipo === "TIME" && no.id === "noite"), true);
    assert.equal(grafo.nos.some((no) => no.tipo === "PROPOSITION" && no.evidence === "Maria segurou a chave."), true);
    for (const tipo of ["POSSESSES", "KNOWS", "BELIEVES", "PART_OF", "OCCURS_IN", "AFTER"] as const) {
      const aresta = grafo.arestas.find((item) => item.tipo === tipo);
      assert.ok(aresta, tipo);
      assert.equal(aresta.kind, tipo);
      assert.equal(aresta.status, "DECLARED");
      assert.equal(aresta.confidence, null);
      assert.equal(aresta.provenance.revision, 1);
      assert.equal(aresta.evidence, aresta.evidencia);
    }
    const solto = grafoDe(compiled.worldModel, "Maria saiu porque a porta abriu.");
    assert.equal(solto.arestas.some((aresta) => aresta.status === "INFERRED" || aresta.tipo === "CAUSE"), false);
  });
});
