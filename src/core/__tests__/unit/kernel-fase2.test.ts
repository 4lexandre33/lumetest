import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCore } from "../../index.ts";
import type { IPluginManifest } from "../../contracts/plugin-manifest.ts";

describe("fase 2 kernel", () => {
  it("entrega o envelope por capability ou slot e deixa o getService", async () => {
    const core = createCore();
    const manifest: IPluginManifest = {
      name: "lume-porta",
      version: "1.0.0",
      capabilities: { provides: [{ name: "Saco", version: "1.0.0" }] },
      slots: [{ name: "porta", capability: "Eco" }],
    };
    core.registerPlugin(manifest, async (ctx) => ({
      manifest,
      context: ctx,
      activate: async () => {
        ctx.registerCapability({
          name: "Saco",
          version: "1.0.0",
          provider: manifest.name,
          api: { ping: () => "saco" },
        });
        ctx.registerHandler({
          capability: "Eco",
          version: "1.0.0",
          method: "eco",
          provider: "outro",
          handle: (payload) => payload,
        });
        ctx.registerHandler({
          capability: "Eco",
          version: "1.0.0",
          method: "quebra",
          provider: manifest.name,
          handle: () => { throw new Error("falhou"); },
        });
      },
      deactivate: async () => {},
    }));
    await core.activatePlugin("lume-porta");

    const base = { version: "1.0.0", source: "lume-porta", correlationId: "c", timestamp: "t", permissions: ["Eco"], mode: "read" as const };
    assert.equal(core.getService<{ ping: () => string }>("Saco").ping(), "saco");
    assert.deepEqual(
      await core.dispatch({ ...base, id: "1", type: "eco", capability: "Eco", payload: "ola" }),
      { ok: true, value: "ola" },
    );
    assert.deepEqual(
      await core.dispatch({ ...base, id: "2", type: "eco", slot: "porta", payload: "ola" }),
      { ok: true, value: "ola" },
    );
    const missing = await core.dispatch({ ...base, id: "3", type: "eco", slot: "nenhuma" });
    assert.equal(missing.ok, false);
    const broken = await core.dispatch({ ...base, id: "4", type: "quebra", capability: "Eco" });
    assert.deepEqual(broken, { ok: false, error: "falhou" });
    assert.equal(core.getService<{ ping: () => string }>("Saco").ping(), "saco");

    const listed = core.registry().handlers;
    assert.equal(listed.length, 2);
    assert.equal("handle" in listed[0]!, false);
    assert.equal(listed[0]!.provider, "lume-porta");
    assert.ok(core.diagnostics().some((note) => note.code === "dispatch"));
    assert.equal("world" in core, false);
  });

  it("não apaga o boot antigo", () => {
    const boot = readFileSync(new URL("../../../bootstrap.ts", import.meta.url), "utf8");
    assert.match(boot, /registerPlugin\(NARRATIVE_ENGINE_MANIFEST/);
    assert.match(boot, /activatePlugin\('lume-narrative-engine'\)/);
    assert.doesNotMatch(boot, /dispatcher/);
  });
});
