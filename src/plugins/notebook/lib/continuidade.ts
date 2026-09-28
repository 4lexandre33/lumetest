import { lerManuscrito } from "../../manuscript/index.ts";

export type EstadoFio = "aberto" | "prometido" | "pago" | "cortado";

export type Arco = { nome: string; linha: number; cena: { id: string; title: string } | null };
export type Fio = { nome: string; estado: EstadoFio; linha: number };
export type Marco = { nome: string; linha: number };
export type Aviso = { id: string; texto: string; linha: number };

/** Avisos não reprovam o texto. «Fica assim» tira o aviso da lista e fica gravado. */
export type Continuidade = {
  arcos: Arco[];
  fios: Fio[];
  setups: Marco[];
  payoffs: Marco[];
  restricoes: Marco[];
  avisos: Aviso[];
  calados: string[];
  texto: string;
};

const ESTADOS = new Set<EstadoFio>(["aberto", "prometido", "pago", "cortado"]);

function linhaDe(texto: string, index: number): number {
  let linha = 1;
  for (let i = 0; i < index && i < texto.length; i++) if (texto[i] === "\n") linha += 1;
  return linha;
}

function cenaDe(texto: string, index: number): { id: string; title: string } | null {
  for (const book of lerManuscrito(texto).books) {
    for (const chapter of book.chapters) {
      for (const scene of chapter.scenes) {
        if (index >= scene.start && index < scene.end) return { id: scene.id, title: scene.title };
      }
    }
  }
  return null;
}

export function lerContinuidade(texto: string): Continuidade {
  const arcos: Arco[] = [];
  const fios: Fio[] = [];
  const setups: Marco[] = [];
  const payoffs: Marco[] = [];
  const restricoes: Marco[] = [];
  const avisos: Aviso[] = [];
  const calados: string[] = [];
  const abriu = new Set<string>();
  const avisou = new Set<string>();
  const armou = new Set<string>();
  const pagou = new Set<string>();
  const limites = new Set<string>();
  const avisar = (id: string, textoAviso: string, linha: number) => {
    if (avisou.has(id)) return;
    avisou.add(id);
    avisos.push({ id, texto: textoAviso, linha });
  };
  let at = 0;
  for (const line of texto.split("\n")) {
    const linha = linhaDe(texto, at);
    const cena = cenaDe(texto, at);
    at += line.length + 1;
    const trimmed = line.trim();
    const arco = /^arco:\s*(\S(?:.*\S)?)\s*$/i.exec(trimmed);
    if (arco?.[1]) {
      arcos.push({ nome: arco[1], linha, cena });
      continue;
    }
    const fica = /^fica assim:\s*(\S(?:.*\S)?)\s*$/i.exec(trimmed);
    if (fica?.[1]) {
      calados.push(fica[1]);
      continue;
    }
    const fio = /^fio:\s*(.+)\s+(aberto|prometido|pago|cortado|[\p{L}\p{N}_]+)\s*$/iu.exec(trimmed);
    if (fio?.[1] && fio[2]) {
      const nome = fio[1].trim();
      const bruto = fio[2].toLowerCase();
      if (!ESTADOS.has(bruto as EstadoFio)) {
        avisar(`fio:${nome}:estado`, `${nome} não tem estado reconhecido`, linha);
        continue;
      }
      const estado = bruto as EstadoFio;
      fios.push({ nome, estado, linha });
      if (estado === "aberto" || estado === "prometido") abriu.add(nome);
      if ((estado === "pago" || estado === "cortado") && !abriu.has(nome)) {
        avisar(`fio:${nome}:sem-abertura`, `${nome} ${estado} sem abertura`, linha);
      }
      continue;
    }
    const setup = /^setup:\s*(\S(?:.*\S)?)\s*$/i.exec(trimmed);
    if (setup?.[1]) {
      setups.push({ nome: setup[1], linha });
      armou.add(setup[1]);
      continue;
    }
    const payoff = /^payoff:\s*(\S(?:.*\S)?)\s*$/i.exec(trimmed);
    if (payoff?.[1]) {
      payoffs.push({ nome: payoff[1], linha });
      if (!armou.has(payoff[1])) avisar(`payoff:${payoff[1]}:sem-setup`, `${payoff[1]} sem setup`, linha);
      else pagou.add(payoff[1]);
      continue;
    }
    const restricao = /^restricao:\s*(\S(?:.*\S)?)\s*$/i.exec(trimmed);
    if (restricao?.[1]) {
      restricoes.push({ nome: restricao[1], linha });
      limites.add(restricao[1]);
      continue;
    }
    const quebra = /^quebra:\s*(\S(?:.*\S)?)\s*$/i.exec(trimmed);
    if (quebra?.[1]) {
      if (!limites.has(quebra[1])) avisar(`quebra:${quebra[1]}:sem-restricao`, `${quebra[1]} sem restrição`, linha);
      else avisar(`restricao:${quebra[1]}:quebra`, `${quebra[1]} quebrada`, linha);
    }
  }
  for (const marco of setups) {
    if (!pagou.has(marco.nome)) avisar(`setup:${marco.nome}:sem-payoff`, `${marco.nome} sem payoff`, marco.linha);
  }
  const quietos = new Set(calados);
  return { arcos, fios, setups, payoffs, restricoes, avisos: avisos.filter((aviso) => !quietos.has(aviso.id)), calados, texto };
}
