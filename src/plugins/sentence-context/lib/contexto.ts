import { beliefsFor, factsFor, ignorantOf } from "../../knowledge/index.ts";
import { causasDeclaradas, type Causa } from "../../notebook/lib/causa.ts";
import { fraseNoOffset, lerManuscrito, type ManuscriptScene, type ManuscriptSentence } from "../../manuscript/index.ts";
import { referenciasDe } from "../../notebook/lib/reference.ts";
import { worldAte } from "../../notebook/lib/timeline.ts";
import { grafoDe } from "../../narrative-graph/index.ts";

/** Contexto de uma frase. Não leva o livro. Não chama modelo. */
export type ContextoExacto = {
  frase: string;
  cena: string;
  tempo: string | null;
  presentes: string[];
  conhecimento: { quem: string; sabe: string[]; ignora: string[] }[];
  eventos: string[];
  causas: Causa[];
  grafo: { nos: string[]; arestas: { de: string; para: string; tipo: string }[] };
};

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
  exacto: ContextoExacto;
};

function lineOf(prose: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < prose.length; i++) if (prose[i] === "\n") line += 1;
  return line;
}

function locate(prose: string, offset: number): { sentence: ManuscriptSentence; scene: ManuscriptScene } | null {
  return fraseNoOffset(lerManuscrito(prose), offset);
}

function marcaHistoria(texto: string): string | null {
  let marca: string | null = null;
  for (const line of texto.split("\n")) {
    const hit = /^tempo:\s*(\S(?:.*\S)?)\s*$/i.exec(line.trim());
    if (hit?.[1] && !hit[1].includes("->")) marca = hit[1];
  }
  return marca;
}

function horaDe(texto: string): string | null {
  let hora: string | null = null;
  for (const line of texto.split("\n")) {
    const hit = /^hora:\s*(\d{1,2}:\d{2})\s*$/i.exec(line.trim());
    if (hit?.[1]) hora = hit[1];
  }
  return hora;
}

function eventosDe(texto: string): string[] {
  const out: string[] = [];
  for (const line of texto.split("\n")) {
    const hit = /^evento:\s*(\S+)\s*$/i.exec(line.trim());
    if (hit?.[1]) out.push(hit[1]);
  }
  return out;
}

function grafoRelevante(world: ReturnType<typeof worldAte>, texto: string, ids: string[]) {
  const grafo = grafoDe(world, texto);
  const ligados = new Set(ids);
  const arestas = grafo.arestas.filter((aresta) => ligados.has(aresta.de) || ligados.has(aresta.para));
  for (const aresta of arestas) {
    ligados.add(aresta.de);
    ligados.add(aresta.para);
  }
  const nos = [...ligados].filter((id) => grafo.nos.some((no) => no.id === id)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return {
    nos,
    arestas: arestas
      .map((aresta) => ({ de: aresta.de, para: aresta.para, tipo: aresta.tipo }))
      .sort((a, b) => a.tipo.localeCompare(b.tipo) || a.de.localeCompare(b.de) || a.para.localeCompare(b.para)),
  };
}

export function contextoDaFrase(prose: string, offset: number, entitiesSource = "", passo = 0): SentenceContext | null {
  const found = locate(prose, offset);
  if (!found) return null;
  const { sentence, scene } = found;
  const linha = lineOf(prose, sentence.start);
  const world = worldAte(prose, entitiesSource, linha);
  const texto = prose.slice(scene.start, sentence.end);
  const resolvidos = [
    ...new Set(
      referenciasDe(sentence.text, world)
        .filter((hit) => hit.status === "resolvido" && hit.entityId)
        .map((hit) => hit.entityId as string),
    ),
  ].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const presentes = resolvidos.filter((id) => world.get(id)?.tags.has("agent"));
  const emCena = resolvidos.filter((id) => {
    const tags = world.get(id)?.tags;
    return tags?.has("agent") || tags?.has("object");
  });
  const eventos = eventosDe(texto);
  const causas = causasDeclaradas(texto);
  const hora = horaDe(texto);
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
    causas,
    exacto: {
      frase: sentence.id,
      cena: scene.title,
      tempo: hora ?? marcaHistoria(texto),
      presentes: emCena,
      conhecimento: emCena.filter((id) => world.get(id)?.tags.has("agent")).map((quem) => ({ quem, sabe: factsFor(world, quem), ignora: ignorantOf(world, quem) })),
      eventos,
      causas,
      grafo: grafoRelevante(world, texto, [...emCena, ...eventos, scene.id]),
    },
  };
}
