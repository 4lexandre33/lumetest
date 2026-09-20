import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useIdeStore } from "../../ide-state/lib/orchestrator.ts";
import { parseCadernoLibrary } from "../lib/pages.ts";

type NotebookView = {
  bookId: string | null;
  bookIndex: number | null;
  setBookIndex: (index: number | null) => void;
};

const Ctx = createContext<NotebookView | null>(null);

export function NotebookViewProvider({ children }: { children: ReactNode }) {
  const notebooks = useIdeStore((s) => s.project?.notebooksSource ?? "");
  const library = useMemo(() => parseCadernoLibrary(notebooks), [notebooks]);
  const [bookIndex, setBookIndex] = useState<number | null>(null);
  const count = library.books.length;
  const resolved = count === 0 ? null : bookIndex == null ? 0 : Math.min(Math.max(0, bookIndex), count - 1);
  const bookId = resolved == null ? null : `book-${resolved}`;
  return <Ctx.Provider value={{ bookId, bookIndex: resolved, setBookIndex }}>{children}</Ctx.Provider>;
}

export function useNotebookView(): NotebookView {
  const ctx = useContext(Ctx);
  if (!ctx) return { bookId: null, bookIndex: null, setBookIndex: () => undefined };
  return ctx;
}
