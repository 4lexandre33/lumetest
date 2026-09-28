export type LeituraFrase = {
  historia: string;
  contexto: { text: string; cena: { texto: string } } | null;
  proposta: { desceu: boolean; contexto: string };
  manuscrito: { prose: string; books: { title: string; chapters: { title: string; scenes: { title: string }[] }[] }[] };
  diagnostico: { notas: { codigo: string; texto: string; cena: string }[] };
};

/** A superfície pede a autoria. Não junta as leituras. */
export function lerFrase(prosa: string, offset: number, entities = ""): LeituraFrase | null {
  const core = (globalThis as { __LUME_CORE__?: { getService: (name: string) => { abrir: (prosa: string, offset: number, entities: string) => LeituraFrase } } }).__LUME_CORE__;
  if (!core) return null;
  return core.getService("AuthoringRuntime").abrir(prosa, offset, entities);
}
