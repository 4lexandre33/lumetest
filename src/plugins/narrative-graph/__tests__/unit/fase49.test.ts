import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { compileEntityFile } from "../../../narrative-engine/index.ts";
import { grafoDe } from "../../index.ts";

function textos(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "__tests__") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) textos(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(readFileSync(path, "utf8"));
  }
  return out;
}

describe("fase 49", () => {
  it("evento e objecto só entram por declaração e porque não cria aresta", () => {
    const compiled = compileEntityFile("@maria.{ name: 'Maria'; tags: agent; }\n@chave.{ name: 'Chave'; tags: object; }");
    assert.equal(compiled.errors.length, 0);
    const solto = grafoDe(compiled.worldModel, "Maria saiu porque a porta abriu.");
    assert.equal(solto.arestas.some((aresta) => aresta.tipo === "CAUSE"), false);
    assert.equal(solto.nos.some((no) => no.tipo === "EVENT" || no.tipo === "OBJECT"), false);
    assert.equal(solto.nos.find((no) => no.id === "@chave")?.tipo, "ENTITY");

    const prosa = "evento: festa\nobjecto: @chave\nMaria saiu porque a porta abriu.";
    const grafo = grafoDe(compiled.worldModel, prosa);
    assert.equal(grafo.nos.some((no) => no.id === "festa" && no.tipo === "EVENT"), true);
    assert.equal(grafo.nos.find((no) => no.id === "@chave")?.tipo, "OBJECT");
    assert.equal(grafo.arestas.some((aresta) => aresta.evidencia.includes("porque")), false);
    assert.equal(textos("src/plugins/spatial").some((text) => text.includes("narrative-graph")), false);
  });
});
