import { isSystemEntityId, type WorldModel } from "../../narrative-engine/index.ts";

export type ReferenceStatus = "resolvido" | "ambiguo" | "nao_resolvido";

export type ReferenceEvidence = {
  kind: "nome" | "id" | "unica_mencao" | "mencoes";
  text: string;
  start: number;
  end: number;
};

/** Sem candidato único, `entityId` fica null. O pronome não inventa gênero. */
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

function pronouns(prose: string): { start: number; end: number; text: string }[] {
  const re = /(^|[^\p{L}\p{N}_])(ele|ela)(?=[^\p{L}\p{N}_]|$)/giu;
  const out: { start: number; end: number; text: string }[] = [];
  for (const match of prose.matchAll(re)) {
    const start = (match.index ?? 0) + (match[1]?.length ?? 0);
    const text = match[2] ?? "";
    out.push({ start, end: start + text.length, text });
  }
  return out;
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
    const prior = found.filter((mention) => mention.end <= pronoun.start);
    const candidates = [...new Set(prior.flatMap(idsOf))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const decided = statusOf(candidates);
    const kind = decided.status === "resolvido" ? "unica_mencao" : "mencoes";
    hits.push({
      token: pronoun.text,
      span: { start: pronoun.start, end: pronoun.end },
      status: decided.status,
      entityId: decided.entityId,
      candidates,
      evidence: prior.map((mention) => ({ kind, text: mention.text, start: mention.start, end: mention.end })),
    });
  }
  return hits.sort((a, b) => a.span.start - b.span.start || a.span.end - b.span.end);
}
