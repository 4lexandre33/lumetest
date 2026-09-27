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
import { createExampleProject } from "../../lib/examples.ts";
import { compileProject } from "../../lib/project.ts";

const DRAGON = `@dragao_anciao.{
  name: Dragão Ancião do Abismo;
  description: 'Uma besta ancestral envolta em chamas étereas e escamas impenetráveis.';
  tags: agent, vivo, chefe, voador, dragao;
  stats: hp=500[0..500], mp=200, ataque=85, defesa=60;
  flags: em_combate=true, enfurecido=true, imune_fogo=true, derrotado=false;
  enums: estado_fsm=[COMBATE_AEREO, TERRA], postura=[AGRESSIVO, NEUTRO], fase_chefe=[FASE_1, FASE_2];
  phrases: titulo='O Flagelo dos CÉUS', rugido_entrada='ROAAAR! Quem ousa invadir meu domínio?';
  hardLinks: elemento_core=@coracao_dragao, tesouro_guardado=@bau_dourado;
  softLinks: local_atual=@pico_serpente, alvo_foco=@jogador, oponente_direto=@heroi_lume;
  lists: inventario=[GEMA_FOGO, ESCAMA_ANCIA, CHAVE_RUINAS];
  fuses: temporizador_sopro=2, recarga_voo=4;
  struct: resistencias='fogo:100,gelo:-50,eletricidade:20';
}

@coracao_dragao.{ tags: object; }
@bau_dourado.{ tags: object; }
@pico_serpente.{ tags: place; }
@jogador.{ tags: agent; }
@heroi_lume.{ tags: agent; }
`;

