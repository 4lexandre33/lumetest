import { hashString } from "./cache.ts";
import { lerManuscrito, type EstadoNarrativo } from "../../manuscript/index.ts";

/** Versão do contrato. A IR não é mutação nem gaveta. */
export const IR_VERSION = { major: 3, minor: 0, label: "3.0" } as const;

export type IrOperation =
  | "represent"
  | "describe"
  | "enunciate"
  | "expose"
  | "evaluate"
  | "interiorize"
  | "structure"
  | "focalize";

export type IrEvidencia = { start: number; end: number; text: string };

export type IrCampo = {
  valor: string;
  status: EstadoNarrativo;
  evidencia: IrEvidencia;
  confidence: number | null;
};

export type IrReferencia = {
  token: string;
  alvo: string;
  status: EstadoNarrativo;
  evidencia: IrEvidencia;
  confidence: number | null;
};

export type NarrativeAct = {
  id: string;
  sentenceId: string;
  version: typeof IR_VERSION.label;
  operation: IrOperation;
  text: string;
  span: { start: number; end: number };
  predicado: IrCampo | null;
  papeis: { papel: string; quem: string; evidencia: IrEvidencia }[];
  entidade: IrCampo | null;
  referencia: IrReferencia | null;
  tempo: { valor: string; evidencia: IrEvidencia } | null;
  aspecto: IrCampo | null;
  modalidade: { valor: string; evidencia: IrEvidencia } | null;
  negacao: IrCampo | null;
  voz: { valor: "direta" | "indireta"; evidencia: IrEvidencia } | null;
  focalizacao: IrCampo | null;
  discurso: IrCampo | null;
  proposicao: IrCampo | null;
  evidencia: IrEvidencia | null;
  provenance: { source: string; revision: number };
  confidence: number | null;
};

export type NarrativeIr = {
  version: typeof IR_VERSION.label;
  major: number;
  minor: number;
  prose: string;
  acts: NarrativeAct[];
};

const PREFIXO = /^(voz|tempo|modalidade|papel|predicado|entidade|referencia|aspecto|negacao|focalizacao|discurso|proposicao|confianca|resolvido|inferido|derivado|desconhecido):/iu;

function hasWord(text: string, words: readonly string[]): boolean {
  return words.some((word) => new RegExp(`(^|[^\\p{L}])${word}([^\\p{L}]|$)`, "iu").test(text));
}

export function operationOf(text: string): Exclude<IrOperation, "structure"> {
  const trimmed = text.trim();
  if (/^[«"—]/.test(trimmed) || /[»"]$/.test(trimmed)) return "enunciate";
  if (hasWord(trimmed, ["pensou", "sentiu", "lembrou", "temia"])) return "interiorize";
  if (hasWord(trimmed, ["viu", "descobriu", "revelou"])) return "expose";
  if (hasWord(trimmed, ["devia", "deveria", "queria"])) return "evaluate";
  if (hasWord(trimmed, ["segundo", "aos olhos"])) return "focalize";
  if (hasWord(trimmed, ["era", "estava", "havia", "parecia"])) return "describe";
  return "represent";
}

function mint(seen: Map<string, number>, key: string): string {
  const base = `acto-${hashString(key).slice(0, 6)}`;
  const n = seen.get(base) ?? 0;
  seen.set(base, n + 1);
  return n === 0 ? base : `${base}-${n + 1}`;
}

function headingSpan(prose: string, start: number): { start: number; end: number } {
  const nl = prose.indexOf("\n", start);
  return { start, end: nl < 0 ? prose.length : nl };
}

type Pendente = {
  voz: NarrativeAct["voz"];
  tempo: NarrativeAct["tempo"];
  modalidade: NarrativeAct["modalidade"];
  papeis: NarrativeAct["papeis"];
  predicado: IrCampo | null;
  entidade: IrCampo | null;
  referencia: IrReferencia | null;
  aspecto: IrCampo | null;
  negacao: IrCampo | null;
  focalizacao: IrCampo | null;
  discurso: IrCampo | null;
  proposicao: IrCampo | null;
  confidence: number | null;
};

