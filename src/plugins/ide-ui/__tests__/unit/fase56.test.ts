import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SALAS, ferramentasDaSala } from "../../lib/superficie.ts";

describe("fase 56", () => {
  it("as salas pedem a autoria e o play não está no menu de escritor", () => {
    assert.equal(SALAS.includes("escrever"), true);
    assert.equal((SALAS as readonly string[]).includes("play"), false);
    for (const sala of SALAS) assert.deepEqual(ferramentasDaSala(sala), []);
    const app = readFileSync("src/plugins/ide-ui/lib/components/IdeApp.tsx", "utf8");
    const painel = readFileSync("src/plugins/ide-ui/lib/components/SalaPainel.tsx", "utf8");
    assert.equal(app.includes("interactWith"), false);
    assert.equal(painel.includes("interactWith"), false);
    assert.equal(painel.includes("setNotebooks"), false);
    assert.equal(painel.includes("lerFrase"), true);
    assert.equal(painel.includes("diagnosticoDe"), false);
    assert.equal(painel.includes("lerManuscrito"), false);
    assert.equal(painel.includes("O texto não muda."), true);
  });
});
