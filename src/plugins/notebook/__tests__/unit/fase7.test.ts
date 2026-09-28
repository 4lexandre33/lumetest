import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileEntityFile } from "../../../narrative-engine/index.ts";
import { referenciasDe } from "../../lib/reference.ts";

function world(source: string) {
  const compiled = compileEntityFile(source);
  assert.equal(compiled.errors.length, 0, compiled.errors.map((issue) => issue.message).join("\n"));
  return compiled.worldModel;
}

describe("fase 7", () => {
  it("resolve só com um candidato e não inventa gênero", () => {
    const prose = "Maria entrou. Ela parou.";
    const one = world("@maria.{ name: 'Maria'; tags: agent; flags: mulher=true; }");
    const hits = referenciasDe(prose, one);
    const name = hits.find((hit) => hit.token === "Maria")!;
    const pronoun = hits.find((hit) => hit.token === "Ela")!;
    assert.equal(name.status, "resolvido");
    assert.equal(name.entityId, "@maria");
    assert.equal(name.evidence[0]!.kind, "nome");
    assert.equal(prose.slice(name.span.start, name.span.end), "Maria");
    assert.equal(pronoun.status, "resolvido");
    assert.equal(pronoun.entityId, "@maria");
    assert.equal(pronoun.evidence[0]!.kind, "unica_mencao");
    assert.equal(JSON.stringify(hits).includes("genero"), false);
    assert.equal(JSON.stringify(hits).includes("mulher"), false);

    const two = world("@maria.{ name: 'Maria'; tags: agent; flags: mulher=true; }\n@ana.{ name: 'Ana'; tags: agent; }");
    const later = referenciasDe("Maria viu Ana. Ela parou.", two).find((hit) => hit.token === "Ela")!;
    assert.equal(later.status, "ambiguo");
    assert.equal(later.entityId, null);
    assert.deepEqual(later.candidates, ["@ana", "@maria"]);

    const none = referenciasDe("Ela parou.", one).find((hit) => hit.token === "Ela")!;
    assert.equal(none.status, "nao_resolvido");
    assert.equal(none.entityId, null);
    assert.deepEqual(none.candidates, []);

    const same = world("@maria.{ name: 'Maria'; tags: agent; }\n@outra.{ name: 'Maria'; tags: agent; }");
    const clash = referenciasDe("Maria entrou.", same).find((hit) => hit.token === "Maria")!;
    assert.equal(clash.status, "ambiguo");
    assert.equal(clash.entityId, null);
    assert.deepEqual(clash.candidates, ["@maria", "@outra"]);
    assert.equal(prose, "Maria entrou. Ela parou.");
  });
});
