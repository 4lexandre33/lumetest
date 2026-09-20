# Plano Lume — Biblioteca de vocabulário (nível Inform 7, idioma Lume)

> Depois de **N1–N12 (feito)**. Traduz o export DeepSeek de 13/09/2026 (*Blueprint do Parser I7* · *Blueprint da biblioteca de vocabulário* · *Especificação formal* · *Plano de implementação I7*, ~3172 linhas) e o pedido *«o vocabulário do Lume ainda é fraco; alcançar pelo menos o nível do Inform 7, adaptado ao Lume»*.
> **Ainda um só `findMatchingRule`.** O vocabulário **não** é o Parser.i6: é um **dicionário + grammar lines** que o `nlp` traduz para `intent.*`. Sem embeddings, sem 240 globais, sem 63 secções I6, sem `ni`.

**Como usar este ficheiro:** cada fase Vn é um pedido futuro *«faça agora Fase Vn, de forma completa, sem mais e sem menos»*. Este plano **não implementa**. Só descreve.

---

## 0. Tese

O Inform 7 parece “perceber português/inglês”. Por baixo é uma **casa de 63 quartos** (Parser.i6) + **3 camadas de vocabulário** (`words` em C, template `B/langt` em I6, ~50 acções + `Understand`). O Lume já tem o que importa no outro lado do tubo:

```
frase humana
    → nlp.interpret()                 # hoje: 1º token = verbo, resto = id/name
    → intent.action.interact.take.ESPADA
    → IntentEngine.execute
    → interactWith + findMatchingRule # um só
    → beat
```

O buraco não é o matcher. É o **primeiro metro**: o jogador não pode dizer *«pega a espada enferrujada»*, *«exame-a»*, *«pega tudo»*, *«entenda "pincel" como a Espada»*. O nlp actual falha fechado se o nome não for exactamente `id` ou `extra.name`, se o verbo não for a primeira palavra, se houver dois candidatos.

Três eixos:

| Eixo | Significado em Lume | Não é |
|------|---------------------|-------|
| **Léxico** | Palavra → códigos de significado (verbo, descritor, pronome, número, direcção, nome) | `vocabulary_entry` em C, tabela hash I6, Preform |
| **Gramática** | Linha `pegar [algo]` → path `intent.action.interact.take` + token typed | 32 slots `line_ttype[]`, Letters A–K |
| **Understand** | Frase no caderno que *adiciona* sinónimo / linha, compilada | segundo parser, LLM, embeddings |

**Contrato de saída (invariante 10):** o nlp **DEVE** continuar a emitir só `intent.*` (ou `null`). O matcher **NÃO DEVE** ver a frase. Falha fechado. Empate de desambiguação = `null` (já é o teste da tocha duplicada).

---

## 1. O que já está feito (não reconstruir)

| Peça I7 | Já no Lume | Buraco |
|---------|------------|--------|
| Verbo → acção | `nlp` VERBS + `notebook/lib/verbs.ts` (~25 folhas, PT+EN) | tabelas **duplicadas**; sem grammar line |
| Catálogo de acções | `intent-engine` perceive / cognize / interact / go / look / inventory / wait | faltam wear, eat, search, show, enter/exit distintos, smell, pull/push… |
| take/drop/put/open/go/talk | `kit-adventure` (dados) | acções novas precisam de regra de kit **só** se mutarem o mundo |
| Scope (quem está à vista) | `senses.scope` / `visibleTo` / `reachableTo` | o nlp **não pergunta** ao scope; resolve no mundo inteiro |
| Desambiguação | empate de `extra.name` → `null` | sem score (held, visível, nome mais longo) |
| Artigos | STOP words (`a`, `o`, `the`…) descartados | não são descritores (`the`/`my`/`this`) |
| Pronomes no **caderno** | N2: `ele`/`ela` → `currentId` à compilação | no **play** `pega-a` / `examine it` morre |
| Nomes | `id` + `extra.name` | sem `extra.aliases`, sem adjectivo (`enferrujada`) |
| Dry-run | `posso` / `can i` | manter |
| Cadeia | `.` / `then` / `depois` → `intent.a; intent.b` | sem `ALL` / `EXCEPT` |
| Undo/rewind | runtime `rewindTo` | o parser não reconhece `undo` / `g` / `oops` |
| Caderno `é um` / `Quando` | N1–N12 | sem `Entenda "x" como y` |

