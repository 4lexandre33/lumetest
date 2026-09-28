import { hashString } from "./cache.ts";
import { anotacoesStartIndex } from "./annotations.ts";

export type ManuscriptSpan = { start: number; end: number };

export type ManuscriptSentence = ManuscriptSpan & { id: string; text: string };
export type ManuscriptParagraph = ManuscriptSpan & { id: string; text: string; sentences: ManuscriptSentence[] };
export type ManuscriptScene = ManuscriptSpan & { id: string; title: string; paragraphs: ManuscriptParagraph[] };
export type ManuscriptChapter = ManuscriptSpan & { id: string; title: string; scenes: ManuscriptScene[] };
export type ManuscriptBook = ManuscriptSpan & { id: string; title: string; chapters: ManuscriptChapter[] };

/** Leitura do caderno. `prose` é o texto recebido, sem reescrita. */
export type Manuscript = { prose: string; books: ManuscriptBook[] };

const COVER = /^(caderno|autora|autor|data|dedicatoria)\s*:/i;
const REGRAS = /^##\s+\/?regras\s*$/i;
const MOLDES = /^##\s+\/?moldes\s*$/i;

type Line = { text: string; start: number; end: number };

function linesOf(prose: string): { lines: Line[]; limit: number } {
  const parts = prose.split("\n");
  const lines: Line[] = [];
  let at = 0;
  for (let i = 0; i < parts.length; i++) {
    const text = parts[i] ?? "";
    const start = at;
    at += text.length;
    if (i < parts.length - 1) at += 1;
    lines.push({ text, start, end: start + text.length });
  }
  const cut = anotacoesStartIndex(prose);
  return { lines, limit: cut ?? lines.length };
}

function mint(seen: Map<string, number>, kind: string, key: string): string {
  const base = `${kind}-${hashString(key).slice(0, 6)}`;
  const n = seen.get(base) ?? 0;
  seen.set(base, n + 1);
  return n === 0 ? base : `${base}-${n + 1}`;
}

function sentencesOf(prose: string, span: ManuscriptSpan, seen: Map<string, number>): ManuscriptSentence[] {
  const text = prose.slice(span.start, span.end);
  const out: ManuscriptSentence[] = [];
  let i = 0;
  while (i < text.length) {
    while (i < text.length && /\s/.test(text[i]!)) i += 1;
    if (i >= text.length) break;
    let j = i;
    while (j < text.length && !/[.!?…]/.test(text[j]!)) j += 1;
    if (j < text.length) j += 1;
    const raw = text.slice(i, j);
    const trimmed = raw.trim();
    if (trimmed) {
      const lead = raw.length - raw.trimStart().length;
      const trail = raw.length - raw.trimEnd().length;
      out.push({
        id: mint(seen, "sentenca", trimmed),
        text: trimmed,
        start: span.start + i + lead,
        end: span.start + j - trail,
      });
    }
    i = j;
  }
  return out;
}

function paragraphOf(prose: string, lines: Line[], seen: Map<string, number>): ManuscriptParagraph | null {
  if (!lines.length) return null;
  const start = lines[0]!.start;
  const end = lines[lines.length - 1]!.end;
  const text = prose.slice(start, end).trim();
  if (!text) return null;
  const span = { start, end };
  return { id: mint(seen, "paragrafo", text), text, ...span, sentences: sentencesOf(prose, span, seen) };
}

type Scene = ManuscriptScene;
type Chapter = ManuscriptChapter;

function readBook(prose: string, lines: Line[], from: number, to: number, seen: Map<string, number>): ManuscriptBook {
  const chapters: Chapter[] = [];
  let title = "";
  let chapter: (Chapter & { section: boolean }) | null = null;
  let scene: Scene | null = null;
  let buffer: Line[] = [];

  const flushParagraph = () => {
    if (!scene) return;
    const paragraph = paragraphOf(prose, buffer, seen);
    buffer = [];
    if (paragraph) scene.paragraphs.push(paragraph);
  };
  const closeScene = (at: number) => {
    flushParagraph();
    if (!scene || !chapter) return;
    scene.end = at;
    chapter.scenes.push(scene);
    scene = null;
  };
  const closeChapter = (at: number) => {
    closeScene(at);
    if (!chapter) return;
    chapter.end = at;
    if (chapter.title || chapter.scenes.length) {
      const { section: _section, ...rest } = chapter;
      chapters.push(rest);
    }
    chapter = null;
  };
  const openScene = (sceneTitle: string, at: number) => {
    closeScene(at);
    scene = {
      id: mint(seen, "cena", `${chapter?.title ?? ""}\0${sceneTitle}`),
      title: sceneTitle,
      start: at,
      end: lines[to - 1]?.end ?? at,
      paragraphs: [],
    };
  };
  const openChapter = (chapterTitle: string, at: number, section: boolean) => {
    closeChapter(at);
    chapter = {
      id: mint(seen, "capitulo", chapterTitle),
      title: chapterTitle,
      start: at,
      end: lines[to - 1]?.end ?? at,
      scenes: [],
      section,
    };
    if (!section) openScene(chapterTitle, at);
  };

  for (let i = from; i < to; i++) {
    const line = lines[i]!;
    const trimmed = line.text.trim();
    if (REGRAS.test(trimmed) || MOLDES.test(trimmed)) {
      flushParagraph();
      const fence = REGRAS.test(trimmed) ? REGRAS : MOLDES;
      i += 1;
      while (i < to && !fence.test(lines[i]!.text.trim())) i += 1;
      continue;
    }
    if (/^##\s+/.test(trimmed) && !/^###/.test(trimmed)) {
      openChapter(trimmed.replace(/^##\s+/, "").trim(), line.start, true);
      continue;
    }
    if (/^###\s+/.test(trimmed)) {
      const name = trimmed.replace(/^###\s+/, "").trim();
      if (chapter?.section) openScene(name, line.start);
      else openChapter(name, line.start, false);
      continue;
    }
    if (!trimmed || COVER.test(trimmed) || trimmed.startsWith(">")) {
      if (/^caderno\s*:/i.test(trimmed)) title = trimmed.replace(/^caderno\s*:\s*/i, "").trim();
      flushParagraph();
      continue;
    }
    if (!chapter) openChapter("", line.start, false);
    if (!scene) openScene(chapter.title, line.start);
    buffer.push(line);
  }
  closeChapter(lines[Math.max(to - 1, from)]?.end ?? 0);
  const start = lines[from]?.start ?? 0;
  const end = lines[Math.max(to - 1, from)]?.end ?? start;
  return { id: mint(seen, "livro", title), title, start, end, chapters };
}

export function lerManuscrito(prose: string): Manuscript {
  const { lines, limit } = linesOf(prose);
  const seen = new Map<string, number>();
  const marks: number[] = [];
  for (let i = 0; i < limit; i++) {
    if (/^caderno\s*:/i.test(lines[i]!.text.trim())) marks.push(i);
  }
  const ranges: { from: number; to: number }[] = [];
  if (!marks.length) {
    if (limit > 0) ranges.push({ from: 0, to: limit });
  } else {
    for (let s = 0; s < marks.length; s++) ranges.push({ from: marks[s]!, to: s + 1 < marks.length ? marks[s + 1]! : limit });
  }
  return { prose, books: ranges.map((range) => readBook(prose, lines, range.from, range.to, seen)) };
}