describe("FBE entity", () => {
  it("parses the ten drawers, quad-ids and top fields", () => {
    const compiled = compileEntityFile(DRAGON);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    const e = compiled.worldModel.get("@dragao_anciao");
    assert.ok(e);
    assert.equal(e.id, "@dragao_anciao");
    assert.equal(e.slug, "@dragao_anciao");
    assert.equal(e.shortCode, shortCodeFromSlug("@dragao_anciao"));
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
    assert.equal(e.enums.estado_fsm.current, "COMBATE_AEREO");
    assert.deepEqual(e.enums.estado_fsm.states, ["COMBATE_AEREO", "TERRA"]);
    assert.equal(e.phrases.titulo, "O Flagelo dos CÉUS");
    assert.equal(e.hardLinks.elemento_core, "@coracao_dragao");
    assert.equal(e.softLinks.local_atual, "@pico_serpente");
    assert.equal(e.links.local_atual, "@pico_serpente");
    assert.deepEqual(e.lists.inventario, ["GEMA_FOGO", "ESCAMA_ANCIA", "CHAVE_RUINAS"]);
    assert.match(serializeEntityBlock(e), /inventario=\[GEMA_FOGO, ESCAMA_ANCIA, CHAVE_RUINAS\]/);
    assert.equal(e.fuses.temporizador_sopro?.remaining, 2);
    assert.equal(e.fuses.temporizador_sopro?.targetId, "temporizador_sopro");
    const resist = e.struct.resistencias as Record<string, number>;
    assert.equal(resist.fogo, 100);
    assert.equal(resist.gelo, -50);
  });

  it("keeps legacy links: as softLinks", () => {
    const e = parseEntityLine("@tocha.{ tags: object; stats: ; links: current_location=@jogador; name: Tocha; }");
    assert.equal(e.name, "Tocha");
    assert.equal(e.softLinks.current_location, "@jogador");
    assert.equal(e.links.current_location, "@jogador");
  });

  it("clamps bounded stats", () => {
    const e = createEmptyEntity("@x", { stats: { hp: { value: 10, min: 0, max: 20 } } });
    writeStat(e, "hp", 999);
    assert.equal(readStat(e, "hp"), 20);
    writeStat(e, "hp", -4);
    assert.equal(readStat(e, "hp"), 0);
  });

  it("cascade-destroys hardLinks and null-resets softLinks", () => {
    const world = compileEntityFile(`
@pai.{ tags: agent; hardLinks: filho=@filho; }
@filho.{ tags: object; }
@olho.{ tags: agent; softLinks: alvo=@filho; }
`).worldModel;
    destroyEntityInWorld(world, "@pai");
    assert.equal(world.has("@pai"), false);
    assert.equal(world.has("@filho"), false);
    assert.equal(world.get("@olho")?.softLinks.alvo, "");
  });

  it("ticks fuses and fires targetId", () => {
    const world = compileEntityFile(`@bomba.{ tags: object; fuses: estouro=1>@boom; }\n@boom.{ tags: event; }`).worldModel;
    const once = tickFuses(world);
    assert.equal(once.world.get("@bomba")?.fuses.estouro, undefined);
    assert.deepEqual(once.fired, ["@boom"]);
  });

  it("applies list ops", () => {
    const world = compileEntityFile(`@bag.{ tags: object; lists: inventario=[A]; }`).worldModel;
    const push = parseDoLine("PUSH @bag.inventario B").change!;
    const unique = parseDoLine("ADD_UNIQUE @bag.inventario A").change!;
    let next = applyChanges(world, [push], "@bag");
    next = applyChanges(next, [unique], "@bag");
    assert.deepEqual(next.get("@bag")?.lists.inventario, ["A", "B"]);
    const pop = parseDoLine("POP @bag.inventario").change!;
    next = applyChanges(next, [pop], "@bag");
    assert.deepEqual(next.get("@bag")?.lists.inventario, ["A"]);
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
    const src = "@x.{\n  ";
    const ctx = analyzeCompletion(src, "entities", src.length);
    assert.equal(ctx.slot, "entity-section");
  });

  it("parses the spec example without bounded stats", () => {
    const src = `@dragao_anciao.{
  name: Dragão Ancião do Abismo;
  description: 'Uma besta ancestral envolta em chamas étereas e escamas impenetráveis.';
  tags: agent, vivo, chefe, voador, dragao;
  stats: hp=500, mp=200, ataque=85, defesa=60;
  flags: em_combate=true, enfurecido=true, imune_fogo=true, derrotado=false;
  enums: estado_fsm=[COMBATE_AEREO, TERRA], postura=[AGRESSIVO, NEUTRO], fase_chefe=[FASE_1, FASE_2];
  phrases: titulo='O Flagelo dos CÉUS', rugido_entrada='ROAAAR! Quem ousa invadir meu domínio?';
  hardLinks: elemento_core=@coracao_dragao, tesouro_guardado=@bau_dourado;
  softLinks: local_atual=@pico_serpente, alvo_foco=@jogador, oponente_direto=@heroi_lume;
  lists: inventario=[GEMA_FOGO, ESCAMA_ANCIA, CHAVE_RUINAS];
  fuses: temporizador_sopro=2, recarga_voo=4;
  struct: resistencias='fogo:100,gelo:-50,eletricidade:20';
}
@coracao_dragao.{ tags: object; }
@bau_dourado.{ tags: object; }
@pico_serpente.{ tags: place; }
@jogador.{ tags: agent; }
@heroi_lume.{ tags: agent; }
`;
    const compiled = compileEntityFile(src);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    const e = compiled.worldModel.get("@dragao_anciao")!;
    assert.equal(e.stats.hp, 500);
    assert.equal(e.fuses.recarga_voo?.remaining, 4);
  });

  it("does not put extra in the blank block", () => {
    const b = blankEntityBlock("HEROI");
    assert.equal(b.includes("extra:"), false);
  });

  it("resolves Quad-IDs", () => {
    const world = compileEntityFile("@jogador.{ tags: agent; name: Você; }").worldModel;
    const e = world.get("@jogador")!;
    assert.equal(findEntityByQuad(world, e.shortCode)?.id, "@jogador");
    assert.equal(findEntityByQuad(world, e.systemId)?.id, "@jogador");
    assert.equal(findEntityByQuad(world, "@jogador")?.id, "@jogador");
  });

  it("SPAWN FROM copies the template drawers", () => {
    const world = compileEntityFile(`
@proto.{ tags: agent, vivo; stats: hp=10; flags: chefe=false; enums: fase=[UM, DOIS]; }
`).worldModel;
    const spawn = parseDoLine("SPAWN @g1 FROM @proto").change!;
    const next = applyChanges(world, [spawn], "start");
    const g1 = next.get("@g1");
    assert.ok(g1);
    assert.equal(g1.templateId, "@proto");
    assert.ok(g1.tags.has("vivo"));
    assert.equal(g1.stats.hp, 10);
    assert.equal(g1.flags.chefe, false);
    assert.equal(g1.enums.fase.current, "UM");
    assert.deepEqual(g1.enums.fase.states, ["UM", "DOIS"]);
    assert.notEqual(g1.systemId, world.get("@proto")?.systemId);
    assert.notEqual(g1.shortCode, world.get("@proto")?.shortCode);
  });

  it("CREATE dotted sets templateId instead of a link", () => {
    const world = compileEntityFile("@proto.{ tags: object; stats: peso=3; }").worldModel;
    const create = parseDoLine("CREATE @g2.templateId=@proto").change!;
    const next = applyChanges(world, [create], "start");
    const g2 = next.get("@g2")!;
    assert.equal(g2.templateId, "@proto");
    assert.equal(g2.softLinks.templateId, undefined);
    assert.equal(g2.stats.peso, 3);
  });

  it("serializes templateId after description", () => {
    const e = createEmptyEntity("@filhote", { name: "Filhote", templateId: "@dragao_anciao", tags: ["agent"] });
    const src = serializeEntityBlock(e);
    const desc = src.indexOf("description:");
    const tmpl = src.indexOf("templateId:");
    const tags = src.indexOf("tags:");
    assert.ok(desc >= 0 && tmpl > desc && tags > tmpl);
  });
});

