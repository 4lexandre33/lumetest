/** A história é a prosa recebida. O caderno não junta estas leituras. */
export type Autoria = {
  manuscrito: { prose: string; books: { chapters: unknown[] }[] };
  ir: { prose: string };
  contexto: { text: string; cena: { texto: string } } | null;
  diagnostico: { notas: unknown[] };
  proposta: { desceu: boolean; contexto: string };
  historia: string;
};

type PortasAutoria = {
  manuscrito: (prosa: string) => Autoria["manuscrito"];
  ir: (prosa: string) => Autoria["ir"];
  contexto: (prosa: string, offset: number, entities: string) => Autoria["contexto"];
  diagnostico: (prosa: string, entities: string) => Autoria["diagnostico"];
  propor: (prosa: string, offset: number, entities: string, world: Map<string, any>) => Autoria["proposta"];
  mundo: (entities: string) => Map<string, any>;
};

let portas: PortasAutoria | null = null;

export function ligarAutoria(next: PortasAutoria | null): void {
  portas = next;
}

export function abrirAutoria(prosa: string, offset: number, entities = ""): Autoria {
  if (!portas) throw new Error("autoria sem portas");
  let world = new Map<string, any>();
  try {
    world = portas.mundo(entities);
  } catch {
    world = new Map();
  }
  return {
    manuscrito: portas.manuscrito(prosa),
    ir: portas.ir(prosa),
    contexto: portas.contexto(prosa, offset, entities),
    diagnostico: portas.diagnostico(prosa, entities),
    proposta: portas.propor(prosa, offset, entities, world),
    historia: prosa,
  };
}