**Não há** Parser.i6. **Não há** `Understand`. **Não há** `[something]`. Por isso o vocabulário *parece* fraco: o motor é rico; a porta de entrada é um `Map` de 25 verbos.

---

## 2. Recusas (o que o anexo descreve e o Lume **não** copia)

O documento I7 é normativo **para o Inform 7**. No Lume vale o [INVARIANTES.md](INVARIANTES.md). Traduzir o ponto forte; recusar a casa.

| I7 | Recusa Lume | Porquê |
|----|-------------|--------|
| 63 secções Parser.i6, Letters A–K | Não portar | 240 globais, ordem fixa, I6 |
| 5 arrays `[32]` (`pattern`, `line_ttype`…) | Grammar line em TS: `{ verb, tokens[], path }` | 32 é tecto I6; Lume não precisa de buffer mutável |
| Módulo `words` em C, hash, `nt_incidence` Preform | `Map<fold, VocabEntry>` | unicidade + fold já existem |
| Rulebooks Before/Instead/Check/Carry out/After/Report | Um `findMatchingRule` + especificidade | invariante 1 |
| `INV-015` máximo 32 tokens | Tecto Lume: **8** tokens por linha (frase humana curta) | sem ouro |
| Template §5 Time, §10–§13 impressão I6 | Fora | Lume não tem relógio de parede; prosa = `narrativa:` + kit-prose |
| `ACTIONS` / `SHOWVERB` debug I6 | Fase opcional no CommandBar **só se pedida**; não nas Vn | não ouro |
| Extensões Locksmith / Rideable / Metric Units | Kits Lume já cobrem chaves (`lock`) e spatial | não `npm` I7 |
| Embeddings, Transformers, WASM NLP | Proibido (invariante 10, nlp CONTEXT) | — |
| Segundo matcher, família FEAR/FLEE | Proibido (15) | — |

**INV-012 do I7** (*toda personalização via `Understand`*) no Lume vira: toda personalização de **frase** via caderno `Entenda` **ou** via tabela do plugin. O autor **não** edita TypeScript para acrescentar «pincel».

---

## 3. Blueprint — a casa Lume (não a casa I7)

### 3.1 Planta

```
frase  "pega a espada enferrujada. espera"
        │
        ▼
┌──────────────────┐
│  nlp.interpret   │  dono da frase → intent.*
└────────┬─────────┘
         │ usa
         ▼
┌──────────────────┐     ┌─────────────────────┐
│  lume-vocab      │     │  senses.scope       │
│  (dados)         │     │  (já existe)        │
│  palavras        │     │  visível / tocável  │
│  descritores PT  │     └──────────▲──────────┘
│  pronomes        │                │ filtro
│  números         │                │
│  direcções       │     ┌──────────┴──────────┐
│  grammar lines   │────►│  NounDomain Lume    │
│  Understand      │     │  (no nlp, não I6)   │
└──────────────────┘     └──────────┬──────────┘
         │                          │ ids
         │                          ▼
         │               intent.action.interact.take.ESPADA
         │                          │
         ▼                          ▼
 caderno "Entenda …"          IntentEngine.execute
 compileNotebook                    │
 extra.aliases / linhas             ▼
                             findMatchingRule
```

**Quartos Lume (12, não 63):**

| Quarto | Plugin / ficheiro | Equivale I7 |
|--------|-------------------|-------------|
| 1. Palavra | `lume-vocab` `VocabEntry` | `vocabulary_entry` |
| 2. Template PT+EN | `lume-vocab` `lib/language.ts` | `B/langt` §1–§4, §6, §8 |
| 3. Grammar lines | `lume-vocab` `lib/grammar.ts` | unpack + tokens |
| 4. Leitura | `nlp` tokenize + fold (já) | §9 |
| 5. Match de linha | `nlp` escolhe 1ª linha que casa | Parser Proper, INV-011 |
| 6. Tokens | resolver de `[algo]` / `[alguém]` / `[número]` / `[texto]` | Parse Token + NounDomain |
| 7. Descritores | `the`/`a`/`o`/`esta`/`meu` filtram, não falham | §30 |
| 8. Escopo | `options.scope` do IntentEngine + senses | SearchScope |
| 9. Score | visível > tocável > held > nome mais longo; empate `null` | ScoreMatchL + Adjudicate, **sem** Choose Objects UI nesta série |
| 10. Pronome play | `game.parser.pronouns` (replayável) | §59 |
| 11. Understand | caderno → `compileNotebook` → vocab do projecto | Understand |
| 12. Acções | catálogo intent + kit se mutar | Standard Actions |

