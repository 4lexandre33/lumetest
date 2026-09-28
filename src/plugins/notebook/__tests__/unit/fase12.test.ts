import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { lerContinuidade } from "../../lib/continuidade.ts";

describe("fase 12", () => {
  it("arco e fio são declarados, o aviso não condena, e fica assim cala", () => {
    const prose = ["arco: A queda", "fio: espada pago", "Maria entrou na queda."].join("\n");
    const lido = lerContinuidade(prose);
    assert.deepEqual(lido.arcos.map((arco) => arco.nome), ["A queda"]);
    assert.deepEqual(lido.fios.map((fio) => fio.estado), ["pago"]);
    assert.equal(lido.avisos.length, 1);
    assert.equal(lido.avisos[0]!.id, "fio:espada:sem-abertura");
    assert.equal(prose, "arco: A queda\nfio: espada pago\nMaria entrou na queda.");
    assert.deepEqual(lerContinuidade("Maria entrou na queda.").arcos, []);
    assert.deepEqual(lerContinuidade("Maria entrou na queda.").fios, []);

    const aberto = lerContinuidade("arco: A queda\nfio: espada aberto\nfio: espada pago\n");
    assert.deepEqual(aberto.fios.map((fio) => fio.estado), ["aberto", "pago"]);
    assert.deepEqual(aberto.avisos, []);

    const calado = lerContinuidade("fio: espada pago\nfica assim: fio:espada:sem-abertura\n");
    assert.deepEqual(calado.avisos, []);
    assert.deepEqual(calado.calados, ["fio:espada:sem-abertura"]);
    assert.equal(calado.fios[0]!.estado, "pago");

    const estranho = lerContinuidade("fio: espada feliz\n");
    assert.deepEqual(estranho.fios, []);
    assert.equal(estranho.avisos[0]!.id, "fio:espada:estado");
    const mudo = lerContinuidade("fio: espada feliz\nfica assim: fio:espada:estado\n");
    assert.deepEqual(mudo.avisos, []);
    assert.deepEqual(mudo.calados, ["fio:espada:estado"]);
  });
});
