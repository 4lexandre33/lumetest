import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createCore, type Core } from "../../../../core/index.ts";
import { NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin } from "../../../narrative-engine/index.ts";
import type { NarrativeEngineService } from "../../../narrative-engine/types.ts";
import { SPATIAL_MANIFEST, createSpatialPlugin } from "../../index.ts";
import type { SpatialEntity, SpatialService, SpatialWorld } from "../../types.ts";
import { IN_ALIAS, inOf } from "../../lib/space.ts";

function entity(id: string, links: Record<string, string>, tags: string[] = []): SpatialEntity {
  return { id, links, tags };
}

function world(list: SpatialEntity[]): SpatialWorld {
  const map = new Map(list.map((item) => [item.id, item]));
  return map;
}

const boxRoom = () =>
  world([
    entity("@sala", { exit_n: "@corredor" }, ["place"]),
    entity("@corredor", { exit_s: "@sala" }, ["place"]),
    entity("@caixa", { in: "@sala" }, ["object", "container"]),
    entity("@chave", { in: "@caixa" }, ["object"]),
    entity("MESA", { in: "@sala" }, ["object"]),
    entity("LIVRO", { on: "MESA" }, ["object"]),
    entity("@jogador", { [IN_ALIAS]: "@sala" }, ["agent"]),
    entity("ESPADA", { held_by: "@jogador" }, ["object"]),
    entity("CASACO", { worn_by: "@jogador" }, ["object"]),
    entity("@porta", { from: "@sala", to: "@corredor", dir: "n" }, ["connector"]),
  ]);

