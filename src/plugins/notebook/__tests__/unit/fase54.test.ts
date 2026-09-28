import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { diagnosticoDe } from "../../lib/diagnostico.ts";

describe("fase 54", () => {
  it("a revisão tem uma lista só e a cena sem caminho fica de fora", () => {
    const entities = "@maria.{ name: 'Maria'; tags: agent; }\n@sala.{ name: 'Sala'; tags: place; }";
    const prosa = ["fio: espada pago", "causa: @maria -> @sala porque convite", "### Sala", "", "Maria entrou.", "", "### Quintal", "", "O vento passou."].join("\n");
    const linha = prosa.split("\n").findIndex((line) => line.startsWith("Maria entrou")) + 1;
    const lido = diagnosticoDe(prosa, entities, "SET_STAT @maria.medo 1", linha);
    assert.equal(Object.keys(lido).join(), "notas");
    assert.equal(lido.notas.some((nota) => nota.codigo === "continuidade"), true);
    assert.equal(lido.notas.some((nota) => nota.codigo === "impacto" && nota.texto === "ainda afecta Sala"), true);
    assert.equal(lido.notas.some((nota) => nota.codigo === "impacto" && nota.texto.includes("Quintal")), false);
    const painel = readFileSync("src/plugins/ide-ui/lib/components/SalaPainel.tsx", "utf8");
    assert.equal(painel.includes("lerContinuidade"), false);
    assert.equal(painel.includes("lerDiscurso"), false);
  });
});
