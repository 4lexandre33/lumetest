import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileEntityFile } from "../../../narrative-engine/index.ts";
import { lerContinuidade } from "../../lib/continuidade.ts";
import { estadosDe } from "../../lib/pessoa.ts";

function world(source: string) {
  const compiled = compileEntityFile(source);
  assert.equal(compiled.errors.length, 0, compiled.errors.map((issue) => issue.message).join("\n"));
  return compiled.worldModel;
}

describe("fase 34", () => {
  it("o estado da pessoa é por cena e só o que foi declarado", () => {
    const pessoas = world("@maria.{ name: 'Maria'; tags: agent; stats: hp=0; }\n@ana.{ name: 'Ana'; tags: agent; }");
    const prosa = [
      "### Sala",
      "",
      "pessoa: @maria inicio=calma",
      "pessoa: @maria pressao=a porta",
      "pessoa: @maria crise=a chave",
      "pessoa: @maria final=saiu",
      "Maria entrou.",
      "",
      "### Rua",
      "",
      "Maria saiu. O hp dela acabou.",
    ].join("\n");
    const estados = estadosDe(pessoas, prosa);
    assert.equal(estados.length, 1);
    assert.equal(estados[0]!.cena.title, "Sala");
    assert.equal(estados[0]!.inicio, "calma");
    assert.equal(estados[0]!.pressao, "a porta");
    assert.equal(estados[0]!.crise, "a chave");
    assert.equal(estados[0]!.final, "saiu");
    assert.equal(estados.some((estado) => estado.cena.title === "Rua"), false);
    assert.deepEqual(estadosDe(pessoas, "### Sala\n\nMaria entrou em crise."), []);
    const duas = world("@maria.{ name: 'Maria'; tags: agent; }\n@outra.{ name: 'Maria'; tags: agent; }");
    assert.deepEqual(estadosDe(duas, "pessoa: Maria inicio=calma"), []);
    assert.deepEqual(lerContinuidade("arco: A queda").arcos.map((arco) => arco.nome), ["A queda"]);
    assert.equal(prosa.includes("hp dela acabou"), true);
  });
});
