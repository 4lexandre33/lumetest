import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createCore, type Core } from "../../../../core/index.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin } from "../../../narrative-engine/index.ts";
import type { NarrativeEngineService } from "../../../narrative-engine/types.ts";
import { INTENT_ENGINE_MANIFEST, createIntentEnginePlugin } from "../../../intent-engine/index.ts";
import { AGENCY_MANIFEST, createAgencyPlugin } from "../../index.ts";
import { commandFromEffectArgs } from "../../lib/command.ts";
import type { AgencyService } from "../../types.ts";

describe("Agency", () => {
  it("maps INTENT args onto catalog commands", () => {
    assert.deepEqual(commandFromEffectArgs(["@goblin", "attack", "@jogador"]), {
      actor: "@goblin",
      command: "intent.action.interact.attack.@jogador",
    });
    assert.deepEqual(commandFromEffectArgs(["@jogador", "move", "@caverna"]), {
      actor: "@jogador",
      command: "intent.action.move.@caverna",
    });
    assert.deepEqual(commandFromEffectArgs(["@jogador", "observe", "local"]), {
      actor: "@jogador",
      command: "intent.perceive.observe.local",
    });
    assert.deepEqual(commandFromEffectArgs(["@goblin", "intent", "action", "wait"]), {
      actor: "@goblin",
      command: "intent.action.wait",
    });
    assert.deepEqual(commandFromEffectArgs(["@jogador", "go", "@sala"]), {
      actor: "@jogador",
      command: "intent.action.go.@sala",
    });
    assert.deepEqual(commandFromEffectArgs(["@jogador", "look"]), {
      actor: "@jogador",
      command: "intent.action.look",
    });
    assert.deepEqual(commandFromEffectArgs(["@jogador", "inventory"]), {
      actor: "@jogador",
      command: "intent.action.inventory",
    });
    assert.deepEqual(commandFromEffectArgs(["@jogador", "drop", "ESPADA"]), {
      actor: "@jogador",
      command: "intent.action.interact.drop.ESPADA",
    });
    assert.deepEqual(commandFromEffectArgs(["@jogador", "put", "ESPADA", "CAIXA"]), {
      actor: "@jogador",
      command: "intent.action.interact.put.ESPADA.CAIXA",
    });
    assert.deepEqual(commandFromEffectArgs(["@jogador", "ask", "@goblin", "CHAVE"]), {
      actor: "@jogador",
      command: "intent.action.interact.ask.@goblin.CHAVE",
    });
    assert.deepEqual(commandFromEffectArgs(["@jogador", "tell", "@goblin", "CHAVE"]), {
      actor: "@jogador",
      command: "intent.action.interact.tell.@goblin.CHAVE",
    });
    assert.deepEqual(commandFromEffectArgs(["@jogador", "bye", "@goblin"]), {
      actor: "@jogador",
      command: "intent.action.interact.bye.@goblin",
    });
  });

  let core: Core;
  let narrative: NarrativeEngineService;
  let agency: AgencyService;

  beforeEach(async () => {
    core = createCore();
    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    core.registerPlugin(INTENT_ENGINE_MANIFEST, createIntentEnginePlugin);
    core.registerPlugin(AGENCY_MANIFEST, createAgencyPlugin);
    await core.activatePlugin("lume-narrative-engine");
    await core.activatePlugin("lume-intent-engine");
    await core.activatePlugin("lume-agency");
    narrative = core.getService<NarrativeEngineService>("NarrativeEngine");
    agency = core.getService<AgencyService>("Agency");
  });

  it("INTENT in DO dispatches through IntentEngine with source script", () => {
    const project = narrative.createProject("agency", {
      entitiesSource: `@jogador.{ tags: agent; stats: ; links: current_location=@sala; }
@sala.{ tags: place; stats: ; links: ; }
@caverna.{ tags: place; stats: ; links: ; }
@sinal.{ tags: event; stats: ; links: ; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# mover
ON: *.place
DO: @jogador.current_location=$
narrativa: "foi a {$.name}"

# sinal
ON: @sinal
DO: INTENT @jogador.move.@caverna
narrativa: "sinal"
`,
    });
    const compiled = narrative.compileProject(project);
    assert.equal(compiled.errors.length, 0);
    let game = narrative.bootGame(
      narrative.createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy),
    );
    game = narrative.interact(game, "@sinal");
    assert.equal(game.worldModel.get("@jogador")?.links.current_location, "@caverna");
    assert.equal(game.worldModel.get("@jogador")?.links.intent, undefined);
    const mapped = agency.commandFromEffect(["@jogador", "move", "@caverna"]);
    assert.equal(mapped?.command, "intent.action.move.@caverna");
  });

  it("does not execute an invalid intent from a rule", () => {
    const project = narrative.createProject("fail", {
      entitiesSource: `@jogador.{ tags: agent; stats: ; links: current_location=@sala; }
@sala.{ tags: place; stats: ; links: ; }
@goblin.{ tags: agent; stats: ; links: current_location=@caverna; }
@caverna.{ tags: place; stats: ; links: ; }
@sinal.{ tags: event; stats: ; links: ; }
start()
`,
      taxonomySource: "goblin → monster\nmonster → agent\n",
      rulesSource: `# start
ON: start
narrativa: "ok"

# sinal
ON: @sinal
DO: INTENT @jogador.attack.@goblin
narrativa: "tenta"
`,
    });
    const compiled = narrative.compileProject(project);
    let game = narrative.bootGame(
      narrative.createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy),
    );
    const loc = game.worldModel.get("@jogador")!.links.current_location;
    game = narrative.interact(game, "@sinal");
    assert.equal(game.worldModel.get("@jogador")?.links.current_location, loc);
    assert.equal(game.worldModel.get("@goblin")?.links.current_location, "@caverna");
  });
});
