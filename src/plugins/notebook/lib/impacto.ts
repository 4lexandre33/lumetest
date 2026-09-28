import { compileEntityFile, type WorldModel } from "../../narrative-engine/index.ts";
import { lerManuscrito } from "../../manuscript/index.ts";
import { grafoDe } from "../../narrative-graph/index.ts";

/** Uma nota só. Não abre outro canal e não bifurca a prosa. */
export type Diagnostico = { codigo: "impacto"; texto: string; cena: string };

function offsetOfLine(prosa: string, linha: number): number {
  let at = 0;
  let current = 1;
  while (current < linha && at < prosa.length) {
    if (prosa[at] === "\n") current += 1;
    at += 1;
  }
  return at;
}

function alvoDe(doLine: string): string | null {
  return /@[a-z][\p{L}\p{N}_]*/iu.exec(doLine)?.[0]?.toLowerCase() ?? null;
}

export function mundoDe(entities: string): WorldModel {
  try {
    return compileEntityFile(entities).worldModel;
  } catch {
    return new Map();
  }
}

function ocorre(prosa: string, from: number, agulha: string): boolean {
  if (!agulha) return false;
  const re = new RegExp(`(?<![\\p{L}\\p{N}_@])${agulha.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}_])`, "iu");
  re.lastIndex = 0;
  const hit = re.exec(prosa.slice(from));
  return hit != null;
}

function alcancados(world: WorldModel, prosa: string, id: string): Set<string> {
  const grafo = grafoDe(world, prosa);
  const reach = new Set<string>([id]);
  const queue = [id];
  while (queue.length) {
    const atual = queue.shift()!;
    for (const aresta of grafo.arestas) {
      if (aresta.de !== atual || reach.has(aresta.para)) continue;
      reach.add(aresta.para);
      queue.push(aresta.para);
    }
  }
  return reach;
}

export function impactoDaMutacao(prosa: string, entities: string, doLine: string, linha: number): { notas: Diagnostico[] } {
  const id = alvoDe(doLine);
  if (!id) return { notas: [] };
  const world = mundoDe(entities);
  const from = offsetOfLine(prosa, linha);
  const nome = world.get(id)?.name?.trim() ?? "";
  const reach = alcancados(world, prosa, id);
  const notas: Diagnostico[] = [];
  for (const book of lerManuscrito(prosa).books) {
    for (const chapter of book.chapters) {
      for (const scene of chapter.scenes) {
        if (scene.end <= from) continue;
        const inicio = Math.max(scene.start, from);
        const mencionada = ocorre(prosa, inicio, id) || ocorre(prosa, inicio, id.slice(1)) || ocorre(prosa, inicio, nome);
        const titulo = scene.title.trim().toLowerCase();
        const peloGrafo = [...reach].some((node) => {
          if (node === id) return false;
          const alvo = world.get(node)?.name?.trim().toLowerCase() ?? "";
          const nu = node.replace(/^@/, "").toLowerCase();
          return node === scene.id || titulo === alvo || titulo === nu || titulo === node.toLowerCase();
        });
        if (!mencionada && !peloGrafo) continue;
        notas.push({ codigo: "impacto", texto: `ainda afecta ${scene.title}`, cena: scene.id });
      }
    }
  }
  return { notas };
}