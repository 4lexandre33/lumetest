# lume-core

Microkernel: EventBus, PluginRegistry, CapabilityRegistry. Sem lógica de jogo.

## Abrir
- `index.ts` — `createCore`, `registry` (sem implementação), `lifecycle`, `diagnostics`. Permissão de storage e de evento. `getService` devolve só os métodos declarados; a API concreta fica por baixo. `descerMutacao` também desce pelo `dispatch`. Sem `world()`.
- `contracts/envelope.ts` — envelope, resultado e capability de um método. O dispatcher está em `internal/dispatcher.ts`. O boot ordena por `ordemDeBoot`. `getService` continua. Sem `world()`.
- `legacy-imports.txt` — lista fechada: 207 imports, 56 pares. Um import cruzado novo falha o teste. Os que já estão ficam.
- `enforcement.ts` — `vigiar()` falha se aparecer import cruzado novo, capability não declarada, slot sem capability, mutação directa fora da porta, IA a escrever no mundo, ou um ficheiro novo acima de 400 linhas.
- `legado.ts` — um caminho velho só sai se o substituto está no sítio e a paridade existe. Sem os dois, fica.
- `contracts/plugin-manifest.ts` — forma do manifest
- Nunca `internal/` a não ser bug de registry/bus

## Provides
Nenhum (é o host).

## Não fazer
- Não pôr regras, world model ou UI no core
- Novo evento: classe em `typed-event.ts`, não schema obrigatório
- Não unificar os dois tipos `GameBeat` (contrato vs runtime)

## Fora de âmbito
Jogo → `narrative-engine`. Intent → `intent-engine`.
