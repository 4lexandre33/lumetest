import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { lerIr } from "../../lib/narrative-ir.ts";

describe("fase 30", () => {
  it("só preenche o que o texto ou a declaração trazem", () => {
    const plain = "João abriu a porta.";
    const vazio = lerIr(plain).acts[0]!;
    assert.equal(vazio.voz, null);
    assert.equal(vazio.tempo, null);
    assert.equal(vazio.modalidade, null);
    assert.deepEqual(vazio.papeis, []);
    assert.equal(vazio.evidencia, null);
    assert.equal("tags" in vazio, false);

    const citada = lerIr("«Entra», disse ela.");
    const fala = citada.acts[0]!;
    assert.equal(fala.voz?.valor, "direta");
    assert.equal(fala.voz?.evidencia.text, "«Entra»");
    assert.equal(fala.tempo, null);
    assert.equal(citada.prose, "«Entra», disse ela.");

    const prosa = ["tempo: passado", "modalidade: hipotese", "papel: agente=João", "", "João abriu a porta."].join("\n");
    const ir = lerIr(prosa);
    assert.equal(ir.version, "3.0");
    assert.equal(ir.prose, prosa);
    const acto = ir.acts.find((act) => act.text === "João abriu a porta.")!;
    assert.equal(acto.tempo?.valor, "passado");
    assert.equal(acto.tempo?.evidencia.text, "tempo: passado");
    assert.equal(acto.modalidade?.valor, "hipotese");
    assert.equal(acto.papeis[0]?.papel, "agente");
    assert.equal(acto.papeis[0]?.quem, "João");
    assert.equal(acto.voz, null);
    assert.equal(ir.acts.some((act) => act.text.startsWith("tempo:")), false);

    const marcado = lerIr("Ela saiu [tempo:futuro].");
    assert.equal(marcado.acts[0]!.tempo?.valor, "futuro");
    assert.equal(marcado.acts[0]!.tempo?.evidencia.text, "[tempo:futuro]");
    assert.equal(marcado.acts[0]!.text, "Ela saiu [tempo:futuro].");
    assert.equal(marcado.prose, "Ela saiu [tempo:futuro].");
  });
});
