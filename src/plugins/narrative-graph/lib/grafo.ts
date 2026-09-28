import { lerManuscrito } from "../../manuscript/index.ts";
import { causasDeclaradas, lerIr, referenciasDe } from "../../notebook/index.ts";
import { isSystemEntityId, type WorldModel } from "../../narrative-engine/index.ts";
import { linksOf } from "../../spatial/index.ts";

export type TipoNo = "ENTITY" | "SCENE" | "EVENT" | "OBJECT" | "PLACE" | "TIME" | "PROPOSITION" | "CHARACTER";
export type TipoAresta = "CAUSE" | "BEFORE" | "AFTER" | "LOCATED_AT" | "POSSESSES" | "KNOWS" | "BELIEVES" | "RELATES_TO" | "PART_OF" | "OCCURS_IN";
export type EstadoGrafo = "DECLARED" | "INFERRED";

export type OrigemGrafo = {
  kind: string;
  source: string;
  evidence: string;
  confidence: number | null;
  status: EstadoGrafo;
  provenance: { source: string; revision: number };
};

export type NoGrafo = OrigemGrafo & { id: string; tipo: TipoNo; evidencia: string };

export type ArestaGrafo = OrigemGrafo & { de: string; para: string; tipo: TipoAresta; evidencia: string };

/** Não infere trama. Sem declaração ou resolução única, a aresta não entra. */
export type GrafoNarrativo = { nos: NoGrafo[]; arestas: ArestaGrafo[]; ordem: string[] };

const EVENTO = /^evento:\s*(\S+)\s*$/i;
const OBJECTO = /^objecto:\s*(\S+)\s*$/i;
const INSTANTE = /^instante:\s*(\S+)\s*$/i;
const TEMPO = /^tempo:\s*(\S+)\s*->\s*(\S+)\s*$/i;
const LIGACAO = /^(depois|possui|sabe|acredita|parte|ocorre):\s*(\S+)\s*->\s*(\S+)\s*$/i;

const LIGACAO_TIPO: Record<string, TipoAresta> = {
  depois: "AFTER",
  possui: "POSSESSES",
  sabe: "KNOWS",
  acredita: "BELIEVES",
  parte: "PART_OF",
  ocorre: "OCCURS_IN",
};

function idDe(token: string, prosa: string, world: WorldModel, nos: Set<string>): string | null {
  if (nos.has(token)) return token;
  const hit = referenciasDe(prosa, world).find((item) => item.token === token);
  if (hit?.status === "resolvido" && hit.entityId && nos.has(hit.entityId)) return hit.entityId;
  return null;
}

function origem(kind: string, source: string, evidence: string, confidence: number | null = null): OrigemGrafo & { evidencia: string } {
  return {
    kind,
    source,
    evidence,
    evidencia: evidence,
    confidence,
    status: "DECLARED",
    provenance: { source, revision: 1 },
  };
}

