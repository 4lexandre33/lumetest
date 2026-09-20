import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createCore, type Core } from "../../../../core/index.ts";
import { WorldEventOccurredEvent } from "../../../../core/contracts/typed-event.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin } from "../../../narrative-engine/index.ts";
import type { GameState, NarrativeEngineService } from "../../../narrative-engine/types.ts";
import { createExampleProject } from "../../../narrative-engine/lib/examples.ts";
import { WORLD_EVENTS_MANIFEST, createWorldEventsPlugin } from "../../../world-events/index.ts";
import { KNOWLEDGE_MANIFEST, createKnowledgePlugin } from "../../../knowledge/index.ts";
import { knowledgeTag } from "../../../knowledge/lib/store.ts";
import { DRY_RUN_MANIFEST, createDryRunPlugin } from "../../index.ts";
import type { DryRunService } from "../../types.ts";

function snapWorld(state: GameState) {
  return [...state.worldModel.entries()].map(([id, entity]) => [
    id,
    {
      tags: [...entity.tags].sort(),
      stats: { ...entity.stats },
      links: { ...entity.links },
    },
  ]);
}

function fingerprint(state: GameState) {
  return {
    world: snapWorld(state),
    history: state.history.length,
    story: state.story,
    ruleCounts: { ...state.ruleCounts },
    lastInteractionId: state.lastInteractionId,
    lastRuleId: state.lastRule?.id ?? null,
  };
}

