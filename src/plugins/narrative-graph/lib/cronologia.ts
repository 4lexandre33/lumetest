import { referenciasDe } from "../../notebook/index.ts";
import type { WorldModel } from "../../narrative-engine/index.ts";
import { grafoDe, type ArestaGrafo, type GrafoNarrativo } from "./grafo.ts";

export type Duracao = { de: string | null; para: string | null; valor: string; evidencia: string };
export type Simultaneo = { de: string; para: string; evidencia: string };
export type Analepse = { no: string; evidencia: string };

/** Por cima do grafo. Os três tempos não se recalculam aqui. Sem marca, não há duração, simultâneo nem analepse. */
export type Cronologia = {
  grafo: GrafoNarrativo;
  duracao: Duracao[];
  simultaneo: Simultaneo[];
  analepse: Analepse[];
  causas: ArestaGrafo[];
  ordem: string[];
};

const DURACAO = /^duracao:\s*(?:(\S+)\s*->\s*(\S+)\s+)?(\S+)\s*$/i;
const SIMULTANEO = /^simultaneo:\s*(\S+)\s*=\s*(\S+)\s*$/i;
const ANALESE = /^analepse:\s*(\S+)\s*$/i;

function noDe(token: string, prosa: string, world: WorldModel, grafo: GrafoNarrativo): string | null {
  if (grafo.nos.some((no) => no.id === token)) return token;
  const hit = referenciasDe(prosa, world).find((item) => item.token === token);
  if (hit?.status === "resolvido" && hit.entityId && grafo.nos.some((no) => no.id === hit.entityId)) return hit.entityId;
  return null;
}

export function cronologiaDe(world: WorldModel, prosa: string): Cronologia {
  const grafo = grafoDe(world, prosa);
  const duracao: Duracao[] = [];
  const simultaneo: Simultaneo[] = [];
  const analepse: Analepse[] = [];
  for (const line of prosa.split("\n")) {
    const texto = line.trim();
    const duracaoMarca = DURACAO.exec(texto);
    if (duracaoMarca?.[3]) {
      const de = duracaoMarca[1] ? noDe(duracaoMarca[1], prosa, world, grafo) : null;
      const para = duracaoMarca[2] ? noDe(duracaoMarca[2], prosa, world, grafo) : null;
      if (duracaoMarca[1] && (!de || !para)) continue;
      duracao.push({ de, para, valor: duracaoMarca[3], evidencia: texto });
      continue;
    }
    const junto = SIMULTANEO.exec(texto);
    if (junto?.[1] && junto[2]) {
      const de = noDe(junto[1], prosa, world, grafo);
      const para = noDe(junto[2], prosa, world, grafo);
      if (de && para) simultaneo.push({ de, para, evidencia: texto });
      continue;
    }
    const volta = ANALESE.exec(texto);
    if (volta?.[1]) {
      const no = noDe(volta[1], prosa, world, grafo);
      if (no) analepse.push({ no, evidencia: texto });
    }
  }
  return { grafo, duracao, simultaneo, analepse, causas: grafo.arestas.filter((aresta) => aresta.tipo === "CAUSE"), ordem: grafo.ordem };
}
