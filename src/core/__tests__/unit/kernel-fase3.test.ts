import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
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
  }
  return path;
}

function directImplementationImports(): string[] {
  const rows: string[] = [];
  for (const file of walk("src/plugins")) {
    const source = file.split("/")[2];
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
      const target = resolveSpec(file, match[1]);
      if (!target.includes("/plugins/")) continue;
      const targetPlugin = target.split("/plugins/")[1]?.split("/")[0];
      if (!targetPlugin || targetPlugin === source) continue;
      if (!(target.includes("/lib/") || target.includes("/ui/") || target.includes("/data/"))) continue;
      rows.push(`${file} -> ${target.split("/plugins/")[1]}`);
    }
  }
  return rows.sort();
}

describe("fase 3 imports", () => {
  it("a lista é o que ainda entra na implementação de outro plugin", () => {
    const listed = readFileSync("src/core/legacy-imports.txt", "utf8").trim().split("\n").filter(Boolean).sort();
    assert.deepEqual(directImplementationImports().every((row) => listed.includes(row)), true);
    assert.equal(existsSync("src/plugins/narrative-engine/index.ts"), true);
  });
});
