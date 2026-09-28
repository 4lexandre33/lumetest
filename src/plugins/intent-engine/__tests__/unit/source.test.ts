import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileProject } from "../../../narrative-engine/index.ts";
import { createExampleProject } from "../../../narrative-engine/index.ts";
import { createGame, interactWith } from "../../../narrative-engine/index.ts";
import { query } from "../../../narrative-engine/index.ts";
import type { GameState } from "../../../narrative-engine/types.ts";
import { executeIntent, resolveIntent, suggestIntent, type QueryFn } from "../../lib/index.ts";

const q: QueryFn = (matcher, world, triggerId, taxonomy) =>
  query(matcher, world, triggerId, taxonomy, "effective").map(([id]) => id);

function goblinGame(): GameState {
  const compiled = compileProject(createExampleProject("goblin-cave"));
  assert.equal(compiled.errors.length, 0);
  return createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy);
}

function npc(actor: string) {
  return { source: "npc" as const, actor };
}

function execute(text: string, game: GameState, options?: { source?: "player" | "button" | "npc" | "script"; actor?: string }) {
  return executeIntent(text, game, q, interactWith, options);
}

describe("NPC and script sources", () => {
  it("keeps source and actor on the same Intent", () => {
    const game = goblinGame();
    const npcIntent = resolveIntent("intent.perceive.observe.local", game, q, npc("@goblin"));
    assert.equal(npcIntent.intent.source, "npc");
    assert.equal(npcIntent.intent.actor, "@goblin");
    assert.equal(npcIntent.status, "VALID");

    const scripted = resolveIntent("intent.action.interact.take.@tocha", game, q, { source: "script", actor: "@jogador" });
    assert.equal(scripted.intent.source, "script");
    assert.equal(scripted.intent.actor, "@jogador");
    assert.equal(scripted.status, "VALID");
  });

  it("resolves the world from the NPC's location, not the player's", () => {
    const game = goblinGame();
    assert.equal(game.worldModel.get("@jogador")?.links.current_location, "@entrada");
    assert.equal(game.worldModel.get("@goblin")?.links.current_location, "@caverna");

    assert.equal(resolveIntent("intent.action.interact.take.@tocha", game, q, npc("@goblin")).status, "TARGET_UNAVAILABLE");
    assert.equal(resolveIntent("intent.action.interact.take.@ouro", game, q, npc("@goblin")).status, "VALID");
    assert.equal(resolveIntent("intent.action.interact.take.@ouro", game, q).status, "TARGET_UNAVAILABLE");

    const take = suggestIntent("intent.action.interact.take.", game, q, npc("@goblin")).map((s) => s.token);
    assert.deepEqual(take, ["@ouro"]);
  });

  it("lets an NPC observe the cave without moving the player or waking itself", () => {
    const game = goblinGame();
    const result = execute("intent.perceive.observe.local", game, npc("@goblin"));
    assert.equal(result.executed, true);
    assert.equal(result.resolution.intent.source, "npc");
    assert.equal(result.resolution.intent.actor, "@goblin");
    assert.match(result.game.story, /Caverna/i);
    assert.match(result.game.story, /ouro/i);
    assert.doesNotMatch(result.game.story, /Boca da caverna/i);
    assert.equal(result.game.worldModel.get("@jogador")?.links.current_location, "@entrada");
    assert.equal(result.game.worldModel.get("@goblin")?.tags.has("sleeping"), true);
  });

  it("runs a scripted player command through the same execute path", () => {
    const game = goblinGame();
    const result = execute("intent.action.interact.take.@tocha", game, { source: "script", actor: "@jogador" });
    assert.equal(result.executed, true);
    assert.equal(result.resolution.intent.source, "script");
    assert.equal(result.game.worldModel.get("@tocha")?.links.current_location, "@jogador");
    assert.equal(game.worldModel.get("@tocha")?.links.current_location, "@entrada");
  });

  it("only lets the goblin talk to the player when they share a place", () => {
    const game = goblinGame();
    assert.equal(resolveIntent("intent.action.interact.talk.@jogador", game, q, npc("@goblin")).status, "TARGET_UNAVAILABLE");

    game.worldModel.get("@jogador")!.links.current_location = "@caverna";
    const talked = resolveIntent("intent.action.interact.talk.@jogador", game, q, npc("@goblin"));
    assert.equal(talked.status, "VALID");
    assert.equal(talked.resolvedArgs?.target, "@jogador");
  });
});
