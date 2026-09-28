import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { diagnosticoDe } from "../../lib/diagnostico.ts";

describe("fase 37", () => {
  it("um diagnóstico junta a verdade e o impacto percorre o grafo", () => {
    const entities = [
      "@maria.{ name: 'Maria'; tags: agent, knows_porta; }",
      "@porto.{ name: 'Porto'; tags: place; }",
      "@sala.{ name: 'Sala'; tags: place; }",
    ].join("\n");
    const prosa = [
      "fio: espada pago",
      "causa: @maria -> @sala porque convite",
      "tempo: @maria -> @porto",
      "pessoa: @maria inicio=calma",
      "intencao: enunciar",
      "### Sala",
      "",
      "Maria entrou.",
      "",
      "### Porto",
      "",
      "O cais estava vazio.",
    ].join("\n");
    const antes = prosa;
    const linha = prosa.split("\n").findIndex((line) => line.startsWith("Maria entrou")) + 1;
    const lido = diagnosticoDe(prosa, entities, "SET_STAT @maria.medo 1", linha);
    assert.equal(prosa, antes);
    assert.equal("branches" in lido, false);
    const codigos = new Set(lido.notas.map((nota) => nota.codigo));
    for (const codigo of ["continuidade", "causa", "pessoa", "conhecimento", "estrutura", "estilo", "leitor", "impacto"]) {
      assert.equal(codigos.has(codigo), true, codigo);
    }
    assert.equal(lido.notas.some((nota) => nota.codigo === "continuidade" && nota.texto.includes("espada")), true);
    assert.equal(lido.notas.some((nota) => nota.codigo === "causa" && nota.texto.includes("convite")), true);
    assert.equal(lido.notas.some((nota) => nota.codigo === "causa" && nota.texto.includes("vazio")), false);
    assert.equal(lido.notas.some((nota) => nota.codigo === "pessoa" && nota.texto.includes("inicio=calma")), true);
    assert.equal(lido.notas.some((nota) => nota.codigo === "conhecimento" && nota.texto === "@maria sabe porta"), true);
    assert.equal(lido.notas.some((nota) => nota.codigo === "leitor" && nota.texto.includes("falta enunciate")), true);
    assert.equal(lido.notas.some((nota) => nota.codigo === "impacto" && nota.texto === "ainda afecta Porto"), true);
    const fonte = readFileSync("src/plugins/notebook/lib/impacto.ts", "utf8");
    assert.equal(fonte.includes("branch"), false);
    assert.equal(fonte.includes("grafoDe"), true);
  });
});
