import type { IPlugin, IPluginManifest } from "../../core/contracts/plugin-manifest.ts";
import type { PluginContext } from "../../core/contracts/plugin-context.ts";
import { definirPoliticaIa, definirProvider, ligarAi, propor } from "./lib/runtime.ts";
import { AI_RUNTIME_MANIFEST } from "./manifest.ts";

export * from "./manifest.ts";
export * from "./lib/runtime.ts";

export type AiRuntimeService = {
  definirProvider: typeof definirProvider;
  definirPoliticaIa: typeof definirPoliticaIa;
  propor: typeof propor;
};

export class AiRuntimePlugin implements IPlugin {
  manifest: IPluginManifest = AI_RUNTIME_MANIFEST;
  context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  async activate(): Promise<void> {
    ligarAi({
      daFrase: (prosa, offset, entities) => this.context.getService<{ daFrase: (prosa: string, offset: number, entities: string) => { text: string; cena: { title: string } } | null }>("SentenceContext").daFrase(prosa, offset, entities),
      descer: (origem, doLine, world, prose) => this.context.getService<{ descerMutacao: (origem: "modelo", doLine: string, world: Map<string, any>, prose: string) => { ok: boolean; prose: string; world: Map<string, any> } }>("MutationGateway").descerMutacao(origem, doLine, world, prose),
    });
    const api: AiRuntimeService = { definirProvider, definirPoliticaIa, propor };
    this.context.registerCapability({
      name: "AiRuntime",
      version: "1.0.0",
      provider: this.manifest.name,
      api: api as never,
    });
  }

  async deactivate(): Promise<void> {
    ligarAi(null);
  }
}

export function createAiRuntimePlugin(context: PluginContext): AiRuntimePlugin {
  return new AiRuntimePlugin(context);
}
