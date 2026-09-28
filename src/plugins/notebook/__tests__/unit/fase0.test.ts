import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../../narrative-engine/index.ts";
import { compileProject, createProject } from "../../../narrative-engine/index.ts";
import { createGame, bootGame, interactWith } from "../../../narrative-engine/index.ts";
import { findMatchingRule } from "../../../narrative-engine/index.ts";
import { compileNotebook } from "../../lib/notebook.ts";
import { aplicarLinhaComando, correrComando } from "../../lib/comando.ts";

describe("fase 0", () => {
  it("congela a caverna", () => {
    const cave = createExampleProject("goblin-cave");
    const compiled = compileProject(cave);
    assert.equal(compiled.errors.length, 0);
    assert.deepEqual([...compiled.worldModel.keys()].sort(), [
      "@caverna",
      "@entrada",
      "@goblin",
      "@isqueiro",
      "@jogador",
      "@ouro",
      "@tocha",
      "@trilha",
      "start",
    ]);
    assert.deepEqual(compiled.rules.map((rule) => rule.id), [
      "start",
      "escuro_demais",
      "entrar_com_luz",
      "cutucar_goblin",
      "atacar_goblin",
      "falar_com_goblin",
      "comunicar_com_goblin",
      "goblin_acordado",
      "atacar_goblin_acordado",
      "falar_com_goblin_acordado",
      "comunicar_com_goblin_acordado",
      "pegar_objeto",
      "pegar_com_intent",
      "andar",
      "andar_com_intent",
    ]);
    let game = bootGame(createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    assert.equal(game.story, "A boca da caverna se abre à sua frente. A Tocha está no chão, ao lado de um isqueiro gasto.");
    assert.equal(game.history.length, 1);
    game = interactWith(game, "@tocha");
    assert.equal(game.story, "Você pega Tocha.");
    assert.equal(game.worldModel.get("@tocha")?.links.current_location, "@jogador");
    assert.equal(game.worldModel.get("@jogador")?.stats.fear, 0);
    assert.deepEqual([...(game.worldModel.get("@goblin")?.tags ?? [])].sort(), ["goblin", "sleeping"]);
  });

  it("congela a regra", () => {
    const project = createProject("regra", {
      entitiesSource: "@pessoa.{ tags: agent; flags: acordado=false; }\nstart()\n",
      rulesSource: "# acende\nON: @pessoa\nIF: @pessoa.acordado=false\nDO: @pessoa.acordado\ntext: \"Acendeu.\"\n",
    });
    const compiled = compileProject(project);
    assert.equal(compiled.errors.length, 0);
    assert.deepEqual(compiled.rules.map((rule) => rule.id), ["acende"]);
    assert.equal(findMatchingRule("@pessoa", compiled.rules, compiled.worldModel, compiled.taxonomy)?.id, "acende");
    const game = interactWith(
      bootGame(createGame(compiled.worldModel, compiled.rules, "@pessoa", compiled.taxonomy)),
      "@pessoa",
    );
    assert.equal(game.story, "Acendeu.");
    assert.equal(game.worldModel.get("@pessoa")?.flags.acordado, false);
  });

  it("congela o caderno", () => {
    const page = "CADERNO: Casa\n### Sala\nO goblin está na sala.\nO goblin tem 4 de vida.\n";
    const nb = compileNotebook(page);
    assert.deepEqual(nb.issues, []);
    assert.equal(nb.rulesSource, "");
    assert.equal(nb.entitiesSource, `@sala.{
  id: #C64A;
  name: Sala;
  description: ;
  tags: place;
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

@goblin.{
  id: #8DFE;
  name: goblin;
  description: ;
  tags: agent, vivo;
  stats: hp=4;
  flags: ;
  enums: ;
  phrases: ;
  hardLinks: ;
  softLinks: in=@sala;
  lists: ;
  fuses: ;
  struct: ;
}`);
  });

  it("congela o comando >", () => {
    const ents = `@goblin.{
  id: #A1B2;
  name: ;
  description: ;
  tags: ;
  stats: hp=4;
  flags: ;
  enums: ;
  phrases: ;
  hardLinks: lugar=@sala;
  softLinks: ;
  lists: ;
  fuses: ;
  struct: ;
}
`;
    const help = correrComando("help", ents);
    assert.deepEqual(help.cartao.linhas, [
      "ent — criar, mostrar, listar, apagar",
      "id — nome e descrição",
      "mut — gavetas",
      "inst — molde e cópia",
      "link — ligação",
      "kno — o que alguém sabe",
      "que — perguntar ao mundo",
      "sea — buscar",
      "aud — o que não fecha",
      "rul — leis",
      "snip — moldes",
      "help — esta lista",
      "exp — levar a prosa",
    ]);
    assert.equal(help.entities, ents);
    assert.deepEqual(correrComando("ent.list", ents).cartao.linhas, ["@goblin"]);
    assert.deepEqual(correrComando("que.where @goblin", ents).cartao.linhas, ["lugar → @sala"]);
    assert.deepEqual(correrComando("sea.find 'hp'", ents).cartao.linhas, ["@goblin"]);
    assert.deepEqual(correrComando("aud", ents).cartao.linhas, ["@goblin.lugar → @sala"]);
    assert.equal(correrComando("foo", ents).cartao.titulo, "Não conheço este comando.");

    const page = "O goblin recua.\n> ent.list\n";
    const ran = aplicarLinhaComando(page, page.indexOf(">"), ents);
    assert.equal(ran?.source, "O goblin recua.\n");
    assert.equal(ran?.cartao.ok, true);
    assert.equal(ran?.entities, ents);

    const bad = "O goblin recua.\n> naoexiste\n";
    const stay = aplicarLinhaComando(bad, bad.indexOf(">"), ents);
    assert.equal(stay?.source, bad);
    assert.equal(stay?.cartao.ok, false);
    assert.equal(stay?.cartao.titulo, "Não conheço este comando.");
  });
});
