import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compileEntityFile } from "../../../narrative-engine/index.ts";
import { lerContinuidade } from "../../lib/continuidade.ts";
import { estadosDe } from "../../lib/pessoa.ts";

describe("fase 52", () => {
  it("sem arco declarado não há arco, e duas cenas não geram crise", () => {
    const compiled = compileEntityFile("@maria.{ name: 'Maria'; tags: agent; stats: hp=10; }");
    assert.equal(compiled.errors.length, 0);
    const prosa = ["### Sala", "", "pessoa: @maria inicio=calma", "Maria entrou. hp=0", "", "### Rua", "", "Maria saiu. hp=1"].join("\n");
    const estados = estadosDe(compiled.worldModel, prosa);
    assert.equal(estados.length, 1);
    assert.equal(estados[0]!.cena.title, "Sala");
    assert.equal(estados[0]!.crise, null);
    assert.equal(estados.some((estado) => estado.cena.title === "Rua"), false);
    assert.deepEqual(lerContinuidade(prosa).arcos, []);

    const marcado = lerContinuidade(["### Sala", "", "arco: a queda", "", "### Rua", "", "Maria saiu."].join("\n"));
    assert.equal(marcado.arcos.length, 1);
    assert.equal(marcado.arcos[0]!.cena?.title, "Sala");
    assert.equal(marcado.arcos.some((arco) => arco.cena?.title === "Rua"), false);

    const editor = readFileSync("src/plugins/ide-ui/lib/components/SourceEditor.tsx", "utf8");
    const inspector = readFileSync("src/plugins/ide-ui/lib/components/Inspector.tsx", "utf8");
    assert.equal(editor.includes("arco"), false);
    assert.equal(inspector.includes("arco"), false);
  });
});
