import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createExampleProject } from "./examples.ts";
import { compileProject, createProject } from "./project.ts";
import { applyChanges, compileRuleFile, parseDoLine, parseRuleBlock } from "./rule-engine.ts";
import { bootGame, createGame, interactWith } from "./runtime.ts";
import { compileEntityFile } from "./world-model.ts";

describe("DO verbs: parse", () => {
  it("keeps existing change lines unchanged", () => {
    const parsed = parseDoLine("@jogador.medo+2");
    assert.equal(parsed.effect, undefined);
    assert.equal(parsed.change?.fields[0]?.kind, "deltaStat");
  });

  it("parses DO stat minus another entity stat", () => {
    const parsed = parseDoLine("$.hp-@jogador.force");
    assert.equal(parsed.effect, undefined);
    assert.deepEqual(parsed.change?.target, { kind: "trigger" });
    assert.deepEqual(parsed.change?.fields[0], {
      kind: "deltaStatFrom",
      key: "hp",
      sign: -1,
      from: { kind: "id", id: "@jogador" },
      stat: "force",
    });
  });

  it("parses DO link lookup as change target and setLink value", () => {
    const drop = parseDoLine("$.current_location=(link @jogador.current_location)");
    assert.equal(drop.effect, undefined);
    assert.deepEqual(drop.change?.target, { kind: "trigger" });
    assert.deepEqual(drop.change?.fields[0], {
      kind: "setLink",
      key: "current_location",
      value: { kind: "linkLookup", entityId: "@jogador", key: "current_location" },
    });

    const put = parseDoLine("(link @jogador.intent_object).current_location=$");
    assert.deepEqual(put.change?.target, { kind: "linkLookup", entityId: "@jogador", key: "intent_object" });
    assert.deepEqual(put.change?.fields[0], {
      kind: "setLink",
      key: "current_location",
      value: { kind: "trigger" },
    });
  });

  it("parses CREATE, DESTROY, EMIT, INTENT, KNOW and SEMANTIC", () => {
    const rule = parseRuleBlock(`# porta
ON: @porta
IF: @jogador.intent=open
DO: CREATE @fumaca.event.current_location=$
    DESTROY @trava
    EMIT porta_aberta
    KNOW @jogador.@porta
    INTENT @goblin.attack.@jogador
    @porta.aberta
SEMANTIC: agency, constraint, transformation
narrativa: "abre"
`);
    assert.equal(rule.changes.length, 3);
    assert.equal(rule.changes[0]?.fields[0]?.kind, "createEntity");
    assert.equal(rule.changes[1]?.fields[0]?.kind, "destroyEntity");
    assert.equal(rule.changes[2]?.fields[0]?.kind, "addTag");
    assert.deepEqual(
      rule.effects.map((e) => e.verb),
      ["emit", "know", "intent"],
    );
    assert.deepEqual(rule.effects[0]?.args, ["porta_aberta"]);
    assert.deepEqual(rule.effects[1]?.args, ["@jogador", "@porta"]);
    assert.deepEqual(rule.effects[2]?.args, ["@goblin", "attack", "@jogador"]);
    assert.deepEqual(rule.semantics, ["agency", "constraint", "transformation"]);
  });

  it("parses FUNCAO and voice-indexed narrativa without changing SEMANTIC", () => {
    const rule = parseRuleBlock(`# porta
ON: @porta
IF: @jogador.intent=open
FUNCAO: curse
narrativa: "A porta abre."
narrativa: somber: "A porta range."
SEMANTIC: agency
`);
    assert.equal(rule.funcao, "curse");
    assert.equal(rule.narrative, "A porta abre.");
    assert.equal(rule.voices.somber, "A porta range.");
    assert.deepEqual(rule.semantics, ["agency"]);
  });

  it("parses WAIT with turns.id and TICK with no args", () => {
    const wait = parseDoLine("WAIT 3.FUSE_PORTA");
    assert.equal(wait.change, undefined);
    assert.deepEqual(wait.effect, {
      verb: "wait",
      args: ["3", "FUSE_PORTA"],
      source: "WAIT 3.FUSE_PORTA",
      line: 1,
    });

    const tick = parseDoLine("TICK");
    assert.equal(tick.change, undefined);
    assert.deepEqual(tick.effect, { verb: "tick", args: [], source: "TICK", line: 1 });

    assert.throws(() => parseDoLine("WAIT"));
  });

  it("parses THEN id and THEN $", () => {
    const thenId = parseDoLine("THEN @corredor");
    assert.equal(thenId.change, undefined);
    assert.deepEqual(thenId.effect, { verb: "then", args: ["@corredor"], source: "THEN @corredor", line: 1 });
    const thenTrigger = parseDoLine("THEN $");
    assert.deepEqual(thenTrigger.effect?.args, ["$"]);
    assert.throws(() => parseDoLine("THEN"));
  });

  it("parses LIVE id and LIVE with no args", () => {
    const liveId = parseDoLine("LIVE @goblin");
    assert.equal(liveId.change, undefined);
    assert.deepEqual(liveId.effect, { verb: "live", args: ["@goblin"], source: "LIVE @goblin", line: 1 });
    const liveBare = parseDoLine("LIVE");
    assert.deepEqual(liveBare.effect, { verb: "live", args: [], source: "LIVE", line: 1 });
  });
});