export function grafoDe(world: WorldModel, prosa = ""): GrafoNarrativo {
  const nos: NoGrafo[] = [];
  const ids = new Set<string>();
  const ordem: string[] = [];
  const porId = (id: string, tipo: TipoNo, evidence: string, source: string, confidence: number | null = null) => {
    const ja = nos.find((item) => item.id === id);
    if (!ja) {
      ids.add(id);
      nos.push({ id, tipo, ...origem(tipo, source, evidence, confidence) });
      return;
    }
    if ((tipo === "EVENT" || tipo === "OBJECT") && (ja.tipo === "ENTITY" || ja.tipo === "CHARACTER" || ja.tipo === "PLACE")) {
      ja.tipo = tipo;
      ja.kind = tipo;
    }
  };
  for (const entity of world.values()) {
    if (isSystemEntityId(entity.id) || ids.has(entity.id)) continue;
    const tipo: TipoNo = entity.tags.has("agent") ? "CHARACTER" : entity.tags.has("place") ? "PLACE" : "ENTITY";
    porId(entity.id, tipo, entity.id, `entidade:${entity.id}`);
  }
  if (prosa) {
    for (const book of lerManuscrito(prosa).books) {
      for (const chapter of book.chapters) {
        for (const scene of chapter.scenes) {
          if (!scene.title || ids.has(scene.id)) continue;
          porId(scene.id, "SCENE", scene.title, `cena:${scene.id}`);
          ordem.push(scene.id);
        }
      }
    }
    for (const act of lerIr(prosa).acts) {
      if (act.operation === "structure" || !act.sentenceId) continue;
      porId(act.sentenceId, "PROPOSITION", act.text, act.provenance.source, act.confidence);
      if (act.tempo?.valor) porId(act.tempo.valor, "TIME", act.tempo.evidencia.text, act.provenance.source);
    }
    for (const line of prosa.split("\n")) {
      const texto = line.trim();
      const evento = EVENTO.exec(texto);
      const objecto = OBJECTO.exec(texto);
      const instante = INSTANTE.exec(texto);
      const token = evento?.[1] ?? objecto?.[1] ?? instante?.[1];
      if (!token) continue;
      const tipo: TipoNo = evento ? "EVENT" : objecto ? "OBJECT" : "TIME";
      const id = ids.has(token) ? token : (idDe(token, prosa, world, ids) ?? token);
      porId(id, tipo, texto, `linha:${texto}`);
    }
  }
  const arestas: ArestaGrafo[] = [];
  const vista = new Set<string>();
  const push = (de: string, para: string, tipo: TipoAresta, evidencia: string, source: string) => {
    if (!ids.has(de) || !ids.has(para) || de === para) return;
    const key = `${tipo}|${de}|${para}|${evidencia}`;
    if (vista.has(key)) return;
    vista.add(key);
    arestas.push({ de, para, tipo, ...origem(tipo, source, evidencia) });
  };
  for (const entity of world.values()) {
    if (!ids.has(entity.id)) continue;
    for (const [key, para] of Object.entries(entity.hardLinks)) push(entity.id, para, "RELATES_TO", key, `link:${key}`);
    for (const [key, para] of Object.entries(entity.softLinks)) push(entity.id, para, "RELATES_TO", key, `link:${key}`);
  }
  for (const link of linksOf(world)) push(link.from, link.to, "LOCATED_AT", link.dir, `lugar:${link.dir}`);
  for (const causa of causasDeclaradas(prosa)) {
    const de = idDe(causa.de, prosa, world, ids);
    const para = idDe(causa.para, prosa, world, ids);
    if (de && para) push(de, para, "CAUSE", causa.porque, `causa:${causa.de}->${causa.para}`);
  }
  for (const line of prosa.split("\n")) {
    const texto = line.trim();
    const tempo = TEMPO.exec(texto);
    if (tempo?.[1] && tempo[2]) {
      const de = idDe(tempo[1], prosa, world, ids);
      const para = idDe(tempo[2], prosa, world, ids);
      if (de && para) push(de, para, "BEFORE", texto, `tempo:${texto}`);
      continue;
    }
    const liga = LIGACAO.exec(texto);
    if (!liga?.[1] || !liga[2] || !liga[3]) continue;
    const tipo = LIGACAO_TIPO[liga[1].toLowerCase()];
    if (!tipo) continue;
    const de = idDe(liga[2], prosa, world, ids);
    const para = idDe(liga[3], prosa, world, ids);
    if (de && para) push(de, para, tipo, texto, `linha:${texto}`);
  }
  nos.sort((a, b) => a.tipo.localeCompare(b.tipo) || a.id.localeCompare(b.id));
  arestas.sort((a, b) => a.tipo.localeCompare(b.tipo) || a.de.localeCompare(b.de) || a.para.localeCompare(b.para));
  return { nos, arestas, ordem };
}
