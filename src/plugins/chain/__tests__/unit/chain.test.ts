import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createCore, type Core } from "../../../../core/index.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin } from "../../../narrative-engine/index.ts";
import type { NarrativeEngineService } from "../../../narrative-engine/types.ts";
import { createExampleProject } from "../../../narrative-engine/lib/examples.ts";
import { WORLD_EVENTS_MANIFEST, createWorldEventsPlugin } from "../../../world-events/index.ts";
import { CHAIN_MANIFEST, createChainPlugin } from "../../index.ts";
import type { ChainService } from "../../types.ts";

describe("Chain", () => {
  let core: Core;
  let narrative: NarrativeEngineService;
  let chain: ChainService;

  beforeEach(async () => {
    core = createCore();
    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    core.registerPlugin(WORLD_EVENTS_MANIFEST, createWorldEventsPlugin);
    core.registerPlugin(CHAIN_MANIFEST, createChainPlugin);
    await core.activatePlugin("lume-narrative-engine");
    await core.activatePlugin("lume-world-events");
    await core.activatePlugin("lume-chain");
    narrative = core.getService<NarrativeEngineService>("NarrativeEngine");
    chain = core.getService<ChainService>("Chain");
  });

  it("declares Chain and requires RuleEffects", () => {
    assert.equal(CHAIN_MANIFEST.name, "lume-chain");
    assert.ok(CHAIN_MANIFEST.capabilities?.provides?.some((c) => c.name === "Chain"));
    assert.ok(CHAIN_MANIFEST.requires?.mandatory?.some((c) => c.name === "RuleEffects"));
    assert.ok(chain.follow);
  });

  it("THEN interacts an existing entity without tagging it event", () => {
    const project = narrative.createProject("then", {
      entitiesSource: `@porta.{ tags: object; stats: ; links: ; }
@corredor.{ tags: place; stats: ; links: ; name: Corredor; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# abre
ON: @porta
DO: @porta.aberta
    THEN @corredor
narrativa: "abre"

# olhar
ON: @corredor
narrativa: "O corredor continua."
`,
    });
    const compiled = narrative.compileProject(project);
    assert.equal(compiled.errors.length, 0);
    let game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules));
    game = narrative.interact(game, "@porta");
    assert.equal(game.worldModel.get("@porta")?.tags.has("aberta"), true);
    assert.equal(game.worldModel.get("@corredor")?.tags.has("event"), false);
    assert.ok(game.history.some((beat) => beat.triggerId === "@porta"));
    assert.ok(game.history.some((beat) => beat.triggerId === "@corredor"));
    assert.match(game.history.find((beat) => beat.triggerId === "@corredor")!.story, /corredor/);
  });

  it("THEN $ reuses the trigger and does not spawn", () => {
    const project = narrative.createProject("dollar", {
      entitiesSource: `@sino.{ tags: object; stats: toques=0; links: ; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# primeiro
ON: @sino
IF: @sino.toques=0
DO: @sino.toques=1
    THEN $
narrativa: "toca"

# eco
ON: @sino
IF: @sino.toques=1
DO: @sino.toques=2
narrativa: "eco"
`,
    });
    const compiled = narrative.compileProject(project);
    let game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules));
    game = narrative.interact(game, "@sino");
    assert.equal(game.worldModel.get("@sino")?.stats.toques, 2);
    assert.equal(game.worldModel.has("@sino"), true);
    assert.ok(game.history.filter((beat) => beat.triggerId === "@sino").length >= 2);
  });

  it("THEN is not EMIT: no event entity appears", () => {
    const project = narrative.createProject("nao-evento", {
      entitiesSource: `@botao.{ tags: object; stats: ; links: ; }
@alarme.{ tags: object; stats: ; links: ; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# aperta
ON: @botao
DO: THEN @alarme
narrativa: "clica"

# soa
ON: @alarme
narrativa: "soa"
`,
    });
    const compiled = narrative.compileProject(project);
    let game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules));
    game = narrative.interact(game, "@botao");
    assert.equal(game.worldModel.get("@alarme")?.tags.has("event"), false);
    assert.ok(game.history.some((beat) => beat.triggerId === "@alarme"));
  });

  it("caps recursive THEN with the same depth as EMIT", () => {
    const project = narrative.createProject("loop", {
      entitiesSource: `@x.{ tags: object; stats: ; links: ; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# loop
ON: @x
DO: THEN @x
narrativa: "x"
`,
    });
    const compiled = narrative.compileProject(project);
    let game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules));
    game = narrative.interact(game, "@x");
    assert.ok(game.history.filter((beat) => beat.triggerId === "@x").length <= 5);
  });

  it("dry-run lists THEN without following", () => {
    const project = narrative.createProject("seco", {
      entitiesSource: `@porta.{ tags: object; stats: ; links: ; }
@corredor.{ tags: place; stats: ; links: ; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# abre
ON: @porta
DO: @porta.aberta
    THEN @corredor
narrativa: "abre"
`,
    });
    const compiled = narrative.compileProject(project);
    const game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules));
    const report = narrative.dryRun(game, "@porta");
    assert.deepEqual(
      report.effects.map((effect) => effect.verb),
      ["then"],
    );
    assert.equal(game.history.some((beat) => beat.triggerId === "@corredor"), false);
    assert.equal(game.worldModel.get("@porta")?.tags.has("aberta"), false);
  });

  it("does not change goblin-cave play", () => {
    const project = createExampleProject("goblin-cave");
    const compiled = narrative.compileProject(project);
    assert.equal(compiled.errors.length, 0);
    let game = narrative.bootGame(
      narrative.createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy),
    );
    game = narrative.interact(game, "@goblin");
    assert.equal(game.worldModel.get("@goblin")?.tags.has("sleeping"), false);
  });
});
