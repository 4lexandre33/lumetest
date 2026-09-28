# lume-ide-ui

UI canónica do IDE. Fonte da verdade dos componentes.

## Abrir
- `lib/components/ProjectTree.tsx` — sidebar ENTITIES/RULES/pastas
- `lib/components/CommandBar.tsx` — autocomplete `intent.`
- `lib/components/PreviewPane.tsx` — leitura no IDE (`mode="ide"`): texto até a linha e o mundo dela
- `lib/components/Skein.tsx` — árvore de `history` + ramos
- `lib/components/WorldMap.tsx` — SVG de salas a partir de `exit_*` / `in`
- `lib/components/BeatDebug.tsx` — intent, regra, candidatos, efeitos, vivo
- `lib/components/WorldIndex.tsx` — índice gerado + becos
- `lib/components/PlaySkin.tsx` — ecrã de partilha, fora do caminho principal; sem interruptor e sem Vista do jogador
- `lib/components/NotebookPane.tsx` — vista caderno (C9): capa, índice, página, margem
- `lib/components/NotebookNotes.tsx` — notas do caderno (C8), prosa, sob o motor
- `lib/play-html.ts` — HTML estático do play-skin
- `lib/superficie.ts` — Escrever, Pessoas, Cenas, Cronologia, Universo, Revisão, Assistente. Técnico só quando se pede. Play não é a porta.
- `lib/components/IdeApp.tsx` — layout; export/import `.lume.caderno.md`; `#play=` após compile do caderno
- `lib/view-registry.ts` — nomes das vistas (16)

## Provides
IdeUI, IdeComponents

## Requires
NarrativeEngine, ProjectCloud, IdeStore

## Não fazer
- Não recriar `src/components/ide/`. A rota usa estes componentes.
- Não mostrar atalhos de escolha sempre visíveis; o menu único abre no cursor só com `.` ou Ctrl+Espaço. Um ponto, um nível — não o catálogo inteiro. Enter substitui o trecho.
- Não lógica de compile/interact aqui — store

## Fora de âmbito
Pastas persistidas → `ide-state/lib/tree.ts`. Resolver de intent → `intent-engine`.
