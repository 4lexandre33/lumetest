import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileEntityFile } from "../../lib/world-model.ts";
import { mutationGateway } from "../../../mutation-gateway/index.ts";
import { worldPort } from "../../lib/world-port.ts";

const prose = "Ela entrou.\nO goblin ficou.";

function goblin() {
  const compiled = compileEntityFile("@goblin.{ tags: agent; stats: hp=1; hardLinks: ; }\n@sala.{ tags: place; }");
  assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
  return compiled.worldModel;
}

describe("fase 4", () => {
  it("a porta lê e escreve o mundo sem tocar no texto", () => {
    const port = worldPort(goblin());
    assert.equal(port.read("@goblin")?.stats.hp, 1);
    assert.deepEqual(port.query((entity) => entity.tags.has("place")).map((entity) => entity.id), ["@sala"]);
    assert.equal(port.relate("@goblin", "lugar", "@sala", "hard"), true);
    assert.equal(port.read("@goblin")?.hardLinks.lugar, "@sala");
    assert.equal(port.unrelate("@goblin", "lugar"), true);
    assert.equal(port.read("@goblin")?.hardLinks.lugar, undefined);
    port.destroy("@sala");
    assert.equal(port.read("@sala"), undefined);
    assert.equal(prose, "Ela entrou.\nO goblin ficou.");
  });

  it("valida, a política aplica ou não, e desfazer não mexe no texto", () => {
    const port = worldPort(goblin());
    const gate = mutationGateway(port);
    const applied = gate.submit("SET_STAT @goblin.hp 4", prose);
    assert.equal(applied.ok, true);
    assert.equal(applied.prose, prose);
    assert.equal(applied.world.get("@goblin")?.stats.hp, 4);
    const undone = applied.undo?.();
    assert.equal(undone?.world.get("@goblin")?.stats.hp, 1);
    assert.equal(undone?.prose, prose);
    assert.equal(port.read("@goblin")?.stats.hp, 1);

    const refused = mutationGateway(worldPort(goblin()), { allow: (line) => !line.startsWith("DESTROY") })
      .submit("DESTROY @goblin", prose);
    assert.equal(refused.ok, false);
    assert.equal(refused.error, "política recusou");
    assert.equal(refused.world.get("@goblin")?.stats.hp, 1);
    assert.equal(refused.prose, prose);
    assert.equal(refused.undo, undefined);

    const effect = gate.submit("KNOW @goblin.segredo", prose);
    assert.equal(effect.ok, false);
    assert.equal(effect.error, "do: não é mutação de mundo");
    assert.equal(effect.prose, prose);

    const broken = gate.submit("SET_STAT", prose);
    assert.equal(broken.ok, false);
    assert.equal(broken.prose, prose);
    assert.equal(port.read("@goblin")?.stats.hp, 1);
  });
});
