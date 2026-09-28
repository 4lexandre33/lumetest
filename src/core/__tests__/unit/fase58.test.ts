import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCore } from "../../index.ts";
import { julgar, vigiar } from "../../enforcement.ts";
import type { IPluginManifest } from "../../contracts/plugin-manifest.ts";

describe("fase 58", () => {
  it("a regressão falha e a árvore actual passa", async () => {
    assert.deepEqual(vigiar(), []);
    assert.equal(julgar({ importsNovos: ["a -> b"], capabilityNaoDeclarada: [], slotInexistente: [], mutacaoDirecta: [], iaNoMundo: [], deusNovo: [] })[0]?.regra, "novo cross-plugin import");
    assert.equal(julgar({ importsNovos: [], capabilityNaoDeclarada: ["Eco"], slotInexistente: [], mutacaoDirecta: [], iaNoMundo: [], deusNovo: [] })[0]?.regra, "capability não declarada");
    assert.equal(julgar({ importsNovos: [], capabilityNaoDeclarada: [], slotInexistente: ["porta"], mutacaoDirecta: [], iaNoMundo: [], deusNovo: [] })[0]?.regra, "slot inexistente");
    assert.equal(julgar({ importsNovos: [], capabilityNaoDeclarada: [], slotInexistente: [], mutacaoDirecta: ["plugin/x.ts"], iaNoMundo: [], deusNovo: [] })[0]?.regra, "mutação direta do World");
    assert.equal(julgar({ importsNovos: [], capabilityNaoDeclarada: [], slotInexistente: [], mutacaoDirecta: [], iaNoMundo: ["ai-runtime/lib/runtime.ts"], deusNovo: [] })[0]?.regra, "AI → World direto");
    assert.equal(julgar({ importsNovos: [], capabilityNaoDeclarada: [], slotInexistente: [], mutacaoDirecta: [], iaNoMundo: [], deusNovo: ["novo.ts"] })[0]?.regra, "novo God Object");

    const core = createCore();
    const manifest: IPluginManifest = {
      name: "lume-porta",
      version: "1.0.0",
      capabilities: { provides: [{ name: "Eco", version: "1.0.0" }] },
      slots: [{ name: "porta", capability: "Eco" }],
    };
    core.registerPlugin(manifest, async (ctx) => ({
      manifest,
      context: ctx,
      activate: async () => {
        ctx.registerCapability({ name: "Eco", version: "1.0.0", provider: manifest.name, api: { eco: () => "ok" } });
        assert.throws(() => ctx.registerCapability({ name: "Outra", version: "1.0.0", provider: manifest.name, api: {} }), /capability não declarada/);
      },
      deactivate: async () => {},
    }));
    await core.activatePlugin("lume-porta");
    core.registerHandler({ capability: "Eco", version: "1.0.0", method: "eco", provider: "lume-porta", handle: async () => "ok" });
    const base = {
      id: "1",
      type: "eco",
      version: "1.0.0",
      source: "lume-porta",
      correlationId: "c",
      timestamp: "2026-01-01T00:00:00.000Z",
      mode: "read" as const,
      payload: null,
    };
    assert.equal((await core.dispatch({ ...base, permissions: [] })).ok, false);
    assert.equal((await core.dispatch({ ...base, permissions: ["NaoHa"], capability: "NaoHa" })).error, "capability desconhecida");
    assert.equal((await core.dispatch({ ...base, permissions: ["Eco"], slot: "nao-ha" })).error, "slot desconhecido");
  });
});
