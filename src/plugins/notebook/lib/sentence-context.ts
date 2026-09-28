import { beliefsFor, factsFor, ignorantOf } from "../../knowledge/index.ts";
import { causasDeclaradas, type Causa } from "./causa.ts";
import { lerManuscrito, type ManuscriptScene, type ManuscriptSentence } from "./manuscript.ts";
import { referenciasDe } from "./reference.ts";
import { worldAte } from "./timeline.ts";

/** Contexto de uma frase. Não leva o livro. Não chama modelo. */
export type SentenceContext = {
  sentenceId: string;
  text: string;
  span: { start: number; end: number };
  cena: { id: string; title: string; texto: string };
  tempo: { linha: number };
  tempos: {
    discurso: { linha: number };
    historia: { marca: string | null };
    simulacao: { passo: number };
  };
  presentes: string[];
  sabem: { quem: string; factos: string[] }[];
  creem: { quem: string; factos: string[] }[];
  ignoram: { quem: string; factos: string[] }[];
  causas: Causa[];
};

function lineOf(prose: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < prose.length; i++) if (prose[i] === "\n") line += 1;
  return line;
}

function locate(prose: string, offset: number): { sentence: ManuscriptSentence; scene: ManuscriptScene } | null {
  for (const book of lerManuscrito(prose).books) {
    for (const chapter of book.chapters) {
      for (const scene of chapter.scenes) {
        for (const paragraph of scene.paragraphs) {
          for (const sentence of paragraph.sentences) {
            if (offset >= sentence.start && offset < sentence.end) return { sentence, scene };
          }
        }
      }
    }
  }
  return null;
}

function marcaHistoria(texto: string): string | null {
  let marca: string | null = null;
  for (const line of texto.split("\n")) {
    const hit = /^tempo:\s*(\S(?:.*\S)?)\s*$/i.exec(line.trim());
    if (hit?.[1]) marca = hit[1];
  }
  return marca;
}

export function contextoDaFrase(prose: string, offset: number, entitiesSource = "", passo = 0): SentenceContext | null {
  const found = locate(prose, offset);
  if (!found) return null;
  const { sentence, scene } = found;
  const linha = lineOf(prose, sentence.start);
  const world = worldAte(prose, entitiesSource, linha);
  const texto = prose.slice(scene.start, sentence.end);
  const presentes = [
    ...new Set(
      referenciasDe(prose, world)
        .filter((hit) => hit.status === "resolvido" && hit.entityId && hit.span.start >= scene.start && hit.span.end <= sentence.end)
        .map((hit) => hit.entityId as string),
    ),
  ]
    .filter((id) => world.get(id)?.tags.has("agent"))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return {
    sentenceId: sentence.id,
    text: sentence.text,
    span: { start: sentence.start, end: sentence.end },
    cena: { id: scene.id, title: scene.title, texto },
    tempo: { linha },
    tempos: { discurso: { linha }, historia: { marca: marcaHistoria(texto) }, simulacao: { passo } },
    presentes,
    sabem: presentes.map((quem) => ({ quem, factos: factsFor(world, quem) })),
    creem: presentes.map((quem) => ({ quem, factos: beliefsFor(world, quem) })),
    ignoram: presentes.map((quem) => ({ quem, factos: ignorantOf(world, quem) })),
    causas: causasDeclaradas(texto),
  };
}
