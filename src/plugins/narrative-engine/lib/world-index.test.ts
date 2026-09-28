import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileProject, createProject, diagnose } from "./project.ts";
import { createExampleProject } from "./examples.ts";
import { buildWorldIndex, formatWorldIndex, validateWorld } from "./world-index.ts";
import { applyAdventureKit } from "../../kit-adventure/index.ts";
import { applyChannelKit } from "../../kit-channel/index.ts";

describe("world index and dialogue dead-ends", () => {
  it("lists rooms objects agents rules tags channels and patterns", () => {
    const project = createProject("idx", {
      entitiesSource: `@jogador.{ tags: agent; links: current_location=@sala; }
@sala.{ tags: place; }
@chave.{ tags: object; links: current_location=@sala; }
@economia.{ tags: channel; stats: state=0; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

PADRAO vitoria
eventos: start
nome: Vitória
`,
      taxonomySource: `channel → abstract
`,
    });
    const compiled = compileProject(project);
    assert.equal(compiled.errors.length, 0);
    const index = buildWorldIndex(compiled.worldModel, compiled.rules, compiled.patterns, compiled.taxonomy);
    assert.deepEqual(index.places, ["@sala"]);
    assert.deepEqual(index.objects, ["@chave"]);
    assert.deepEqual(index.agents, ["@jogador"]);
    assert.ok(index.rules.some((r) => r.id === "start"));
    assert.ok(index.tags.includes("place"));
    assert.deepEqual(index.channels, ["@economia"]);
    assert.deepEqual(index.patterns, ["vitoria"]);
    const md = formatWorldIndex(index);
    assert.match(md, /## Salas/);
    assert.match(md, /- @sala/);
    assert.match(md, /## Padrões/);
  });

  it("warns on topic without ask, missing conv, one-state channel, vivo without reaction", () => {
    const project = createProject("becos", {
      entitiesSource: `@jogador.{ tags: agent; links: current_location=@sala; }
@sala.{ tags: place; }
@segredo.{ tags: topic; }
@npc.{ tags: agent; links: conv=@fantasma; }
@economia.{ tags: channel; stats: state=0; }
@goblin.{ tags: agent, vivo; links: current_location=@sala; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# channel one
ON: @economia
narrativa: "um estado"
`,
      taxonomySource: `topic → information
channel → abstract
`,
    });
    const compiled = compileProject(project);
    const issues = validateWorld(compiled.worldModel, compiled.rules, compiled.taxonomy);
    assert.ok(issues.some((i) => i.code === "W010" && i.message.includes("@segredo")));
    assert.ok(issues.some((i) => i.code === "W011" && i.message.includes("@fantasma")));
    assert.ok(issues.some((i) => i.code === "W012" && i.message.includes("@economia")));
    assert.ok(issues.some((i) => i.code === "W013" && i.message.includes("@goblin")));
    assert.equal(compiled.worldModel.get("@segredo")?.tags.has("topic"), true);
  });

  it("is silent when ask conv channel and vivo are covered", () => {
    let project = createProject("ok", {
      entitiesSource: `@jogador.{ tags: agent; links: current_location=@sala; }
@sala.{ tags: place; }
@segredo.{ tags: topic; }
@no.{ tags: information; }
@npc.{ tags: agent; links: conv=@no; }
@economia.{ tags: channel; stats: state=0; }
@goblin.{ tags: agent, vivo; links: current_location=@sala; }
start()
`,
      rulesSource: `# start
ON: start
narrativa: "ok"

# ask secret
ON: @segredo
IF: @jogador.intent=ask
narrativa: "conta"

# goblin
ON: @goblin
narrativa: "grita"
`,
      taxonomySource: `topic → information
channel → abstract
`,
    });
    project = applyChannelKit(project);
    const compiled = compileProject(project);
    const issues = validateWorld(compiled.worldModel, compiled.rules, compiled.taxonomy);
    assert.equal(issues.filter((i) => i.code === "W010").length, 0);
    assert.equal(issues.filter((i) => i.code === "W011").length, 0);
    assert.equal(issues.filter((i) => i.code === "W012").length, 0);
    assert.equal(issues.filter((i) => i.code === "W013").length, 0);
  });

  it("does not invent rules and leaves the cave without E10 warnings", () => {
    const cave = createExampleProject("goblin-cave");
    const before = cave.rulesSource;
    const { compiled, issues } = diagnose(cave);
    assert.equal(compiled.errors.length, 0);
    assert.equal(cave.rulesSource, before);
    assert.equal(issues.filter((i) => /^W01[0-3]$/.test(i.code)).length, 0);
    const kitted = applyAdventureKit(createExampleProject("goblin-cave"));
    assert.notEqual(kitted.rulesSource, before);
  });
});
