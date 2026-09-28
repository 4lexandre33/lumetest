import type { IPlugin, IPluginManifest } from "../../core/contracts/plugin-manifest.ts";
import type { PluginContext } from "../../core/contracts/plugin-context.ts";
import { abrirAutoria, ligarAutoria, type Autoria } from "./lib/autoria.ts";
import { AUTHORING_RUNTIME_MANIFEST } from "./manifest.ts";

export * from "./manifest.ts";
export * from "./lib/autoria.ts";

export type AuthoringRuntimeService = { abrir: typeof abrirAutoria };

export class AuthoringRuntimePlugin implements IPlugin {
  manifest: IPluginManifest = AUTHORING_RUNTIME_MANIFEST;
  context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  async activate(): Promise<void> {
    ligarAutoria({
      manuscrito: (prosa) => this.context.getService<{ ler: (prosa: string) => Autoria["manuscrito"] }>("Manuscript").ler(prosa),
      ir: (prosa) => this.context.getService<{ ler: (prosa: string) => Autoria["ir"] }>("NarrativeIr").ler(prosa),
      contexto: (prosa, offset, entities) => this.context.getService<{ daFrase: (prosa: string, offset: number, entities: string) => Autoria["contexto"] }>("SentenceContext").daFrase(prosa, offset, entities),
      diagnostico: (prosa, entities) => this.context.getService<{ ler: (prosa: string, entities: string) => Autoria["diagnostico"] }>("Diagnostico").ler(prosa, entities),
      propor: (prosa, offset, entities, world) => this.context.getService<{ propor: (prosa: string, offset: number, entities: string, world: Map<string, any>) => Autoria["proposta"] }>("AiRuntime").propor(prosa, offset, entities, world),
      mundo: (entities) => this.context.getService<{ compileEntities: (source: string) => { worldModel: Map<string, any> } }>("NarrativeEngine").compileEntities(entities).worldModel,
    });
    const api: AuthoringRuntimeService = { abrir: abrirAutoria };
    this.context.registerCapability({
      name: "AuthoringRuntime",
      version: "1.0.0",
      provider: this.manifest.name,
      api: api as never,
    });
  }

  async deactivate(): Promise<void> {
    ligarAutoria(null);
  }
}

export function createAuthoringRuntimePlugin(context: PluginContext): AuthoringRuntimePlugin {
  return new AuthoringRuntimePlugin(context);
}
