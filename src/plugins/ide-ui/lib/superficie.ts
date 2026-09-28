/** A porta é esta lista. Play não entra. O técnico só depois de se pedir. */
export const SALAS = ["escrever", "pessoas", "cenas", "cronologia", "universo", "revisao", "assistente"] as const;

export type Superficie = (typeof SALAS)[number] | "tecnico";

export const ROTULO: Record<Superficie, string> = {
  escrever: "Escrever",
  pessoas: "Pessoas",
  cenas: "Cenas",
  cronologia: "Cronologia",
  universo: "Universo",
  revisao: "Revisão",
  assistente: "Assistente",
  tecnico: "Técnico",
};

export function salasVisiveis(tecnicoPedido: boolean): Superficie[] {
  return tecnicoPedido ? [...SALAS, "tecnico"] : [...SALAS];
}
