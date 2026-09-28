import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const MARCA = "O Lume é uma plataforma de autoria. O manuscrito é a porta. Jogo e skills de canvas são secundários.";

describe("fase 20", () => {
  it("os documentos de arquitectura falam de escrita, não de jogo", () => {
    for (const file of ["docs/ai/MAPA.md", "docs/ai/INVARIANTES.md", "src/plugins/AGENTS.md", "src/core/README.md", "AGENTS.md"]) {
      assert.equal(readFileSync(file, "utf8").includes(MARCA), true, file);
    }
    const mapa = readFileSync("docs/ai/MAPA.md", "utf8");
    assert.equal(mapa.includes("O inventário de imports não está completo até à fase 23."), true);
    assert.equal(mapa.includes("Plugins **não** se conhecem."), false);
    const inv = readFileSync("docs/ai/INVARIANTES.md", "utf8");
    assert.equal(inv.includes("Extrair capability é permitido. A proibição fica no matcher e na prosa: um só findMatchingRule, e a prosa não se reescreve."), true);
    assert.equal(inv.includes("Um só `findMatchingRule`."), true);
  });
});
