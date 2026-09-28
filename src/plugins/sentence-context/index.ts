import type { IPlugin, IPluginManifest } from "../../core/contracts/plugin-manifest.ts";
import type { PluginContext } from "../../core/contracts/plugin-context.ts";
import { contextoDaFrase } from "./lib/contexto.ts";
import { SENTENCE_CONTEXT_MANIFEST } from "./manifest.ts";

export * from "./manifest.ts";
export * from "./lib/contexto.ts";

export type SentenceContextService = { daFrase: typeof contextoDaFrase };

export class SentenceContextPlugin implements IPlugin {
  manifest: IPluginManifest = SENTENCE_CONTEXT_MANIFEST;
  context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  async activate(): Promise<void> {
    const api: SentenceContextService = { daFrase: contextoDaFrase };
    this.context.registerCapability({
      name: "SentenceContext",
      version: "1.0.0",
      provider: this.manifest.name,
      api: api as never,
    });
  }

  async deactivate(): Promise<void> {}
}

export function createSentenceContextPlugin(context: PluginContext): SentenceContextPlugin {
  return new SentenceContextPlugin(context);
}
