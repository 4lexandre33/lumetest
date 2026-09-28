import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  compileEntityFile,
  compileProject,
  createExampleProject,
  createGame,
  interactWith,
} from "../../../narrative-engine/index.ts";
import { definirPolitica, descerMutacao, type OrigemMutacao } from "../../../mutation-gateway/index.ts";
import { executeIntent, type QueryFn } from "../../../intent-engine/index.ts";
import { aplicarLinhaComando } from "../../lib/comando.ts";
import { query } from "../../../narrative-engine/index.ts";

describe("fase 10", () => {
  afterEach(() => definirPolitica(null));

  it("intent, comando e modelo descem à mesma gateway e à mesma política", () => {
    const gate = readFileSync(new URL("../../../mutation-gateway/lib/gateway.ts", import.meta.url), "utf8");
    assert.equal(gate.includes("descerModelo"), false);
    assert.equal(gate.includes('origem === "modelo"'), false);

    const world = compileEntityFile("@goblin.{ tags: agent; stats: hp=1; }").worldModel;
    const prose = "O goblin recua.";
    const seen: OrigemMutacao[] = [];
    definirPolitica({
      allow(_line, origem) {
        seen.push(origem);
        return false;
      },
    });

    const byModel = descerMutacao("modelo", "SET_STAT @goblin.hp 4", world, prose);
    const byIntent = descerMutacao("intent", "SET_STAT @goblin.hp 4", world, prose);
    assert.equal(byModel.ok, false);
    assert.equal(byIntent.ok, false);
    assert.equal(byModel.prose, prose);
    assert.equal(byModel.world.get("@goblin")?.stats.hp, 1);

    const page = "O goblin recua.\n> mut.flag.on @goblin ferido\n";
    const refused = aplicarLinhaComando(page, page.indexOf(">"), "@goblin.{ tags: agent; stats: hp=1; }");
    assert.equal(refused?.cartao.ok, false);
    assert.equal(refused?.anotacao, undefined);
    assert.equal(refused?.source, page);
    assert.deepEqual(seen, ["modelo", "intent", "comando"]);

    definirPolitica(null);
    const cave = compileProject(createExampleProject("goblin-cave"));
    const game = createGame(cave.worldModel, cave.rules, "@jogador", cave.taxonomy);
    const q: QueryFn = (matcher, world, triggerId, taxonomy) => query(matcher, world, triggerId, taxonomy, "effective").map(([id]) => id);
    definirPolitica({ allow: () => false });
    const blocked = executeIntent("intent.action.interact.take.@tocha", game, q, interactWith);
    assert.equal(blocked.executed, false);
    assert.equal(blocked.game.worldModel.get("@tocha")?.links.current_location, game.worldModel.get("@tocha")?.links.current_location);

    definirPolitica(null);
    const taken = executeIntent("intent.action.interact.take.@tocha", game, q, interactWith);
    assert.equal(taken.executed, true);
    assert.equal(taken.game.worldModel.get("@tocha")?.links.current_location, "@jogador");
  });
});