**Portas (6):** `nlp.interpret` · `Vocab.lookup` · `Vocab.linesFor(verb)` · `compileNotebook` (`Entenda`) · `senses.scope` · `intent.execute`.

### 3.2 Três camadas (as do anexo, em Lume)

| Camada I7 | Onde no Lume | Linguagem |
|-----------|--------------|-----------|
| 1. Estrutura de dados (`words`) | `VocabEntry` + `Map<fold, Entry>` | TypeScript |
| 2. Template `B/langt` | tabelas PT e EN no mesmo plugin | dados |
| 3. Acções + Understand | intent catalog + kit-adventure + caderno | já Lume |

O nlp **não** guarda o dicionário. Pede a capability `Vocab`. O notebook **não** importa nlp: pede a mesma capability para os verbos do `Quando` (acaba a duplicação `verbs.ts` ↔ `nlp.ts`).

### 3.3 `VocabEntry` (contrato, não C)

```
VocabEntry {
  fold: string           // chave única (NFC→NFD strip, lower)
  raw: string            // exemplar
  flags: VocabFlag[]     // verb | noun | descriptor | pronoun | number | ordinal | direction | special
  number?: number        // cache INV-003
  path?: string          // se verb: intent path (sem ids)
  pronoun?: "it" | "him" | "her" | "them" | "me"
  descriptor?: "def" | "indef" | "possess" | "this" | "that"
}
```

INV-001 Lume: **uma** entrada por `fold`. `pincel` e `Pincel` são a mesma. Palavras entre aspas no caderno (`"A Espada Enferrujada"`) **não** entram no léxico global — são nome de entidade (já N2).

INV-002 Lume: flags **não** vazias.

---

## 4. Especificação — invariantes Lume (vocabulário)

Normativo para as fases Vn. RFC 2119. Choque com [INVARIANTES.md](INVARIANTES.md) → ganha o ficheiro de invariantes.

| Id | Regra |
|----|--------|
| **LV-01** | `interpret` **DEVE** devolver `{ command: "intent.…", dryRun? }` ou `null`. **NÃO DEVE** chamar `findMatchingRule`. |
| **LV-02** | Frase que já começa por `intent` **DEVE** ser ignorada pelo nlp (já). |
| **LV-03** | Empate irresolúvel **DEVE** ser `null` (teste tocha duplicada **não** muda). |
| **LV-04** | Scope: se `Senses` existe, candidatos a `[algo]`/`[alguém]` **DEVEM** filtrar-se por visível/tocável conforme o token. Sem Senses, mundo como hoje. |
| **LV-05** | Primeira grammar line que casa **vence** (ordem de declaração). |
| **LV-06** | Máximo **8** tokens por linha. Linha a mais = não carrega, aviso W032. |
| **LV-07** | `Understand the command "x" as something new` **DEVE** remover **só** o verbo `x` das linhas **padrão**. Sinónimos do autor no caderno **ficam**. Irreversível no compile (como I7 INV-013, no idioma Lume). |
| **LV-08** | Pronomes de play vivem em `game.parser` (ou equivalente no `GameState`). Rewind = replay de `triggerId`; pronomes **recalculam-se** a partir do último alvo dos beats restantes, **não** de relógio. |
| **LV-09** | `ALL` expande para `intent.a; intent.b; …` com tecto **12** alvos. Acima: W033 e **não** executa (falha fechado, não “pega 200 coisas”). |
| **LV-10** | W021 (500 regras) **inalterado**. Grammar lines não contam como regras do matcher. |
| **LV-11** | Sem embeddings, sem segundo matcher, sem 20 Hz, sem TIME de parede. |
| **LV-12** | PT e EN no mesmo dicionário. Fold trata acentos (`está` = `esta` na chave; o highlight do caderno continua a mostrar a forma escrita). |

