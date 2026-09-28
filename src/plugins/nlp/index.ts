/**
 * Lume NLP Plugin
 * Phrase → intent.*. Last in the pipeline. Fail-closed. Does not match ON/IF.
 */

import type { IPlugin, IPluginManifest } from "../../core/contracts/plugin-manifest.ts";
import type { PluginContext } from "../../core/contracts/plugin-context.ts";
import type { IntentEngineService } from "../intent-engine/types.ts";
import type { VocabService } from "../vocab/types.ts";
import { NLP_MANIFEST } from "./manifest.ts";
import { interpret, splitPhrases } from "./lib/nlp.ts";
import { nlpComando } from "./lib/command.ts";
import { ligarIr, nlpProsa } from "./lib/prose.ts";
import { definirModelo } from "./lib/model-provider.ts";
import type { NlpService } from "./types.ts";

export * from "./manifest.ts";
export * from "./types.ts";
export * from "./lib/nlp.ts";
export * from "./lib/command.ts";
export * from "./lib/prose.ts";
export * from "./lib/model-provider.ts";

export class NlpPlugin implements IPlugin {
  manifest: IPluginManifest = NLP_MANIFEST;
  context: PluginContext;
  private unregister: (() => void) | null = null;
  private service: NlpService;

  constructor(context: PluginContext) {
    this.context = context;
    this.service = { interpret, splitPhrases, comando: nlpComando, prosa: nlpProsa, definirModelo };
  }

  async activate(): Promise<void> {
    this.context.logger.info("Activating Lume NLP Plugin...");
    this.context.getService<VocabService>("Vocab");
    ligarIr((prose) => this.context.getService<{ ler: (prose: string) => { prose: string; version: string; acts: { operation: string; text: string }[] } }>("NarrativeIr").ler(prose));
    const intent = this.context.getService<IntentEngineService>("IntentEngine");
    this.unregister = intent.registerPhraseMapper((text, game, scopeFn) => {
      const snap = scopeFn?.(game.worldModel, game.playerEntityId);
      return interpret(text, game.worldModel, snap);
    });
    this.context.registerCapability({
      name: "Nlp",
      version: "1.0.0",
      provider: this.manifest.name,
      api: this.service as any,
    });
    this.context.logger.info("Lume NLP Plugin activated.");
  }

  async deactivate(): Promise<void> {
    this.unregister?.();
    this.unregister = null;
    this.context.logger.info("Lume NLP Plugin deactivated.");
  }

  getService(): NlpService {
    return this.service;
  }
}

export function createNlpPlugin(context: PluginContext): IPlugin {
  return new NlpPlugin(context);
}
