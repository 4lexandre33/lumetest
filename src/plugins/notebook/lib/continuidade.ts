export type EstadoFio = "aberto" | "prometido" | "pago" | "cortado";

export type Arco = { nome: string; linha: number };
export type Fio = { nome: string; estado: EstadoFio; linha: number };
export type Aviso = { id: string; texto: string; linha: number };

/** Avisos não reprovam o texto. «Fica assim» tira o aviso da lista e fica gravado. */
export type Continuidade = {
  arcos: Arco[];
  fios: Fio[];
  avisos: Aviso[];
  calados: string[];
};

const ESTADOS = new Set<EstadoFio>(["aberto", "prometido", "pago", "cortado"]);

function linhaDe(texto: string, index: number): number {
  let linha = 1;
  for (let i = 0; i < index && i < texto.length; i++) if (texto[i] === "\n") linha += 1;
  return linha;
}

export function lerContinuidade(texto: string): Continuidade {
  const arcos: Arco[] = [];
  const fios: Fio[] = [];
  const avisos: Aviso[] = [];
  const calados: string[] = [];
  const abriu = new Set<string>();
  const avisou = new Set<string>();
  let at = 0;
  for (const line of texto.split("\n")) {
    const linha = linhaDe(texto, at);
    at += line.length + 1;
    const trimmed = line.trim();
    const arco = /^arco:\s*(\S(?:.*\S)?)\s*$/i.exec(trimmed);
    if (arco?.[1]) {
      arcos.push({ nome: arco[1], linha });
      continue;
    }
    const fica = /^fica assim:\s*(\S(?:.*\S)?)\s*$/i.exec(trimmed);
    if (fica?.[1]) {
      calados.push(fica[1]);
      continue;
    }
    const fio = /^fio:\s*(.+)\s+(aberto|prometido|pago|cortado|[\p{L}\p{N}_]+)\s*$/iu.exec(trimmed);
    if (!fio?.[1] || !fio[2]) continue;
    const nome = fio[1].trim();
    const bruto = fio[2].toLowerCase();
    if (!ESTADOS.has(bruto as EstadoFio)) {
      const id = `fio:${nome}:estado`;
      if (!avisou.has(id)) {
        avisou.add(id);
        avisos.push({ id, texto: `${nome} não tem estado reconhecido`, linha });
      }
      continue;
    }
    const estado = bruto as EstadoFio;
    fios.push({ nome, estado, linha });
    if (estado === "aberto" || estado === "prometido") abriu.add(nome);
    if ((estado === "pago" || estado === "cortado") && !abriu.has(nome)) {
      const id = `fio:${nome}:sem-abertura`;
      if (!avisou.has(id)) {
        avisou.add(id);
        avisos.push({ id, texto: `${nome} ${estado} sem abertura`, linha });
      }
    }
  }
  const quietos = new Set(calados);
  return { arcos, fios, avisos: avisos.filter((aviso) => !quietos.has(aviso.id)), calados };
}
