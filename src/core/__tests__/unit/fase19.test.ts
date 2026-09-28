import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

describe("fase 19", () => {
  it("retira a fachada velha porque a substituição existe", () => {
    assert.equal(existsSync("src/plugins/ide-ui/lib/components/IdeApp.tsx"), true);
    assert.equal(existsSync("src/plugins/narrative-engine/lib/index.ts"), true);
    assert.equal(existsSync("src/plugins/ide-state/lib/orchestrator.ts"), true);
    assert.equal(existsSync("src/components/ide"), false);
    assert.equal(existsSync("src/lib/ide"), false);
    assert.equal(existsSync("src/lib/engine"), false);
    assert.equal(existsSync("src/components/preview-host-bridge.tsx"), true);
    assert.equal(existsSync("src/lib/multiplayer/index.ts"), true);
    const route = readFileSync("src/routes/index.tsx", "utf8");
    assert.match(route, /plugins\/ide-ui\/lib\/components\/IdeApp/);
    assert.equal(route.includes("components/ide"), false);
  });
});
