import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  blankEntityBlock,
  compileEntityFile,
  createEmptyEntity,
  destroyEntityInWorld,
  findEntityByQuad,
  parseEntityLine,
  readStat,
  serializeEntityBlock,
  shortCodeFromSlug,
  tickFuses,
  writeStat,
} from "../../lib/world-model.ts";
import { applyChanges, compileRuleFile, findMatchingRule, parseChangeLine, parseDoLine } from "../../lib/rule-engine.ts";
import { matchesEntity, parseMatcher, query, specificityOf } from "../../lib/query.ts";
import { highlightSource } from "../../lib/highlight.ts";
import { analyzeCompletion, completeAt, collectVocabulary } from "../../lib/complete.ts";

const DRAGON = `DRAGAO_ANCIAO.{
  name: Dragão Ancião do Abismo;
  description: 'Uma besta ancestral envolta em chamas étereas e escamas impenetráveis.';
  tags: agent, vivo, chefe, voador, dragao;
  stats: hp=500[0..500], mp=200, ataque=85, defesa=60;
  flags: em_combate=true, enfurecido=true, imune_fogo=true, derrotado=false;
  enums: estado_fsm=COMBATE_AEREO, postura=AGRESSIVO, fase_chefe=FASE_2;
  phrases: titulo='O Flagelo dos CÉUS', rugido_entrada='ROAAAR! Quem ousa invadir meu domínio?';
  hardLinks: elemento_core=CORACAO_DRAGAO, tesouro_guardado=BAU_DOURADO;
  softLinks: local_atual=PICO_SERPENTE, alvo_foco=JOGADOR, oponente_direto=HEROI_LUME;
  lists: inventario=[GEMA_FOGO, ESCAMA_ANCIA, CHAVE_RUINAS];
  fuses: temporizador_sopro=2, recarga_voo=4;
  struct: resistencias='fogo:100,gelo:-50,eletricidade:20';
}

CORACAO_DRAGAO.{ tags: object; }
BAU_DOURADO.{ tags: object; }
PICO_SERPENTE.{ tags: place; }
JOGADOR.{ tags: agent; }
HEROI_LUME.{ tags: agent; }
`;

