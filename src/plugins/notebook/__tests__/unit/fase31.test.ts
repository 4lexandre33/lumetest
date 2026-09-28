import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileEntityFile } from "../../../narrative-engine/index.ts";
import { referenciasDe } from "../../lib/reference.ts";

function world(source: string) {
  const compiled = compileEntityFile(source);
  assert.equal(compiled.errors.length, 0, compiled.errors.map((issue) => issue.message).join("\n"));
  return compiled.worldModel;
}

describe("fase 31", () => {
  it("usa recência, cena, número e conhecimento, e só o género declarado", () => {
    const recent = world("@maria.{ name: 'Maria'; tags: agent; }\n@ana.{ name: 'Ana'; tags: agent; }");
    const ela = referenciasDe("Maria entrou. Ana saiu. Ela parou.", recent).find((hit) => hit.token === "Ela")!;
    assert.equal(ela.status, "resolvido");
    assert.equal(ela.entityId, "@ana");
    assert.equal(ela.evidence[0]!.kind, "recencia");

    const same = referenciasDe("Maria viu Ana. Ela parou.", recent).find((hit) => hit.token === "Ela")!;
    assert.equal(same.status, "ambiguo");
    assert.equal(same.entityId, null);

    const scenes = referenciasDe("### Rua\n\nMaria entrou.\n\n### Sala\n\nEla parou.", recent).find((hit) => hit.token === "Ela")!;
    assert.equal(scenes.entityId, null);
    assert.equal(scenes.status, "nao_resolvido");

    const gendered = world("@maria.{ name: 'Maria'; tags: agent; phrases: genero='feminino'; }\n@joao.{ name: 'João'; tags: agent; phrases: genero='masculino'; }");
    const hers = referenciasDe("Maria viu João. Ela parou.", gendered).find((hit) => hit.token === "Ela")!;
    assert.equal(hers.entityId, "@maria");
    assert.equal(JSON.stringify(hers).includes("genero"), false);
    const undeclared = world("@maria.{ name: 'Maria'; tags: agent; flags: mulher=true; }\n@ana.{ name: 'Ana'; tags: agent; }");
    const still = referenciasDe("Maria viu Ana. Ela parou.", undeclared).find((hit) => hit.token === "Ela")!;
    assert.equal(still.entityId, null);

    const crowd = world("@maria.{ name: 'Maria'; tags: agent; phrases: numero='plural'; }");
    const they = referenciasDe("Maria entrou. Eles pararam.", crowd).find((hit) => hit.token === "Eles")!;
    assert.equal(they.entityId, "@maria");
    assert.equal(they.evidence[0]!.kind, "numero");
    const two = referenciasDe("Maria entrou. Ana saiu. Eles pararam.", recent).find((hit) => hit.token === "Eles")!;
    assert.equal(two.entityId, null);

    const known = world("@maria.{ name: 'Maria'; tags: agent; }\n@ana.{ name: 'Ana'; tags: agent; }");
    known.get("@maria")!.tags.add("knows_@ana");
    const knew = referenciasDe("Maria viu Ana. Ela parou.", known).find((hit) => hit.token === "Ela")!;
    assert.equal(knew.status, "resolvido");
    assert.equal(knew.entityId, "@ana");
    assert.equal(knew.evidence[0]!.kind, "conhecimento");
  });
});
