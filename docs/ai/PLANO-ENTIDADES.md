# Plano Lume — Caderno de entidades (o que existe)

> Depois de **C1–C12 (feito)**. Traduz o guia *Cadernos de Entidades* (ficheiro DeepSeek, 13/09/2026) e o pedido *«Eu escrevo 'Alexandre é um Agent'; ao Enter, o motor já tem Alexandre.{ tags: agent }»*.
> **Ainda um só `findMatchingRule`.** O caderno **não** é um segundo ECS: é um **compilador** (frase humana → fontes Lume). Sem Sharpee, sem componentes runtime, sem leilão.

**Como usar este ficheiro:** cada fase Nn é um pedido futuro *«faça agora Fase Nn, de forma completa, sem mais e sem menos»*. Este plano **não implementa**. Só descreve.

---

## 0. Tese

O caderno já descreve **o que acontece** (`Quando` / `Se` / `narre`). Falta descrever **o que existe** com a mesma língua, e **vê-lo no motor no Enter**.

```
Alexandre é um Agent↵
        │ compileNotebook (linha fechada)
        ▼
# --- lume-caderno ---
ALEXANDRE.{
tags: agent;
stats: ;
links: ;
}
# --- /lume-caderno ---
        │ compileProject (já existe)
        ▼
worldModel.get("ALEXANDRE")
```

**Sincronização.** Hoje o motor mostra só `project.entitiesSource` (à mão). O caderno compilado entra **só** em `applyNotebookToProject` na hora do `diagnose` — a autora **não vê** o bloco. O pedido é: a fatia gerada **aparece** no editor de Entidades, como se tivesse sido escrita lá.

Três eixos:

| Eixo | Significado em Lume | Não é |
|------|---------------------|-------|
| **`é um` / `tem` / `está em`** | Léxico de mundo no `compileNotebook` | ECS, componentes Allegory, Sharpee |
| **Sincronização** | Fatia marcada no motor, regenerada no Enter | two-way merge, LLM a reescrever o caderno |
| **Um matcher** | Entidade = tags/stats/links; regra = ON/IF/DO | segundo runtime de “comportamento de entidade” |

---

## 1. O que já está feito (não reconstruir)

| Pedido do guia | Já no Lume | Falta |
|----------------|------------|-------|
| `A espada está na caverna.` | C2: `ESPADA` + `CAVERNA` + `in`/`current_location` | `é um objeto` explícito |
| `Ela é uma arma.` | C3: tags `object, weapon` | `é um Agent` com maiúscula inglesa |
| `O goblin está na caverna.` | C2: `agent` `vivo` se o nome parece pessoa | tipo explícito bate o palpite |
| `Quando …:` | C3–C6: regra | flush no Enter para o motor |
| Merge compile | `applyNotebookToProject` junta fontes | **não escreve** no editor do motor |
| Recompile | `setNotebooks` espera **280 ms** | Enter deve ser **já** |
| Emit entidade | `emitDraft` omite `stats:` vazio e mete `name:` | o motor em branco é `tags:  ; stats: ; links: ;` |
| Caderno vazio | `+` cria caderno (C12 + UX) | — |

**Buraco único em relação ao exemplo do autor:**

```
Alexandre é um Agent     ← o compilador ainda não trata `é um <tipo>` como kind
[Enter]                  ← o motor não mostra o bloco
```

---

## 2. Contrato de sincronização

```
caderno (notebooksSource)     fonte humana, a autora escreve aqui
        │ Enter (linha fechada)  ou 280 ms se está a meio da frase
        ▼
compileNotebook()             plugin lume-notebook
        │
        ├─ entidades  ─┐
        ├─ regras      ─┼─ fatia marcada no motor
        └─ taxonomia   ─┘
        ▼
entitiesSource / rulesSource / taxonomySource

# (à mão, a autora pode editar)
JOGADOR.{ tags: agent; … }
start()

# --- lume-caderno ---
ALEXANDRE.{
tags: agent;
stats: ;
links: ;
}
# --- /lume-caderno ---
```

