import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { aplicarLinhaComando, correrComando } from "../../lib/comando.ts";
import { cartaoNaLinha, entityGuess, ligarPalavra, maisUmPalavra, MENU_CURSOR, nascerPalavra, saberPalavra, trechoDe } from "../../lib/write-menu.ts";
import { lerProsa } from "../../lib/leitor.ts";
import { addAnnotation, markHitsOnPage, applyNamedDoToDraft, type MutableDraft } from "../../lib/annotations.ts";
import { leituraAte, mapaDe } from "../../lib/timeline.ts";
import { compileEntityFile } from "../../../narrative-engine/lib/world-model.ts";
import { createExampleProject } from "../../../narrative-engine/lib/examples.ts";
import { compileProject } from "../../../narrative-engine/lib/project.ts";

const bloco = `@goblin.{
  id: #A1B2;
  name: ;
  description: ;
  tags: ;
  stats: ;
  flags: ;
  enums: ;
  phrases: ;
  hardLinks: ;
  softLinks: ;
  lists: ;
  fuses: ;
  struct: ;
}
`;

describe("K1 comando", () => {
  it("help sai e mostra a lista; o desconhecido fica", () => {
    const help = correrComando("help");
    assert.equal(help.cartao.ok, true);
    assert.equal(help.cartao.titulo, "Comandos");
    assert.ok(help.cartao.linhas.some((line) => line.startsWith("ent —")));
    assert.equal(help.cartao.linhas.some((line) => line.startsWith("frk")), false);
    assert.equal(help.entities, "");

    const src = "A sala está quieta.\n> help\nO fim chega.\n";
    const ran = aplicarLinhaComando(src, src.indexOf(">"));
    assert.ok(ran);
    assert.equal(ran.source, "A sala está quieta.\nO fim chega.\n");
    assert.equal(ran.cartao.ok, true);
    assert.equal(ran.source[ran.offset], "O");

    const bad = "A sala.\n> nao\n";
    const kept = aplicarLinhaComando(bad, bad.indexOf(">"));
    assert.ok(kept);
    assert.equal(kept.source, bad);
    assert.equal(kept.cartao.titulo, "Não conheço este comando.");

    const empty = aplicarLinhaComando("> \n", 0);
    assert.ok(empty);
    assert.equal(empty.source, "> \n");
    assert.equal(empty.cartao.titulo, "Falta o comando.");
    assert.equal(aplicarLinhaComando("A sala.\n", 0), null);
    assert.equal(lerProsa("> help\nA sala está quieta.\n").includes(">"), false);

    const editor = readFileSync(fileURLToPath(new URL("../../ui/NotebookEditor.tsx", import.meta.url)), "utf8");
    const preview = readFileSync(fileURLToPath(new URL("../../ui/WritePreview.tsx", import.meta.url)), "utf8");
    assert.match(editor, /aplicarLinhaComando/);
    assert.match(editor, /setEntities/);
    assert.match(editor, /addAnnotation/);
    assert.match(preview, /aria-label="Comando"/);
  });
});

