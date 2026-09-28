import { compileEntityFile } from "../../narrative-engine/index.ts";
import { lerManuscrito } from "./manuscript.ts";

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

function nomeDe(entities: string, id: string): string {
  try {
    return compileEntityFile(entities).worldModel.get(id)?.name?.trim() ?? "";
  } catch {
    return "";
  }
}

function ocorre(prosa: string, from: number, agulha: string): boolean {
  if (!agulha) return false;
  const re = new RegExp(`(?<![\\p{L}\\p{N}_@])${agulha.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}_])`, "iu");
  re.lastIndex = 0;
  const hit = re.exec(prosa.slice(from));
  return hit != null;
}

export function impactoDaMutacao(prosa: string, entities: string, doLine: string, linha: number): { notas: Diagnostico[] } {
  const id = alvoDe(doLine);
  if (!id) return { notas: [] };
  const from = offsetOfLine(prosa, linha);
  const nome = nomeDe(entities, id);
  const notas: Diagnostico[] = [];
  for (const book of lerManuscrito(prosa).books) {
    for (const chapter of book.chapters) {
      for (const scene of chapter.scenes) {
        if (scene.end <= from) continue;
        const inicio = Math.max(scene.start, from);
        if (!ocorre(prosa, inicio, id) && !ocorre(prosa, inicio, id.slice(1)) && !ocorre(prosa, inicio, nome)) continue;
        notas.push({ codigo: "impacto", texto: `ainda afecta ${scene.title}`, cena: scene.id });
      }
    }
  }
  return { notas };
}