describe("Dry-run", () => {
  let core: Core;
  let dryRun: DryRunService;
  let narrative: NarrativeEngineService;

  beforeEach(async () => {
    core = createCore();
    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    core.registerPlugin(WORLD_EVENTS_MANIFEST, createWorldEventsPlugin);
    core.registerPlugin(KNOWLEDGE_MANIFEST, createKnowledgePlugin);
    core.registerPlugin(DRY_RUN_MANIFEST, createDryRunPlugin);
    await core.activatePlugin("lume-narrative-engine");
    await core.activatePlugin("lume-world-events");
    await core.activatePlugin("lume-knowledge");
    await core.activatePlugin("lume-dry-run");
    dryRun = core.getService<DryRunService>("DryRun");
    narrative = core.getService<NarrativeEngineService>("NarrativeEngine");
  });

  it("declares DryRun capability", () => {
    assert.equal(DRY_RUN_MANIFEST.name, "lume-dry-run");
    assert.ok(DRY_RUN_MANIFEST.capabilities?.provides?.some((c) => c.name === "DryRun"));
    assert.ok(DRY_RUN_MANIFEST.requires?.mandatory?.some((c) => c.name === "NarrativeEngine"));
  });

  it("reports the winner and story without mutating the live game", () => {
    const project = narrative.createProject("porta", {
      entitiesSource: `@porta.{ tags: object; stats: ; links: ; name: Porta; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# abrir
ON: @porta
DO: @porta.aberta
narrativa: "A porta cede."
`,
    });
    const compiled = narrative.compileProject(project);
    assert.equal(compiled.errors.length, 0);
    const game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules));
    const before = fingerprint(game);
    const report = dryRun.dryRun(game, "@porta");
    assert.equal(report.matched, true);
    assert.equal(report.ruleId, "abrir");
    assert.equal(report.wouldMutate, true);
    assert.ok(report.candidates.some((c) => c.ruleId === "abrir"));
    assert.match(report.story, /cede/);
    assert.deepEqual(report.worldDiff.changed.find((c) => c.id === "@porta")?.tagsAdded, ["aberta"]);
    assert.equal(game.worldModel.get("@porta")?.tags.has("aberta"), false);
    assert.deepEqual(fingerprint(game), before);
  });

  it("puts CREATE and DESTROY in the diff and leaves the original world intact", () => {
    const project = narrative.createProject("fumo", {
      entitiesSource: `@sala.{ tags: place; stats: ; links: ; }
@trava.{ tags: object; stats: ; links: current_location=@sala; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# fumaca
ON: @sala
DO: CREATE @fumaca.event.current_location=$
    DESTROY @trava
narrativa: "fuma"
`,
    });
    const compiled = narrative.compileProject(project);
    const game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules));
    const report = dryRun.dryRun(game, "@sala");
    assert.deepEqual(report.worldDiff.created, ["@fumaca"]);
    assert.deepEqual(report.worldDiff.destroyed, ["@trava"]);
    assert.equal(game.worldModel.has("@trava"), true);
    assert.equal(game.worldModel.has("@fumaca"), false);
    const played = narrative.interact(game, "@sala");
    assert.equal(played.worldModel.has("@fumaca"), true);
    assert.equal(played.worldModel.has("@trava"), false);
    assert.equal(game.worldModel.has("@trava"), true);
  });

  it("reports no match without writing history or ruleCounts", () => {
    const project = narrative.createProject("nada", {
      entitiesSource: `@pedra.{ tags: object; stats: ; links: ; name: Pedra; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"
`,
    });
    const compiled = narrative.compileProject(project);
    const game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules));
    const before = fingerprint(game);
    const report = dryRun.dryRun(game, "@pedra");
    assert.equal(report.matched, false);
    assert.equal(report.ruleId, null);
    assert.equal(report.wouldMutate, false);
    assert.deepEqual(report.changes, []);
    assert.deepEqual(report.effects, []);
    assert.match(report.story, /Pedra/);
    assert.deepEqual(fingerprint(game), before);
  });

  it("lists EMIT and KNOW but does not run them", async () => {
    const seen: string[] = [];
    core.on(WorldEventOccurredEvent, (evt) => {
      seen.push(evt.data.eventId);
    });
    const project = narrative.createProject("efeitos", {
      entitiesSource: `@botao.{ tags: object; stats: ; links: ; }
@jogador.{ tags: agent; stats: ; links: ; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# tocar
ON: @botao
DO: EMIT acordou
    KNOW @jogador.@botao
    @botao.usado
narrativa: "soa"

# eco
ON: acordou
narrativa: "eco"
`,
    });
    const compiled = narrative.compileProject(project);
    const game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules, "@jogador"));
    const report = dryRun.dryRun(game, "@botao");
    assert.deepEqual(
      report.effects.map((e) => e.verb),
      ["emit", "know"],
    );
    assert.deepEqual(report.worldDiff.changed.find((c) => c.id === "@botao")?.tagsAdded, ["usado"]);
    assert.equal(game.worldModel.has("acordou"), false);
    assert.equal(game.worldModel.get("@jogador")?.tags.has(knowledgeTag("@botao")), false);
    assert.equal(game.history.some((b) => b.triggerId === "acordou"), false);
    await Promise.resolve();
    assert.equal(seen.length, 0);

    const played = narrative.interact(game, "@botao");
    assert.equal(played.worldModel.has("acordou"), true);
    assert.equal(played.worldModel.get("@jogador")?.tags.has(knowledgeTag("@botao")), true);
    await Promise.resolve();
    assert.equal(seen.includes("acordou"), true);
  });

  it("predicts the goblin-cave poke and leaves the official example unplayed", () => {
    const project = createExampleProject("goblin-cave");
    const compiled = narrative.compileProject(project);
    assert.equal(compiled.errors.length, 0);
    const game = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    const before = fingerprint(game);
    const report = dryRun.dryRun(game, "@goblin");
    assert.equal(report.matched, true);
    assert.ok(report.worldDiff.changed.find((c) => c.id === "@goblin")?.tagsRemoved.includes("sleeping"));
    assert.equal(game.worldModel.get("@goblin")?.tags.has("sleeping"), true);
    assert.deepEqual(fingerprint(game), before);

    const played = narrative.interact(game, "@goblin");
    assert.equal(played.worldModel.get("@goblin")?.tags.has("sleeping"), false);
    assert.equal(played.worldModel.get("@jogador")?.stats.fear, 9);
    const predictedFear = report.worldDiff.changed.find((c) => c.id === "@jogador")?.stats.find((s) => s.key === "fear");
    assert.equal(predictedFear?.to, 9);
    assert.equal(game.worldModel.get("@goblin")?.tags.has("sleeping"), true);
  });
});
