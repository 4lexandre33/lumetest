/** B/langt-style template, PT+EN. Words only — nlp does not honour again/undo/all yet. */

import type { VocabDescriptor, VocabFlag, VocabPronoun } from "../types.ts";

export const PLAYER_REF = "JOGADOR";

export type LanguageSeed = {
  raw: string;
  flags: VocabFlag[];
  number?: number;
  pronoun?: VocabPronoun;
  descriptor?: VocabDescriptor;
  direction?: string;
};

function special(raw: string): LanguageSeed {
  return { raw, flags: ["special"] };
}

function descriptor(raw: string, kind: VocabDescriptor): LanguageSeed {
  return { raw, flags: ["descriptor"], descriptor: kind };
}

function pronoun(raw: string, kind: VocabPronoun): LanguageSeed {
  return { raw, flags: ["pronoun"], pronoun: kind };
}

function direction(raw: string, canonical: string): LanguageSeed {
  return { raw, flags: ["direction"], direction: canonical };
}

function numeral(raw: string, value: number): LanguageSeed {
  return { raw, flags: ["number"], number: value };
}

const SPECIAL: LanguageSeed[] = [
  special("again"),
  special("g"),
  special("novamente"),
  special("outra vez"),
  special("oops"),
  special("o"),
  special("undo"),
  special("desfaz"),
  special("desfazer"),
  special("all"),
  special("every"),
  special("everything"),
  special("each"),
  special("both"),
  special("tudo"),
  special("todos"),
  special("todas"),
  special("cada"),
  special("but"),
  special("except"),
  special("excepto"),
  special("exceto"),
  special("menos"),
  special("salvo"),
  special("and"),
  special("e"),
  special("then"),
  special("depois"),
  special("yes"),
  special("y"),
  special("sim"),
  special("no"),
  special("n"),
  special("nao"),
  special("quit"),
  special("q"),
  special("sair"),
];

const DESCRIPTORS: LanguageSeed[] = [
  descriptor("the", "def"),
  descriptor("o", "def"),
  descriptor("a", "def"),
  descriptor("os", "def"),
  descriptor("as", "def"),
  descriptor("an", "indef"),
  descriptor("um", "indef"),
  descriptor("uma", "indef"),
  descriptor("uns", "indef"),
  descriptor("umas", "indef"),
  descriptor("this", "this"),
  descriptor("these", "this"),
  descriptor("este", "this"),
  descriptor("esta", "this"),
  descriptor("estes", "this"),
  descriptor("estas", "this"),
  descriptor("that", "that"),
  descriptor("those", "that"),
  descriptor("esse", "that"),
  descriptor("essa", "that"),
  descriptor("esses", "that"),
  descriptor("essas", "that"),
  descriptor("aquele", "that"),
  descriptor("aquela", "that"),
  descriptor("aqueles", "that"),
  descriptor("aquelas", "that"),
  descriptor("my", "possess"),
  descriptor("meu", "possess"),
  descriptor("minha", "possess"),
  descriptor("meus", "possess"),
  descriptor("minhas", "possess"),
];

const PRONOUNS: LanguageSeed[] = [
  pronoun("me", "me"),
  pronoun("myself", "me"),
  pronoun("self", "me"),
  pronoun("eu", "me"),
  pronoun("mim", "me"),
  pronoun("it", "it"),
  pronoun("him", "him"),
  pronoun("her", "her"),
  pronoun("them", "them"),
  pronoun("ele", "him"),
  pronoun("ela", "her"),
  pronoun("eles", "them"),
  pronoun("elas", "them"),
];

const DIRECTIONS: LanguageSeed[] = [
  direction("norte", "norte"),
  direction("north", "norte"),
  direction("n", "norte"),
  direction("sul", "sul"),
  direction("south", "sul"),
  direction("s", "sul"),
  direction("este", "este"),
  direction("leste", "este"),
  direction("east", "este"),
  direction("e", "este"),
  direction("l", "este"),
  direction("oeste", "oeste"),
  direction("west", "oeste"),
  direction("w", "oeste"),
  direction("o", "oeste"),
  direction("nordeste", "nordeste"),
  direction("northeast", "nordeste"),
  direction("ne", "nordeste"),
  direction("noroeste", "noroeste"),
  direction("northwest", "noroeste"),
  direction("nw", "noroeste"),
  direction("sudeste", "sudeste"),
  direction("southeast", "sudeste"),
  direction("se", "sudeste"),
  direction("sudoeste", "sudoeste"),
  direction("southwest", "sudoeste"),
  direction("sw", "sudoeste"),
  direction("cima", "cima"),
  direction("up", "cima"),
  direction("baixo", "baixo"),
  direction("down", "baixo"),
];

const NUMBER_WORDS: [string, number][] = [
  ["zero", 0],
  ["one", 1],
  ["um", 1],
  ["two", 2],
  ["dois", 2],
  ["three", 3],
  ["tres", 3],
  ["four", 4],
  ["quatro", 4],
  ["five", 5],
  ["cinco", 5],
  ["six", 6],
  ["seis", 6],
  ["seven", 7],
  ["sete", 7],
  ["eight", 8],
  ["oito", 8],
  ["nine", 9],
  ["nove", 9],
  ["ten", 10],
  ["dez", 10],
  ["eleven", 11],
  ["onze", 11],
  ["twelve", 12],
  ["doze", 12],
  ["thirteen", 13],
  ["treze", 13],
  ["fourteen", 14],
  ["catorze", 14],
  ["quatorze", 14],
  ["fifteen", 15],
  ["quinze", 15],
  ["sixteen", 16],
  ["dezasseis", 16],
  ["dezesseis", 16],
  ["seventeen", 17],
  ["dezassete", 17],
  ["dezessete", 17],
  ["eighteen", 18],
  ["dezoito", 18],
  ["nineteen", 19],
  ["dezanove", 19],
  ["dezenove", 19],
  ["twenty", 20],
  ["vinte", 20],
];

const NUMBERS: LanguageSeed[] = [
  ...NUMBER_WORDS.map(([raw, value]) => numeral(raw, value)),
  ...Array.from({ length: 21 }, (_, value) => numeral(String(value), value)),
];

export const LANGUAGE_SEEDS: LanguageSeed[] = [...SPECIAL, ...DESCRIPTORS, ...PRONOUNS, ...DIRECTIONS, ...NUMBERS];
