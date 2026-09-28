import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { impactoDaMutacao } from "../../lib/impacto.ts";

const entities = "@maria.{ name: 'Maria'; tags: agent; }";
const prosa = ["### Casa", "", "Maria dormia.", "", "### Sala", "", "Maria entrou.", "", "### Rua", "", "Maria esperou.", "", "### Porto", "", "O cais estava vazio."].join("\n");

describe("fase 14", () => {
  it("um diagnóstico diz as cenas que a mutação ainda afecta, sem branch", () => {
    const fonte = readFileSync(new URL("../../lib/impacto.ts", import.meta.url), "utf8");
    assert.equal(fonte.includes("recordPath"), false);
    assert.equal(fonte.includes("branch"), false);
    const linha = prosa.split("\n").findIndex((line) => line.startsWith("Maria entrou")) + 1;
    const antes = prosa;
    const impacto = impactoDaMutacao(prosa, entities, "SET_STAT @maria.medo 1", linha);
    assert.equal(prosa, antes);
    assert.equal("branches" in impacto, false);
    assert.deepEqual(impacto.notas.map((nota) => nota.texto), ["ainda afecta Sala", "ainda afecta Rua"]);
    assert.equal(new Set(impacto.notas.map((nota) => nota.codigo)).size, 1);
    assert.equal(impacto.notas.every((nota) => nota.codigo === "impacto"), true);
    assert.equal(impacto.notas.some((nota) => nota.texto.includes("Porto")), false);
    assert.equal(impacto.notas.some((nota) => nota.texto.includes("Casa")), false);
  });
});
