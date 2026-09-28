import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { playHud } from "../../lib/play.ts";
import { DRY_RUN_NOTICE } from "../../../intent-engine/index.ts";

describe("play skin hud", () => {
  it("shows title turn and optional score", () => {
    assert.deepEqual(playHud("Caverna", 1, {}), { title: "Caverna", turn: 0, score: null });
    assert.deepEqual(playHud("Caverna", 4, { score: 12, fear: 1 }), { title: "Caverna", turn: 3, score: 12 });
    assert.equal(DRY_RUN_NOTICE, "Pergunta hipotética: nenhuma acção foi executada.");
  });

  it("opens the manuscript; Escrita/Jogo is not on the bar", () => {
    const src = readFileSync(fileURLToPath(new URL("../../lib/components/IdeApp.tsx", import.meta.url)), "utf8");
    assert.equal(src.includes("<ModeSwitch />"), false);
    assert.equal(src.includes("Vista do jogador"), false);
    assert.match(src, /NotebookPane/);
    assert.match(src, /PreviewPane mode="ide"/);
    const welcome = readFileSync(fileURLToPath(new URL("../../lib/components/Welcome.tsx", import.meta.url)), "utf8");
    assert.equal(welcome.includes("setIdeMode"), false);
    assert.equal(welcome.includes("Modo Jogo"), false);
    assert.match(welcome, /newBlank/);
    assert.match(welcome, /O que abre é o caderno/);
  });
});
