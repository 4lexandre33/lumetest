import type { IPlugin, IPluginManifest } from "../../core/contracts/plugin-manifest.ts";
import type { PluginContext } from "../../core/contracts/plugin-context.ts";
import { grafoDe } from "./lib/grafo.ts";
import { cronologiaDe } from "./lib/cronologia.ts";
import { NARRATIVE_GRAPH_MANIFEST } from "./manifest.ts";

export * from "./manifest.ts";
export * from "./lib/grafo.ts";
export * from "./lib/cronologia.ts";

export type NarrativeGraphService = { grafoDe: typeof grafoDe; cronologiaDe: typeof cronologiaDe };

export class NarrativeGraphPlugin implements IPlugin {
  manifest: IPluginManifest = NARRATIVE_GRAPH_MANIFEST;
  context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  async activate(): Promise<void> {
    const api: NarrativeGraphService = { grafoDe, cronologiaDe };
    this.context.registerCapability({
      name: "NarrativeGraph",
      version: "1.0.0",
      provider: this.manifest.name,
      api: api as never,
    });
  }

  async deactivate(): Promise<void> {}
}

export function createNarrativeGraphPlugin(context: PluginContext): NarrativeGraphPlugin {
  return new NarrativeGraphPlugin(context);
}
