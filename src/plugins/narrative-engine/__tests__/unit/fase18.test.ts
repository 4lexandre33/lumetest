import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { adaptWorld, cloneWorldModel, compileEntityFile, mutationGateway, type WorldBackend } from "../../index.ts";

function files(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

describe("fase 18", () => {
  it("outro backend cumpre o mesmo WorldPort e o editor não muda", () => {
    let guardado = compileEntityFile("@goblin.{ tags: agent; flags: acordado=false; }").worldModel;
    let saves = 0;
    const backend: WorldBackend = {
      load: () => cloneWorldModel(guardado),
      save: (next) => {
        saves += 1;
        guardado = cloneWorldModel(next);
      },
    };
    const port = adaptWorld(backend);
    const decision = mutationGateway(port).submit("SET_FLAG @goblin.acordado true", "O goblin acorda.");
    assert.equal(decision.ok, true);
    assert.equal(decision.prose, "O goblin acorda.");
    assert.equal(guardado.get("@goblin")?.flags.acordado, true);
    assert.ok(saves > 0);
    decision.undo?.();
    assert.equal(guardado.get("@goblin")?.flags.acordado, false);
    for (const file of files("src/plugins/ide-ui")) {
      assert.equal(readFileSync(file, "utf8").includes("adaptWorld"), false, file);
    }
  });
});
