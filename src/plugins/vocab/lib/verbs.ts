/** Verb keys and intent paths. Notebook imports this file, not nlp. */

export type VerbArity = 0 | 1 | 2 | "opt";

export type VerbDef = {
  keys: string[];
  path: string;
  arity: VerbArity;
};

function foldKey(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export const VERB_DEFS: VerbDef[] = [
  { keys: ["take", "get", "grab", "pick", "pegar", "pega", "pegue", "apanhar", "apanha", "segurar", "segura", "recolhe"], path: "action.interact.take", arity: 1 },
  { keys: ["drop", "largar", "larga", "soltar", "solta", "deita"], path: "action.interact.drop", arity: 1 },
  { keys: ["put", "insert", "guardar", "guarda", "por", "poe", "mete", "coloca", "meter"], path: "action.interact.put", arity: 2 },
  { keys: ["give", "offer", "dar", "da", "oferece", "entrega"], path: "action.interact.give", arity: 2 },
  { keys: ["open", "abrir", "abre"], path: "action.interact.open", arity: 1 },
  { keys: ["close", "shut", "fechar", "fecha"], path: "action.interact.close", arity: 1 },
  { keys: ["lock", "trancar", "tranca"], path: "action.interact.lock", arity: 1 },
  { keys: ["unlock", "destrancar", "destranca"], path: "action.interact.unlock", arity: 1 },
  { keys: ["use", "usar", "usa"], path: "action.interact.use", arity: 1 },
  { keys: ["attack", "hit", "fight", "smash", "kill", "atacar", "ataca", "bater", "bate", "matar", "mata", "golpeia"], path: "action.interact.attack", arity: 1 },
  { keys: ["talk", "speak", "greet", "hello", "falar", "fala", "conversar", "conversa", "oi", "ola"], path: "action.interact.talk", arity: 1 },
  { keys: ["ask", "perguntar", "pergunta", "questiona"], path: "action.interact.ask", arity: 2 },
  { keys: ["tell", "inform", "contar", "conta", "diz", "dizer"], path: "action.interact.tell", arity: 2 },
  { keys: ["bye", "goodbye", "adeus", "tchau"], path: "action.interact.bye", arity: 1 },
  { keys: ["go", "walk", "enter", "climb", "run", "ir", "vai", "move", "mover", "mova", "entra", "anda"], path: "action.go", arity: 1 },
  { keys: ["look", "l", "olhar", "olha"], path: "action.look", arity: 0 },
  { keys: ["inventory", "i", "inv", "inventario"], path: "action.inventory", arity: 0 },
  { keys: ["wait", "z", "esperar", "espera", "aguarda", "aguardar"], path: "action.wait", arity: 0 },
  { keys: ["communicate", "comunicar", "comunica"], path: "action.communicate", arity: 1 },
  { keys: ["observe", "observar", "observa"], path: "perceive.observe", arity: "opt" },
  { keys: ["inspect", "examine", "x", "check", "read", "inspecionar", "inspeciona", "examina", "examinar", "ler"], path: "perceive.inspect", arity: 1 },
  { keys: ["listen", "escutar", "escuta", "ouve", "ouvir"], path: "perceive.listen", arity: "opt" },
  { keys: ["locate", "find", "encontrar", "encontra"], path: "perceive.locate", arity: 1 },
  { keys: ["remember", "recall", "lembrar", "lembra"], path: "cognize.remember", arity: 1 },
];

function leafOfPath(path: string): string {
  const parts = path.split(".");
  return parts[parts.length - 1] ?? path;
}

const LEAVES = new Map<string, string>();
for (const def of VERB_DEFS) {
  const leaf = leafOfPath(def.path);
  for (const key of def.keys) LEAVES.set(foldKey(key), leaf);
}

export function intentLeaf(verb: string): string | null {
  return LEAVES.get(foldKey(verb)) ?? null;
}

export function pathOfLeaf(verb: string): string | null {
  const folded = foldKey(verb);
  if (!folded) return null;
  for (const def of VERB_DEFS) {
    if (leafOfPath(def.path) === folded) return def.path;
    if (def.keys.some((key) => foldKey(key) === folded)) return def.path;
  }
  return null;
}

export function arityOf(path: string): VerbArity {
  for (const def of VERB_DEFS) if (def.path === path) return def.arity;
  return 1;
}