describe("FBE entity", () => {
  it("parses the ten drawers, quad-ids and top fields", () => {
    const compiled = compileEntityFile(DRAGON);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    const e = compiled.worldModel.get("DRAGAO_ANCIAO");
    assert.ok(e);
    assert.equal(e.id, "DRAGAO_ANCIAO");
    assert.equal(e.slug, "DRAGAO_ANCIAO");
    assert.equal(e.shortCode, shortCodeFromSlug("DRAGAO_ANCIAO"));
    assert.match(e.systemId, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.equal(e.name, "Dragão Ancião do Abismo");
    assert.match(e.description, /besta ancestral/);
    assert.ok(e.tags.has("chefe"));
    assert.equal(typeof e.stats.hp, "object");
    const hp = e.stats.hp as { value: number; min: number; max: number };
    assert.equal(hp.value, 500);
    assert.equal(hp.min, 0);
    assert.equal(hp.max, 500);
    assert.equal(e.stats.ataque, 85);
    assert.equal(e.flags.em_combate, true);
    assert.equal(e.flags.derrotado, false);
    assert.equal(e.enums.estado_fsm, "COMBATE_AEREO");
    assert.equal(e.phrases.titulo, "O Flagelo dos CÉUS");
    assert.equal(e.hardLinks.elemento_core, "CORACAO_DRAGAO");
    assert.equal(e.softLinks.local_atual, "PICO_SERPENTE");
    assert.equal(e.links.local_atual, "PICO_SERPENTE");
    assert.deepEqual(e.lists.inventario, ["GEMA_FOGO", "ESCAMA_ANCIA", "CHAVE_RUINAS"]);
    assert.match(serializeEntityBlock(e), /inventario=\[GEMA_FOGO, ESCAMA_ANCIA, CHAVE_RUINAS\]/);
    assert.equal(e.fuses.temporizador_sopro?.remaining, 2);
    assert.equal(e.fuses.temporizador_sopro?.targetId, "temporizador_sopro");
    const resist = e.struct.resistencias as Record<string, number>;
    assert.equal(resist.fogo, 100);
    assert.equal(resist.gelo, -50);
  });

  it("keeps legacy links: as softLinks", () => {
    const e = parseEntityLine("TOCHA.{ tags: object; stats: ; links: current_location=JOGADOR; name: Tocha; }");
    assert.equal(e.name, "Tocha");
    assert.equal(e.softLinks.current_location, "JOGADOR");
    assert.equal(e.links.current_location, "JOGADOR");
  });

  it("clamps bounded stats", () => {
    const e = createEmptyEntity("X", { stats: { hp: { value: 10, min: 0, max: 20 } } });
    writeStat(e, "hp", 999);
    assert.equal(readStat(e, "hp"), 20);
    writeStat(e, "hp", -4);
    assert.equal(readStat(e, "hp"), 0);
  });

  it("cascade-destroys hardLinks and null-resets softLinks", () => {
    const world = compileEntityFile(`
PAI.{ tags: agent; hardLinks: filho=FILHO; }
FILHO.{ tags: object; }
OLHO.{ tags: agent; softLinks: alvo=FILHO; }
`).worldModel;
    destroyEntityInWorld(world, "PAI");
    assert.equal(world.has("PAI"), false);
    assert.equal(world.has("FILHO"), false);
    assert.equal(world.get("OLHO")?.softLinks.alvo, "");
  });

  it("ticks fuses and fires targetId", () => {
    const world = compileEntityFile(`BOMBA.{ tags: object; fuses: estouro=1>BOOM; }\nBOOM.{ tags: event; }`).worldModel;
    const once = tickFuses(world);
    assert.equal(once.world.get("BOMBA")?.fuses.estouro, undefined);
    assert.deepEqual(once.fired, ["BOOM"]);
  });

  it("applies list ops", () => {
    const world = compileEntityFile(`BAG.{ tags: object; lists: inventario=[A]; }`).worldModel;
    const push = parseDoLine("PUSH BAG.inventario B").change!;
    const unique = parseDoLine("ADD_UNIQUE BAG.inventario A").change!;
    let next = applyChanges(world, [push], "BAG");
    next = applyChanges(next, [unique], "BAG");
    assert.deepEqual(next.get("BAG")?.lists.inventario, ["A", "B"]);
    const pop = parseDoLine("POP BAG.inventario").change!;
    next = applyChanges(next, [pop], "BAG");
    assert.deepEqual(next.get("BAG")?.lists.inventario, ["A"]);
  });

  it("blank block puts name/description above the ten drawers", () => {
    const b = blankEntityBlock("HEROI");
    const order = ["name:", "description:", "tags:", "stats:", "flags:", "enums:", "phrases:", "hardLinks:", "softLinks:", "lists:", "fuses:", "struct:"];
    let last = -1;
    for (const key of order) {
      const idx = b.indexOf(key);
      assert.ok(idx > last, key);
      last = idx;
    }
  });

  it("highlights FBE section keywords", () => {
    const rows = highlightSource("  flags: em_combate=true;", "entities");
    const flat = rows.flat().map((s) => s.cls);
    assert.ok(flat.includes("syn-kw"));
  });

  it("autocompletes FBE drawers", () => {
    const src = "X.{\n  ";
    const ctx = analyzeCompletion(src, "entities", src.length);
    assert.equal(ctx.slot, "entity-section");
  });

  it("parses the spec example without bounded stats", () => {
    const src = `DRAGAO_ANCIAO.{
  name: Dragão Ancião do Abismo;
  description: 'Uma besta ancestral envolta em chamas étereas e escamas impenetráveis.';
  tags: agent, vivo, chefe, voador, dragao;
  stats: hp=500, mp=200, ataque=85, defesa=60;
  flags: em_combate=true, enfurecido=true, imune_fogo=true, derrotado=false;
  enums: estado_fsm=COMBATE_AEREO, postura=AGRESSIVO, fase_chefe=FASE_2;
  phrases: titulo='O Flagelo dos CÉUS', rugido_entrada='ROAAAR! Quem ousa invadir meu domínio?';
  hardLinks: elemento_core=CORACAO_DRAGAO, tesouro_guardado=BAU_DOURADO;
  softLinks: local_atual=PICO_SERPENTE, alvo_foco=JOGADOR, oponente_direto=HEROI_LUME;
  lists: inventario=[GEMA_FOGO, ESCAMA_ANCIA, CHAVE_RUINAS];
  fuses: temporizador_sopro=2, recarga_voo=4;
  struct: resistencias='fogo:100,gelo:-50,eletricidade:20';
}
CORACAO_DRAGAO.{ tags: object; }
BAU_DOURADO.{ tags: object; }
PICO_SERPENTE.{ tags: place; }
JOGADOR.{ tags: agent; }
HEROI_LUME.{ tags: agent; }
`;
    const compiled = compileEntityFile(src);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    const e = compiled.worldModel.get("DRAGAO_ANCIAO")!;
    assert.equal(e.stats.hp, 500);
    assert.equal(e.fuses.recarga_voo?.remaining, 4);
  });

  it("does not put extra in the blank block", () => {
    const b = blankEntityBlock("HEROI");
    assert.equal(b.includes("extra:"), false);
  });

  it("resolves Quad-IDs", () => {
    const world = compileEntityFile("JOGADOR.{ tags: agent; name: Você; }").worldModel;
    const e = world.get("JOGADOR")!;
    assert.equal(findEntityByQuad(world, e.shortCode)?.id, "JOGADOR");
    assert.equal(findEntityByQuad(world, e.systemId)?.id, "JOGADOR");
    assert.equal(findEntityByQuad(world, "JOGADOR")?.id, "JOGADOR");
  });

  it("SPAWN FROM copies the template drawers", () => {
    const world = compileEntityFile(`
PROTO.{ tags: agent, vivo; stats: hp=10; flags: chefe=false; enums: fase=UM; }
`).worldModel;
    const spawn = parseDoLine("SPAWN G1 FROM PROTO").change!;
    const next = applyChanges(world, [spawn], "start");
    const g1 = next.get("G1");
    assert.ok(g1);
    assert.equal(g1.templateId, "PROTO");
    assert.ok(g1.tags.has("vivo"));
    assert.equal(g1.stats.hp, 10);
    assert.equal(g1.flags.chefe, false);
    assert.equal(g1.enums.fase, "UM");
    assert.notEqual(g1.systemId, world.get("PROTO")?.systemId);
    assert.notEqual(g1.shortCode, world.get("PROTO")?.shortCode);
  });

  it("CREATE dotted sets templateId instead of a link", () => {
    const world = compileEntityFile("PROTO.{ tags: object; stats: peso=3; }").worldModel;
    const create = parseDoLine("CREATE G2.templateId=PROTO").change!;
    const next = applyChanges(world, [create], "start");
    const g2 = next.get("G2")!;
    assert.equal(g2.templateId, "PROTO");
    assert.equal(g2.softLinks.templateId, undefined);
    assert.equal(g2.stats.peso, 3);
  });

  it("serializes templateId after description", () => {
    const e = createEmptyEntity("FILHOTE", { name: "Filhote", templateId: "DRAGAO_ANCIAO", tags: ["agent"] });
    const src = serializeEntityBlock(e);
    const desc = src.indexOf("description:");
    const tmpl = src.indexOf("templateId:");
    const tags = src.indexOf("tags:");
    assert.ok(desc >= 0 && tmpl > desc && tags > tmpl);
  });
});

describe("FBE drawer paths", () => {
  const SRC = `JOGADOR.{
  tags: agent;
  stats: hp=50[0..100], fear=2;
  flags: em_combate=true;
  enums: postura=AGRESSIVO;
  phrases: titulo='Heroi';
  hardLinks: reliquia=GEMA;
  softLinks: alvo=GOBLIN;
  lists: inventario=[TOCHA];
  fuses: sopro=2;
}
GOBLIN.{ tags: agent, vivo; stats: hp=30; }
GEMA.{ tags: object; }
`;

  it("parses drawer.chave without treating the drawer as a tag", () => {
    const ast = parseMatcher("JOGADOR.stats.hp>=10");
    assert.equal(ast.selector.kind, "id");
    assert.equal(ast.clauses[0]?.drawer, "stats");
    assert.equal(ast.clauses[0]?.key, "hp");
    assert.equal(ast.clauses[0]?.op, ">=");
    const compact = parseMatcher("JOGADOR.hp>=10");
    assert.equal(compact.clauses[0]?.drawer, undefined);
    assert.equal(compact.clauses[0]?.key, "hp");
  });

  it("matches stats/flags/enums/links via drawer and via compact key", () => {
    const world = compileEntityFile(SRC).worldModel;
    const id = "JOGADOR";
    assert.equal(matchesEntity(parseMatcher("JOGADOR.stats.hp>=10"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("JOGADOR.hp>=10"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("JOGADOR.stats.hp>=90"), id, world, id), false);
    assert.equal(matchesEntity(parseMatcher("JOGADOR.flags.em_combate=true"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("JOGADOR.em_combate=true"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("JOGADOR.enums.postura=AGRESSIVO"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("JOGADOR.softLinks.alvo=GOBLIN"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("JOGADOR.tags.agent"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("JOGADOR.tags.!objeto"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("*.stats.hp>40"), id, world, id), true);
    assert.equal(query("*.stats.hp>40", world).map(([i]) => i).includes("GOBLIN"), false);
  });

  it("accepts == as = on a drawer path", () => {
    const ast = parseMatcher("JOGADOR.flags.em_combate==true");
    assert.equal(ast.clauses[0]?.op, "=");
  });

  it("resolves #XXXX in the matcher selector without changing findMatchingRule", () => {
    const world = compileEntityFile(SRC).worldModel;
    const code = world.get("JOGADOR")!.shortCode;
    assert.match(code, /^#[0-9A-F]{4}$/);
    const ast = parseMatcher(`${code}.stats.hp>10`);
    assert.equal(ast.selector.kind, "id");
    if (ast.selector.kind === "id") assert.equal(ast.selector.id, code);
    assert.equal(matchesEntity(ast, "JOGADOR", world, "JOGADOR"), true);
    assert.equal(matchesEntity(ast, "GOBLIN", world, "GOBLIN"), false);
    const compiled = compileRuleFile(`# r\non: ${code}\nnarrativa: 'quad'\n`);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    const rule = findMatchingRule("JOGADOR", compiled.rules, world);
    assert.equal(rule?.id, "r");
    assert.equal(findMatchingRule("GOBLIN", compiled.rules, world), null);
  });

  it("compact do: JOGADOR.stats.hp-10 does not add a stats tag", () => {
    const world = compileEntityFile(SRC).worldModel;
    const change = parseChangeLine("JOGADOR.stats.hp-10");
    assert.equal(change.fields.length, 1);
    assert.equal(change.fields[0]?.kind, "deltaStat");
    const next = applyChanges(world, [change], "JOGADOR");
    const e = next.get("JOGADOR")!;
    assert.equal(readStat(e, "hp"), 40);
    assert.equal(e.tags.has("stats"), false);
  });

  it("compact do: drawer sets flag, enum, hard and soft links", () => {
    const world = compileEntityFile(SRC).worldModel;
    let next = applyChanges(world, [parseChangeLine("JOGADOR.flags.em_combate=false")], "JOGADOR");
    assert.equal(next.get("JOGADOR")!.flags.em_combate, false);
    next = applyChanges(next, [parseChangeLine("JOGADOR.enums.postura=DEFESA")], "JOGADOR");
    assert.equal(next.get("JOGADOR")!.enums.postura, "DEFESA");
    assert.equal(next.get("JOGADOR")!.softLinks.postura, undefined);
    next = applyChanges(next, [parseChangeLine("JOGADOR.softLinks.alvo=GEMA")], "JOGADOR");
    assert.equal(next.get("JOGADOR")!.softLinks.alvo, "GEMA");
    next = applyChanges(next, [parseChangeLine("JOGADOR.hardLinks.reliquia=GOBLIN")], "JOGADOR");
    assert.equal(next.get("JOGADOR")!.hardLinks.reliquia, "GOBLIN");
    next = applyChanges(next, [parseChangeLine("JOGADOR.tags.ferido")], "JOGADOR");
    assert.ok(next.get("JOGADOR")!.tags.has("ferido"));
    next = applyChanges(next, [parseChangeLine("JOGADOR.tags.-agent")], "JOGADOR");
    assert.equal(next.get("JOGADOR")!.tags.has("agent"), false);
  });

  it("compact do: reads source stat through a drawer path", () => {
    const world = compileEntityFile(SRC).worldModel;
    const change = parseChangeLine("JOGADOR.stats.hp-GOBLIN.stats.hp");
    const next = applyChanges(world, [change], "JOGADOR");
    assert.equal(readStat(next.get("JOGADOR")!, "hp"), 20);
  });

  it("compact do: #XXXX target resolves via Quad-ID", () => {
    const world = compileEntityFile(SRC).worldModel;
    const code = world.get("JOGADOR")!.shortCode;
    const next = applyChanges(world, [parseChangeLine(`${code}.stats.fear+3`)], "start");
    assert.equal(readStat(next.get("JOGADOR")!, "fear"), 5);
  });

  it("rejects lists/fuses/struct compact do paths", () => {
    assert.throws(() => parseChangeLine("JOGADOR.lists.inventario=X"));
    assert.throws(() => parseChangeLine("JOGADOR.fuses.sopro=3"));
  });
});

describe("FBE named do:", () => {
  const SRC = `JOGADOR.{
  tags: agent, vivo;
  stats: hp=50[0..100], fear=2;
  flags: em_combate=true;
  enums: postura=AGRESSIVO;
  phrases: titulo='Heroi';
  hardLinks: reliquia=GEMA;
  softLinks: alvo=GOBLIN;
  lists: inventario=[TOCHA];
  fuses: sopro=2;
}
GOBLIN.{ tags: agent, vivo; stats: hp=30; }
GEMA.{ tags: object; }
BOMBA.{ tags: object; }
`;

  it("aliases named mutations to the same ChangeField as compact", () => {
    assert.deepEqual(parseDoLine("ADD_TAG JOGADOR ferido").change?.fields[0], { kind: "addTag", tag: "ferido" });
    assert.deepEqual(parseDoLine("JOGADOR.ferido").change?.fields[0], { kind: "addTag", tag: "ferido" });
    assert.deepEqual(parseDoLine("add_tag JOGADOR.ferido").change?.fields[0], { kind: "addTag", tag: "ferido" });
    assert.deepEqual(parseDoLine("REMOVE_TAG JOGADOR vivo").change?.fields[0], { kind: "removeTag", tag: "vivo" });
    assert.deepEqual(parseDoLine("JOGADOR.-vivo").change?.fields[0], { kind: "removeTag", tag: "vivo" });
    assert.deepEqual(parseDoLine("SET_STAT JOGADOR.hp 10").change?.fields[0], { kind: "setStat", key: "hp", value: 10 });
    assert.deepEqual(parseDoLine("JOGADOR.stats.hp=10").change?.fields[0], { kind: "setStat", key: "hp", value: 10 });
    assert.deepEqual(parseDoLine("ADD_STAT JOGADOR.hp -10").change?.fields[0], { kind: "deltaStat", key: "hp", delta: -10 });
    assert.deepEqual(parseDoLine("JOGADOR.hp-10").change?.fields[0], { kind: "deltaStat", key: "hp", delta: -10 });
    assert.deepEqual(parseDoLine("MUL_STAT JOGADOR.fear 2").change?.fields[0], { kind: "mulStat", key: "fear", factor: 2 });
    assert.deepEqual(parseDoLine("SET_FLAG JOGADOR.em_combate false").change?.fields[0], { kind: "setFlag", key: "em_combate", value: false });
    assert.deepEqual(parseDoLine("set_flag JOGADOR.flags.em_combate true").change?.fields[0], { kind: "setFlag", key: "em_combate", value: true });
    assert.deepEqual(parseDoLine("SET_ENUM JOGADOR.postura DEFESA").change?.fields[0], { kind: "setEnum", key: "postura", value: "DEFESA" });
    assert.deepEqual(parseDoLine("SET_LINK JOGADOR.alvo GEMA").change?.fields[0], {
      kind: "setLink",
      key: "alvo",
      value: { kind: "id", id: "GEMA" },
    });
    assert.deepEqual(parseDoLine("SET_LINK JOGADOR.hardLinks.reliquia GOBLIN").change?.fields[0], {
      kind: "setLink",
      key: "reliquia",
      value: { kind: "id", id: "GOBLIN" },
      linkKind: "hard",
    });
  });

  it("SET_PHRASE fills the phrases drawer (named + compact)", () => {
    const world = compileEntityFile(SRC).worldModel;
    const named = parseDoLine("SET_PHRASE JOGADOR.titulo 'O Flagelo dos CEUS'");
    assert.deepEqual(named.change?.fields[0], { kind: "setPhrase", key: "titulo", value: "O Flagelo dos CEUS" });
    const next = applyChanges(world, [named.change!], "JOGADOR");
    assert.equal(next.get("JOGADOR")!.phrases.titulo, "O Flagelo dos CEUS");
    assert.equal(next.get("JOGADOR")!.softLinks.titulo, undefined);
    const compact = parseChangeLine("JOGADOR.phrases.titulo=Heroi");
    assert.equal(compact.fields[0]?.kind, "setPhrase");
    const after = applyChanges(world, [compact], "JOGADOR");
    assert.equal(after.get("JOGADOR")!.phrases.titulo, "Heroi");
    assert.equal(after.get("JOGADOR")!.links.titulo, undefined);
  });

  it("UNLINK / CLEAR_LINK break hard and soft without cascade DESTROY", () => {
    const world = compileEntityFile(SRC).worldModel;
    let next = applyChanges(world, [parseDoLine("UNLINK JOGADOR.alvo").change!], "JOGADOR");
    assert.equal(next.get("JOGADOR")!.softLinks.alvo, undefined);
    assert.equal(next.get("JOGADOR")!.links.alvo, undefined);
    assert.ok(next.get("GOBLIN"));
    next = applyChanges(next, [parseDoLine("CLEAR_LINK JOGADOR.hardLinks.reliquia").change!], "JOGADOR");
    assert.equal(next.get("JOGADOR")!.hardLinks.reliquia, undefined);
    assert.ok(next.get("GEMA"));
  });

  it("SET_FUSE arms a fuse; TICK stays an effect", () => {
    const world = compileEntityFile(SRC).worldModel;
    const armed = parseDoLine("set_fuse BOMBA.estouro 3>BOOM");
    assert.equal(armed.effect, undefined);
    assert.deepEqual(armed.change?.fields[0], { kind: "setFuse", key: "estouro", remaining: 3, targetId: "BOOM" });
    const next = applyChanges(world, [armed.change!], "BOMBA");
    assert.equal(next.get("BOMBA")!.fuses.estouro?.remaining, 3);
    assert.equal(next.get("BOMBA")!.fuses.estouro?.targetId, "BOOM");
    const tick = parseDoLine("TICK");
    assert.equal(tick.change, undefined);
    assert.equal(tick.effect?.verb, "tick");
    assert.throws(() => parseChangeLine("BOMBA.fuses.estouro=3"));
  });

  it("ADD_STAT named can subtract another entity stat and resolve #XXXX", () => {
    const world = compileEntityFile(SRC).worldModel;
    const from = parseDoLine("ADD_STAT JOGADOR.hp -GOBLIN.stats.hp");
    assert.equal(from.change?.fields[0]?.kind, "deltaStatFrom");
    const next = applyChanges(world, [from.change!], "JOGADOR");
    assert.equal(readStat(next.get("JOGADOR")!, "hp"), 20);
    const code = world.get("JOGADOR")!.shortCode;
    const flagged = applyChanges(world, [parseDoLine(`SET_FLAG ${code}.em_combate false`).change!], "start");
    assert.equal(flagged.get("JOGADOR")!.flags.em_combate, false);
  });

  it("named do: applies inside a compiled rule without changing findMatchingRule", () => {
    const world = compileEntityFile(SRC).worldModel;
    const compiled = compileRuleFile(`# r
on: JOGADOR
do: set_flag JOGADOR.em_combate false
    set_phrase JOGADOR.titulo 'ok'
    unlink JOGADOR.alvo
    set_fuse JOGADOR.sopro 4>BOOM
narrativa: 'x'
`);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    const rule = findMatchingRule("JOGADOR", compiled.rules, world);
    assert.equal(rule?.id, "r");
    const next = applyChanges(world, rule!.changes, "JOGADOR");
    assert.equal(next.get("JOGADOR")!.flags.em_combate, false);
    assert.equal(next.get("JOGADOR")!.phrases.titulo, "ok");
    assert.equal(next.get("JOGADOR")!.links.alvo, undefined);
    assert.equal(next.get("JOGADOR")!.fuses.sopro?.remaining, 4);
    assert.equal(next.get("JOGADOR")!.fuses.sopro?.targetId, "BOOM");
  });
});

describe("matcher or and group", () => {
  const SRC = `JOGADOR.{ tags: agent, vivo; stats: hp=50; }
GOBLIN.{ tags: agent, morto; stats: hp=30; }
ESPADA.{ tags: object; }
`;

  it("keeps a simple matcher without branches", () => {
    const ast = parseMatcher("JOGADOR.vivo");
    assert.equal(ast.branches, undefined);
    assert.equal(ast.selector.kind, "id");
    assert.equal(ast.clauses[0]?.key, "vivo");
  });

  it("/ is OR of two matchers; // is not a comment", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("JOGADOR / GOBLIN");
    assert.equal(ast.branches?.length, 2);
    assert.equal(matchesEntity(ast, "JOGADOR", world, "JOGADOR"), true);
    assert.equal(matchesEntity(ast, "GOBLIN", world, "GOBLIN"), true);
    assert.equal(matchesEntity(ast, "ESPADA", world, "ESPADA"), false);
    assert.throws(() => parseMatcher("JOGADOR // GOBLIN"));
  });

  it("dots bind tighter than /", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("JOGADOR.vivo / GOBLIN.vivo");
    assert.equal(matchesEntity(ast, "JOGADOR", world, "JOGADOR"), true);
    assert.equal(matchesEntity(ast, "GOBLIN", world, "GOBLIN"), false);
  });

  it("(A / B).clause distributes onto both arms", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("(JOGADOR / GOBLIN).vivo");
    assert.equal(ast.branches?.length, 2);
    assert.equal(matchesEntity(ast, "JOGADOR", world, "JOGADOR"), true);
    assert.equal(matchesEntity(ast, "GOBLIN", world, "GOBLIN"), false);
    const tagged = parseMatcher("(JOGADOR / GOBLIN).agent");
    assert.equal(matchesEntity(tagged, "GOBLIN", world, "GOBLIN"), true);
  });

  it("JOGADOR.(vivo / morto) is clause OR on one selector", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("*.(vivo / morto)");
    assert.equal(matchesEntity(ast, "JOGADOR", world, "JOGADOR"), true);
    assert.equal(matchesEntity(ast, "GOBLIN", world, "GOBLIN"), true);
    assert.equal(matchesEntity(ast, "ESPADA", world, "ESPADA"), false);
  });

  it("*.agent / *.object and nested parens", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("*.agent / *.object");
    assert.equal(query(ast, world).map(([id]) => id).sort().join(","), "ESPADA,GOBLIN,JOGADOR");
    const nested = parseMatcher("(*.agent / (*.object / JOGADOR)).hp>0");
    assert.equal(matchesEntity(nested, "ESPADA", world, "ESPADA"), false);
    assert.equal(matchesEntity(nested, "GOBLIN", world, "GOBLIN"), true);
  });

  it("(link) after = stays a value lookup, not a group", () => {
    const ast = parseMatcher("JOGADOR.alvo=(link GOBLIN.x)");
    assert.equal(ast.clauses[0]?.value?.kind, "linkLookup");
    assert.equal(ast.branches, undefined);
  });

  it("/* */ is the comment; findMatchingRule still picks the OR rule", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("JOGADOR /* heroi */ / GOBLIN");
    assert.equal(ast.branches?.length, 2);
    const compiled = compileRuleFile(`# r
on: JOGADOR / GOBLIN /* ramos */
narrativa: 'ok'
`);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    assert.equal(findMatchingRule("JOGADOR", compiled.rules, world)?.id, "r");
    assert.equal(findMatchingRule("GOBLIN", compiled.rules, world)?.id, "r");
    assert.equal(findMatchingRule("ESPADA", compiled.rules, world), null);
  });

  it("OR specificity is the weaker arm; id still beats star", () => {
    const or = parseMatcher("JOGADOR / *.object");
    assert.equal(specificityOf(or), specificityOf(parseMatcher("*.object")));
    assert.ok(specificityOf(parseMatcher("JOGADOR")) > specificityOf(or));
    const bothIds = parseMatcher("JOGADOR / GOBLIN");
    assert.equal(specificityOf(bothIds), specificityOf(parseMatcher("JOGADOR")));
  });
});

describe("matcher link and TEM", () => {
  const SRC = `JOGADOR.{ tags: agent, vivo; links: alvo=GOBLIN, current_location=CAVERNA; lists: inventario=[TOCHA]; }
GOBLIN.{ tags: agent, vivo; links: current_location=CAVERNA; }
ESPADA.{ tags: object; links: current_location=JOGADOR; }
ANEL.{ tags: object; links: in=JOGADOR; }
TOCHA.{ tags: object; }
PEDRA.{ tags: object; links: current_location=CAVERNA; }
CAVERNA.{ tags: place; }
`;

  it("(link JOGADOR.alvo) is a selector walk, not a value", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("(link JOGADOR.alvo)");
    assert.equal(ast.selector.kind, "linkLookup");
    if (ast.selector.kind !== "linkLookup") return;
    assert.equal(ast.selector.entityId, "JOGADOR");
    assert.equal(ast.selector.key, "alvo");
    assert.equal(ast.branches, undefined);
    assert.equal(matchesEntity(ast, "GOBLIN", world, "JOGADOR"), true);
    assert.equal(matchesEntity(ast, "JOGADOR", world, "JOGADOR"), false);
    assert.equal(matchesEntity(ast, "ESPADA", world, "JOGADOR"), false);
  });

  it("(link JOGADOR.alvo).vivo walks then filters the dest", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("(link JOGADOR.alvo).vivo");
    assert.equal(ast.selector.kind, "linkLookup");
    assert.equal(ast.clauses[0]?.key, "vivo");
    assert.equal(matchesEntity(ast, "GOBLIN", world, "JOGADOR"), true);
    assert.equal(matchesEntity(ast, "CAVERNA", world, "JOGADOR"), false);
  });

  it("(link $.current_location) walks the trigger", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("(link $.current_location)");
    assert.equal(ast.selector.kind, "linkLookup");
    if (ast.selector.kind !== "linkLookup") return;
    assert.equal(ast.selector.entityId, "$");
    assert.equal(matchesEntity(ast, "CAVERNA", world, "JOGADOR"), true);
    assert.equal(matchesEntity(ast, "CAVERNA", world, "ESPADA"), false);
  });

  it("empty or missing link matches nobody", () => {
    const world = compileEntityFile(`JOGADOR.{ tags: agent; }\nGOBLIN.{ tags: agent; }\n`).worldModel;
    const ast = parseMatcher("(link JOGADOR.alvo)");
    assert.equal(matchesEntity(ast, "GOBLIN", world, "JOGADOR"), false);
    assert.equal(query(ast, world, "JOGADOR").length, 0);
  });

  it("(link) after = stays a value lookup", () => {
    const ast = parseMatcher("JOGADOR.alvo=(link GOBLIN.x)");
    assert.equal(ast.selector.kind, "id");
    assert.equal(ast.clauses[0]?.value?.kind, "linkLookup");
  });

  it("(link / GOBLIN) is grouping, not a walk", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("(link / GOBLIN)");
    assert.equal(ast.selector.kind, "id");
    assert.equal(ast.branches?.length, 2);
    assert.equal(matchesEntity(ast, "GOBLIN", world, "GOBLIN"), true);
    assert.equal(matchesEntity(ast, "JOGADOR", world, "JOGADOR"), false);
  });

  it("JOGADOR TEM ESPADA via current_location; not via an arbitrary link", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("JOGADOR TEM ESPADA");
    assert.equal(ast.selector.kind, "id");
    assert.equal(ast.possess?.negated, false);
    assert.equal(matchesEntity(ast, "JOGADOR", world, "JOGADOR"), true);
    assert.equal(matchesEntity(ast, "GOBLIN", world, "GOBLIN"), false);
    assert.equal(matchesEntity(parseMatcher("JOGADOR TEM GOBLIN"), "JOGADOR", world, "JOGADOR"), false);
    assert.equal(matchesEntity(parseMatcher("JOGADOR TEM PEDRA"), "JOGADOR", world, "JOGADOR"), false);
  });

  it("NAO_TEM is the inverse; NÃO_TEM folds the accent", () => {
    const world = compileEntityFile(SRC).worldModel;
    assert.equal(matchesEntity(parseMatcher("JOGADOR NAO_TEM ESPADA"), "JOGADOR", world, "JOGADOR"), false);
    assert.equal(matchesEntity(parseMatcher("GOBLIN NAO_TEM ESPADA"), "GOBLIN", world, "GOBLIN"), true);
    assert.equal(matchesEntity(parseMatcher("JOGADOR NÃO_TEM PEDRA"), "JOGADOR", world, "JOGADOR"), true);
    assert.equal(matchesEntity(parseMatcher("JOGADOR NAOTEM PEDRA"), "JOGADOR", world, "JOGADOR"), true);
  });

  it("TEM *.object, lists, and in all count as contents", () => {
    const world = compileEntityFile(SRC).worldModel;
    assert.equal(matchesEntity(parseMatcher("JOGADOR TEM *.object"), "JOGADOR", world, "JOGADOR"), true);
    assert.equal(matchesEntity(parseMatcher("JOGADOR TEM TOCHA"), "JOGADOR", world, "JOGADOR"), true);
    assert.equal(matchesEntity(parseMatcher("JOGADOR TEM ANEL"), "JOGADOR", world, "JOGADOR"), true);
    assert.equal(matchesEntity(parseMatcher("GOBLIN TEM TOCHA"), "GOBLIN", world, "GOBLIN"), false);
    assert.equal(matchesEntity(parseMatcher("GOBLIN TEM *.object"), "GOBLIN", world, "GOBLIN"), false);
  });

  it("bare TEM ESPADA is $ TEM ESPADA", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("TEM ESPADA");
    assert.equal(ast.selector.kind, "trigger");
    assert.equal(ast.possess?.negated, false);
    assert.equal(matchesEntity(ast, "JOGADOR", world, "JOGADOR"), true);
    assert.equal(matchesEntity(ast, "GOBLIN", world, "JOGADOR"), false);
    assert.equal(matchesEntity(ast, "GOBLIN", world, "GOBLIN"), false);
    assert.throws(() => parseMatcher("TEM"));
  });

  it("lowercase tem / nao_tem", () => {
    const world = compileEntityFile(SRC).worldModel;
    assert.equal(matchesEntity(parseMatcher("JOGADOR tem ESPADA"), "JOGADOR", world, "JOGADOR"), true);
    assert.equal(matchesEntity(parseMatcher("JOGADOR nao_tem PEDRA"), "JOGADOR", world, "JOGADOR"), true);
  });

  it("findMatchingRule still picks via TEM if; cave take matcher intact", () => {
    const world = compileEntityFile(SRC).worldModel;
    const compiled = compileRuleFile(`# r
on: JOGADOR
if: JOGADOR TEM ESPADA
narrativa: 'ok'
# n
on: JOGADOR
if: JOGADOR TEM PEDRA
narrativa: 'no'
`);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    assert.equal(findMatchingRule("JOGADOR", compiled.rules, world)?.id, "r");
    assert.equal(findMatchingRule("GOBLIN", compiled.rules, world), null);
    assert.equal(matchesEntity(parseMatcher("*.object.current_location=JOGADOR"), "ESPADA", world, "JOGADOR"), true);
    assert.equal(matchesEntity(parseMatcher("*.object.current_location=JOGADOR"), "PEDRA", world, "JOGADOR"), false);
  });

  it("linkLookup scores like id; TEM adds the item matcher", () => {
    assert.equal(specificityOf(parseMatcher("(link JOGADOR.alvo)")), specificityOf(parseMatcher("GOBLIN")));
    assert.ok(specificityOf(parseMatcher("JOGADOR TEM ESPADA")) > specificityOf(parseMatcher("JOGADOR")));
  });
});

