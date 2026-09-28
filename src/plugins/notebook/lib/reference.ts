import { factsFor } from "../../knowledge/index.ts";
import { lerManuscrito } from "../../manuscript/index.ts";
import { isSystemEntityId, type WorldModel } from "../../narrative-engine/index.ts";
import { lerContinuidade } from "./continuidade.ts";
import { lerDiscurso } from "./discurso.ts";
import { lerIr } from "./narrative-ir.ts";

export type ReferenceStatus = "resolvido" | "ambiguo" | "nao_resolvido";

export type ReferenceEvidence = {
  kind: "nome" | "id" | "unica_mencao" | "mencoes" | "recencia" | "cena" | "numero" | "conhecimento" | "discurso" | "grafo" | "focalizacao" | "continuidade" | "texto";
  text: string;
  start: number;
  end: number;
};

/** Sem candidato único, `entityId` fica null. O género só conta se a entidade o declara. */
export type ReferenceHit = {
  token: string;
  span: { start: number; end: number };
  status: ReferenceStatus;
  entityId: string | null;
  candidates: string[];
  evidence: ReferenceEvidence[];
};

type Mention = { id: string; start: number; end: number; kind: "nome" | "id"; text: string };

function spansOf(prose: string, token: string): { start: number; end: number }[] {
  if (!token) return [];
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^\\p{L}\\p{N}_])(${escaped})(?=[^\\p{L}\\p{N}_]|$)`, "giu");
  const out: { start: number; end: number }[] = [];
  for (const match of prose.matchAll(re)) {
    const start = (match.index ?? 0) + (match[1]?.length ?? 0);
    out.push({ start, end: start + (match[2]?.length ?? 0) });
  }
  return out;
}

function mentions(prose: string, world: WorldModel): Mention[] {
  const grouped = new Map<string, Mention>();
  for (const entity of world.values()) {
    if (isSystemEntityId(entity.id)) continue;
    const name = entity.name.trim();
    const tokens: { token: string; kind: "nome" | "id" }[] = [{ token: entity.id, kind: "id" }];
    if (name && name !== entity.id) tokens.push({ token: name, kind: "nome" });
    for (const item of tokens) {
      for (const span of spansOf(prose, item.token)) {
        const key = `${span.start}:${span.end}`;
        const text = prose.slice(span.start, span.end);
        const prev = grouped.get(key);
        if (!prev) grouped.set(key, { id: entity.id, ...span, kind: item.kind, text });
        else if (!prev.id.split("\0").includes(entity.id)) prev.id = `${prev.id}\0${entity.id}`;
      }
    }
  }
  return [...grouped.values()].sort((a, b) => a.start - b.start || a.end - b.end);
}

function idsOf(mention: Mention): string[] {
  return mention.id.split("\0").sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function statusOf(candidates: string[]): { status: ReferenceStatus; entityId: string | null } {
  if (candidates.length === 1) return { status: "resolvido", entityId: candidates[0]! };
  if (candidates.length > 1) return { status: "ambiguo", entityId: null };
  return { status: "nao_resolvido", entityId: null };
}

function pronouns(prose: string): { start: number; end: number; text: string; forma: "pessoa" | "homem" | "isso" | "objeto" | "amigo" | "la" | "dia" }[] {
  const re = /(^|[^\p{L}\p{N}_])(aquele homem|naquele dia|o objeto|o objecto|seu amigo|eles|elas|ele|ela|isso|lá)(?=[^\p{L}\p{N}_]|$)/giu;
  const out: { start: number; end: number; text: string; forma: "pessoa" | "homem" | "isso" | "objeto" | "amigo" | "la" | "dia" }[] = [];
  for (const match of prose.matchAll(re)) {
    const start = (match.index ?? 0) + (match[1]?.length ?? 0);
    const text = match[2] ?? "";
    const lower = text.toLowerCase();
    const forma = lower === "aquele homem" ? "homem" : lower === "naquele dia" ? "dia" : lower === "o objeto" || lower === "o objecto" ? "objeto" : lower === "seu amigo" ? "amigo" : lower === "isso" ? "isso" : lower === "lá" ? "la" : "pessoa";
    out.push({ start, end: start + text.length, text, forma });
  }
  return out;
}

function phrase(world: WorldModel, id: string, key: string): string | null {
  const value = world.get(id)?.phrases[key]?.trim().toLowerCase();
  return value || null;
}

function declaredGender(world: WorldModel, id: string): "feminino" | "masculino" | null {
  const value = phrase(world, id, "genero");
  if (value === "feminino" || value === "masculino") return value;
  return null;
}

function declaredNumber(world: WorldModel, id: string): "plural" | "singular" {
  return phrase(world, id, "numero") === "plural" ? "plural" : "singular";
}

function pronounShape(text: string): { gender: "feminino" | "masculino" | null; number: "plural" | "singular" } {
  const lower = text.toLowerCase();
  if (lower === "isso" || lower === "lá" || lower === "o objeto" || lower === "o objecto" || lower === "seu amigo" || lower === "naquele dia") return { gender: null, number: "singular" };
  if (lower === "aquele homem") return { gender: "masculino", number: "singular" };
  return { gender: lower.startsWith("ela") ? "feminino" : "masculino", number: lower.endsWith("s") ? "plural" : "singular" };
}

function sceneOf(prose: string, offset: number): { start: number; end: number } | null {
  for (const book of lerManuscrito(prose).books) {
    for (const chapter of book.chapters) {
      for (const scene of chapter.scenes) {
        if (offset >= scene.start && offset < scene.end) return { start: scene.start, end: scene.end };
      }
    }
  }
  return null;
}

function sentencesBefore(prose: string, offset: number): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  for (const book of lerManuscrito(prose).books) {
    for (const chapter of book.chapters) {
      for (const scene of chapter.scenes) {
        for (const paragraph of scene.paragraphs) {
          for (const sentence of paragraph.sentences) {
            if (sentence.end <= offset) out.push({ start: sentence.start, end: sentence.end });
          }
        }
      }
    }
  }
  return out;
}

function idsIn(mentions: Mention[], ids: string[]): string[] {
  const allowed = new Set(ids);
  return [...new Set(mentions.flatMap(idsOf).filter((id) => allowed.has(id)))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function narrowPronoun(prose: string, world: WorldModel, pronoun: { start: number; text: string }, prior: Mention[], ids: string[], filtrarGenero = true): { ids: string[]; kind: ReferenceEvidence["kind"] } {
  let current = ids;
  let kind: ReferenceEvidence["kind"] = ids.length === 1 ? "unica_mencao" : "mencoes";
  const scene = sceneOf(prose, pronoun.start);
  if (scene) {
    const inside = prior.filter((mention) => mention.start >= scene.start && mention.end <= scene.end);
    const next = idsIn(inside, current);
    if (next.length < current.length) {
      current = next;
      kind = "cena";
      if (current.length === 0) return { ids: [], kind };
    }
  }
  if (current.length > 1) {
    const sentences = sentencesBefore(prose, pronoun.start);
    let recent: Mention[] = [];
    let at = -1;
    for (const sentence of sentences) {
      const inside = prior.filter((mention) => mention.start >= sentence.start && mention.end <= sentence.end && idsOf(mention).some((id) => current.includes(id)));
      if (inside.length && sentence.start >= at) {
        at = sentence.start;
        recent = inside;
      }
    }
    const recentIds = idsIn(recent, current);
    if (recentIds.length > 0 && recentIds.length < current.length) {
      current = recentIds;
      kind = "recencia";
    }
  }
  const shape = pronounShape(pronoun.text);
  if (filtrarGenero && shape.gender) {
    const gendered = current.filter((id) => {
      const declared = declaredGender(world, id);
      return declared == null || declared === shape.gender;
    });
    if (gendered.length === 0) return { ids: [], kind };
    if (gendered.length < current.length) {
      current = gendered;
      kind = "mencoes";
    }
  }
  const numbered = current.filter((id) => declaredNumber(world, id) === shape.number);
  if (numbered.length === 0) return { ids: [], kind: "numero" };
  if (numbered.length < current.length) {
    current = numbered;
    kind = "numero";
  } else if (shape.number === "plural" && numbered.length === 1) kind = "numero";
  const known = new Set<string>();
  for (const entity of world.values()) {
    for (const fact of factsFor(world, entity.id)) known.add(fact);
  }
  const knew = current.filter((id) => known.has(id));
  if (knew.length > 0 && knew.length < current.length) {
    current = knew;
    kind = "conhecimento";
  }
  return { ids: current, kind };
}

function linhaDeclarada(prose: string, offset: number): boolean {
  const start = prose.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
  const end = prose.indexOf("\n", offset);
  const text = prose.slice(start, end < 0 ? prose.length : end).trim();
  return /^(voz|tempo|modalidade|papel|predicado|entidade|referencia|aspecto|negacao|focalizacao|discurso|proposicao|confianca|resolvido|inferido|derivado|desconhecido|arco|instante|evento|objecto):/i.test(text);
}

function linhaDe(prose: string, offset: number): number {
  let linha = 1;
  for (let i = 0; i < offset && i < prose.length; i++) if (prose[i] === "\n") linha += 1;
  return linha;
}

function idsPorNome(world: WorldModel, nome: string): string[] {
  const alvo = nome.trim();
  return [...world.values()].filter((entity) => !isSystemEntityId(entity.id) && (entity.id === alvo || entity.name === alvo)).map((entity) => entity.id);
}

function focoDe(prose: string, offset: number, world: WorldModel): string | null {
  const act = lerIr(prose).acts.find((item) => offset >= item.span.start && offset < item.span.end);
  const valor = act?.focalizacao?.valor;
  if (!valor) return null;
  const ids = idsPorNome(world, valor);
  return ids.length === 1 ? ids[0]! : null;
}

function arcoDe(prose: string, offset: number, world: WorldModel): string | null {
  const linha = linhaDe(prose, offset);
  const nomes = lerContinuidade(prose).arcos.filter((arco) => arco.linha <= linha).map((arco) => arco.nome);
  const ids = [...new Set(nomes.flatMap((nome) => idsPorNome(world, nome)))];
  return ids.length === 1 ? ids[0]! : null;
}

function dentroDaFala(prose: string, start: number, end: number, prior: Mention[]): string[] | null {
  const spans = lerDiscurso(prose).discurso.map((nota) => nota.evidencia);
  for (const match of prose.matchAll(/«[^»]*»|“[^”]*”/gu)) {
    const at = match.index ?? 0;
    spans.push({ start: at, end: at + match[0].length, text: match[0] });
  }
  const fala = spans.find((nota) => start >= nota.start && end <= nota.end);
  if (!fala) return null;
  const dentro = prior.filter((mention) => mention.start >= fala.start && mention.end <= fala.end);
  if (!dentro.length) return null;
  return [...new Set(dentro.flatMap(idsOf))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function amigosDe(world: WorldModel, ids: string[]): string[] {
  const agentes = ids.filter((id) => world.get(id)?.tags.has("agent"));
  if (agentes.length !== 1) return [];
  const dono = world.get(agentes[0]!);
  if (!dono) return [];
  const alvos: string[] = [];
  for (const [key, para] of [...Object.entries(dono.hardLinks), ...Object.entries(dono.softLinks)]) {
    if (/amigo/i.test(key) && world.has(para)) alvos.push(para);
  }
  return [...new Set(alvos)];
}

function lugaresDe(world: WorldModel, ids: string[]): { ids: string[]; kind: ReferenceEvidence["kind"] } {
  const ditos = ids.filter((id) => world.get(id)?.tags.has("place"));
  if (ditos.length === 1) return { ids: ditos, kind: "cena" };
  const ligados = new Set<string>();
  for (const id of ids) {
    const entity = world.get(id);
    if (!entity) continue;
    for (const para of [...Object.values(entity.hardLinks), ...Object.values(entity.softLinks)]) {
      if (world.get(para)?.tags.has("place")) ligados.add(para);
    }
  }
  return { ids: ditos.length > 1 ? ditos : [...ligados], kind: ditos.length > 1 ? "cena" : "grafo" };
}

function diasDe(prose: string, offset: number): string[] {
  const nomes: string[] = [];
  let at = 0;
  for (const line of prose.split("\n")) {
    if (at >= offset) break;
    const hit = /^instante:\s*(\S+)\s*$/i.exec(line.trim());
    if (hit?.[1]) nomes.push(hit[1]);
    at += line.length + 1;
  }
  return [...new Set(nomes)];
}

function declarar(atual: string[], unico: string | null, kind: ReferenceEvidence["kind"]): { ids: string[]; kind: ReferenceEvidence["kind"] } | null {
  if (!unico) return null;
  if (atual.length === 0 || (atual.length > 1 && atual.includes(unico))) return { ids: [unico], kind };
  return null;
}

export function referenciasDe(prose: string, world: WorldModel): ReferenceHit[] {
  const found = mentions(prose, world);
  const hits: ReferenceHit[] = found.map((mention) => {
    const candidates = idsOf(mention);
    const decided = statusOf(candidates);
    return {
      token: mention.text,
      span: { start: mention.start, end: mention.end },
      status: decided.status,
      entityId: decided.entityId,
      candidates,
      evidence: [{ kind: mention.kind, text: mention.text, start: mention.start, end: mention.end }],
    };
  });
  for (const pronoun of pronouns(prose)) {
    const prior = found.filter((mention) => mention.end <= pronoun.start && !linhaDeclarada(prose, mention.start));
    let base = [...new Set(prior.flatMap(idsOf))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    let kind: ReferenceEvidence["kind"] = base.length === 1 ? "unica_mencao" : "mencoes";
    const fala = dentroDaFala(prose, pronoun.start, pronoun.end, prior);
    if (fala && fala.length > 0 && fala.length < base.length) {
      base = fala;
      kind = "discurso";
    }
    let narrowed = { ids: base, kind };
    if (pronoun.forma === "pessoa" || pronoun.forma === "homem" || pronoun.forma === "isso") {
      narrowed = narrowPronoun(prose, world, pronoun, prior, base, pronoun.forma !== "isso");
      if (kind === "discurso" && narrowed.ids.length === base.length) narrowed = { ids: base, kind: "discurso" };
    } else if (pronoun.forma === "objeto") {
      const objetos = base.filter((id) => world.get(id)?.tags.has("object"));
      narrowed = { ids: objetos, kind: "texto" };
    } else if (pronoun.forma === "amigo") {
      narrowed = { ids: amigosDe(world, base), kind: "grafo" };
    } else if (pronoun.forma === "la") {
      narrowed = lugaresDe(world, base);
    } else {
      narrowed = { ids: diasDe(prose, pronoun.start), kind: "grafo" };
    }
    if (pronoun.forma === "pessoa" || pronoun.forma === "homem" || pronoun.forma === "isso") {
      const foco = declarar(narrowed.ids, focoDe(prose, pronoun.start, world), "focalizacao");
      if (foco) narrowed = foco;
      const arco = declarar(narrowed.ids, arcoDe(prose, pronoun.start, world), "continuidade");
      if (arco) narrowed = arco;
    }
    const decided = statusOf(narrowed.ids);
    const cited = prior.filter((mention) => idsOf(mention).some((id) => narrowed.ids.includes(id)));
    const amostra = (cited.length ? cited : prior).slice(0, 1);
    hits.push({
      token: pronoun.text,
      span: { start: pronoun.start, end: pronoun.end },
      status: decided.status,
      entityId: decided.entityId,
      candidates: narrowed.ids,
      evidence: amostra.length
        ? amostra.map((mention) => ({ kind: narrowed.kind, text: mention.text, start: mention.start, end: mention.end }))
        : [{ kind: narrowed.kind, text: pronoun.text, start: pronoun.start, end: pronoun.end }],
    });
  }
  return hits.sort((a, b) => a.span.start - b.span.start || a.span.end - b.span.end);
}
