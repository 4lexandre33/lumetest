import { compileNotebook, slugOf, hashString, isRegrasFence, isMoldesFence, type NotebookCompile, type NotebookIssue } from "./notebook.ts";
import { anotacoesStartIndex, insertBeforeAnotacoes, stripAnotacoesSlice } from "./annotations.ts";

export type CadernoCover = {
  title: string;
  author: string;
  date: string;
  dedication: string;
};

export type CadernoTocItem = {
  id: string;
  level: 0 | 2 | 3;
  title: string;
  line: number;
  bookId?: string;
};

export type CadernoPage = {
  id: string;
  title: string;
  level: 0 | 2 | 3;
  body: string;
  comments: string[];
  startLine: number;
  endLine: number;
  bookId?: string;
};

export type CadernoView = {
  cover: CadernoCover;
  toc: CadernoTocItem[];
  pages: CadernoPage[];
};

export type CadernoBook = CadernoView & {
  id: string;
  index: number;
  startLine: number;
  endLine: number;
};

export type CadernoLibrary = {
  books: CadernoBook[];
  toc: CadernoTocItem[];
  pages: CadernoPage[];
};

const COVER_KEYS = /^(caderno|autora|autor|data|dedicatoria)\s*:/i;

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function commentsOf(body: string): string[] {
  const out: string[] = [];
  for (const raw of body.split(/\n/)) {
    const re = /\/\*\s*(.*?)\s*\*\//g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw))) {
      if (m[1]!.trim()) out.push(m[1]!.trim());
    }
  }
  return out;
}

function isMotorHash(line: string): boolean {
  const t = line.trim();
  if (/^#\s*---/.test(t)) return true;
  if (/^#[0-9A-Fa-f]{4}$/.test(t)) return true;
  return false;
}

function isCadernoLine(line: string): boolean {
  return /^caderno\s*:/.test(fold(line.trim()));
}

export function splitCadernoRanges(text: string): { start: number; end: number }[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\n/);
  const starts: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isCadernoLine(lines[i] ?? "")) starts.push(i);
  }
  if (!starts.length) {
    if (!text.trim()) return [];
    const sliceAt = anotacoesStartIndex(text);
    const end = sliceAt ?? lines.length;
    if (end <= 0) return [];
    return [{ start: 0, end }];
  }
  const ranges: { start: number; end: number }[] = [];
  let lead = 0;
  while (lead < starts[0]! && !(lines[lead] ?? "").trim()) lead += 1;
  if (lead < starts[0]!) ranges.push({ start: 0, end: starts[0]! });
  for (let s = 0; s < starts.length; s++) {
    ranges.push({ start: starts[s]!, end: s + 1 < starts.length ? starts[s + 1]! : lines.length });
  }
  const sliceAt = anotacoesStartIndex(text);
  if (sliceAt != null) {
    for (const range of ranges) {
      if (range.end > sliceAt) range.end = sliceAt;
    }
    return ranges.filter((range) => range.start < range.end);
  }
  return ranges;
}

