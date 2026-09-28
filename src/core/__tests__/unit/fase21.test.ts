import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCore } from "../../index.ts";
import type { IPluginManifest } from "../../contracts/plugin-manifest.ts";
import type { Envelope } from "../../contracts/envelope.ts";

const base: Envelope = {
  id: "1",
  type: "eco",
  version: "1.0.0",
  source: "lume-porta",
  capability: "Eco",
  payload: "ola",
  correlationId: "corr",
  causationId: "causa",
  timestamp: "2026-01-01T00:00:00.000Z",
  permissions: ["Eco"],
  context: { cena: "sala" },
  mode: "read",
};

describe("fase 21", () => {
  it("recusa o envelope sem permissão e não migra plugins", async () => {
    const core = createCore();
    const manifest: IPluginManifest = {
      name: "lume-porta",
      version: "1.0.0",
      slots: [{ name: "porta", capability: "Eco" }],
    };
    core.registerPlugin(manifest, async (ctx) => ({
      manifest,
      context: ctx,
      activate: async () => {
        ctx.registerHandler({
          capability: "Eco",
          version: "1.0.0",
          method: "eco",
          provider: manifest.name,
          handle: (payload) => payload,
        });
      },
      deactivate: async () => {},
    }));
    await core.activatePlugin("lume-porta");

    const sem = await core.dispatch({ ...base, permissions: [] });
    assert.deepEqual(sem, { ok: false, error: "sem permissão" });
    const outra = await core.dispatch({ ...base, permissions: ["Outra"] });
    assert.deepEqual(outra, { ok: false, error: "sem permissão" });
    const incompleto = await core.dispatch({ ...base, correlationId: "" });
    assert.deepEqual(incompleto, { ok: false, error: "envelope inválido" });
    const ok = await core.dispatch(base);
    assert.deepEqual(ok, { ok: true, value: "ola" });
    const porSlot = await core.dispatch({ ...base, id: "2", capability: undefined, slot: "porta" });
    assert.deepEqual(porSlot, { ok: true, value: "ola" });
    assert.equal(typeof core.getService, "function");
  });
});
