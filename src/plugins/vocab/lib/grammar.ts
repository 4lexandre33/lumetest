/** Standard grammar lines. Compound verbs first. Tecto 8 tokens (W032). */

import type { GrammarLine } from "../types.ts";
import { PT } from "./tokens.ts";
import { VERB_DEFS } from "./verbs.ts";

export const MAX_LINE_TOKENS = 8;

export type VocabWarning = {
  code: "W032";
  message: string;
};

function foldWord(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export const STANDARD_LINES: GrammarLine[] = [
  { verb: "pegar", tokens: [PT.algo], path: "action.interact.take" },
  { verb: "largar", tokens: [PT.held], path: "action.interact.drop" },
  { verb: "meter", tokens: [PT.held, "em", PT.algo], path: "action.interact.put" },
  { verb: "meter", tokens: [PT.held, PT.algo], path: "action.interact.put" },
  { verb: "dar", tokens: [PT.held, "a", PT.alguem], path: "action.interact.give" },
  { verb: "dar", tokens: [PT.held, PT.alguem], path: "action.interact.give" },
  { verb: "abrir", tokens: [PT.algo], path: "action.interact.open" },
  { verb: "fechar", tokens: [PT.algo], path: "action.interact.close" },
  { verb: "trancar", tokens: [PT.algo], path: "action.interact.lock" },
  { verb: "destrancar", tokens: [PT.algo], path: "action.interact.unlock" },
  { verb: "usar", tokens: [PT.algo], path: "action.interact.use" },
  { verb: "atacar", tokens: [PT.alguem], path: "action.interact.attack" },
  { verb: "falar", tokens: ["com", PT.alguem], path: "action.interact.talk" },
  { verb: "falar", tokens: [PT.alguem], path: "action.interact.talk" },
  { verb: "perguntar", tokens: [PT.alguem, PT.algo], path: "action.interact.ask" },
  { verb: "contar", tokens: [PT.alguem, PT.algo], path: "action.interact.tell" },
  { verb: "despedir", tokens: [PT.alguem], path: "action.interact.bye" },
  { verb: "ir", tokens: [PT.sitio], path: "action.go" },
  { verb: "olhar", tokens: [], path: "action.look" },
  { verb: "inventario", tokens: [], path: "action.inventory" },
  { verb: "esperar", tokens: [], path: "action.wait" },
  { verb: "comunicar", tokens: [PT.alguem], path: "action.communicate" },
  { verb: "observar", tokens: [PT.algo], path: "perceive.observe" },
  { verb: "observar", tokens: [], path: "perceive.observe" },
  { verb: "examinar", tokens: [PT.algo], path: "perceive.inspect" },
  { verb: "ouvir", tokens: [PT.algo], path: "perceive.listen" },
  { verb: "ouvir", tokens: [], path: "perceive.listen" },
  { verb: "encontrar", tokens: [PT.algo], path: "perceive.locate" },
  { verb: "lembrar", tokens: [PT.algo], path: "cognize.remember" },
];

export function verbPrefixes(line: GrammarLine): string[][] {
  const parts = line.verb.split(/\s+/).map(foldWord).filter(Boolean);
  if (parts.length > 1) return [parts];
  const keys = new Set<string>();
  if (parts[0]) keys.add(parts[0]);
  for (const def of VERB_DEFS) {
    if (def.path !== line.path) continue;
    for (const key of def.keys) {
      const word = foldWord(key);
      if (word && !/\s/.test(word)) keys.add(word);
    }
  }
  return [...keys]
    .sort((a, b) => b.length - a.length)
    .map((word) => [word]);
}

export function lineWarning(line: GrammarLine): VocabWarning | null {
  if (line.tokens.length <= MAX_LINE_TOKENS) return null;
  return {
    code: "W032",
    message: `Linha de gramática com mais de ${MAX_LINE_TOKENS} tokens ignorada (${line.verb}).`,
  };
}
