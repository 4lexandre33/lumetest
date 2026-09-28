import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "__tests__") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

function resolveSpec(from: string, spec: string): string {
  let path = join(dirname(from), spec).replaceAll("\\", "/");
  if (!path.endsWith(".ts") && !path.endsWith(".tsx")) {
    if (existsSync(path + ".ts")) path += ".ts";
    else if (existsSync(path + ".tsx")) path += ".tsx";
    else if (existsSync(path + "/index.ts")) path += "/index.ts";
  }
  return path;
}

describe("fase 43", () => {
  it("o inventário não cresce e o texto diz o que o código faz", () => {
    const listed = readFileSync("src/core/legacy-imports.txt", "utf8").trim().split("\n").filter(Boolean).sort();
    const found: string[] = [];
    for (const file of walk("src/plugins")) {
      const source = file.split("/")[2];
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
        const target = resolveSpec(file, match[1]!);
        if (!target.includes("/plugins/")) continue;
        const rest = target.split("/plugins/")[1];
        const targetPlugin = rest?.split("/")[0];
        if (!targetPlugin || targetPlugin === source) continue;
        found.push(`${file} -> ${rest}`);
      }
    }
    found.sort();
    assert.deepEqual(found, listed);
    assert.equal(listed.length, 207);
    const pairs = new Set(listed.map((row) => `${row.split("/")[2]} -> ${row.split(" -> ")[1]!.split("/")[0]}`));
    assert.equal(pairs.size, 56);

    const context = readFileSync("src/core/CONTEXT.md", "utf8");
    assert.equal(context.includes("não muda"), false);
    assert.equal(context.includes("ordemDeBoot"), true);
    assert.equal(context.includes("207 imports, 56 pares"), true);

    const readme = readFileSync("README.md", "utf8");
    assert.equal(readme.includes("8 plugins"), false);
    assert.equal(readme.includes("OS 8 PLUGINS"), false);
    assert.equal(readme.includes("35 plugins"), true);
    assert.equal(readme.includes("ordemDeBoot"), true);
    assert.equal(readme.includes("manuscrito"), true);
  });
});
