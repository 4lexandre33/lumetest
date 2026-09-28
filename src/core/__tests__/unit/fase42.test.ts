import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { FICA, SAIDAS, podeSair } from "../../legado.ts";

describe("fase 42", () => {
  it("o caminho velho só sai com paridade e substituto", () => {
    const existe = (path: string) => path === "espelho-de-boot" ? false : existsSync(path);
    assert.equal(podeSair({ velho: "a", substituto: "src/nao", paridade: "src/core/boot-order.ts" }, existe), false);
    assert.equal(podeSair({ velho: "a", substituto: "src/core/boot-order.ts", paridade: "src/nao" }, existe), false);
    for (const caminho of SAIDAS) {
      assert.equal(podeSair(caminho, existe), true, caminho.velho);
      assert.equal(existe(caminho.velho), false, caminho.velho);
      assert.equal(existe(caminho.substituto), true, caminho.substituto);
      assert.equal(existe(caminho.paridade), true, caminho.paridade);
    }
    for (const caminho of FICA) {
      assert.equal(podeSair(caminho, existe), false, caminho.velho);
      assert.equal(existe(caminho.velho), true, caminho.velho);
    }
    const boot = readFileSync("src/bootstrap.ts", "utf8");
    assert.equal(boot.includes("ESPELHO_ACTIVO"), false);
    assert.match(boot, /ordemDeBoot\(/);
  });
});
