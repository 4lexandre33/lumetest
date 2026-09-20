/** Versioned slot tokens. Grammar packs are keyed by locale; only pt-BR ships now. */

import type { VocabLocale } from "../types.ts";

export const VOCAB_LOCALE: VocabLocale = "pt-BR";
export const VOCAB_ENTITY_ID = "__VOCAB__";

export type SlotId = "algo" | "held" | "alguem" | "sitio" | "numero" | "texto";

export const SLOTS: Record<VocabLocale, Record<SlotId, string>> = {
  "pt-BR": {
    algo: "[algo]",
    held: "[held]",
    alguem: "[alguém]",
    sitio: "[sítio]",
    numero: "[número]",
    texto: "[texto]",
  },
};

export const PT = SLOTS[VOCAB_LOCALE];
