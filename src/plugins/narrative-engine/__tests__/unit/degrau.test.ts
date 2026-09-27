import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectVocabulary, completeAt } from "../../lib/complete.ts";
import { compileEntityFile } from "../../lib/world-model.ts";
import { compileTaxonomy } from "../../lib/taxonomy.ts";

const source = `@guarda.{
  tags: guarda;
  stats: hp=10;
  flags: alerta=true;
  enums: posto=[SENTINELA, RONDA];
}
@escudeiro.{
  tags: escudeiro;
}
`;

function vocab() {
  const world = compileEntityFile(source).worldModel;
  return collectVocabulary({ worldModel: world, taxonomy: compileTaxonomy("escudeiro → guarda\n") });
}

describe("E3 degraus", () => {
  it("um ponto lista só o nível seguinte, com chave herdada marcada", () => {
    const words = vocab();
    const flags = completeAt("@escudeiro.{\n  flags.", "entities", "@escudeiro.{\n  flags.".length, words);
    assert.equal(flags.ctx.slot, "degrau");
    assert.ok(flags.items.some((item) => item.label === "alerta" && item.detail === "herdada"));
    assert.equal(flags.items.some((item) => item.label === "hp"), false);

    const own = completeAt("@guarda.{\n  flags.", "entities", "@guarda.{\n  flags.".length, words);
    assert.ok(own.items.some((item) => item.label === "alerta" && item.detail !== "herdada"));

    const values = completeAt("@guarda.{\n  flags.alerta.", "entities", "@guarda.{\n  flags.alerta.".length, words);
    assert.deepEqual(values.items.map((item) => item.label).sort(), ["false", "true"]);

    const states = completeAt("do: SET_ENUM @guarda.posto.", "rules", "do: SET_ENUM @guarda.posto.".length, words);
    assert.deepEqual(states.items.map((item) => item.label).sort(), ["RONDA", "SENTINELA"]);

    const verb = completeAt("do: .", "rules", "do: .".length, words);
    assert.ok(verb.items.some((item) => item.label === "SET_FLAG"));
    assert.equal(verb.items.some((item) => item.label === "TEM"), false);

    const who = completeAt("do: SET_FLAG.", "rules", "do: SET_FLAG.".length, words);
    assert.ok(who.items.some((item) => item.label === "@escudeiro"));
    assert.equal(who.items.some((item) => item.label === "hp"), false);

    const key = completeAt("do: SET_FLAG @escudeiro.", "rules", "do: SET_FLAG @escudeiro.".length, words);
    assert.ok(key.items.some((item) => item.label === "alerta" && item.detail === "herdada"));

    const legal = completeAt("do: SET_FLAG @escudeiro.alerta.", "rules", "do: SET_FLAG @escudeiro.alerta.".length, words);
    assert.deepEqual(legal.items.map((item) => item.label).sort(), ["false", "true"]);

    const on = completeAt("on: .", "rules", "on: .".length, words);
    assert.ok(on.items.some((item) => item.label === "@guarda"));
    assert.ok(on.items.some((item) => item.label === "*"));
    assert.equal(on.items.some((item) => item.label === "TEM"), false);
    assert.equal(on.items.some((item) => item.label === "hp"), false);

    const drawer = completeAt("on: @guarda.", "rules", "on: @guarda.".length, words);
    assert.ok(drawer.items.some((item) => item.label === "stats"));
    assert.equal(drawer.items.some((item) => item.label === "hp"), false);

    const stat = completeAt("on: @guarda.stats.", "rules", "on: @guarda.stats.".length, words);
    assert.ok(stat.items.some((item) => item.label === "hp"));
    assert.equal(stat.items.some((item) => item.label === "alerta"), false);

    const iff = completeAt("if: .", "rules", "if: .".length, words);
    assert.ok(iff.items.some((item) => item.label === "TEM"));
    assert.equal(iff.items.some((item) => item.label === "SET_FLAG"), false);

    const junk = completeAt("on: hello.", "rules", "on: hello.".length, words);
    assert.equal(junk.ctx.slot, "degrau");
    assert.equal(junk.items.length, 0);

    const plain = completeAt("on: ", "rules", 4, words);
    assert.equal(plain.ctx.slot, "selector");
    assert.ok(plain.items.some((item) => item.label === "TEM"));
  });
});
