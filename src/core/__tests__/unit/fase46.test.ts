import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("fase 46", () => {
  it("o AI e a autoria não importam lib alheio", () => {
    const ai = readFileSync("src/plugins/ai-runtime/lib/runtime.ts", "utf8");
    const autoria = readFileSync("src/plugins/authoring-runtime/lib/autoria.ts", "utf8");
    assert.equal(ai.includes("from \"../../"), false);
    assert.equal(autoria.includes("from \"../../"), false);
    assert.equal(ai.includes("getService") || readFileSync("src/plugins/ai-runtime/index.ts", "utf8").includes("getService"), true);
    assert.equal(readFileSync("src/plugins/authoring-runtime/index.ts", "utf8").includes("getService"), true);
  });
});
