# lume-notebook

Caderno humano. Plugin interno isolado: compile **e** UI. Fora do matcher.

## Abrir
- `lib/notebook.ts` — `compileNotebook` / `slugOf` / `Entenda`
- `lib/cache.ts` — hash por `###`
- `lib/pages.ts` — `parseCadernoLibrary` / `applyNotebookToProject` / fatia `# --- lume-caderno ---`
- `lib/share.ts` — export/import `.lume.caderno.md`
- `ui/NotebookPane.tsx` — abas, `+`, índice, editor
- `ui/NotebookEditor.tsx` — um editor; Vincular / popover / bind só em Escrita; ¹ ² ³ ao lado da palavra; Secção de regras
- `ui/WriteShell.tsx` — Vincular por gaveta (Pôr/Tirar) ou entidade (CREATE/DESTROY)
- `ui/WritePreview.tsx` — preview da Escrita: histórico, origem, 10 gavetas, N sugestões da cerca
- `lib/write-menu.ts` — selecção, gavetas, frases
- `lib/annotations.ts` — fatia `# --- lume-anotacoes ---`, rebind, compile, doFromDraft (SET / CLEAR+PUSH / Tirar)
- `lib/prose-triggers.ts` — gatilhos ao escrever (popover); writeSuggestions (tags da linha/parágrafo)
- `lib/timeline.ts` — ordem, cloneWorldModel do projecto ∪ caderno, diff das gavetas, histórico por entidade
- `index.ts` — capability `Notebook`

## Provides
Notebook

## Requires
(nenhum)

## UI
O IDE só monta `NotebookPane` / `NotebookTabstrip`. Enter no fim do caderno **preserva** a linha nova (`replaceBookSource` não corta `\n`).

## Não fazer
- Não meter UI de caderno no `ide-ui` (SourceEditor do motor)
- Não leilão / marketplace / embeddings
- Não alterar `findMatchingRule`
- Não correr beat na Escrita
- T1–T5 fechadas. D1–D12: docs, chrome, wizard, `#`/`//`, cerca, bind, coluna, sugestões da cerca, mortos, taxonomia `/* */`.