Regras da fatia:

1. **O caderno é dono da fatia.** Cada compile **apaga e reescreve** o que está entre os marcadores. Nada de duplicar `ALEXANDRE` se a autora já o descreveu no caderno.
2. **Fora dos marcadores é à mão.** `Nova história` / kits / o que a autora escrever no motor **fica**. O join actual (`handwritten + compiled`) passa a ser **substituição da fatia**, não concatenação infinita.
3. **Sentido único caderno → motor.** Editar a fatia no motor **não** actualiza o caderno. No próximo Enter a fatia volta ao compile. Aviso W030 se a fatia foi tocada (opcional, N9).
4. **Enter = commit.** Linha sem `\n` final (a que o cursor ainda está a escrever) **não** entra no compile. O resto do caderno sim.
5. **Regras iguais às entidades.** `Quando o jogador pega a espada:` no caderno → bloco `# caderno` em `rulesSource` no mesmo Enter.
6. **Play e fingerprint** usam as fontes já fundidas. `applyNotebookToProject` deixa de concatenar se a fatia já está no sítio; ou torna-se no escritor da fatia. Um só caminho.

**Não fazer:** motor a gerar prosa de caderno; diff semântico; embeddings a “adivinhar” que Alexandre no motor é o mesmo no caderno — o id é o slug.

---

## 3. Gramática — o que existe

Falha fechada: frase que não casa = W020 «Não percebi esta linha.» (já existe). Não cria entidade fantasma.

### 3.1 Tipo (`é um`)

| Frase | tags Lume |
|-------|-----------|
| `Alexandre é um Agent.` / `agente` / `npc` | `agent` (+ `vivo` se agente) |
| `A espada é um objeto.` / `object` / `objecto` | `object` |
| `A caverna é um lugar.` / `place` / `sala` | `place` |
| `A magia é um abstrato.` | tag `abstract` (não é runtime novo) |
| `O segredo é uma informação.` | tag `info` |
| `A queda é um evento.` | tag `event` |

Aspas opcionais: `'Alexandre' é um Agent` → id `ALEXANDRE`, name `Alexandre`.

Pronome: `Ele é um humano.` aplica-se a `currentId` (já C4).

`é um Y` que **não** é tipo: `Ele é um humano.` → tag extra `humano` (slug), **além** do tipo se já existir. Palavras do motor (`agent`, `object`, `place`, `weapon`, `hostile`, `vivo`, `channel`) mapeiam para o inglês do matcher; o resto fica tag humana.

### 3.2 Stats (`tem`)

| Frase | Compila para |
|-------|----------------|
| `Ele tem:⏎  - força: 12` | `stats: forca=12` (slug da chave) |
| `Ele tem 100 de vida.` | `hp=100` (alias já do kit combate) |
| `Ela tem dano: 15.` | `dano=15` |
| `vida` / `hp`, `mana`, `ouro` | stats com esses nomes |

Lista indentada sob `tem:` acumula até linha não-lista. Não é componente ECS.

### 3.3 Links (`está` / relações)

| Frase | Compila para |
|-------|----------------|
| `Ele está na Vila.` | `current_location=VILA` (ou `in`, o que o motor já usa) |
| `Ela pertence ao Rei.` | `owner=REI` |
| `Ele é dono da Forja.` | `Forja.owner=FERREIRO` (o objecto aponta; se a Forja não existe, cria-se) |
| `Ele é amigo do Guarda.` | `amigo=GUARDA` **ou** kit-social `relation` se o kit estiver ligado — **não** os dois |
| `Ela contém a Forja.` / `Ele carrega um martelo.` | `in` / `current_location` do conteúdo |
| `Ela leva ao norte para a Floresta.` | já C2 `exit_*` |

### 3.4 Traits, grupos, herança (compile, não runtime)

