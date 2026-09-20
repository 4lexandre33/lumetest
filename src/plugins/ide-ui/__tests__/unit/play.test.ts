import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { playHud } from "../../lib/play.ts";
import { DRY_RUN_NOTICE } from "../../../intent-engine/lib/notices.ts";

describe("play skin hud", () => {
  it("shows title turn and optional score", () => {
    assert.deepEqual(playHud("Caverna", 1, {}), { title: "Caverna", turn: 0, score: null });
    assert.deepEqual(playHud("Caverna", 4, { score: 12, fear: 1 }), { title: "Caverna", turn: 3, score: 12 });
    assert.equal(DRY_RUN_NOTICE, "Pergunta hipotética: nenhuma acção foi executada.");
  });

  it("keeps Escrita/Jogo visible on every viewport after Nova história", () => {
    const src = readFileSync(fileURLToPath(new URL("../../lib/components/IdeApp.tsx", import.meta.url)), "utf8");
    assert.match(src, /<ModeSwitch \/>/);
    assert.equal(src.includes("hidden md:inline-flex"), false);
    const lumeAt = src.indexOf("Lume");
    const switchAt = src.indexOf("<ModeSwitch />");
    const menusAt = src.indexOf("{MENUS.map");
    assert.equal(switchAt > lumeAt && switchAt < menusAt, true);
  });

  it("Welcome Jogo stays in the IDE; Vista do jogador is PlaySkin", () => {
    const welcome = readFileSync(fileURLToPath(new URL("../../lib/components/Welcome.tsx", import.meta.url)), "utf8");
    assert.match(welcome, /setIdeMode\("play"\)/);
    assert.equal(welcome.includes("openPlay()"), false);
    const app = readFileSync(fileURLToPath(new URL("../../lib/components/IdeApp.tsx", import.meta.url)), "utf8");
    assert.match(app, /Vista do jogador/);
    assert.match(app, /openPlay/);
    assert.match(app, /NotebookPane/);
    const skin = readFileSync(fileURLToPath(new URL("../../lib/components/PlaySkin.tsx", import.meta.url)), "utf8");
    assert.match(skin, /Vista do jogador/);
    assert.match(skin, /PreviewPane mode="play"/);
    assert.match(skin, /Modo Escrita/);
    assert.match(skin, /Modo Jogo/);
    assert.match(welcome, /Modo Escrita/);
    assert.match(welcome, /Modo Jogo/);
    assert.equal(welcome.includes("Preview de runtime"), false);
  });
});
