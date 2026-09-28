import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { salasVisiveis } from "../../lib/superficie.ts";

describe("fase 15", () => {
  it("a porta são as salas de escrita e o técnico só aparece quando se pede", () => {
    assert.deepEqual(salasVisiveis(false), ["escrever", "pessoas", "cenas", "cronologia", "universo", "revisao", "assistente"]);
    assert.equal(salasVisiveis(false).includes("tecnico"), false);
    assert.equal(salasVisiveis(false).includes("play" as never), false);
    assert.equal(salasVisiveis(true).at(-1), "tecnico");
    const app = readFileSync(fileURLToPath(new URL("../../lib/components/IdeApp.tsx", import.meta.url)), "utf8");
    assert.match(app, /aria-label="Superfície"/);
    assert.match(app, /Pedir o técnico/);
    assert.equal(app.includes("Mostrar motor"), false);
    assert.equal(app.includes("<ModeSwitch />"), false);
    assert.equal(app.includes("Play deixa"), false);
    for (const rotulo of ["Escrever", "Pessoas", "Cenas", "Cronologia", "Universo", "Revisão", "Assistente", "Técnico"]) {
      assert.equal(app.includes(`"${rotulo}"`) || app.includes("ROTULO"), true, rotulo);
    }
  });
});