| Frase | Compila para |
|-------|----------------|
| `Ela tem o trait "Equipável".` | tag `equipavel` |
| `O grupo "Humanos" inclui: - o Ferreiro` | taxonomia `ferreiro → humano` **ou** tag `humano` em cada um; **um** dos dois, não os dois |
| `A Espada herda de Arma.` / `Template "Arma Comum"` | taxonomia `espada → arma` + stats default **no compile** copiados para o draft se ainda vazios |

**Fora:** componente de IA, física 20 Hz, slot de equipamento como sistema, buff com relógio de parede. Buff = stat + `WAIT` já existente, se a autora escrever `Quando`/`a cada turno`.

### 3.5 Comportamento fica nas regras

`Quando o jogador entra na forja:` no **mesmo** caderno já é C3. Não nasce um “behavior” na entidade. A entidade ganha tags/stats/links; a reacção é regra.

---

## 4. Arquitectura

```
NotebookEditor          Enter fecha a linha
    │
    ▼
setNotebooks(text, { flush: true })     N1
    │
    ▼
compileNotebook(text)                   plugin, já existe
    │
    ▼
writeCadernoSlice(project, nb)          N1 / N9
    │  substitui # --- lume-caderno ---
    ▼
entitiesSource / rulesSource / taxonomySource
    │
    ▼
diagnose / compileProject               já existe
    │
    ▼
SourceEditor (Mostrar motor)            vê a fatia
Preview / Play                          o mesmo worldModel
```

Plugin dono: **`lume-notebook`**. `writeCadernoSlice` vive em `lib/pages.ts` ao lado de `applyNotebookToProject`. O `ide-state` no Enter chama flush; o debounce 280 ms fica para teclas que **não** são Enter.

`narrative-engine` **não** muda o matcher. Tags novas (`abstract`, `info`, `event`) são tags como as outras; o play só as usa se uma regra as citar.

---

## 5. Fases (uma de cada vez)

### Fase N1 — `é um <tipo>` + fatia no motor + Enter

- Parser: `X é um(a)? (agent|agente|npc|objeto|object|lugar|place|…)` (fold, aspas).
- `ensure(X)` + `markKind` / tag `agent` (sem inventar `vivo` em Agent inglês a não ser que a palavra seja agente/npc).
- Emit alinhado ao `blankEntityBlock`: sempre `tags:` `stats:` `links:` (mesmo vazios). `name:` pode ficar.
- Marcadores `# --- lume-caderno ---` / `# --- /lume-caderno ---` em entidades **e** regras.
- `applyNotebookToProject` **escreve a fatia** em vez de concatenar às cegas.
- Enter no `NotebookEditor` → `setNotebooks(..., { flush: true })` → `recompile` já, sem 280 ms.
- Teste: caderno `Alexandre é um Agent.\n` → motor contém `ALEXANDRE.{` `tags: agent;` `stats: ;` `links: ;`. Segunda compilação **não** duplica. Texto à mão acima dos marcadores permanece.

**Não nesta fase:** stats, amigos, traits, templates, os seis tipos além de agent/object/place, W030.

### Fase N2 — `é um Y` como tag; aspas; pronome

- `Ele é um humano.` → tag `humano` no `currentId`.
- `'A Espada Enferrujada' é um objeto.` → id slug, name com espaços.
- Palavras-tipo (N1) **não** viram tag extra `agente` a duplicar `agent`.
- Teste: Ferreiro agente + `Ele é um humano.` → `tags: agent, humano` (ordem estável).

### Fase N3 — `tem` stats

- Bloco `Ele tem:` + linhas `- chave: número`.
- `tem N de vida/mana/ouro/dano`.
- `vida` → `hp` se o kit combate estiver no projecto; senão `vida`.
- Teste: `força: 12` e `100 de vida` no bloco emitido.

### Fase N4 — links de sítio, posse, social

- `está na/no/em`, `pertence`, `é dono`, `é amigo` / `rival` / `casado` / `pai` / `membro`.
- Um predicado → uma chave de link. Não criar entidade `relation` nova se o kit-social já define a chave.
- Teste: Ferreiro na Vila; Espada pertence ao Rei; ids resolvidos por alias C4.

