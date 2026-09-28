# lume-nlp

Frase livre → `intent.*`. Último no pipeline. Frágil: falha fechado.

## Abrir
- `lib/nlp.ts` — `interpret(text, world, scope?)` / `splitPhrases` (grammar pt-BR; score V6)
- `lib/command.ts` — NLP rápido dos comandos. Não chama o modelo.
- `lib/prose.ts` — NLP da prosa até à IR. O modelo é opcional.
- `lib/model-provider.ts` — provider pequeno. O editor não o importa.
- `index.ts` — phrase mapper no IntentEngine (passa `options.scope`)

## Provides
Nlp

## Requires
IntentEngine, Vocab

## Idioma
```
pega a tocha
take torch
kill goblin
posso pegar a tocha
pick up tocha
```
Só corre se o texto **não** começa por `intent`. Sai um comando pontilhado; o matcher não muda.

`posso` / `can i` → `dryRun: true`. `scope` omitido = mundo todo. `scope: []` = nenhum alvo. `[held]` prefere `inventory`.

Needles leem `extra.name` e `extra.aliases`. Linhas de projecto em `__VOCAB__.extra.grammar` (caderno `Entenda`).

## Não fazer
- Não `findMatchingRule`
- Não embeddings / vector search / WASM NLP
- Não Choose Objects / menu
- Não família nova de intent
- Não TIME, Inspector, tick NPC
- Não migrar exemplos
- Não autocomplete de frase

## Fora de âmbito
Parse pontilhado → intent-engine. Dry-run de `interact` → dry-run. `;` de `intent.a; intent.b` → chain. `Entenda quando` → V7b.
