import { lerIr, type NarrativeIr } from "../../notebook/index.ts";
import { modeloPequeno } from "./model-provider.ts";

/** NLP da prosa. Chega à IR. O modelo, se existir, só sugere o acto. */
export function nlpProsa(prose: string): NarrativeIr {
  const ir = lerIr(prose);
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
