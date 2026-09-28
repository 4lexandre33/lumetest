import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { lerContinuidade } from "../../lib/continuidade.ts";

describe("fase 36", () => {
  it("setup, payoff e restrição avisam, e fica assim cala", () => {
    const prosa = ["setup: espada", "Maria armou a espada.", "payoff: espada"].join("\n");
    const pago = lerContinuidade(prosa);
    assert.deepEqual(pago.setups.map((marco) => marco.nome), ["espada"]);
    assert.deepEqual(pago.payoffs.map((marco) => marco.nome), ["espada"]);
    assert.deepEqual(pago.avisos, []);
    assert.equal(prosa, "setup: espada\nMaria armou a espada.\npayoff: espada");

    const aberto = lerContinuidade("setup: espada\nMaria armou a espada.");
    assert.equal(aberto.avisos[0]!.id, "setup:espada:sem-payoff");
    assert.equal(aberto.payoffs.length, 0);

    const cedo = lerContinuidade("payoff: espada");
    assert.equal(cedo.avisos[0]!.id, "payoff:espada:sem-setup");

    const calado = lerContinuidade("setup: espada\nfica assim: setup:espada:sem-payoff\n");
    assert.deepEqual(calado.avisos, []);
    assert.deepEqual(calado.calados, ["setup:espada:sem-payoff"]);

    const limite = lerContinuidade("restricao: sem morte\nquebra: sem morte\n");
    assert.equal(limite.restricoes[0]!.nome, "sem morte");
    assert.equal(limite.avisos[0]!.id, "restricao:sem morte:quebra");
    assert.equal(lerContinuidade("restricao: sem morte\nMaria morreu.").avisos.length, 0);
    const solta = lerContinuidade("quebra: sem morte\nfica assim: quebra:sem morte:sem-restricao\n");
    assert.deepEqual(solta.avisos, []);
    assert.deepEqual(lerContinuidade("Maria armou a espada e pagou depois.").setups, []);
  });
});
