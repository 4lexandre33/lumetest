import type { IPluginManifest } from "../../core/contracts/plugin-manifest.ts";

export const MUTATION_GATEWAY_MANIFEST: IPluginManifest = {
  name: "lume-mutation-gateway",
  version: "1.0.0",
  description: "A única porta de mutação. O do: continua a ser a mutação.",
  author: "Lume Architecture Platform",

  capabilities: {
    provides: [{ name: "MutationGateway", version: "1.0.0" }],
  },

  requires: {
    mandatory: [{ name: "NarrativeEngine", version: "1.0.0" }],
  },

  hooks: {
    init: async () => {},
    destroy: async () => {},
  },

  permissions: {
    storage: "none",
    network: "none",
    events: [],
  },
};
