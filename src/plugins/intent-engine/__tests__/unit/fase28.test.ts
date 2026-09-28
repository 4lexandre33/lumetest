import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

describe("fase 28", () => {
  it("o intent não importa o matcher nem o clone, e o catálogo fica", () => {
    for (const file of walk("src/plugins/intent-engine/lib")) {
      const text = readFileSync(file, "utf8");
      assert.equal(text.includes("findMatchingRule"), false, file);
      assert.equal(text.includes("cloneWorldModel"), false, file);
    }
    const catalog = readFileSync("src/plugins/intent-engine/lib/catalog.ts", "utf8");
    assert.equal(catalog.includes('take: leaf("take"'), true);
  });
});
