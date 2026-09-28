import type { WorldModel } from "../../narrative-engine/types.ts";
import { interpret } from "./nlp.ts";
import type { NlpHit, NlpScope } from "../types.ts";

/** NLP rápido. Só comandos. Não chama o modelo. */
export function nlpComando(text: string, world: WorldModel, scope?: NlpScope): NlpHit | null {
  return interpret(text, world, scope);
}