function pendenteVazio(): Pendente {
  return {
    voz: null,
    tempo: null,
    modalidade: null,
    papeis: [],
    predicado: null,
    entidade: null,
    referencia: null,
    aspecto: null,
    negacao: null,
    focalizacao: null,
    discurso: null,
    proposicao: null,
    confidence: null,
  };
}

function evidenciaDe(prose: string, start: number, end: number): IrEvidencia {
  return { start, end, text: prose.slice(start, end) };
}

function campo(valor: string, status: EstadoNarrativo, evidencia: IrEvidencia, confidence: number | null): IrCampo {
  return { valor, status, evidencia, confidence };
}

function vozDoTexto(prose: string, text: string, at: number): NarrativeAct["voz"] {
  const fala = /«[^»]*»|“[^”]*”|"[^"]*"/.exec(text);
  if (fala && fala.index != null) {
    const start = at + fala.index;
    return { valor: "direta", evidencia: evidenciaDe(prose, start, start + fala[0].length) };
  }
  if (/^[—–]/.test(text)) return { valor: "direta", evidencia: evidenciaDe(prose, at, at + text.length) };
  const indireto = /disse que|perguntou se|contou que/iu.exec(text);
  if (indireto && indireto.index != null) {
    const start = at + indireto.index;
    return { valor: "indireta", evidencia: evidenciaDe(prose, start, start + indireto[0].length) };
  }
  return null;
}

function estadoDaMarca(marca: string): EstadoNarrativo {
  const key = marca.toLowerCase();
  if (key === "resolvido") return "RESOLVED";
  if (key === "inferido") return "INFERRED";
  if (key === "derivado") return "DERIVED";
  if (key === "desconhecido") return "UNKNOWN";
  return "DECLARED";
}

function referenciaDe(corpo: string, status: EstadoNarrativo, evidencia: IrEvidencia): IrReferencia | null {
  const cheio = /^(\S+)\s*=\s*(\S+)(?:\s+evidencia\s+(\S+))?(?:\s+confianca\s+([0-9]+(?:[.,][0-9]+)?))?\s*$/iu.exec(corpo);
  if (cheio?.[1] && cheio[2]) {
    return {
      token: cheio[1],
      alvo: cheio[2],
      status,
      evidencia: cheio[3] ? { ...evidencia, text: cheio[3] } : evidencia,
      confidence: cheio[4] ? Number(cheio[4].replace(",", ".")) : null,
    };
  }
  if (status === "UNKNOWN" && corpo.trim()) {
    return { token: corpo.trim(), alvo: "", status, evidencia, confidence: null };
  }
  return null;
}

