import { useEffect, useMemo, useState } from "react";
import { FBE_DRAWERS } from "../../narrative-engine/lib/types.ts";
import { useIdeStore } from "../../ide-state/lib/orchestrator.ts";
import { authorshipTimeline, changedSnaps, entityHistory, entityOrigin, leituraAte, snapDrawer } from "../lib/timeline.ts";
import { leisSempre, writeSuggestions, type WriteSuggestion } from "../lib/prose-triggers.ts";
import { aceitarProposta, decidirSempre, dosNaLinha, propostasAbertas } from "../lib/proposta.ts";
import { lerLivro, lerProsa } from "../lib/leitor.ts";
import { parseCadernoLibrary } from "../lib/pages.ts";
import { useNotebookView } from "./notebook-view.tsx";
import { cn } from "./cn.ts";

export function WritePreview() {
  const project = useIdeStore((s) => s.project);
  const writeAnnotationId = useIdeStore((s) => s.writeAnnotationId);
  const writePortrait = useIdeStore((s) => s.writePortrait);
  const writeLine = useIdeStore((s) => s.writeLine);
  const setWriteFocus = useIdeStore((s) => s.setWriteFocus);
  const setNotebooks = useIdeStore((s) => s.setNotebooks);
  const { bookIndex, cartao } = useNotebookView();
  const text = project?.notebooksSource ?? "";
  const entitiesSource = project?.entitiesSource ?? "";
  const playerId = project?.settings.playerEntityId || "@jogador";
  const entries = useMemo(() => authorshipTimeline(text, entitiesSource), [text, entitiesSource]);
  const leitura = useMemo(() => leituraAte(text, entitiesSource, writeLine), [text, entitiesSource, writeLine]);
  const prosa = useMemo(() => lerProsa(leitura.prose), [leitura]);
  const livro = useMemo(() => {
    const library = parseCadernoLibrary(text);
    const book = bookIndex == null ? null : library.books[bookIndex];
    if (!book) return lerLivro(text);
    return lerLivro(text, { start: book.startLine - 1, end: book.endLine });
  }, [text, bookIndex]);
  const [lendo, setLendo] = useState(false);
  const mundo = useMemo(
    () => [...leitura.world.values()].filter((entity) => !entity.tags.has("molde")).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    [leitura],
  );
  const selected = entries.find((item) => item.annotation.id === writeAnnotationId) ?? null;
  const player = leitura.world.get(playerId) ?? null;
  const focusId = selected?.entityId ?? (writePortrait ? playerId : null);
  const history = useMemo(() => entityHistory(entries, focusId), [entries, focusId]);
  const portrait = writePortrait ? selected?.after ?? player : null;
  const suggestions = useMemo(() => {
    if (writeLine == null) return [];
    return writeSuggestions(text, writeLine);
  }, [text, writeLine]);
  const [refused, setRefused] = useState<string[]>([]);
  const [avisoExtra, setAvisoExtra] = useState<string | null>(null);
  const sempre = useMemo(() => (writeLine == null ? [] : leisSempre(text, writeLine)), [text, writeLine]);
  const decisao = useMemo(
    () => decidirSempre(leitura.world, sempre, writeLine == null ? [] : dosNaLinha(text, writeLine)),
    [leitura, sempre, text, writeLine],
  );
  const propostas = useMemo(() => {
    if (writeLine == null) return [];
    const mine = refused.filter((key) => key.startsWith(`${writeLine}:`)).map((key) => key.slice(`${writeLine}:`.length));
    return propostasAbertas(suggestions, mine, dosNaLinha(text, writeLine));
  }, [suggestions, refused, text, writeLine]);
  const portraitOrigin = portrait ? entityOrigin(portrait.id, text, entitiesSource) : null;

  useEffect(() => {
    if (lendo || writeLine == null || !decisao.aplicar.length) return;
    let next = text;
    for (const rule of decisao.aplicar) {
      const result = aceitarProposta(next, writeLine, rule);
      if ("error" in result) {
        setAvisoExtra("A lei sempre não coube nesta linha.");
        return;
      }
      next = result.text;
    }
    if (next !== text) {
      setAvisoExtra(null);
      setNotebooks(next, { flush: true });
    }
  }, [decisao, lendo, text, writeLine, setNotebooks]);

  function aceitar(item: WriteSuggestion) {
    if (writeLine == null) return;
    const result = aceitarProposta(text, writeLine, item);
    if ("error" in result) return;
    setNotebooks(result.text, { flush: true });
    setWriteFocus(result.id);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper" aria-label="Leitura">
      <div className="flex items-center justify-between border-b border-border px-3 py-1">
        <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Leitura</p>
        <button type="button" className="text-sm text-muted hover:text-fg" onClick={() => setLendo((on) => !on)}>
          {lendo ? "Até aqui" : "Ler"}
        </button>
      </div>
      <section aria-label="Comando" className="border-b border-border px-3 py-2">
        <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Comando</p>
        {cartao ? (
          <>
            <p className="mt-1 text-sm text-fg">{cartao.titulo}</p>
            {cartao.linhas.length ? (
              <ul className="mt-1 space-y-0.5">
                {cartao.linhas.map((line) => (
                  <li key={line} className="text-sm text-muted">{line}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="mt-1 text-sm text-muted">—</p>
        )}
      </section>
      {lendo ? (
        <article aria-label="Livro" className="min-h-0 flex-1 overflow-auto px-3 py-3">
          <pre className="whitespace-pre-wrap font-display text-[15px] leading-snug text-fg">{livro || "—"}</pre>
        </article>
      ) : (
      <>
      <section aria-label="Texto até aqui" className="max-h-[46%] min-h-0 overflow-auto border-b border-border px-3 py-2">
        <p className="text-[10px] tracking-[0.14em] text-muted uppercase">
          {writeLine == null ? "Prosa" : `Prosa até a linha ${writeLine}`}
        </p>
        <pre className="mt-1 whitespace-pre-wrap font-display text-[15px] leading-snug text-fg">{prosa || "—"}</pre>
        <p className="mt-3 text-[10px] tracking-[0.14em] text-muted uppercase">Mundo desta linha</p>
        {mundo.length === 0 ? (
          <p className="mt-1 text-sm text-muted">Nenhuma entidade até aqui.</p>
        ) : (
          <ul className="mt-1 space-y-0.5">
            {mundo.map((entity) => (
              <li key={entity.id} className="truncate font-mono text-[11px] text-fg">
                {entity.id}
                {entity.name ? <span className="font-sans text-muted"> · {entity.name}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      {decisao.avisos.length || avisoExtra ? (
        <div className="border-b border-border px-3 py-2">
          <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Avisos</p>
          <ul className="mt-1 space-y-1">
            {decisao.avisos.map((aviso) => (
              <li key={aviso} className="text-sm text-fg">{aviso}</li>
            ))}
            {avisoExtra ? <li className="text-sm text-fg">{avisoExtra}</li> : null}
          </ul>
        </div>
      ) : null}
      {propostas.length ? (
        <div className="border-b border-border px-3 py-2">
          <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Propostas</p>
          <ul className="mt-1 space-y-1">
            {propostas.map((item) => (
              <li key={item.id} className="rounded-xs px-1.5 py-1">
                <span className="block truncate text-sm text-fg">{item.narrative || item.title}</span>
                {item.dos.length ? <span className="block truncate font-mono text-[11px] text-muted">{item.dos.join(" · ")}</span> : null}
                <span className="mt-1 flex gap-2">
                  <button type="button" className="text-sm text-fg hover:underline disabled:text-muted" disabled={!item.dos.length} onClick={() => aceitar(item)}>
                    Aceitar
                  </button>
                  <button
                    type="button"
                    className="text-sm text-muted hover:text-fg"
                    onClick={() => setRefused((list) => (writeLine == null || list.includes(`${writeLine}:${item.id}`) ? list : [...list, `${writeLine}:${item.id}`]))}
                  >
                    Recusar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {portrait ? (
        <div className="min-h-0 flex-1 overflow-auto px-3 py-2">
          <p className="font-mono text-sm tracking-[0.14em] text-syn-kw">{portrait.shortCode}</p>
          <p className="mt-0.5 text-[10px] tracking-[0.14em] text-muted uppercase">{portraitOrigin}</p>
          <p className="mt-1 font-mono text-[11px] text-fg">
            {portrait.slug || portrait.id}
            {portrait.name ? <span className="ml-2 font-sans text-muted">· {portrait.name}</span> : null}
          </p>
          {FBE_DRAWERS.map((drawer) => {
            const value = snapDrawer(portrait, drawer);
            if (!value) return null;
            return (
              <p key={drawer} className="mt-0.5 font-mono text-[11px] text-fg">
                <span className="text-subtle">{drawer}</span> {value}
              </p>
            );
          })}
          {portrait ? (
            <button type="button" className="mt-3 h-7 text-sm text-muted hover:text-fg" onClick={() => setWriteFocus(selected?.annotation.id ?? null, false)}>
              Voltar às mudanças
            </button>
          ) : null}
        </div>
      ) : selected ? (
        <div className="min-h-0 flex-1 overflow-auto px-3 py-2">
          <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Histórico</p>
          <ul className="mt-1 space-y-1">
            {history.map((entry) => {
              const snaps = changedSnaps(entry);
              return (
                <li key={entry.annotation.id}>
                  <button
                    type="button"
                    onClick={() => setWriteFocus(entry.annotation.id)}
                    className={cn(
                      "w-full rounded-xs px-1.5 py-1 text-left hover:bg-elevated",
                      selected.annotation.id === entry.annotation.id ? "bg-elevated" : "",
                    )}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-mono text-[11px] text-muted">L{entry.line ?? "—"}</span>
                      <span className="truncate font-mono text-[11px] text-fg">{entry.annotation.do}</span>
                    </span>
                    {snaps.map((snap) => (
                      <span key={snap.drawer} className="mt-0.5 block truncate font-mono text-[11px] text-subtle">
                        {snap.drawer} {snap.before || "—"} → {snap.after || "—"}
                      </span>
                    ))}
                  </button>
                </li>
              );
            })}
          </ul>
          {selected.after ? (
            <button
              type="button"
              className="mt-3 h-7 rounded-xs px-2.5 text-sm text-muted hover:bg-elevated hover:text-fg"
              onClick={() => setWriteFocus(selected.annotation.id, true)}
            >
              Ver entidade
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-3 py-3">
          {propostas.length ? null : <p className="text-sm text-muted">Sem mutação nesta linha.</p>}
          {player ? (
            <button
              type="button"
              className={cn("rounded-xs border border-border bg-surface px-3 py-2 text-left hover:bg-elevated")}
              onClick={() => setWriteFocus(null, true)}
            >
              <span className="block font-mono text-sm tracking-[0.14em] text-syn-kw">{player.shortCode}</span>
              <span className="mt-1 block text-sm text-muted">Ver entidade</span>
            </button>
          ) : null}
        </div>
      )}
      </>
      )}
    </div>
  );
}