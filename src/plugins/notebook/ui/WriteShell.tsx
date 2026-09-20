import { FBE_DRAWERS, type FbeDrawer, type DrawerHost, type MutationDraft, type PhraseSuggestion, keysOfDrawer, linkTargets, enumStates, canUnset, isKnownLinkTarget, isLinkTarget, formatStatInput } from "../lib/write-menu.ts";
import { cn } from "./cn.ts";

const FIELD = "mt-1 h-8 w-full rounded-xs border border-border bg-surface px-2 text-sm text-fg outline-none";

function KeyField({
  draft,
  keys,
  label,
  onChange,
}: {
  draft: MutationDraft;
  keys: string[];
  label: string;
  onChange: (next: MutationDraft) => void;
}) {
  const listId = "lume-write-keys";
  return (
    <label className="mt-2 block text-[10px] tracking-[0.14em] text-muted uppercase">
      {label}
      <input
        className={FIELD}
        list={listId}
        value={draft.key}
        onChange={(e) => onChange({ ...draft, key: e.target.value })}
      />
      <datalist id={listId}>
        {keys.map((key) => (
          <option key={key} value={key} />
        ))}
      </datalist>
    </label>
  );
}

function ValueField({
  draft,
  entities,
  onChange,
}: {
  draft: MutationDraft;
  entities: DrawerHost[];
  onChange: (next: MutationDraft) => void;
}) {
  if (draft.drawer === "tags") return null;
  if (draft.drawer === "flags") {
    return (
      <div className="mt-2">
        <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Valor</p>
        <div className="mt-1 flex gap-1">
          {(["true", "false"] as const).map((bit) => (
            <button
              key={bit}
              type="button"
              onClick={() => onChange({ ...draft, value: bit })}
              className={cn("h-7 rounded-xs px-2.5 text-[11px]", draft.value === bit ? "bg-surface text-fg" : "text-muted hover:text-fg")}
            >
              {bit}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (draft.drawer === "hardLinks" || draft.drawer === "softLinks") {
    const ids = linkTargets(entities);
    return (
      <label className="mt-2 block text-[10px] tracking-[0.14em] text-muted uppercase">
        Destino
        <select
          className={FIELD}
          value={ids.includes(draft.value) ? draft.value : ""}
          onChange={(e) => onChange({ ...draft, value: e.target.value })}
        >
          <option value="">—</option>
          {ids.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <input
          className={cn(FIELD, "mt-1")}
          value={draft.value}
          placeholder="@jogador ou #A8F2"
          onChange={(e) => onChange({ ...draft, value: e.target.value })}
        />
      </label>
    );
  }
  if (draft.drawer === "lists") {
    return (
      <label className="mt-2 block text-[10px] tracking-[0.14em] text-muted uppercase">
        {draft.op === "unset" ? "Itens" : "Substituir lista"}
        <textarea
          className="mt-1 min-h-16 w-full resize-none rounded-xs border border-border bg-surface px-2 py-1.5 font-mono text-sm text-fg outline-none"
          value={draft.value}
          placeholder="A, B"
          onChange={(e) => onChange({ ...draft, value: e.target.value })}
        />
      </label>
    );
  }
  if (draft.drawer === "enums") {
    const states = enumStates(entities, draft.key);
    const listId = "lume-write-enum";
    return (
      <label className="mt-2 block text-[10px] tracking-[0.14em] text-muted uppercase">
        Estado
        <input
          className={FIELD}
          list={listId}
          value={draft.value}
          onChange={(e) => onChange({ ...draft, value: e.target.value })}
        />
        <datalist id={listId}>
          {states.map((state) => (
            <option key={state} value={state} />
          ))}
        </datalist>
      </label>
    );
  }
  if (draft.drawer === "stats") {
    return (
      <label className="mt-2 block text-[10px] tracking-[0.14em] text-muted uppercase">
        Valor
        <input
          className={FIELD}
          inputMode="decimal"
          value={draft.value}
          placeholder="10 ou 10[0..100]"
          onChange={(e) => onChange({ ...draft, value: e.target.value })}
        />
      </label>
    );
  }
  if (draft.drawer === "fuses") {
    return (
      <label className="mt-2 block text-[10px] tracking-[0.14em] text-muted uppercase">
        Turnos
        <input
          className={FIELD}
          value={draft.value}
          placeholder="3 ou 3>@boom"
          onChange={(e) => onChange({ ...draft, value: e.target.value })}
        />
      </label>
    );
  }
  return (
    <label className="mt-2 block text-[10px] tracking-[0.14em] text-muted uppercase">
      Valor
      <input
        className={FIELD}
        value={draft.value}
        onChange={(e) => onChange({ ...draft, value: e.target.value })}
      />
    </label>
  );
}

export function MutationSheet({
  entities,
  draft,
  onChange,
  onCancel,
  onStub,
}: {
  entities: DrawerHost[];
  draft: MutationDraft;
  onChange: (next: MutationDraft) => void;
  onCancel: () => void;
  onStub: (draft: MutationDraft) => void;
}) {
  const entity = entities.find((item) => item.id === draft.entityId);
  const keys = keysOfDrawer(entity, draft.drawer);
  const keyLabel = draft.drawer === "tags" ? "Tag" : draft.drawer === "lists" ? "Lista" : "Chave";
  const unsetOk = canUnset(draft);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg/70 p-4">
      <form
        className="w-full max-w-sm rounded-sm border border-border bg-elevated p-3 shadow-xl"
        onSubmit={(e) => {
          e.preventDefault();
          if ((draft.drawer === "hardLinks" || draft.drawer === "softLinks") && draft.op === "set") {
            const dest = draft.value.trim();
            if (!isLinkTarget(dest) || !isKnownLinkTarget(dest, linkTargets(entities))) return;
          }
          if (draft.drawer === "stats" && draft.op === "set" && !formatStatInput(draft.value)) return;
          onStub(draft);
        }}
      >
        <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Vincular mutação</p>
        {draft.quote ? <p className="mt-1 truncate font-mono text-[11px] text-subtle">«{draft.quote}»</p> : null}
        <p className="mt-2 text-[10px] tracking-[0.14em] text-muted uppercase">Alvo</p>
        <div className="mt-1 flex gap-1">
          {(["drawer", "world"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => onChange({ ...draft, kind, key: "", value: kind === "drawer" && draft.drawer === "flags" ? "true" : "" })}
              className={cn("h-7 rounded-xs px-2.5 text-[11px]", (draft.kind ?? "drawer") === kind ? "bg-surface text-fg" : "text-muted hover:text-fg")}
            >
              {kind === "drawer" ? "Gaveta" : "Entidade"}
            </button>
          ))}
        </div>
        {(draft.kind ?? "drawer") === "world" ? (
          <>
            <label className="mt-2 block text-[10px] tracking-[0.14em] text-muted uppercase">
              Id
              <input
                className={FIELD}
                value={draft.entityId}
                placeholder="@tocha"
                list="lume-write-ids"
                onChange={(e) => onChange({ ...draft, entityId: e.target.value.trim() })}
              />
              <datalist id="lume-write-ids">
                {entities.map((item) => (
                  <option key={item.id} value={item.id} />
                ))}
              </datalist>
            </label>
            {draft.op === "set" ? (
              <label className="mt-2 block text-[10px] tracking-[0.14em] text-muted uppercase">
                Tag
                <input
                  className={FIELD}
                  value={draft.key}
                  placeholder="object"
                  onChange={(e) => onChange({ ...draft, key: e.target.value })}
                />
              </label>
            ) : null}
            <p className="mt-2 text-[11px] text-muted">A mutação vai para a fatia. Não mexe no editor.</p>
          </>
        ) : (
          <>
            <label className="mt-2 block text-[10px] tracking-[0.14em] text-muted uppercase">
              Entidade
              <select
                className={FIELD}
                value={draft.entityId}
                onChange={(e) => onChange({ ...draft, entityId: e.target.value, key: "" })}
              >
                {entities.length === 0 ? <option value="">—</option> : null}
                {entities.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-2 text-[10px] tracking-[0.14em] text-muted uppercase">Gaveta</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {FBE_DRAWERS.filter((drawer) => drawer !== "struct").map((drawer) => (
                <button
                  key={drawer}
                  type="button"
                  onClick={() => onChange({ ...draft, drawer, key: "", value: drawer === "flags" ? "true" : "" })}
                  className={cn("h-7 rounded-xs px-2 text-[11px]", draft.drawer === drawer ? "bg-surface text-fg" : "text-muted hover:text-fg")}
                >
                  {drawer}
                </button>
              ))}
            </div>
          </>
        )}
        <p className="mt-2 text-[10px] tracking-[0.14em] text-muted uppercase">Polaridade</p>
        <div className="mt-1 flex gap-1">
          {(["set", "unset"] as const)
            .filter((op) => op === "set" || unsetOk)
            .map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => onChange({ ...draft, op })}
              className={cn("h-7 rounded-xs px-2.5 text-[11px]", draft.op === op ? "bg-surface text-fg" : "text-muted hover:text-fg")}
            >
              {op === "set" ? "Pôr" : "Tirar"}
            </button>
          ))}
        </div>
        {draft.into === "rule" ? <p className="mt-2 text-[11px] text-muted">Entra na regra.</p> : <p className="mt-2 text-[11px] text-muted">Entra no retrato.</p>}
        {(draft.kind ?? "drawer") === "drawer" ? (
          <>
            <KeyField draft={draft} keys={keys} label={keyLabel} onChange={onChange} />
            <ValueField draft={draft} entities={entities} onChange={onChange} />
          </>
        ) : null}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="h-7 rounded-xs px-2.5 text-sm text-muted hover:text-fg" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="h-7 rounded-xs bg-surface px-2.5 text-sm text-fg">
            Vincular
          </button>
        </div>
      </form>
    </div>
  );
}