function declaracaoDe(prose: string, text: string, at: number, pendente: Pendente): boolean {
  const evidencia = evidenciaDe(prose, at, at + text.length);
  const voz = /^voz:\s*(direta|direto|indireta|indireto)\s*$/iu.exec(text);
  if (voz) {
    pendente.voz = { valor: /^indire/iu.test(voz[1]!) ? "indireta" : "direta", evidencia };
    return true;
  }
  const tempo = /^tempo:\s*(\S+)\s*$/iu.exec(text);
  if (tempo) {
    pendente.tempo = { valor: tempo[1]!, evidencia };
    return true;
  }
  const modalidade = /^modalidade:\s*(\S+)\s*$/iu.exec(text);
  if (modalidade) {
    pendente.modalidade = { valor: modalidade[1]!, evidencia };
    return true;
  }
  const papel = /^papel:\s*([^=\s]+)=(.+)\s*$/iu.exec(text);
  if (papel) {
    pendente.papeis.push({ papel: papel[1]!, quem: papel[2]!.trim(), evidencia });
    return true;
  }
  const simples = /^(predicado|entidade|aspecto|negacao|focalizacao|discurso|proposicao):\s*(\S(?:.*\S)?)\s*$/iu.exec(text);
  if (simples?.[1] && simples[2]) {
    const chave = simples[1].toLowerCase();
    const valor = campo(simples[2], "DECLARED", evidencia, null);
    if (chave === "predicado") pendente.predicado = valor;
    else if (chave === "entidade") pendente.entidade = valor;
    else if (chave === "aspecto") pendente.aspecto = valor;
    else if (chave === "negacao") pendente.negacao = valor;
    else if (chave === "focalizacao") pendente.focalizacao = valor;
    else if (chave === "discurso") pendente.discurso = valor;
    else pendente.proposicao = valor;
    return true;
  }
  const confianca = /^confianca:\s*([0-9]+(?:[.,][0-9]+)?)\s*$/iu.exec(text);
  if (confianca?.[1]) {
    pendente.confidence = Number(confianca[1].replace(",", "."));
    return true;
  }
  const ref = /^(referencia|resolvido|inferido|derivado|desconhecido):\s*(\S(?:.*\S)?)\s*$/iu.exec(text);
  if (ref?.[1] && ref[2]) {
    const lida = referenciaDe(ref[2], estadoDaMarca(ref[1]), evidencia);
    if (lida) {
      pendente.referencia = lida;
      if (lida.confidence != null) pendente.confidence = lida.confidence;
    }
    return true;
  }
  return false;
}

function marcasNoTexto(prose: string, text: string, at: number, pendente: Pendente): void {
  for (const mark of text.matchAll(/\[(voz|tempo|modalidade|papel|predicado|entidade|aspecto|negacao|focalizacao|discurso|proposicao):([^\]]+)\]/giu)) {
    const start = at + (mark.index ?? 0);
    const evidencia = evidenciaDe(prose, start, start + mark[0].length);
    const chave = mark[1]!.toLowerCase();
    const valor = mark[2]!.trim();
    if (chave === "voz" && /^(direta|direto|indireta|indireto)$/iu.test(valor)) {
      pendente.voz = { valor: /^indire/iu.test(valor) ? "indireta" : "direta", evidencia };
    } else if (chave === "tempo" && valor) pendente.tempo = { valor, evidencia };
    else if (chave === "modalidade" && valor) pendente.modalidade = { valor, evidencia };
    else if (chave === "papel") {
      const papel = /^([^=\s]+)=(.+)$/u.exec(valor);
      if (papel) pendente.papeis.push({ papel: papel[1]!, quem: papel[2]!.trim(), evidencia });
    } else if (valor) {
      const item = campo(valor, "DECLARED", evidencia, null);
      if (chave === "predicado") pendente.predicado = item;
      else if (chave === "entidade") pendente.entidade = item;
      else if (chave === "aspecto") pendente.aspecto = item;
      else if (chave === "negacao") pendente.negacao = item;
      else if (chave === "focalizacao") pendente.focalizacao = item;
      else if (chave === "discurso") pendente.discurso = item;
      else if (chave === "proposicao") pendente.proposicao = item;
    }
  }
}

function copiar(pendente: Pendente): Pendente {
  return { ...pendente, papeis: [...pendente.papeis] };
}

function limpar(pendente: Pendente): void {
  const vazio = pendenteVazio();
  Object.assign(pendente, vazio);
  pendente.papeis = [];
}

