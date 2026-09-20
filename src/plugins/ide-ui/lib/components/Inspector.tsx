import { useMemo } from "react";
import { query, entityDisplayName, inheritedTags, explainMatcher, parseMatcher, formatStat, findEntityByQuad, type CompiledTaxonomy, type Entity, type StatValue } from "../../../narrative-engine/lib/index.ts";
import { useIdeStore } from "../../../ide-state/lib/orchestrator.ts";
import { cn } from "../utils.ts";

const CHIPS = ["*.place", "*.object", "*.agent", "*.monster", "@jogador", "*.object.current_location=@jogador"];

function TagChip({ tag, inherited, onClick }: { tag: string; inherited?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xs border px-1.5 py-0.5 font-mono text-[11px]",
        inherited ? "border-dashed border-border text-subtle" : "border-border bg-elevated text-syn-tag",
      )}
    >
      {tag}
    </button>
  );
}

function DrawerLine({ label, value, cls }: { label: string; value: string; cls: string }) {
  if (!value) return null;
  return (
    <p className={cn("mt-0.5 font-mono text-[11px]", cls)}>
      <span className="text-subtle">{label}</span> {value}
    </p>
  );
}

function formatRecord(record: Record<string, string | number | boolean> | undefined): string {
  if (!record) return "";
  return Object.entries(record)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
}

function formatStats(stats: Record<string, StatValue>): string {
  return Object.entries(stats)
    .map(([k, v]) => `${k}=${formatStat(v)}`)
    .join(", ");
}

function EntityCard({ entity, taxonomy }: { entity: Entity; taxonomy?: CompiledTaxonomy | null }) {
  const revealTag = useIdeStore((s) => s.revealTag);
  const inherited = inheritedTags(entity, taxonomy);
  const flags = formatRecord(entity.flags);
  const enums = formatRecord(entity.enums);
  const phrases = formatRecord(entity.phrases);
  const hard = formatRecord(entity.hardLinks);
  const soft = formatRecord(entity.softLinks);
  const lists = Object.entries(entity.lists)
    .map(([k, v]) => `${k}=[${v.join(", ")}]`)
    .join(", ");
  const fuses = Object.entries(entity.fuses)
    .map(([k, v]) => `${k}=${v.remaining}${v.targetId ? `→${v.targetId}` : ""}`)
    .join(", ");
  const struct = Object.entries(entity.struct)
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(", ");
  return (
    <div className="rounded-xs border border-border bg-surface px-3 py-2">
      <p className="font-mono text-sm tracking-[0.14em] text-syn-kw">{entity.shortCode}</p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {[...entity.tags].map((t) => (
          <TagChip key={t} tag={t} onClick={() => revealTag(t)} />
        ))}
        {inherited.map((t) => (
          <TagChip key={t} tag={t} inherited onClick={() => revealTag(t)} />
        ))}
        {entity.tags.size === 0 && inherited.length === 0 ? <span className="font-mono text-[11px] text-subtle">sem tags</span> : null}
      </div>
      <p className="mt-1.5 font-mono text-[11px] text-fg">
        {entity.slug || entity.id}
        {entity.name ? <span className="ml-2 font-sans text-muted">· {entity.name}</span> : null}
      </p>
      {entity.description ? <p className="mt-0.5 text-[11px] text-muted">{entity.description}</p> : null}
      <DrawerLine label="stats" value={formatStats(entity.stats)} cls="text-syn-stat" />
      <DrawerLine label="flags" value={flags} cls="text-syn-tag" />
      <DrawerLine label="enums" value={enums} cls="text-syn-kw" />
      <DrawerLine label="phrases" value={phrases} cls="text-muted" />
      <DrawerLine label="hardLinks" value={hard} cls="text-syn-link" />
      <DrawerLine label="softLinks" value={soft} cls="text-syn-link" />
      <DrawerLine label="lists" value={lists} cls="text-syn-stat" />
      <DrawerLine label="fuses" value={fuses} cls="text-warn" />
      <DrawerLine label="struct" value={struct} cls="text-subtle" />
      <p className="mt-1.5 font-mono text-[10px] text-subtle">
        id {entity.systemId}
        {entity.templateId ? ` · template ${entity.templateId}` : ""}
      </p>
    </div>
  );
}

