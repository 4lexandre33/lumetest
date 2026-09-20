import { useIdeStore } from "../../../ide-state/lib/orchestrator.ts";
import { playHud } from "../play.ts";
import { cn } from "../utils.ts";
import { PreviewPane } from "./PreviewPane.tsx";

export function ModeSwitch() {
  const ideMode = useIdeStore((s) => s.ideMode);
  const setIdeMode = useIdeStore((s) => s.setIdeMode);
  return (
    <div className="inline-flex shrink-0 items-center gap-2">
      <span className="hidden text-[10px] tracking-[0.14em] text-muted uppercase sm:inline">Modo</span>
      <div role="group" aria-label="Modo Escrita ou Modo Jogo" className="inline-flex shrink-0 rounded-xs border border-border p-0.5">
        <button
          type="button"
          aria-pressed={ideMode === "write"}
          aria-label="Modo Escrita"
          onClick={() => setIdeMode("write")}
          className={cn(
            "h-8 rounded-xs px-3 text-sm",
            ideMode === "write" ? "bg-elevated text-fg" : "text-muted hover:bg-elevated hover:text-fg",
          )}
        >
          Escrita
        </button>
        <button
          type="button"
          aria-pressed={ideMode === "play"}
          aria-label="Modo Jogo"
          onClick={() => setIdeMode("play")}
          className={cn(
            "h-8 rounded-xs px-3 text-sm",
            ideMode === "play" ? "bg-elevated text-fg" : "text-muted hover:bg-elevated hover:text-fg",
          )}
        >
          Jogo
        </button>
      </div>
    </div>
  );
}

export function PlaySkin() {
  const project = useIdeStore((s) => s.project);
  const game = useIdeStore((s) => s.game);
  const player = game?.worldModel.get(game.playerEntityId);
  const hud = playHud(project?.meta.name ?? "Jogo", game?.history.length ?? 0, player?.stats);

  return (
    <div className="relative flex h-dvh min-h-0 flex-col bg-paper text-fg">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-surface px-3">
        <span className="hidden text-[10px] tracking-[0.14em] text-muted uppercase sm:inline">Vista do jogador</span>
        <h1 className="min-w-0 truncate font-display text-xl">{hud.title}</h1>
        <span className="font-mono text-[11px] text-subtle">turno {hud.turn}</span>
        {hud.score != null ? <span className="font-mono text-[11px] text-subtle">score {hud.score}</span> : null}
        <div className="ml-auto">
          <ModeSwitch />
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <PreviewPane mode="play" />
      </div>
    </div>
  );
}