export function lerIr(prose: string): NarrativeIr {
  const manuscript = lerManuscrito(prose);
  const seen = new Map<string, number>();
  const acts: NarrativeAct[] = [];
  const pendente = pendenteVazio();
  const push = (operation: IrOperation, span: { start: number; end: number }, key: string, campos: Pendente, sentenceId: string) => {
    const text = prose.slice(span.start, span.end);
    if (!text.trim()) return;
    const evidencia = campos.voz?.evidencia ?? campos.tempo?.evidencia ?? campos.modalidade?.evidencia ?? campos.papeis[0]?.evidencia ?? campos.predicado?.evidencia ?? campos.referencia?.evidencia ?? null;
    const proposicao = operation === "structure"
      ? campos.proposicao
      : campos.proposicao ?? campo(text, "DECLARED", { start: span.start, end: span.end, text }, null);
    acts.push({
      id: mint(seen, `${operation}\0${key}`),
      sentenceId,
      version: IR_VERSION.label,
      operation,
      text,
      span,
      predicado: campos.predicado,
      papeis: campos.papeis,
      entidade: campos.entidade,
      referencia: campos.referencia,
      tempo: campos.tempo,
      aspecto: campos.aspecto,
      modalidade: campos.modalidade,
      negacao: campos.negacao,
      voz: campos.voz,
      focalizacao: campos.focalizacao,
      discurso: campos.discurso,
      proposicao,
      evidencia,
      provenance: { source: sentenceId ? `sentence:${sentenceId}` : `span:${span.start}`, revision: 1 },
      confidence: campos.confidence,
    });
  };
  const frases: { id: string; text: string; start: number; end: number }[] = [];
  for (const book of manuscript.books) {
    if (book.title) push("structure", headingSpan(prose, book.start), `livro\0${book.title}`, pendenteVazio(), "");
    for (const chapter of book.chapters) {
      if (chapter.title) push("structure", headingSpan(prose, chapter.start), `capitulo\0${chapter.title}`, pendenteVazio(), "");
      for (const scene of chapter.scenes) {
        if (scene.title && scene.start !== chapter.start) push("structure", headingSpan(prose, scene.start), `cena\0${scene.title}`, pendenteVazio(), "");
        for (const paragraph of scene.paragraphs) {
          for (const sentence of paragraph.sentences) frases.push(sentence);
        }
      }
    }
  }
  const partes = prose.split("\n");
  let cursor = 0;
  for (let i = 0; i < partes.length; i++) {
    const raw = partes[i] ?? "";
    const text = raw.trim();
    const start = cursor;
    const end = cursor + raw.length;
    cursor += raw.length + (i < partes.length - 1 ? 1 : 0);
    if (!text || /^#{1,6}\s/.test(text) || /^(caderno|autora|autor|data|dedicatoria)\s*:/i.test(text)) continue;
    if (PREFIXO.test(text)) {
      declaracaoDe(prose, text, start + raw.indexOf(text.trim()), pendente);
      continue;
    }
    const daLinha = frases.filter((frase) => frase.start >= start && frase.start <= end);
    if (!daLinha.length) {
      const local = copiar(pendente);
      const at = start + Math.max(0, raw.indexOf(text));
      push(operationOf(text), { start: at, end: at + text.length }, text, local, `linha-${hashString(`${at}\0${text}`).slice(0, 6)}`);
      limpar(pendente);
      continue;
    }
    for (let n = 0; n < daLinha.length; n++) {
      const sentence = daLinha[n]!;
      const local = n === 0 ? copiar(pendente) : pendenteVazio();
      marcasNoTexto(prose, sentence.text, sentence.start, local);
      if (!local.voz) local.voz = vozDoTexto(prose, sentence.text, sentence.start);
      push(operationOf(sentence.text), { start: sentence.start, end: sentence.end }, sentence.text, local, sentence.id);
      if (n === 0) limpar(pendente);
    }
  }
  acts.sort((a, b) => a.span.start - b.span.start || a.span.end - b.span.end);
  return { version: IR_VERSION.label, major: IR_VERSION.major, minor: IR_VERSION.minor, prose, acts };
}

export function mapaDaIr(ir: NarrativeIr) {
  const byId = new Map(ir.acts.map((act) => [act.id, act]));
  return {
    actToSource(id: string): { start: number; end: number; text: string } | null {
      const act = byId.get(id);
      if (!act) return null;
      return { start: act.span.start, end: act.span.end, text: ir.prose.slice(act.span.start, act.span.end) };
    },
    sourceToActs(offset: number): NarrativeAct[] {
      return ir.acts.filter((act) => offset >= act.span.start && offset < act.span.end);
    },
  };
}
