import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compileNotebook } from "../../lib/notebook.ts";
import { bibliotecaOf, insertAtSelection, insertMoldesSection, moldesOf } from "../../lib/write-menu.ts";
import { lerProsa } from "../../lib/leitor.ts";
import { parseCadernoView } from "../../lib/pages.ts";

const text = `CADERNO:
### Sala
A sala está quieta.
## moldes
### porta
A porta range.
## /moldes
### Covil
O covil arde.
`;

describe("E8 molde e biblioteca", () => {
  it("guarda o molde fora da prosa e insere o texto", () => {
    const compiled = compileNotebook(text);
    assert.equal(/porta/.test(compiled.entitiesSource), false);
    assert.match(compiled.entitiesSource, /covil/);
    const molds = moldesOf(text);
    assert.equal(molds.length, 1);
    assert.equal(molds[0]!.title, "porta");
    assert.equal(molds[0]!.body, "A porta range.");
    const lib = bibliotecaOf(text, [{ id: "p", label: "@jogador.oi", insert: "Olá." }]);
    assert.deepEqual(lib.map((item) => item.kind), ["molde", "frase"]);
    assert.equal(insertAtSelection("Aqui.", 5, 5, molds[0]!.body).source, "Aqui.A porta range.");
    const read = lerProsa(text);
    assert.equal(read.includes("range"), false);
    assert.match(read, /A sala está quieta/);
    assert.match(read, /O covil arde/);
    const view = parseCadernoView(text);
    assert.equal(view.pages.some((page) => page.title === "porta" || /range/.test(page.body)), false);
    const opened = insertMoldesSection("A", 1);
    assert.match(opened.source, /## moldes/);
    assert.match(opened.source, /## \/moldes/);
    const editor = readFileSync(fileURLToPath(new URL("../../ui/NotebookEditor.tsx", import.meta.url)), "utf8");
    assert.match(editor, /Biblioteca/);
    assert.match(editor, /Secção de moldes/);
  });
});
