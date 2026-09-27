import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { lerLivro, lerProsa } from "../../lib/leitor.ts";
import { parseCadernoLibrary } from "../../lib/pages.ts";

describe("E5 leitor de prosa", () => {
  it("mostra a prosa e esconde capa, cerca, fatia e nota", () => {
    const read = lerProsa(`CADERNO: A cave
Autora: Ana
### Sala
A sala /* segredo */ está quieta.
## regras
Quando o jogador é marcado como "combate":
  narre "O ferro canta."
## /regras
## Lugares
### Covil
O covil arde. #combate
# --- lume-anotacoes ---
{"id":"a1"}
`);
    assert.equal(read.includes("CADERNO"), false);
    assert.equal(read.includes("Ana"), false);
    assert.equal(read.includes("##"), false);
    assert.equal(read.includes("Quando"), false);
    assert.equal(read.includes("ferro"), false);
    assert.equal(read.includes("segredo"), false);
    assert.equal(read.includes("lume-anotacoes"), false);
    assert.match(read, /^Sala\nA sala está quieta\.\nLugares\nCovil\nO covil arde\. #combate$/);
    const preview = readFileSync(fileURLToPath(new URL("../../ui/WritePreview.tsx", import.meta.url)), "utf8");
    assert.match(preview, /lerProsa/);
  });
});

describe("E9 leitura", () => {
  it("lê o caderno inteiro e não o outro", () => {
    const src = `CADERNO: Um
### Sala
A sala está quieta.
## regras
Quando o jogador é marcado como "combate":
  narre "O ferro canta."
## /regras
O fim chega.
CADERNO: Dois
### Covil
O outro texto.
`;
    const book = parseCadernoLibrary(src).books[0]!;
    const read = lerLivro(src, { start: book.startLine - 1, end: book.endLine });
    assert.match(read, /A sala está quieta/);
    assert.match(read, /O fim chega/);
    assert.equal(read.includes("Quando"), false);
    assert.equal(read.includes("ferro"), false);
    assert.equal(read.includes("outro"), false);
    const preview = readFileSync(fileURLToPath(new URL("../../ui/WritePreview.tsx", import.meta.url)), "utf8");
    assert.match(preview, /lerLivro/);
    assert.match(preview, /Até aqui/);
  });
});
