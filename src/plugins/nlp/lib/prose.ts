import { modeloPequeno } from "./model-provider.ts";

type Acto = { operation: string; text: string };
type Ir = { prose: string; version: string; acts: Acto[] };

let ler: ((prose: string) => Ir) | null = null;

export function ligarIr(next: ((prose: string) => Ir) | null): void {
  ler = next;
}

/** NLP da prosa. Chega à IR pela capability, não pelo import. O modelo, se existir, só sugere o acto. */
export function nlpProsa(prose: string): Ir {
  if (!ler) throw new Error("ir sem porta");
  const ir = ler(prose);
  const model = modeloPequeno();
  if (!model) return { ...ir, prose };
  return {
    ...ir,
    prose,
    acts: ir.acts.map((act) => {
      if (act.operation === "structure") return act;
      const next = model.act(act.text);
      if (!next || next === "structure") return act;
      return { ...act, operation: next };
    }),
  };
}
