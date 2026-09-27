import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { menuAnchor, menuDetail, menuOpens, menuSeal } from "../../lib/completion-menu.ts";

describe("E2 menu único", () => {
  it("abre só com ponto colado ou Ctrl+Espaço, e o selo é um dos quatro", () => {
    assert.equal(menuOpens("on: @jogador.", 13, false), true);
    assert.equal(menuOpens("on: @jogador", 12, false), false);
    assert.equal(menuOpens("tags:", 5, false), false);
    assert.equal(menuOpens("quando", 6, true), true);
    assert.equal(menuSeal("@jogador", "id"), "entidade");
    assert.equal(menuSeal("tags:", "keyword"), "gaveta");
    assert.equal(menuSeal("hp", "stat"), "gaveta");
    assert.equal(menuSeal("on:", "keyword"), "lei");
    assert.equal(menuSeal("Quando", "keyword"), "lei");
    assert.equal(menuSeal("ADD_TAG", "keyword"), "lei");
    assert.equal(menuSeal("phrases:", "keyword"), "frase");
    assert.equal(menuSeal("Alto lá", "phrase"), "frase");
    assert.equal(menuDetail("gatilho", "mais"), "gatilho");
    const at = menuAnchor("a.\n", 2, { scrollLeft: 0, scrollTop: 0 }, 48);
    assert.ok(at.left >= 8 && at.top >= 8);
  });

  it("o mesmo popover fica no cursor nos editores, e Enter substitui o trecho", () => {
    const source = readFileSync(fileURLToPath(new URL("../../lib/components/SourceEditor.tsx", import.meta.url)), "utf8");
    const notebook = readFileSync(fileURLToPath(new URL("../../../notebook/ui/NotebookEditor.tsx", import.meta.url)), "utf8");
    const menu = readFileSync(fileURLToPath(new URL("../../lib/components/CompletionMenu.tsx", import.meta.url)), "utf8");
    for (const src of [source, notebook]) {
      assert.match(src, /CompletionMenu/);
      assert.match(src, /menuOpens/);
      assert.match(src, /menuAnchor/);
      assert.equal(src.includes("Tab confirma · Enter nova linha"), false);
      assert.equal(src.includes("absolute top-3 right-3"), false);
    }
    assert.match(source, /e\.key === "Enter" && items\[active\]/);
    assert.match(source, /apply\(items\[active\]!\)/);
    assert.match(notebook, /e\.key === "Enter" \|\| e\.key === "Tab"/);
    assert.match(notebook, /suggest\(ta\.value, ta\.selectionStart, true\)/);
    assert.match(menu, /aria-label="Sugestões"/);
    assert.match(menu, /\{item\.seal\}/);
    assert.match(menu, /\{item\.detail\}/);
  });
});
