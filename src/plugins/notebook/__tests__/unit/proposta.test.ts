import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseAnotacoesSlice, rebindAnnotation } from "../../lib/annotations.ts";
import { aceitarProposta, dosNaLinha, propostasAbertas } from "../../lib/proposta.ts";
import { compileNotebook } from "../../lib/notebook.ts";

const text = `CADERNO:
### Sala
O aço #combate.
## regras
Quando o jogador é marcado como "combate":
  narre "O ferro canta."
## /regras
`;

describe("E6 proposta", () => {
  it("aceitar grava o do na linha, recusar não apaga a lei", () => {
    const law = compileNotebook(text).rulesSource;
    const once = aceitarProposta(text, 3, { dos: ["SET_FLAG @jogador acordado true"] });
    assert.equal("error" in once, false);
    if ("error" in once) return;
    const saved = parseAnotacoesSlice(once.text);
    assert.equal(saved.length, 1);
    const hit = rebindAnnotation(once.text, saved[0]!);
    assert.equal("line" in hit && hit.line, 3);
    assert.match(once.text, /O aço #combate/);
    assert.equal(compileNotebook(once.text).rulesSource, law);
    const twice = aceitarProposta(once.text, 3, { dos: ["SET_FLAG @jogador acordado true"] });
    if ("error" in twice) assert.fail("second accept");
    else assert.equal(parseAnotacoesSlice(twice.text).length, 1);

    const hidden = propostasAbertas([{ id: "lei", dos: ["SET_FLAG @jogador acordado true"] }], ["lei"], []);
    assert.equal(hidden.length, 0);
    const done = propostasAbertas([{ id: "lei", dos: ["SET_FLAG @jogador acordado true"] }], [], dosNaLinha(once.text, 3));
    assert.equal(done.length, 0);
    assert.deepEqual(aceitarProposta(text, 3, { dos: [] }), { error: "empty" });

    const preview = readFileSync(fileURLToPath(new URL("../../ui/WritePreview.tsx", import.meta.url)), "utf8");
    assert.match(preview, /Aceitar/);
    assert.match(preview, /Recusar/);
    assert.match(preview, /aceitarProposta/);
  });
});