### 4.1 Tokens (o que existe; o que não)

| Token caderno / grammar | Significado | Escopo Lume |
|-------------------------|-------------|-------------|
| `[algo]` / `[something]` | 1 entidade `object` (ou sem tag object, visível) | senses visível |
| `[alguém]` / `[someone]` | 1 `agent`/`vivo` ≠ jogador | visível |
| `[sítio]` / `[somewhere]` | 1 `place` | `exit_*` ou place conhecido |
| `[número]` | inteiro cacheado | literal |
| `[texto]` | resto da frase | tópico / ask |
| `[held]` | preferir `current_location=JOGADOR` | inventário, senão visível |
| `[tudo]` / `[things]` | lista → cadeia | tecto 12 |

**Não nesta série:** `[things inside]`, `[other things]`, `[any things]` (mundo inteiro — perigoso), Choose Objects menu, `MULTIEXCEPT` I6.

### 4.2 Palavras fundamentais (template, PT+EN)

O template **DEVE** definir (INV-006 adaptado):

| Papel | EN | PT |
|-------|----|----|
| again | again, g | outra vez, novamente |
| oops | oops, o | oops |
| undo | undo | desfaz, desfazer |
| all | all, every, everything, each, both | tudo, todos, todas, cada |
| except | but, except | excepto, menos, salvo |
| me | me, myself, self | eu, mim, me |
| and | and | e |
| then | then | depois |
| yes / no | yes, y / no, n | sim / não |
| quit | quit, q | sair |
| the/a | the, a, an | o, a, os, as, um, uma |
| this/that | this, that, these, those | este, esta, esse, essa, aquele |
| my | my | meu, minha, meus, minhas |
| directions | n,s,e,w,ne… / north… | n,s,l,o, norte, sul, este, oeste, cima, baixo |

`again` no Lume = repetir o **último** `intent.*` executado (já está no history). `undo` = `rewindTo(turn-1)` se a UI/runtime já expõe rewind; o nlp só emite um comando interno `intent.action.wait` **não** — emite um hit especial `{ command: "intent.meta.undo" }` **só se** o IntentEngine ganhar uma folha `meta` **nesta série**. Se isso tocar no catálogo de famílias: **não criar família nova** (invariante 15). Mapear:

- `undo` → a IDE já tem rewind; o nlp devolve `null` **ou** o execute chama `rewindTo` via capability já existente, **sem** nova família. Fase V2 escolhe: **hit `{ command: "intent.action.wait", meta: "undo" }` é ilegal**. Correcto: nlp devolve `{ command: "intent.action.look", rewind: 1 }`? Também feio.

**Decisão V2:** `undo` / `desfaz` → o nlp devolve `NlpHit` com `command` vazio e `rewind: true` (campo novo no hit, como `dryRun`). O execute no ide-state chama `rewindTo`. Sem folha nova. `oops` **não** se implementa (I6 substitui palavra no buffer; Lume não tem buffer de teclado I6). `again` → re-execute o último command da history (campo `again: true`). Sem ouro de OOPS.

### 4.3 Acções ~50 — mapa para o catálogo **existente**

Não inventar primitivas. Folha nova **só** se não houver sinónimo honesto.

| I7 | Lume | Como |
|----|------|------|
| TAKE / GET / PICK UP | `interact.take` | já |
| DROP / DISCARD | `interact.drop` | já |
| INSERT / PUT ON | `interact.put` | já (preposição `em`/`on` escolhe o 2º id) |
| GIVE / SHOW | give já; **show** = `interact.give` **ou** folha `use`? V8: `show` → `interact.tell` se agente, senão `perceive.inspect` | sem folha nova se possível |
| OPEN CLOSE LOCK UNLOCK | já | |
| WEAR / DON | V8: folha `interact.use` + tag `wearable`, **ou** folha `wear` no interact | preferir `use` se o kit já trata; senão **uma** folha `wear` + `remove` |
| EAT / DRINK / TASTE | V8: `use` sobre `edible` | sem folha se o kit cobrir |
| EXAMINE / LOOK / SEARCH / LISTEN | inspect / look / locate / listen já | search → `locate` |
| ASK / TELL / ANSWER / SAY | ask / tell / talk já | answer → tell |
| GO / ENTER / EXIT / GET OFF | `go` já; enter/exit = `go` + place/container | sem folha |
| ATTACK | já | |
| WAIT / INVENTORY | já | |
| PULL PUSH TURN | V8: `use` | |
| BURN CUT BUY | V8: só se o caderno/kit declarar; senão `null` | falha fechado |
| SING JUMP SLEEP THINK | `wait` ou `null` | não ouro |
| KISS | `talk` | |

