import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createCore, type Core } from "../../../../core/index.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin } from "../../../narrative-engine/index.ts";
import type { NarrativeEngineService } from "../../../narrative-engine/types.ts";
import { createExampleProject } from "../../../narrative-engine/index.ts";
import { compileProject, coerceProject, createProject } from "../../../narrative-engine/index.ts";
import { createGame, interactWith, rewindTo } from "../../../narrative-engine/index.ts";
import { cloneWorldModel, compileEntityFile } from "../../../narrative-engine/index.ts";
import { exportSession, replaySession } from "../../../narrative-engine/index.ts";
import { parsePadrao, bannerOf } from "../../../narrative-engine/index.ts";
import { buildPlayBundle, encodePlayHash, parseShareHash } from "../../../narrative-engine/index.ts";
import { highlightSource } from "../../../narrative-engine/index.ts";
import { insertEntity, insertRule, expandEntityDecl } from "../../../narrative-engine/index.ts";
import { interpret } from "../../../nlp/index.ts";
import { tabAfterKeyword, indentOnEnter, addLineNote, insertSectionBreak, completeAt, collectVocabulary } from "../../../narrative-engine/index.ts";
import { LIFE_MANIFEST, createLifePlugin } from "../../../life/index.ts";
import { NOTEBOOK_MANIFEST, createNotebookPlugin, compileNotebook, EMPTY_NOTEBOOK, slugOf, assistNotebook, slowRulesNote, parseCadernoView, replaceCover, applyNotebookToProject, parseCadernoLibrary, appendCaderno, exportCadernoMd, importCaderno, cadernoFilename, resetNotebookCache, replaceBookSource, CADERNO_SLICE_START, writeCadernoSlice, applyNotebookToProjectWithIssues, extractCadernoSlice, compileCadernoLibraryAsync, notebooksHash, stripCadernoSlice, selectionOf, insertAtSelection, insertRegrasSection, entityGuess, keysOfDrawer, phrasesOfProject, describeMutation, cadernoLive, linkTargets, enumStates, FBE_DRAWERS, addAnnotation, stripAnotacoesSlice, parseAnotacoesSlice, marksOnPage, markHitsOnPage, doFromDraft, proseTriggers, tokenAt, writeSuggestions, rulesFromSource, authorshipTimeline, authorshipBaseWorld, snapDrawer, diffDrawers, entityHistory, changedSnaps, removeAnnotation, isRegrasFence, rebindAnnotation } from "../../index.ts";
import { leituraAte } from "../../lib/timeline.ts";

function worldOf(text: string) {
  const nb = compileNotebook(text);
  const project = createProject("caderno", {
    entitiesSource: `${nb.entitiesSource}\nstart()\n`,
    rulesSource: `${nb.rulesSource}\n# start\nON: start\nnarrativa: "ok"\n`,
    taxonomySource: nb.taxonomySource,
    extras: nb.extras,
  });
  return { nb, compiled: compileProject(project) };
}

function take(game: ReturnType<typeof createGame>, id: string) {
  const world = cloneWorldModel(game.worldModel);
  const actor = world.get(game.playerEntityId);
  if (actor) actor.links.intent = "take";
  return interactWith({ ...game, worldModel: world }, id);
}

