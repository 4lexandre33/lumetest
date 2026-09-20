# lume-kit-channel

Pacote de **dados**: canais globais. Não é motor. Não é ChannelEngine.

## Abrir
- `data/channels.ts` — `economia|politica|facoes`
- `lib/kit.ts` — `CHANNEL_TAXONOMY`, `CHANNEL_RULES`, `applyChannelKit`

## Provides
ChannelKit

## Requires
NarrativeEngine (para o autor compilar o projecto)

## Idioma
```
@corrupcao.{ tags: channel, economia; stats: state=0; }

ON: @guarda
IF: @jogador.intent=give
DO: THEN @corrupcao

ON: @corrupcao
IF: @corrupcao.intent=advance
DO: @corrupcao.corrupted
    THEN @cidade
```
Tag `channel → abstract`. Stat `state` (opt-in: sem `state` as regras do kit não casam). Query `*.channel`. Avanço: `THEN @corrupcao` (interact, kit faz `state+1`) ou `$.intent=advance` no canal. Autor escreve `THEN @cidade`; o kit **não** THEN outro canal.

`economia|politica|facoes` são dados no kit; só entram no projecto com `applyChannelKit`.

## Não fazer
- Não alterar `findMatchingRule`
- Não migrar Caverna/Planetário
- Não máquina de estados noutro runtime
- Não um canal escrever noutro
- Não auto-advance por relógio / WAIT / TICK / TIME()

## Fora de âmbito
THEN runtime → `chain`. INTENT no DO → `agency`. Fusível → `process`. Vida local → `life`. Combate → `kit-combat`.