export function PhraseSheet({
  phrases,
  onPick,
  onCancel,
}: {
  phrases: PhraseSuggestion[];
  onPick: (phrase: PhraseSuggestion) => void;
  onCancel: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg/70 p-4">
      <div className="flex max-h-[80%] w-full max-w-sm flex-col overflow-hidden rounded-sm border border-border bg-elevated shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Inserir frase</p>
          <button type="button" className="text-sm text-muted hover:text-fg" onClick={onCancel}>
            Fechar
          </button>
        </div>
        <ul className="min-h-0 flex-1 overflow-auto p-1">
          {phrases.length === 0 ? <li className="px-2 py-2 text-sm text-subtle">Sem frases no projecto.</li> : null}
          {phrases.map((phrase) => (
            <li key={phrase.id}>
              <button
                type="button"
                className="flex w-full flex-col gap-0.5 rounded-xs px-2 py-1.5 text-left hover:bg-surface"
                onClick={() => onPick(phrase)}
              >
                <span className="font-mono text-[11px] text-muted">{phrase.label}</span>
                <span className="truncate text-sm text-fg">{phrase.insert}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function emptyDraft(
  entityId: string,
  quote: string,
  line: number,
  drawer: FbeDrawer = "tags",
  extra?: { column?: number; into?: "rule" | "portrait" },
): MutationDraft {
  return { entityId, drawer, key: "", value: drawer === "flags" ? "true" : "", quote, line, op: "set", kind: "drawer", column: extra?.column, into: extra?.into };
}
