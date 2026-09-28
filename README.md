# Lume

Plataforma de autoria. O manuscrito é a porta. Play, Skein, Debug e export ficam no Técnico.

O boot regista os plugins e ordena-os pelo grafo (`ordemDeBoot`). São 35 plugins. `getService` continua a ser o caminho usado.

A lista fechada dos imports cruzados é [`src/core/legacy-imports.txt`](src/core/legacy-imports.txt): 207 linhas, 56 pares. Um import novo falha o teste. Os que já estão não se apagam aqui.

## Comandos

```bash
npm test
npm run test:core
npm run test:plugins
npm run typecheck
npm run lint
```
