import type { IPluginManifest } from "../../core/contracts/plugin-manifest.ts";

export const MANUSCRIPT_MANIFEST: IPluginManifest = {
  name: "lume-manuscript",
  version: "1.0.0",
  description: "Lê o manuscrito. Não reescreve a prosa.",
  author: "Lume Architecture Platform",

  capabilities: {
    provides: [{ name: "Manuscript", version: "1.0.0" }],
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
