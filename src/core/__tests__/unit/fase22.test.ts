import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ordemDeBoot } from "../../boot-order.ts";

describe("fase 22", () => {
  it("ordena pelo grafo e o saco de serviços não é obrigatório", () => {
    assert.deepEqual(
      ordemDeBoot([
        { name: "b", provides: [], requires: ["Cap"] },
        { name: "a", provides: ["Cap"], requires: [] },
      ]),
      ["a", "b"],
    );
    assert.deepEqual(
      ordemDeBoot([
        { name: "a", provides: [], requires: [] },
        { name: "b", provides: [], requires: [] },
      ]),
      ["a", "b"],
    );
    assert.throws(
      () => ordemDeBoot([
        { name: "a", provides: ["A"], requires: ["B"] },
        { name: "b", provides: ["B"], requires: ["A"] },
      ]),
      /ciclo/,
    );
    const boot = readFileSync("src/bootstrap.ts", "utf8");
    assert.match(boot, /ordemDeBoot\(/);
    assert.match(boot, /for \(const name of ordem\)/);
    assert.equal(boot.includes("ESPELHO_ACTIVO"), false);
    assert.match(boot, /servicos \? \{ services: getPlatformServices/);
  });
});
