import { useMemo, useState } from "react";
import { useIdeStore } from "../../ide-state/index.ts";
import { parseCadernoLibrary, replaceBookSource, appendCaderno } from "../lib/pages.ts";
import { addAnnotation, doFromDraft, nextAnnotationId, parseAnotacoesSlice } from "../lib/annotations.ts";
import { authorshipTimeline } from "../lib/timeline.ts";
import { NotebookEditor } from "./NotebookEditor.tsx";
import { useNotebookView } from "./notebook-view.tsx";
import { cn } from "./cn.ts";

function isCapa(id: string): boolean {
  return id === "capa" || id.endsWith(":capa");
}

export function NotebookTabstrip() {
  const setNotebooks = useIdeStore((s) => s.setNotebooks);
  const notebooks = useIdeStore((s) => s.project?.notebooksSource ?? "");
  const { bookIndex, setBookIndex } = useNotebookView();
  const library = useMemo(() => parseCadernoLibrary(notebooks), [notebooks]);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
      {library.books.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setBookIndex(item.index)}
          className={cn(
            "h-7 max-w-36 shrink-0 truncate rounded-xs px-2.5 text-sm",
            bookIndex === item.index ? "bg-elevated text-fg" : "text-muted hover:text-fg",
          )}
        >
          {item.cover.title || "Caderno"}
        </button>
      ))}
      <button
        type="button"
        aria-label="Novo caderno"
        className="h-7 w-7 shrink-0 rounded-xs text-lg leading-none text-muted hover:bg-elevated hover:text-fg"
        onClick={() => {
          const next = appendCaderno(notebooks);
          const lib = parseCadernoLibrary(next);
          setBookIndex(Math.max(0, lib.books.length - 1));
          setNotebooks(next);
        }}
      >
        +
      </button>
    </div>
  );
}

export function NotebookPane() {
  const project = useIdeStore((s) => s.project);
  const compiled = useIdeStore((s) => s.compiled);
  const setNotebooks = useIdeStore((s) => s.setNotebooks);
  const setWriteFocus = useIdeStore((s) => s.setWriteFocus);
  const setWriteLine = useIdeStore((s) => s.setWriteLine);
  const { bookIndex, setBookIndex } = useNotebookView();
  const text = project?.notebooksSource ?? "";
  const entitiesSource = project?.entitiesSource ?? "";
  const library = useMemo(() => parseCadernoLibrary(text), [text]);
  const book = bookIndex == null ? null : (library.books[bookIndex] ?? null);
  const [indexOpen, setIndexOpen] = useState(false);
  const slice = useMemo(() => {
    if (!book) return "";
    return text.replace(/^\uFEFF/, "").split(/\n/).slice(book.startLine - 1, book.endLine).join("\n");
  }, [text, book]);
  const entities = useMemo(() => (compiled ? [...compiled.worldModel.values()] : []), [compiled]);
  const rules = compiled?.rules ?? [];
  const entries = useMemo(() => authorshipTimeline(text, entitiesSource), [text, entitiesSource]);
  const bookAnnotations = useMemo(
    () => (book ? parseAnotacoesSlice(text).filter((item) => item.book === book.id) : []),
    [text, book],
  );

  if (!project) return null;

  if (!library.books.length || !book) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-bg px-6 text-center text-sm text-muted">
        Clique + para abrir um caderno.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-bg">
      {indexOpen ? (
        <nav className="w-44 shrink-0 overflow-auto border-r border-border bg-elevated px-3 py-3" aria-label="Índice">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Índice</p>
            <button type="button" className="text-sm text-muted hover:text-fg" onClick={() => setIndexOpen(false)}>
              Ocultar
            </button>
          </div>
          <ul className="mt-2 space-y-3">
            {library.books.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setBookIndex(item.index)}
                  className={cn(
                    "w-full rounded-xs px-1.5 py-1 text-left font-display text-sm hover:bg-surface",
                    book.index === item.index ? "bg-surface font-medium text-fg" : "text-fg",
                  )}
                >
                  {item.cover.title || "Caderno"}
                </button>
                <ul className="mt-1 space-y-1">
                  {item.toc
                    .filter((entry) => !isCapa(entry.id))
                    .map((entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => setBookIndex(item.index)}
                          className={cn("w-full rounded-xs px-1.5 py-1 text-left text-sm hover:bg-surface", entry.level === 3 ? "pl-3 text-muted" : "text-fg")}
                        >
                          {entry.title}
                        </button>
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <NotebookEditor
          value={slice}
          entities={entities}
          rules={rules}
          annotations={bookAnnotations}
          onShowIndex={() => setIndexOpen(true)}
          onShowTimeline={() => setWriteFocus(entries[0]?.annotation.id ?? null)}
          onSelectMark={(id) => setWriteFocus(id)}
          onCaretLine={(line) => setWriteLine(book.startLine + line - 1)}
          onShowLine={(line) => {
            setWriteLine(book.startLine + line - 1);
            setWriteFocus(null, false);
          }}
          onChange={(next, opts) => setNotebooks(replaceBookSource(text, book.id, next), opts)}
          lineBase={book.startLine}
          onBindMutation={(draft, heading) => {
            const line = doFromDraft(draft, entities.map((item) => item.id));
            if (!line) return;
            const existing = parseAnotacoesSlice(text);
            const id = nextAnnotationId(existing);
            setNotebooks(
              addAnnotation(text, {
                id,
                book: book.id,
                heading,
                quote: draft.quote,
                do: line,
                ...(draft.column != null ? { column: draft.column } : {}),
              }),
            );
            setWriteFocus(id);
          }}
        />
      </div>
    </div>
  );
}
