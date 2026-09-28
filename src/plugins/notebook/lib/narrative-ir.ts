import { hashString } from "./cache.ts";
import { lerManuscrito } from "./manuscript.ts";

/** Versão do contrato. A IR não é mutação nem gaveta. */
export const IR_VERSION = { major: 1, minor: 0, label: "1.0" } as const;

export type IrOperation =
  | "represent"
  | "describe"
  | "enunciate"
  | "expose"
  | "evaluate"
  | "interiorize"
  | "structure"
  | "focalize";

export type NarrativeAct = {
  id: string;
  version: typeof IR_VERSION.label;
  operation: IrOperation;
  text: string;
  span: { start: number; end: number };
};

export type NarrativeIr = {
  version: typeof IR_VERSION.label;
  major: number;
  minor: number;
  prose: string;
  acts: NarrativeAct[];
};

function hasWord(text: string, words: readonly string[]): boolean {
  return words.some((word) => new RegExp(`(^|[^\\p{L}])${word}([^\\p{L}]|$)`, "iu").test(text));
}

export function operationOf(text: string): Exclude<IrOperation, "structure"> {
  const trimmed = text.trim();
  if (/^[«"—]/.test(trimmed) || /[»"]$/.test(trimmed)) return "enunciate";
  if (hasWord(trimmed, ["pensou", "sentiu", "lembrou", "temia"])) return "interiorize";
  if (hasWord(trimmed, ["viu", "descobriu", "revelou"])) return "expose";
  if (hasWord(trimmed, ["devia", "deveria", "queria"])) return "evaluate";
  if (hasWord(trimmed, ["segundo", "aos olhos"])) return "focalize";
  if (hasWord(trimmed, ["era", "estava", "havia", "parecia"])) return "describe";
  return "represent";
}

function mint(seen: Map<string, number>, key: string): string {
  const base = `acto-${hashString(key).slice(0, 6)}`;
  const n = seen.get(base) ?? 0;
  seen.set(base, n + 1);
  return n === 0 ? base : `${base}-${n + 1}`;
}

function headingSpan(prose: string, start: number): { start: number; end: number } {
  const nl = prose.indexOf("\n", start);
  return { start, end: nl < 0 ? prose.length : nl };
}

export function lerIr(prose: string): NarrativeIr {
  const manuscript = lerManuscrito(prose);
  const seen = new Map<string, number>();
  const acts: NarrativeAct[] = [];
  const push = (operation: IrOperation, span: { start: number; end: number }, key: string) => {
    const text = prose.slice(span.start, span.end);
    if (!text.trim()) return;
    acts.push({ id: mint(seen, `${operation}\0${key}`), version: IR_VERSION.label, operation, text, span });
  };
  for (const book of manuscript.books) {
    if (book.title) push("structure", headingSpan(prose, book.start), `livro\0${book.title}`);
    for (const chapter of book.chapters) {
      if (chapter.title) push("structure", headingSpan(prose, chapter.start), `capitulo\0${chapter.title}`);
      for (const scene of chapter.scenes) {
        if (scene.title && scene.start !== chapter.start) push("structure", headingSpan(prose, scene.start), `cena\0${scene.title}`);
        for (const paragraph of scene.paragraphs) {
          for (const sentence of paragraph.sentences) {
            push(operationOf(sentence.text), { start: sentence.start, end: sentence.end }, sentence.text);
          }
        }
      }
    }
  }
  acts.sort((a, b) => a.span.start - b.span.start || a.span.end - b.span.end);
  return { version: IR_VERSION.label, major: IR_VERSION.major, minor: IR_VERSION.minor, prose, acts };
}

export function mapaDaIr(ir: NarrativeIr) {
  const byId = new Map(ir.acts.map((act) => [act.id, act]));
  return {
    actToSource(id: string): { start: number; end: number; text: string } | null {
      const act = byId.get(id);
      if (!act) return null;
      return { start: act.span.start, end: act.span.end, text: ir.prose.slice(act.span.start, act.span.end) };
    },
    sourceToActs(offset: number): NarrativeAct[] {
      return ir.acts.filter((act) => offset >= act.span.start && offset < act.span.end);
    },
  };
}
