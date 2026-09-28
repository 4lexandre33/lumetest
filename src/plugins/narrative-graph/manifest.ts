import type { IPluginManifest } from "../../core/contracts/plugin-manifest.ts";

export const NARRATIVE_GRAPH_MANIFEST: IPluginManifest = {
  name: "lume-narrative-graph",
  version: "1.0.0",
  description: "Grafo narrativo. Não infere trama.",
  author: "Lume Architecture Platform",

  capabilities: {
    provides: [{ name: "NarrativeGraph", version: "1.0.0" }],
  },

  requires: {
    mandatory: [],
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
