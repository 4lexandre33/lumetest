/**
 * Lume Vocab Plugin
 * Dictionary + grammar lines. Verb table in V1. Does not interpret phrases.
 */

import type { IPlugin, IPluginManifest } from "../../core/contracts/plugin-manifest.ts";
import type { PluginContext } from "../../core/contracts/plugin-context.ts";
import { VOCAB_MANIFEST } from "./manifest.ts";
import { lines, lookup } from "./lib/vocab.ts";
import type { VocabService } from "./types.ts";

export * from "./manifest.ts";
export * from "./types.ts";
export * from "./lib/vocab.ts";
export * from "./lib/verbs.ts";
export * from "./lib/language.ts";
export * from "./lib/grammar.ts";
export * from "./lib/tokens.ts";

export class VocabPlugin implements IPlugin {
  manifest: IPluginManifest = VOCAB_MANIFEST;
  context: PluginContext;
  private service: VocabService;

  constructor(context: PluginContext) {
    this.context = context;
    this.service = { lookup, lines };
  }

  async activate(): Promise<void> {
    this.context.logger.info("Activating Lume Vocab Plugin...");
    this.context.registerCapability({
      name: "Vocab",
      version: "1.0.0",
      provider: this.manifest.name,
      api: this.service as any,
    });
    this.context.logger.info("Lume Vocab Plugin activated.");
  }

  async deactivate(): Promise<void> {
    this.context.logger.info("Lume Vocab Plugin deactivated.");
  }

  getService(): VocabService {
    return this.service;
  }
}

export function createVocabPlugin(context: PluginContext): IPlugin {
  return new VocabPlugin(context);
}
