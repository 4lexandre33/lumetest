import type { IPluginManifest } from "../../core/contracts/plugin-manifest.ts";

export const SENTENCE_CONTEXT_MANIFEST: IPluginManifest = {
  name: "lume-sentence-context",
  version: "1.0.0",
  description: "Contexto de uma frase. Não manda o livro inteiro.",
  author: "Lume Architecture Platform",

  capabilities: {
    provides: [{ name: "SentenceContext", version: "1.0.0" }],
  },

  requires: {
    mandatory: [{ name: "Manuscript", version: "1.0.0" }],
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
