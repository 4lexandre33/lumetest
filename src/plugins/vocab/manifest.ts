/**
 * Vocab Plugin Manifest — dictionary + grammar lines. Empty in V0. No parser.
 */

import type { IPluginManifest } from "../../core/contracts/plugin-manifest.ts";

export const VOCAB_MANIFEST: IPluginManifest = {
  name: "lume-vocab",
  version: "1.0.0",
  description: "Word table and grammar lines for nlp. Empty in V0. Does not match ON/IF.",
  author: "Lume Architecture Platform",

  capabilities: {
    provides: [{ name: "Vocab", version: "1.0.0" }],
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
