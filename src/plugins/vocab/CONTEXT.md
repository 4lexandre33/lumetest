# lume-vocab

Dicionário + grammar lines. **V5:** linhas **pt-BR** (tokens versionados por locale). Tecto 8 tokens (W032).

## Abrir
- `lib/tokens.ts` — `VOCAB_LOCALE` / `SLOTS` (packs futuros: outra chave)
- `lib/verbs.ts` — chaves PT/EN → path `intent.*`
- `lib/language.ts` — template (again/undo/all registados, nlp ainda não honra)
- `lib/grammar.ts` — `STANDARD_LINES` em pt-BR / `lineWarning` / W032
- `lib/vocab.ts` — `lookup` / `lines(locale)` / `addLine`
- `types.ts` — `VocabEntry` / `GrammarLine`

## Provides
Vocab

## Requires
(nenhum)

## Idioma
```
lines() → locale pt-BR
pegar [algo]   largar [held]   meter [held] em [algo]
```

O nlp casa **só** por linhas do locale. Sem gramática inglesa (`pick up` é sinónimo de `pegar`, não uma linha).

## Não fazer
- Não `findMatchingRule`
- Não embeddings / Parser.i6 / 32 slots
- Não ALL / pronomes de play
- Não honrar again/undo/all/oops no nlp
- Não TIME, Inspector, tick NPC

## Fora de âmbito
Frase → `nlp`. Catálogo `intent.*` → `intent-engine`. `Entenda` no caderno escreve `extra.aliases` / `__VOCAB__.grammar`.