describe("R6 highlight and complete", () => {
  it("highlights TEM, NAO_TEM, (link) and named do: verbs", () => {
    const tem = highlightSource("on: JOGADOR TEM ESPADA", "rules").flat();
    assert.ok(tem.some((s) => s.cls === "syn-kw" && s.text === "TEM"));
    const nao = highlightSource("if: JOGADOR NAO_TEM PEDRA", "rules").flat();
    assert.ok(nao.some((s) => s.cls === "syn-kw" && s.text === "NAO_TEM"));
    const accent = highlightSource("if: JOGADOR NÃO_TEM PEDRA", "rules").flat();
    assert.ok(accent.some((s) => s.cls === "syn-kw" && foldKw(s.text) === "NAO_TEM"));
    const walk = highlightSource("on: (link JOGADOR.alvo)", "rules").flat();
    assert.ok(walk.some((s) => s.cls === "syn-kw" && s.text === "link"));
    const named = highlightSource("do: SET_PHRASE JOGADOR.titulo Oi", "rules").flat();
    assert.ok(named.some((s) => s.cls === "syn-kw" && s.text === "SET_PHRASE"));
    const unlink = highlightSource("do: unlink JOGADOR.alvo", "rules").flat();
    assert.ok(unlink.some((s) => s.cls === "syn-kw" && s.text === "unlink"));
  });

  it("completes TEM / NAO_TEM / (link) on on: and named verbs on do:", () => {
    const vocab = collectVocabulary({});
    const on = completeAt("on: ", "rules", 4, vocab);
    assert.equal(on.ctx.slot, "selector");
    assert.ok(on.items.some((i) => i.label === "TEM" && i.insert === "TEM "));
    assert.ok(on.items.some((i) => i.label === "NAO_TEM" && i.insert === "NAO_TEM "));
    assert.ok(on.items.some((i) => i.label === "(link" && i.insert === "(link "));
    const iff = completeAt("if: JOGADOR T", "rules", "if: JOGADOR T".length, vocab);
    assert.equal(iff.ctx.slot, "selector");
    assert.ok(iff.items.some((i) => i.label === "TEM"));
    const doit = completeAt("do: ", "rules", 4, vocab);
    assert.equal(doit.ctx.slot, "do-verb");
    assert.ok(doit.items.some((i) => i.label === "SET_PHRASE"));
    assert.ok(doit.items.some((i) => i.label === "UNLINK"));
    assert.ok(doit.items.some((i) => i.label === "ADD_TAG"));
    assert.equal(doit.items.some((i) => i.label === "TEM"), false);
  });
});

function foldKw(raw: string): string {
  return raw.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
}
