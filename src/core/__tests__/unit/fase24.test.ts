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
  }
  return path;
}

describe("fase 24", () => {
  it("notebook e ide-ui não importam lib alheio", () => {
    const hits: string[] = [];
    for (const plugin of ["notebook", "ide-ui"]) {
      for (const file of walk(`src/plugins/${plugin}`)) {
        const text = readFileSync(file, "utf8");
        for (const match of text.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
          const target = resolveSpec(file, match[1]!);
          const rest = target.split("/plugins/")[1] ?? "";
          const other = rest.split("/")[0];
          if (other && other !== plugin && rest.includes("/lib/")) hits.push(`${file} -> ${rest}`);
        }
      }
    }
    assert.deepEqual(hits, []);
    assert.equal(readFileSync("src/plugins/notebook/ui/NotebookEditor.tsx", "utf8").includes("ide-ui/index.ts"), true);
    assert.equal(readFileSync("src/plugins/ide-ui/lib/components/IdeApp.tsx", "utf8").includes("ext-host/index.ts"), true);
  });
});
