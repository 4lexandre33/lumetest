import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compileNotebook } from "../../lib/notebook.ts";
import { leisSempre, writeSuggestions } from "../../lib/prose-triggers.ts";
import { decidirSempre } from "../../lib/proposta.ts";
import { compileEntityFile } from "../../../narrative-engine/index.ts";
import { compileRuleFile } from "../../../narrative-engine/index.ts";

const caderno = `CADERNO:
### Sala
O aço #combate.
## regras
sempre
Quando o jogador é marcado como "combate":
  narre "O ferro canta."
Quando o jogador é marcado como "ferido":
  narre "O sangue escorre."
## /regras
`;

describe("E7 leis sempre e avisos", () => {
  it("sempre aplica a lei seguinte e a outra continua proposta", () => {
    const compiled = compileNotebook(caderno);
    assert.match(compiled.rulesSource, /\/\* sempre \*\//);
    const rules = compiled.rulesSource.split(/\n\n/);
    assert.match(rules[0] ?? "", /sempre/);
    assert.equal(/sempre/.test(rules[1] ?? ""), false);
    assert.equal(compileRuleFile(compiled.rulesSource).errors.length, 0);
    assert.equal(writeSuggestions(caderno, 3).some((item) => /ferro/.test(item.narrative)), false);
    assert.equal(leisSempre(caderno, 3).length, 1);
    assert.equal(writeSuggestions(caderno, 3).some((item) => /sangue/.test(item.narrative)), false);

    const rule = {
      id: "lei",
      on: "@jogador",
      ifs: [],
      narrative: "",
      dos: ["SET_FLAG @jogador acordado true"],
      sempre: true,
    };
    const contra = compileEntityFile("@jogador.{ tags: agent; flags: acordado=false; }").worldModel;
    const aviso = decidirSempre(contra, [rule], []);
    assert.equal(aviso.aplicar.length, 0);
    assert.match(aviso.avisos[0] ?? "", /sempre pede true/);
    const livre = compileEntityFile("@jogador.{ tags: agent; }").worldModel;
    const vai = decidirSempre(livre, [rule], []);
    assert.equal(vai.aplicar.length, 1);
    assert.equal(vai.avisos.length, 0);
    const feito = decidirSempre(livre, [rule], ["SET_FLAG @jogador acordado true"]);
    assert.equal(feito.aplicar.length, 0);

    const preview = readFileSync(fileURLToPath(new URL("../../ui/WritePreview.tsx", import.meta.url)), "utf8");
    assert.match(preview, /Avisos/);
    assert.match(preview, /decidirSempre/);
  });
});
