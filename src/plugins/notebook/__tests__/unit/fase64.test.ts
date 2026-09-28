import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileEntityFile } from "../../../narrative-engine/index.ts";
import { cadeiaDe, estadosDe } from "../../lib/pessoa.ts";

describe("fase 64", () => {
  it("distingue arco declarado, possibilidade marcada e o que fica por resolver, sem inventar evolução", () => {
    const compiled = compileEntityFile("@maria.{ name: 'Maria'; tags: agent, believes_fantasma; stats: hp=10; }\n@ana.{ name: 'Ana'; tags: agent; }");
    assert.equal(compiled.errors.length, 0);
    const prosa = [
      "### Sala",
      "",
      "pessoa: @maria estado=calma",
      "pessoa: @maria crenca=a porta fecha",
      "pessoa: @maria objectivo=sair",
      "pessoa: @maria pressao=a porta",
      "pessoa: @maria conflito=a chave",
      "pessoa: @maria decisao=entrar",
      "pessoa: @maria mudanca=saiu",
      "Maria entrou em crise. hp=0",
      "",
      "### Rua",
      "",
      "possibilidade: @maria a queda",
      "Maria saiu.",
      "",
      "### Porto",
      "",
      "arco: @ana a viagem",
      "Ana partiu.",
    ].join("\n");
    const cadeias = cadeiaDe(compiled.worldModel, prosa);
    const sala = cadeias.find((item) => item.personagem === "@maria" && item.cena.title === "Sala")!;
    assert.equal(sala.estado, "calma");
    assert.equal(sala.crenca, "a porta fecha");
    assert.equal(sala.objectivo, "sair");
    assert.equal(sala.pressao, "a porta");
    assert.equal(sala.conflito, "a chave");
    assert.equal(sala.decisao, "entrar");
    assert.equal(sala.mudanca, "saiu");
    assert.equal(sala.arco, null);
    assert.equal(sala.estatuto, "UNRESOLVED");
    assert.equal(sala.crenca.includes("fantasma"), false);

    const rua = cadeias.find((item) => item.cena.title === "Rua")!;
    assert.equal(rua.estatuto, "INFERRED POSSIBILITY");
    assert.equal(rua.arco, "a queda");
    assert.equal(rua.estado, null);

    const porto = cadeias.find((item) => item.personagem === "@ana")!;
    assert.equal(porto.estatuto, "DECLARED ARC");
    assert.equal(porto.arco, "a viagem");
    assert.equal(cadeias.some((item) => item.cena.title === "Porto" && item.personagem === "@maria"), false);
    assert.equal(estadosDe(compiled.worldModel, prosa).some((estado) => estado.crise != null), false);
  });
});
