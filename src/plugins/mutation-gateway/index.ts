import type { IPlugin, IPluginManifest } from "../../core/contracts/plugin-manifest.ts";
import type { PluginContext } from "../../core/contracts/plugin-context.ts";
import { MUTATION_GATEWAY_MANIFEST } from "./manifest.ts";
import { definirPolitica, descerMutacao, mutationGateway } from "./lib/gateway.ts";
import type { MutationGatewayService } from "./types.ts";

export * from "./manifest.ts";
export * from "./types.ts";
export * from "./lib/gateway.ts";

export class MutationGatewayPlugin implements IPlugin {
  manifest: IPluginManifest = MUTATION_GATEWAY_MANIFEST;
  context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  async activate(): Promise<void> {
    const api: MutationGatewayService = { descerMutacao, definirPolitica, mutationGateway };
    this.context.registerCapability({
      name: "MutationGateway",
      version: "1.0.0",
      provider: this.manifest.name,
      api: api as never,
      methods: ["descerMutacao", "definirPolitica", "mutationGateway"],
    });
    this.context.registerHandler({
      capability: "MutationGateway",
      version: "1.0.0",
      method: "descerMutacao",
      provider: this.manifest.name,
      handle: (payload) => {
        const body = payload as { origem: Parameters<typeof descerMutacao>[0]; doLine: string; world: Parameters<typeof descerMutacao>[2]; prose: string; aplicar?: boolean };
        return descerMutacao(body.origem, body.doLine, body.world, body.prose, body.aplicar);
      },
    });
  }

  async deactivate(): Promise<void> {}
}

export function createMutationGatewayPlugin(context: PluginContext): MutationGatewayPlugin {
  return new MutationGatewayPlugin(context);
}
