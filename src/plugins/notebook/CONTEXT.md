# lume-notebook

Caderno humano. Plugin interno isolado: compile **e** UI. Fora do matcher.

## Abrir
- `lib/notebook.ts` — `compileNotebook` / `slugOf` / `Entenda`
- `lib/cache.ts` — hash por `###`
- `lib/manuscript.ts` — livro, capítulo, cena, parágrafo, sentença. Ids estáveis. Não reescreve a prosa.
- `lib/narrative-ir.ts` — IR 1.0, separada do `do:`. Acto e mapa até ao texto. Não é gaveta.
- `lib/reference.ts` — resolvido, ambíguo ou não resolvido, com evidência. Sem candidato único, não escolhe. Sem gênero inventado.
- `lib/sentence-context.ts` — contexto da frase: quem está, o que sabe, crê e ignora, a cena, os três tempos. Não manda o livro. Sem modelo.
- `lib/causa.ts` — causa só na linha `causa: A -> B porque …`. Não se infere.
- `lib/continuidade.ts` — `arco:` e `fio:` declarados. Aviso não condena. `fica assim:` grava e cala.
- `lib/discurso.ts` — discurso e estilo com a frase citada. Não reescrevem o texto.
- `lib/impacto.ts` — um diagnóstico: cenas que a mutação ainda afecta. Não abre branch.
- `lib/pages.ts` — `parseCadernoLibrary` / `applyNotebookToProject` / fatia `# --- lume-caderno ---` (pad à mão antes de `start()`)
- `lib/share.ts` — export/import `.lume.caderno.md`
- `ui/NotebookPane.tsx` — abas, `+`, índice, editor
- `ui/NotebookEditor.tsx` — um editor; Vincular / popover / bind só em Escrita; ¹ ² ³ no fim do trecho; Secção de regras
- `ui/WriteShell.tsx` — Vincular por gaveta (Pôr/Tirar) ou entidade (CREATE/DESTROY)
- `ui/WritePreview.tsx` — uma pergunta, três lentes (Agora, Esta pessoa, Avisos) e o mapa das ligações até a linha. Ler não é lente.
- `lib/write-menu.ts` — selecção, gavetas, frases; `trechoDe` na mesma linha; `## moldes` (um nome, um texto) e a biblioteca que insere no cursor
- `lib/annotations.ts` — fatia `# --- lume-anotacoes ---`, rebind, compile, doFromDraft (SET / CLEAR+PUSH / Tirar)
- `lib/prose-triggers.ts` — gatilhos ao escrever (popover); writeSuggestions (tags da linha/parágrafo)
- `lib/timeline.ts` — ordem, cloneWorldModel do projecto ∪ caderno até a linha (`worldAte`), diff das gavetas, histórico por entidade, `mapaDe` sem gravar x, y
- `lib/leitor.ts` — `lerProsa`: prosa até a linha; `lerLivro`: o caderno inteiro, o mesmo corte. Linha `>` não entra na prosa.
- `lib/comando.ts` — linha `>`: `help` lista; `ent` e `id` gravam no editor; `mut` e `link` viram anotação; `inst` sincroniza o molde; `kno` guarda fatos; `que` pergunta até a linha e aceita o nome, `ela` e `ele`; `sea` e `aud` são o capítulo até essa linha.
- `lib/proposta.ts` — proposta da linha: Aceitar grava o do; Recusar não apaga a lei. `sempre` aplica; aviso se o mundo contradiz
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
