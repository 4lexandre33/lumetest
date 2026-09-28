import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { intencoesDe } from "../../lib/intencao.ts";

describe("fase 35", () => {
  it("compara a intenção declarada com a IR e não executa intent", () => {
    const prosa = [
      "### Sala",
      "",
      "intencao: representar",
      "intencao: enunciar",
      "João abriu a porta.",
      "intent.action.interact.take.@tocha",
      "",
      "### Rua",
      "",
      "Ana saiu.",
    ].join("\n");
    const lidas = intencoesDe(prosa);
    assert.equal(lidas.length, 1);
    assert.equal(lidas[0]!.cena.title, "Sala");
    assert.deepEqual(lidas[0]!.devia, ["represent", "enunciate"]);
    assert.deepEqual(lidas[0]!.mostra, ["represent"]);
    assert.deepEqual(lidas[0]!.cumpre, ["represent"]);
    assert.deepEqual(lidas[0]!.falta, ["enunciate"]);
    assert.equal(JSON.stringify(lidas).includes("intent."), false);
    assert.deepEqual(intencoesDe("### Rua\n\nAna saiu."), []);
    const fonte = readFileSync("src/plugins/notebook/lib/intencao.ts", "utf8");
    assert.equal(fonte.includes("executeIntent"), false);
    assert.equal(fonte.includes("intent."), false);
    assert.equal(prosa.includes("intent.action.interact.take.@tocha"), true);
  });
});
