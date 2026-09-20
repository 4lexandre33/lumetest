import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createCore, type Core } from "../../../../core/index.ts";
import { VOCAB_MANIFEST, createVocabPlugin, lookup, lines, fold, intentLeaf, PLAYER_REF, lineWarning, MAX_LINE_TOKENS, addLine, warnings } from "../../index.ts";
import type { VocabService } from "../../types.ts";

describe("Vocab", () => {
  let core: Core;
  let vocab: VocabService;

  beforeEach(async () => {
    core = createCore();
    core.registerPlugin(VOCAB_MANIFEST, createVocabPlugin);
    await core.activatePlugin("lume-vocab");
    vocab = core.getService<VocabService>("Vocab");
  });

  it("declares Vocab and requires nothing", () => {
    assert.equal(VOCAB_MANIFEST.name, "lume-vocab");
    assert.ok(VOCAB_MANIFEST.capabilities?.provides?.some((c) => c.name === "Vocab"));
    assert.equal(VOCAB_MANIFEST.requires?.mandatory?.length, 0);
    assert.ok(vocab.lookup);
    assert.ok(vocab.lines);
  });

  it("lookup finds verbs and standard grammar lines", () => {
    assert.equal(vocab.lookup("pega")?.path, "action.interact.take");
    assert.equal(vocab.lookup("pega")?.flags.includes("verb"), true);
    assert.equal(lookup("Take")?.path, "action.interact.take");
    assert.equal(intentLeaf("pega"), "take");
    assert.equal(intentLeaf("examine"), "inspect");
    assert.equal(intentLeaf("dance"), null);
    const take = vocab.lines().find((line) => line.verb === "pegar");
    assert.deepEqual(take?.tokens, ["[algo]"]);
    assert.equal(take?.locale, "pt-BR");
    assert.equal(vocab.lines().some((line) => line.verb === "pick up"), false);
    assert.equal(vocab.lines().length, 29);
    assert.equal(fold("Péga"), "pega");
  });

  it("template: direction, number cache, me, specials; nlp still unused", () => {
    assert.equal(PLAYER_REF, "JOGADOR");
    assert.equal(vocab.lookup("norte")?.flags.includes("direction"), true);
    assert.equal(vocab.lookup("norte")?.direction, "norte");
    assert.equal(lookup("North")?.direction, "norte");
    assert.equal(lookup("17")?.number, 17);
    assert.equal(lookup("17")?.flags.includes("number"), true);
    assert.equal(lookup("vinte")?.number, 20);
    assert.equal(lookup("me")?.pronoun, "me");
    assert.equal(lookup("eu")?.pronoun, "me");
    assert.equal(lookup("the")?.descriptor, "def");
    assert.equal(lookup("again")?.flags.includes("special"), true);
    assert.equal(lookup("tudo")?.flags.includes("special"), true);
    assert.equal(lookup("undo")?.flags.includes("special"), true);
    assert.equal(lookup("pega")?.path, "action.interact.take");
    assert.equal(lookup("l")?.path, "action.look");
    assert.equal(lookup("l")?.flags.includes("direction"), true);
    assert.equal(vocab.lines().some((line) => line.verb === "pegar"), true);
  });

  it("W032 drops author lines over 8 tokens", () => {
    const before = lines().length;
    const fat = {
      verb: "autor",
      tokens: ["[algo]", "a", "b", "c", "d", "e", "f", "g", "[sítio]"],
      path: "action.look",
    };
    assert.equal(fat.tokens.length, MAX_LINE_TOKENS + 1);
    assert.equal(lineWarning(fat)?.code, "W032");
    assert.equal(addLine(fat), false);
    assert.equal(lines().length, before);
    assert.equal(warnings().some((warning) => warning.code === "W032"), true);
  });
});
