# lume-narrative-engine

Único dono de mundo, taxonomia, query, compile, `ON/IF/DO`, `interact`, rewind.

## Abrir
- `lib/rule-engine.ts` — parse + um só `findMatchingRule` + CREATE/DESTROY
- `lib/rule-resolver.ts` — quem casa. Não há outro matcher.
- `lib/rule-effects.ts` — quem aplica o efeito. Não casa.
- `lib/runtime.ts` — quem corre o turno. Pede ao resolver.
- `lib/dry-run.ts` — `dryRunWith` (mesmo matcher, sem mutar o vivo, sem RuleEffects)
- `lib/world-model.ts` — entidades; id canónico `@slug` minúsculo (E040 se faltar `@` ou houver maiúsculas); `start` injectado
- `lib/taxonomy.ts` / `lib/query.ts`
- `lib/beat.ts` — `lastBeat` (intent, regra, candidatos, efeitos, vivo)
- `lib/world-index.ts` — índice + avisos de beco (topic/conv/canal/vivo)
- `lib/play-bundle.ts` — bundle play + hash `#play=` / `#sessao=`
- `lib/project.ts` — `notebooksSource` (caderno; compile vazio até C2)
- `lib/world-port.ts` — porta do mundo. `adaptWorld` deixa outro backend cumprir a mesma porta.
- A gateway de mutação vive em `mutation-gateway`. Este plugin não a contém.

## Provides
NarrativeEngine, Taxonomy, QueryEngine, LanguageTools, RuleEffects, RuleResolver, RuleRuntime, WorldQuery, WorldMutation

## Eventos
Emite (async): `lume:project-compiled`, `lume:game-created`, `lume:game-beat`, `lume:game-error`. Preview **não** usa async.

## Não fazer
- Não alterar `findMatchingRule` para semântica
- Não importar intent-engine / world-events / knowledge / agency
- Não implementar EMIT/KNOW/INTENT/WAIT/TICK/THEN/LIVE aqui — só `EffectOp` + registry
- Perceive/cognize não vivem aqui
- Dry-run como capability de domínio → `lume-dry-run` (chama `NarrativeEngine.dryRun`)

## Fora de âmbito
Classificar regra → `rule-semantics`. Comando digitado → `intent-engine`. Sidebar → `ide-ui`.