export function Inspector() {
  const game = useIdeStore((s) => s.game);
  const compiled = useIdeStore((s) => s.compiled);
  const inspectorQuery = useIdeStore((s) => s.inspectorQuery);
  const setInspectorQuery = useIdeStore((s) => s.setInspectorQuery);
  const inspectorMode = useIdeStore((s) => s.inspectorMode);
  const setInspectorMode = useIdeStore((s) => s.setInspectorMode);
  const revealEntity = useIdeStore((s) => s.revealEntity);

  const world = game?.worldModel ?? compiled?.worldModel;
  const taxonomy = game?.taxonomy ?? compiled?.taxonomy;
  const result = useMemo(() => {
    if (!world || !inspectorQuery.trim()) return { hits: [] as string[], err: null as string | null };
    const raw = inspectorQuery.trim();
    if (/^#?[0-9A-Fa-f]{4}$/.test(raw) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
      const hit = findEntityByQuad(world, raw);
      return { hits: hit ? [hit.id] : [], err: null };
    }
    try {
      const rows = query(inspectorQuery.trim(), world, game?.lastInteractionId ?? "", taxonomy, inspectorMode);
      return { hits: rows.map(([id]) => id), err: null };
    } catch (e) {
      return { hits: [] as string[], err: e instanceof Error ? e.message : "consulta inválida" };
    }
  }, [world, taxonomy, inspectorQuery, game?.lastInteractionId, inspectorMode]);

  const selected = useIdeStore((s) => s.selectedEntityId);
  const selectedEntity = selected && world ? world.get(selected) : undefined;
  const trace = useMemo(() => {
    if (!selectedEntity || !world || !inspectorQuery.trim() || result.err) return null;
    try {
      return explainMatcher(parseMatcher(inspectorQuery.trim()), selectedEntity.id, world, game?.lastInteractionId ?? "", taxonomy, inspectorMode);
    } catch {
      return null;
    }
  }, [selectedEntity, world, inspectorQuery, result.err, taxonomy, inspectorMode, game?.lastInteractionId]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-[10px] tracking-[0.14em] text-muted uppercase">Depurar · mundo</span>
        <span className="font-mono text-[11px] text-subtle">{world?.size ?? 0} entidades</span>
      </div>
      {selectedEntity ? (
        <div className="shrink-0 border-b border-border p-3">
          <p className="mb-1 text-[10px] tracking-[0.14em] text-subtle uppercase">Selecionada</p>
          <EntityCard entity={selectedEntity} taxonomy={taxonomy} />
          {trace ? (
            <div className="mt-2 rounded-xs border border-border px-3 py-2">
              <p className="text-[10px] tracking-[0.14em] text-subtle uppercase">
                {trace.matched ? "Casa" : "Não casa"} · {inspectorMode === "direct" ? "direta" : "efetiva"}
              </p>
              <ul className="mt-1 space-y-0.5 font-mono text-[11px]">
                {trace.clauses.map((c, i) => (
                  <li key={i} className={c.matched ? "text-ok" : "text-muted"}>
                    {c.source}
                    {c.path && c.path.length > 1 ? <span className="text-subtle"> · {c.path.join(" → ")}</span> : null}
                    <span className="ml-1 text-subtle">{c.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="border-b border-border px-3 py-2">
        <input
          value={inspectorQuery}
          onChange={(e) => setInspectorQuery(e.target.value)}
          placeholder="consulta: *.place  ·  #A8F2  ·  @jogador.medo>4"
          className="h-8 w-full rounded-xs border border-border bg-surface px-2 font-mono text-sm text-fg placeholder:text-subtle"
        />
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setInspectorQuery(c)}
              className={cn("rounded-xs border px-2 py-1 font-mono text-[11px]", inspectorQuery === c ? "border-primary text-fg" : "border-border text-muted hover:text-fg")}
            >
              {c}
            </button>
          ))}
          <span className="ml-auto flex rounded-xs border border-border">
            {(
              [
                ["effective", "Efetiva"],
                ["direct", "Direta"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setInspectorMode(id)}
                className={cn("px-2 py-1 text-[11px]", inspectorMode === id ? "bg-elevated text-fg" : "text-muted hover:text-fg")}
              >
                {label}
              </button>
            ))}
          </span>
        </div>
        {result.err ? <p className="mt-1 text-[11px] text-danger">{result.err}</p> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {inspectorQuery.trim() ? (
          <>
            <p className="mb-1 text-[10px] tracking-[0.14em] text-subtle uppercase">
              {result.hits.length} resultado{result.hits.length === 1 ? "" : "s"}
            </p>
            <ul className="space-y-1">
              {result.hits.map((id) => (
                <li key={id}>
                  <button type="button" onClick={() => revealEntity(id)} className="w-full rounded-xs px-2 py-1.5 text-left text-sm hover:bg-surface">
                    {world ? entityDisplayName(world, id) : id} <span className="font-mono text-xs text-subtle">{id}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-subtle">Uma consulta lista quem casa agora. Efetiva vê os pais da taxonomia; Direta só a tag escrita na entidade.</p>
        )}
      </div>
    </div>
  );
}
