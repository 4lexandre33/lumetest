/** Vê a frase, não o livro. Não aplica mutação. */
export type AiProvider = {
  id: string;
  propor(frase: { text: string; cena: string }): string | null;
};

export type AiPolicy = {
  allow(proposta: string): boolean;
};

export type Mundo = Map<string, any>;

export type DecisaoMutacao = {
  ok: boolean;
  error?: string;
  world: Mundo;
  prose: string;
};

export type AiProposta = {
  contexto: string;
  doLine: string | null;
  desceu: boolean;
  decision: DecisaoMutacao | null;
};

export type PortasAi = {
  daFrase: (prosa: string, offset: number, entities: string) => { text: string; cena: { title: string } } | null;
  descer: (origem: "modelo", doLine: string, world: Mundo, prose: string) => DecisaoMutacao;
};

let provider: AiProvider | null = null;
let politica: AiPolicy = { allow: () => true };
let portas: PortasAi | null = null;

export function ligarAi(next: PortasAi | null): void {
  portas = next;
}

export function definirProvider(next: AiProvider | null): void {
  provider = next;
}

export function definirPoliticaIa(next: AiPolicy | null): void {
  politica = next ?? { allow: () => true };
}

/** A resposta desce à mesma gateway que um comando. Origem `modelo`. */
export function propor(prosa: string, offset: number, entities: string, world: Mundo): AiProposta {
  const ctx = portas?.daFrase(prosa, offset, entities) ?? null;
  const vazio: AiProposta = { contexto: "", doLine: null, desceu: false, decision: null };
  if (!ctx || !provider || !portas) return { ...vazio, contexto: ctx?.text ?? "" };
  const frase = { text: ctx.text, cena: ctx.cena.title };
  const doLine = provider.propor(frase);
  if (!doLine) return { contexto: ctx.text, doLine: null, desceu: false, decision: null };
  if (!politica.allow(doLine)) return { contexto: ctx.text, doLine, desceu: false, decision: null };
  const decision = portas.descer("modelo", doLine, world, prosa);
  return { contexto: ctx.text, doLine, desceu: decision.ok, decision };
}
