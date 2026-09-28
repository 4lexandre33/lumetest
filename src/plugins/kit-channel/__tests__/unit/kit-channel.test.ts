import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createCore, type Core } from "../../../../core/index.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin } from "../../../narrative-engine/index.ts";
import type { NarrativeEngineService } from "../../../narrative-engine/types.ts";
import { createGame, interactWith } from "../../../narrative-engine/index.ts";
import { cloneWorldModel } from "../../../narrative-engine/index.ts";
import { query } from "../../../narrative-engine/index.ts";
import { createExampleProject } from "../../../narrative-engine/index.ts";
import { CHAIN_MANIFEST, createChainPlugin } from "../../../chain/index.ts";
import { KIT_CHANNEL_MANIFEST, createKitChannelPlugin, KIT_MARK, CHANNEL_KINDS } from "../../index.ts";
import type { ChannelKitService } from "../../types.ts";

function advanceChannel(game: ReturnType<typeof createGame>, id: string) {
  const world = cloneWorldModel(game.worldModel);
  const channel = world.get(id);
  if (channel) channel.links.intent = "advance";
  return interactWith({ ...game, worldModel: world }, id);
}

describe("Channel kit", () => {
  let core: Core;
  let kit: ChannelKitService;
  let narrative: NarrativeEngineService;

  beforeEach(async () => {
    core = createCore();
    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    core.registerPlugin(CHAIN_MANIFEST, createChainPlugin);
    core.registerPlugin(KIT_CHANNEL_MANIFEST, createKitChannelPlugin);
    await core.activatePlugin("lume-narrative-engine");
    await core.activatePlugin("lume-chain");
    await core.activatePlugin("lume-kit-channel");
    kit = core.getService<ChannelKitService>("ChannelKit");
    narrative = core.getService<NarrativeEngineService>("NarrativeEngine");
  });

  it("declares ChannelKit data capability and example kinds", () => {
    assert.equal(KIT_CHANNEL_MANIFEST.name, "lume-kit-channel");
    assert.ok(kit.taxonomySource.includes(KIT_MARK));
    assert.ok(kit.taxonomySource.includes("channel → abstract"));
    assert.deepEqual([...kit.kinds], [...CHANNEL_KINDS]);
    assert.ok(kit.kinds.includes("economia"));
    assert.ok(kit.kinds.includes("politica"));
    assert.ok(kit.kinds.includes("facoes"));
    assert.equal(kit.rulesSource.includes("THEN"), false);
    assert.equal(kit.rulesSource.includes("WAIT"), false);
    assert.equal(kit.rulesSource.includes(KIT_MARK), false);
  });

  it("applies once; THEN and intent=advance bump state; author wins", () => {
    let project = narrative.createProject("kit-channel-room", {
      entitiesSource: `@jogador.{ tags: agent; links: current_location=@sala; }
@sala.{ tags: place; name: Sala; }
@cidade.{ tags: place; name: Cidade; }
@guarda.{ tags: agent; links: current_location=@sala; name: Guarda; }
@corrupcao.{ tags: channel, economia; stats: state=0; name: Corrupção; }
@politica.{ tags: politica; stats: state=0; name: Política; }
start()
`,
      taxonomySource: "",
      rulesSource: `# start
ON: start
narrativa: "ok"

# suborno
ON: @guarda
IF: @jogador.intent=give
DO: THEN @corrupcao
narrativa: "O guarda aceita."

# corrupção específica
ON: @corrupcao
IF: @corrupcao.intent=advance
DO: @corrupcao.corrupted
    THEN @cidade
narrativa: "A guarda já não serve o mesmo senhor."

# cidade
ON: @cidade
narrativa: "A cidade nota."
`,
    });
    project = kit.apply(project);
    project = kit.apply(project);
    assert.equal((project.taxonomySource.match(/# kit:channel/g) ?? []).length, 1);
    const compiled = narrative.compileProject(project);
    assert.equal(compiled.errors.length, 0);
    assert.ok(query("*.channel", compiled.worldModel, "start", compiled.taxonomy).some(([id]) => id === "@corrupcao"));
    assert.ok(query("*.economia", compiled.worldModel, "start", compiled.taxonomy).some(([id]) => id === "@corrupcao"));
    assert.ok(query("*.channel", compiled.worldModel, "start", compiled.taxonomy).some(([id]) => id === "@politica"));
    let game = narrative.bootGame(createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));

    const world = cloneWorldModel(game.worldModel);
    world.get("@jogador")!.links.intent = "give";
    game = interactWith({ ...game, worldModel: world }, "@guarda");
    assert.equal(game.worldModel.get("@corrupcao")?.stats.state, 1);
    assert.equal(game.worldModel.get("@corrupcao")?.tags.has("corrupted"), false);
    assert.ok(game.history.some((beat) => beat.triggerId === "@corrupcao"));
    assert.equal(game.history.some((beat) => beat.triggerId === "@cidade"), false);

    game = advanceChannel(game, "@corrupcao");
    assert.equal(game.worldModel.get("@corrupcao")?.tags.has("corrupted"), true);
    assert.equal(game.worldModel.get("@corrupcao")?.stats.state, 1);
    assert.ok(game.history.some((beat) => beat.triggerId === "@cidade"));
    assert.ok(game.story.includes("cidade") || game.history.some((b) => /cidade/i.test(b.story)));
  });

  it("without state does not mutate", () => {
    let project = narrative.createProject("kit-channel-mute", {
      entitiesSource: `@jogador.{ tags: agent; }
@silencio.{ tags: channel; name: Silêncio; }
start()
`,
      taxonomySource: "",
      rulesSource: `# start
ON: start
narrativa: "ok"
`,
    });
    project = kit.apply(project);
    const compiled = narrative.compileProject(project);
    assert.equal(compiled.errors.length, 0);
    let game = narrative.bootGame(createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    game = interactWith(game, "@silencio");
    assert.equal(game.worldModel.get("@silencio")?.stats.state, undefined);
  });

  it("keeps author taxonomy children and still marks the kit", () => {
    let project = narrative.createProject("kit-channel-merge", {
      entitiesSource: `@jogador.{ tags: agent; }
start()
`,
      taxonomySource: "channel → abstract\ncustom → object\n",
      rulesSource: `# start
ON: start
narrativa: "ok"
`,
    });
    project = kit.apply(project);
    assert.equal((project.taxonomySource.match(/^channel\s*→/gm) ?? []).length, 1);
    assert.ok(project.taxonomySource.includes("economia"));
    assert.ok(project.taxonomySource.includes("custom"));
    assert.ok(kit.applied(project));
    const compiled = narrative.compileProject(project);
    assert.equal(compiled.errors.length, 0);
  });

  it("does not alter official examples", () => {
    const cave = createExampleProject("goblin-cave");
    assert.equal(kit.applied(cave), false);
    const compiled = narrative.compileProject(cave);
    assert.equal(compiled.errors.length, 0);
  });
});
