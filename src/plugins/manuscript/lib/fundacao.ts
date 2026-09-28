import { lerManuscrito } from "./manuscript.ts";

/** Um facto declarado não muda de estado. A inferência fica noutro registo. */
export type EstadoNarrativo = "DECLARED" | "INFERRED" | "RESOLVED" | "DERIVED" | "UNKNOWN";

export type Span = { start: number; end: number };

export type SourceMap = { sentenceId: string; span: Span };

export type Evidencia = { kind: string; text: string };

export type Proveniencia = { source: string; revision: number };

export type Registo = {
  id: string;
  status: EstadoNarrativo;
  confidence: number | null;
  evidence: Evidencia | null;
  provenance: Proveniencia;
  sourceMap: SourceMap;
  value: string;
};

export type Transaccao = { id: string; revision: number; registos: Registo[] };

export type Historia = { revision: number; transaccoes: Transaccao[] };

const MARCA = /^(resolvido|inferido|derivado|desconhecido):\s*(\S(?:.*\S)?)\s*$/i;
const RESOLVIDO = /^(\S+)\s*=\s*(\S+)\s+evidencia\s+(\S+)\s+confianca\s+([0-9]+(?:\.[0-9]+)?)\s*$/i;

function hash(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function estadoDe(marca: string): EstadoNarrativo {
  const key = marca.toLowerCase();
  if (key === "resolvido") return "RESOLVED";
  if (key === "inferido") return "INFERRED";
  if (key === "derivado") return "DERIVED";
  return "UNKNOWN";
}

function registoDe(sentenceId: string, span: Span, status: EstadoNarrativo, value: string, evidence: Evidencia | null, confidence: number | null, revision: number): Registo {
  return {
    id: `reg-${sentenceId}-${status}-${hash(value)}`,
    status,
    confidence,
    evidence,
    provenance: { source: `sentence:${sentenceId}`, revision },
    sourceMap: { sentenceId, span },
    value,
  };
}

/** Lê o manuscrito. Não infere. A frase escrita fica DECLARED. A marca fica no estado que a linha diz. */
export function fundar(prose: string): Historia {
  const registos: Registo[] = [];
  const visto = new Set<string>();
  const linhas = linhasDe(prose);
  let ultima: { id: string; span: Span } | null = null;
  for (const book of lerManuscrito(prose).books) {
    for (const chapter of book.chapters) {
      for (const scene of chapter.scenes) {
        for (const paragraph of scene.paragraphs) {
          for (const sentence of paragraph.sentences) {
            if (linhaEm(linhas, sentence.start)?.marca) continue;
            const span = { start: sentence.start, end: sentence.end };
            const registo = registoDe(sentence.id, span, "DECLARED", sentence.text, { kind: "texto", text: sentence.text }, null, 1);
            if (visto.has(registo.id)) continue;
            visto.add(registo.id);
            registos.push(registo);
            ultima = { id: sentence.id, span };
          }
        }
      }
    }
  }
  for (const linha of linhas) {
    if (!linha.marca) continue;
    const ancora = ultima ?? { id: `marca-${hash(linha.text)}`, span: { start: linha.start, end: linha.end } };
    const status = estadoDe(linha.marca[1]!);
    const corpo = RESOLVIDO.exec(linha.marca[2] ?? "");
    const registo = corpo?.[2] && corpo[3] && corpo[4] && status !== "UNKNOWN"
      ? registoDe(ancora.id, ancora.span, status, corpo[2], { kind: corpo[3], text: corpo[1]! }, Number(corpo[4]), 1)
      : registoDe(ancora.id, ancora.span, status === "UNKNOWN" ? "UNKNOWN" : "DECLARED", linha.text, status === "UNKNOWN" ? null : { kind: "texto", text: linha.text }, null, 1);
    if (visto.has(registo.id)) continue;
    visto.add(registo.id);
    registos.push(registo);
  }
  return { revision: 1, transaccoes: [{ id: "tx-1", revision: 1, registos }] };
}

function linhasDe(prose: string): { text: string; start: number; end: number; marca: RegExpExecArray | null }[] {
  const parts = prose.split("\n");
  const out: { text: string; start: number; end: number; marca: RegExpExecArray | null }[] = [];
  let at = 0;
  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i] ?? "";
    const text = raw.trim();
    out.push({ text, start: at, end: at + raw.length, marca: MARCA.exec(text) });
    at += raw.length + (i < parts.length - 1 ? 1 : 0);
  }
  return out;
}

function linhaEm(linhas: { start: number; end: number; marca: RegExpExecArray | null }[], offset: number) {
  return linhas.find((linha) => offset >= linha.start && offset <= linha.end);
}

/** Acrescenta uma revisão. Não altera a anterior. Recusa inferência com o mesmo valor de um facto declarado. */
export function rever(historia: Historia, extra: Registo): { historia: Historia; recusado: boolean } {
  const declarados = historia.transaccoes.flatMap((tx) => tx.registos).filter((item) => item.status === "DECLARED");
  const choca = extra.status !== "DECLARED" && declarados.some((item) => item.value === extra.value && item.sourceMap.sentenceId === extra.sourceMap.sentenceId);
  if (choca) return { historia, recusado: true };
  const revision = historia.revision + 1;
  const registo = { ...extra, provenance: { ...extra.provenance, revision } };
  return {
    historia: {
      revision,
      transaccoes: [...historia.transaccoes, { id: `tx-${revision}`, revision, registos: [registo] }],
    },
    recusado: false,
  };
}
