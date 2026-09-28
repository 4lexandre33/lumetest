import { lerManuscrito } from "./manuscript.ts";

export type Evidencia = { start: number; end: number; text: string };

export type NotaDiscurso = { tipo: "direto" | "indireto"; evidencia: Evidencia };
export type NotaEstilo = { traco: "curta" | "longa"; palavras: number; evidencia: Evidencia };

/** Notas com a frase citada. Não há texto novo. `prosa` é o texto recebido. */
export type LeituraDiscurso = { prosa: string; discurso: NotaDiscurso[]; estilo: NotaEstilo[] };

const INDIRETO = /disse que|perguntou se|contou que/iu;

function evidenciaDe(prosa: string, start: number, end: number): Evidencia {
  return { start, end, text: prosa.slice(start, end) };
}

export function lerDiscurso(prosa: string): LeituraDiscurso {
  const discurso: NotaDiscurso[] = [];
  const estilo: NotaEstilo[] = [];
  for (const book of lerManuscrito(prosa).books) {
    for (const chapter of book.chapters) {
      for (const scene of chapter.scenes) {
        for (const paragraph of scene.paragraphs) {
          for (const sentence of paragraph.sentences) {
            const fala = /«[^»]*»|“[^”]*”|"[^"]*"|'[^']*'/.exec(sentence.text);
            if (fala && fala.index != null) {
              const start = sentence.start + (sentence.text.indexOf(fala[0]));
              discurso.push({ tipo: "direto", evidencia: evidenciaDe(prosa, start, start + fala[0].length) });
            } else if (/^[—–]/.test(sentence.text)) {
              discurso.push({ tipo: "direto", evidencia: evidenciaDe(prosa, sentence.start, sentence.end) });
            }
            const indireto = INDIRETO.exec(sentence.text);
            if (indireto && indireto.index != null) {
              const start = sentence.start + indireto.index;
              discurso.push({ tipo: "indireto", evidencia: evidenciaDe(prosa, start, start + indireto[0].length) });
            }
            const palavras = sentence.text.split(/\s+/).filter(Boolean).length;
            const traco = palavras <= 4 ? "curta" : palavras >= 12 ? "longa" : null;
            if (traco) estilo.push({ traco, palavras, evidencia: evidenciaDe(prosa, sentence.start, sentence.end) });
          }
        }
      }
    }
  }
  return { prosa, discurso, estilo };
}