describe("K2 ent e id", () => {
  it("cria, mostra, lista, apaga, renomeia e descreve", () => {
    const created = aplicarLinhaComando("> ent.create @Goblin\n", 0, "start()\n");
    assert.ok(created);
    assert.equal(created.source, "");
    assert.equal(created.cartao.titulo, "Nasceu @goblin");
    assert.match(created.entities, /@goblin\.\{/);
    assert.ok(compileEntityFile(created.entities).worldModel.has("@goblin"));

    const again = correrComando("ent.create @goblin", created.entities);
    assert.equal(again.cartao.ok, false);
    assert.equal(again.cartao.titulo, "Já existe @goblin.");
    assert.equal(again.entities, created.entities);

    const listed = correrComando("ent.list", created.entities);
    assert.deepEqual(listed.cartao.linhas, ["@goblin"]);

    const missing = correrComando("ent.show @mira", created.entities);
    assert.equal(missing.cartao.titulo, "Não achei @mira.");

    const renamed = correrComando("id.rename @goblin 'Goblin velho'", created.entities);
    assert.equal(renamed.cartao.ok, true);
    assert.match(renamed.entities, /name: 'Goblin velho';/);
    const shown = correrComando("ent.show @goblin", renamed.entities);
    assert.equal(shown.cartao.linhas[0], "nome: Goblin velho");

    const described = correrComando("id.describe @goblin 'Uma criatura pequena'", renamed.entities);
    assert.match(described.entities, /description: 'Uma criatura pequena';/);
    assert.equal(correrComando("id.rename @goblin Goblin", bloco).cartao.titulo, "O texto fica entre ' '.");
    assert.equal(correrComando('id.describe @goblin "x"', bloco).cartao.titulo, "O texto fica entre ' '.");

    const removed = correrComando("ent.delete @goblin", described.entities);
    assert.equal(removed.cartao.titulo, "Apaguei @goblin");
    assert.equal(compileEntityFile(removed.entities).worldModel.has("@goblin"), false);

    const slice = `start()\n# --- lume-caderno ---\n${bloco}`;
    const locked = correrComando("id.rename @goblin 'X'", slice);
    assert.equal(locked.cartao.titulo, "Esta entidade vem do caderno.");
    assert.equal(locked.entities, slice);
    assert.equal(correrComando("ent.delete @goblin", slice).cartao.ok, false);
    assert.equal(correrComando("ent.create", bloco).cartao.titulo, "Falta o id.");
    assert.equal(correrComando("ent.list sobra", bloco).cartao.titulo, "Não entendi.");
  });
});

function blank(): MutableDraft {
  return {
    id: "@goblin",
    tags: new Set(),
    stats: {},
    links: {},
    flags: {},
    enums: {},
    phrases: {},
    hardLinks: {},
    lists: {},
    fuses: {},
    struct: {},
  };
}

describe("K3 mut", () => {
  it("vira anotação, a linha sai e o ¹ fica na prosa", () => {
    const run = (cmd: string) => {
      const prose = `O goblin recua.\n> ${cmd}\n`;
      return aplicarLinhaComando(prose, prose.indexOf(">"), bloco);
    };

    const stat = run("mut.set.stats @goblin.medo 3");
    assert.ok(stat?.anotacao);
    assert.equal(stat.source, "O goblin recua.\n");
    assert.equal(stat.anotacao.do, "SET_STAT @goblin.medo 3");
    assert.equal(stat.anotacao.quote, "goblin");
    assert.equal(stat.cartao.titulo, "Marquei ¹");
    const hits = markHitsOnPage(stat.source, [{ ...stat.anotacao, id: "a1", book: "book-0" }]);
    assert.equal(hits.get(1)?.[0]?.mark, "¹");

    assert.equal(run("mut.add.stats @goblin.medo 1")?.anotacao?.do, "ADD_STAT @goblin.medo 1");
    assert.equal(run("mut.sub.stats @goblin.medo 2")?.anotacao?.do, "ADD_STAT @goblin.medo -2");
    assert.equal(run("mut.flag.on @goblin ferido")?.anotacao?.do, "SET_FLAG @goblin.ferido true");
    assert.equal(run("mut.flag.off @goblin.ferido")?.anotacao?.do, "SET_FLAG @goblin.ferido false");
    assert.equal(run("mut.enum @goblin.postura alerta")?.anotacao?.do, "SET_ENUM @goblin.postura alerta");
    assert.equal(run("mut.text @goblin.bio 'um guerreiro'")?.anotacao?.do, "SET_PHRASE @goblin.bio um guerreiro");
    assert.equal(run("mut.push.list @goblin.bolso moeda")?.anotacao?.do, "PUSH @goblin.bolso moeda");
    assert.equal(run("mut.pull.list @goblin.bolso moeda")?.anotacao?.do, "REMOVE @goblin.bolso moeda");
    assert.equal(run("mut.set.tags @goblin agente")?.anotacao?.do, "ADD_TAG @goblin agente");
    assert.equal(run("mut.pull.tags @goblin.agente")?.anotacao?.do, "REMOVE_TAG @goblin agente");
    assert.equal(run("mut.set.hardLinks @goblin.lugar @sala")?.anotacao?.do, "SET_LINK @goblin.hardLinks.lugar @sala");
    assert.equal(run("mut.pull.softLinks @goblin.olha")?.anotacao?.do, "UNLINK @goblin.olha");
    assert.equal(run("mut.set.fuses @goblin.pavio 4")?.anotacao?.do, "SET_FUSE @goblin.pavio 4");
    assert.equal(run("mut.set.struct @goblin.nota 'uma nota'")?.anotacao?.do, "STRUCT @goblin.nota uma nota");
    assert.equal(run("mut.pull.struct @goblin.nota")?.anotacao?.do, "STRUCT @goblin.nota");
    assert.equal(run("mut.set.lists @goblin.bolso moeda")?.cartao.titulo, "A lista usa push e pull.");
    assert.equal(run("mut.pull.stats @goblin.medo")?.cartao.ok, false);

    const alone = aplicarLinhaComando("> mut.set.stats @goblin.medo 3\n", 0, bloco);
    assert.equal(alone?.source, "> mut.set.stats @goblin.medo 3\n");
    assert.equal(alone?.cartao.titulo, "Não há prosa para marcar.");
    assert.equal(run("mut.set.stats @mira.medo 3")?.cartao.titulo, "Não achei @mira.");

    const owned = blank();
    assert.equal(applyNamedDoToDraft(owned, "ADD_STAT @goblin.medo 2"), true);
    assert.equal(applyNamedDoToDraft(owned, "ADD_STAT @goblin.medo -1"), true);
    assert.equal(owned.stats.medo, 1);
    owned.struct.nota = "x";
    assert.equal(applyNamedDoToDraft(owned, "STRUCT @goblin.nota"), true);
    assert.equal(owned.struct.nota, undefined);
  });
});

const molde = `@goblin.{
  id: #A1B2;
  name: ;
  description: ;
  tags: bruto;
  stats: hp=4;
  flags: ;
  enums: ;
  phrases: ;
  hardLinks: ;
  softLinks: ;
  lists: ;
  fuses: ;
  struct: ;
}
`;

describe("K4 inst", () => {
  it("marca o molde e cria a cópia numerada", () => {
    const marked = correrComando("inst.mark @goblin", molde);
    assert.equal(marked.cartao.titulo, "Marquei @goblin como molde");
    assert.match(marked.entities, /tags: bruto, molde;/);
    assert.equal(correrComando("inst.mark @goblin", marked.entities).cartao.titulo, "Já é molde.");
    assert.equal(correrComando("inst.create @goblin", molde).cartao.titulo, "Não é molde.");

    const first = correrComando("inst.create @goblin", marked.entities);
    assert.equal(first.cartao.titulo, "Nasceu @goblin_1");
    assert.deepEqual(first.cartao.linhas, ["nome: Goblin 1"]);
    const born = compileEntityFile(first.entities).worldModel.get("@goblin_1");
    assert.ok(born);
    assert.equal(born.name, "Goblin 1");
    assert.equal(born.templateId, "@goblin");
    assert.equal(born.stats.hp, 4);
    assert.equal(born.tags.has("molde"), false);
    assert.equal(born.tags.has("bruto"), true);

    const second = correrComando("inst.create @goblin stats.hp=25", first.entities);
    assert.equal(second.cartao.titulo, "Nasceu @goblin_2");
    assert.equal(compileEntityFile(second.entities).worldModel.get("@goblin_2")?.stats.hp, 25);

    const listed = correrComando("inst.list", second.entities);
    assert.deepEqual(listed.cartao.linhas, ["@goblin", "@goblin_1 · Goblin 1", "@goblin_2 · Goblin 2"]);

    const kept = correrComando("inst.destroy @goblin", second.entities);
    assert.equal(kept.cartao.titulo, "Isto é um molde.");
    const removed = correrComando("inst.destroy @goblin_1", second.entities);
    assert.equal(removed.cartao.titulo, "Apaguei @goblin_1");
    assert.equal(compileEntityFile(removed.entities).worldModel.has("@goblin_1"), false);
    assert.equal(compileEntityFile(removed.entities).worldModel.has("@goblin"), true);

    const slice = `start()\n# --- lume-caderno ---\n${molde}`;
    assert.equal(correrComando("inst.mark @goblin", slice).cartao.titulo, "Esta entidade vem do caderno.");

    const preview = readFileSync(fileURLToPath(new URL("../../ui/WritePreview.tsx", import.meta.url)), "utf8");
    assert.match(preview, /tags\.has\("molde"\)/);
  });
});

describe("K5 política", () => {
  it("a chave intacta segue o molde e a tocada fica", () => {
    const marked = correrComando("inst.mark @goblin", molde).entities;
    const born = correrComando("inst.create @goblin stats.hp=25", marked);
    const moved = born.entities.replace("tags: bruto, molde;\n  stats: hp=4;", "tags: bruto, molde;\n  stats: medo=2, hp=9;");
    const synced = correrComando("inst.sync @goblin_1", moved);
    assert.equal(synced.cartao.titulo, "Sincronizei @goblin_1");
    const copy = compileEntityFile(synced.entities).worldModel.get("@goblin_1");
    assert.equal(copy?.stats.hp, 25);
    assert.equal(copy?.stats.medo, 2);
    assert.equal(copy?.name, "Goblin 1");

    const undone = correrComando("inst.unset @goblin_1 stats.hp", synced.entities);
    assert.equal(undone.cartao.titulo, "Devolvi stats.hp");
    assert.equal(compileEntityFile(undone.entities).worldModel.get("@goblin_1")?.stats.hp, 9);

    const gone = undone.entities.replace(/@goblin\.\{[\s\S]*?\n\}\n*/, "");
    const missed = correrComando("inst.sync @goblin_1", gone);
    assert.equal(missed.cartao.titulo, "O molde de @goblin_1 se foi");
    assert.equal(missed.entities, gone);
  });

  it("reparent e um nível de molde", () => {
    const pai = molde.replace("@goblin", "@pai").replace("hp=4", "medo=2, hp=1");
    const filho = `@filho.{
  name: ;
  description: ;
  templateId: @pai;
  tags: molde;
  stats: hp=5;
  softLinks: ;
}
`;
    const base = `${pai}\n${filho}`;
    const born = correrComando("inst.create @filho", base);
    const synced = correrComando("inst.sync @filho_1", born.entities);
    const copy = compileEntityFile(synced.entities).worldModel.get("@filho_1");
    assert.equal(copy?.stats.hp, 5);
    assert.equal(copy?.stats.medo, 2);

    const outro = molde.replace("@goblin", "@outro").replace("hp=4", "hp=8");
    const joined = `${synced.entities}\n${outro}`;
    const marked = correrComando("inst.mark @outro", joined).entities;
    const moved = correrComando("inst.reparent @filho_1 @outro", marked);
    assert.equal(moved.cartao.titulo, "@filho_1 segue @outro");
    const next = compileEntityFile(moved.entities).worldModel.get("@filho_1");
    assert.equal(next?.templateId, "@outro");
    assert.equal(next?.stats.hp, 8);
    assert.equal(next?.name, "Filho 1");
  });
});

function pessoa(id: string, code: string, hard = "", soft = ""): string {
  return `${id}.{
  id: ${code};
  name: ;
  description: ;
  tags: ;
  stats: ;
  flags: ;
  enums: ;
  phrases: ;
  hardLinks: ${hard};
  softLinks: ${soft};
  lists: ;
  fuses: ;
  struct: ;
}
`;
}

const rede = `${pessoa("@goblin", "#A1B2", "lugar=@sala", "olha=@tocha")}\n${pessoa("@sala", "#A1B3", "porta=@tocha")}\n${pessoa("@tocha", "#A1B4")}`;

describe("K6 link", () => {
  it("grava ligação como anotação e a pergunta só mostra", () => {
    const run = (cmd: string, entities = rede) => {
      const prose = `O goblin recua.\n> ${cmd}\n`;
      return aplicarLinhaComando(prose, prose.indexOf(">"), entities);
    };
    const set = run("link.set.lugar @goblin @sala");
    assert.equal(set?.source, "O goblin recua.\n");
    assert.equal(set?.anotacao?.do, "SET_LINK @goblin.hardLinks.lugar @sala");
    assert.equal(set?.anotacao?.quote, "goblin");
    assert.equal(run("link.add.olha @goblin @tocha")?.anotacao?.do, "SET_LINK @goblin.softLinks.olha @tocha");
    assert.equal(run("link.pull.lugar @goblin @sala")?.anotacao?.do, "UNLINK @goblin.lugar");
    assert.equal(run("link.clear.olha @goblin")?.anotacao?.do, "UNLINK @goblin.olha");
    assert.equal(run("link.pull.lugar @goblin @tocha")?.cartao.titulo, "Não é esse destino.");
    assert.equal(run("link.pull.lugar @goblin @tocha")?.source.includes(">"), true);
    assert.equal(run("link.set.lugar @goblin @sumido")?.cartao.titulo, "Não achei @sumido.");

    const alone = aplicarLinhaComando("> link.set.lugar @goblin @sala\n", 0, rede);
    assert.equal(alone?.cartao.titulo, "Não há prosa para marcar.");

    assert.deepEqual(correrComando("link.from @goblin", rede).cartao.linhas, ["lugar → @sala", "olha ~ @tocha"]);
    assert.deepEqual(correrComando("link.to @goblin.lugar", rede).cartao.linhas, ["@sala"]);
    assert.deepEqual(correrComando("link.where @sala", rede).cartao.linhas, ["@goblin.lugar → @sala"]);
    assert.deepEqual(correrComando("link.tree @goblin", rede).cartao.linhas, ["lugar → @sala", "  porta → @tocha", "olha ~ @tocha"]);
  });
});

describe("K7 kno", () => {
  it("guarda o fato na lista sabe e mostra", () => {
    const learned = correrComando("kno.learn @goblin 'a porta range'", bloco);
    assert.equal(learned.cartao.titulo, "Aprendeu");
    assert.deepEqual(compileEntityFile(learned.entities).worldModel.get("@goblin")?.lists.sabe, ["a porta range"]);
    assert.equal(correrComando("kno.learn @goblin 'a porta range'", learned.entities).cartao.titulo, "Já sabe.");

    const more = correrComando("kno.learn @goblin 'o rei mente'", learned.entities);
    assert.deepEqual(correrComando("kno.show @goblin", more.entities).cartao.linhas, ["a porta range", "o rei mente"]);
    assert.deepEqual(correrComando("kno.at @goblin", more.entities).cartao.linhas, ["a porta range", "o rei mente"]);

    const forgotten = correrComando("kno.forget @goblin 'a porta range'", more.entities);
    assert.equal(forgotten.cartao.titulo, "Esqueceu");
    assert.deepEqual(compileEntityFile(forgotten.entities).worldModel.get("@goblin")?.lists.sabe, ["o rei mente"]);
    assert.equal(correrComando("kno.forget @goblin 'a porta range'", forgotten.entities).cartao.titulo, "Não sabia.");
    assert.equal(correrComando("kno.show @mira", bloco).cartao.titulo, "Não achei @mira.");
    assert.equal(correrComando("kno.learn @goblin a porta", bloco).cartao.titulo, "O texto fica entre ' '.");

    const slice = `start()\n# --- lume-caderno ---\n${bloco}`;
    assert.equal(correrComando("kno.learn @goblin 'segredo'", slice).cartao.titulo, "Esta entidade vem do caderno.");
  });
});

describe("K8 que", () => {
  it("pergunta ao mundo e não grava", () => {
    const src = `${pessoa("@goblin", "#A1B2", "lugar=@sala").replace("tags: ;", "tags: bruto;").replace("stats: ;", "stats: hp=4;").replace("lists: ;", "lists: sabe=['a porta range'];")}\n${pessoa("@sala", "#A1B3")}`;
    const where = correrComando("que.where @goblin", src);
    assert.deepEqual(where.cartao.linhas, ["lugar → @sala"]);
    assert.equal(where.entities, src);
    assert.deepEqual(correrComando("que.where.lugar @goblin", src).cartao.linhas, ["lugar → @sala"]);
    assert.deepEqual(correrComando("que.when tags=bruto", src).cartao.linhas, ["@goblin"]);
    assert.deepEqual(correrComando("que.when stats.hp=4", src).cartao.linhas, ["@goblin"]);
    assert.deepEqual(correrComando("que.when stats.hp=9", src).cartao.linhas, ["Nenhuma."]);
    assert.deepEqual(correrComando("que.knowledge @goblin", src).cartao.linhas, ["a porta range"]);
    assert.ok(correrComando("que.at @goblin", src).cartao.linhas.includes("stats: hp=4"));
    assert.equal(correrComando("que.at 3 @goblin", src).cartao.titulo, "Não entendi.");
    assert.deepEqual(correrComando("que.timeline @goblin.stats.hp", src).cartao.linhas, ["Nada."]);
    assert.equal(correrComando("que.foo @goblin", src).cartao.titulo, "Não entendi.");
  });
});

describe("K9 sea", () => {
  it("busca nas entidades e não grava", () => {
    const src = `${pessoa("@goblin", "#A1B2").replace("tags: ;", "tags: bruto;").replace("lists: ;", "lists: sabe=['a porta range'];")}\n${pessoa("@sala", "#A1B3")}`;
    const found = correrComando("sea.find 'porta'", src);
    assert.deepEqual(found.cartao.linhas, ["@goblin"]);
    assert.equal(found.entities, src);
    assert.deepEqual(correrComando("sea.find 'porta,bruto'", src).cartao.linhas, ["@goblin"]);
    assert.deepEqual(correrComando("sea.find 'sala/porta'", src).cartao.linhas, ["@goblin", "@sala"]);
    assert.deepEqual(correrComando("sea.find 'bruto|sumido'", src).cartao.linhas, ["@goblin"]);
    assert.deepEqual(correrComando("sea.find 'bruto|porta'", src).cartao.linhas, ["Nenhuma."]);
    assert.deepEqual(correrComando("sea.find '!porta'", src).cartao.linhas, ["@sala"]);
    assert.deepEqual(correrComando("sea.tag bruto", src).cartao.linhas, ["@goblin"]);
    assert.deepEqual(correrComando("sea.in bruto 'porta'", src).cartao.linhas, ["@goblin"]);
    assert.deepEqual(correrComando("sea.in bruto 'sumido'", src).cartao.linhas, ["Nenhuma."]);
    assert.ok(correrComando("sea.help", src).cartao.linhas.some((line) => line.startsWith("a,b")));
    assert.equal(correrComando("sea.find 'a,b/c'", src).cartao.titulo, "Não entendi.");
    assert.equal(correrComando("sea.find porta", src).cartao.titulo, "O texto fica entre ' '.");
  });
});

describe("K10 aud", () => {
  it("mostra o que não fecha e não grava", () => {
    const goblin = pessoa("@goblin", "#A1B2", "lugar=@sumida", "olha=@goblin")
      .replace("lists: ;", "lists: sabe=['@fantasma'];")
      .replace("fuses: ;", "fuses: relogio=3>@sumida;")
      .replace("struct: ;", "struct: ;\n  templateId: @sumido;");
    const src = `${goblin}\n${pessoa("@sala", "#A1B2")}`;
    const all = correrComando("aud", src);
    assert.equal(all.entities, src);
    assert.ok(all.cartao.linhas.includes("@goblin.lugar → @sumida"));
    assert.ok(all.cartao.linhas.includes("@goblin.olha aponta para si"));
    assert.ok(all.cartao.linhas.includes("@goblin e @sala usam #A1B2"));
    assert.ok(all.cartao.linhas.includes("@goblin sem molde @sumido"));
    assert.ok(all.cartao.linhas.includes("@goblin.relogio → @sumida"));
    assert.ok(all.cartao.linhas.includes("@goblin.sabe → @fantasma"));
    assert.deepEqual(correrComando("aud.links", src).cartao.linhas, ["@goblin.lugar → @sumida", "@goblin.olha aponta para si"]);
    assert.deepEqual(correrComando("aud", bloco).cartao.linhas, ["Fecha."]);
    assert.equal(correrComando("aud.rules", src).cartao.titulo, "Não entendi.");
  });
});

describe("U1 menu do cursor", () => {
  it("nasce, sabe, liga e copia pelo mesmo caminho da ordem", () => {
    assert.deepEqual([...MENU_CURSOR], ["Isto é…", "Mudar isto", "Ela sabe…", "Ligar a…", "Mais um como esta", "Nesta linha", "Mais"]);
    assert.equal(nascerPalavra(bloco, "  ", "pessoa").cartao.titulo, "marque a palavra");
    const born = nascerPalavra(bloco, "Mira", "lugar");
    assert.equal(born.cartao.titulo, "Nasceu @mira");
    assert.equal(compileEntityFile(born.entities).worldModel.get("@mira")?.tags.has("lugar"), true);
    assert.equal(born.entities.includes("@goblin"), true);

    const sabe = saberPalavra(bloco, "goblin", ["@goblin"], "a porta range");
    assert.equal(sabe.cartao.titulo, "Aprendeu");
    assert.deepEqual(compileEntityFile(sabe.entities).worldModel.get("@goblin")?.lists.sabe, ["a porta range"]);

    const ligado = ligarPalavra(`${bloco}\n${pessoa("@sala", "#A1B3")}`, "goblin", ["@goblin", "@sala"], "lugar", "@sala");
    assert.equal(ligado.mut?.do, "SET_LINK @goblin.hardLinks.lugar @sala");

    assert.equal(maisUmPalavra(bloco, "goblin", [{ id: "@goblin", tags: [] }]).cartao.titulo, "marque como modelo primeiro");
    const molde = correrComando("inst.mark @goblin", bloco);
    const copia = maisUmPalavra(molde.entities, "goblin", [{ id: "@goblin", tags: ["molde"] }]);
    assert.equal(copia.cartao.ok, true);
    assert.equal(compileEntityFile(copia.entities).worldModel.has("@goblin_1"), true);
  });
});

describe("U2 painel", () => {
  it("tem três lentes e o cartão sai só quando a linha muda", () => {
    const preview = readFileSync(fileURLToPath(new URL("../../ui/WritePreview.tsx", import.meta.url)), "utf8");
    assert.match(preview, /O que é verdade nesta linha\?/);
    assert.match(preview, /Agora/);
    assert.match(preview, /Esta pessoa/);
    assert.match(preview, /Avisos/);
    assert.match(preview, /Ver entidade/);
    assert.equal(cartaoNaLinha(null, 4, false).limpar, false);
    assert.equal(cartaoNaLinha(4, 4, false).limpar, false);
    assert.equal(cartaoNaLinha(4, 5, false).limpar, true);
    assert.equal(cartaoNaLinha(4, 5, true).limpar, false);
  });
});

describe("U3 relógio", () => {
  it("a ligação da linha 4 não existe na linha 2 e existe na 4", () => {
    const ents = `${bloco}\n${pessoa("@sala", "#A1B3")}`;
    const page = "um\ndois\ntres\no goblin\n";
    const noted = addAnnotation(page, {
      id: "a1",
      book: "book-0",
      heading: "",
      quote: "o goblin",
      do: "SET_LINK @goblin.hardLinks.lugar @sala",
      column: 2,
    });
    const clock = { prosa: noted };
    assert.deepEqual(correrComando("que.where @goblin", ents, { ...clock, linha: 2 }).cartao.linhas, ["Nenhuma."]);
    assert.deepEqual(correrComando("que.where @goblin", ents, { ...clock, linha: 4 }).cartao.linhas, ["lugar → @sala"]);
    assert.deepEqual(correrComando("que.timeline @goblin.hardLinks.lugar", ents, { ...clock, linha: 2 }).cartao.linhas, ["Nada."]);
    assert.deepEqual(correrComando("que.timeline @goblin.hardLinks.lugar", ents, { ...clock, linha: 4 }).cartao.linhas, ["L4 — → @sala"]);
    const learned = correrComando("kno.learn @goblin 'a porta range'", ents);
    assert.deepEqual(correrComando("kno.at @goblin", learned.entities, { prosa: page, linha: 2 }).cartao.linhas, ["a porta range"]);
    assert.equal(correrComando("que.at 3 @goblin", ents).cartao.titulo, "Não entendi.");
  });
});

describe("U4 mapa", () => {
  it("a ligação da linha 4 desenha-se na 4 e não na 2, sem entrar na prosa", () => {
    const ents = `${bloco}\n${pessoa("@sala", "#A1B3")}`;
    const page = "um\ndois\ntres\no goblin\n";
    const noted = addAnnotation(page, {
      id: "a1",
      book: "book-0",
      heading: "",
      quote: "o goblin",
      do: "SET_LINK @goblin.hardLinks.lugar @sala",
      column: 0,
    });
    const antes = mapaDe(leituraAte(noted, ents, 2).world);
    const depois = mapaDe(leituraAte(noted, ents, 4).world);
    assert.equal(antes.arestas.some((edge) => edge.de === "@goblin" && edge.para === "@sala"), false);
    assert.deepEqual(depois.arestas, [{ de: "@goblin", para: "@sala", nome: "lugar", dura: true }]);
    assert.equal("x" in depois, false);
    assert.equal("y" in depois, false);
    assert.equal(noted.includes("x:"), false);
    assert.equal(lerProsa(noted).includes("lugar"), false);
    const preview = readFileSync(fileURLToPath(new URL("../../ui/WritePreview.tsx", import.meta.url)), "utf8");
    assert.match(preview, /mapaDe\(leitura\.world\)/);
    assert.match(preview, /aria-label="Mapa"/);
  });
});

describe("U5 trecho", () => {
  it("marca o trecho da mesma linha e o ¹ fica no fim", () => {
    const page = "o goblin chegou";
    const marcado = trechoDe(page, 2, 2);
    assert.equal(marcado.text, "goblin");
    assert.equal(page.slice(marcado.start, marcado.end), "goblin");
    const frase = trechoDe(`  ${page}  `, 2, 2 + "o goblin".length);
    assert.equal(frase.text, "o goblin");
    assert.equal(frase.erro, undefined);
    const cruza = trechoDe("o goblin\nchegou", 0, 12);
    assert.equal(cruza.erro, "O trecho fica na mesma linha.");
    assert.equal(trechoDe("…", 0, 0).erro, "marque a palavra");
    assert.equal(entityGuess("o goblin", ["@sala", "@goblin"]), "@goblin");
    assert.equal(entityGuess("jogador", ["@sala", "@jogador"]), "@jogador");
    assert.equal(nascerPalavra(bloco, "o goblin", "pessoa").cartao.titulo, "Id inválido.");
    const noted = addAnnotation(page, {
      id: "a1",
      book: "book-0",
      heading: "",
      quote: "o goblin",
      do: "ADD_TAG @goblin bruto",
      column: 0,
    });
    const hit = markHitsOnPage(page, [{ id: "a1", book: "book-0", heading: "", quote: "o goblin", do: "ADD_TAG @goblin bruto", column: 0 }])
      .get(1)?.[0];
    assert.equal(hit && hit.column + hit.length, "o goblin".length);
    assert.equal(lerProsa(noted).includes("¹"), false);
    const editor = readFileSync(fileURLToPath(new URL("../../ui/NotebookEditor.tsx", import.meta.url)), "utf8");
    assert.match(editor, /trechoDe\(/);
  });
});

describe("U6 capítulo", () => {
  it("busca e audita o capítulo do >, sem mexer no que", () => {
    const ents = `${pessoa("@goblin", "#A1B2", "lugar=@sumida")}\n${pessoa("@tocha", "#A1B4", "lugar=@outra")}`;
    const page = "### Sala\no goblin\n### Rua\na tocha\n";
    const sala = { prosa: page, linha: 2 };
    const rua = { prosa: page, linha: 4 };
    assert.deepEqual(correrComando("sea.find 'sumida'", ents, sala).cartao.linhas, ["@goblin"]);
    assert.deepEqual(correrComando("sea.find 'outra'", ents, sala).cartao.linhas, ["Nenhuma."]);
    assert.deepEqual(correrComando("sea.find 'outra'", ents, rua).cartao.linhas, ["@tocha"]);
    assert.deepEqual(correrComando("sea.find 'sumida'", ents, rua).cartao.linhas, ["Nenhuma."]);
    assert.deepEqual(correrComando("aud.links", ents, sala).cartao.linhas, ["@goblin.lugar → @sumida"]);
    assert.deepEqual(correrComando("aud.links", ents, rua).cartao.linhas, ["@tocha.lugar → @outra"]);
    assert.deepEqual(correrComando("que.where @goblin", ents, rua).cartao.linhas, ["lugar → @sumida"]);
    assert.equal(correrComando("aud", ents, sala).entities, ents);
  });
});

describe("U7 falar", () => {
  it("aceita o nome e ela, e não escolhe quando há duas", () => {
    const mira = pessoa("@pessoa", "#A1B2", "lugar=@sala").replace("name: ;", "name: 'Mira';");
    const ana = pessoa("@ana", "#A1B4").replace("name: ;", "name: 'Ana';");
    const outra = pessoa("@outra", "#A1B5", "lugar=@rua").replace("name: ;", "name: 'Mira';");
    const sala = `${pessoa("@sala", "#A1B3")}`;
    const ents = `${mira}\n${ana}\n${sala}`;
    const page = "### Sala\nMira entrou\n.\n### Rua\nAna esperava\n.\n";
    const clock = { prosa: page, linha: 3 };
    assert.deepEqual(correrComando("que.where Mira", ents, clock).cartao.linhas, ["lugar → @sala"]);
    assert.deepEqual(correrComando("que.where ela", ents, clock).cartao.linhas, ["lugar → @sala"]);
    assert.deepEqual(correrComando("que.where ela", ents, { prosa: page, linha: 6 }).cartao.linhas, ["Nenhuma."]);
    assert.equal(correrComando("que.where Ana", ents, { prosa: page, linha: 6 }).cartao.titulo, "@ana");
    const duas = `${mira}\n${outra}\n${sala}`;
    assert.equal(correrComando("que.where Mira", duas, clock).cartao.titulo, "Não achei.");
    assert.deepEqual(correrComando("que.where @pessoa", ents, clock).cartao.linhas, ["lugar → @sala"]);
    const learned = correrComando("kno.learn @pessoa 'a porta range'", ents);
    assert.deepEqual(correrComando("kno.at ela", learned.entities, { prosa: page, linha: 3 }).cartao.linhas, ["a porta range"]);
  });
});

describe("U8 fecho", () => {
  it("prende o manuscrito sem gravar prosa nem mudar o jogo", () => {
    const ref = readFileSync(fileURLToPath(new URL("../../../ide-guide/lib/syntax-ref.ts", import.meta.url)), "utf8");
    assert.match(ref, /Isto é…/);
    assert.match(ref, /o que é verdade nesta linha/);
    assert.match(ref, /O mapa em Agora/);
    assert.match(ref, /O trecho marcado na mesma linha/);
    assert.match(ref, /busca no capítulo do >/);
    assert.match(ref, /ela e ele são a última pessoa/);
    assert.match(ref, /não gravam na prosa, não criam modo e não mudam o jogo/);

    const mira = pessoa("@pessoa", "#A1B2").replace("name: ;", "name: 'Mira';");
    const ents = `${mira}\n${pessoa("@sala", "#A1B3")}\n${pessoa("@tocha", "#A1B4", "lugar=@sumida")}`;
    const page = "### Sala\num\ndois\nMira entrou\n.\n### Rua\na tocha\n";
    const noted = addAnnotation(page, {
      id: "a1",
      book: "book-0",
      heading: "Sala",
      quote: "Mira entrou",
      do: "SET_LINK @pessoa.hardLinks.lugar @sala",
      column: 0,
    });
    const cedo = { prosa: noted, linha: 3 };
    const tarde = { prosa: noted, linha: 5 };
    assert.deepEqual(correrComando("que.where Mira", ents, cedo).cartao.linhas, ["Nenhuma."]);
    assert.deepEqual(correrComando("que.where ela", ents, cedo).cartao.titulo, "Não achei.");
    assert.deepEqual(correrComando("que.where ela", ents, tarde).cartao.linhas, ["lugar → @sala"]);
    assert.equal(mapaDe(leituraAte(noted, ents, 3).world).arestas.some((edge) => edge.para === "@sala"), false);
    assert.deepEqual(mapaDe(leituraAte(noted, ents, 4).world).arestas, [{ de: "@pessoa", para: "@sala", nome: "lugar", dura: true }]);
    assert.deepEqual(correrComando("aud.links", ents, tarde).cartao.linhas, ["Fecha."]);
    assert.deepEqual(correrComando("aud.links", ents, { prosa: noted, linha: 7 }).cartao.linhas, ["@tocha.lugar → @sumida"]);
    const frase = trechoDe("Mira entrou", 0, "Mira entrou".length);
    assert.equal(frase.text, "Mira entrou");
    assert.equal(frase.erro, undefined);
    assert.equal(trechoDe("Mira\nentrou", 0, 6).erro, "O trecho fica na mesma linha.");
    assert.equal(lerProsa(noted).includes(">"), false);
    assert.equal(lerProsa(noted).includes("SET_LINK"), false);
    assert.equal(compileProject(createExampleProject("goblin-cave")).errors.length, 0);
  });
});
