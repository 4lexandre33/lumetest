import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fundar, rever } from "../../index.ts";

describe("fase 59", () => {
  it("separa o facto declarado da inferência e não mistura os dois", () => {
    const prosa = ["Ele entrou.", "resolvido: Ele = Pedro evidencia antecedent.subject confianca 0.91"].join("\n");
    const historia = fundar(prosa);
    const outra = fundar(prosa);
    const declarados = historia.transaccoes[0]!.registos.filter((item) => item.status === "DECLARED");
    const resolvidos = historia.transaccoes[0]!.registos.filter((item) => item.status === "RESOLVED");
    assert.equal(declarados.length, 1);
    assert.equal(declarados[0]!.value, "Ele entrou.");
    assert.equal(declarados[0]!.confidence, null);
    assert.equal(declarados[0]!.evidence?.kind, "texto");
    assert.equal(resolvidos.length, 1);
    assert.equal(resolvidos[0]!.value, "Pedro");
    assert.equal(resolvidos[0]!.status, "RESOLVED");
    assert.equal(resolvidos[0]!.evidence?.kind, "antecedent.subject");
    assert.equal(resolvidos[0]!.confidence, 0.91);
    assert.equal(resolvidos[0]!.provenance.source, `sentence:${resolvidos[0]!.sourceMap.sentenceId}`);
    assert.equal(declarados[0]!.id, outra.transaccoes[0]!.registos.find((item) => item.status === "DECLARED")?.id);
    assert.equal(declarados.some((item) => item.status !== "DECLARED"), false);

    const inferido = {
      ...resolvidos[0]!,
      id: "reg-inferido",
      status: "INFERRED" as const,
      value: "Ele entrou.",
      confidence: 0.4,
      sourceMap: declarados[0]!.sourceMap,
    };
    const junto = rever(historia, inferido);
    assert.equal(junto.recusado, true);
    assert.equal(junto.historia, historia);
    assert.equal(historia.transaccoes.length, 1);
    assert.equal(historia.transaccoes[0]!.registos.find((item) => item.value === "Ele entrou.")?.status, "DECLARED");
  });
});
