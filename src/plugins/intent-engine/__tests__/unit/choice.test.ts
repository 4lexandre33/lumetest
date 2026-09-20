import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileProject } from "../../../narrative-engine/lib/project.ts";
import { createExampleProject } from "../../../narrative-engine/lib/examples.ts";
import { createGame, interactWith } from "../../../narrative-engine/lib/runtime.ts";
import { query } from "../../../narrative-engine/lib/query.ts";
import type { GameState } from "../../../narrative-engine/types.ts";
import { commandFromChoice, executeIntent, type QueryFn } from "../../lib/index.ts";

const q: QueryFn = (matcher, world, triggerId, taxonomy) =>
  query(matcher, world, triggerId, taxonomy, "effective").map(([id]) => id);

function goblinGame(): GameState {
  const compiled = compileProject(createExampleProject("goblin-cave"));
  assert.equal(compiled.errors.length, 0);
  return createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy);
}

describe("commandFromChoice", () => {
  it("maps preview buttons to Intent commands", () => {
    const game = goblinGame();
    assert.equal(commandFromChoice(game, "@jogador"), null);
    assert.equal(commandFromChoice(game, "@entrada"), null);
    assert.equal(commandFromChoice(game, "@caverna"), "intent.action.move.@caverna");
    assert.equal(commandFromChoice(game, "@trilha"), "intent.action.move.@trilha");
    assert.equal(commandFromChoice(game, "@tocha"), "intent.action.interact.take.@tocha");
    assert.equal(commandFromChoice(game, "@isqueiro"), "intent.action.interact.use.@isqueiro");
    assert.equal(commandFromChoice(game, "@goblin"), "intent.action.interact.attack.@goblin");
    assert.equal(commandFromChoice(game, "missing"), null);
  });

  it("clicking the torch button executes take through the adapter", () => {
    const game = goblinGame();
    const command = commandFromChoice(game, "@tocha");
    assert.ok(command);
    const result = executeIntent(command, game, q, interactWith, { source: "button" });
    assert.equal(result.executed, true);
    assert.equal(result.resolution.intent.source, "button");
    assert.equal(result.game.worldModel.get("@tocha")?.links.current_location, "@jogador");
    assert.equal(game.worldModel.get("@tocha")?.links.current_location, "@entrada");
  });
});
