import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { lerIr, mapaDaIr } from "../../lib/narrative-ir.ts";

describe("fase 6", () => {
  it("a IR tem versão e mapa até ao texto, e não é mutação nem gaveta", () => {
    const prose = [
      "CADERNO: Casa",
      "",
      "## Parte",
      "",
      "### Sala",
      "",
      "João abriu a porta. O lugar estava silencioso.",
      "",
      "«Entra», disse ela.",
      "",
      "Maria pensou na chave.",
    ].join("\n");
    const ir = lerIr(prose);
    assert.equal(ir.prose, prose);
    assert.equal(ir.version, "1.0");
    assert.equal(ir.major, 1);
    assert.equal(ir.minor, 0);
    assert.deepEqual(ir.acts.map((act) => act.operation), [
      "structure",
      "structure",
      "structure",
      "represent",
      "describe",
      "enunciate",
      "interiorize",
    ]);
    for (const act of ir.acts) {
      assert.equal(act.version, "1.0");
      assert.equal("do" in act, false);
      assert.equal("tags" in act, false);
      assert.equal("stats" in act, false);
      assert.equal("flags" in act, false);
    }
    const again = lerIr(prose);
    assert.deepEqual(again.acts.map((act) => act.id), ir.acts.map((act) => act.id));

    const map = mapaDaIr(ir);
    const door = ir.acts.find((act) => act.operation === "represent")!;
    const source = map.actToSource(door.id);
    assert.equal(source?.text, door.text);
    assert.equal(prose.slice(source!.start, source!.end), door.text);
    assert.deepEqual(map.sourceToActs(door.span.start).map((act) => act.id), [door.id]);
    assert.deepEqual(map.actToSource("acto-nenhum"), null);
    assert.equal(prose, ir.prose);
  });
});
