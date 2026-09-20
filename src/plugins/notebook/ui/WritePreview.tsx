import { useMemo, useState } from "react";
import { FBE_DRAWERS } from "../../narrative-engine/lib/types.ts";
import { useIdeStore } from "../../ide-state/lib/orchestrator.ts";
import { authorshipBaseWorld, authorshipTimeline, changedSnaps, entityHistory, entityOrigin, snapDrawer } from "../lib/timeline.ts";
import { writeSuggestions } from "../lib/prose-triggers.ts";
import { cn } from "./cn.ts";

export function WritePreview() {
  const project = useIdeStore((s) => s.project);
  const writeAnnotationId = useIdeStore((s) => s.writeAnnotationId);
  const writePortrait = useIdeStore((s) => s.writePortrait);
  const writeLine = useIdeStore((s) => s.writeLine);
  const setWriteFocus = useIdeStore((s) => s.setWriteFocus);
  const text = project?.notebooksSource ?? "";
  const entitiesSource = project?.entitiesSource ?? "";
  const playerId = project?.settings.playerEntityId || "@jogador";
  const entries = useMemo(() => authorshipTimeline(text, entitiesSource), [text, entitiesSource]);
  const selected = entries.find((item) => item.annotation.id === writeAnnotationId) ?? null;
  const player = useMemo(() => authorshipBaseWorld(text, entitiesSource).get(playerId) ?? null, [text, entitiesSource, playerId]);
  const focusId = selected?.entityId ?? (writePortrait ? playerId : null);
  const history = useMemo(() => entityHistory(entries, focusId), [entries, focusId]);
  const portrait = writePortrait ? selected?.after ?? player : null;
  const suggestions = useMemo(() => {
    if (writeLine == null) return [];
    return writeSuggestions(text, writeLine);
  }, [text, writeLine]);
  const portraitOrigin = portrait ? entityOrigin(portrait.id, text, entitiesSource) : null;
  const [picked, setPicked] = useState<string | null>(null);
  const chosen = suggestions.find((item) => item.id === picked) ?? suggestions[0] ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper" aria-label="Preview da escrita">
      <div className="flex items-center justify-between border-b border-border px-3 py-1">
        <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Escrita</p>
        {selected ? (
          <span className="truncate font-mono text-[11px] text-subtle">{selected.entityId ?? "—"}</span>
        ) : null}
      </div>
      {suggestions.length ? (
        <div className="border-b border-border px-3 py-2">
          <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Sugestões</p>
          <ul className="mt-1 space-y-1">
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setPicked(item.id)}
                  className={cn(
                    "w-full rounded-xs px-1.5 py-1 text-left hover:bg-elevated",
                    chosen?.id === item.id ? "bg-elevated" : "",
                  )}
                >
                  <span className="block truncate text-sm text-fg">{item.narrative || item.title}</span>
                  {item.dos.length ? <span className="block truncate font-mono text-[11px] text-muted">{item.dos.join(" · ")}</span> : null}
                </button>
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
          {suggestions.length ? null : <p className="text-sm text-muted">Sem mutação nesta linha.</p>}
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
    </div>
  );
}