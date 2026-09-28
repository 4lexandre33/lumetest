import type { IPluginManifest } from "../../core/contracts/plugin-manifest.ts";

export const AI_RUNTIME_MANIFEST: IPluginManifest = {
  name: "lume-ai-runtime",
  version: "1.0.0",
  description: "Provider, contexto, proposta e política. A resposta desce à gateway.",
  author: "Lume Architecture Platform",

  capabilities: {
    provides: [{ name: "AiRuntime", version: "1.0.0" }],
  },

  requires: {
    mandatory: [
      { name: "SentenceContext", version: "1.0.0" },
      { name: "MutationGateway", version: "1.0.0" },
      { name: "NarrativeEngine", version: "1.0.0" },
    ],
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
