import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { FICA, podeSair } from "../../legado.ts";

describe("fase 57", () => {
  it("um import com substituto sai e um sem substituto fica", () => {
    const lista = readFileSync("src/core/legacy-imports.txt", "utf8");
    assert.equal(lista.includes("src/plugins/nlp/lib/prose.ts -> notebook/index.ts"), false);
    assert.equal(lista.includes("src/plugins/ide-ui/lib/components/SalaPainel.tsx -> narrative-engine/index.ts"), true);
    assert.equal(existsSync("src/plugins/nlp/lib/prose.ts"), true);
    assert.equal(existsSync("src/plugins/notebook/lib/narrative-ir.ts"), true);
    const existe = (path: string) => existsSync(path);
    for (const caminho of FICA) assert.equal(podeSair(caminho, existe), false, caminho.velho);
  });
});
