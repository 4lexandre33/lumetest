import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileProject } from "../../../narrative-engine/lib/project.ts";
import { createExampleProject } from "../../../narrative-engine/lib/examples.ts";
import { createGame, interactWith, rewindTo } from "../../../narrative-engine/lib/runtime.ts";
import { query } from "../../../narrative-engine/lib/query.ts";
import type { GameState } from "../../../narrative-engine/types.ts";
import { executeIntent, knownIdsFromHistory, type QueryFn } from "../../lib/index.ts";

const q: QueryFn = (matcher, world, triggerId, taxonomy) =>
  query(matcher, world, triggerId, taxonomy, "effective").map(([id]) => id);

function goblinGame(): GameState {
  const compiled = compileProject(createExampleProject("goblin-cave"));
  assert.equal(compiled.errors.length, 0);
  return createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy);
}

function movePlayer(game: GameState, place: string): GameState {
  const player = game.worldModel.get(game.playerEntityId);
  assert.ok(player);
  player.links.current_location = place;
  return game;
}

function execute(text: string, game: GameState) {
  return executeIntent(text, game, q, interactWith);
}

describe("PERCEIVE and COGNIZE", () => {
  it("inspects the torch without picking it up", () => {
    const game = goblinGame();
    const result = execute("intent.perceive.inspect.@tocha", game);
    assert.equal(result.executed, true);
    assert.match(result.game.story, /Tocha|tocha/i);
    assert.equal(result.game.worldModel.get("@tocha")?.links.current_location, "@entrada");
    assert.equal(game.worldModel.get("@tocha")?.links.current_location, "@entrada");
  });

  it("rejects inspect of the distant goblin", () => {
    const game = goblinGame();
    const result = execute("intent.perceive.inspect.@goblin", game);
    assert.equal(result.executed, false);
    assert.equal(result.resolution.status, "TARGET_UNAVAILABLE");
    assert.equal(result.game, game);
  });

  it("inspects the sleeping goblin in the cave without waking it", () => {
    const game = movePlayer(goblinGame(), "@caverna");
    const result = execute("intent.perceive.inspect.@goblin", game);
    assert.equal(result.executed, true);
    assert.equal(result.game.worldModel.get("@goblin")?.tags.has("sleeping"), true);
    assert.match(result.game.story, /Goblin|goblin/i);
  });

  it("remember then locate still works after leaving the cave", () => {
    let game = movePlayer(goblinGame(), "@caverna");
    const remembered = execute("intent.cognize.remember.@goblin", game);
    assert.equal(remembered.executed, true);
    assert.ok(knownIdsFromHistory(remembered.game).includes("@goblin"));
    assert.equal(remembered.game.worldModel.get("@goblin")?.tags.has("sleeping"), true);

    game = movePlayer(remembered.game, "@entrada");
    const located = execute("intent.perceive.locate.@goblin", game);
    assert.equal(located.executed, true);
    assert.match(located.game.story, /Caverna/i);
    assert.equal(located.game.worldModel.get("@jogador")?.links.current_location, "@entrada");
    assert.equal(located.game.worldModel.get("@goblin")?.links.current_location, "@caverna");
    assert.equal(located.game.worldModel.get("@goblin")?.tags.has("sleeping"), true);
  });

  it("evaluate and compare do not change tags or links", () => {
    const game = goblinGame();
    const evaluated = execute("intent.cognize.evaluate.@tocha", game);
    assert.equal(evaluated.executed, true);
    assert.match(evaluated.game.story, /Tocha|tocha/i);

    const compared = execute("intent.cognize.compare.@tocha.@isqueiro", evaluated.game);
    assert.equal(compared.executed, true);
    assert.match(compared.game.story, /compara/i);
    assert.equal(compared.game.worldModel.get("@tocha")?.links.current_location, "@entrada");
    assert.equal(compared.game.worldModel.get("@isqueiro")?.links.current_location, "@jogador");
  });

  it("decide records the option without touching the world", () => {
    const game = goblinGame();
    const result = execute("intent.cognize.decide.esperar", game);
    assert.equal(result.executed, true);
    assert.match(result.game.story, /esperar/i);
    assert.equal(result.game.worldModel.get("@jogador")?.links.current_location, "@entrada");
  });

  it("listen in the cave hears the sleeping goblin", () => {
    const game = movePlayer(goblinGame(), "@caverna");
    const result = execute("intent.perceive.listen", game);
    assert.equal(result.executed, true);
    assert.match(result.game.story, /ronco/i);
    assert.equal(result.game.worldModel.get("@goblin")?.tags.has("sleeping"), true);
  });

  it("rewind keeps a perceive beat instead of replaying it as a click", () => {
    const observed = execute("intent.perceive.observe.local", goblinGame());
    const taken = execute("intent.action.interact.take.@tocha", observed.game);
    assert.equal(taken.game.worldModel.get("@tocha")?.links.current_location, "@jogador");

    const rewound = rewindTo(taken.game, 0);
    assert.equal(rewound.history.length, 1);
    assert.match(rewound.story, /observa/i);
    assert.equal(rewound.worldModel.get("@tocha")?.links.current_location, "@entrada");
  });
});
