export type VocabLocale = "pt-BR";

export type VocabFlag =
  | "verb"
  | "noun"
  | "descriptor"
  | "pronoun"
  | "number"
  | "ordinal"
  | "direction"
  | "special";

export type VocabPronoun = "it" | "him" | "her" | "them" | "me";
export type VocabDescriptor = "def" | "indef" | "possess" | "this" | "that";

export type VocabEntry = {
  fold: string;
  raw: string;
  flags: VocabFlag[];
  number?: number;
  path?: string;
  pronoun?: VocabPronoun;
  descriptor?: VocabDescriptor;
  direction?: string;
};

export type GrammarLine = {
  verb: string;
  tokens: string[];
  path: string;
  locale?: VocabLocale;
};

export interface VocabService {
  lookup(fold: string): VocabEntry | null;
  lines(locale?: VocabLocale): GrammarLine[];
}
