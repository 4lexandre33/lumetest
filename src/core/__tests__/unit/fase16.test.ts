import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { OPCIONAIS } from "../../../opcionais.ts";
import { bootLumePlatform, getPlatformServices } from "../../../bootstrap.ts";

describe("fase 16", () => {
  it("kits, mapa, sentidos, sift, processo, vida e multiplayer ficam opcionais e não se apagam", () => {
    assert.deepEqual(
      OPCIONAIS.map((item) => [item.plugin, item.destino]),
      [
        ["lume-kit-adventure", "pacote de regras opcionais"],
        ["lume-kit-social", "pacote de domínio social"],
        ["lume-kit-channel", "pacote de canais narrativos"],
        ["lume-kit-combat", "pacote opcional de combate"],
        ["lume-kit-prose", "prose-presentation, recap, narrative-display"],
        ["lume-spatial", "mapa; consome WorldQuery e WorldMutation"],
        ["lume-senses", "scope, perception, visibility, hearing, touch"],
        ["lume-sift", "pattern analysis, story filtering"],
        ["lume-process", "processamento temporal explícito"],
        ["lume-life", "comportamento opt-in no estado existente"],
        ["lume-multiplayer", "opcional e isolado"],
      ],
    );
    const boot = readFileSync("src/bootstrap.ts", "utf8");
    for (const item of OPCIONAIS) {
      assert.equal(existsSync(`src/plugins/${item.plugin.replace("lume-", "")}/index.ts`), true, item.plugin);
      assert.equal(boot.includes(item.plugin), true, item.plugin);
      assert.equal(boot.includes("registerPlugin"), true);
    }
    return bootLumePlatform({ opcionais: false }).then(({ core, services }) => {
      assert.equal(services, undefined);
      const pedido = getPlatformServices(core);
      const active = new Set(core.listActivePlugins());
      assert.equal(active.has("lume-narrative-engine"), true);
      assert.equal(active.has("lume-notebook"), true);
      for (const item of OPCIONAIS) {
        assert.equal(core.listPlugins().some((plugin) => plugin.name === item.plugin), true, item.plugin);
        assert.equal(active.has(item.plugin), false, item.plugin);
      }
      assert.equal(pedido.narrativeEngine != null, true);
      assert.equal(pedido.spatial, null);
      assert.equal(pedido.senses, null);
      assert.equal(pedido.adventureKit, null);
      assert.equal(pedido.prose, null);
      assert.equal(pedido.sift, null);
      assert.equal(pedido.process, null);
      assert.equal(pedido.life, null);
      assert.equal(pedido.multiplayer, null);
    });
  });
});
