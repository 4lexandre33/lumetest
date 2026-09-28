import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { lerIr } from "../../lib/narrative-ir.ts";

describe("fase 60", () => {
  it("o IR 3.0 é o contrato e não inventa o que a frase não traz", () => {
    const nu = lerIr("Ele entrou.").acts.find((act) => act.text === "Ele entrou.")!;
    assert.equal(nu.version, "3.0");
    assert.equal(nu.proposicao?.valor, "Ele entrou.");
    assert.equal(nu.proposicao?.status, "DECLARED");
    assert.equal(nu.proposicao?.confidence, null);
    assert.equal(nu.predicado, null);
    assert.equal(nu.entidade, null);
    assert.equal(nu.referencia, null);
    assert.equal(nu.aspecto, null);
    assert.equal(nu.negacao, null);
    assert.equal(nu.focalizacao, null);
    assert.equal(nu.discurso, null);
    assert.equal(nu.confidence, null);
    assert.match(nu.provenance.source, /^sentence:/);
    assert.equal(nu.provenance.revision, 1);

    const prosa = [
      "predicado: entrou",
      "entidade: Pedro",
      "resolvido: Ele = Pedro evidencia antecedent.subject confianca 0.91",
      "aspecto: perfectivo",
      "negacao: nao",
      "focalizacao: Pedro",
      "discurso: narrador",
      "Ele entrou.",
    ].join("\n");
    const acto = lerIr(prosa).acts.find((act) => act.text === "Ele entrou.")!;
    assert.equal(acto.predicado?.valor, "entrou");
    assert.equal(acto.predicado?.status, "DECLARED");
    assert.equal(acto.entidade?.valor, "Pedro");
    assert.equal(acto.referencia?.alvo, "Pedro");
    assert.equal(acto.referencia?.token, "Ele");
    assert.equal(acto.referencia?.status, "RESOLVED");
    assert.equal(acto.referencia?.evidencia.text, "antecedent.subject");
    assert.equal(acto.referencia?.confidence, 0.91);
    assert.equal(acto.aspecto?.valor, "perfectivo");
    assert.equal(acto.negacao?.valor, "nao");
    assert.equal(acto.focalizacao?.valor, "Pedro");
    assert.equal(acto.discurso?.valor, "narrador");
    assert.equal(acto.confidence, 0.91);
    assert.equal(acto.provenance.source, `sentence:${acto.sentenceId}`);
    assert.equal(lerIr(prosa).acts.some((act) => act.text.startsWith("resolvido:")), false);
  });
});
