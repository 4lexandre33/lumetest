import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SALAS, ferramentasDaSala } from "../../lib/superficie.ts";

describe("fase 41", () => {
  it("play, skein, debug e export ficam só no técnico", () => {
    for (const sala of SALAS) assert.deepEqual(ferramentasDaSala(sala), []);
    assert.deepEqual(ferramentasDaSala("tecnico"), ["play", "skein", "debug", "export"]);
    const app = readFileSync("src/plugins/ide-ui/lib/components/IdeApp.tsx", "utf8");
    assert.equal(app.includes("ferramentasDaSala"), true);
    assert.equal(app.includes('tec.has("play")'), true);
    assert.equal(app.includes('tec.has("debug")'), true);
    assert.equal(app.includes('tec.has("export")'), true);
    assert.equal(app.includes('tec.has("skein")'), true);
  });
});