describe("FBE drawer paths", () => {
  const SRC = `@jogador.{
  tags: agent;
  stats: hp=50[0..100], fear=2;
  flags: em_combate=true;
  enums: postura=[AGRESSIVO, DEFESA];
  phrases: titulo='Heroi';
  hardLinks: reliquia=@gema;
  softLinks: alvo=@goblin;
  lists: inventario=[@tocha];
  fuses: sopro=2;
}
@goblin.{ tags: agent, vivo; stats: hp=30; }
@gema.{ tags: object; }
`;

  it("parses drawer.chave without treating the drawer as a tag", () => {
    const ast = parseMatcher("@jogador.stats.hp>=10");
    assert.equal(ast.selector.kind, "id");
    assert.equal(ast.clauses[0]?.drawer, "stats");
    assert.equal(ast.clauses[0]?.key, "hp");
    assert.equal(ast.clauses[0]?.op, ">=");
    const compact = parseMatcher("@jogador.hp>=10");
    assert.equal(compact.clauses[0]?.drawer, undefined);
    assert.equal(compact.clauses[0]?.key, "hp");
  });

  it("matches stats/flags/enums/links via drawer and via compact key", () => {
    const world = compileEntityFile(SRC).worldModel;
    const id = "@jogador";
    assert.equal(matchesEntity(parseMatcher("@jogador.stats.hp>=10"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("@jogador.hp>=10"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("@jogador.stats.hp>=90"), id, world, id), false);
    assert.equal(matchesEntity(parseMatcher("@jogador.flags.em_combate=true"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("@jogador.em_combate=true"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("@jogador.enums.postura=AGRESSIVO"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("@jogador.softLinks.alvo=@goblin"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("@jogador.tags.agent"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("@jogador.tags.!objeto"), id, world, id), true);
    assert.equal(matchesEntity(parseMatcher("*.stats.hp>40"), id, world, id), true);
    assert.equal(query("*.stats.hp>40", world).map(([i]) => i).includes("@goblin"), false);
  });

  it("accepts == as = on a drawer path", () => {
    const ast = parseMatcher("@jogador.flags.em_combate==true");
    assert.equal(ast.clauses[0]?.op, "=");
  });

  it("resolves #XXXX in the matcher selector without changing findMatchingRule", () => {
    const world = compileEntityFile(SRC).worldModel;
    const code = world.get("@jogador")!.shortCode;
    assert.match(code, /^#[0-9A-F]{4}$/);
    const ast = parseMatcher(`${code}.stats.hp>10`);
    assert.equal(ast.selector.kind, "id");
    if (ast.selector.kind === "id") assert.equal(ast.selector.id, code);
    assert.equal(matchesEntity(ast, "@jogador", world, "@jogador"), true);
    assert.equal(matchesEntity(ast, "@goblin", world, "@goblin"), false);
    const compiled = compileRuleFile(`# r\non: ${code}\nnarrativa: 'quad'\n`);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    const rule = findMatchingRule("@jogador", compiled.rules, world);
    assert.equal(rule?.id, "r");
    assert.equal(findMatchingRule("@goblin", compiled.rules, world), null);
  });

  it("compact do: @jogador.stats.hp-10 does not add a stats tag", () => {
    const world = compileEntityFile(SRC).worldModel;
    const change = parseChangeLine("@jogador.stats.hp-10");
    assert.equal(change.fields.length, 1);
    assert.equal(change.fields[0]?.kind, "deltaStat");
    const next = applyChanges(world, [change], "@jogador");
    const e = next.get("@jogador")!;
    assert.equal(readStat(e, "hp"), 40);
    assert.equal(e.tags.has("stats"), false);
  });

  it("compact do: drawer sets flag, enum, hard and soft links", () => {
    const world = compileEntityFile(SRC).worldModel;
    let next = applyChanges(world, [parseChangeLine("@jogador.flags.em_combate=false")], "@jogador");
    assert.equal(next.get("@jogador")!.flags.em_combate, false);
    next = applyChanges(next, [parseChangeLine("@jogador.enums.postura=DEFESA")], "@jogador");
    assert.equal(next.get("@jogador")!.enums.postura.current, "DEFESA");
    assert.deepEqual(next.get("@jogador")!.enums.postura.states, ["AGRESSIVO", "DEFESA"]);
    assert.equal(next.get("@jogador")!.softLinks.postura, undefined);
    next = applyChanges(next, [parseChangeLine("@jogador.softLinks.alvo=@gema")], "@jogador");
    assert.equal(next.get("@jogador")!.softLinks.alvo, "@gema");
    next = applyChanges(next, [parseChangeLine("@jogador.hardLinks.reliquia=@goblin")], "@jogador");
    assert.equal(next.get("@jogador")!.hardLinks.reliquia, "@goblin");
    next = applyChanges(next, [parseChangeLine("@jogador.tags.ferido")], "@jogador");
    assert.ok(next.get("@jogador")!.tags.has("ferido"));
    next = applyChanges(next, [parseChangeLine("@jogador.tags.-agent")], "@jogador");
    assert.equal(next.get("@jogador")!.tags.has("agent"), false);
  });

  it("compact do: reads source stat through a drawer path", () => {
    const world = compileEntityFile(SRC).worldModel;
    const change = parseChangeLine("@jogador.stats.hp-@goblin.stats.hp");
    const next = applyChanges(world, [change], "@jogador");
    assert.equal(readStat(next.get("@jogador")!, "hp"), 20);
  });

  it("compact do: #XXXX target resolves via Quad-ID", () => {
    const world = compileEntityFile(SRC).worldModel;
    const code = world.get("@jogador")!.shortCode;
    const next = applyChanges(world, [parseChangeLine(`${code}.stats.fear+3`)], "start");
    assert.equal(readStat(next.get("@jogador")!, "fear"), 5);
  });

  it("rejects lists/fuses/struct compact do paths", () => {
    assert.throws(() => parseChangeLine("@jogador.lists.inventario=@x"));
    assert.throws(() => parseChangeLine("@jogador.fuses.sopro=3"));
  });
});

describe("FBE named do:", () => {
  const SRC = `@jogador.{
  tags: agent, vivo;
  stats: hp=50[0..100], fear=2;
  flags: em_combate=true;
  enums: postura=[AGRESSIVO, DEFESA];
  phrases: titulo='Heroi';
  hardLinks: reliquia=@gema;
  softLinks: alvo=@goblin;
  lists: inventario=[@tocha];
  fuses: sopro=2;
}
@goblin.{ tags: agent, vivo; stats: hp=30; }
@gema.{ tags: object; }
@bomba.{ tags: object; }
`;

  it("aliases named mutations to the same ChangeField as compact", () => {
    assert.deepEqual(parseDoLine("ADD_TAG @jogador ferido").change?.fields[0], { kind: "addTag", tag: "ferido" });
    assert.deepEqual(parseDoLine("@jogador.ferido").change?.fields[0], { kind: "addTag", tag: "ferido" });
    assert.deepEqual(parseDoLine("add_tag @jogador.ferido").change?.fields[0], { kind: "addTag", tag: "ferido" });
    assert.deepEqual(parseDoLine("REMOVE_TAG @jogador vivo").change?.fields[0], { kind: "removeTag", tag: "vivo" });
    assert.deepEqual(parseDoLine("@jogador.-vivo").change?.fields[0], { kind: "removeTag", tag: "vivo" });
    assert.deepEqual(parseDoLine("SET_STAT @jogador.hp 10").change?.fields[0], { kind: "setStat", key: "hp", value: 10 });
    assert.deepEqual(parseDoLine("@jogador.stats.hp=10").change?.fields[0], { kind: "setStat", key: "hp", value: 10 });
    assert.deepEqual(parseDoLine("ADD_STAT @jogador.hp -10").change?.fields[0], { kind: "deltaStat", key: "hp", delta: -10 });
    assert.deepEqual(parseDoLine("@jogador.hp-10").change?.fields[0], { kind: "deltaStat", key: "hp", delta: -10 });
    assert.deepEqual(parseDoLine("MUL_STAT @jogador.fear 2").change?.fields[0], { kind: "mulStat", key: "fear", factor: 2 });
    assert.deepEqual(parseDoLine("SET_FLAG @jogador.em_combate false").change?.fields[0], { kind: "setFlag", key: "em_combate", value: false });
    assert.deepEqual(parseDoLine("set_flag @jogador.flags.em_combate true").change?.fields[0], { kind: "setFlag", key: "em_combate", value: true });
    assert.deepEqual(parseDoLine("SET_ENUM @jogador.postura DEFESA").change?.fields[0], { kind: "setEnum", key: "postura", value: "DEFESA" });
    assert.deepEqual(parseDoLine("SET_LINK @jogador.alvo @gema").change?.fields[0], {
      kind: "setLink",
      key: "alvo",
      value: { kind: "id", id: "@gema" },
    });
    assert.deepEqual(parseDoLine("SET_LINK @jogador.hardLinks.reliquia @goblin").change?.fields[0], {
      kind: "setLink",
      key: "reliquia",
      value: { kind: "id", id: "@goblin" },
      linkKind: "hard",
    });
  });

  it("SET_PHRASE fills the phrases drawer (named + compact)", () => {
    const world = compileEntityFile(SRC).worldModel;
    const named = parseDoLine("SET_PHRASE @jogador.titulo 'O Flagelo dos CEUS'");
    assert.deepEqual(named.change?.fields[0], { kind: "setPhrase", key: "titulo", value: "O Flagelo dos CEUS" });
    const next = applyChanges(world, [named.change!], "@jogador");
    assert.equal(next.get("@jogador")!.phrases.titulo, "O Flagelo dos CEUS");
    assert.equal(next.get("@jogador")!.softLinks.titulo, undefined);
    const compact = parseChangeLine("@jogador.phrases.titulo=Heroi");
    assert.equal(compact.fields[0]?.kind, "setPhrase");
    const after = applyChanges(world, [compact], "@jogador");
    assert.equal(after.get("@jogador")!.phrases.titulo, "Heroi");
    assert.equal(after.get("@jogador")!.links.titulo, undefined);
  });

  it("UNLINK / CLEAR_LINK break hard and soft without cascade DESTROY", () => {
    const world = compileEntityFile(SRC).worldModel;
    let next = applyChanges(world, [parseDoLine("UNLINK @jogador.alvo").change!], "@jogador");
    assert.equal(next.get("@jogador")!.softLinks.alvo, undefined);
    assert.equal(next.get("@jogador")!.links.alvo, undefined);
    assert.ok(next.get("@goblin"));
    next = applyChanges(next, [parseDoLine("CLEAR_LINK @jogador.hardLinks.reliquia").change!], "@jogador");
    assert.equal(next.get("@jogador")!.hardLinks.reliquia, undefined);
    assert.ok(next.get("@gema"));
  });

  it("SET_FUSE arms a fuse; TICK stays an effect", () => {
    const world = compileEntityFile(SRC).worldModel;
    const armed = parseDoLine("set_fuse @bomba.estouro 3>@boom");
    assert.equal(armed.effect, undefined);
    assert.deepEqual(armed.change?.fields[0], { kind: "setFuse", key: "estouro", remaining: 3, targetId: "@boom" });
    const next = applyChanges(world, [armed.change!], "@bomba");
    assert.equal(next.get("@bomba")!.fuses.estouro?.remaining, 3);
    assert.equal(next.get("@bomba")!.fuses.estouro?.targetId, "@boom");
    const tick = parseDoLine("TICK");
    assert.equal(tick.change, undefined);
    assert.equal(tick.effect?.verb, "tick");
    assert.throws(() => parseChangeLine("@bomba.fuses.estouro=3"));
  });

  it("ADD_STAT named can subtract another entity stat and resolve #XXXX", () => {
    const world = compileEntityFile(SRC).worldModel;
    const from = parseDoLine("ADD_STAT @jogador.hp -@goblin.stats.hp");
    assert.equal(from.change?.fields[0]?.kind, "deltaStatFrom");
    const next = applyChanges(world, [from.change!], "@jogador");
    assert.equal(readStat(next.get("@jogador")!, "hp"), 20);
    const code = world.get("@jogador")!.shortCode;
    const flagged = applyChanges(world, [parseDoLine(`SET_FLAG ${code}.em_combate false`).change!], "start");
    assert.equal(flagged.get("@jogador")!.flags.em_combate, false);
  });

  it("named do: applies inside a compiled rule without changing findMatchingRule", () => {
    const world = compileEntityFile(SRC).worldModel;
    const compiled = compileRuleFile(`# r
on: @jogador
do: set_flag @jogador.em_combate false
    set_phrase @jogador.titulo 'ok'
    unlink @jogador.alvo
    set_fuse @jogador.sopro 4>@boom
narrativa: 'x'
`);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    const rule = findMatchingRule("@jogador", compiled.rules, world);
    assert.equal(rule?.id, "r");
    const next = applyChanges(world, rule!.changes, "@jogador");
    assert.equal(next.get("@jogador")!.flags.em_combate, false);
    assert.equal(next.get("@jogador")!.phrases.titulo, "ok");
    assert.equal(next.get("@jogador")!.links.alvo, undefined);
    assert.equal(next.get("@jogador")!.fuses.sopro?.remaining, 4);
    assert.equal(next.get("@jogador")!.fuses.sopro?.targetId, "@boom");
  });
});

describe("matcher or and group", () => {
  const SRC = `@jogador.{ tags: agent, vivo; stats: hp=50; }
@goblin.{ tags: agent, morto; stats: hp=30; }
@espada.{ tags: object; }
`;

  it("keeps a simple matcher without branches", () => {
    const ast = parseMatcher("@jogador.vivo");
    assert.equal(ast.branches, undefined);
    assert.equal(ast.selector.kind, "id");
    assert.equal(ast.clauses[0]?.key, "vivo");
  });

  it("/ is OR of two matchers; // is not a comment", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("@jogador / @goblin");
    assert.equal(ast.branches?.length, 2);
    assert.equal(matchesEntity(ast, "@jogador", world, "@jogador"), true);
    assert.equal(matchesEntity(ast, "@goblin", world, "@goblin"), true);
    assert.equal(matchesEntity(ast, "@espada", world, "@espada"), false);
    assert.throws(() => parseMatcher("@jogador // @goblin"));
  });

  it("dots bind tighter than /", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("@jogador.vivo / @goblin.vivo");
    assert.equal(matchesEntity(ast, "@jogador", world, "@jogador"), true);
    assert.equal(matchesEntity(ast, "@goblin", world, "@goblin"), false);
  });

  it("(A / B).clause distributes onto both arms", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("(@jogador / @goblin).vivo");
    assert.equal(ast.branches?.length, 2);
    assert.equal(matchesEntity(ast, "@jogador", world, "@jogador"), true);
    assert.equal(matchesEntity(ast, "@goblin", world, "@goblin"), false);
    const tagged = parseMatcher("(@jogador / @goblin).agent");
    assert.equal(matchesEntity(tagged, "@goblin", world, "@goblin"), true);
  });

  it("@jogador.(vivo / morto) is clause OR on one selector", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("*.(vivo / morto)");
    assert.equal(matchesEntity(ast, "@jogador", world, "@jogador"), true);
    assert.equal(matchesEntity(ast, "@goblin", world, "@goblin"), true);
    assert.equal(matchesEntity(ast, "@espada", world, "@espada"), false);
  });

  it("*.agent / *.object and nested parens", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("*.agent / *.object");
    assert.equal(query(ast, world).map(([id]) => id).sort().join(","), "@espada,@goblin,@jogador");
    const nested = parseMatcher("(*.agent / (*.object / @jogador)).hp>0");
    assert.equal(matchesEntity(nested, "@espada", world, "@espada"), false);
    assert.equal(matchesEntity(nested, "@goblin", world, "@goblin"), true);
  });

  it("(link) after = stays a value lookup, not a group", () => {
    const ast = parseMatcher("@jogador.alvo=(link @goblin.x)");
    assert.equal(ast.clauses[0]?.value?.kind, "linkLookup");
    assert.equal(ast.branches, undefined);
  });

  it("/* */ is the comment; findMatchingRule still picks the OR rule", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("@jogador /* heroi */ / @goblin");
    assert.equal(ast.branches?.length, 2);
    const compiled = compileRuleFile(`# r
on: @jogador / @goblin /* ramos */
narrativa: 'ok'
`);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    assert.equal(findMatchingRule("@jogador", compiled.rules, world)?.id, "r");
    assert.equal(findMatchingRule("@goblin", compiled.rules, world)?.id, "r");
    assert.equal(findMatchingRule("@espada", compiled.rules, world), null);
  });

  it("OR specificity is the weaker arm; id still beats star", () => {
    const or = parseMatcher("@jogador / *.object");
    assert.equal(specificityOf(or), specificityOf(parseMatcher("*.object")));
    assert.ok(specificityOf(parseMatcher("@jogador")) > specificityOf(or));
    const bothIds = parseMatcher("@jogador / @goblin");
    assert.equal(specificityOf(bothIds), specificityOf(parseMatcher("@jogador")));
  });
});

describe("matcher link and TEM", () => {
  const SRC = `@jogador.{ tags: agent, vivo; links: alvo=@goblin, current_location=@caverna; lists: inventario=[@tocha]; }
@goblin.{ tags: agent, vivo; links: current_location=@caverna; }
@espada.{ tags: object; links: current_location=@jogador; }
@anel.{ tags: object; links: in=@jogador; }
@tocha.{ tags: object; }
@pedra.{ tags: object; links: current_location=@caverna; }
@caverna.{ tags: place; }
`;

  it("(link @jogador.alvo) is a selector walk, not a value", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("(link @jogador.alvo)");
    assert.equal(ast.selector.kind, "linkLookup");
    if (ast.selector.kind !== "linkLookup") return;
    assert.equal(ast.selector.entityId, "@jogador");
    assert.equal(ast.selector.key, "alvo");
    assert.equal(ast.branches, undefined);
    assert.equal(matchesEntity(ast, "@goblin", world, "@jogador"), true);
    assert.equal(matchesEntity(ast, "@jogador", world, "@jogador"), false);
    assert.equal(matchesEntity(ast, "@espada", world, "@jogador"), false);
  });

  it("(link @jogador.alvo).vivo walks then filters the dest", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("(link @jogador.alvo).vivo");
    assert.equal(ast.selector.kind, "linkLookup");
    assert.equal(ast.clauses[0]?.key, "vivo");
    assert.equal(matchesEntity(ast, "@goblin", world, "@jogador"), true);
    assert.equal(matchesEntity(ast, "@caverna", world, "@jogador"), false);
  });

  it("(link $.current_location) walks the trigger", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("(link $.current_location)");
    assert.equal(ast.selector.kind, "linkLookup");
    if (ast.selector.kind !== "linkLookup") return;
    assert.equal(ast.selector.entityId, "$");
    assert.equal(matchesEntity(ast, "@caverna", world, "@jogador"), true);
    assert.equal(matchesEntity(ast, "@caverna", world, "@espada"), false);
  });

  it("empty or missing link matches nobody", () => {
    const world = compileEntityFile(`@jogador.{ tags: agent; }\n@goblin.{ tags: agent; }\n`).worldModel;
    const ast = parseMatcher("(link @jogador.alvo)");
    assert.equal(matchesEntity(ast, "@goblin", world, "@jogador"), false);
    assert.equal(query(ast, world, "@jogador").length, 0);
  });

  it("(link) after = stays a value lookup", () => {
    const ast = parseMatcher("@jogador.alvo=(link @goblin.x)");
    assert.equal(ast.selector.kind, "id");
    assert.equal(ast.clauses[0]?.value?.kind, "linkLookup");
  });

  it("(link / @goblin) is grouping, not a walk", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("(link / @goblin)");
    assert.equal(ast.selector.kind, "id");
    assert.equal(ast.branches?.length, 2);
    assert.equal(matchesEntity(ast, "@goblin", world, "@goblin"), true);
    assert.equal(matchesEntity(ast, "@jogador", world, "@jogador"), false);
  });

  it("@jogador TEM @espada via current_location; not via an arbitrary link", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("@jogador TEM @espada");
    assert.equal(ast.selector.kind, "id");
    assert.equal(ast.possess?.negated, false);
    assert.equal(matchesEntity(ast, "@jogador", world, "@jogador"), true);
    assert.equal(matchesEntity(ast, "@goblin", world, "@goblin"), false);
    assert.equal(matchesEntity(parseMatcher("@jogador TEM @goblin"), "@jogador", world, "@jogador"), false);
    assert.equal(matchesEntity(parseMatcher("@jogador TEM @pedra"), "@jogador", world, "@jogador"), false);
  });

  it("NAO_TEM is the inverse; NÃO_TEM folds the accent", () => {
    const world = compileEntityFile(SRC).worldModel;
    assert.equal(matchesEntity(parseMatcher("@jogador NAO_TEM @espada"), "@jogador", world, "@jogador"), false);
    assert.equal(matchesEntity(parseMatcher("@goblin NAO_TEM @espada"), "@goblin", world, "@goblin"), true);
    assert.equal(matchesEntity(parseMatcher("@jogador NÃO_TEM @pedra"), "@jogador", world, "@jogador"), true);
    assert.equal(matchesEntity(parseMatcher("@jogador NAOTEM @pedra"), "@jogador", world, "@jogador"), true);
  });

  it("TEM *.object, lists, and in all count as contents", () => {
    const world = compileEntityFile(SRC).worldModel;
    assert.equal(matchesEntity(parseMatcher("@jogador TEM *.object"), "@jogador", world, "@jogador"), true);
    assert.equal(matchesEntity(parseMatcher("@jogador TEM @tocha"), "@jogador", world, "@jogador"), true);
    assert.equal(matchesEntity(parseMatcher("@jogador TEM @anel"), "@jogador", world, "@jogador"), true);
    assert.equal(matchesEntity(parseMatcher("@goblin TEM @tocha"), "@goblin", world, "@goblin"), false);
    assert.equal(matchesEntity(parseMatcher("@goblin TEM *.object"), "@goblin", world, "@goblin"), false);
  });

  it("bare TEM @espada is $ TEM @espada", () => {
    const world = compileEntityFile(SRC).worldModel;
    const ast = parseMatcher("TEM @espada");
    assert.equal(ast.selector.kind, "trigger");
    assert.equal(ast.possess?.negated, false);
    assert.equal(matchesEntity(ast, "@jogador", world, "@jogador"), true);
    assert.equal(matchesEntity(ast, "@goblin", world, "@jogador"), false);
    assert.equal(matchesEntity(ast, "@goblin", world, "@goblin"), false);
    assert.throws(() => parseMatcher("TEM"));
  });

  it("lowercase tem / nao_tem", () => {
    const world = compileEntityFile(SRC).worldModel;
    assert.equal(matchesEntity(parseMatcher("@jogador tem @espada"), "@jogador", world, "@jogador"), true);
    assert.equal(matchesEntity(parseMatcher("@jogador nao_tem @pedra"), "@jogador", world, "@jogador"), true);
  });

  it("findMatchingRule still picks via TEM if; cave take matcher intact", () => {
    const world = compileEntityFile(SRC).worldModel;
    const compiled = compileRuleFile(`# r
on: @jogador
if: @jogador TEM @espada
narrativa: 'ok'
# n
on: @jogador
if: @jogador TEM @pedra
narrativa: 'no'
`);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    assert.equal(findMatchingRule("@jogador", compiled.rules, world)?.id, "r");
    assert.equal(findMatchingRule("@goblin", compiled.rules, world), null);
    assert.equal(matchesEntity(parseMatcher("*.object.current_location=@jogador"), "@espada", world, "@jogador"), true);
    assert.equal(matchesEntity(parseMatcher("*.object.current_location=@jogador"), "@pedra", world, "@jogador"), false);
  });

  it("linkLookup scores like id; TEM adds the item matcher", () => {
    assert.equal(specificityOf(parseMatcher("(link @jogador.alvo)")), specificityOf(parseMatcher("@goblin")));
    assert.ok(specificityOf(parseMatcher("@jogador TEM @espada")) > specificityOf(parseMatcher("@jogador")));
  });
});

