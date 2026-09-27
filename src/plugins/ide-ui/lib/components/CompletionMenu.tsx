import { cn } from "../utils.ts";
import type { MenuSeal } from "../completion-menu.ts";

export type CompletionMenuItem = {
  id: string;
  label: string;
  detail: string;
  seal: MenuSeal;
};

export function CompletionMenu({
  items,
  active,
  left,
  top,
  onPick,
}: {
  items: CompletionMenuItem[];
  active: number;
  left: number;
  top: number;
  onPick: (index: number) => void;
}) {
  if (!items.length) return null;
  return (
    <div
      role="listbox"
      aria-label="Sugestões"
      className="absolute z-20 w-80 overflow-hidden rounded-md border border-border bg-elevated shadow-xl"
      style={{ left, top }}
    >
      <ul className="max-h-56 overflow-auto p-1 text-sm">
        {items.map((item, i) => (
          <li key={item.id} role="option" aria-selected={i === active}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(i);
              }}
              className={cn(
                "flex w-full items-start justify-between gap-3 rounded-xs px-2 py-1.5 text-left",
                i === active ? "bg-surface" : "hover:bg-surface/60",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-fg">{item.label}</span>
                <span className="block truncate text-[11px] text-muted">{item.detail}</span>
              </span>
              <span className="shrink-0 pt-0.5 text-[10px] tracking-[0.12em] text-subtle uppercase">{item.seal}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
