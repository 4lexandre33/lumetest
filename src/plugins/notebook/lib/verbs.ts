/** Leaf intents from lume-vocab. Notebook does not import nlp. */

export { intentLeaf, pathOfLeaf } from "../../vocab/lib/verbs.ts";

const VERB_LABELS: Record<string, string> = {
  take: "pegar",
  drop: "largar",
  put: "guardar",
  give: "oferecer",
  open: "abrir",
  close: "fechar",
  lock: "trancar",
  unlock: "destrancar",
  use: "usar",
  attack: "atacar",
  talk: "falar",
  ask: "perguntar",
  tell: "contar",
  bye: "despedir-se",
  go: "ir",
  look: "olhar",
  inventory: "inventar",
  wait: "esperar",
  communicate: "comunicar",
  observe: "observar",
  inspect: "examinar",
  listen: "ouvir",
  locate: "encontrar",
  remember: "lembrar",
};

export function verbLabel(leaf: string): string {
  return VERB_LABELS[leaf] ?? leaf;
}
