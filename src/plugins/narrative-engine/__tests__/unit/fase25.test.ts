import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createCore } from "../../../../core/index.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin, cloneWorldModel, compileEntityFile, type WorldBackend, type WorldMutation, type WorldQuery } from "../../index.ts";

function files(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

describe("fase 25", () => {
  it("WorldQuery lê e WorldMutation escreve por cima do adaptador", async () => {
    const core = createCore();
    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    await core.activatePlugin("lume-narrative-engine");
    const query = core.getService<WorldQuery>("WorldQuery");
    const mutation = core.getService<WorldMutation>("WorldMutation");

    let guardado = compileEntityFile("@goblin.{ tags: agent; flags: acordado=false; }").worldModel;
    let saves = 0;
    const backend: WorldBackend = {
      load: () => cloneWorldModel(guardado),
      save: (next) => {
        saves += 1;
        guardado = cloneWorldModel(next);
      },
    };
    assert.equal(query.read(backend, "@goblin")?.flags.acordado, false);
    assert.equal(mutation.update(backend, "@goblin", (entity) => { entity.flags.acordado = true; }), true);
    assert.equal(query.read(backend, "@goblin")?.flags.acordado, true);
    assert.ok(saves > 0);
    for (const file of files("src/plugins/ide-ui")) {
      assert.equal(readFileSync(file, "utf8").includes("WorldQuery"), false, file);
      assert.equal(readFileSync(file, "utf8").includes("WorldMutation"), false, file);
    }
  });
});
