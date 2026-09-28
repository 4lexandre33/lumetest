import { factsFor } from "../../knowledge/index.ts";
import { lerManuscrito } from "../../manuscript/index.ts";
import { isSystemEntityId } from "../../narrative-engine/index.ts";
import { grafoDe } from "../../narrative-graph/index.ts";
import { lerContinuidade } from "./continuidade.ts";
import { lerDiscurso } from "./discurso.ts";
import { impactoDaMutacao, mundoDe } from "./impacto.ts";
import { intencoesDe } from "./intencao.ts";
import { estadosDe } from "./pessoa.ts";

export type CodigoVerdade = "continuidade" | "causa" | "pessoa" | "conhecimento" | "estrutura" | "estilo" | "leitor" | "impacto";

export type NotaVerdade = { codigo: CodigoVerdade; texto: string; cena: string };

function cenaEm(prosa: string, offset: number): string {
  for (const book of lerManuscrito(prosa).books) {
    for (const chapter of book.chapters) {
      for (const scene of chapter.scenes) {
        if (offset >= scene.start && offset < scene.end) return scene.id;
      }
    }
  }
  return "";
}

function offsetDaLinha(prosa: string, linha: number): number {
  let at = 0;
  let current = 1;
  while (current < linha && at < prosa.length) {
    if (prosa[at] === "\n") current += 1;
    at += 1;
  }
  return at;
}

/** Um diagnóstico. Não abre ramo. Cada nota é o que já está declarado ou resolvido. */
export function diagnosticoDe(prosa: string, entities: string, doLine = "", linha = 0): { notas: NotaVerdade[] } {
  const notas: NotaVerdade[] = [];
  const world = mundoDe(entities);
  for (const aviso of lerContinuidade(prosa).avisos) {
    notas.push({ codigo: "continuidade", texto: aviso.texto, cena: cenaEm(prosa, offsetDaLinha(prosa, aviso.linha)) });
  }
  for (const aresta of grafoDe(world, prosa).arestas) {
    if (aresta.tipo !== "CAUSE") continue;
    notas.push({ codigo: "causa", texto: `${aresta.de} -> ${aresta.para} porque ${aresta.evidencia}`, cena: "" });
  }
  for (const estado of estadosDe(world, prosa)) {
    for (const campo of ["inicio", "pressao", "crise", "final"] as const) {
      const valor = estado[campo];
      if (!valor) continue;
      notas.push({ codigo: "pessoa", texto: `${estado.pessoa} ${campo}=${valor}`, cena: estado.cena.id });
    }
  }
  for (const entity of world.values()) {
    if (isSystemEntityId(entity.id)) continue;
    for (const facto of factsFor(world, entity.id)) {
      notas.push({ codigo: "conhecimento", texto: `${entity.id} sabe ${facto}`, cena: "" });
    }
  }
  for (const book of lerManuscrito(prosa).books) {
    for (const chapter of book.chapters) {
      for (const scene of chapter.scenes) {
        if (!scene.title) continue;
        notas.push({ codigo: "estrutura", texto: scene.title, cena: scene.id });
      }
    }
  }
  const discurso = lerDiscurso(prosa);
  for (const nota of discurso.estilo) {
    notas.push({ codigo: "estilo", texto: nota.traco, cena: cenaEm(prosa, nota.evidencia.start) });
  }
  for (const intencao of intencoesDe(prosa)) {
    notas.push({
      codigo: "leitor",
      texto: `cumpre ${intencao.cumpre.join(", ")}; falta ${intencao.falta.join(", ")}`,
      cena: intencao.cena.id,
    });
  }
  if (doLine && linha > 0) {
    for (const nota of impactoDaMutacao(prosa, entities, doLine, linha).notas) notas.push(nota);
  }
  return { notas };
}
