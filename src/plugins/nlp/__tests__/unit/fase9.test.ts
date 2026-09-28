import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { definirModelo, ligarIr, nlpComando, nlpProsa } from "../../index.ts";
import { lerIr } from "../../../notebook/index.ts";
import type { WorldModel } from "../../../narrative-engine/types.ts";

function files(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

describe("fase 9", () => {
  afterEach(() => definirModelo(null));

  it("o comando não chama o modelo; a prosa chega à IR; o editor não importa o modelo", () => {
    definirModelo({
      id: "teste",
      act() {
        throw new Error("modelo no comando");
      },
    });
    assert.equal(nlpComando("intent.x", new Map() as WorldModel), null);

    definirModelo(null);
    ligarIr(lerIr);
    const prose = "### Sala\n\nJoão abriu a porta.";
    const plain = nlpProsa(prose);
    assert.equal(plain.prose, prose);
    assert.equal(plain.version, "3.0");
    assert.equal(plain.acts.some((act) => act.operation === "structure"), true);
    assert.equal(plain.acts.some((act) => act.operation === "represent"), true);

    definirModelo({
      id: "teste",
      act(sentence) {
        return sentence.startsWith("João") ? "evaluate" : null;
      },
    });
    const withModel = nlpProsa(prose);
    assert.equal(withModel.prose, prose);
    assert.equal(withModel.acts.find((act) => act.text.startsWith("João"))?.operation, "evaluate");
    assert.equal(withModel.acts.find((act) => act.operation === "structure")?.operation, "structure");

    const editor = files("src/plugins/ide-ui").concat(files("src/plugins/notebook/ui"));
    for (const file of editor) {
      const text = readFileSync(file, "utf8");
      assert.equal(text.includes("model-provider"), false, file);
      assert.equal(text.includes("SmallModel"), false, file);
    }
  });
});