describe("R6 highlight and complete", () => {
  it("highlights TEM, NAO_TEM, (link) and named do: verbs", () => {
    const tem = highlightSource("on: @jogador TEM @espada", "rules").flat();
    assert.ok(tem.some((s) => s.cls === "syn-kw" && s.text === "TEM"));
    const nao = highlightSource("if: @jogador NAO_TEM @pedra", "rules").flat();
    assert.ok(nao.some((s) => s.cls === "syn-kw" && s.text === "NAO_TEM"));
    const accent = highlightSource("if: @jogador NÃO_TEM @pedra", "rules").flat();
    assert.ok(accent.some((s) => s.cls === "syn-kw" && foldKw(s.text) === "NAO_TEM"));
    const walk = highlightSource("on: (link @jogador.alvo)", "rules").flat();
    assert.ok(walk.some((s) => s.cls === "syn-kw" && s.text === "link"));
    const named = highlightSource("do: SET_PHRASE @jogador.titulo Oi", "rules").flat();
    assert.ok(named.some((s) => s.cls === "syn-kw" && s.text === "SET_PHRASE"));
    const unlink = highlightSource("do: unlink @jogador.alvo", "rules").flat();
    assert.ok(unlink.some((s) => s.cls === "syn-kw" && s.text === "unlink"));
  });

  it("completes TEM / NAO_TEM / (link) on on: and named verbs on do:", () => {
    const vocab = collectVocabulary({});
    const on = completeAt("on: ", "rules", 4, vocab);
    assert.equal(on.ctx.slot, "selector");
    assert.ok(on.items.some((i) => i.label === "TEM" && i.insert === "TEM "));
    assert.ok(on.items.some((i) => i.label === "NAO_TEM" && i.insert === "NAO_TEM "));
    assert.ok(on.items.some((i) => i.label === "(link" && i.insert === "(link "));
    const iff = completeAt("if: @jogador T", "rules", "if: @jogador T".length, vocab);
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

describe("G8 cut legacy JOGADOR", () => {
  it("parses @pessoa, injects start, refuses @jogador, and keeps the cave compiling", () => {
    const ok = compileEntityFile("@pessoa.{ tags: agent; name: Ana; }");
    assert.equal(ok.errors.length, 0, ok.errors.map((e) => e.message).join("\n"));
    const pessoa = ok.worldModel.get("@pessoa");
    assert.ok(pessoa);
    assert.equal(pessoa.id, "@pessoa");
    assert.equal(shortCodeFromSlug("@jogador"), shortCodeFromSlug("JOGADOR"));
    assert.ok(ok.worldModel.has("start"));
    const missing = compileEntityFile("pessoa.{ tags: agent; }");
    assert.equal(missing.errors.some((e) => e.code === "E040"), true);
    const mixed = compileEntityFile("@Pessoa.{ tags: agent; }");
    assert.equal(mixed.errors.some((e) => e.code === "E040"), true);
    const legacy = compileEntityFile("JOGADOR.{ tags: agent; }");
    assert.equal(legacy.errors.some((e) => e.code === "E040"), true);
    assert.equal(legacy.worldModel.has("JOGADOR"), false);
    const blank = blankEntityBlock("@pessoa");
    assert.match(blank, /^@pessoa\.\{\n  id: #/);
    const cave = createExampleProject("goblin-cave");
    const compiled = compileProject(cave);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    assert.ok(compiled.worldModel.has("@jogador"));
    assert.equal(cave.settings.playerEntityId, "@jogador");
    assert.match(cave.entitiesSource, /@jogador\.\{/);
    assert.equal(cave.entitiesSource.includes("JOGADOR.{"), false);
  });
});

describe("H2 enum domain", () => {
  it("accepts a list, rejects a bare value, and SET_ENUM only moves inside the list", () => {
    const src = `@porta.{ tags: object; enums: estado=[FECHADA, ABERTA]; }`;
    const compiled = compileEntityFile(src);
    assert.equal(compiled.errors.length, 0, compiled.errors.map((e) => e.message).join("\n"));
    const porta = compiled.worldModel.get("@porta")!;
    assert.equal(porta.enums.estado.current, "FECHADA");
    assert.deepEqual(porta.enums.estado.states, ["FECHADA", "ABERTA"]);
    assert.match(serializeEntityBlock(porta), /estado=\[FECHADA, ABERTA\]/);

    const bare = compileEntityFile(`@porta.{ enums: estado=FECHADA; }`);
    assert.match(bare.errors.map((e) => e.message).join("\n"), /nome=\[estado, estado\]/);
    const one = compileEntityFile(`@porta.{ enums: estado=[SO]; }`);
    assert.match(one.errors.map((e) => e.message).join("\n"), /pelo menos 2/);

    const next = applyChanges(compiled.worldModel, [parseDoLine("SET_ENUM @porta.estado ABERTA").change!], "@porta");
    assert.equal(next.get("@porta")!.enums.estado.current, "ABERTA");
    assert.deepEqual(next.get("@porta")!.enums.estado.states, ["FECHADA", "ABERTA"]);
    assert.equal(matchesEntity(parseMatcher("@porta.enums.estado=ABERTA"), "@porta", next, "@porta"), true);
    assert.equal(matchesEntity(parseMatcher("@porta.enums.estado=FECHADA"), "@porta", next, "@porta"), false);
    assert.throws(() => applyChanges(next, [parseDoLine("SET_ENUM @porta.estado TRANCADA").change!], "@porta"));
  });
});

function foldKw(raw: string): string {
  return raw.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
}
