import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileEntityFile } from "../../../narrative-engine/index.ts";
import { referenciasDe } from "../../lib/reference.ts";

function world(source: string) {
  const compiled = compileEntityFile(source);
  assert.equal(compiled.errors.length, 0, compiled.errors.map((issue) => issue.message).join("\n"));
  return compiled.worldModel;
}

describe("fase 62", () => {
  it("consulta texto, discurso, cena, grafo, conhecimento, focalização e continuidade, e não escolhe sem candidato único", () => {
    const pessoas = world("@maria.{ name: 'Maria'; tags: agent; phrases: genero='feminino'; }\n@ana.{ name: 'Ana'; tags: agent; phrases: genero='feminino'; }\n@joao.{ name: 'João'; tags: agent; phrases: genero='masculino'; }\n@pedro.{ name: 'Pedro'; tags: agent; }\n@chave.{ name: 'Chave'; tags: object; }\n@rua.{ name: 'Rua'; tags: place; }");
    pessoas.get("@maria")!.hardLinks.amigo = "@pedro";
    pessoas.get("@maria")!.hardLinks.current_location = "@rua";

    const isso = referenciasDe("A chave caiu. Isso partiu.", pessoas).find((hit) => hit.token.toLowerCase() === "isso")!;
    assert.equal(isso.entityId, "@chave");
    const issoDuplo = referenciasDe("Maria viu Ana. Isso partiu.", pessoas).find((hit) => hit.token.toLowerCase() === "isso")!;
    assert.equal(issoDuplo.entityId, null);

    const homem = referenciasDe("Maria viu João. Aquele homem parou.", pessoas).find((hit) => hit.token.toLowerCase() === "aquele homem")!;
    assert.equal(homem.entityId, "@joao");

    const objeto = referenciasDe("Maria segurou a chave. O objeto brilhou.", pessoas).find((hit) => hit.token.toLowerCase() === "o objeto")!;
    assert.equal(objeto.entityId, "@chave");
    assert.equal(objeto.evidence[0]!.kind, "texto");

    const amigo = referenciasDe("Maria entrou. Seu amigo chegou.", pessoas).find((hit) => hit.token.toLowerCase() === "seu amigo")!;
    assert.equal(amigo.entityId, "@pedro");
    assert.equal(amigo.evidence[0]!.kind, "grafo");
    pessoas.get("@maria")!.hardLinks.amigo2 = "@joao";
    const amigos = referenciasDe("Maria entrou. Seu amigo chegou.", pessoas).find((hit) => hit.token.toLowerCase() === "seu amigo")!;
    assert.equal(amigos.entityId, null);

    const la = referenciasDe("Maria andou. Lá estava frio.", pessoas).find((hit) => hit.token.toLowerCase() === "lá")!;
    assert.equal(la.entityId, "@rua");
    assert.equal(la.evidence[0]!.kind, "grafo");

    const dia = referenciasDe("instante: noite\ninstante: manha\nNaquele dia choveu.", pessoas).find((hit) => hit.token.toLowerCase() === "naquele dia")!;
    assert.equal(dia.entityId, null);
    const umDia = referenciasDe("instante: noite\nNaquele dia choveu.", pessoas).find((hit) => hit.token.toLowerCase() === "naquele dia")!;
    assert.equal(umDia.entityId, "noite");
    assert.equal(umDia.evidence[0]!.kind, "grafo");

    const foco = referenciasDe("focalizacao: @maria\nEla parou.", pessoas).find((hit) => hit.token === "Ela")!;
    assert.equal(foco.entityId, "@maria");
    assert.equal(foco.evidence[0]!.kind, "focalizacao");

    const arco = referenciasDe("arco: @maria\nMaria viu Ana. Ela parou.", pessoas).find((hit) => hit.token === "Ela")!;
    assert.equal(arco.entityId, "@maria");
    assert.equal(arco.evidence[0]!.kind, "continuidade");

    const fala = referenciasDe("Maria entrou. «Ana saiu. Ela parou.»", pessoas).find((hit) => hit.token === "Ela")!;
    assert.equal(fala.entityId, "@ana");
    assert.equal(fala.evidence[0]!.kind, "discurso");

    assert.equal(referenciasDe("Ela parou.", pessoas).find((hit) => hit.token === "Ela")?.entityId, null);
    assert.equal(referenciasDe("Maria viu Ana. Ela parou.", pessoas).find((hit) => hit.token === "Ela")?.entityId, null);
  });
});
