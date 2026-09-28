import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createCore, type Core } from "../../../../core/index.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin } from "../../../narrative-engine/index.ts";
import type { NarrativeEngineService } from "../../../narrative-engine/types.ts";
import { createExampleProject } from "../../../narrative-engine/index.ts";
import { LIFE_MANIFEST, createLifePlugin, MAX_LIVE_PER_BEAT, VIVO_TAG } from "../../index.ts";
import type { LifeService } from "../../types.ts";

describe("Life", () => {
  let core: Core;
  let narrative: NarrativeEngineService;
  let life: LifeService;

  beforeEach(async () => {
    core = createCore();
    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    core.registerPlugin(LIFE_MANIFEST, createLifePlugin);
    await core.activatePlugin("lume-narrative-engine");
    await core.activatePlugin("lume-life");
    narrative = core.getService<NarrativeEngineService>("NarrativeEngine");
    life = core.getService<LifeService>("Life");
  });

  it("declares Life and requires RuleEffects", () => {
    assert.equal(LIFE_MANIFEST.name, "lume-life");
    assert.ok(LIFE_MANIFEST.capabilities?.provides?.some((c) => c.name === "Life"));
    assert.ok(LIFE_MANIFEST.requires?.mandatory?.some((c) => c.name === "RuleEffects"));
    assert.equal(life.tag, VIVO_TAG);
    assert.equal(life.maxPerBeat, MAX_LIVE_PER_BEAT);
    assert.ok(life.live);
  });

  it("LIVE id interacts an existing entity without tagging it event", () => {
    const project = narrative.createProject("live-id", {
      entitiesSource: `@porta.{ tags: object; stats: ; links: in=@caverna; }
@goblin.{ tags: agent, vivo; stats: ; links: in=@caverna; }
@caverna.{ tags: place; stats: ; links: ; }
@jogador.{ tags: agent; stats: ; links: in=@caverna; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# abre
ON: @porta
DO: @porta.aberta
    LIVE @goblin
narrativa: "abre"

# reage
ON: @goblin
DO: @goblin.alerta
narrativa: "O goblin reage."
`,
    });
    const compiled = narrative.compileProject(project);
    assert.equal(compiled.errors.length, 0);
    let game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    game = narrative.interact(game, "@porta");
    assert.equal(game.worldModel.get("@porta")?.tags.has("aberta"), true);
    assert.equal(game.worldModel.get("@goblin")?.tags.has("alerta"), true);
    assert.equal(game.worldModel.get("@goblin")?.tags.has("event"), false);
    assert.ok(game.history.some((beat) => beat.triggerId === "@porta"));
    assert.ok(game.history.some((beat) => beat.triggerId === "@goblin"));
    assert.match(game.history.find((beat) => beat.triggerId === "@goblin")!.story, /goblin/);
  });

  it("LIVE without args scans vivo here, not the player or trigger", () => {
    const project = narrative.createProject("live-scan", {
      entitiesSource: `@caverna.{ tags: place; stats: ; links: ; }
@jogador.{ tags: agent, vivo; stats: ; links: in=@caverna; }
@porta.{ tags: object, vivo; stats: ; links: in=@caverna; }
@goblin.{ tags: agent, vivo; stats: ; links: in=@caverna; }
@longe.{ tags: agent, vivo; stats: ; links: in=@floresta; }
@floresta.{ tags: place; stats: ; links: ; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# abre
ON: @porta
DO: @porta.aberta
    LIVE
narrativa: "abre"

# reage
ON: @goblin
DO: @goblin.alerta
narrativa: "reage"

# porta viva
ON: @porta
IF: @porta.alerta
DO: @porta.eco
narrativa: "eco"

# jogador
ON: @jogador
DO: @jogador.eco
narrativa: "eu"

# longe
ON: @longe
DO: @longe.alerta
narrativa: "longe"
`,
    });
    const compiled = narrative.compileProject(project);
    let game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    game = narrative.interact(game, "@porta");
    assert.equal(game.worldModel.get("@porta")?.tags.has("aberta"), true);
    assert.equal(game.worldModel.get("@goblin")?.tags.has("alerta"), true);
    assert.equal(game.worldModel.get("@jogador")?.tags.has("eco"), false);
    assert.equal(game.worldModel.get("@porta")?.tags.has("eco"), false);
    assert.equal(game.worldModel.get("@longe")?.tags.has("alerta"), false);
  });

  it("scans vivos in id order and keeps the prefix under the cap", () => {
    const project = narrative.createProject("live-ordem", {
      entitiesSource: `@caverna.{ tags: place; stats: ; links: ; }
@jogador.{ tags: agent; stats: ; links: in=@caverna; }
@porta.{ tags: object; stats: ; links: in=@caverna; }
@a.{ tags: agent, vivo; stats: ; links: in=@caverna; }
@b.{ tags: agent, vivo; stats: ; links: in=@caverna; }
@c.{ tags: agent, vivo; stats: ; links: in=@caverna; }
@d.{ tags: agent, vivo; stats: ; links: in=@caverna; }
@e.{ tags: agent, vivo; stats: ; links: in=@caverna; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# abre
ON: @porta
DO: LIVE
narrativa: "abre"

# a
ON: @a
DO: @a.reagiu
narrativa: "a"

# b
ON: @b
DO: @b.reagiu
narrativa: "b"

# c
ON: @c
DO: @c.reagiu
narrativa: "c"

# d
ON: @d
DO: @d.reagiu
narrativa: "d"

# e
ON: @e
DO: @e.reagiu
narrativa: "e"
`,
    });
    const compiled = narrative.compileProject(project);
    let game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    game = narrative.interact(game, "@porta");
    const reacted = ["@a", "@b", "@c", "@d", "@e"].filter((id) => game.worldModel.get(id)?.tags.has("reagiu"));
    assert.deepEqual(reacted, ["@a", "@b", "@c", "@d"]);
    const liveBeats = game.history.filter((beat) => ["@a", "@b", "@c", "@d", "@e"].includes(beat.triggerId)).map((beat) => beat.triggerId);
    assert.deepEqual(liveBeats, ["@a", "@b", "@c", "@d"]);
  });

  it("LIVE without vivo nearby does nothing extra", () => {
    const project = narrative.createProject("live-vazio", {
      entitiesSource: `@caverna.{ tags: place; stats: ; links: ; }
@jogador.{ tags: agent; stats: ; links: in=@caverna; }
@porta.{ tags: object; stats: ; links: in=@caverna; }
@goblin.{ tags: agent; stats: ; links: in=@caverna; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# abre
ON: @porta
DO: @porta.aberta
    LIVE
narrativa: "abre"

# reage
ON: @goblin
DO: @goblin.alerta
narrativa: "reage"
`,
    });
    const compiled = narrative.compileProject(project);
    let game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    game = narrative.interact(game, "@porta");
    assert.equal(game.worldModel.get("@porta")?.tags.has("aberta"), true);
    assert.equal(game.worldModel.get("@goblin")?.tags.has("alerta"), false);
    assert.equal(game.history.some((beat) => beat.triggerId === "@goblin"), false);
  });

  it("caps recursive LIVE with the same depth as EMIT", () => {
    const project = narrative.createProject("loop", {
      entitiesSource: `@x.{ tags: object; stats: ; links: ; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# loop
ON: @x
DO: LIVE @x
narrativa: "x"
`,
    });
    const compiled = narrative.compileProject(project);
    let game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules));
    game = narrative.interact(game, "@x");
    assert.ok(game.history.filter((beat) => beat.triggerId === "@x").length <= 5);
  });

  it("dry-run lists LIVE without following", () => {
    const project = narrative.createProject("seco", {
      entitiesSource: `@caverna.{ tags: place; stats: ; links: ; }
@jogador.{ tags: agent; stats: ; links: in=@caverna; }
@porta.{ tags: object; stats: ; links: in=@caverna; }
@goblin.{ tags: agent, vivo; stats: ; links: in=@caverna; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# abre
ON: @porta
DO: @porta.aberta
    LIVE
narrativa: "abre"

# reage
ON: @goblin
DO: @goblin.alerta
narrativa: "reage"
`,
    });
    const compiled = narrative.compileProject(project);
    const game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    const report = narrative.dryRun(game, "@porta");
    assert.deepEqual(
      report.effects.map((effect) => effect.verb),
      ["live"],
    );
    assert.equal(game.history.some((beat) => beat.triggerId === "@goblin"), false);
    assert.equal(game.worldModel.get("@porta")?.tags.has("aberta"), false);
    assert.equal(game.worldModel.get("@goblin")?.tags.has("alerta"), false);
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
