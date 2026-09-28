import { lerManuscrito } from "../../manuscript/index.ts";
import { isSystemEntityId, type WorldModel } from "../../narrative-engine/index.ts";
import { referenciasDe } from "./reference.ts";

export type EstadoPessoa = {
  pessoa: string;
  cena: { id: string; title: string };
  inicio: string | null;
  pressao: string | null;
  crise: string | null;
  final: string | null;
  evidencia: string[];
};

const MARCA = /^pessoa:\s*(\S+)\s+(inicio|pressao|crise|final)=(\S(?:.*\S)?)\s*$/i;

function pessoaDe(token: string, prosa: string, world: WorldModel): string | null {
  if (world.has(token) && !isSystemEntityId(token)) return token;
  const hit = referenciasDe(prosa, world).find((item) => item.token === token);
  if (hit?.status === "resolvido" && hit.entityId && world.has(hit.entityId)) return hit.entityId;
  return null;
}

/** Por cena. Só o que a linha `pessoa:` declara. Não lê `hp` e não passa à cena seguinte. */
export function estadosDe(world: WorldModel, prosa: string): EstadoPessoa[] {
  const out: EstadoPessoa[] = [];
  for (const book of lerManuscrito(prosa).books) {
    for (const chapter of book.chapters) {
      for (const scene of chapter.scenes) {
        const campos = new Map<string, EstadoPessoa>();
        for (const line of prosa.slice(scene.start, scene.end).split("\n")) {
          const marca = MARCA.exec(line.trim());
          if (!marca?.[1] || !marca[2] || !marca[3]) continue;
          const pessoa = pessoaDe(marca[1], prosa, world);
          if (!pessoa) continue;
          const estado = campos.get(pessoa) ?? {
            pessoa,
            cena: { id: scene.id, title: scene.title },
            inicio: null,
            pressao: null,
            crise: null,
            final: null,
            evidencia: [],
          };
          estado[marca[2].toLowerCase() as "inicio" | "pressao" | "crise" | "final"] = marca[3];
          estado.evidencia.push(line.trim());
          campos.set(pessoa, estado);
        }
        out.push(...campos.values());
      }
    }
  }
  return out;
}

export type EstatutoArco = "DECLARED ARC" | "INFERRED POSSIBILITY" | "UNRESOLVED";

export type CadeiaPersonagem = {
  personagem: string;
  cena: { id: string; title: string };
  estado: string | null;
  crenca: string | null;
  objectivo: string | null;
  pressao: string | null;
  conflito: string | null;
  decisao: string | null;
  mudanca: string | null;
  arco: string | null;
  estatuto: EstatutoArco;
  evidencia: string[];
};

const PASSO = /^pessoa:\s*(\S+)\s+(estado|crenca|objectivo|pressao|conflito|decisao|mudanca)=(\S(?:.*\S)?)\s*$/i;
const ARCO_PESSOA = /^arco:\s*(\S+)\s+(\S(?:.*\S)?)\s*$/i;
const POSSIBILIDADE = /^possibilidade:\s*(\S+)\s+(\S(?:.*\S)?)\s*$/i;

function vazia(pessoa: string, scene: { id: string; title: string }): CadeiaPersonagem {
  return {
    personagem: pessoa,
    cena: { id: scene.id, title: scene.title },
    estado: null,
    crenca: null,
    objectivo: null,
    pressao: null,
    conflito: null,
    decisao: null,
    mudanca: null,
    arco: null,
    estatuto: "UNRESOLVED",
    evidencia: [],
  };
}

/** A cadeia da pessoa, por cena. Não inventa evolução. Sem arco declarado, fica por resolver ou só como possibilidade marcada. */
export function cadeiaDe(world: WorldModel, prosa: string): CadeiaPersonagem[] {
  const out: CadeiaPersonagem[] = [];
  for (const book of lerManuscrito(prosa).books) {
    for (const chapter of book.chapters) {
      for (const scene of chapter.scenes) {
        const campos = new Map<string, CadeiaPersonagem>();
        const garantir = (token: string) => {
          const pessoa = pessoaDe(token, prosa, world);
          if (!pessoa || !world.get(pessoa)?.tags.has("agent")) return null;
          const cadeia = campos.get(pessoa) ?? vazia(pessoa, scene);
          campos.set(pessoa, cadeia);
          return cadeia;
        };
        for (const line of prosa.slice(scene.start, scene.end).split("\n")) {
          const texto = line.trim();
          const passo = PASSO.exec(texto);
          if (passo?.[1] && passo[2] && passo[3]) {
            const cadeia = garantir(passo[1]);
            if (!cadeia) continue;
            cadeia[passo[2].toLowerCase() as "estado" | "crenca" | "objectivo" | "pressao" | "conflito" | "decisao" | "mudanca"] = passo[3];
            cadeia.evidencia.push(texto);
            continue;
          }
          const arco = ARCO_PESSOA.exec(texto);
          if (arco?.[1] && arco[2]) {
            const cadeia = garantir(arco[1]);
            if (!cadeia) continue;
            cadeia.arco = arco[2];
            cadeia.estatuto = "DECLARED ARC";
            cadeia.evidencia.push(texto);
            continue;
          }
          const possibilidade = POSSIBILIDADE.exec(texto);
          if (possibilidade?.[1] && possibilidade[2]) {
            const cadeia = garantir(possibilidade[1]);
            if (!cadeia) continue;
            if (cadeia.estatuto !== "DECLARED ARC") {
              cadeia.arco = possibilidade[2];
              cadeia.estatuto = "INFERRED POSSIBILITY";
            }
            cadeia.evidencia.push(texto);
          }
        }
        out.push(...campos.values());
      }
    }
  }
  return out;
}