### Fase N5 — abstrato / informação / evento

- Tags `abstract` `info` `event`. Sem sistema novo.
- `Ele acontece quando:` no caderno de evento = `Quando` (reusa C3), não um scheduler.
- Teste: `A Magia é um abstrato.` → tag, sem `ON:`.

### Fase N6 — contém / carrega / inventário

- `contém:` lista → cada item `in`/`current_location` = contentor.
- `carrega:` igual, contentor = agente.
- Não há componente inventário. Peso/capacidade = stats se a autora os `tem`.

### Fase N7 — traits e grupos

- `tem o trait "X"` → tag slug.
- `O grupo "Humanos" inclui:` → taxonomia `membro → humanos` **ou** tag; escolher **tag** (mais simples, um matcher). Grupo vira tag comum.
- Teste: grupo não cria entidade `HUMANOS` a não ser que a autora a defina.

### Fase N8 — herança e template (compile)

- `X herda de Y` / `X é um tipo de Y` → linha de taxonomia `x → y`.
- `Template "NPC Comum":` guarda defaults; `O Ferreiro é um NPC Comum.` copia stats/tags **se** o draft ainda não os tem.
- Não há instância runtime de template.

### Fase N9 — motor visível, fatia sagrada, W030

- Editor de Entidades/Regras mostra a fonte **já com fatia**.
- Tocar na fatia e gravar no motor: próximo Enter do caderno reescreve; W030 uma vez.
- `Mostrar motor` não esconde a fatia. Kits e `start()` ficam fora.

### Fase N10 — regras no mesmo Enter

- `Quando`/`Se`/`narre` (já C3–C7) escrevem na fatia de `rulesSource` no flush.
- Teste: uma página com `Alexandre é um Agent.` + `Quando o jogador fala com Alexandre:` → entidade **e** regra no motor após um Enter.

### Fase N11 — cor e tab no caderno

- Highlight: `é um`, `é uma`, `tem`, `está`, `contém`, `trait`, `grupo`, `herda`.
- Tab-espaço depois dessas palavras (como `Quando`).
- Sem autocomplete de intent.

### Fase N12 — paridade e tecto

- Play do caderno = play do mesmo mundo escrito à mão no motor.
- Duplicar id caderno/mão: o caderno ganha na fatia; W031 se o id também existir à mão **acima** do marcador (a autora deve apagar um).
- W021 (500 regras) inalterado.
- Sem embeddings, sem segundo matcher, sem 20 Hz.

---

## 6. Mapa rápido guia → Lume

| Guia DeepSeek | Lume |
|---------------|------|
| Agente / Objeto / Lugar | tags `agent` `object` `place` |
| Abstrato / Informação / Evento | tags `abstract` `info` `event` |
| TAGS / STATS / LINKS | as três linhas do bloco `.{}` |
| Componentes | **não** — viram stats/links/tags ou W020 |
| Traits | tags |
| Grupos | tag comum |
| Herança / template | taxonomia + defaults no compile |
| Humor / memória / relação | kit-social já E2, se a autora ligar o kit |
| Inventário / equipamento | `in` + tags `equipavel`; sem slots |
| Comportamento do Ferreiro | `Quando` no mesmo caderno |

---

## 7. Não fazer (em nenhuma Nn)

- `npm install` Allegory / Sharpee / ENE / DataScript.
- Componente como bucket JSON no beat.
- Sincronização motor → caderno (a autora não pede prosa gerada).
- Debounce no Enter.
- Concatenar a fatia em cima da fatia antiga (duplicar Alexandre).
- Criar entidade só porque a linha tem um nome próprio sem predicado.
- Mudar `findMatchingRule`.

---

## 8. Ordem de implementação

N1 desbloqueia o exemplo do autor. N2–N8 alargam a língua. N9–N10 fecham a vista motor. N11 é polimento do caderno. N12 tranca o contrato.

Pedido seguinte esperado: *«faça agora Fase N1, de forma completa, sem mais e sem menos»*.
