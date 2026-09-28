import { applyChanges, parseDoLine } from "./rule-engine.ts";
import type { ChangeAST, WorldModel } from "./types.ts";
import { cloneWorldModel } from "./world-model.ts";
import { worldPort, type WorldPort } from "./world-port.ts";

/** O `do:` é a mutação. Não é a interpretação da frase. */
export type MutationPolicy = {
  allow(doLine: string): boolean;
};

export const allowMutation: MutationPolicy = { allow: () => true };

export type MutationDecision = {
  ok: boolean;
  error?: string;
  world: WorldModel;
  prose: string;
  undo?: () => { world: WorldModel; prose: string };
};

function triggerOf(change: ChangeAST): string {
  if (change.target.kind === "id") return change.target.id;
  return "";
}

export function mutationGateway(port: WorldPort, policy: MutationPolicy = allowMutation) {
  return {
    submit(doLine: string, prose: string, aplicar = true): MutationDecision {
      const before = cloneWorldModel(port.current());
      const refuse = (error: string): MutationDecision => ({ ok: false, error, world: before, prose });
      let change: ChangeAST | undefined;
      try {
        const parsed = parseDoLine(doLine);
        change = parsed.change;
        if (!change) return refuse("do: não é mutação de mundo");
      } catch (err) {
        return refuse(err instanceof Error ? err.message : "do: inválido");
      }
      if (!policy.allow(doLine)) return refuse("política recusou");
      if (!aplicar) return { ok: true, world: before, prose };
      try {
        const next = applyChanges(before, [change], triggerOf(change));
        port.replace(next);
        return {
          ok: true,
          world: next,
          prose,
          undo: () => {
            const restored = cloneWorldModel(before);
            port.replace(restored);
            return { world: restored, prose };
          },
        };
      } catch (err) {
        return refuse(err instanceof Error ? err.message : "do: inválido");
      }
    },
  };
}

export type OrigemMutacao = "intent" | "comando" | "modelo";

export type PoliticaComOrigem = {
  allow(doLine: string, origem: OrigemMutacao): boolean;
};

let politicaAtual: PoliticaComOrigem = { allow: () => true };

export function definirPolitica(policy: PoliticaComOrigem | null): void {
  politicaAtual = policy ?? { allow: () => true };
}

/** Intent, comando e modelo usam esta função. Não há outra porta. */
export function descerMutacao(origem: OrigemMutacao, doLine: string, world: WorldModel, prose: string, aplicar = true): MutationDecision {
  return mutationGateway(worldPort(world), {
    allow: (line) => politicaAtual.allow(line, origem),
  }).submit(doLine, prose, aplicar);
}
