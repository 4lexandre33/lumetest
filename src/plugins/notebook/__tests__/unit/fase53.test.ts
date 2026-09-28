import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { diagnosticoDe } from "../../lib/diagnostico.ts";
import { lerContinuidade } from "../../lib/continuidade.ts";

describe("fase 53", () => {
  it("o aviso não vira mutação nem linha de do", () => {
    const prosa = "payoff: espada";
    const lido = lerContinuidade(prosa);
    assert.equal(lido.avisos[0]!.id, "payoff:espada:sem-setup");
    assert.equal(lido.texto, prosa);

    const caladoTexto = "payoff: espada\nfica assim: payoff:espada:sem-setup\n";
    const calado = lerContinuidade(caladoTexto);
    assert.deepEqual(calado.avisos, []);
    assert.deepEqual(calado.calados, ["payoff:espada:sem-setup"]);
    assert.equal(calado.texto, caladoTexto);
    assert.equal(calado.texto.includes("do:"), false);

    const notas = diagnosticoDe(prosa, "").notas.filter((nota) => nota.codigo === "continuidade");
    assert.equal(notas.length, 1);
    assert.equal(notas.some((nota) => nota.texto.includes("do:")), false);
    const fonte = readFileSync("src/plugins/notebook/lib/continuidade.ts", "utf8");
    assert.equal(fonte.includes("descerMutacao"), false);
    assert.equal(/^\s*do:/m.test(fonte), false);
  });
});
