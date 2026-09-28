import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lerDiscurso } from "../../lib/discurso.ts";

describe("fase 13", () => {
  it("discurso e estilo citam a frase e não reescrevem o texto", () => {
    const fonte = readFileSync(new URL("../../lib/discurso.ts", import.meta.url), "utf8");
    assert.equal(fonte.includes("reescrita"), false);
    const prosa = [
      "### Sala",
      "",
      "— Entra.",
      "Maria disse que a porta estava aberta.",
      "A chave antiga ficou na mesa da sala durante toda a noite fria.",
    ].join("\n");
    const antes = prosa;
    const lido = lerDiscurso(prosa);
    assert.equal(lido.prosa, antes);
    assert.equal(prosa, antes);
    const notas = [...lido.discurso, ...lido.estilo];
    for (const nota of notas) assert.equal(nota.evidencia.text, prosa.slice(nota.evidencia.start, nota.evidencia.end));
    assert.equal(lido.discurso.find((nota) => nota.tipo === "direto")?.evidencia.text, "— Entra.");
    assert.equal(lido.discurso.find((nota) => nota.tipo === "indireto")?.evidencia.text, "disse que");
    assert.equal(lido.estilo.find((nota) => nota.traco === "longa")?.evidencia.text.startsWith("A chave antiga"), true);
    assert.equal(JSON.stringify(lido).includes("Entra!"), false);
    assert.equal("reescrita" in lido, false);
  });
});
