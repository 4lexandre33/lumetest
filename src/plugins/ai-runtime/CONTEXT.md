# ai-runtime

O provider recebe a frase, não o livro, e devolve uma proposta. A política pode recusar. Se passar, a proposta desce em `descerMutacao` com origem `modelo`, a mesma porta de um comando. O manifest exige `SentenceContext`, `MutationGateway` e `NarrativeEngine`.
