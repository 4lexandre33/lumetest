# lume-core

Microkernel: EventBus, PluginRegistry, CapabilityRegistry. Sem lógica de jogo.

## Abrir
- `index.ts` — `createCore`, `registry` (sem implementação), `lifecycle`, `diagnostics`. Permissão de storage e de evento. `dispatch` entrega um envelope a um método; `getService` continua. Sem `world()`.
- `contracts/envelope.ts` — envelope, resultado e capability de um método. O dispatcher está em `internal/dispatcher.ts`. O boot em `src/bootstrap.ts` não muda.
- `legacy-imports.txt` — imports que ainda entram na implementação de outro plugin. O resto usa a entrada pública. Sem plugin novo.
- `contracts/typed-event.ts` — novos `lume:…`
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