function parseSlice(lines: string[], start: number, end: number, bookId?: string): CadernoView {
  const cover: CadernoCover = { title: "", author: "", date: "", dedication: "" };
  let i = start;
  while (i < end) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();
    if (!trimmed) {
      i += 1;
      continue;
    }
    if (isMotorHash(trimmed) || isCadernoLine(trimmed)) {
      if (isCadernoLine(trimmed) || COVER_KEYS.test(fold(trimmed))) {
        /* fall through to cover keys */
      } else {
        i += 1;
        continue;
      }
    }
    const folded = fold(trimmed);
    if (COVER_KEYS.test(folded)) {
      const value = trimmed.replace(/^[^:]+:\s*/, "").trim();
      if (folded.startsWith("caderno")) cover.title = value;
      else if (folded.startsWith("autora") || folded.startsWith("autor")) cover.author = value;
      else if (folded.startsWith("data")) cover.date = value;
      else if (folded.startsWith("dedicatoria")) cover.dedication = value;
      i += 1;
      continue;
    }
    break;
  }

  type Head = { line: number; level: 2 | 3; title: string };
  const heads: Head[] = [];
  let mold = false;
  for (let n = i; n < end; n++) {
    const trimmed = (lines[n] ?? "").trim();
    if (isCadernoLine(trimmed)) break;
    if (isMoldesFence(trimmed)) {
      mold = !/\/moldes/i.test(trimmed);
      continue;
    }
    if (mold) continue;
    if (/^###\s+/.test(trimmed)) {
      heads.push({ line: n + 1, level: 3, title: trimmed.replace(/^###\s+/, "").trim() });
    } else if (/^##\s+/.test(trimmed) && !isRegrasFence(trimmed)) {
      heads.push({ line: n + 1, level: 2, title: trimmed.replace(/^##\s+/, "").trim() });
    }
  }

  const pages: CadernoPage[] = [];
  const capaId = bookId ? `${bookId}:capa` : "capa";
  const toc: CadernoTocItem[] = [{ id: capaId, level: 0, title: cover.title || "Capa", line: start + 1, bookId }];

  const pageEnd = (index: number): number => {
    const next = heads[index + 1];
    return next ? next.line - 1 : end;
  };

  for (let h = 0; h < heads.length; h++) {
    const head = heads[h]!;
    const last = pageEnd(h);
    const bodyLines: string[] = [];
    let hide = false;
    for (let n = head.line; n < last; n++) {
      const raw = lines[n] ?? "";
      const trimmed = raw.trim();
      if (isMoldesFence(trimmed)) {
        hide = !/\/moldes/i.test(trimmed);
        continue;
      }
      if (hide || isMotorHash(trimmed) || isCadernoLine(trimmed)) continue;
      if (/^###\s+/.test(trimmed) || (/^##\s+/.test(trimmed) && !/^###/.test(trimmed))) continue;
      bodyLines.push(raw);
    }
    const localId = `${head.level}-${slugOf(head.title) || `p${head.line}`}`;
    const id = bookId ? `${bookId}:${localId}` : localId;
    const body = bodyLines.join("\n").replace(/^\n+/, "").replace(/\n+$/, "");
    pages.push({
      id,
      title: head.title,
      level: head.level,
      body,
      comments: commentsOf(body),
      startLine: head.line,
      endLine: last,
      bookId,
    });
    toc.push({ id, level: head.level, title: head.title, line: head.line, bookId });
  }

  if (!pages.length) {
    const rest = lines
      .slice(i, end)
      .filter((line) => !isMotorHash(line.trim()) && !isCadernoLine(line) && !COVER_KEYS.test(fold(line.trim())))
      .join("\n")
      .replace(/^\n+/, "")
      .replace(/\n+$/, "");
    const paginaId = bookId ? `${bookId}:pagina` : "pagina";
    pages.push({
      id: paginaId,
      title: cover.title || "Página",
      level: 0,
      body: rest,
      comments: commentsOf(rest),
      startLine: i + 1,
      endLine: end,
      bookId,
    });
    if (rest) toc.push({ id: paginaId, level: 0, title: "Página", line: i + 1, bookId });
  }

  return { cover, toc, pages };
}

export function parseCadernoLibrary(text: string): CadernoLibrary {
  const lines = text.replace(/^\uFEFF/, "").split(/\n/);
  const ranges = splitCadernoRanges(text);
  const books: CadernoBook[] = ranges.map((range, index) => {
    const id = `book-${index}`;
    const view = parseSlice(lines, range.start, range.end, ranges.length > 1 ? id : undefined);
    return {
      ...view,
      id,
      index,
      startLine: range.start + 1,
      endLine: range.end,
    };
  });
  const toc = books.flatMap((book) => book.toc);
  const pages = books.flatMap((book) => book.pages);
  return { books, toc, pages };
}

export function parseCadernoView(text: string): CadernoView {
  const lines = text.replace(/^\uFEFF/, "").split(/\n/);
  const range = splitCadernoRanges(text)[0] ?? { start: 0, end: lines.length };
  return parseSlice(lines, range.start, range.end);
}

function coverBlock(cover: CadernoCover): string {
  const lines: string[] = [];
  if (cover.title) lines.push(`CADERNO: ${cover.title}`);
  else lines.push("CADERNO:");
  if (cover.author) lines.push(`Autora: ${cover.author}`);
  if (cover.date) lines.push(`Data: ${cover.date}`);
  return lines.join("\n");
}

function replaceCoverAt(text: string, cover: CadernoCover, start: number, end: number): string {
  const lines = text.replace(/^\uFEFF/, "").split(/\n/);
  let i = start;
  while (i < end) {
    const trimmed = (lines[i] ?? "").trim();
    if (!trimmed || COVER_KEYS.test(fold(trimmed)) || isMotorHash(trimmed)) {
      i += 1;
      continue;
    }
    break;
  }
  const head = coverBlock(cover);
  const next = [...lines.slice(0, start), ...head.split(/\n/), ...lines.slice(i)];
  return next.join("\n");
}

export function replaceCover(text: string, cover: CadernoCover, bookId?: string): string {
  const lib = parseCadernoLibrary(text);
  const book = bookId ? lib.books.find((item) => item.id === bookId) : lib.books[0];
  if (!book) {
    const head = coverBlock(cover);
    return text.trim() ? `${head}\n\n${text.replace(/^\n+/, "")}` : `${head}\n`;
  }
  const lines = text.replace(/^\uFEFF/, "").split(/\n/);
  return replaceCoverAt(text, cover, book.startLine - 1, book.endLine === lines.length ? lines.length : book.endLine);
}

export function replacePage(text: string, pageId: string, body: string): string {
  const lib = parseCadernoLibrary(text);
  const page = lib.pages.find((item) => item.id === pageId) ?? parseCadernoView(text).pages.find((item) => item.id === pageId);
  if (!page) {
    const trimmed = body.replace(/\n+$/, "");
    if (!text.trim()) return trimmed ? `${trimmed}\n` : "";
    return text;
  }
  if (page.level === 0 && (page.id === "pagina" || page.id.endsWith(":pagina"))) {
    const book = lib.books.find((item) => item.id === page.bookId) ?? lib.books[0];
    const cover = book?.cover ?? parseCadernoView(text).cover;
    const head = coverBlock(cover);
    const next = body.replace(/\n+$/, "");
    if (!book || book.index === 0) {
      if (!head) return next ? `${next}\n` : "";
      return next ? `${head}\n\n${next}\n` : `${head}\n`;
    }
  }
  const lines = text.replace(/^\uFEFF/, "").split(/\n/);
  const headingIndex = page.startLine - 1;
  const after = page.endLine;
  const nextBody = body.replace(/\n+$/, "");
  const rebuilt = [...lines.slice(0, headingIndex + 1), ...(nextBody ? nextBody.split(/\n/) : []), ...lines.slice(after)];
  return rebuilt.join("\n");
}

export function nowCadernoStamp(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function appendCaderno(text: string, title = "", now?: Date): string {
  const stamp = nowCadernoStamp(now);
  const head = title.trim() ? `CADERNO: ${title.trim()}\nData: ${stamp}` : `CADERNO:\nData: ${stamp}`;
  if (!stripAnotacoesSlice(text).trim()) {
    const slice = text.indexOf("# --- lume-anotacoes ---");
    if (slice >= 0) return insertBeforeAnotacoes(text, head);
    return `${head}\n`;
  }
  return insertBeforeAnotacoes(text, head);
}

export function replaceBookSource(text: string, bookId: string, next: string): string {
  const lib = parseCadernoLibrary(text);
  const book = lib.books.find((item) => item.id === bookId);
  if (!book) return next;
  const lines = text.replace(/^\uFEFF/, "").split(/\n/);
  const start = book.startLine - 1;
  const end = book.endLine;
  const slice = next.split(/\n/);
  return [...lines.slice(0, start), ...slice, ...lines.slice(end)].join("\n");
}

export const CADERNO_SLICE_START = "# --- lume-caderno ---";
export const CADERNO_SLICE_END = "# --- /lume-caderno ---";

export function isCadernoSliceMarker(line: string): boolean {
  return /^#\s*---\s*\/?lume-caderno\s*---\s*$/.test(line.trim());
}

export function stripCadernoSlice(source: string): string {
  const start = source.indexOf(CADERNO_SLICE_START);
  if (start < 0) return source;
  const end = source.indexOf(CADERNO_SLICE_END, start);
  const before = source.slice(0, start).replace(/\n+$/, "");
  const after = end < 0 ? "" : source.slice(end + CADERNO_SLICE_END.length).replace(/^\n+/, "");
  if (!before) return after;
  if (!after) return before.endsWith("\n") ? before : `${before}\n`;
  return `${before}\n\n${after}`.replace(/\n+$/, "\n");
}

export function extractCadernoSlice(source: string): string | null {
  const start = source.indexOf(CADERNO_SLICE_START);
  if (start < 0) return null;
  const end = source.indexOf(CADERNO_SLICE_END, start);
  if (end < 0) return source.slice(start + CADERNO_SLICE_START.length).trim();
  return source.slice(start + CADERNO_SLICE_START.length, end).trim();
}

function sliceTouched(source: string, compiled: string): boolean {
  const prev = extractCadernoSlice(source);
  if (prev == null) return false;
  return prev !== compiled.trim();
}

function entityIdsOf(source: string): string[] {
  const ids: string[] = [];
  for (const raw of source.split(/\n/)) {
    const m = raw.trim().match(/^(@?[\p{L}_][\p{L}\p{N}\p{M}_]*)\s*\.\s*\{/u);
    if (m?.[1]) ids.push(m[1]);
  }
  return ids;
}

function ruleIdsOf(source: string): string[] {
  const ids: string[] = [];
  for (const raw of source.split(/\n/)) {
    const trimmed = raw.trim();
    if (!trimmed.startsWith("#")) continue;
    if (isCadernoSliceMarker(trimmed)) continue;
    if (/^#\s*kit:/i.test(trimmed)) continue;
    const id = trimmed.slice(1).trim().replace(/\s+/g, "_");
    if (id) ids.push(id);
  }
  return ids;
}

function dropEntityIds(source: string, drop: Set<string>): string {
  if (!drop.size) return source;
  const lines = source.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = (lines[i] ?? "").trim();
    const block = trimmed.match(/^(@?[\p{L}_][\p{L}\p{N}\p{M}_]*)\s*\.\s*\{(.*)$/u);
    if (block && drop.has(block[1]!)) {
      if ((block[2] ?? "").includes("}")) {
        i += 1;
        continue;
      }
      i += 1;
      while (i < lines.length && !(lines[i] ?? "").includes("}")) i += 1;
      i += 1;
      continue;
    }
    out.push(lines[i] ?? "");
    i += 1;
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

function dropRuleIds(source: string, drop: Set<string>): string {
  if (!drop.size) return source;
  const lines = source.split("\n");
  const out: string[] = [];
  let skipping = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (isCadernoSliceMarker(trimmed) || /^#\s*kit:/i.test(trimmed)) {
      skipping = false;
      out.push(line);
      continue;
    }
    if (trimmed.startsWith("#")) {
      const id = trimmed.slice(1).trim().replace(/\s+/g, "_");
      skipping = drop.has(id);
      if (skipping) continue;
    }
    if (!trimmed) {
      skipping = false;
      out.push(line);
      continue;
    }
    if (skipping) continue;
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

function overlapIds(handwritten: string, compiled: string, idsOf: (source: string) => string[]): string[] {
  const have = new Set(idsOf(stripCadernoSlice(handwritten)));
  return idsOf(compiled).filter((id) => have.has(id));
}

function w031(id: string): NotebookIssue {
  return {
    severity: "warning",
    code: "W031",
    message: `«${id}» também está à mão acima da fatia.`,
  };
}

function ensurePadBeforeStart(base: string): string {
  const lines = base.split("\n");
  let lastStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^start\(\)\s*$/.test(lines[i]!.trim())) lastStart = i;
  }
  if (lastStart < 0) return base;
  let lastNonEmpty = lastStart;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i]!.trim()) {
      lastNonEmpty = i;
      break;
    }
  }
  if (lastNonEmpty !== lastStart) return base;
  if (lastStart === 0) return base;
  if (lines[lastStart - 1]!.trim() === "") return base;
  lines.splice(lastStart, 0, "");
  return lines.join("\n");
}

export function writeCadernoSlice(handwritten: string, compiled: string): string {
  const base = stripCadernoSlice(handwritten).replace(/\n+$/, "");
  if (!compiled.trim()) return base ? `${base}\n` : "";
  const slice = `${CADERNO_SLICE_START}\n${compiled.trim()}\n${CADERNO_SLICE_END}\n`;
  if (!base) return slice;
  return `${ensurePadBeforeStart(base)}\n\n${slice}`;
}

export type NotebookProjectSlice = {
  entitiesSource: string;
  rulesSource: string;
  taxonomySource: string;
  extras: Record<string, Record<string, string>>;
  notebooksSource: string;
  meta: { name: string };
};

const W030: NotebookIssue = {
  severity: "warning",
  code: "W030",
  message: "Editaste a fatia do caderno no motor; o caderno voltou a escrevê-la.",
};

export function applyNotebookToProject<T extends NotebookProjectSlice>(project: T): T {
  return applyNotebookToProjectWithIssues(project).project;
}

export function bookSource(text: string, book: CadernoBook): string {
  const lines = text.replace(/^\uFEFF/, "").split("\n");
  return lines.slice(book.startLine - 1, book.endLine).join("\n");
}

export function notebooksHash(source: string): string {
  return hashString(source ?? "");
}

function joinCompiled(chunks: string[]): string {
  return chunks.map((chunk) => chunk.trim()).filter(Boolean).join("\n\n");
}

export function mergeNotebookCompiles(parts: NotebookCompile[]): NotebookCompile {
  if (!parts.length) return { ...EMPTY };
  const tax = new Set<string>();
  for (const part of parts) {
    for (const line of part.taxonomySource.split(/\n/)) {
      const t = line.trim();
      if (t) tax.add(t);
    }
  }
  const extras: Record<string, Record<string, string>> = {};
  for (const part of parts) Object.assign(extras, part.extras);
  return {
    entitiesSource: joinCompiled(parts.map((part) => part.entitiesSource)),
    rulesSource: joinCompiled(parts.map((part) => part.rulesSource)),
    taxonomySource: tax.size ? `${[...tax].join("\n")}\n` : "",
    extras,
    patterns: joinCompiled(parts.map((part) => part.patterns)),
    issues: parts.flatMap((part) => part.issues),
    dirty: parts.flatMap((part) => part.dirty),
  };
}

const EMPTY: NotebookCompile = {
  entitiesSource: "",
  rulesSource: "",
  taxonomySource: "",
  extras: {},
  patterns: "",
  issues: [],
  dirty: [],
};

export async function compileCadernoLibraryAsync(text: string): Promise<NotebookCompile> {
  const books = parseCadernoLibrary(text).books;
  if (books.length <= 1) return compileNotebook(text);
  const parts = await Promise.all(books.map((book) => Promise.resolve().then(() => compileNotebook(bookSource(text, book)))));
  return mergeNotebookCompiles(parts);
}

function applyCompiledToProject<T extends NotebookProjectSlice>(
  project: T,
  text: string,
  nb: NotebookCompile,
): { project: T; issues: NotebookIssue[] } {
  const first = parseCadernoLibrary(text).books[0]?.cover.title ?? "";
  const entityDups = overlapIds(project.entitiesSource, nb.entitiesSource, entityIdsOf);
  const ruleDups = overlapIds(project.rulesSource, nb.rulesSource, ruleIdsOf);
  const entitiesBase = dropEntityIds(stripCadernoSlice(project.entitiesSource), new Set(entityDups));
  const rulesBase = dropRuleIds(stripCadernoSlice(project.rulesSource), new Set(ruleDups));
  const taxBase = stripCadernoSlice(project.taxonomySource);
  const touched =
    sliceTouched(project.entitiesSource, nb.entitiesSource) ||
    sliceTouched(project.rulesSource, nb.rulesSource) ||
    sliceTouched(project.taxonomySource, nb.taxonomySource);
  const issues = [...entityDups, ...ruleDups].map(w031);
  if (touched) issues.push({ ...W030 });
  return {
    project: {
      ...project,
      entitiesSource: writeCadernoSlice(entitiesBase, nb.entitiesSource),
      rulesSource: writeCadernoSlice(rulesBase, nb.rulesSource),
      taxonomySource: writeCadernoSlice(taxBase, nb.taxonomySource),
      extras: { ...nb.extras, ...project.extras },
      meta: { ...project.meta, name: first || project.meta.name },
    },
    issues,
  };
}

export function applyNotebookToProjectWithIssues<T extends NotebookProjectSlice>(
  project: T,
): { project: T; issues: NotebookIssue[] } {
  const text = project.notebooksSource ?? "";
  if (!text.trim()) {
    return {
      project: {
        ...project,
        entitiesSource: stripCadernoSlice(project.entitiesSource),
        rulesSource: stripCadernoSlice(project.rulesSource),
        taxonomySource: stripCadernoSlice(project.taxonomySource),
      },
      issues: [],
    };
  }
  return applyCompiledToProject(project, text, compileNotebook(text));
}

export async function applyNotebookToProjectWithIssuesAsync<T extends NotebookProjectSlice>(
  project: T,
): Promise<{ project: T; issues: NotebookIssue[] }> {
  const text = project.notebooksSource ?? "";
  if (!text.trim()) return applyNotebookToProjectWithIssues(project);
  const nb = await compileCadernoLibraryAsync(text);
  return applyCompiledToProject(project, text, nb);
}