describe("DO verbs: applyChanges CREATE/DESTROY", () => {
  it("spawns and removes entities; $ becomes the trigger", () => {
    const world = compileEntityFile(`@sala.{ tags: place; stats: ; links: ; }\n@trava.{ tags: object; stats: ; links: current_location=@sala; }`).worldModel;
    const created = parseDoLine("CREATE @fumaca.event.current_location=$").change!;
    const destroyed = parseDoLine("DESTROY @trava").change!;
    const next = applyChanges(world, [created, destroyed], "@sala");
    const smoke = next.get("@fumaca");
    assert.ok(smoke);
    assert.ok(smoke.tags.has("event"));
    assert.equal(smoke.links.current_location, "@sala");
    assert.equal(next.get("@trava"), undefined);
    assert.ok(world.get("@trava"));
  });

  it("resolves (link id.key) when applying drop/put changes", () => {
    const world = compileEntityFile(`@jogador.{ tags: agent; stats: ; links: current_location=@sala, intent_object=@espada; }
@sala.{ tags: place; stats: ; links: ; }
@espada.{ tags: object; stats: ; links: current_location=@jogador; }
@caixa.{ tags: object, container; stats: ; links: current_location=@sala; }
`).worldModel;
    const dropped = applyChanges(world, [parseDoLine("$.current_location=(link @jogador.current_location)").change!], "@espada");
    assert.equal(dropped.get("@espada")?.links.current_location, "@sala");

    const put = applyChanges(world, [parseDoLine("(link @jogador.intent_object).current_location=$").change!], "@caixa");
    assert.equal(put.get("@espada")?.links.current_location, "@caixa");
    assert.equal(world.get("@espada")?.links.current_location, "@jogador");
  });

  it("does not reset an entity that already exists", () => {
    const world = compileEntityFile(`@fumaca.{ tags: event, old; stats: ; links: ; }`).worldModel;
    const created = parseDoLine("CREATE @fumaca.event").change!;
    const next = applyChanges(world, [created], "@fumaca");
    assert.ok(next.get("@fumaca")?.tags.has("old"));
  });
});

describe("DO verbs: interact", () => {
  it("applies CREATE/DESTROY through interactWith", () => {
    const compiled = compileProject(createProject("t", {
      entitiesSource: `@sala.{ tags: place; stats: ; links: ; }\n@trava.{ tags: object; stats: ; links: current_location=@sala; }\nstart()\n`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# acende
ON: @sala
DO: CREATE @fumaca.event.current_location=$
    DESTROY @trava
narrativa: "fumaca"
`,
    }));
    assert.equal(compiled.errors.length, 0);
    let game = createGame(compiled.worldModel, compiled.rules);
    game = bootGame(game);
    game = interactWith(game, "@sala");
    assert.ok(game.worldModel.get("@fumaca"));
    assert.equal(game.worldModel.get("@trava"), undefined);
  });

  it("does not change goblin-cave rules or match", () => {
    const project = createExampleProject("goblin-cave");
    const compiled = compileProject(project);
    assert.equal(compiled.errors.length, 0);
    for (const rule of compiled.rules) {
      assert.deepEqual(rule.effects, []);
      assert.deepEqual(rule.semantics, []);
    }
    let game = bootGame(createGame(compiled.worldModel, compiled.rules, project.settings.playerEntityId, compiled.taxonomy));
    const before = game.worldModel.get("@tocha")?.links.current_location;
    game = interactWith(game, "@tocha");
    assert.equal(before, "@entrada");
    assert.equal(game.worldModel.get("@tocha")?.links.current_location, "@jogador");
  });
});

describe("compileRuleFile", () => {
  it("accepts SEMANTIC without changing ON/IF/DO errors", () => {
    const { rules, errors } = compileRuleFile(`# x
ON: start
SEMANTIC: process
narrativa: "ok"
`);
    assert.equal(errors.length, 0);
    assert.deepEqual(rules[0]?.semantics, ["process"]);
  });
});