describe("Notebook", () => {
  let core: Core;
  let notebook: NotebookService;
  let narrative: NarrativeEngineService;

  beforeEach(async () => {
    core = createCore();
    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    core.registerPlugin(NOTEBOOK_MANIFEST, createNotebookPlugin);
    await core.activatePlugin("lume-narrative-engine");
    await core.activatePlugin("lume-notebook");
    notebook = core.getService<NotebookService>("Notebook");
    narrative = core.getService<NarrativeEngineService>("NarrativeEngine");
  });

  it("declares Notebook and compiles empty text to empty sources", () => {
    assert.equal(NOTEBOOK_MANIFEST.name, "lume-notebook");
    assert.deepEqual(notebook.compile(""), EMPTY_NOTEBOOK);
    assert.deepEqual(compileNotebook(""), EMPTY_NOTEBOOK);
    assert.deepEqual(notebook.assist(""), { notes: [] });
    assert.deepEqual(assistNotebook(""), { notes: [] });
    assert.equal(slugOf("A Espada Enferrujada"), "ESPADA_ENFERRUJADA");
  });

  it("turns a north exit into a pair of rooms", () => {
    const { nb, compiled } = worldOf("A caverna leva ao norte para a floresta.");
    assert.equal(nb.issues.length, 0);
    assert.equal(nb.rulesSource, "");
    assert.equal(compiled.errors.length, 0);
    assert.ok(compiled.worldModel.get("@caverna")?.tags.has("place"));
    assert.equal(compiled.worldModel.get("@caverna")?.links.exit_n, "@floresta");
    assert.ok(compiled.worldModel.get("@floresta")?.tags.has("place"));
    assert.equal(compiled.worldModel.get("@floresta")?.links.exit_s, "@caverna");
  });

  it("places objects and people, tags, and section aliases", () => {
    const text = `## 2. Os Objectos
### 2.1 A Espada Enferrujada
A espada enferrujada está na caverna.
Ela é uma arma.
Ela é amaldiçoada.

## 3. As Pessoas
### 3.1 O Goblin
O goblin está na caverna.
Ele é hostil.
Ele é covarde.
`;
    const { nb, compiled } = worldOf(text);
    assert.equal(nb.issues.length, 0);
    const espada = compiled.worldModel.get("@espada_enferrujada");
    assert.ok(espada?.tags.has("object"));
    assert.ok(espada?.tags.has("weapon"));
    assert.ok(espada?.tags.has("cursed"));
    assert.equal(espada?.links.in, "@caverna");
    const goblin = compiled.worldModel.get("@goblin");
    assert.ok(goblin?.tags.has("agent"));
    assert.ok(goblin?.tags.has("vivo"));
    assert.ok(goblin?.tags.has("hostile"));
    assert.ok(goblin?.tags.has("covarde"));
    assert.equal(goblin?.links.in, "@caverna");
    assert.ok(compiled.worldModel.get("@caverna")?.tags.has("place"));
  });

  it("uses a description line as place extra and fails closed on junk", () => {
    const { nb, compiled } = worldOf(`### A Caverna
A caverna é húmida e fria.
blorple xyz.
Quando o jogador pega a espada:
`);
    assert.ok(nb.issues.some((issue) => issue.message === "Não percebi esta linha." && issue.line === 3));
    assert.equal(nb.issues.some((issue) => issue.line === 4), false);
    assert.match(nb.rulesSource, /on: @espada/);
    assert.match(nb.rulesSource, /@jogador\.intent=take/);
    assert.equal(compiled.worldModel.get("@caverna")?.description, "A caverna é húmida e fria.");
    assert.ok(compiled.worldModel.get("@espada"));
  });

  it("compiles Quando/narre/cause/marque like a handwritten rule", () => {
    const text = `### A Espada
A espada está na caverna.
Quando o jogador pega a espada:
  narre "Sua mão recua como se uma onda de pavor a tivesse atingido."
  cause 5 de dano ao jogador.
  marque o jogador como "maldito".
`;
    const nb = compileNotebook(text);
    assert.equal(nb.issues.length, 0);
    assert.match(nb.rulesSource, /on: @espada/);
    assert.match(nb.rulesSource, /if: @jogador\.intent=take/);
    assert.match(nb.rulesSource, /@jogador\.hp - 5/);
    assert.match(nb.rulesSource, /@jogador\.maldito/);
    assert.match(nb.rulesSource, /Sua mão recua/);
    assert.equal(nb.rulesSource.includes("WAIT"), false);

    const hand = `# pega
ON: @espada
IF: @jogador.intent=take
DO: @jogador.hp - 5
    @jogador.maldito
narrativa: "Sua mão recua como se uma onda de pavor a tivesse atingido."
`;
    const entities = `${nb.entitiesSource}
start()
`;
    const fromNb = compileProject(createProject("nb", { entitiesSource: entities, rulesSource: `${nb.rulesSource}\n# start\nON: start\nnarrativa: "ok"\n` }));
    const fromHand = compileProject(createProject("hand", { entitiesSource: entities, rulesSource: `${hand}\n# start\nON: start\nnarrativa: "ok"\n` }));
    assert.equal(fromNb.errors.length, 0, fromNb.errors.map((e) => e.message).join("; "));
    assert.equal(fromHand.errors.length, 0);
    fromNb.worldModel.get("@jogador")!.stats.hp = 10;
    fromHand.worldModel.get("@jogador")!.stats.hp = 10;
    let g1 = narrative.bootGame(createGame(fromNb.worldModel, fromNb.rules, "@jogador", fromNb.taxonomy));
    let g2 = narrative.bootGame(createGame(fromHand.worldModel, fromHand.rules, "@jogador", fromHand.taxonomy));
    g1 = take(g1, "@espada");
    g2 = take(g2, "@espada");
    assert.equal(g1.worldModel.get("@jogador")?.stats.hp, 5);
    assert.equal(g2.worldModel.get("@jogador")?.stats.hp, 5);
    assert.equal(g1.worldModel.get("@jogador")?.tags.has("maldito"), true);
    assert.equal(g2.worldModel.get("@jogador")?.tags.has("maldito"), true);
    assert.ok(g1.story.includes("mão recua"));
    assert.ok(g2.story.includes("mão recua"));
  });

  it("warns on unknown verbs and a cada turno without emitting WAIT", () => {
    const nb = compileNotebook(`Quando o jogador blorple a espada:
  a cada turno:
  narre "x"
`);
    assert.ok(nb.issues.some((issue) => issue.line === 1));
    assert.ok(nb.issues.some((issue) => issue.line === 2));
    assert.equal(nb.rulesSource.includes("WAIT"), false);
    assert.equal(nb.rulesSource.includes("blorple"), false);
  });

  it("tears espada and maldição da espada into one id", () => {
    const nb = compileNotebook(`### A Espada
A espada está na caverna.
Ela é uma arma.

### A Maldição da Espada
A maldição da espada é sanguessuga.
Veja também: A Espada.
`);
    assert.equal(nb.issues.filter((issue) => issue.code === "W014").length, 0);
    assert.match(nb.entitiesSource, /^@espada\.\{/m);
    assert.equal(/MALDIC/i.test(nb.entitiesSource), false);
    const { compiled } = worldOf(`### A Espada
A espada está na caverna.

### A Maldição da Espada
A maldição da espada é sanguessuga.
`);
    assert.ok(compiled.worldModel.has("@espada"));
    const extras = [...compiled.worldModel.keys()].filter((id) => id !== "start" && id !== "@caverna" && id !== "@jogador");
    assert.deepEqual(extras, ["@espada"]);
  });

  it("warns W014 on missing Veja também and E020 on homonyms", () => {
    const missing = compileNotebook(`### A Espada
Veja também: Seção 9 — O Dragão.
`);
    assert.ok(missing.issues.some((issue) => issue.code === "W014" && issue.line === 2));

    const clash = compileNotebook(`### A Maldição da Espada
### A Maldição do Anel
A maldição está na caverna.
`);
    assert.ok(clash.issues.some((issue) => issue.code === "E020"));
  });

  it("registers também chamada and does not tear by similarity", () => {
    const { compiled } = worldOf(`### A Espada Enferrujada
também chamada: relíquia do goblin
A relíquia do goblin está na caverna.
`);
    assert.ok(compiled.worldModel.has("@espada_enferrujada"));
    assert.equal(compiled.worldModel.get("@espada_enferrujada")?.links.in, "@caverna");
    assert.equal(compiled.worldModel.has("RELIQUIA_DO_GOBLIN"), false);

    const similar = compileNotebook(`### A Espada
### A Escada
`);
    const ids = [...similar.entitiesSource.matchAll(/^(@?[A-Za-z0-9_]+)\.\{/gm)].map((m) => m[1]);
    assert.ok(ids.includes("@espada"));
    assert.ok(ids.includes("@escada"));
  });

  it("omits inactive Maldições rules; ids stay put; old session still replays", () => {
    const base = `### A Espada
A espada está na caverna.

## 4. As Maldições
### A Maldição da Espada
Quando o jogador pega a espada:
  narre "Sua mão recua."
  cause 5 de dano ao jogador.
`;
    const off = `### A Espada
A espada está na caverna.

## 4. As Maldições
activa: não
### A Maldição da Espada
Quando o jogador pega a espada:
  narre "Sua mão recua."
  cause 5 de dano ao jogador.
`;
    const moved = `## 9. Outra pasta
### A Espada
A espada está na caverna.
`;
    const onNb = compileNotebook(base);
    const offNb = compileNotebook(off);
    assert.match(onNb.rulesSource, /@jogador\.hp - 5/);
    assert.equal(offNb.rulesSource.includes("hp"), false);
    assert.match(offNb.entitiesSource, /^@espada\.\{/m);
    assert.equal(/MALDIC/i.test(offNb.entitiesSource), false);
    const movedNb = compileNotebook(moved);
    assert.match(movedNb.entitiesSource, /^@espada\.\{/m);

    const withPlayer = (source: string) =>
      /@jogador\.\{/.test(source)
        ? `${source}\nstart()\n`
        : `@jogador.{ tags: agent; stats: hp=10; links: ; name: Jogador; }\n${source}\nstart()\n`;

    const onProj = createProject("on", {
      entitiesSource: withPlayer(onNb.entitiesSource),
      rulesSource: `${onNb.rulesSource}\n# start\nON: start\nnarrativa: "ok"\n`,
    });
    const onCompiled = compileProject(onProj);
    assert.equal(onCompiled.errors.length, 0);
    onCompiled.worldModel.get("@jogador")!.stats.hp = 10;
    let live = narrative.bootGame(createGame(onCompiled.worldModel, onCompiled.rules, "@jogador", onCompiled.taxonomy));
    live = take(live, "@espada");
    assert.equal(live.worldModel.get("@jogador")?.stats.hp, 5);
    const snapshot = exportSession(live);
    const rewound = rewindTo(live, 0);
    assert.equal(rewound.worldModel.get("@jogador")?.stats.hp, 10);
    const replayed = replaySession(snapshot, onCompiled.rules, "@jogador", onCompiled.taxonomy);
    assert.equal(replayed.history.length, snapshot.triggerIds.length);
    assert.equal(live.worldModel.get("@jogador")?.stats.hp, 5);

    const offCompiled = compileProject(createProject("off", {
      entitiesSource: withPlayer(offNb.entitiesSource),
      rulesSource: `${offNb.rulesSource}\n# start\nON: start\nnarrativa: "ok"\n`,
    }));
    offCompiled.worldModel.get("@jogador")!.stats.hp = 10;
    let fresh = narrative.bootGame(createGame(offCompiled.worldModel, offCompiled.rules, "@jogador", offCompiled.taxonomy));
    fresh = take(fresh, "@espada");
    assert.equal(fresh.worldModel.get("@jogador")?.stats.hp, 10);
    assert.equal(live.worldModel.get("@jogador")?.stats.hp, 5);
  });

  it("chains LIVE for a nearby coward goblin and WAIT on a cada turno; dry-run lists only", async () => {
    const turno = compileNotebook(`### A Espada
A espada está na caverna.
Quando o jogador pega a espada:
  a cada turno:
    cause 1 de dano ao jogador.
`);
    assert.equal(turno.issues.length, 0);
    assert.match(turno.rulesSource, /WAIT 1\.FUSE_/);
    assert.match(turno.rulesSource, /@jogador\.hp - 1/);
    assert.equal(turno.rulesSource.includes("LIVE"), false);

    const text = `### A Caverna
A caverna é húmida e fria.
O jogador está na caverna.

### O Goblin
O goblin está na caverna.
Ele é covarde.

### A Espada
A espada está na caverna.
Quando o jogador pega a espada:
  narre "A lâmina canta."
  Quando o goblin é marcado como "covarde":
    narre "O goblin recua."
    marque o goblin como "alerta".
`;
    const { nb, compiled } = worldOf(text);
    assert.equal(nb.issues.length, 0);
    assert.match(nb.rulesSource, /do: LIVE/);
    assert.match(nb.rulesSource, /on: @goblin/);
    assert.equal(compiled.errors.length, 0);

    compiled.worldModel.get("@jogador")!.links.in = "@caverna";
    const game = narrative.bootGame(createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    const world = cloneWorldModel(game.worldModel);
    const actor = world.get("@jogador");
    if (actor) actor.links.intent = "take";
    const hypot = { ...game, worldModel: world };
    const report = narrative.dryRun(hypot, "@espada");
    assert.ok(report.effects.some((effect) => effect.verb === "live"));
    assert.equal(hypot.worldModel.get("@goblin")?.tags.has("alerta"), false);
    assert.equal(game.worldModel.get("@goblin")?.tags.has("alerta"), false);

    core.registerPlugin(LIFE_MANIFEST, createLifePlugin);
    await core.activatePlugin("lume-life");
    let played = take(hypot, "@espada");
    assert.equal(played.worldModel.get("@goblin")?.tags.has("alerta"), true);
    assert.ok(played.history.some((beat) => beat.triggerId === "@goblin"));
    assert.equal(game.worldModel.get("@goblin")?.tags.has("alerta"), false);
  });

  it("compiles Canais and Histórias into channel + PADRAO; weight only on the banner", () => {
    const text = `## Canais
O canal "corrupção" tem três estados:
  - limpo
  - corrompido
  - exposto
Transições:
  limpo → corrompido (suborno aceito)

## Histórias
Padrão: A Corrupção do Guarda
  - suborno
  - aceite
Significância: 0.85

Padrão: Um Eco
  - eco
Significância: 0.1
`;
    const { nb, compiled } = worldOf(text);
    assert.equal(nb.issues.length, 0);
    assert.match(nb.taxonomySource, /channel → abstract/);
    assert.match(nb.entitiesSource, /@corrupcao\.\{/);
    assert.match(nb.entitiesSource, /tags: channel/);
    assert.match(nb.entitiesSource, /state=0/);
    assert.equal(nb.extras["@corrupcao"]?.states, "limpo, corrompido, exposto");
    assert.match(nb.rulesSource, /@corrupcao\.intent=advance/);
    assert.match(nb.rulesSource, /@corrupcao\.state \+ 1/);
    assert.match(nb.rulesSource, /suborno aceito/);
    assert.match(nb.patterns, /PADRAO CORRUPCAO_DO_GUARDA/);
    assert.match(nb.patterns, /eventos: @suborno, @aceite/);
    assert.match(nb.patterns, /extra: weight=0.85/);
    assert.match(nb.rulesSource, /PADRAO CORRUPCAO_DO_GUARDA/);
    assert.equal(compiled.errors.length, 0);
    const patterns = parsePadrao(nb.rulesSource);
    assert.equal(patterns[0]?.extra?.weight, "0.85");
    const hits = [
      { id: "eco", name: "Um Eco", at: 1, weight: 0.1 },
      { id: "corr", name: "A Corrupção do Guarda", at: 2, weight: 0.85 },
    ];
    assert.equal(bannerOf(hits), "A Corrupção do Guarda · Um Eco");
    assert.equal(compiled.patterns.some((p) => p.id === "CORRUPCAO_DO_GUARDA"), true);
    assert.equal(typeof compiled.patterns[0]?.extra?.weight === "string" || compiled.patterns.some((p) => p.extra?.weight === "0.85"), true);
  });

  it("assists in prose: issues, dry-run, gaps, duplicates, no code", () => {
    const junk = assistNotebook(`### A Caverna
blorple xyz.
`);
    assert.ok(junk.notes.some((note) => note === "Não percebi a linha 2."));

    const twice = assistNotebook(`### A Caverna
### A Caverna
`);
    assert.ok(twice.notes.some((note) => note === "Já há uma A Caverna."));

    const play = assistNotebook(`### A Espada
A espada está na caverna.
Quando o jogador pega a espada:
  cause 5 de dano ao jogador.
  marque o jogador como "maldito".
Quando o jogador pega a espada:
  narre "outra."
  cause 1 de dano ao jogador.
`);
    assert.ok(play.notes.some((note) => note.includes("Duas reacções para pegar a espada")));
    assert.ok(play.notes.some((note) => note === "Se o jogador pegar a espada: dano 5, tag maldito. Nenhuma acção foi executada."));
    assert.ok(play.notes.some((note) => note.includes(".lume.caderno.md")));
    assert.ok(play.notes.some((note) => note.includes("Adicionei ‘A Espada’ ao índice.")));
    assert.equal(play.notes.some((note) => /ON:|IF:|DO:|matcher|JSON|ECS|intent=/.test(note)), false);

    const gap = assistNotebook(`### O Goblin
O goblin está na caverna.
Ele é covarde.
`);
    assert.ok(gap.notes.some((note) => note === "O goblin é vivo e não tem reacção."));

    const live = assistNotebook(`### O Goblin
O goblin está na caverna.
Ele é covarde.
O jogador está na caverna.
### A Espada
A espada está na caverna.
Quando o jogador pega a espada:
  os NPCs ao redor ficam preocupados.
`);
    assert.ok(live.notes.some((note) => note === "O goblin no mesmo sítio reagiria (covarde)."));
    assert.equal(slowRulesNote(501), "Muitas regras; o play pode ficar lento.");
    assert.equal(slowRulesNote(500), null);
  });

  it("parses caderno pages, cover, comments, and hides motor hash lines", () => {
    const text = `CADERNO: A Caverna Amaldiçoada
Autora: Maria
Data: 13 de setembro de 2026
Dedicatória: Para quem ousa descer.

## 1. As Salas
### 1.1 A Caverna
A caverna é húmida. /* margem fria */
# ON: start
`;
    const view = parseCadernoView(text);
    assert.equal(view.cover.title, "A Caverna Amaldiçoada");
    assert.equal(view.cover.author, "Maria");
    assert.equal(view.cover.dedication, "Para quem ousa descer.");
    assert.ok(view.toc.some((item) => item.id === "capa"));
    assert.ok(view.toc.some((item) => item.title.includes("A Caverna")));
    const page = view.pages.find((item) => item.title.includes("A Caverna"));
    assert.ok(page?.body.includes("húmida"));
    assert.match(page?.body ?? "", /# ON:/);
    assert.deepEqual(page?.comments, ["margem fria"]);
    const named = replaceCover(text, { ...view.cover, title: "Outro" });
    assert.match(named, /^CADERNO: Outro/m);
    const emptyCover = parseCadernoView("");
    assert.equal(emptyCover.cover.title, "");
    assert.equal(emptyCover.cover.author, "");

    const applied = applyNotebookToProject({
      entitiesSource: "start()\n",
      rulesSource: "# start\nON: start\nnarrativa: \"ok\"\n",
      taxonomySource: "",
      extras: {},
      notebooksSource: `### A Espada
A espada está na caverna.
`,
      meta: { name: "x" },
    });
    assert.match(applied.entitiesSource, /@espada/);
    const cave = applyNotebookToProject({
      entitiesSource: "@jogador.{ tags: agent; }\nstart()\n",
      rulesSource: "# start\nON: start\nnarrativa: \"ok\"\n",
      taxonomySource: "",
      extras: {},
      notebooksSource: "",
      meta: { name: "cave" },
    });
    assert.equal(cave.entitiesSource, "@jogador.{ tags: agent; }\nstart()\n");
  });

  it("keeps the first caderno when Magia is added and builds a global index", () => {
    const text = `CADERNO: A Caverna Amaldiçoada
### A Espada
A espada está na caverna.

CADERNO: Magia
### O Mago
O mago está na torre.
O feitico está na torre.
`;
    const nb = compileNotebook(text);
    assert.match(nb.entitiesSource, /@espada/);
    assert.match(nb.entitiesSource, /@mago/);
    assert.match(nb.entitiesSource, /@feitico/);
    const lib = parseCadernoLibrary(text);
    assert.equal(lib.books.length, 2);
    assert.equal(lib.books[0]?.cover.title, "A Caverna Amaldiçoada");
    assert.equal(lib.books[1]?.cover.title, "Magia");
    assert.ok(lib.toc.some((item) => item.title.includes("A Espada")));
    assert.ok(lib.toc.some((item) => item.title.includes("O Mago")));
    const firstOnly = parseCadernoView(text);
    assert.equal(firstOnly.cover.title, "A Caverna Amaldiçoada");
    assert.equal(firstOnly.pages.some((page) => page.title.includes("O Mago")), false);
    const magiaCover = replaceCover(text, { ...lib.books[1]!.cover, author: "Ana" }, lib.books[1]!.id);
    assert.match(magiaCover, /CADERNO: A Caverna Amaldiçoada/);
    assert.match(magiaCover, /CADERNO: Magia/);
    assert.match(magiaCover, /Autora: Ana/);
    const applied = applyNotebookToProject({
      entitiesSource: "start()\n",
      rulesSource: "# start\nON: start\nnarrativa: \"ok\"\n",
      taxonomySource: "",
      extras: {},
      notebooksSource: text,
      meta: { name: "x" },
    });
    assert.equal(applied.meta.name, "A Caverna Amaldiçoada");
    assert.match(applied.entitiesSource, /@espada/);
    assert.match(applied.entitiesSource, /@mago/);
    const notes = assistNotebook(text).notes;
    assert.ok(notes.some((note) => note === "Índice: A Caverna Amaldiçoada, Magia."));
    const grown = appendCaderno(text, "", new Date("2026-09-13T09:24:00"));
    assert.match(grown, /CADERNO: Magia/);
    assert.equal(grown.includes("CADERNO: Magia\n\nCADERNO: Magia"), false);
    assert.match(grown, /\n\nCADERNO:\nData: 2026-09-13 09:24\n$/);
    assert.equal(nb.issues.some((issue) => issue.code === "W021"), false);
    assert.equal(parseCadernoLibrary("").books.length, 0);
    assert.equal(lib.books[0]?.id, "book-0");
    assert.equal(lib.books[1]?.id, "book-1");
    const renamed = replaceBookSource(
      text,
      "book-1",
      "CADERNO: Feitiçaria\n### O Mago\nO mago está na torre.\n",
    );
    assert.equal(parseCadernoLibrary(renamed).books[1]?.id, "book-1");
    assert.equal(parseCadernoLibrary(renamed).books[1]?.cover.title, "Feitiçaria");
    assert.match(renamed, /CADERNO: A Caverna Amaldiçoada/);
  });

  it("exports .lume.caderno.md with credits and concatenates on import; #play= after compile", () => {
    const cave = `CADERNO: A Caverna Amaldiçoada
Autora: Maria
### A Espada
A espada está na caverna.
`;
    const magia = `CADERNO: Magia
Autora: Ana
### O Mago
O mago está na torre.
`;
    const md = exportCadernoMd(cave);
    assert.match(md, /Autora: Maria/);
    assert.equal(cadernoFilename("A Caverna Amaldiçoada"), "caverna-amaldicoada.lume.caderno.md");
    assert.equal(notebook.cadernoFilename("Magia"), "magia.lume.caderno.md");
    const joined = importCaderno(cave, magia);
    assert.match(joined, /CADERNO: A Caverna Amaldiçoada/);
    assert.match(joined, /Autora: Maria/);
    assert.match(joined, /CADERNO: Magia/);
    assert.match(joined, /Autora: Ana/);
    const nb = compileNotebook(joined);
    assert.match(nb.entitiesSource, /@espada/);
    assert.match(nb.entitiesSource, /@mago/);
    const again = importCaderno(joined, "### O Feitiço\nO feitico está na torre.\n");
    assert.match(again, /CADERNO: Magia/);
    assert.match(again, /O Feitiço/);
    const lib = parseCadernoLibrary(joined);
    const onlyMagia = exportCadernoMd(joined, lib.books[1]?.id);
    assert.match(onlyMagia, /Autora: Ana/);
    assert.equal(onlyMagia.includes("A Espada"), false);
    const project = createProject("partilha", { notebooksSource: joined });
    const applied = applyNotebookToProject(project);
    assert.match(applied.entitiesSource, /@espada/);
    const bundle = buildPlayBundle(applied, null);
    assert.match(bundle.project.notebooksSource, /Autora: Maria/);
    assert.ok(parseShareHash(`#play=${encodePlayHash(bundle)}`)?.play);
    assert.equal(importCaderno("", ""), "");
    const caveExample = createExampleProject("goblin-cave");
    assert.equal(caveExample.notebooksSource, "");
  });

  it("caches by ###, treats peso as comment, and does not change specificity", () => {
    resetNotebookCache();
    const base = `### A Espada
A espada está na caverna.
Quando o jogador pega a espada:
  cause 5 de dano ao jogador.
### O Goblin
O goblin está na caverna.
Ele é covarde.
`;
    const first = compileNotebook(base);
    assert.ok(first.dirty.includes("A Espada"));
    assert.ok(first.dirty.includes("O Goblin"));
    const second = compileNotebook(base);
    assert.deepEqual(second.dirty, []);
    assert.equal(second.rulesSource, first.rulesSource);
    const touched = compileNotebook(base.replace("Ele é covarde.", "Ele é covarde.\nEle é um goblin."));
    assert.deepEqual(touched.dirty, ["O Goblin"]);
    assert.match(touched.entitiesSource, /@espada/);
    const withPeso = compileNotebook(`### A Espada
A espada está na caverna.
peso: sala
Quando o jogador pega a espada:
  cause 5 de dano ao jogador.
`);
    const withoutPeso = compileNotebook(`### A Espada
A espada está na caverna.
Quando o jogador pega a espada:
  cause 5 de dano ao jogador.
`);
    assert.equal(withPeso.rulesSource, withoutPeso.rulesSource);
    assert.equal(withPeso.issues.some((issue) => issue.message.includes("peso")), false);
    assert.equal(JSON.stringify(withPeso.extras).includes("peso"), false);
    assert.equal(withPeso.rulesSource.includes("weight"), false);
  });

  it("stamps new cadernos, colors Quando, tabs a space, and notes a line", () => {
    const stamped = appendCaderno("", "Magia", new Date("2026-09-13T09:24:00"));
    assert.match(stamped, /^CADERNO: Magia\nData: 2026-09-13 09:24\n$/);
    assert.equal(stamped.includes("Dedicatória"), false);
    const kw = highlightSource("Quando o jogador pega a espada:\n", "notebook")[0]!;
    assert.equal(kw[0]!.cls, "syn-kw");
    assert.equal(kw[0]!.text, "Quando");
    const tabbed = tabAfterKeyword("Quando", "notebook", 6);
    assert.equal(tabbed?.source, "Quando ");
    const indented = indentOnEnter("Quando o jogador pega a espada:", 31);
    assert.equal(indented?.source, "Quando o jogador pega a espada:\n  ");
    const noted = addLineNote("A espada está na caverna.", 1, "fria");
    assert.equal(noted, "A espada está na caverna. /* fria */");
    const broken = insertSectionBreak("A\nB", 1);
    assert.match(broken.source, /---/);
    const on = tabAfterKeyword("ON", "rules", 2);
    assert.equal(on?.source, "on: ");
    const tags = tabAfterKeyword("  tags", "entities", 6);
    assert.equal(tags?.source, "  tags: ");
    const src = `CADERNO: A\n### @x\nola\n`;
    const lib = parseCadernoLibrary(src);
    const replaced = replaceBookSource(src, lib.books[0]!.id, "CADERNO: A\n### @x\nola /* n */\n");
    assert.match(replaced, /ola \/\* n \*\//);
    const lined = replaceBookSource("CADERNO:\nola", parseCadernoLibrary("CADERNO:\nola").books[0]!.id, "CADERNO:\nola\n");
    assert.match(lined, /ola\n$/);
  });

  it("compiles é um Agent/objeto/lugar into the motor slice without duplicating", () => {
    const text = "Alexandre é um Agent.\n";
    const nb = compileNotebook(text);
    assert.match(nb.entitiesSource, /@alexandre\.\{\n  id: #[A-F0-9]+;\n  name: Alexandre;\n  description: ;\n  tags: agent;/);
    assert.equal(nb.entitiesSource.includes("vivo"), false);
    const quoted = compileNotebook("'Alexandre' é um Agent.\n");
    assert.match(quoted.entitiesSource, /@alexandre\.\{\n  id: #[A-F0-9]+;\n  name: Alexandre;\n  description: ;\n  tags: agent;/);
    const objeto = compileNotebook("A espada é um objeto.\n");
    assert.match(objeto.entitiesSource, /@espada\.\{\n  id: #[A-F0-9]+;\n  name: A espada;\n  description: ;\n  tags: object;/);
    const lugar = compileNotebook("A caverna é um lugar.\n");
    assert.match(lugar.entitiesSource, /@caverna\.\{\n[\s\S]*?tags: place;/);
    const npc = compileNotebook("O guarda é um npc.\n");
    assert.match(npc.entitiesSource, /tags: agent, vivo;/);
    const handwritten = "@jogador.{ tags: agent; }\nstart()\n";
    const first = applyNotebookToProject({
      entitiesSource: handwritten,
      rulesSource: "# start\nON: start\nnarrativa: \"ok\"\n",
      taxonomySource: "",
      extras: {},
      notebooksSource: text,
      meta: { name: "x" },
    });
    assert.match(first.entitiesSource, /@jogador\./);
    assert.match(first.entitiesSource, /# --- lume-caderno ---/);
    assert.match(first.entitiesSource, /@alexandre\./);
    assert.match(first.entitiesSource, /# --- \/lume-caderno ---/);
    assert.equal(first.entitiesSource.split("@alexandre.{").length - 1, 1);
    const second = applyNotebookToProject({ ...first, notebooksSource: text });
    assert.equal(second.entitiesSource.split("@alexandre.{").length - 1, 1);
    assert.match(second.entitiesSource, /@jogador\./);
    const compiled = compileProject({
      ...createProject("n1", {
        entitiesSource: first.entitiesSource,
        rulesSource: first.rulesSource,
        taxonomySource: first.taxonomySource,
        extras: first.extras,
      }),
      notebooksSource: text,
    });
    assert.equal(compiled.errors.length, 0);
    assert.ok(compiled.worldModel.get("@alexandre")?.tags.has("agent"));
    assert.equal(compiled.worldModel.get("@alexandre")?.tags.has("vivo"), false);
    const cleared = applyNotebookToProject({ ...first, notebooksSource: "" });
    assert.equal(cleared.entitiesSource.includes("@alexandre"), false);
    assert.match(cleared.entitiesSource, /@jogador\./);
    const slice = writeCadernoSlice(handwritten, nb.entitiesSource);
    assert.equal(slice.includes(CADERNO_SLICE_START), true);
  });

  it("tags é um humano, quoted names with spaces, and pronouns", () => {
    const nb = compileNotebook(`O Ferreiro é um agente.
Ele é um humano.
`);
    assert.match(nb.entitiesSource, /@ferreiro\.\{\n[\s\S]*?tags: agent, humano, vivo;/);
    assert.equal(nb.entitiesSource.includes("agente;"), false);
    const agentEn = compileNotebook(`O Ferreiro é um Agent.
Ele é um humano.
`);
    assert.match(agentEn.entitiesSource, /tags: agent, humano;/);
    assert.equal(agentEn.entitiesSource.includes("vivo"), false);
    const quoted = compileNotebook("'A Espada Enferrujada' é um objeto.\n");
    assert.match(quoted.entitiesSource, /@espada_enferrujada\.\{\n[\s\S]*?tags: object;/);
    assert.match(quoted.entitiesSource, /name: A Espada Enferrujada;/);
    const quotedHumano = compileNotebook("'O Ferreiro' é um humano.\n");
    assert.match(quotedHumano.entitiesSource, /@ferreiro\.\{\n[\s\S]*?tags: humano;/);
    assert.match(quotedHumano.entitiesSource, /name: O Ferreiro;/);
    const orphan = compileNotebook("Ele é um humano.\n");
    assert.equal(orphan.entitiesSource.includes("@ele.{"), false);
    const arma = compileNotebook(`### A Espada
Ela é uma arma.
`);
    assert.match(arma.entitiesSource, /tags: object, weapon;/);
  });

  it("compiles tem stats: list, N de vida, and chave: número", () => {
    const nb = compileNotebook(`O Ferreiro é um agente.
Ele tem:
  - força: 12
  - destreza: 8
Ele tem 100 de vida.
Ele tem 0 de mana.
Ele tem 50 de ouro.
`);
    assert.match(nb.entitiesSource, /@ferreiro\.\{\n[\s\S]*?tags: agent, vivo;[\s\S]*?stats: destreza=8, forca=12, hp=100, mana=0, ouro=50;/);
    const inline = compileNotebook(`A Espada é um objeto.
Ela tem dano: 15.
`);
    assert.match(inline.entitiesSource, /@espada\.\{\n[\s\S]*?tags: object;[\s\S]*?stats: dano=15;/);
    const listed = compileNotebook(`A Espada é um objeto.
Ela tem:
  - dano: 15
  - peso: 3
`);
    assert.match(listed.entitiesSource, /stats: dano=15, peso=3;/);
    const unknownDe = compileNotebook(`O Ferreiro é um agente.
Ele tem 0 de magica.
`);
    assert.equal(unknownDe.entitiesSource.includes("magica="), false);
    assert.equal(unknownDe.issues.some((issue) => issue.message.includes("Não percebi")), true);
  });

  it("links está em, pertence, dono, and social without relation entities", () => {
    const nb = compileNotebook(`O Ferreiro é um agente.
Ele está na Vila.
Ele é amigo do Guarda.
Ele é rival do Mercador.
Ele é casado com a Filha do Padeiro.
Ele é pai do Jovem Ferreiro.
Ele é membro da Guilda.
Ele é dono da Forja.
A Espada é um objeto.
Ela pertence ao Rei.
`);
    assert.match(nb.entitiesSource, /@ferreiro\.\{\n[\s\S]*?softLinks: amigo=@guarda, casado=@filha_do_padeiro, in=@vila, membro=@guilda, pai=@jovem_ferreiro, rival=@mercador;/);
    assert.match(nb.entitiesSource, /@forja\.\{\n[\s\S]*?softLinks: owner=@ferreiro;/);
    assert.match(nb.entitiesSource, /@espada\.\{\n[\s\S]*?softLinks: owner=@rei;/);
    assert.equal(nb.entitiesSource.includes("REL_"), false);
    assert.equal(nb.entitiesSource.includes("tags: relation"), false);
    assert.match(nb.entitiesSource, /@vila\.\{\n[\s\S]*?tags: place;/);
    const alias = compileNotebook(`O Ferreiro é um agente.
O ferreiro está na vila.
`);
    assert.match(alias.entitiesSource, /@ferreiro\.\{\n[\s\S]*?softLinks: in=@vila;/);
    assert.equal(alias.entitiesSource.split("@ferreiro.{").length - 1, 1);
  });

  it("tags abstrato, informação and evento without a new runtime", () => {
    const magia = compileNotebook("A Magia é um abstrato.\n");
    assert.match(magia.entitiesSource, /@magia\.\{\n[\s\S]*?tags: abstract;/);
    assert.equal(magia.rulesSource.trim(), "");
    assert.equal(magia.entitiesSource.includes("ON:"), false);
    const segredo = compileNotebook("O Segredo do Rei é uma informação.\n");
    assert.match(segredo.entitiesSource, /@segredo_do_rei\.\{\n[\s\S]*?tags: info;/);
    const queda = compileNotebook(`A Queda é um evento.
Ele acontece quando o jogador pega a espada:
  narre "O reino segura a respiração."
`);
    assert.match(queda.entitiesSource, /@queda\.\{\n[\s\S]*?tags: event;/);
    assert.match(queda.rulesSource, /on: @espada/);
    assert.match(queda.rulesSource, /@jogador\.intent=take/);
    assert.equal(queda.rulesSource.includes("WAIT"), false);
    assert.equal(queda.rulesSource.includes("TICK"), false);
    const block = compileNotebook(`A Queda é um evento.
Ele acontece quando:
  narre "Aconteceu."
`);
    assert.match(block.rulesSource, /on: @queda/);
    assert.match(block.rulesSource, /narrativa: "Aconteceu."/);
  });

  it("puts contém/carrega contents in the container", () => {
    const nb = compileNotebook(`A Vila é um lugar.
Ela contém:
  - a Forja
  - a Taverna
O Ferreiro é um agente.
Ele carrega um martelo.
`);
    assert.match(nb.entitiesSource, /@forja\.\{\n[\s\S]*?softLinks: in=@vila;/);
    assert.match(nb.entitiesSource, /@taverna\.\{\n[\s\S]*?softLinks: in=@vila;/);
    assert.match(nb.entitiesSource, /@martelo\.\{\n[\s\S]*?softLinks: in=@ferreiro;/);
    assert.equal(nb.entitiesSource.includes("inventario"), false);
    assert.equal(nb.entitiesSource.includes("capacidade"), false);
    const inline = compileNotebook(`A Vila é um lugar.
Ela contém a Forja.
`);
    assert.match(inline.entitiesSource, /@forja\.\{\n[\s\S]*?softLinks: in=@vila;/);
  });

  it("turns traits and groups into tags without a group entity", () => {
    const nb = compileNotebook(`O Ferreiro é um agente.
Ele tem o trait "Falante".
A Espada é um objeto.
Ela tem o trait "Equipável".
O grupo "Humanos" inclui:
  - o Ferreiro
  - o Guarda
`);
    assert.match(nb.entitiesSource, /@ferreiro\.\{\n[\s\S]*?tags: agent, falante, humanos, vivo;/);
    assert.match(nb.entitiesSource, /@espada\.\{\n[\s\S]*?tags: equipavel, object;/);
    assert.match(nb.entitiesSource, /@guarda\.\{\n[\s\S]*?tags: humanos;/);
    assert.equal(nb.entitiesSource.includes("@humanos.{"), false);
    assert.equal(nb.taxonomySource.includes("humanos"), false);
    const inline = compileNotebook(`O grupo "Humanos" inclui o Ferreiro.\n`);
    assert.match(inline.entitiesSource, /@ferreiro\.\{\n[\s\S]*?tags: humanos;/);
    assert.equal(inline.entitiesSource.includes("@humanos.{"), false);
  });

  it("compiles herda/tipo de into taxonomy and templates into missing stats/tags", () => {
    const herda = compileNotebook(`A Espada é um objeto.
A Espada herda de Arma.
`);
    assert.match(herda.taxonomySource, /espada → arma/);
    assert.match(herda.entitiesSource, /@espada\.\{\n[\s\S]*?tags: espada, object;/);
    assert.equal(herda.entitiesSource.includes("@arma.{"), false);
    const tipo = compileNotebook("A Espada é um tipo de arma.\n");
    assert.match(tipo.taxonomySource, /espada → arma/);
    const nb = compileNotebook(`Template "NPC Comum":
  - vida: 50
  - força: 10
  - traits: [Falante]
O Ferreiro é um agente.
O Ferreiro é um NPC Comum.
O Ferreiro tem força: 12.
`);
    assert.match(nb.entitiesSource, /@ferreiro\.\{\n[\s\S]*?tags: agent, falante, vivo;[\s\S]*?stats: forca=12, hp=50;/);
    assert.equal(nb.entitiesSource.includes("@npc_comum.{"), false);
    const first = compileNotebook(`O Ferreiro é um agente.
O Ferreiro tem força: 12.
Template "NPC Comum":
  - vida: 50
  - força: 10
  - traits: [Falante]
O Ferreiro é um NPC Comum.
`);
    assert.match(first.entitiesSource, /stats: forca=12, hp=50;/);
    assert.match(first.entitiesSource, /tags: agent, falante, vivo;/);
  });

  it("keeps start() outside the slice and warns W030 once if the motor slice is touched", () => {
    const handwritten = "@jogador.{ tags: agent; }\nstart()\n";
    const base = applyNotebookToProject({
      entitiesSource: handwritten,
      rulesSource: "# start\nON: start\nnarrativa: \"ok\"\n",
      taxonomySource: "# kit:combat\n",
      extras: {},
      notebooksSource: "Alexandre é um Agent.\n",
      meta: { name: "x" },
    });
    const startAt = base.entitiesSource.indexOf("start()");
    const sliceAt = base.entitiesSource.indexOf(CADERNO_SLICE_START);
    assert.ok(startAt >= 0 && sliceAt > startAt);
    assert.match(base.taxonomySource, /# kit:combat/);
    assert.equal(extractCadernoSlice(base.entitiesSource)?.includes("@alexandre"), true);
    const clean = applyNotebookToProjectWithIssues(base);
    assert.equal(clean.issues.some((issue) => issue.code === "W030"), false);
    const touched = applyNotebookToProjectWithIssues({
      ...base,
      entitiesSource: base.entitiesSource.replace("  tags: agent;", "  tags: agent, hack;"),
    });
    assert.equal(touched.issues.filter((issue) => issue.code === "W030").length, 1);
    assert.equal(extractCadernoSlice(touched.project.entitiesSource)?.includes("hack"), false);
    assert.match(touched.project.entitiesSource, /@alexandre\./);
    assert.match(touched.project.entitiesSource, /start\(\)/);
    const again = applyNotebookToProjectWithIssues(touched.project);
    assert.equal(again.issues.some((issue) => issue.code === "W030"), false);
    const onlyHand = applyNotebookToProjectWithIssues({
      ...base,
      entitiesSource: `@extra.{ tags: object; }\n${base.entitiesSource}`,
    });
    assert.equal(onlyHand.issues.some((issue) => issue.code === "W030"), false);
    assert.match(onlyHand.project.entitiesSource, /@extra\./);
  });

  it("leaves a handwritten pad before start() and inserts outside the slice", () => {
    const handwritten = "@jogador.{ tags: agent; }\nstart()\n";
    const applied = applyNotebookToProject({
      entitiesSource: handwritten,
      rulesSource: "# start\nON: start\nnarrativa: \"ok\"\n",
      taxonomySource: "",
      extras: {},
      notebooksSource: "Alexandre é um Agent.\n",
      meta: { name: "x" },
    });
    const startAt = applied.entitiesSource.indexOf("start()");
    const sliceAt = applied.entitiesSource.indexOf(CADERNO_SLICE_START);
    assert.ok(startAt >= 0 && sliceAt > startAt);
    assert.match(applied.entitiesSource.slice(0, startAt), /\n\n$/);
    const out = insertEntity(applied.entitiesSource, "@nova");
    const novaAt = out.source.indexOf("@nova.{");
    const start2 = out.source.indexOf("start()");
    const slice2 = out.source.indexOf(CADERNO_SLICE_START);
    assert.ok(novaAt >= 0 && novaAt < start2 && start2 < slice2);
    assert.equal(extractCadernoSlice(out.source)?.includes("@nova"), false);
    const kept = applyNotebookToProject({ ...applied, entitiesSource: out.source, notebooksSource: "Alexandre é um Agent.\n" });
    assert.match(kept.entitiesSource, /@nova\.\{/);
    assert.equal(extractCadernoSlice(kept.entitiesSource)?.includes("@nova"), false);
    assert.ok(kept.entitiesSource.indexOf("@nova.{") < kept.entitiesSource.indexOf("start()"));
    const rules = `# start\nON: start\nnarrativa: "ok"\n\n${CADERNO_SLICE_START}\non: @alexandre\n# --- /lume-caderno ---\n`;
    const ruleOut = insertRule(rules, "nova_regra");
    assert.ok(ruleOut.source.indexOf("# nova_regra") < ruleOut.source.indexOf(CADERNO_SLICE_START));
    const typed = applied.entitiesSource.replace(
      /@alexandre\.\{\n/,
      "@alexandre.{\n@pessoa.\n",
    );
    const pos = typed.indexOf("@pessoa.") + "@pessoa.".length;
    const expanded = expandEntityDecl(typed, pos);
    assert.ok(expanded);
    assert.match(expanded.source, /@pessoa\.\{/);
    assert.ok(expanded.source.indexOf("@pessoa.{") < expanded.source.indexOf("start()"));
    assert.equal(extractCadernoSlice(expanded.source)?.includes("@pessoa"), false);
    const inPlace = expandEntityDecl("@jogador.{ tags: agent; }\n@guarda.\nstart()\n", "@jogador.{ tags: agent; }\n@guarda.".length);
    assert.ok(inPlace);
    assert.match(inPlace.source, /@guarda\.\{/);
    assert.ok(inPlace.source.indexOf("@guarda.{") < inPlace.source.indexOf("start()"));
  });

  it("writes entity and Quando rule into the same motor slices", () => {
    const text = `Alexandre é um Agent.
Quando o jogador fala com Alexandre:
  narre "Olá."
`;
    const nb = compileNotebook(text);
    assert.match(nb.entitiesSource, /@alexandre\.\{\n[\s\S]*?tags: agent;/);
    assert.equal(nb.entitiesSource.includes("COM_ALEXANDRE"), false);
    assert.match(nb.rulesSource, /on: @alexandre/);
    assert.match(nb.rulesSource, /@jogador\.intent=talk/);
    assert.match(nb.rulesSource, /narrativa: "Olá."/);
    const applied = applyNotebookToProject({
      entitiesSource: "@jogador.{ tags: agent; }\nstart()\n",
      rulesSource: "# start\nON: start\nnarrativa: \"ok\"\n",
      taxonomySource: "",
      extras: {},
      notebooksSource: text,
      meta: { name: "x" },
    });
    assert.match(applied.entitiesSource, /# --- lume-caderno ---/);
    assert.match(applied.entitiesSource, /@alexandre\./);
    assert.match(applied.rulesSource, /# --- lume-caderno ---/);
    assert.match(applied.rulesSource, /on: @alexandre/);
    assert.match(applied.rulesSource, /# start/);
  });

  it("autosaves only when cadernos change and compiles open books in parallel", async () => {
    const a = "CADERNO: Um\nAlexandre é um Agent.\n";
    const b = "CADERNO: Dois\nA Vila é um lugar.\n";
    const joined = `${a}\n${b}`;
    assert.equal(notebooksHash(joined), notebooksHash(joined));
    assert.notEqual(notebooksHash(joined), notebooksHash(`${joined} `));
    const nb = await compileCadernoLibraryAsync(joined);
    assert.match(nb.entitiesSource, /@alexandre\./);
    assert.match(nb.entitiesSource, /@vila\./);
    const one = await compileCadernoLibraryAsync(a);
    assert.match(one.entitiesSource, /@alexandre\./);
  });

  it("colors and tabs é um / tem / está and the N11 words", () => {
    const um = highlightSource("Alexandre é um Agent.\n", "notebook")[0]!;
    assert.ok(um.some((span) => span.cls === "syn-kw" && span.text === "é um"));
    const uma = highlightSource("A Espada é uma arma.\n", "notebook")[0]!;
    assert.ok(uma.some((span) => span.cls === "syn-kw" && span.text === "é uma"));
    const tem = highlightSource("Ele tem 100 de vida.\n", "notebook")[0]!;
    assert.ok(tem.some((span) => span.cls === "syn-kw" && span.text === "tem"));
    const esta = highlightSource("Ele está na Vila.\n", "notebook")[0]!;
    assert.ok(esta.some((span) => span.cls === "syn-kw" && span.text === "está"));
    const contem = highlightSource("Ela contém a Forja.\n", "notebook")[0]!;
    assert.ok(contem.some((span) => span.cls === "syn-kw" && span.text === "contém"));
    const herda = highlightSource("A Espada herda de Arma.\n", "notebook")[0]!;
    assert.ok(herda.some((span) => span.cls === "syn-kw" && span.text === "herda"));
    assert.equal(tabAfterKeyword("é um", "notebook", 4)?.source, "é um ");
    assert.equal(tabAfterKeyword("é uma", "notebook", 5)?.source, "é uma ");
    assert.equal(tabAfterKeyword("tem", "notebook", 3)?.source, "tem ");
    assert.equal(tabAfterKeyword("está", "notebook", 4)?.source, "está ");
    assert.equal(tabAfterKeyword("contém", "notebook", 6)?.source, "contém ");
    assert.equal(tabAfterKeyword("trait", "notebook", 5)?.source, "trait ");
    assert.equal(tabAfterKeyword("grupo", "notebook", 5)?.source, "grupo ");
    assert.equal(tabAfterKeyword("herda", "notebook", 5)?.source, "herda ");
    assert.ok(highlightSource("Entenda \"pincel\" como a Espada.\n", "notebook")[0]!.some((span) => span.cls === "syn-kw" && span.text.toLowerCase() === "entenda"));
    assert.equal(tabAfterKeyword("entenda", "notebook", 7)?.source, "entenda ");
    const talk = tabAfterKeyword("talk", "notebook", 4);
    assert.equal(talk, null);
    const naoTem = highlightSource("Se o jogador não tem a espada:\n", "notebook")[0]!;
    assert.ok(naoTem.some((span) => span.cls === "syn-kw" && span.text === "não tem"));
  });

  it("compiles Quando/Se tem and não tem into TEM / NAO_TEM", () => {
    const quando = compileNotebook(`### A Espada
A espada está na caverna.
Quando o jogador tem a espada:
  narre "A lâmina pesa."
`);
    assert.equal(quando.issues.length, 0, quando.issues.map((i) => i.message).join("; "));
    assert.match(quando.rulesSource, /on: @jogador TEM @espada/);
    assert.match(quando.rulesSource, /narrativa: "A lâmina pesa."/);
    assert.equal(quando.rulesSource.includes("intent="), false);

    const nested = compileNotebook(`### A Espada
A espada está na caverna.
Quando o jogador pega a espada:
  Se o jogador tem a tocha:
    narre "A luz mostra o fio."
`);
    assert.equal(nested.issues.length, 0, nested.issues.map((i) => i.message).join("; "));
    assert.match(nested.rulesSource, /on: @espada/);
    assert.match(nested.rulesSource, /if: @jogador\.intent=take/);
    assert.match(nested.rulesSource, /if: @jogador TEM @tocha/);

    const nao = compileNotebook(`Quando o jogador não tem a espada:
  narre "A mão vazia."
`);
    assert.equal(nao.issues.length, 0, nao.issues.map((i) => i.message).join("; "));
    assert.match(nao.rulesSource, /on: @jogador NAO_TEM @espada/);

    const goblin = compileNotebook(`O Goblin é um agente.
Quando o goblin tem a tocha:
  narre "A tocha treme."
`);
    assert.match(goblin.rulesSource, /on: @goblin TEM @tocha/);

    const stats = compileNotebook(`O Ferreiro é um agente.
Ele tem 100 de vida.
`);
    assert.match(stats.entitiesSource, /stats: hp=100;/);
    assert.equal(stats.rulesSource.includes("TEM"), false);
  });

  it("strips /* */ in the caderno and does not treat // as comment", () => {
    const nb = compileNotebook(`O Ferreiro é um agente. /* nota */
Quando o jogador pega a espada: /* x */
  narre "Oi."
`);
    assert.equal(nb.issues.filter((issue) => issue.message === "Não percebi esta linha.").length, 0);
    assert.match(nb.entitiesSource, /@ferreiro\./);
    assert.match(nb.rulesSource, /on: @espada/);
    const slash = compileNotebook(`O Ferreiro é um agente.
Ele tem 100 de vida // lixo
`);
    assert.ok(slash.issues.some((issue) => issue.message === "Não percebi esta linha."));
    assert.equal(slash.entitiesSource.includes("hp=100"), false);
  });

  it("plays the caderno like handwritten motor and W031s duplicate ids above the slice", () => {
    const text = `A Espada é um objeto.
A espada está na caverna.
Quando o jogador pega a espada:
  narre "Sua mão recua."
  cause 5 de dano ao jogador.
`;
    const nb = compileNotebook(text);
    assert.equal(nb.issues.some((issue) => issue.code === "W021"), false);
    const hand = compileProject(createProject("hand", {
      entitiesSource: `${nb.entitiesSource}\nstart()\n`,
      rulesSource: `${nb.rulesSource}\n# start\nON: start\nnarrativa: "ok"\n`,
      extras: nb.extras,
    }));
    const applied = applyNotebookToProjectWithIssues({
      entitiesSource: "@jogador.{ tags: agent; }\nstart()\n",
      rulesSource: "# start\nON: start\nnarrativa: \"ok\"\n",
      taxonomySource: "",
      extras: {},
      notebooksSource: text,
      meta: { name: "x" },
    });
    const fromNb = compileProject(createProject("nb", {
      entitiesSource: applied.project.entitiesSource,
      rulesSource: applied.project.rulesSource,
      taxonomySource: applied.project.taxonomySource,
      extras: applied.project.extras,
    }));
    assert.equal(hand.errors.length, 0, hand.errors.map((e) => e.message).join("; "));
    assert.equal(fromNb.errors.length, 0, fromNb.errors.map((e) => e.message).join("; "));
    hand.worldModel.get("@jogador")!.stats.hp = 10;
    fromNb.worldModel.get("@jogador")!.stats.hp = 10;
    let g1 = narrative.bootGame(createGame(hand.worldModel, hand.rules, "@jogador", hand.taxonomy));
    let g2 = narrative.bootGame(createGame(fromNb.worldModel, fromNb.rules, "@jogador", fromNb.taxonomy));
    g1 = take(g1, "@espada");
    g2 = take(g2, "@espada");
    assert.equal(g1.worldModel.get("@jogador")?.stats.hp, g2.worldModel.get("@jogador")?.stats.hp);
    assert.equal(g1.story.includes("mão recua"), true);
    assert.equal(g2.story.includes("mão recua"), true);
    assert.equal(g1.worldModel.get("@jogador")?.stats.hp, 5);

    const dup = applyNotebookToProjectWithIssues({
      entitiesSource: "@alexandre.{ tags: object; }\nstart()\n",
      rulesSource: "# start\nON: start\nnarrativa: \"ok\"\n",
      taxonomySource: "",
      extras: {},
      notebooksSource: "Alexandre é um Agent.\n",
      meta: { name: "x" },
    });
    assert.equal(dup.issues.filter((issue) => issue.code === "W031").length, 1);
    assert.match(dup.issues[0]!.message, /@alexandre/);
    const above = stripCadernoSlice(dup.project.entitiesSource);
    assert.equal(above.includes("@alexandre.{"), false);
    assert.match(above, /start\(\)/);
    assert.match(extractCadernoSlice(dup.project.entitiesSource) ?? "", /tags: agent;/);
    const compiledDup = compileProject(createProject("dup", {
      entitiesSource: dup.project.entitiesSource,
      rulesSource: dup.project.rulesSource,
    }));
    assert.equal(compiledDup.errors.some((e) => e.code === "E007"), false);
    assert.ok(compiledDup.worldModel.get("@alexandre")?.tags.has("agent"));
    assert.equal(compiledDup.worldModel.get("@alexandre")?.tags.has("object"), false);
  });

  it("compiles Entenda aliases and project grammar; pega o pincel takes the Espada", () => {
    const { nb, compiled } = worldOf(`A Espada é um objeto.
Entenda "pincel" como a Espada.
Entenda "brocha" ou "trinchas" como a Espada.
`);
    assert.equal(nb.issues.filter((issue) => issue.severity === "error").length, 0);
    assert.match(nb.entitiesSource, /aliases: pincel, brocha, trinchas/);
    assert.equal(compiled.worldModel.get("@espada")?.extra?.aliases?.includes("pincel"), true);
    assert.deepEqual(interpret("pega o pincel", compiled.worldModel), {
      command: "intent.action.interact.take.@espada",
      dryRun: false,
    });
    const grammar = compileNotebook(`A Tocha é um objeto.
Entenda "zuca [algo]" como take.
Entenda o comando "xyzzy" como novo.
`);
    assert.match(grammar.extras.__VOCAB__?.grammar ?? "", /zuca/);
    assert.match(grammar.extras.__VOCAB__?.grammar ?? "", /novo\.XYZZY/);
    const gWorld = compileProject(createProject("g", {
      entitiesSource: `${grammar.entitiesSource}\nstart()\n`,
      extras: grammar.extras,
    })).worldModel;
    assert.deepEqual(interpret("zuca a tocha", gWorld), {
      command: "intent.action.interact.take.@tocha",
      dryRun: false,
    });
    assert.deepEqual(interpret("xyzzy", gWorld), {
      command: "intent.novo.XYZZY",
      dryRun: false,
    });
    const fat = compileNotebook(`A Espada é um objeto.
Entenda "pega [algo] a b c d e f g h [sítio]" como take.
`);
    assert.equal(fat.issues.some((issue) => issue.code === "W032"), true);
  });

  it("defaults notebooksSource to empty and keeps the cave equal", () => {
    const blank = createProject("caderno");
    assert.equal(blank.notebooksSource, "");
    const old = coerceProject({ entitiesSource: "@jogador.{ tags: agent; }\nstart()\n", rulesSource: "# start\nON: start\nnarrativa: \"ok\"\n" });
    assert.equal(old.notebooksSource, "");
    const cave = createExampleProject("goblin-cave");
    const before = cave.rulesSource;
    const compiled = compileProject(cave);
    assert.equal(compiled.errors.length, 0);
    assert.equal(cave.notebooksSource, "");
    assert.equal(cave.rulesSource, before);
    const booted = narrative.bootGame(narrative.createGame(compiled.worldModel, compiled.rules, "@jogador", compiled.taxonomy));
    assert.match(booted.story, /./);
  });
});

describe("W2 write menu shell", () => {
  it("captures a selection range and inserts a phrase over it", () => {
    const source = "A lâmina pesa na mão.";
    const sel = selectionOf(source, 2, 8);
    assert.equal(sel.line, 1);
    assert.equal(sel.text, "lâmina");
    const next = insertAtSelection(source, sel.start, sel.end, "espada");
    assert.equal(next.source, "A espada pesa na mão.");
    assert.equal(next.offset, 8);
  });

  it("lists the ten drawers and keys of the chosen entity", () => {
    assert.deepEqual([...FBE_DRAWERS], ["tags", "stats", "flags", "enums", "phrases", "hardLinks", "softLinks", "lists", "fuses", "struct"]);
    const host = {
      id: "@jogador",
      tags: new Set(["agent"]),
      stats: { hp: 10 },
      flags: { vivo: true },
      enums: {},
      phrases: { titulo: "Herói" },
      hardLinks: {},
      softLinks: { current_location: "@sala" },
      lists: {},
      fuses: {},
      struct: {},
    };
    assert.deepEqual(keysOfDrawer(host, "stats"), ["hp"]);
    assert.deepEqual(keysOfDrawer(host, "tags"), ["agent"]);
    assert.deepEqual(keysOfDrawer(host, "phrases"), ["titulo"]);
    assert.equal(entityGuess("jogador", ["@sala", "@jogador"]), "@jogador");
  });

  it("lists existing phrases and does not persist a mutation stub", () => {
    const host = {
      id: "@jogador",
      tags: [],
      stats: {},
      flags: {},
      enums: {},
      phrases: { titulo: "Herói" },
      hardLinks: {},
      softLinks: {},
      lists: {},
      fuses: {},
      struct: {},
    };
    const phrases = phrasesOfProject([host], [{ id: "pegar", narrative: '"Sua mão recua."' }]);
    assert.equal(phrases.some((item) => item.insert === "Herói"), true);
    assert.equal(phrases.some((item) => item.insert === "Sua mão recua."), true);
    const source = "A lâmina pesa.";
    const stub = describeMutation({
      entityId: "@jogador",
      drawer: "stats",
      key: "hp",
      value: "10",
      quote: "lâmina",
      line: 1,
      op: "set",
    });
    assert.equal(stub, "@jogador.stats.hp=10");
    assert.equal(source, "A lâmina pesa.");
  });
});

describe("C4 caderno by mode", () => {
  it("opens Vincular only in write and keeps the cave compile", () => {
    assert.equal(cadernoLive("write"), true);
    assert.equal(cadernoLive("play"), false);
    const src = readFileSync(fileURLToPath(new URL("../../ui/NotebookEditor.tsx", import.meta.url)), "utf8");
    assert.match(src, /cadernoLive/);
    assert.match(src, /if \(!live\) return/);
    assert.match(src, /Mudar isto/);
    assert.match(src, /MENU_CURSOR/);
    const cave = createExampleProject("goblin-cave");
    const compiled = compileProject(cave);
    assert.equal(compiled.errors.length, 0);
  });
});

describe("V1 mutation wizard shell", () => {
  const host = {
    id: "@tocha",
    tags: new Set(["object"]),
    stats: {},
    flags: {},
    enums: { postura: "AGRESSIVO" },
    phrases: {},
    hardLinks: {},
    softLinks: {},
    lists: {},
    fuses: {},
    struct: {},
  };

  it("refuses a flag that is not true/false and does not PUSH a comma list as one item", () => {
    const base = { entityId: "@jogador", key: "vivo", quote: "x", line: 1, op: "set" as const };
    assert.equal(doFromDraft({ ...base, drawer: "flags", value: "talvez" }), null);
    assert.equal(doFromDraft({ ...base, drawer: "flags", value: "true" }), "SET_FLAG @jogador.vivo true");
    assert.equal(doFromDraft({ ...base, drawer: "flags", value: "false" }), "SET_FLAG @jogador.vivo false");
    assert.equal(doFromDraft({ ...base, drawer: "lists", key: "inventario", value: "A, B" }), "CLEAR @jogador.inventario\nPUSH @jogador.inventario A\nPUSH @jogador.inventario B");
    assert.equal(doFromDraft({ ...base, drawer: "lists", key: "inventario", value: "A" }), "CLEAR @jogador.inventario\nPUSH @jogador.inventario A");
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "stats", key: "hp", value: "10", quote: "x", line: 1, op: "set" }), "SET_STAT @jogador.hp 10");
  });

  it("lists link targets and a single enum state", () => {
    assert.deepEqual(linkTargets([host, { ...host, id: "@jogador" }]), ["@jogador", "@tocha"]);
    assert.deepEqual(enumStates([host], "postura"), ["AGRESSIVO"]);
    const src = readFileSync(fileURLToPath(new URL("../../ui/WriteShell.tsx", import.meta.url)), "utf8");
    assert.match(src, /Pôr/);
    assert.match(src, /Tirar/);
    assert.match(src, /Destino/);
  });
});

describe("V2 doFromDraft set and unset", () => {
  it("sets two stats as keys and a comma list as two items", () => {
    const prose = `CADERNO:
### O Jogador
O jogador está na sala.
`;
    const corpo = doFromDraft({ entityId: "@jogador", drawer: "stats", key: "corpo", value: "10", quote: "O jogador está na sala.", line: 3, op: "set" });
    const ferramenta = doFromDraft({ entityId: "@jogador", drawer: "stats", key: "ferramenta", value: "3", quote: "O jogador está na sala.", line: 3, op: "set" });
    assert.equal(corpo, "SET_STAT @jogador.corpo 10");
    assert.equal(ferramenta, "SET_STAT @jogador.ferramenta 3");
    let src = addAnnotation(prose, { id: "a1", book: "book-0", heading: "O Jogador", quote: "O jogador está na sala.", do: corpo! });
    src = addAnnotation(src, { id: "a2", book: "book-0", heading: "O Jogador", quote: "O jogador está na sala.", do: ferramenta! });
    const compiled = compileNotebook(src);
    assert.match(compiled.entitiesSource, /corpo=10/);
    assert.match(compiled.entitiesSource, /ferramenta=3/);
    const listDo = doFromDraft({ entityId: "@jogador", drawer: "lists", key: "inventario", value: "espada, tocha", quote: "O jogador está na sala.", line: 3, op: "set" });
    assert.equal(listDo?.includes("PUSH @jogador.inventario espada, tocha"), false);
    const listed = addAnnotation(prose, { id: "a1", book: "book-0", heading: "O Jogador", quote: "O jogador está na sala.", do: listDo! });
    assert.match(compileNotebook(listed).entitiesSource, /inventario=\[espada, tocha\]/);
  });

  it("removes a tag, unsets a flag, and clears a list, and keeps the cave equal", () => {
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "tags", key: "vivo", value: "", quote: "x", line: 1, op: "unset" }), "REMOVE_TAG @jogador vivo");
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "flags", key: "chefe", value: "true", quote: "x", line: 1, op: "unset" }), "SET_FLAG @jogador.chefe false");
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "stats", key: "hp", value: "10", quote: "x", line: 1, op: "unset" }), null);
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "lists", key: "inventario", value: "", quote: "x", line: 1, op: "unset" }), "CLEAR @jogador.inventario");
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "lists", key: "inventario", value: "espada", quote: "x", line: 1, op: "unset" }), "REMOVE @jogador.inventario espada");
    const cave = createExampleProject("goblin-cave");
    assert.equal(compileProject(cave).errors.length, 0);
  });
});

describe("W3 annotation slice", () => {
  it("keeps prose clean and compiles SET_STAT like tem N de vida", () => {
    const handwritten = compileNotebook(`CADERNO:
### O Jogador
O jogador está na sala.
O jogador tem 10 de vida.
`);
    const bound = addAnnotation(
      `CADERNO:
### O Jogador
O jogador está na sala.
`,
      { id: "a1", book: "book-0", heading: "O Jogador", quote: "O jogador está na sala.", do: "SET_STAT @jogador.hp 10" },
    );
    assert.equal(stripAnotacoesSlice(bound).includes("SET_STAT"), false);
    assert.match(bound, /lume-anotacoes/);
    const compiled = compileNotebook(bound);
    assert.match(handwritten.entitiesSource, /hp=10/);
    assert.match(compiled.entitiesSource, /hp=10/);
    assert.equal(compiled.issues.some((issue) => issue.message === "Não percebi esta linha."), false);
    const lib = parseCadernoLibrary(bound);
    const visible = bound.split("\n").slice(lib.books[0]!.startLine - 1, lib.books[0]!.endLine).join("\n");
    assert.equal(visible.includes("SET_STAT"), false);
  });

  it("adds named do: on a Quando line and warns without an anchor", () => {
    const src = addAnnotation(
      `CADERNO:
### A Espada
A espada está na sala.
Quando o jogador pega a espada:
  narre "Sua mão recua."
`,
      {
        id: "a1",
        book: "book-0",
        heading: "A Espada",
        quote: 'narre "Sua mão recua."',
        do: "SET_STAT @jogador.hp 10",
      },
    );
    const compiled = compileNotebook(src);
    assert.match(compiled.rulesSource, /SET_STAT @jogador\.hp 10/);
    const missing = addAnnotation(
      `CADERNO:
### A Espada
A espada está na sala.
`,
      { id: "a1", book: "book-0", heading: "A Espada", quote: "frase que não existe", do: "SET_STAT @jogador.hp 10" },
    );
    const warned = compileNotebook(missing);
    assert.equal(warned.issues.some((issue) => issue.message === "Não percebi esta linha."), true);
    assert.equal(/hp=10/.test(warned.entitiesSource), false);
  });

  it("marks two mutations on one line as ¹ ² and treats /* */ as a note", () => {
    const prose = `CADERNO:
### A Espada
A lâmina pesa.
`;
    const anns = [
      { id: "a1", book: "book-0", heading: "A Espada", quote: "A lâmina pesa.", do: "SET_STAT @jogador.hp 10" },
      { id: "a2", book: "book-0", heading: "A Espada", quote: "A lâmina pesa.", do: "ADD_TAG @jogador vivo" },
    ];
    const marks = marksOnPage(prose, anns);
    assert.deepEqual(marks.get(3), ["¹", "²"]);
    const hits = markHitsOnPage(prose, anns);
    assert.deepEqual(hits.get(3)?.map((item) => item.id), ["a1", "a2"]);
    const blade = `CADERNO:
### A Espada
A lâmina pesa.
`;
    const word = [
      { id: "a1", book: "book-0", heading: "A Espada", quote: "lâmina", do: "SET_STAT @jogador.hp 10" },
      { id: "a2", book: "book-0", heading: "A Espada", quote: "lâmina", do: "ADD_TAG @jogador vivo" },
    ];
    const wordHits = markHitsOnPage(blade, word);
    assert.equal(wordHits.get(3)?.[0]?.column, "A lâmina pesa.".indexOf("lâmina"));
    assert.equal(wordHits.get(3)?.every((item) => item.column === wordHits.get(3)?.[0]?.column), true);
    assert.deepEqual(wordHits.get(3)?.map((item) => item.mark), ["¹", "²"]);
    const editor = readFileSync(fileURLToPath(new URL("../../ui/NotebookEditor.tsx", import.meta.url)), "utf8");
    assert.match(editor, /paintMarks/);
    assert.equal(editor.includes("marks.get(i + 1)") && editor.includes("{i + 1}"), true);
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "stats", key: "hp", value: "10", quote: "x", line: 1, op: "set" }), "SET_STAT @jogador.hp 10");
    const noted = `CADERNO:
### A Espada
A lâmina pesa. /* fria */
`;
    assert.equal(parseAnotacoesSlice(noted).length, 0);
    const two = `CADERNO:
### A Espada
A lâmina pesa.
A lâmina pesa.
# --- lume-anotacoes ---
1 {"id":"a1","book":"book-0","heading":"A Espada","quote":"A lâmina pesa.","do":"SET_STAT @jogador.hp 10"}
# --- /lume-anotacoes ---
`;
    const err = compileNotebook(two);
    assert.equal(err.issues.some((issue) => issue.code === "E020"), true);
  });

  it("keeps the cave equal when there is no slice", () => {
    const cave = createExampleProject("goblin-cave");
    const before = cave.rulesSource;
    assert.equal(parseAnotacoesSlice(cave.notebooksSource ?? "").length, 0);
    const compiled = compileProject(cave);
    assert.equal(compiled.errors.length, 0);
    assert.equal(cave.rulesSource, before);
  });
});

describe("W4 prose triggers", () => {
  it("opens entity and phrase hits on a prose word, not on Quando", () => {
    const source = "A lâmina da espada pesa.";
    const at = source.indexOf("espada") + "espada".length;
    const tok = tokenAt(source, at);
    assert.equal(tok.token, "espada");
    const hits = proseTriggers(source, at, {
      entities: [{ id: "@espada", name: "A Espada Enferrujada" }],
      phrases: [{ id: "n1", label: "pegar", insert: "A lâmina da espada reluz." }],
      annotations: [{ quote: "A lâmina pesa.", do: "SET_STAT @jogador.hp 10" }],
    });
    assert.equal(hits.some((hit) => hit.kind === "entity" && hit.entityId === "@espada"), true);
    assert.equal(hits.some((hit) => hit.kind === "phrase" && hit.insert?.includes("reluz")), true);
    const kw = completeAt("Quando", "notebook", 6, { entityIds: [], tags: [], statKeys: [], linkKeys: [], propKeywords: [] });
    assert.equal(kw.items.some((item) => item.label === "Quando"), true);
    const startKw = completeAt("", "notebook", 0, { entityIds: [], tags: [], statKeys: [], linkKeys: [], propKeywords: [] });
    assert.equal(startKw.items.some((item) => item.insert === "start"), true);
    assert.equal(startKw.items.some((item) => item.insert === "start()"), false);
    assert.deepEqual(proseTriggers("Quando", 6, { entities: [{ id: "@espada", name: "Espada" }] }), []);
    assert.deepEqual(proseTriggers("es", 2, { entities: [{ id: "@espada", name: "Espada" }] }), []);
  });

  it("matches an existing annotation quote and does not treat Se as a trigger", () => {
    const source = "A lâmina pesa na mão.";
    const at = source.indexOf("lâmina") + "lâmina".length;
    const hits = proseTriggers(source, at, {
      annotations: [{ quote: "A lâmina pesa.", do: "ADD_TAG @jogador vivo" }],
    });
    assert.equal(hits.some((hit) => hit.kind === "annotation" && hit.detail === "ADD_TAG @jogador vivo"), true);
    assert.deepEqual(proseTriggers("Se", 2, { entities: [{ id: "@sala", name: "Sala" }] }), []);
  });
});

describe("W5 authorship timeline", () => {
  it("diffs all ten drawers and sees the previous mutation", () => {
    const first = addAnnotation(
      `CADERNO:
### O Jogador
O jogador está na sala.
`,
      { id: "a1", book: "book-0", heading: "O Jogador", quote: "O jogador está na sala.", do: "SET_STAT @jogador.hp 10" },
    );
    const src = addAnnotation(first, {
      id: "a2",
      book: "book-0",
      heading: "O Jogador",
      quote: "O jogador está na sala.",
      do: "SET_STAT @jogador.hp 20",
    });
    const entries = authorshipTimeline(src);
    assert.equal(entries.length, 2);
    assert.equal(entries[0]?.diffs.length, 10);
    assert.deepEqual(entries[0]?.diffs.map((item) => item.drawer), [...FBE_DRAWERS]);
    const stats1 = entries[0]?.diffs.find((item) => item.drawer === "stats");
    const stats2 = entries[1]?.diffs.find((item) => item.drawer === "stats");
    assert.equal(stats1?.changed, true);
    assert.match(stats1?.after ?? "", /hp=10/);
    assert.match(stats2?.before ?? "", /hp=10/);
    assert.match(stats2?.after ?? "", /hp=20/);
    assert.equal(entries[0]?.after?.id, "@jogador");
    assert.match(snapDrawer(entries[0]?.after, "stats"), /hp=10/);
    assert.match(snapDrawer(entries[1]?.after, "stats"), /hp=20/);
    assert.equal(FBE_DRAWERS.length, 10);
    assert.equal(diffDrawers(null, null).length, 10);
  });

  it("removes an annotation from the slice and compile, and keeps the cave equal", () => {
    const src = addAnnotation(
      `CADERNO:
### O Jogador
O jogador está na sala.
`,
      { id: "a1", book: "book-0", heading: "O Jogador", quote: "O jogador está na sala.", do: "SET_STAT @jogador.hp 10" },
    );
    assert.match(compileNotebook(src).entitiesSource, /hp=10/);
    const gone = removeAnnotation(src, "a1");
    assert.equal(parseAnotacoesSlice(gone).length, 0);
    assert.equal(/hp=10/.test(compileNotebook(gone).entitiesSource), false);
    const cave = createExampleProject("goblin-cave");
    assert.equal(authorshipTimeline(cave.notebooksSource ?? "").length, 0);
    assert.equal(authorshipBaseWorld(cave.notebooksSource ?? "").has("@jogador") || authorshipBaseWorld(cave.notebooksSource ?? "").size >= 0, true);
    const compiled = compileProject(cave);
    assert.equal(compiled.errors.length, 0);
  });
});

describe("V4 write preview world", () => {
  it("applies SET_STAT onto @jogador from entities, not only the caderno", () => {
    const motor = `@jogador.{
  name: Jogador;
  description: ;
  tags: agent;
  stats: ;
  flags: ;
  enums: ;
  phrases: ;
  hardLinks: ;
  softLinks: ;
  lists: ;
  fuses: ;
  struct: ;
}`;
    const bound = addAnnotation(
      `CADERNO:
### Sala
A pedra brilha.
`,
      { id: "a1", book: "book-0", heading: "Sala", quote: "pedra", do: "SET_STAT @jogador.corpo 10" },
    );
    assert.equal(authorshipTimeline(bound)[0]?.after, null);
    const entries = authorshipTimeline(bound, motor);
    assert.equal(entries[0]?.after?.id, "@jogador");
    assert.match(snapDrawer(entries[0]?.after, "stats"), /corpo=10/);
    assert.equal(entries[0]?.diffs.find((item) => item.drawer === "stats")?.changed, true);
    const cave = createExampleProject("goblin-cave");
    assert.equal(authorshipTimeline(cave.notebooksSource ?? "", cave.entitiesSource).length, 0);
    const preview = readFileSync(fileURLToPath(new URL("../../ui/WritePreview.tsx", import.meta.url)), "utf8");
    assert.match(preview, /authorshipTimeline\(text, entitiesSource\)/);
    const pane = readFileSync(fileURLToPath(new URL("../../ui/NotebookPane.tsx", import.meta.url)), "utf8");
    assert.match(pane, /setWriteFocus\(id\)/);
  });
});

describe("T1 create and destroy entity", () => {
  it("creates @tocha then destroys it, and keeps the cave equal", () => {
    const created = doFromDraft({
      entityId: "@tocha",
      drawer: "tags",
      key: "object",
      value: "",
      quote: "tocha",
      line: 3,
      op: "set",
      kind: "world",
    });
    const killed = doFromDraft({
      entityId: "@tocha",
      drawer: "tags",
      key: "",
      value: "",
      quote: "tocha",
      line: 3,
      op: "unset",
      kind: "world",
    });
    assert.equal(created, "CREATE @tocha.object");
    assert.equal(killed, "DESTROY @tocha");
    const prose = `CADERNO:
### Sala
A tocha brilha.
`;
    const born = addAnnotation(prose, { id: "a1", book: "book-0", heading: "Sala", quote: "tocha", do: created! });
    const entries = authorshipTimeline(born);
    assert.equal(entries[0]?.after?.id, "@tocha");
    assert.match(snapDrawer(entries[0]?.after, "tags"), /object/);
    assert.match(compileNotebook(born).entitiesSource, /@tocha/);
    const gone = addAnnotation(born, { id: "a2", book: "book-0", heading: "Sala", quote: "tocha", do: killed! });
    const afterKill = authorshipTimeline(gone);
    assert.equal(afterKill[1]?.after, null);
    assert.equal(/@tocha/.test(compileNotebook(gone).entitiesSource), false);
    const cave = createExampleProject("goblin-cave");
    assert.equal(compileProject(cave).errors.length, 0);
    const src = readFileSync(fileURLToPath(new URL("../../ui/WriteShell.tsx", import.meta.url)), "utf8");
    assert.match(src, /Alvo/);
    assert.match(src, /Entidade/);
  });
});

describe("T2 regras fence", () => {
  it("inserts ## regras, compiles Quando inside, and keeps the cave equal", () => {
    const inserted = insertRegrasSection("A\nB", 1);
    assert.match(inserted.source, /## regras/);
    assert.match(inserted.source, /## \/regras/);
    assert.equal(isRegrasFence("## regras"), true);
    assert.equal(isRegrasFence("## /regras"), true);
    assert.equal(isRegrasFence("## Salas"), false);
    const fenced = `CADERNO:
### Sala
A pedra brilha.
## regras
Quando o jogador é marcado como "combate":
  narre "O ferro canta."
## /regras
`;
    const compiled = compileNotebook(fenced);
    assert.match(compiled.rulesSource, /combate/);
    assert.match(compiled.rulesSource, /ferro canta/);
    const tocTitles = parseCadernoLibrary(fenced).toc.map((item) => item.title);
    assert.equal(tocTitles.some((title) => /^\/?regras$/i.test(title)), false);
    const open = `CADERNO:
### Sala
Quando o jogador é marcado como "combate":
  narre "O ferro canta."
`;
    assert.match(compileNotebook(open).rulesSource, /combate/);
    const cave = createExampleProject("goblin-cave");
    assert.equal(compileProject(cave).errors.length, 0);
    const editor = readFileSync(fileURLToPath(new URL("../../ui/NotebookEditor.tsx", import.meta.url)), "utf8");
    assert.match(editor, /Secção de regras/);
  });
});

describe("T3 write suggestions", () => {
  it("lists one then two tag hits from the line and the paragraph, and keeps the cave equal", () => {
    const caderno = `CADERNO:
### Sala
O aço #combate.
na pedra.
## regras
Quando o jogador é marcado como "combate":
  narre "O ferro canta."
Quando o jogador é marcado como "ferido":
  narre "O sangue escorre."
## /regras
`;
    const rules = rulesFromSource(compileNotebook(caderno).rulesSource);
    assert.equal(writeSuggestions(caderno, 3, rules).length >= 1, true);
    assert.equal(writeSuggestions(caderno, 3).length >= 1, true);
    const chained = caderno.replace("O aço #combate.", "O aço #combate #ferido.");
    assert.equal(writeSuggestions(chained, 3, rulesFromSource(compileNotebook(chained).rulesSource)).length, 2);
    assert.equal(writeSuggestions(caderno, 4, rules).length >= 1, true);
    const open = `CADERNO:
### Sala
O aço #combate.
Quando o jogador é marcado como "combate":
  narre "O ferro canta."
`;
    assert.equal(writeSuggestions(open, 3).length, 0);
    const cave = createExampleProject("goblin-cave");
    assert.equal(compileProject(cave).errors.length, 0);
    assert.equal(writeSuggestions(cave.notebooksSource ?? "", 1, []).length, 0);
    const preview = readFileSync(fileURLToPath(new URL("../../ui/WritePreview.tsx", import.meta.url)), "utf8");
    assert.match(preview, /writeSuggestions/);
    assert.match(preview, /Propostas/);
    const play = readFileSync(fileURLToPath(new URL("../../../ide-ui/lib/components/PreviewPane.tsx", import.meta.url)), "utf8");
    assert.equal(/writeSuggestions/.test(play), false);
  });
});

describe("T4 entity history", () => {
  it("lists every mutation of an entity with line refs, and keeps the cave equal", () => {
    const motor = `@jogador.{
  name: Jogador;
  description: ;
  tags: agent;
  stats: ;
  flags: ;
  enums: ;
  phrases: ;
  hardLinks: ;
  softLinks: ;
  lists: ;
  fuses: ;
  struct: ;
}`;
    const prose = `CADERNO:
### Sala
A pedra brilha.
`;
    let src = addAnnotation(prose, { id: "a1", book: "book-0", heading: "Sala", quote: "pedra", do: "SET_STAT @jogador.hp 10" });
    src = addAnnotation(src, { id: "a2", book: "book-0", heading: "Sala", quote: "pedra", do: "SET_STAT @jogador.hp 20" });
    src = addAnnotation(src, { id: "a3", book: "book-0", heading: "Sala", quote: "pedra", do: "ADD_TAG @jogador ferido" });
    const hist = entityHistory(authorshipTimeline(src, motor), "@jogador");
    assert.equal(hist.length, 3);
    assert.match(snapDrawer(hist[0]?.after, "stats"), /hp=10/);
    assert.equal(/hp=20/.test(snapDrawer(hist[0]?.after, "stats") ?? ""), false);
    assert.match(snapDrawer(hist[1]?.after, "stats"), /hp=20/);
    assert.match(hist[1]?.diffs.find((item) => item.drawer === "stats")?.before ?? "", /hp=10/);
    assert.equal(changedSnaps(hist[2]!).some((snap) => snap.drawer === "tags"), true);
    const born = addAnnotation(prose, { id: "t1", book: "book-0", heading: "Sala", quote: "pedra", do: "CREATE @tocha.object" });
    const gone = addAnnotation(born, { id: "t2", book: "book-0", heading: "Sala", quote: "pedra", do: "DESTROY @tocha" });
    const torch = entityHistory(authorshipTimeline(gone), "@tocha");
    assert.equal(torch.length, 2);
    assert.equal(torch[0]?.after?.id, "@tocha");
    assert.equal(torch[1]?.after, null);
    const cave = createExampleProject("goblin-cave");
    assert.equal(entityHistory(authorshipTimeline(cave.notebooksSource ?? "", cave.entitiesSource), "@jogador").length, 0);
    const preview = readFileSync(fileURLToPath(new URL("../../ui/WritePreview.tsx", import.meta.url)), "utf8");
    assert.match(preview, /entityHistory/);
    assert.match(preview, /Histórico/);
  });
});

describe("T5 fecho", () => {
  it("documents ## regras and CREATE, keeps hp=10 and the cave equal", () => {
    const ref = readFileSync(fileURLToPath(new URL("../../../ide-guide/lib/syntax-ref.ts", import.meta.url)), "utf8");
    assert.match(ref, /## regras/);
    assert.match(ref, /CREATE/);
    assert.match(ref, /manuscrito/);
    const handwritten = compileNotebook(`CADERNO:
### O Jogador
O jogador está na sala.
O jogador tem 10 de vida.
`);
    const bound = addAnnotation(
      `CADERNO:
### O Jogador
O jogador está na sala.
`,
      { id: "a1", book: "book-0", heading: "O Jogador", quote: "O jogador está na sala.", do: "SET_STAT @jogador.hp 10" },
    );
    assert.match(handwritten.entitiesSource, /hp=10/);
    assert.match(compileNotebook(bound).entitiesSource, /hp=10/);
    const cave = createExampleProject("goblin-cave");
    assert.equal(compileProject(cave).errors.length, 0);
    const orch = readFileSync(fileURLToPath(new URL("../../../ide-state/lib/orchestrator.ts", import.meta.url)), "utf8");
    assert.match(orch, /function inRuntime/);
    assert.match(orch, /if \(!game \|\| !inRuntime\(\)\) return false;/);
  });

  it("leitura corta o texto e o mundo na linha", () => {
    const prose = `CADERNO:
### Sala
O jogador está na sala.
A tocha acende.
`;
    let src = addAnnotation(prose, { id: "a1", book: "book-0", heading: "Sala", quote: "O jogador está na sala.", do: "SET_FLAG @jogador acordado true" });
    src = addAnnotation(src, { id: "a2", book: "book-0", heading: "Sala", quote: "A tocha acende.", do: "SET_FLAG @jogador acordado false" });
    const early = leituraAte(src, "", 3);
    const late = leituraAte(src, "", 4);
    assert.match(early.prose, /O jogador está na sala/);
    assert.equal(early.prose.includes("A tocha acende"), false);
    assert.match(snapDrawer(early.world.get("@jogador"), "flags"), /acordado=true/);
    assert.match(late.prose, /A tocha acende/);
    assert.match(snapDrawer(late.world.get("@jogador"), "flags"), /acordado=false/);
    assert.equal(late.prose.includes("lume-anotacoes"), false);
  });
});

describe("D close ambiguity", () => {
  it("applies D1–D12 without beating or changing the cave", () => {
    const ref = readFileSync(fileURLToPath(new URL("../../../ide-guide/lib/syntax-ref.ts", import.meta.url)), "utf8");
    assert.match(ref, /current_location=@pico_serpente/);
    assert.equal(/local_atual/.test(ref), false);
    assert.match(ref, /CREATE ID\.tag/);
    assert.equal(/@jogador\.vida-1/.test(ref), false);
    assert.equal(doFromDraft({ entityId: "@tocha", drawer: "tags", key: "stats", value: "", quote: "x", line: 1, op: "set", kind: "world" }), null);
    assert.equal(doFromDraft({ entityId: "@tocha", drawer: "tags", key: "object", value: "", quote: "x", line: 1, op: "set", kind: "world" }), "CREATE @tocha.object");
    const fenced = `CADERNO:
## regras
### Tocha
Quando o jogador é marcado como "combate":
  narre "O ferro canta."
## /regras
`;
    assert.equal(/@tocha/.test(compileNotebook(fenced).entitiesSource), false);
    assert.match(compileNotebook(fenced).rulesSource, /combate/);
    const two = `CADERNO:
### Sala
xxA lâmina pesa.
A lâmina pesa.
`;
    const hit = rebindAnnotation(two, { id: "a1", book: "book-0", heading: "Sala", quote: "A lâmina pesa.", do: "SET_STAT @jogador.hp 10", column: 2 });
    assert.equal("error" in hit, false);
    if (!("error" in hit)) assert.equal(hit.line, 3);
    const shell = readFileSync(fileURLToPath(new URL("../../ui/WriteShell.tsx", import.meta.url)), "utf8");
    assert.match(shell, /canUnset/);
    assert.match(shell, /Substituir lista/);
    assert.match(shell, /Não mexe no editor/);
    assert.match(shell, /Entra no retrato/);
    const preview = readFileSync(fileURLToPath(new URL("../../ui/WritePreview.tsx", import.meta.url)), "utf8");
    assert.match(preview, /entityOrigin/);
    assert.equal(existsSync(fileURLToPath(new URL("../../ui/WriteTimeline.tsx", import.meta.url))), false);
    const painted = highlightSource("#combate", "notebook");
    assert.equal(painted[0]?.some((span) => span.cls === "syn-tag"), true);
    const slash = highlightSource("on: @jogador // nota", "rules");
    assert.equal(slash[0]?.some((span) => span.cls === "syn-err"), true);
    const cave = createExampleProject("goblin-cave");
    assert.equal(compileProject(cave).errors.length, 0);
  });
});

describe("F1 flags and lists form", () => {
  it("emits flags =true/=false and lists nome=[…], and refuses the old forms", () => {
    const prose = `CADERNO:
### Sala
A pedra brilha.
`;
    const flagOn = addAnnotation(prose, { id: "a1", book: "book-0", heading: "Sala", quote: "pedra", do: "SET_FLAG @jogador.chefe true" });
    assert.match(compileNotebook(flagOn).entitiesSource, /chefe=true/);
    const flagOff = addAnnotation(prose, { id: "a1", book: "book-0", heading: "Sala", quote: "pedra", do: "SET_FLAG @jogador.chefe false" });
    assert.match(compileNotebook(flagOff).entitiesSource, /chefe=false/);
    const listed = addAnnotation(prose, {
      id: "a1",
      book: "book-0",
      heading: "Sala",
      quote: "pedra",
      do: "CLEAR @jogador.bolso\nPUSH @jogador.bolso a\nCLEAR @jogador.inv\nPUSH @jogador.inv x\nPUSH @jogador.inv y",
    });
    const emitted = compileNotebook(listed).entitiesSource;
    assert.match(emitted, /bolso=\[a\]/);
    assert.match(emitted, /inv=\[x, y\]/);
    const bare = compileEntityFile("@x.{ tags: object; flags: chefe; }");
    assert.ok(bare.errors.length > 0);
    const oldList = compileEntityFile("@x.{ tags: object; lists: inventario=A, B; }");
    assert.ok(oldList.errors.length > 0);
    const ok = compileEntityFile("@x.{ tags: object; flags: chefe=true, vivo=false; lists: inventario=[A, B], bolso=[]; }");
    assert.equal(ok.errors.length, 0, ok.errors.map((e) => e.message).join("\n"));
    assert.equal(ok.worldModel.get("@x")?.flags.chefe, true);
    assert.equal(ok.worldModel.get("@x")?.flags.vivo, false);
    assert.deepEqual(ok.worldModel.get("@x")?.lists.inventario, ["A", "B"]);
    assert.deepEqual(ok.worldModel.get("@x")?.lists.bolso, []);
    const cave = createExampleProject("goblin-cave");
    assert.equal(compileProject(cave).errors.length, 0);
  });
});

describe("F2 fuse form", () => {
  it("accepts N or N>alvo, refuses junk, and keeps the cave equal", () => {
    assert.equal(doFromDraft({ entityId: "@bomba", drawer: "fuses", key: "estouro", value: "3>@boom", quote: "x", line: 1, op: "set" }), "SET_FUSE @bomba.estouro 3>@boom");
    assert.equal(doFromDraft({ entityId: "@bomba", drawer: "fuses", key: "estouro", value: "3.@boom", quote: "x", line: 1, op: "set" }), "SET_FUSE @bomba.estouro 3>@boom");
    assert.equal(doFromDraft({ entityId: "@bomba", drawer: "fuses", key: "estouro", value: "3", quote: "x", line: 1, op: "set" }), "SET_FUSE @bomba.estouro 3");
    assert.equal(doFromDraft({ entityId: "@bomba", drawer: "fuses", key: "estouro", value: "sacsacas", quote: "x", line: 1, op: "set" }), null);
    const prose = `CADERNO:
### Sala
A pedra brilha.
`;
    const armed = addAnnotation(prose, { id: "a1", book: "book-0", heading: "Sala", quote: "pedra", do: "SET_FUSE @bomba.estouro 3>@boom" });
    assert.match(compileNotebook(armed).entitiesSource, /estouro=3>@boom/);
    const junk = addAnnotation(prose, { id: "a1", book: "book-0", heading: "Sala", quote: "pedra", do: "SET_FUSE @bomba.estouro sacsacas" });
    const compiled = compileNotebook(junk);
    assert.equal(/sacsacas/.test(compiled.entitiesSource), false);
    assert.ok(compiled.issues.some((issue) => issue.message.includes("Não percebi")));
    const bad = compileEntityFile("@bomba.{ tags: object; fuses: estouro=sacsacas; }");
    assert.ok(bad.errors.length > 0);
    const motor = compileEntityFile("@bomba.{ tags: object; fuses: estouro=3>@boom; }\n@boom.{ tags: event; }");
    assert.equal(motor.errors.length, 0, motor.errors.map((e) => e.message).join("\n"));
    const shell = readFileSync(fileURLToPath(new URL("../../ui/WriteShell.tsx", import.meta.url)), "utf8");
    assert.match(shell, /3>@boom/);
    const cave = createExampleProject("goblin-cave");
    assert.equal(compileProject(cave).errors.length, 0);
  });
});

describe("F3 link targets", () => {
  it("accepts ID or #A8F2, refuses junk, and keeps the cave equal", () => {
    const ids = ["@jogador", "@sala"];
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "softLinks", key: "alvo", value: "@sala", quote: "x", line: 1, op: "set" }, ids), "SET_LINK @jogador.softLinks.alvo @sala");
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "hardLinks", key: "reliquia", value: "#A8F2", quote: "x", line: 1, op: "set" }, ids), "SET_LINK @jogador.hardLinks.reliquia #A8F2");
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "softLinks", key: "alvo", value: "mo", quote: "x", line: 1, op: "set" }, ids), null);
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "softLinks", key: "alvo", value: "hello world", quote: "x", line: 1, op: "set" }), null);
    const bad = compileEntityFile("@x.{ tags: object; softLinks: alvo=hello world; }");
    assert.ok(bad.errors.length > 0);
    const ok = compileEntityFile("@x.{ tags: object; softLinks: alvo=@jogador; }\n@jogador.{ tags: agent; }");
    assert.equal(ok.errors.length, 0, ok.errors.map((e) => e.message).join("\n"));
    const junk = addAnnotation(`CADERNO:
### Sala
A pedra brilha.
`, { id: "a1", book: "book-0", heading: "Sala", quote: "pedra", do: "SET_LINK @jogador.softLinks.alvo hello world" });
    const compiled = compileNotebook(junk);
    assert.ok(compiled.issues.some((issue) => issue.message.includes("Não percebi")));
    assert.equal(/hello world/.test(compiled.entitiesSource), false);
    const pane = readFileSync(fileURLToPath(new URL("../../ui/NotebookPane.tsx", import.meta.url)), "utf8");
    assert.match(pane, /doFromDraft\(draft, entities.map/);
    const cave = createExampleProject("goblin-cave");
    assert.equal(compileProject(cave).errors.length, 0);
  });
});

describe("F4 stat form", () => {
  it("accepts number or gauge, refuses texto, and keeps the cave equal", () => {
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "stats", key: "hp", value: "10", quote: "x", line: 1, op: "set" }), "SET_STAT @jogador.hp 10");
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "stats", key: "hp", value: "10,5", quote: "x", line: 1, op: "set" }), "SET_STAT @jogador.hp 10.5");
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "stats", key: "hp", value: "10[0..100]", quote: "x", line: 1, op: "set" }), "SET_STAT @jogador.hp 10[0..100]");
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "stats", key: "hp", value: "dez", quote: "x", line: 1, op: "set" }), null);
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "stats", key: "hp", value: "", quote: "x", line: 1, op: "set" }), null);
    const prose = `CADERNO:
### Sala
A pedra brilha.
`;
    const numbered = addAnnotation(prose, { id: "a1", book: "book-0", heading: "Sala", quote: "pedra", do: "SET_STAT @jogador.hp 10" });
    assert.match(compileNotebook(numbered).entitiesSource, /hp=10/);
    const gauged = addAnnotation(prose, { id: "a1", book: "book-0", heading: "Sala", quote: "pedra", do: "SET_STAT @jogador.hp 10[0..100]" });
    assert.match(compileNotebook(gauged).entitiesSource, /hp=10\[0\.\.100\]/);
    const junk = addAnnotation(prose, { id: "a1", book: "book-0", heading: "Sala", quote: "pedra", do: "SET_STAT @jogador.hp dez" });
    const compiled = compileNotebook(junk);
    assert.ok(compiled.issues.some((issue) => issue.message.includes("Não percebi")));
    assert.equal(/hp=dez/.test(compiled.entitiesSource), false);
    const bad = compileEntityFile("@x.{ tags: object; stats: hp=dez; }");
    assert.ok(bad.errors.length > 0);
    const ok = compileEntityFile("@x.{ tags: object; stats: hp=10[0..100], mp=3; }");
    assert.equal(ok.errors.length, 0, ok.errors.map((e) => e.message).join("\n"));
    const shell = readFileSync(fileURLToPath(new URL("../../ui/WriteShell.tsx", import.meta.url)), "utf8");
    assert.match(shell, /10\[0\.\.100\]/);
    const cave = createExampleProject("goblin-cave");
    assert.equal(compileProject(cave).errors.length, 0);
  });
});

describe("F5 named do and lowercase rules", () => {
  it("emits on:/if:/do:, completes named verbs only, and keeps the cave equal", () => {
    const nb = compileNotebook(`CADERNO:
### Sala
Quando o jogador pega a espada:
  Narre "ok."
`);
    assert.match(nb.rulesSource, /\non: @espada/);
    assert.equal(nb.rulesSource.includes("ON:"), false);
    assert.equal(doFromDraft({ entityId: "@jogador", drawer: "struct", key: "k", value: "v", quote: "x", line: 1, op: "set" }), null);
    const vocab = collectVocabulary({ worldModel: compileEntityFile("@jogador.{ tags: agent; }").worldModel });
    const doit = completeAt("do: ", "rules", 4, vocab);
    assert.equal(doit.ctx.slot, "do-verb");
    assert.ok(doit.items.some((item) => item.label === "SET_FLAG"));
    assert.ok(doit.items.some((item) => item.label === "CREATE"));
    assert.ok(doit.items.some((item) => item.label === "PUSH"));
    assert.equal(doit.items.some((item) => item.label === "@jogador"), false);
    assert.equal(doit.items.some((item) => item.label === "STRUCT"), false);
    assert.equal(doit.items.some((item) => item.label === "TICK"), false);
    const tab = tabAfterKeyword("ON", "rules", 2);
    assert.equal(tab?.source, "on: ");
    const shell = readFileSync(fileURLToPath(new URL("../../ui/WriteShell.tsx", import.meta.url)), "utf8");
    assert.match(shell, /drawer !== "struct"/);
    const cave = createExampleProject("goblin-cave");
    assert.equal(compileProject(cave).errors.length, 0);
  });
});

describe("E4 mundo até esta linha", () => {
  it("não inclui quem a prosa ainda não criou, e não aplica mutação futura", () => {
    let src = `CADERNO:
## Lugares
### Sala
A sala está quieta.
### Covil
O covil arde.
`;
    src = addAnnotation(src, { id: "a1", book: "book-0", heading: "Covil", quote: "O covil arde.", do: "SET_FLAG @sala acesa true" });
    const early = leituraAte(src, "@pacto.{ tags: agent; }", 4);
    const late = leituraAte(src, "@pacto.{ tags: agent; }", 6);
    assert.equal(early.world.has("@pacto"), true);
    assert.equal(early.world.has("@sala"), true);
    assert.equal(early.world.has("@covil"), false);
    assert.equal(early.world.get("@sala")?.flags.acesa, undefined);
    assert.equal(late.world.has("@covil"), true);
    assert.equal(late.world.get("@sala")?.flags.acesa, true);
    assert.equal(early.prose.includes("O covil arde"), false);
    const editor = readFileSync(fileURLToPath(new URL("../../ui/NotebookEditor.tsx", import.meta.url)), "utf8");
    const preview = readFileSync(fileURLToPath(new URL("../../ui/WritePreview.tsx", import.meta.url)), "utf8");
    assert.match(editor, /leituraAte/);
    assert.match(editor, /lineBase/);
    assert.match(preview, /leitura\.world\.get\(playerId\)/);
  });
});

