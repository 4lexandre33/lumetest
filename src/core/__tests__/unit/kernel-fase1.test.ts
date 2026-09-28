import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCore } from "../../index.ts";
import { PermissionError } from "../../contracts/errors.ts";
import { ProjectCompiledEvent } from "../../contracts/typed-event.ts";
import type { IPluginManifest } from "../../contracts/plugin-manifest.ts";

describe("fase 1 kernel", () => {
  it("corre o ciclo, regista sem implementação e não tem mundo", async () => {
    const core = createCore();
    const order: string[] = [];
    const manifest: IPluginManifest = {
      name: "lume-ciclo",
      version: "1.0.0",
      capabilities: { provides: [{ name: "Ciclo", version: "1.0.0" }] },
      hooks: {
        init: async () => { order.push("init"); },
        start: async () => { order.push("start"); },
        stop: async () => { order.push("stop"); },
        destroy: async () => { order.push("destroy"); },
      },
    };
    core.registerPlugin(manifest, async (ctx) => ({
      manifest,
      context: ctx,
      activate: async () => {
        order.push("activate");
        ctx.registerCapability({ name: "Ciclo", version: "1.0.0", provider: manifest.name, api: { mundo: () => "nao" } });
      },
      deactivate: async () => { order.push("deactivate"); },
    }));
    assert.equal(core.lifecycle("lume-ciclo")?.state, "pending");
    await core.activatePlugin("lume-ciclo");
    assert.equal(core.lifecycle("lume-ciclo")?.state, "active");
    assert.deepEqual(order, ["activate", "init", "start"]);
    const reg = core.registry();
    assert.deepEqual(reg.capabilities, [{ name: "Ciclo", version: "1.0.0", provider: "lume-ciclo" }]);
    assert.equal("api" in reg.capabilities[0]!, false);
    assert.equal("world" in core, false);
    await core.deactivatePlugin("lume-ciclo");
    assert.deepEqual(order, ["activate", "init", "start", "stop", "deactivate", "destroy"]);
    assert.equal(core.lifecycle("lume-ciclo")?.state, "disabled");
  });

  it("nega storage e evento, e um plugin caído não derruba o kernel", async () => {
    const core = createCore();
    const quiet: IPluginManifest = {
      name: "lume-quieto",
      version: "1.0.0",
      permissions: { storage: "none", network: "none", events: ["lume:project-compiled"] },
    };
    core.registerPlugin(quiet, async (ctx) => ({
      manifest: quiet,
      context: ctx,
      activate: async () => {
        assert.equal(ctx.storage.get("a"), null);
        assert.throws(() => ctx.storage.set("a", "1"), PermissionError);
        ctx.on(ProjectCompiledEvent, () => {});
        assert.throws(() => ctx.on(class extends ProjectCompiledEvent {
          override readonly type = "lume:outro";
        }, () => {}), PermissionError);
      },
      deactivate: async () => {},
    }));
    const broken: IPluginManifest = { name: "lume-cai", version: "1.0.0" };
    core.registerPlugin(broken, async () => { throw new Error("caiu"); });
    const other: IPluginManifest = { name: "lume-fica", version: "1.0.0" };
    core.registerPlugin(other, async (ctx) => ({
      manifest: other,
      context: ctx,
      activate: async () => {},
      deactivate: async () => {},
    }));

    await core.activatePlugin("lume-quieto");
    await assert.rejects(() => core.activatePlugin("lume-cai"));
    await core.activatePlugin("lume-fica");
    assert.equal(core.lifecycle("lume-cai")?.state, "failed");
    assert.equal(core.lifecycle("lume-fica")?.state, "active");
    assert.ok(core.diagnostics().some((note) => note.code === "permission" && note.plugin === "lume-quieto"));
    assert.ok(core.diagnostics().some((note) => note.code === "lifecycle" && note.plugin === "lume-cai"));
  });
});
