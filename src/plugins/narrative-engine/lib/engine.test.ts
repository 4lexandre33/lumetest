import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coerceProject, compileProject, createProject, fingerprintProject, projectFromCloudRow, toWireProject } from "./project.ts";
import { createExampleProject } from "./examples.ts";
import { bootGame, createGame, interactWith, rewindTo } from "./runtime.ts";
import { parseNarrative } from "./narrative.ts";
import { blankEntityBlock, compileEntityFile, isStartDecl, parseEntityLine, primaryTag } from "./world-model.ts";
import { applyChanges, compileRuleFile, findMatchingRule, parseChangeLine } from "./rule-engine.ts";
import { migrateLegacyTags } from "./types.ts";
import { fieldListShouldComma, insertRule, insertEntity } from "./source-ops.ts";
import { compileTaxonomy, effectiveTags, explainTagMatch, impactOfTag, inheritedTags, matchesTag, taxonomyForest } from "./taxonomy.ts";
import { explainMatcher, parseMatcher, query, specificityOf } from "./query.ts";
import { highlightSource } from "./highlight.ts";
import { analyzeCompletion, collectVocabulary, completeAt, tabAfterKeyword } from "./complete.ts";

describe("entity block", () => {
  it("parses tags, stats, links, name", () => {
    const e = parseEntityLine(`@jogador.{
tags: agent, personagem, casado;
stats: medo=10, vida=100;
links: current_location=@casa01, amor=@emanuele;
name: Você;
description: O jogador.
}`);
    assert.equal(e.id, "@jogador");
    assert.ok(e.tags.has("agent"));
    assert.ok(e.tags.has("casado"));
    assert.equal(e.stats.medo, 10);
    assert.equal(e.links.current_location, "@casa01");
    assert.equal(e.name, "Você");
    assert.ok(!e.tags.has("name"));
  });

  it("blankEntityBlock shape", () => {
    const b = blankEntityBlock("FOO");
    assert.match(b, /^@foo\.\{\n  id: #/);
    assert.match(b, /\n  name: ;/);
    assert.match(b, /\n  description: ;/);
    assert.match(b, /\n  tags: ;/);
    assert.match(b, /\n  stats: ;/);
    assert.match(b, /\n  flags: ;/);
    assert.match(b, /\n  enums: ;/);
    assert.match(b, /\n  phrases: ;/);
    assert.match(b, /\n  hardLinks: ;/);
    assert.match(b, /\n  softLinks: ;/);
    assert.match(b, /\n  lists: ;/);
    assert.match(b, /\n  fuses: ;/);
    assert.match(b, /\n  struct: ;/);
    const nameIdx = b.indexOf("name:");
    const tagsIdx = b.indexOf("tags:");
    assert.ok(nameIdx >= 0 && tagsIdx > nameIdx);
  });
});

describe("legacy tags", () => {
  it("does not rewrite current_location or quest_item", () => {
    const s = migrateLegacyTags("@tocha.item.current_location=@jogador.quest_item");
    assert.equal(s, "@tocha.object.current_location=@jogador.quest_item");
  });
});

describe("mulStat", () => {
  it("multiplies", () => {
    const world = compileEntityFile(`@jogador.{ tags: agent; stats: medo=3; links: ; }`).worldModel;
    const change = parseChangeLine("@jogador.medo*2");
    const next = applyChanges(world, [change], "@jogador");
    assert.equal(next.get("@jogador")?.stats.medo, 6);
  });
});

describe("narrative", () => {
  it("reads name from extra, not a tag", () => {
    const world = compileEntityFile(`@astronoma.{ tags: agent; stats: ; links: ; name: Astrônoma; }`).worldModel;
    const text = parseNarrative("A {@astronoma.name} não levanta a luneta.", { worldModel: world, triggerId: "@astronoma", cycleIndex: 0 });
    assert.equal(text, "A Astrônoma não levanta a luneta.");
  });

  it("cycles even when options contain periods", () => {
    const world = compileEntityFile(`@zelador.{ tags: agent; stats: ; links: ; }`).worldModel;
    const tpl = "{O zelador sacode um pano. 'A lente está aí.' | 'Não peço a chave.' | Ele já varreu o suficiente.}";
    const a = parseNarrative(tpl, { worldModel: world, triggerId: "@zelador", cycleIndex: 0 });
    const b = parseNarrative(tpl, { worldModel: world, triggerId: "@zelador", cycleIndex: 1 });
    const c = parseNarrative(tpl, { worldModel: world, triggerId: "@zelador", cycleIndex: 4 });
    assert.match(a, /pano/);
    assert.match(b, /chave/);
    assert.match(c, /varreu/);
  });

  it("{$.name} uses the trigger", () => {
    const world = compileEntityFile(`@tocha.{ tags: object; stats: ; links: ; name: Tocha; }`).worldModel;
    const text = parseNarrative("Você pega {$.name}.", { worldModel: world, triggerId: "@tocha", cycleIndex: 0 });
    assert.equal(text, "Você pega Tocha.");
  });
});

describe("examples compile and play", () => {
  it("planetarium start mentions the astronomer", () => {
    const project = createExampleProject("planetarium");
    const compiled = compileProject(project);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    const game = bootGame(createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    assert.match(game.story, /Astrônoma/);
  });

  it("goblin cave compiles", () => {
    const project = createExampleProject("goblin-cave");
    const compiled = compileProject(project);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    let game = bootGame(createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    game = interactWith(game, "@tocha");
    assert.match(game.story, /Tocha|pega/i);
  });

  it("blank project compiles", () => {
    const compiled = compileProject(createProject("x"));
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
  });
});

describe("field list comma", () => {
  it("inserts after a tag token", () => {
    const src = "@jogador.{\ntags: agent";
    assert.equal(fieldListShouldComma(src, src.length), true);
  });
  it("does not insert after colon space", () => {
    const src = "@jogador.{\ntags: ";
    assert.equal(fieldListShouldComma(src, src.length), false);
  });
});

describe("start()", () => {
  it("parses as hidden start entity", () => {
    assert.equal(isStartDecl("start()"), true);
    const e = parseEntityLine("start()");
    assert.equal(e.id, "start");
    assert.ok(e.tags.has("hidden"));
    assert.equal(blankEntityBlock("start"), "start()");
    const compiled = compileEntityFile("@jogador.{ tags: agent; stats: ; links: ; }\n\nstart()\n");
    assert.ok(compiled.worldModel.has("start"));
    assert.equal(compiled.errors.length, 0);
  });
  it("still accepts the old start block", () => {
    const e = parseEntityLine("start.{ tags: hidden; stats: ; links: ; }");
    assert.equal(e.id, "start");
    assert.ok(e.tags.has("hidden"));
  });
});

describe("rewind", () => {
  it("restores the world to a previous beat", () => {
    const project = createExampleProject("goblin-cave");
    const compiled = compileProject(project);
    let game = bootGame(createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    assert.equal(game.history.length, 1);
    game = interactWith(game, "@tocha");
    assert.equal(game.worldModel.get("@tocha")?.links.current_location, "@jogador");
    assert.equal(game.history.length, 2);
    game = rewindTo(game, 0);
    assert.equal(game.history.length, 1);
    assert.equal(game.worldModel.get("@tocha")?.links.current_location, "@entrada");
    assert.match(game.story, /caverna|Tocha/i);
  });
});

describe("taxonomy compile", () => {
  it("accepts empty source", () => {
    const tax = compileTaxonomy("");
    assert.equal(tax.errors.length, 0);
    assert.equal(tax.parents.size, 0);
  });

  it("parses arrows and comments", () => {
    const tax = compileTaxonomy(`/* espécies */
goblin → monster
orc -> monster
monster → creature
`);
    assert.equal(tax.errors.length, 0, tax.errors.map((e) => e.message).join("\n"));
    assert.equal(tax.parents.get("goblin"), "monster");
    assert.equal(tax.parents.get("orc"), "monster");
    assert.deepEqual(tax.ancestors.get("goblin"), ["monster", "creature"]);
  });

  it("rejects self-parent, duplicates and bad lines", () => {
    const tax = compileTaxonomy(`goblin → goblin
orc → monster
orc → creature
not a line
`);
    assert.equal(tax.errors.some((e) => e.code === "E011"), true);
    assert.equal(tax.errors.some((e) => e.code === "E010"), true);
    assert.equal(tax.errors.some((e) => e.code === "E013"), true);
    assert.equal(tax.parents.get("orc"), "monster");
  });

  it("detects cycles and still resolves ancestors safely", () => {
    const tax = compileTaxonomy(`a → b
b → c
c → a
`);
    assert.equal(tax.errors.some((e) => e.code === "E012"), true);
    assert.match(tax.errors.find((e) => e.code === "E012")!.message, /a → b → c → a/);
    assert.ok(tax.ancestors.get("a")!.length >= 1);
  });

  it("allows unknown parents as roots", () => {
    const tax = compileTaxonomy("goblin → monster\n");
    assert.equal(tax.errors.length, 0);
    assert.equal(tax.parents.get("goblin"), "monster");
    assert.deepEqual(tax.ancestors.get("monster") ?? [], []);
  });
});

describe("taxonomy matching", () => {
  const project = createProject("tax", {
    entitiesSource: `@goblin.{
tags: goblin;
stats: health=80;
links: ;
}

@orc.{
tags: orc;
stats: health=150;
links: ;
}

@dragon.{
tags: dragon, wounded;
stats: health=1000;
links: ;
}

start()
`,
    taxonomySource: `goblin → monster
orc → monster
dragon → monster
monster → creature
`,
    rulesSource: `# start
ON: start
narrativa: "ok"
`,
  });

  it("does not persist inherited tags on the entity", () => {
    const compiled = compileProject(project);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    const goblin = compiled.worldModel.get("@goblin")!;
    assert.deepEqual([...goblin.tags], ["goblin"]);
    assert.ok(matchesTag(goblin, "monster", compiled.taxonomy));
    assert.ok(matchesTag(goblin, "creature", compiled.taxonomy));
    assert.equal(matchesTag(goblin, "dragon", compiled.taxonomy), false);
    assert.deepEqual(effectiveTags(goblin.tags, compiled.taxonomy), new Set(["goblin", "monster", "creature"]));
  });

  it("query *.creature finds goblin without storing creature", () => {
    const compiled = compileProject(project);
    const hits = query("*.creature", compiled.worldModel, "", compiled.taxonomy).map(([id]) => id).sort();
    assert.deepEqual(hits, ["@dragon", "@goblin", "@orc"]);
    assert.ok(compiled.worldModel.get("@goblin")!.tags.has("goblin"));
    assert.equal(compiled.worldModel.get("@goblin")!.tags.has("creature"), false);
  });

  it("combines polymorphic tag with stat", () => {
    const compiled = compileProject(project);
    const hits = query("*.monster.health>100", compiled.worldModel, "", compiled.taxonomy).map(([id]) => id).sort();
    assert.deepEqual(hits, ["@dragon", "@orc"]);
  });

  it("negation uses the same matching", () => {
    const compiled = compileProject(project);
    const hits = query("*.monster.!wounded", compiled.worldModel, "", compiled.taxonomy).map(([id]) => id).sort();
    assert.deepEqual(hits, ["@goblin", "@orc"]);
  });

  it("without taxonomy, ancestor queries miss", () => {
    const bare = createProject("bare", {
      entitiesSource: project.entitiesSource,
      rulesSource: project.rulesSource,
    });
    const compiled = compileProject(bare);
    assert.deepEqual(query("*.monster", compiled.worldModel, "", compiled.taxonomy), []);
    assert.deepEqual(
      query("*.goblin", compiled.worldModel, "", compiled.taxonomy).map(([id]) => id),
      ["@goblin"],
    );
  });

  it("hidden is never inherited", () => {
    const p = createProject("hid", {
      entitiesSource: `@goblin.{ tags: goblin; stats: ; links: ; }\nstart()\n`,
      taxonomySource: `goblin → monster\nmonster → hidden\n`,
      rulesSource: `ON: start\nnarrativa: "x"\n`,
    });
    const compiled = compileProject(p);
    const goblin = compiled.worldModel.get("@goblin")!;
    assert.equal(matchesTag(goblin, "hidden", compiled.taxonomy), false);
    assert.ok(matchesTag(goblin, "monster", compiled.taxonomy));
  });

  it("DO does not write inherited tags", () => {
    const compiled = compileProject(project);
    const change = parseChangeLine("@goblin.-monster");
    const next = applyChanges(compiled.worldModel, [change], "@goblin");
    const goblin = next.get("@goblin")!;
    assert.ok(goblin.tags.has("goblin"));
    assert.equal(goblin.tags.has("monster"), false);
    assert.ok(matchesTag(goblin, "monster", compiled.taxonomy));
  });

  it("primaryTag uses effective categories", () => {
    const p = createProject("cat", {
      entitiesSource: `@goblin.{ tags: goblin; stats: ; links: ; }\nstart()\n`,
      taxonomySource: `goblin → agent\n`,
      rulesSource: `ON: start\nnarrativa: "x"\n`,
    });
    const compiled = compileProject(p);
    assert.equal(primaryTag(compiled.worldModel.get("@goblin")!, compiled.taxonomy), "agent");
    assert.equal(primaryTag(compiled.worldModel.get("@goblin")!), "goblin");
  });
});

describe("taxonomy specificity", () => {
  it("id beats child tag beats ancestor", () => {
    const project = createProject("spec", {
      entitiesSource: `@goblin.{ tags: goblin; stats: ; links: ; }\nstart()\n`,
      taxonomySource: `goblin → monster\nmonster → creature\n`,
      rulesSource: `# creature
ON: *.creature
narrativa: "criatura"

# monster
ON: *.monster
narrativa: "monstro"

# goblin
ON: *.goblin
narrativa: "especie"

# id
ON: @goblin
narrativa: "id"
`,
    });
    const compiled = compileProject(project);
    const tax = compiled.taxonomy;
    assert.ok(specificityOf(parseMatcher("@goblin"), tax) > specificityOf(parseMatcher("*.goblin"), tax));
    assert.ok(specificityOf(parseMatcher("*.goblin"), tax) > specificityOf(parseMatcher("*.monster"), tax));
    assert.ok(specificityOf(parseMatcher("*.monster"), tax) > specificityOf(parseMatcher("*.creature"), tax));
    const rule = findMatchingRule("@goblin", compiled.rules, compiled.worldModel, tax);
    assert.equal(rule?.id, "id");
  });

  it("deeper tag wins even if the ancestor rule is first", () => {
    const project = createProject("order", {
      entitiesSource: `@goblin.{ tags: goblin; stats: ; links: ; }\nstart()\n`,
      taxonomySource: `goblin → monster\n`,
      rulesSource: `# monster
ON: *.monster
narrativa: "monstro"

# goblin
ON: *.goblin
narrativa: "especie"
`,
    });
    const compiled = compileProject(project);
    const rule = findMatchingRule("@goblin", compiled.rules, compiled.worldModel, compiled.taxonomy);
    assert.equal(rule?.narrative, "especie");
  });

  it("true ties keep file order", () => {
    const project = createProject("tie", {
      entitiesSource: `@goblin.{ tags: goblin; stats: ; links: ; }\nstart()\n`,
      taxonomySource: `goblin → monster\n`,
      rulesSource: `# first
ON: *.monster
narrativa: "um"

# second
ON: *.monster
narrativa: "dois"
`,
    });
    const compiled = compileProject(project);
    const rule = findMatchingRule("@goblin", compiled.rules, compiled.worldModel, compiled.taxonomy);
    assert.equal(rule?.narrative, "um");
  });
});

describe("taxonomy project shape", () => {
  it("coerces old projects without taxonomySource", () => {
    const p = coerceProject({
      formatVersion: 1,
      meta: { id: "x", name: "velho", version: 1, createdAt: "2020-01-01", updatedAt: "2020-01-01" },
      entitiesSource: "@jogador.{ tags: agent; stats: ; links: ; }\nstart()\n",
      rulesSource: "ON: start\nnarrativa: \"oi\"\n",
    });
    assert.equal(p.taxonomySource, "");
    const compiled = compileProject(p);
    assert.equal(compiled.errors.length, 0);
    assert.equal(compiled.taxonomy.parents.size, 0);
  });

  it("fingerprint includes taxonomy length", () => {
    const a = createProject("a", { taxonomySource: "" });
    const b = createProject("a", { taxonomySource: "goblin → monster\n" });
    a.meta.updatedAt = b.meta.updatedAt;
    assert.notEqual(fingerprintProject(a), fingerprintProject(b));
  });

  it("toWireProject round-trips taxonomySource at format 2", () => {
    const p = createProject("export", { taxonomySource: "goblin → monster\n" });
    const wire = toWireProject(p);
    assert.equal(wire.formatVersion, 2);
    assert.equal(wire.taxonomySource, "goblin → monster\n");
    const back = coerceProject(JSON.parse(JSON.stringify(wire)));
    assert.equal(back.taxonomySource, "goblin → monster\n");
    assert.equal(back.formatVersion, 2);
  });

  it("projectFromCloudRow reads taxonomy_source", () => {
    const p = projectFromCloudRow({
      id: "goblin-cave",
      name: "Caverna do Goblin",
      version: 1,
      format_version: 2,
      entities_source: "@goblin.{ tags: goblin; stats: ; links: ; }\nstart()\n",
      taxonomy_source: "goblin → monster\n",
      rules_source: "ON: start\nnarrativa: \"oi\"\n",
      extras: {},
      settings: { playerEntityId: "@jogador", debug: true },
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(p.taxonomySource, "goblin → monster\n");
    assert.equal(p.formatVersion, 2);
    assert.equal(compileProject(p).taxonomy.parents.get("goblin"), "monster");
  });

  it("projectFromCloudRow treats missing taxonomy_source as empty", () => {
    const p = projectFromCloudRow({
      id: "old",
      name: "velho",
      version: 1,
      format_version: 1,
      entities_source: "@jogador.{ tags: agent; stats: ; links: ; }\nstart()\n",
      rules_source: "ON: start\nnarrativa: \"oi\"\n",
      extras: {},
      settings: { playerEntityId: "@jogador" },
      created_at: "2020-01-01",
      updated_at: "2020-01-01",
    });
    assert.equal(p.taxonomySource, "");
    assert.equal(p.formatVersion, 1);
  });
});

describe("notebook project shape", () => {
  it("coerces old projects without notebooksSource", () => {
    const p = coerceProject({
      formatVersion: 2,
      meta: { id: "x", name: "velho", version: 1, createdAt: "2020-01-01", updatedAt: "2020-01-01" },
      entitiesSource: "@jogador.{ tags: agent; stats: ; links: ; }\nstart()\n",
      rulesSource: "ON: start\nnarrativa: \"oi\"\n",
    });
    assert.equal(p.notebooksSource, "");
    assert.equal(compileProject(p).errors.length, 0);
  });

  it("fingerprint includes notebooks length", () => {
    const a = createProject("a", { notebooksSource: "" });
    const b = createProject("a", { notebooksSource: "CADERNO: teste\n" });
    a.meta.updatedAt = b.meta.updatedAt;
    assert.notEqual(fingerprintProject(a), fingerprintProject(b));
  });

  it("toWireProject round-trips notebooksSource", () => {
    const p = createProject("export", { notebooksSource: "CADERNO: A Caverna\n" });
    const wire = toWireProject(p);
    assert.equal(wire.notebooksSource, "CADERNO: A Caverna\n");
    const back = coerceProject(JSON.parse(JSON.stringify(wire)));
    assert.equal(back.notebooksSource, "CADERNO: A Caverna\n");
  });

  it("projectFromCloudRow reads notebooks_source and treats missing as empty", () => {
    const withNb = projectFromCloudRow({
      id: "n1",
      name: "caderno",
      version: 1,
      format_version: 2,
      entities_source: "@jogador.{ tags: agent; stats: ; links: ; }\nstart()\n",
      taxonomy_source: "",
      rules_source: "ON: start\nnarrativa: \"oi\"\n",
      notebooks_source: "CADERNO: X\n",
      extras: {},
      settings: { playerEntityId: "@jogador", debug: true },
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(withNb.notebooksSource, "CADERNO: X\n");
    const missing = projectFromCloudRow({
      id: "old",
      name: "velho",
      version: 1,
      format_version: 1,
      entities_source: "@jogador.{ tags: agent; stats: ; links: ; }\nstart()\n",
      rules_source: "ON: start\nnarrativa: \"oi\"\n",
      extras: {},
      settings: { playerEntityId: "@jogador" },
      created_at: "2020-01-01",
      updated_at: "2020-01-01",
    });
    assert.equal(missing.notebooksSource, "");
  });
});

describe("taxonomy explain, tree, impact, direct mode", () => {
  const project = createProject("why", {
    entitiesSource: `@goblin.{ tags: goblin; stats: health=80; links: ; }
@orc.{ tags: orc; stats: ; links: ; }
start()
`,
    taxonomySource: `goblin → monster
orc → monster
monster → creature
`,
    rulesSource: `# start
ON: start
narrativa: "ok"

# monster
ON: *.monster
narrativa: "um monstro"

# creature if
ON: *
IF: *.creature
narrativa: "criatura"
`,
  });

  it("explainTagMatch reports the inheritance path", () => {
    const compiled = compileProject(project);
    const goblin = compiled.worldModel.get("@goblin")!;
    const via = explainTagMatch(goblin, "creature", compiled.taxonomy);
    assert.equal(via.matched, true);
    assert.equal(via.direct, false);
    assert.deepEqual(via.path, ["goblin", "monster", "creature"]);
    const own = explainTagMatch(goblin, "goblin", compiled.taxonomy);
    assert.equal(own.direct, true);
    assert.equal(explainTagMatch(goblin, "dragon", compiled.taxonomy).matched, false);
  });

  it("direct mode ignores ancestors; effective finds them", () => {
    const compiled = compileProject(project);
    const goblin = compiled.worldModel.get("@goblin")!;
    assert.equal(matchesTag(goblin, "monster", compiled.taxonomy, "direct"), false);
    assert.equal(matchesTag(goblin, "monster", compiled.taxonomy, "effective"), true);
    assert.equal(matchesTag(goblin, "goblin", compiled.taxonomy, "direct"), true);
    const effectiveHits = query("*.monster", compiled.worldModel, "", compiled.taxonomy, "effective").map(([id]) => id).sort();
    const directHits = query("*.monster", compiled.worldModel, "", compiled.taxonomy, "direct").map(([id]) => id);
    assert.deepEqual(effectiveHits, ["@goblin", "@orc"]);
    assert.deepEqual(directHits, []);
  });

  it("taxonomyForest nests children under parents", () => {
    const compiled = compileProject(project);
    const forest = taxonomyForest(compiled.taxonomy);
    assert.equal(forest.length, 1);
    assert.equal(forest[0]!.tag, "creature");
    assert.equal(forest[0]!.children[0]!.tag, "monster");
    const kids = forest[0]!.children[0]!.children.map((n) => n.tag);
    assert.deepEqual(kids, ["goblin", "orc"]);
  });

  it("impactOfTag lists inherited entities and rules that cite the tag", () => {
    const compiled = compileProject(project);
    const impact = impactOfTag("monster", compiled.worldModel, compiled.rules, compiled.taxonomy);
    assert.deepEqual(impact.entitiesDirect, []);
    assert.deepEqual(impact.entitiesInherited.sort(), ["@goblin", "@orc"]);
    assert.ok(impact.rules.some((r) => r.id === "monster" && r.role === "on"));
    const creature = impactOfTag("creature", compiled.worldModel, compiled.rules, compiled.taxonomy);
    assert.ok(creature.rules.some((r) => r.role === "if"));
  });

  it("explainMatcher shows the path on a polymorphic ON", () => {
    const compiled = compileProject(project);
    const ast = parseMatcher("*.monster");
    const why = explainMatcher(ast, "@goblin", compiled.worldModel, "@goblin", compiled.taxonomy);
    assert.equal(why.matched, true);
    const tag = why.clauses.find((c) => c.kind === "tag");
    assert.ok(tag);
    assert.deepEqual(tag!.path, ["goblin", "monster"]);
  });
});

describe("polymorphic play", () => {
  it("ON: *.monster fires on a goblin", () => {
    const project = createProject("play", {
      entitiesSource: `@goblin.{ tags: goblin; stats: ; links: ; }\nstart()\n`,
      taxonomySource: `goblin → monster\n`,
      rulesSource: `# start
ON: start
narrativa: "abre"

# monster
ON: *.monster
narrativa: "um monstro"
`,
    });
    const compiled = compileProject(project);
    let game = bootGame(createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    game = interactWith(game, "@goblin");
    assert.match(game.story, /monstro/);
    assert.deepEqual([...game.worldModel.get("@goblin")!.tags], ["goblin"]);
  });
});

describe("taxonomy highlight and complete", () => {
  it("highlights child, arrow and parent without tokenizing →", () => {
    const lines = highlightSource("goblin → monster\n# nota\nfoo -> bar\n", "taxonomy");
    assert.equal(lines[0]!.some((s) => s.text === "goblin" && s.cls === "syn-tag"), true);
    assert.equal(lines[0]!.some((s) => s.text === "→" && s.cls === "syn-op"), true);
    assert.equal(lines[0]!.some((s) => s.text === "monster" && s.cls === "syn-tag"), true);
    assert.equal(lines[1]![0]!.cls, "syn-err");
    assert.equal(lines[2]!.some((s) => s.text === "->" && s.cls === "syn-op"), true);
  });

  it("child completion inserts tag →", () => {
    const vocab = collectVocabulary({});
    const { ctx, items } = completeAt("ag", "taxonomy", 2, vocab);
    assert.equal(ctx.slot, "taxonomy-child");
    const agent = items.find((i) => i.label === "agent");
    assert.ok(agent);
    assert.equal(agent!.insert, "agent → ");
  });

  it("arrow slot after a child tag", () => {
    const vocab = collectVocabulary({});
    const src = "goblin ";
    const { ctx, items } = completeAt(src, "taxonomy", src.length, vocab);
    assert.equal(ctx.slot, "taxonomy-arrow");
    assert.equal(items[0]?.label, "→");
  });

  it("parent slot after arrow uses taxonomy vocab", () => {
    const vocab = collectVocabulary({ taxonomySource: "goblin → monster\nmonster → agent\n" });
    const src = "goblin → mon";
    const { ctx, items } = completeAt(src, "taxonomy", src.length, vocab);
    assert.equal(ctx.slot, "taxonomy-parent");
    assert.ok(items.some((i) => i.label === "monster"));
    assert.equal(analyzeCompletion(src, "taxonomy", src.length).slot, "taxonomy-parent");
  });
});

describe("example taxonomy play", () => {
  it("goblin inherits agent and monster rule fires after waking", () => {
    const project = createExampleProject("goblin-cave");
    const compiled = compileProject(project);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    assert.equal(compiled.taxonomy.parents.get("goblin"), "monster");
    const goblin = compiled.worldModel.get("@goblin")!;
    assert.deepEqual([...goblin.tags].sort(), ["goblin", "sleeping"]);
    assert.ok(matchesTag(goblin, "agent", compiled.taxonomy));
    assert.deepEqual(inheritedTags(goblin, compiled.taxonomy).sort(), ["agent", "monster"]);
    assert.equal(primaryTag(goblin, compiled.taxonomy), "agent");
    let game = bootGame(createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    game = interactWith(game, "@goblin");
    assert.match(game.story, /onça|vara/i);
    assert.equal(game.worldModel.get("@goblin")!.tags.has("sleeping"), false);
    game = interactWith(game, "@goblin");
    assert.match(game.story, /acordado/);
  });

  it("planetarium relics still match *.object and inventory rule", () => {
    const project = createExampleProject("planetarium");
    const compiled = compileProject(project);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    const carta = compiled.worldModel.get("@carta")!;
    assert.deepEqual([...carta.tags], ["carta"]);
    assert.ok(matchesTag(carta, "object", compiled.taxonomy));
    assert.ok(matchesTag(carta, "relic", compiled.taxonomy));
    let game = bootGame(createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    game = interactWith(game, "@carta");
    assert.match(game.story, /pega/i);
    assert.equal(game.worldModel.get("@carta")!.links.current_location, "@jogador");
    game = interactWith(game, "@carta");
    assert.match(game.story, /relíquia/i);
  });
});

describe("canonical lowercase rules", () => {
  function core(source: string) {
    const compiled = compileRuleFile(source);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    const rule = compiled.rules[0];
    assert.ok(rule);
    return {
      id: rule.id,
      trigger: rule.trigger,
      conditions: rule.conditions,
      changes: rule.changes.map((c) => ({ target: c.target, fields: c.fields, source: c.source })),
      effects: rule.effects.map((e) => ({ verb: e.verb, args: e.args })),
      narrative: rule.narrative,
    };
  }

  it("on:/if:/do: compile the same AST as ON:/IF:/DO:", () => {
    const lower = core(`# r
on: @goblin.sleeping
if: @jogador.fear>4
do: @goblin.-sleeping
narrativa: 'acordou'
`);
    const upper = core(`# r
ON: @goblin.sleeping
IF: @jogador.fear>4
DO: @goblin.-sleeping
narrativa: 'acordou'
`);
    assert.deepEqual(lower, upper);
  });

  it("mixed case On:/If:/Do: is an alias", () => {
    const mixed = core(`# r
On: start
If: @jogador.agent
Do: @jogador.explored
narrativa: "x"
`);
    const canon = core(`# r
on: start
if: @jogador.agent
do: @jogador.explored
narrativa: "x"
`);
    assert.deepEqual(mixed, canon);
  });

  it("highlights lowercase rule keywords", () => {
    for (const line of ["on: start", "if: @jogador", "do: @jogador.explored", "narrativa: 'oi'"]) {
      const rows = highlightSource(line, "rules");
      assert.ok(
        rows.flat().some((s) => s.cls === "syn-kw"),
        line,
      );
    }
  });

  it("autocomplete inserts lowercase keywords", () => {
    const vocab = collectVocabulary({});
    const { ctx, items } = completeAt("", "rules", 0, vocab);
    assert.equal(ctx.slot, "rule-keyword");
    const labels = items.map((i) => i.label);
    const inserts = items.map((i) => i.insert);
    assert.deepEqual(labels, ["on:", "if:", "do:", "narrativa:"]);
    assert.deepEqual(inserts, ["on: ", "if: ", "do: ", "narrativa: "]);
    assert.equal(items.some((i) => i.insert.startsWith("ON:")), false);
  });

  it("Tab after on/if/do inserts the colon form", () => {
    const on = tabAfterKeyword("on", "rules", 2);
    assert.equal(on?.source, "on: ");
    const iff = tabAfterKeyword("if", "rules", 2);
    assert.equal(iff?.source, "if: ");
    const doit = tabAfterKeyword("do", "rules", 2);
    assert.equal(doit?.source, "do: ");
  });

  it("Nova regra writes on:", () => {
    const out = insertRule("", "entrar");
    assert.match(out.source, /\non: entrar\n/);
    assert.equal(out.source.includes("ON:"), false);
  });

  it("Nova entidade writes before start()", () => {
    const src = "@jogador.{ tags: agent; }\nstart()\n";
    const out = insertEntity(src, "@nova");
    assert.match(out.source, /@nova\.\{/);
    assert.ok(out.source.indexOf("@nova.{") < out.source.indexOf("start()"));
    const again = insertEntity(src);
    assert.match(again.source, /@nova\.\{/);
    assert.ok(again.source.indexOf("@nova.{") < again.source.indexOf("start()"));
  });
});