**Tecto V8:** acrescentar no catálogo **no máximo** `wear` e `remove` (vestuário é acção real do I7 e não é `use` honesto). Tudo o resto são sinónimos → folhas já existentes. Isto alcança o *nível de cobertura de comando* sem 50 primitivas.

---

## 5. Understand no caderno (a porta da autora)

A autora **não** escreve grammar I7. Escreve no caderno (compile N1–N12):

```
Entenda "pincel" como a Espada.
Entenda "lança-chamas" ou "tocha grande" como a Tocha.
Entenda "broken" como o Vaso quando o Vaso está partido.   # V7b, opcional
Entenda o comando "dance" como novo.
```

| Frase | Compile |
|-------|---------|
| `Entenda "x" como a Entidade.` | `extra.aliases` da entidade (lista, fold) + entrada vocab `noun` → id |
| `Entenda "x" ou "y" como a Entidade.` | vários aliases |
| `Entenda "pegar [algo]" como take.` | grammar line extra no projecto, path da folha `take` |
| `Entenda o comando "x" como novo.` | LV-07, remove linhas **padrão** com verbo `x` |

**Quando** (condicional): só V7b. Compila para “alias activo se a entidade tiver a tag”. O nlp consulta tags no mundo **no interpret**, não no compile. Sem segundo matcher: o alias simplesmente **não está** na lista de needles se a tag faltar.

Sinónimos **não** passam pelo motor como entidades novas (não criar `PINCEL.{`).

---

## 6. Fluxo de um comando (tradução do §5 do anexo)

```
"TAKE THE RUSTY SWORD"
        │ tokenize + fold
        ▼
verb = take (flags.verb → path interact.take)
descritores = the (def, ignorado para match, não consome alvo)
resto = rusty sword
        │ needles = id ∪ name ∪ aliases, filtrados por scope
        │ matchAt mais longo: "rusty sword" → ESPADA (alias)
        │ se 2 hits → score (visível, held, len); empate null
        ▼
intent.action.interact.take.ESPADA
        │
        ▼
execute → interactWith(ESPADA) → findMatchingRule
```

Gramática com preposição:

```
"mete a espada no baú"
line: meter [held] em [algo]
ids: ESPADA, BAU
intent.action.interact.put.ESPADA.BAU
```

Isto é o ponto forte do I7 (`drop` vs `insert` vs `put on` pelo resto da linha) **sem** quatro acções I6: no Lume `put` já tem 2 argumentos. `throw at` **não** entra (sem folha).

---

## 7. Fases (Vn)

Cada fase = um pedido *completo, sem mais e sem menos*. Dependências só para baixo.

### Fase V0 — plugin `lume-vocab` vazio + tipos

- Plugin EMPA: Provides `Vocab`, Requires nenhum.
- `lookup(fold): VocabEntry | null`, `lines(): GrammarLine[]` devolvem vazio.
- `CONTEXT.md`. Conta de plugins +1 no bootstrap test.
- nlp **ainda não** depende. Zero mudança de play.
- Sem C, sem hash artesanal (o `Map` chega).

### Fase V1 — dicionário de verbos único

- Migrar as chaves de `nlp.ts` e `notebook/lib/verbs.ts` para `lume-vocab` (mesmas folhas, mesmos paths).
- nlp e notebook **consomem** a capability (notebook via `getService` no compile **ou** o notebook continua com um *reexport de dados* se o compile for puro e sem context — **preferir dados importáveis só dentro de vocab**, e o notebook recebe `intentLeaf` de um ficheiro `lume-vocab/lib/verbs.ts` **sem** o notebook importar `nlp`).
- Teste: `pega a tocha` e `Quando o jogador pega a espada` **iguais** a hoje.
- Sem grammar lines ainda.