describe("Spatial", () => {
  let core: Core;
  let spatial: SpatialService;
  let narrative: NarrativeEngineService;

  beforeEach(async () => {
    core = createCore();
    core.registerPlugin(NARRATIVE_ENGINE_MANIFEST, createNarrativeEnginePlugin);
    core.registerPlugin(SPATIAL_MANIFEST, createSpatialPlugin);
    await core.activatePlugin("lume-narrative-engine");
    await core.activatePlugin("lume-spatial");
    spatial = core.getService<SpatialService>("Spatial");
    narrative = core.getService<NarrativeEngineService>("NarrativeEngine");
  });

  it("declares Spatial capability", () => {
    assert.equal(SPATIAL_MANIFEST.name, "lume-spatial");
    assert.ok(SPATIAL_MANIFEST.capabilities?.provides?.some((c) => c.name === "Spatial"));
  });

  it("reads in, aliases current_location, and walks the box-in-room chain", () => {
    const w = boxRoom();
    assert.equal(spatial.locationOf(w, "@chave"), "@caixa");
    assert.equal(spatial.locationOf(w, "@caixa"), "@sala");
    assert.equal(spatial.locationOf(w, "@jogador"), "@sala");
    assert.equal(spatial.relationOf(w, "@jogador"), "in");
    assert.equal(inOf(w.get("@jogador")!), "@sala");
    assert.deepEqual(spatial.contents(w, "@sala"), ["@caixa", "@jogador", "MESA"]);
    assert.equal(spatial.contents(w, "@sala").includes("@chave"), false);
    assert.equal(spatial.deepContains(w, "@sala", "@chave"), true);
    assert.equal(spatial.deepContains(w, "@caixa", "@chave"), true);
    assert.equal(spatial.deepContains(w, "@caixa", "@jogador"), false);
    assert.deepEqual(spatial.chain(w, "@chave"), ["@caixa", "@sala"]);
  });

  it("prefers in over current_location when both exist", () => {
    const w = world([entity("X", { in: "A", current_location: "B" })]);
    assert.equal(inOf(w.get("X")!), "A");
    assert.equal(spatial.locationOf(w, "X"), "A");
    assert.deepEqual(spatial.contents(w, "A"), ["X"]);
    assert.deepEqual(spatial.contents(w, "B"), []);
  });

  it("treats on, held_by and worn_by as sibling relations", () => {
    const w = boxRoom();
    assert.deepEqual(spatial.contentsOn(w, "MESA"), ["LIVRO"]);
    assert.deepEqual(spatial.heldBy(w, "@jogador"), ["ESPADA"]);
    assert.deepEqual(spatial.wornBy(w, "@jogador"), ["CASACO"]);
    assert.equal(spatial.locationOf(w, "ESPADA"), "@jogador");
    assert.equal(spatial.relationOf(w, "ESPADA"), "held_by");
    assert.equal(spatial.relationOf(w, "LIVRO"), "on");
    assert.equal(spatial.deepContains(w, "@sala", "ESPADA"), true);
    assert.deepEqual(spatial.occupants(w, "@jogador"), ["CASACO", "ESPADA"]);
  });

  it("reads travel from exit_* and connector entities", () => {
    const w = boxRoom();
    assert.equal(spatial.destination(w, "@sala", "n"), "@corredor");
    assert.equal(spatial.destination(w, "@corredor", "s"), "@sala");
    assert.equal(spatial.destination(w, "@sala", "s"), null);
    const fromSala = spatial.exits(w, "@sala");
    assert.ok(fromSala.some((exit) => exit.dir === "n" && exit.to === "@corredor" && exit.via === "exit"));
    assert.ok(fromSala.some((exit) => exit.dir === "n" && exit.to === "@corredor" && exit.via === "connector"));
    assert.deepEqual(
      spatial.connectorsFrom(w, "@sala").map((c) => c.id),
      ["@porta"],
    );
  });

  it("does not mutate the world and accepts a compiled WorldModel", () => {
    const project = narrative.createProject("caixa", {
      entitiesSource: `@sala.{ tags: place; links: exit_n=@corredor; }
@corredor.{ tags: place; links: exit_s=@sala; }
@caixa.{ tags: object; links: in=@sala; }
@chave.{ tags: object; links: in=@caixa; }
@jogador.{ tags: agent; links: current_location=@sala; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"
`,
    });
    const compiled = narrative.compileProject(project);
    assert.equal(compiled.errors.length, 0);
    const before = compiled.worldModel.get("@chave")!.links.in;
    assert.equal(spatial.deepContains(compiled.worldModel, "@sala", "@chave"), true);
    assert.equal(spatial.locationOf(compiled.worldModel, "@jogador"), "@sala");
    assert.equal(spatial.destination(compiled.worldModel, "@sala", "n"), "@corredor");
    assert.equal(compiled.worldModel.get("@chave")!.links.in, before);
    assert.equal(compiled.worldModel.get("@jogador")!.links.current_location, "@sala");
    assert.equal(compiled.worldModel.get("@jogador")!.links.in, undefined);
  });

  it("builds a room graph from exit_* and in without mutating the world", () => {
    const w = world([
      entity("@sala", { exit_n: "@corredor" }, ["place"]),
      entity("@corredor", { exit_s: "@sala" }, ["place"]),
      entity("ALCOVA", { in: "@sala" }, ["place"]),
      entity("@jogador", { current_location: "@sala" }, ["agent"]),
    ]);
    const map = spatial.graphOf(w);
    const sala = map.rooms.find((r) => r.id === "@sala");
    const corredor = map.rooms.find((r) => r.id === "@corredor");
    const alcova = map.rooms.find((r) => r.id === "ALCOVA");
    assert.ok(sala && corredor && alcova);
    assert.ok(corredor.y < sala.y);
    assert.ok(map.links.some((l) => l.from === "@sala" && l.to === "@corredor" && l.dir === "n" && l.via === "exit"));
    assert.ok(map.links.some((l) => l.from === "@sala" && l.to === "ALCOVA" && l.via === "in"));
    assert.equal(spatial.placeOf(w, "@jogador"), "@sala");
    assert.equal(w.get("@sala")?.links.exit_n, "@corredor");

    const cave = narrative.compileProject(narrative.createProject("cave-map", {
      entitiesSource: `@jogador.{ tags: agent; links: current_location=@entrada; }
@entrada.{ tags: place; }
@caverna.{ tags: place; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"
`,
    }));
    assert.equal(cave.errors.length, 0);
    const rooms = spatial.graphOf(cave.worldModel).rooms.map((r) => r.id).sort();
    assert.deepEqual(rooms, ["@caverna", "@entrada"]);
  });
});
