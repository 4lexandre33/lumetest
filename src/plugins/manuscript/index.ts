import type { IPlugin, IPluginManifest } from "../../core/contracts/plugin-manifest.ts";
import type { PluginContext } from "../../core/contracts/plugin-context.ts";
import { fundar, rever } from "./lib/fundacao.ts";
import { lerManuscrito } from "./lib/manuscript.ts";
import { MANUSCRIPT_MANIFEST } from "./manifest.ts";

export * from "./manifest.ts";
export * from "./lib/manuscript.ts";
export * from "./lib/fundacao.ts";

export type ManuscriptService = { ler: typeof lerManuscrito; fundar: typeof fundar; rever: typeof rever };

export class ManuscriptPlugin implements IPlugin {
  manifest: IPluginManifest = MANUSCRIPT_MANIFEST;
  context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  async activate(): Promise<void> {
    const api: ManuscriptService = { ler: lerManuscrito, fundar, rever };
    this.context.registerCapability({
      name: "Manuscript",
      version: "1.0.0",
      provider: this.manifest.name,
      api: api as never,
    });
  }

  async deactivate(): Promise<void> {}
}

export function createManuscriptPlugin(context: PluginContext): ManuscriptPlugin {
  return new ManuscriptPlugin(context);
}