### Fase V2 — template PT+EN (descritores, me, direcções, números)

- Tabelas: descritores, `me`→`JOGADOR`, direcções `norte`→ place via `exit_norte` se existir senão `null`, números 0–20 + dígitos com cache.
- `again` / `undo` / `all` **registados no léxico** mas o nlp **ainda não** os honra (senão V2 faz de mais).
- Teste: `lookup("norte").flags` inclui `direction`; `lookup("17").number === 17`.

### Fase V3 — grammar lines + tokens

- Linhas padrão, uma por folha actual: `pegar [algo]`, `largar [held]`, `meter [held] em [algo]`, `falar com [alguém]`, `ir [sítio]`, `olhar`, `inventario`, `esperar`, `examinar [algo]`, …
- Parser nlp: **se** uma linha casa, usa-a; **senão** cai no algoritmo actual (1º token + needles). Assim V3 não parte testes.
- Tecto 8 tokens. W032 se uma linha do autor passar.
- Sem ALL, sem pronome play.

### Fase V4 — nlp só por grammar (o 1º token deixa de ser especial)

- Remover o atalho “head = verbo”. Tudo passa por linhas.
- `pick up the torch` (verbo composto) casa `pick up [algo]`.
- Falha fechado se nenhuma linha.
- Testes nlp actuais **passam**; acrescentar `pick up tocha`.

### Fase V5 — scope

- `interpret(text, world, scope?)`. Se o IntentEngine já passa `options.scope`, o nlp filtra needles.
- `[held]` prefere inventário.
- Sem Senses no teste unitário: comportamento antigo (mundo todo) se `scope` omitido.
- Teste com scope vazio: `pega a tocha` → `null` se a tocha não está no set.

### Fase V6 — score de desambiguação

- Candidatos >1: ordenar por (1) match de alias mais longo, (2) in scope, (3) held se o token é held, (4) visível.
- Diferença estrita → vencedor. Empate → `null` (LV-03, teste tocha).
- **Sem** Choose Objects, **sem** menu.

### Fase V7 — `Entenda` no caderno

- Parser N-style: `Entenda "x" como a Entidade.` → `extra.aliases`.
- `Entenda "v1" ou "v2" como a Entidade.`
- `Entenda "frase [algo]" como take.` → grammar line de projecto.
- `Entenda o comando "x" como novo.` → LV-07.
- Needles do nlp leem `extra.aliases`.
- Teste: caderno `Entenda "pincel" como a Espada.` + play `pega o pincel` → `take.ESPADA`.
- Sem condicional `quando` (isso é V7b, **não** fazer em V7).

### Fase V8 — vestir / cobertura de acções

- Folhas `wear` e `remove` no catálogo interact + 2–4 sinónimos PT/EN + 2 grammar lines + regras de kit **mínimas** (`ON: *.wearable` IF intent=wear DO current_location=JOGADOR + tag `worn` ou link). Se `worn` for ouro demais: só `use`.
- **Decisão desta fase no pedido:** se o utilizador disser só «V8», implementar **wear/remove** + mapa de sinónimos I7→folhas já existentes (eat→use, search→locate, enter→go, show→tell/inspect). Sem burn/cut/buy.

### Fase V9 — ALL / EXCEPT / e

- `pega tudo` → cadeia de takes no scope, tecto 12, W033 se passar.
- `pega tudo excepto a espada`.
- `pega a espada e a tocha` → `take.ESPADA; take.TOCHA`.
- Sem MULTIINSIDE.

### Fase V10 — pronomes de play

- Depois de um execute com alvo, gravar `parser.pronouns.it/him/her` (género: tag `vivo`+nome/`ela` no extra; default `it`).
- `examina-a` / `examine it` / `pega nele`.
- Recalcular no rewind a partir do último beat com alvo.
- Teste: `pega a espada` depois `examine it` → inspect.ESPADA.

### Fase V11 — paridade de frase

