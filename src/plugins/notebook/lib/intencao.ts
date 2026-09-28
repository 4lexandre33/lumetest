import { lerManuscrito } from "../../manuscript/index.ts";
import { lerIr, type IrOperation } from "./narrative-ir.ts";

export type IntencaoAutoral = {
  cena: { id: string; title: string };
  devia: IrOperation[];
  mostra: IrOperation[];
  cumpre: IrOperation[];
  falta: IrOperation[];
  evidencia: string[];
};

const NOMES: Record<string, IrOperation> = {
  representar: "represent",
  descrever: "describe",
  enunciar: "enunciate",
  revelar: "expose",
  avaliar: "evaluate",
  interiorizar: "interiorize",
  focalizar: "focalize",
};

const MARCA = /^intencao:\s*(\S+)\s*$/i;

function unicos(ops: IrOperation[]): IrOperation[] {
  const out: IrOperation[] = [];
  for (const op of ops) if (!out.includes(op)) out.push(op);
  return out;
}

/** O que a cena devia fazer, declarado. Compara com a IR. Não executa verbo. */
export function intencoesDe(prosa: string): IntencaoAutoral[] {
  const ir = lerIr(prosa);
  const out: IntencaoAutoral[] = [];
  for (const book of lerManuscrito(prosa).books) {
    for (const chapter of book.chapters) {
      for (const scene of chapter.scenes) {
        const devia: IrOperation[] = [];
        const evidencia: string[] = [];
        for (const line of prosa.slice(scene.start, scene.end).split("\n")) {
          const marca = MARCA.exec(line.trim());
          const op = marca?.[1] ? NOMES[marca[1].toLowerCase()] : undefined;
          if (!op) continue;
          devia.push(op);
          evidencia.push(line.trim());
        }
        if (!devia.length) continue;
        const mostra = unicos(
          ir.acts
            .filter((act) => act.operation !== "structure" && act.span.start >= scene.start && act.span.end <= scene.end && !MARCA.test(act.text.trim()))
            .map((act) => act.operation),
        );
        const pedido = unicos(devia);
        out.push({
          cena: { id: scene.id, title: scene.title },
          devia: pedido,
          mostra,
          cumpre: pedido.filter((op) => mostra.includes(op)),
          falta: pedido.filter((op) => !mostra.includes(op)),
          evidencia,
        });
      }
    }
  }
  return out;
}
