import { useEffect, useMemo, useState } from "react";
import { FBE_DRAWERS } from "../../narrative-engine/index.ts";
import { useIdeStore } from "../../ide-state/index.ts";
import { authorshipTimeline, changedSnaps, entityHistory, entityOrigin, leituraAte, mapaDe, snapDrawer, type ArestaMapa } from "../lib/timeline.ts";
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
  const [lente, setLente] = useState<"agora" | "pessoa" | "avisos">("agora");
  const [pessoaId, setPessoaId] = useState<string | null>(null);
  const mundo = useMemo(
    () => [...leitura.world.values()].filter((entity) => !entity.tags.has("molde")).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    [leitura],
  );
  const mapa = useMemo(() => mapaDe(leitura.world), [leitura]);
  const selected = entries.find((item) => item.annotation.id === writeAnnotationId) ?? null;
  const player = leitura.world.get(playerId) ?? null;
  const focusId = pessoaId ?? selected?.entityId ?? (player ? playerId : null);
  const history = useMemo(() => {
    const all = entityHistory(entries, focusId);
    if (writeLine == null) return all;
    return all.filter((entry) => entry.line == null || entry.line <= writeLine);
  }, [entries, focusId, writeLine]);
  const mudou = useMemo(
    () => (writeLine == null ? [] : entries.filter((entry) => entry.line === writeLine)),
    [entries, writeLine],
  );
  const pessoa = focusId == null ? null : focusId === playerId ? player : leitura.world.get(focusId) ?? null;
  const portrait = writePortrait ? pessoa ?? selected?.after ?? player : null;
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
    if ("error" in result) {
      setAvisoExtra("A proposta não coube nesta linha.");
      return;
    }
    setNotebooks(result.text, { flush: true });
    setWriteFocus(result.id);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper" aria-label="Leitura">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1">
        <p className="min-w-0 truncate text-[10px] tracking-[0.14em] text-muted uppercase">O que é verdade nesta linha?</p>
        <button type="button" className="shrink-0 text-sm text-muted hover:text-fg" onClick={() => setLendo((on) => !on)}>
          {lendo ? "Até aqui" : "Ler"}
        </button>
      </div>
      {cartao ? (
        <section aria-label="Comando" className="border-b border-border px-3 py-2">
          <p className="text-sm text-fg">{cartao.titulo}</p>
          {cartao.linhas.length ? (
            <ul className="mt-1 space-y-0.5">
              {cartao.linhas.map((line) => (
                <li key={line} className="text-sm text-muted">{line}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
      {lendo ? (
        <article aria-label="Livro" className="min-h-0 flex-1 overflow-auto px-3 py-3">
          <pre className="whitespace-pre-wrap font-display text-[15px] leading-snug text-fg">{livro || "—"}</pre>
        </article>
      ) : (
        <>
          <div className="flex border-b border-border" role="tablist" aria-label="Nesta linha">
            {([
              ["agora", "Agora"],
              ["pessoa", "Esta pessoa"],
              ["avisos", "Avisos"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={lente === id}
                className={cn("h-8 flex-1 text-sm", lente === id ? "text-fg" : "text-muted hover:text-fg")}
                onClick={() => setLente(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {lente === "agora" ? (
            <div className="min-h-0 flex-1 overflow-auto">
              <section aria-label="Texto até aqui" className="border-b border-border px-3 py-2">
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
                      <li key={entity.id}>
                        <button
                          type="button"
                          className="w-full truncate text-left font-mono text-[11px] text-fg hover:underline"
                          onClick={() => setPessoaId(entity.id)}
                        >
                          {entity.id}
                          {entity.name ? <span className="font-sans text-muted"> · {entity.name}</span> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {mapa.nos.length ? <Mapa agora={mapa} onPick={setPessoaId} /> : null}
              </section>
              <section className="border-b border-border px-3 py-2">
                <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Nesta linha</p>
                {mudou.length === 0 ? (
                  <p className="mt-1 text-sm text-muted">Sem mutação nesta linha.</p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {mudou.map((entry) => (
                      <li key={entry.annotation.id}>
                        <button type="button" className="w-full text-left" onClick={() => setWriteFocus(entry.annotation.id)}>
                          <span className="block truncate font-mono text-[11px] text-fg">{entry.annotation.do}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              {decisao.aplicar.length ? (
                <section className="border-b border-border px-3 py-2">
                  <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Leis</p>
                  <ul className="mt-1 space-y-1">
                    {decisao.aplicar.map((rule) => (
                      <li key={rule.id} className="text-sm text-fg">{rule.narrative || rule.dos.join(" · ")}</li>
                    ))}
                  </ul>
                </section>
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
            </div>
          ) : null}
          {lente === "pessoa" ? (
            portrait ? (
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
                <button type="button" className="mt-3 h-7 text-sm text-muted hover:text-fg" onClick={() => setWriteFocus(selected?.annotation.id ?? null, false)}>
                  Voltar às mudanças
                </button>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto px-3 py-2">
                <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Histórico</p>
                {history.length === 0 ? (
                  <p className="mt-1 text-sm text-muted">Sem mudanças até aqui.</p>
                ) : (
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
                              selected?.annotation.id === entry.annotation.id ? "bg-elevated" : "",
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
                )}
                {player || selected?.after ? (
                  <button
                    type="button"
                    className="mt-3 h-7 rounded-xs px-2.5 text-sm text-muted hover:bg-elevated hover:text-fg"
                    onClick={() => setWriteFocus(selected?.annotation.id ?? null, true)}
                  >
                    Ver entidade
                  </button>
                ) : null}
              </div>
            )
          ) : null}
          {lente === "avisos" ? (
            <div className="min-h-0 flex-1 overflow-auto px-3 py-2">
              <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Avisos</p>
              {decisao.avisos.length || avisoExtra ? (
                <ul className="mt-1 space-y-1">
                  {decisao.avisos.map((aviso) => (
                    <li key={aviso} className="text-sm text-fg">{aviso}</li>
                  ))}
                  {avisoExtra ? <li className="text-sm text-fg">{avisoExtra}</li> : null}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted">Nada nesta linha.</p>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function Mapa({ agora, onPick }: { agora: { nos: string[]; arestas: ArestaMapa[] }; onPick: (id: string) => void }) {
  const n = agora.nos.length;
  const cx = 120;
  const cy = 78;
  const raio = n <= 1 ? 0 : 52;
  const pos = new Map(agora.nos.map((id, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 1);
    return [id, { x: cx + raio * Math.cos(ang), y: cy + raio * Math.sin(ang) }] as const;
  }));
  return (
    <div className="mt-3">
      <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Mapa</p>
      <svg width="240" height="156" viewBox="0 0 240 156" role="img" aria-label="Mapa" className="mt-1 max-w-full">
        {agora.arestas.map((edge) => {
          const a = pos.get(edge.de);
          const b = pos.get(edge.para);
          if (!a || !b) return null;
          return (
            <g key={`${edge.de}-${edge.nome}-${edge.para}-${edge.dura ? "d" : "b"}`}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--color-border)" strokeDasharray={edge.dura ? undefined : "3 3"} />
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2} textAnchor="middle" fill="var(--color-subtle)" fontSize={8}>
                {edge.nome}
              </text>
            </g>
          );
        })}
        {agora.nos.map((id) => {
          const p = pos.get(id);
          if (!p) return null;
          return (
            <g key={id} onClick={() => onPick(id)} style={{ cursor: "pointer" }}>
              <circle cx={p.x} cy={p.y} r={16} fill="var(--color-surface)" stroke="var(--color-border)" />
              <text x={p.x} y={p.y + 3} textAnchor="middle" fill="var(--color-fg)" fontSize={9} style={{ pointerEvents: "none" }}>
                {id.replace(/^@/, "")}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}