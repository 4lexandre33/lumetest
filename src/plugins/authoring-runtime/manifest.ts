import type { IPluginManifest } from "../../core/contracts/plugin-manifest.ts";

export const AUTHORING_RUNTIME_MANIFEST: IPluginManifest = {
  name: "lume-authoring-runtime",
  version: "1.0.0",
  description: "Manuscrito, IR, contexto, diagnóstico, proposta e história. O caderno não coordena.",
  author: "Lume Architecture Platform",

  capabilities: {
    provides: [{ name: "AuthoringRuntime", version: "1.0.0" }],
  },

  requires: {
    mandatory: [
      { name: "Manuscript", version: "1.0.0" },
      { name: "SentenceContext", version: "1.0.0" },
      { name: "Diagnostico", version: "1.0.0" },
      { name: "AiRuntime", version: "1.0.0" },
      { name: "NarrativeIr", version: "1.0.0" },
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