- `TAKE THE SWORD` = `pega a espada` = `intent.action.interact.take.ESPADA` → **o mesmo** `interactWith` e o mesmo beat.
- `get torch. wait` já existe; manter.
- Play caderno com `Entenda` = play manuscrito com `extra.aliases` (como N12).
- Não mudar Caverna/Planetário **excepto** se um teste oficial quebrar — nesse caso o nlp continua a aceitar as frases curtas de hoje.

### Fase V12 — tecto e recusas finais

- W032 (linha >8 tokens), W033 (ALL >12).
- W021 intacto.
- Documentar no CONTEXT do nlp e do vocab: *não* Parser.i6, *não* embeddings, *não* Choose Objects.
- Teste de regressão: `dance with the goblin` continua `null`.
- Sem SHOWVERB, sem ACTIONS, sem OOPS.

---

## 8. Mapa rápido I7 → Lume

| Guia I7 | Lume |
|---------|------|
| `vocabulary_entry` | `VocabEntry` no `lume-vocab` |
| Meaning codes | `flags: VocabFlag[]` |
| `B/langt` §1 Vocabulary | tabela special (again, all, me…) |
| `LanguagePronouns` | V10 + tabela V2 |
| `LanguageDescriptors` | artigos/possessivos, não falham o parse |
| Grammar line 32 tokens | linha ≤8 tokens |
| `[something]` | `[algo]` |
| `[someone]` | `[alguém]` |
| NounDomain + SearchScope | needles + `senses.scope` |
| ScoreMatchL | V6, empate `null` |
| Choose Objects §62 | **não** |
| Understand | `Entenda` no caderno (V7) |
| Standard Actions ~50 | ~25 folhas + wear/remove + sinónimos |
| Before/Instead/Check… | `findMatchingRule` |
| `g` again | re-executar último intent (V2 léxico, honrar em V9 ou V10 se ainda não) |
| undo | `NlpHit.rewind` → `rewindTo` |
| oops | **não** |

---

## 9. Testes (pirâmide)

| Tipo | Onde | Alvo |
|------|------|------|
| Unitário vocab | `lume-vocab/__tests__` | lookup, números, unicidade fold |
| Unitário nlp | `nlp.test.ts` **estende**, não reescreve | frases novas + falha fechada antiga |
| Caderno | `notebook.test.ts` | `Entenda` |
| Integração | execute `pega o pincel` depois do compile | um beat |
| Paridade V11 | mesmo `triggerId` / mesmo hp | N12 style |
| Determinismo | mesma frase + mesmo mundo + mesmo seed → mesmo command | 100% |

Performance: lookup O(1) no Map. Interpret O(linhas_grammar × tokens). Sem meta de 16 ms I7 — o beat Lume já é o custo.

---

## 10. Riscos

| Risco | Mitigação |
|-------|-----------|
| Portar Parser.i6 “porque o anexo é grande” | Recusas §2; cada Vn cabe num PR curto |
| Folhas a mais no catálogo | V8 tecto: só wear/remove |
| ALL destrói o mundo | LV-09 tecto 12 + W033 |
| Notebook a importar nlp | capability Vocab / ficheiro de verbos no vocab |
| Quebrar Caverna | V3 mantém fallback; V4 só quando os testes nlp verdes |
| Pronomes vs rewind | recalcular; não relógio |

---

## 11. O que “nível Inform 7” significa neste plano (definição de pronto)

O jogador **consegue**, em PT e EN, sem pontinhos:

1. Verbos compostos (`pick up`, `falar com`).
2. Artigos e lixo gramatical (`pega a espada`, `take the sword`).
3. Sinónimos de autor (`pincel` → Espada) via caderno.
4. Desambiguação por scope/held/comprimento, empate fechado.
5. Pronome do último alvo.
6. `tudo` / `e` / `excepto` com tecto.
7. `norte` se existir `exit_norte`.
8. `posso` continua dry-run.
9. `dance with the goblin` continua `null`.
10. A saída é **sempre** `intent.*` para o **mesmo** matcher.

Não significa: 63 secções, 50 primitivas, rulebooks I7, Choose Objects, Time of day, OOPS, SHOWVERB.

---

**Fim do plano.** Pedido seguinte típico: *«faça agora Fase V0, de forma completa, sem mais e sem menos»*.

*Versão: 1.0 · Não implementa · Idioma Lume*
