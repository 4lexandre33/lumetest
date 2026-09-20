# DeepSeek — Exportação de Conversas

> **Exportado em:** 13/09/2026, 06:55:52
> **Conversas exportadas:** 1
> **Total de mensagens:** 1

---

## 1. Allegory.js

> **ID:** `de561454-37e2-430a-9937-af5afd192492` · **Criada:** 12/09/2026, 19:25:06 · **Atualizada:** 13/09/2026, 06:05:24 · **Mensagens:** últimas 1 de 88

### 📄 ASSISTANT

# 📓 Cadernos de Entidades — Guia Completo

Continuação do guia de regras. Agora, a **linguagem de entidades**: como definir **agentes, objetos, lugares, abstratos, informações e eventos** em linguagem humana natural, com **tags**, **stats** e **links**.

---

## 1. Filosofia dos Cadernos de Entidades

### 1.1 A Diferença entre Regras e Entidades

| Caderno de Regras | Caderno de Entidades |
|-------------------|---------------------|
| Descreve **o que acontece** | Descreve **o que existe** |
| Usa `quando`, `se`, `senão` | Usa `é um`, `tem`, `está em` |
| Foco em **comportamento** | Foco em **identidade e relação** |
| Exemplo: `Quando o jogador pega a espada:` | Exemplo: `A espada é uma arma.` |

### 1.2 Os Seis Tipos de Entidade

| Tipo | Pergunta | Exemplos |
|------|----------|----------|
| **Agente** | Quem age? | NPCs, criaturas, facções, o jogador |
| **Objeto** | O que existe fisicamente? | Armas, poções, portas, tesouros |
| **Lugar** | Onde? | Salas, regiões, cidades, mundos |
| **Abstrato** | O que é conceitual? | Magia, honra, medo, tempo |
| **Informação** | O que se sabe? | Fatos, rumores, segredos, mapas |
| **Evento** | O que aconteceu? | Guerras, mortes, descobertas |

### 1.3 Os Três Eixos

Toda entidade é definida por **três eixos**:

```
TAGS  — O que ela É (identidade)
STATS — O que ela TEM (propriedades numéricas)
LINKS — Como ela se RELACIONA (conexões)
```

E, opcionalmente:

```
COMPONENTES — Blocos de dados estruturados
TRAITS      — Capacidades que ela pode exercer
```

---

## 2. Estrutura de um Caderno de Entidades

```
╔══════════════════════════════════════════╗
║  CADERNO DE ENTIDADES: O Reino de Eldoria║
║  Autora: Maria                            ║
║  Data: 13 de setembro de 2026             ║
╚══════════════════════════════════════════╝

## Índice
1. Agentes
2. Objetos
3. Lugares
4. Abstratos
5. Informações
6. Eventos
7. Tags Globais
8. Stats Globais
9. Links Globais
10. Grupos e Categorias

---

## 1. Agentes
...

## 2. Objetos
...

etc.
```

---

## 3. Caderno de Agentes

### 3.1 Definindo um Agente Simples

```
## Agentes

### O Ferreiro

O Ferreiro é um agente.
Ele é um humano.
Ele é um NPC.
Ele é amigável.

Ele está na Vila de Pedra.
```

**Tradução interna:**
- Tags: `agente`, `humano`, `npc`, `amigável`
- Link: `está_em → Vila de Pedra`

### 3.2 Agente com Stats

```
### O Ferreiro

O Ferreiro é um agente.
Ele é um humano.
Ele é um NPC.
Ele é amigável.

Ele tem:
  - força: 12
  - destreza: 8
  - constituição: 10
  - inteligência: 14
  - sabedoria: 12
  - carisma: 10

Ele tem 100 de vida.
Ele tem 0 de mana.
Ele tem 50 de ouro.
```

**Tradução interna:**
- Stats: `força=12, destreza=8, ...`, `vida=100`, `mana=0`, `ouro=50`

### 3.3 Agente com Links

```
### O Ferreiro

O Ferreiro é um agente.
Ele está na Vila de Pedra.
Ele é dono da Forja.
Ele é amigo do Guarda.
Ele é rival do Mercador.
Ele é membro da Guilda dos Ferreiros.
Ele é casado com a Filha do Padeiro.
Ele tem um filho chamado Jovem Ferreiro.
```

**Tradução interna:**
- Links: `está_em`, `dono_de`, `amigo_de`, `rival_de`, `membro_de`, `casado_com`, `pai_de`

### 3.4 Agente com Comportamento

```
### O Ferreiro

O Ferreiro é um agente.
Ele é amigável.
Ele acorda às 6h.
Ele trabalha das 8h às 18h.
Ele dorme às 22h.

Quando o jogador entra na forja:
  o Ferreiro cumprimenta o jogador.

Quando o jogador pede para consertar uma arma:
  se o Ferreiro tem minério:
    o Ferreiro conserta a arma.
  senão:
    o Ferreiro pede minério ao jogador.
```

### 3.5 Agente com Humor e Memória

```
### O Ferreiro

O Ferreiro é um agente.
Ele tem humor.
O humor dele começa em 2.

Ele tem memória.
Ele lembra de quem o ajudou.
Ele lembra de quem o prejudicou.

Quando o jogador ajuda o Ferreiro:
  aumente o humor dele em 1.
  registre na memória: "jogador ajudou".

Quando o jogador prejudica o Ferreiro:
  diminua o humor dele em 2.
  registre na memória: "jogador prejudicou".
```

### 3.6 Agente com Relacionamentos

```
### O Ferreiro

O Ferreiro é um agente.
Ele tem relacionamentos.

O relacionamento dele com o Guarda começa em 50 (amigo).
O relacionamento dele com o Mercador começa em -30 (rival).
O relacionamento dele com o jogador começa em 0 (neutro).

Quando o jogador ajuda o Ferreiro:
  aumente o relacionamento com o jogador em 10.

Quando o jogador prejudica o Ferreiro:
  diminua o relacionamento com o jogador em 20.
```

### 3.7 Agente com Facção

```
### O Ferreiro

O Ferreiro é um agente.
Ele é membro da Guilda dos Ferreiros.
Ele é leal à Guilda.
Ele paga 10% do seu ouro à Guilda todo mês.
```

### 3.8 Agente com Inventário

```
### O Ferreiro

O Ferreiro é um agente.
Ele tem um inventário.
Ele carrega:
  - um martelo
  - 5 minérios de ferro
  - 100 moedas de ouro
  - uma chave da forja
```

### 3.9 Agente com Habilidades

```
### O Ferreiro

O Ferreiro é um agente.
Ele tem habilidades:
  - Forjar Arma (nível 5)
  - Reparar Armadura (nível 4)
  - Negociar (nível 3)
```

### 3.10 Agente com Objetivos

```
### O Ferreiro

O Ferreiro é um agente.
Ele tem objetivos:
  - curto prazo: conseguir mais minério
  - médio prazo: expandir a forja
  - longo prazo: se tornar o maior ferreiro do reino
```

---

## 4. Caderno de Objetos

### 4.1 Definindo um Objeto Simples

```
## Objetos

### A Espada Enferrujada

A Espada Enferrujada é um objeto.
Ela é uma arma.
Ela é uma espada.
Ela é amaldiçoada.
Ela está na Caverna.
```

**Tradução interna:**
- Tags: `objeto`, `arma`, `espada`, `amaldiçoada`
- Link: `está_em → Caverna`

### 4.2 Objeto com Stats

```
### A Espada Enferrujada

A Espada Enferrujada é um objeto.
Ela é uma arma.

Ela tem:
  - dano: 15
  - peso: 3
  - durabilidade: 50
  - valor: 100

Ela tem 0 de mágica.
```

### 4.3 Objeto com Links

```
### A Espada Enferrujada

A Espada Enferrujada é um objeto.
Ela está na Caverna.
Ela pertence ao Rei.
Ela foi forjada pelo Ferreiro Lendário.
Ela é a chave para a Maldição.
```

### 4.4 Objeto com Comportamento

```
### A Espada Enferrujada

A Espada Enferrujada é um objeto.

Quando alguém pega a espada:
  se a pessoa é sensível à magia:
    a maldição se ativa.
  senão:
    nada acontece.

Quando a maldição se ativa:
  marque o portador como "maldito".
  cause 1 de dano por turno.
```

### 4.5 Objeto com Componentes

```
### A Espada Enferrujada

A Espada Enferrujada é um objeto.
Ela tem:
  - um fio (afiado, 15 de dano)
  - um cabo (couro, 3 de peso)
  - uma guarda (ferro, 2 de defesa)
  - uma lâmina (aço, 10 de durabilidade)
```

### 4.6 Objeto com Categoria

```
### A Espada Enferrujada

A Espada Enferrujada é um objeto.
Ela é uma arma.
Ela é uma arma corpo a corpo.
Ela é uma arma de uma mão.
Ela é uma arma pesada.
```

### 4.7 Objeto com Estado

```
### A Porta do Castelo

A Porta do Castelo é um objeto.
Ela é uma porta.
Ela está trancada.
Ela é resistente.
Ela tem 100 de vida.
```

### 4.8 Objeto com Conteúdo

```
### O Baú do Tesouro

O Baú do Tesouro é um objeto.
Ele é um contêiner.
Ele está trancado.
Ele contém:
  - 500 moedas de ouro
  - uma coroa
  - um anel mágico
  - um mapa antigo
```

### 4.9 Objeto com Modificadores

```
### A Poção de Cura

A Poção de Cura é um objeto.
Ela é consumível.

Quando alguém bebe a poção:
  cure 30 de vida.
  remova a poção.
```

### 4.10 Objeto Empilhável

```
### A Flecha

A Flecha é um objeto.
Ela é uma munição.
Ela pode ser empilhada até 50.
Ela tem:
  - dano: 5
  - peso: 0.1
```

---

## 5. Caderno de Lugares

### 5.1 Definindo um Lugar Simples

```
## Lugares

### A Vila de Pedra

A Vila de Pedra é um lugar.
Ela é uma vila.
Ela é pequena.
Ela é pacata.
```

### 5.2 Lugar com Stats

```
### A Vila de Pedra

A Vila de Pedra é um lugar.

Ela tem:
  - população: 200
  - riqueza: 50
  - segurança: 80
  - iluminação: 2
```

### 5.3 Lugar com Links

```
### A Vila de Pedra

A Vila de Pedra é um lugar.
Ela está ao sul da Floresta Sombria.
Ela está ao norte do Rio.
Ela está a leste das Montanhas.
Ela é governada pelo Prefeito.
```

### 5.4 Lugar com Descrição

```
### A Vila de Pedra

A Vila de Pedra é um lugar.
Ela é pequena e pacata.
Há uma fonte no centro.
Há uma taverna ao lado.
O ar cheira a pão fresco.
```

### 5.5 Lugar com Conteúdo

```
### A Vila de Pedra

A Vila de Pedra é um lugar.
Ela contém:
  - a Forja do Ferreiro
  - a Taverna do Cervo
  - a Casa do Prefeito
  - a Fonte Central
```

### 5.6 Lugar com Saídas

```
### A Vila de Pedra

A Vila de Pedra é um lugar.
Ela leva ao norte para a Floresta Sombria.
Ela leva ao sul para o Rio.
Ela leva ao leste para as Montanhas.
```

### 5.7 Lugar com Clima

```
### A Vila de Pedra

A Vila de Pedra é um lugar.
Ela tem clima temperado.
Ela tem quatro estações.
No inverno, neva.
Na primavera, floresce.
No verão, faz calor.
No outono, as folhas caem.
```

### 5.8 Lugar com Perigo

```
### A Floresta Sombria

A Floresta Sombria é um lugar.
Ela é perigosa.
Ela tem:
  - perigo: 7 (de 10)
  - visibilidade: 1 (de 3)
  - temperatura: 10 graus

Quando o jogador entra na floresta:
  role um dado de 20 lados.
  se o resultado é menor que 5:
    um lobo aparece.
```

### 5.9 Lugar com Facção

```
### O Castelo do Rei

O Castelo do Rei é um lugar.
Ele é controlado pelo Reino.
Ele é leal ao Rei.
Ele tem 50 guardas.
```

### 5.10 Lugar com História

```
### As Ruínas Antigas

As Ruínas Antigas são um lugar.
Elas foram uma cidade próspera.
Elas foram destruídas por uma maldição.
Elas estão abandonadas há 100 anos.
```

---

## 6. Caderno de Abstratos

### 6.1 Definindo um Abstrato

```
## Abstratos

### A Magia

A Magia é um abstrato.
Ela é uma força.
Ela é antiga.
Ela é misteriosa.
```

### 6.2 Abstrato com Stats

```
### A Magia

A Magia é um abstrato.

Ela tem:
  - poder: 100
  - raridade: 80
  - perigo: 50
```

### 6.3 Abstrato com Links

```
### A Magia

A Magia é um abstrato.
Ela é canalizada pelos Magos.
Ela é temida pelos Camponeses.
Ela é estudada pela Academia.
Ela é proibida pelo Rei.
```

### 6.4 Abstrato com Regras

```
### A Magia

A Magia é um abstrato.

Quando um mago lança um feitiço:
  diminua a mana do mago.
  se a mana é menor que 0:
    o feitiço falha.

A cada turno:
  a mana do mago regenera em 1.
```

### 6.5 Abstrato com Manifestações

```
### A Magia

A Magia é um abstrato.
Ela se manifesta como:
  - Fogo (dano)
  - Água (cura)
  - Terra (proteção)
  - Ar (movimento)
  - Luz (revelação)
  - Sombra (ocultação)
```

### 6.6 Abstrato com Facções

```
### A Honra

A Honra é um abstrato.
Ela é valorizada pelos Cavaleiros.
Ela é desprezada pelos Ladrões.
Ela é neutra para os Mercadores.
```

### 6.7 Abstrato com Consequências

```
### O Medo

O Medo é um abstrato.

Quando um NPC tem medo:
  diminua a coragem dele.
  ele pode fugir.

Quando um jogador tem medo:
  diminua a precisão dele.
  ele pode hesitar.
```

---

## 7. Caderno de Informações

### 7.1 Definindo uma Informação

```
## Informações

### O Segredo do Rei

O Segredo do Rei é uma informação.
Ele é um segredo.
Ele é perigoso.
Ele é valioso.
```

### 7.2 Informação com Stats

```
### O Segredo do Rei

O Segredo do Rei é uma informação.

Ele tem:
  - importância: 100
  - veracidade: 100
  - perigo: 90
```

### 7.3 Informação com Links

```
### O Segredo do Rei

O Segredo do Rei é uma informação.
Ele é conhecido pelo Conselheiro.
Ele é desconhecido pelo Povo.
Ele é temido pelos Rebeldes.
```

### 7.4 Informação com Conteúdo

```
### O Segredo do Rei

O Segredo do Rei é uma informação.
Ele diz que o Rei tem um filho bastardo.
Ele diz que o filho vive na vila.
Ele diz que o filho não sabe de sua origem.
```

### 7.5 Informação com Propagação

```
### O Segredo do Rei

O Segredo do Rei é uma informação.

Quando alguém descobre o segredo:
  marque a informação como "descoberta".

A cada dia:
  o segredo se espalha para 1 NPC aleatório.
  se o segredo chega a 10 NPCs:
    o segredo se torna público.
    o Rei fica furioso.
```

### 7.6 Informação como Rumor

```
### O Rumor da Guerra

O Rumor da Guerra é uma informação.
Ele é um rumor.
Ele pode ser verdadeiro ou falso.

Quando o rumor se espalha:
  os NPCs ficam preocupados.
  os preços sobem.
  os guardas ficam alertas.
```

### 7.7 Informação como Fato

```
### A Localização do Tesouro

A Localização do Tesouro é uma informação.
Ela é um fato.
Ela é verdadeira.

Ela diz que o tesouro está nas Montanhas Geladas.
Ela diz que o tesouro é guardado por um dragão.
Ela diz que o tesouro vale 10.000 moedas de ouro.
```

### 7.8 Informação como Mapa

```
### O Mapa Antigo

O Mapa Antigo é uma informação.
Ele é um mapa.
Ele mostra o caminho para as Ruínas Antigas.
Ele mostra a localização do tesouro.
Ele é escrito em uma língua antiga.
```

---

## 8. Caderno de Eventos

### 8.1 Definindo um Evento

```
## Eventos

### A Queda do Dragão

A Queda do Dragão é um evento.
Ele é um evento importante.
Ele é lendário.
```

### 8.2 Evento com Stats

```
### A Queda do Dragão

A Queda do Dragão é um evento.

Ele tem:
  - importância: 100
  - dificuldade: 90
  - recompensa: 1000
```

### 8.3 Evento com Links

```
### A Queda do Dragão

A Queda do Dragão é um evento.
Ele aconteceu nas Montanhas Geladas.
Ele foi causado pelo Jogador.
Ele envolveu o Dragão.
Ele salvou o Reino.
```

### 8.4 Evento com Condições

```
### A Queda do Dragão

A Queda do Dragão é um evento.

Ele acontece quando:
  - o jogador tem a Espada do Herói
  - o jogador está nas Montanhas Geladas
  - o jogador enfrenta o Dragão
  - o jogador derrota o Dragão
```

### 8.5 Evento com Consequências

```
### A Queda do Dragão

A Queda do Dragão é um evento.

Quando ele acontece:
  o Reino é salvo.
  o jogador se torna um herói.
  a reputação do jogador com o Reino aumenta em 100.
  o Dragão é destruído.
  o tesouro do Dragão é revelado.
```

### 8.6 Evento com Testemunhas

```
### A Queda do Dragão

A Queda do Dragão é um evento.
Ele foi testemunhado por:
  - o Guarda
  - o Ferreiro
  - o Mago

As testemunhas lembram do evento.
As testemunhas contam a história para outros.
```

### 8.7 Evento com Fases

```
### A Queda do Dragão

A Queda do Dragão é um evento.

Fase 1: O jogador encontra a Espada do Herói.
Fase 2: O jogador sobe as Montanhas Geladas.
Fase 3: O jogador enfrenta o Dragão.
Fase 4: O jogador derrota o Dragão.
Fase 5: O Reino é salvo.
```

### 8.8 Evento Recorrente

```
### A Festa da Colheita

A Festa da Colheita é um evento.
Ela acontece todo ano.
Ela acontece no outono.
Ela dura 3 dias.

Quando ela acontece:
  os NPCs ficam mais alegres.
  os preços caem.
  as tavernas ficam cheias.
```

### 8.9 Evento Aleatório

```
### A Tempestade

A Tempestade é um evento.
Ela pode acontecer a qualquer momento.

A cada turno:
  role um dado de 20 lados.
  se o resultado é menor que 3:
    a Tempestade acontece.

Quando a Tempestade acontece:
  a visibilidade cai.
  o movimento é mais lento.
  os NPCs ficam em casa.
```

---

## 9. Tags — Etiquetas

### 9.1 Tags de Identidade

```
O Ferreiro é um humano.
O Ferreiro é um NPC.
O Ferreiro é um artesão.
O Ferreiro é um membro da Guilda.
```

**Tags:** `humano`, `npc`, `artesão`, `membro_da_guilda`

### 9.2 Tags de Estado

```
A Porta está trancada.
A Porta está emperrada.
A Tocha está acesa.
A Poção está cheia.
```

**Tags:** `trancada`, `emperrada`, `acesa`, `cheia`

### 9.3 Tags de Categoria

```
A Espada é uma arma.
A Espada é uma arma corpo a corpo.
A Espada é uma arma de uma mão.
A Espada é uma arma pesada.
```

**Tags:** `arma`, `arma_corpo_a_corpo`, `arma_uma_mão`, `arma_pesada`

### 9.4 Tags de Facção

```
O Guarda é leal ao Reino.
O Rebelde é leal à Rebelião.
O Mercador é neutro.
```

**Tags:** `leal_ao_reino`, `leal_à_rebelião`, `neutro`

### 9.5 Tags de Perigo

```
A Floresta é perigosa.
O Dragão é mortal.
A Poção é venenosa.
```

**Tags:** `perigosa`, `mortal`, `venenosa`

### 9.6 Tags de Raridade

```
A Espada é lendária.
A Poção é comum.
O Anel é raro.
```

**Tags:** `lendária`, `comum`, `raro`

### 9.7 Tags de Elemento

```
A Espada é flamejante.
O Escudo é gelado.
A Armadura é elétrica.
```

**Tags:** `flamejante`, `gelado`, `elétrico`

### 9.8 Tags de Mágica

```
O Anel é mágico.
A Poção é mágica.
A Espada é mágica.
```

**Tags:** `mágico`

### 9.9 Tags de Consumível

```
A Poção é consumível.
A Comida é consumível.
A Água é consumível.
```

**Tags:** `consumível`

### 9.10 Tags de Equipável

```
A Espada é equipável.
A Armadura é equipável.
O Anel é equipável.
```

**Tags:** `equipável`

---

## 10. Stats — Atributos

### 10.1 Stats Físicos

```
O Ferreiro tem:
  - força: 12
  - destreza: 8
  - constituição: 10
  - vida: 100
  - peso: 80
  - altura: 1.75
```

### 10.2 Stats Mentais

```
O Mago tem:
  - inteligência: 18
  - sabedoria: 16
  - carisma: 10
  - mana: 100
  - sanidade: 100
```

### 10.3 Stats Sociais

```
O Mercador tem:
  - reputação: 50
  - riqueza: 5000
  - influência: 30
  - carisma: 14
```

### 10.4 Stats de Combate

```
O Cavaleiro tem:
  - ataque: 20
  - defesa: 15
  - precisão: 12
  - esquiva: 8
  - iniciativa: 10
```

### 10.5 Stats de Item

```
A Espada tem:
  - dano: 15
  - peso: 3
  - durabilidade: 50
  - valor: 100
  - alcance: 1
```

### 10.6 Stats de Lugar

```
A Vila tem:
  - população: 200
  - riqueza: 50
  - segurança: 80
  - iluminação: 2
  - temperatura: 15
```

### 10.7 Stats de Evento

```
A Queda do Dragão tem:
  - importância: 100
  - dificuldade: 90
  - recompensa: 1000
  - duração: 50 turnos
```

### 10.8 Stats Derivados

```
A vida máxima do jogador é constituição × 10.
A mana máxima do mago é inteligência × 5.
O dano do ataque é força + arma.
A defesa é constituição + armadura.
```

### 10.9 Stats com Faixas

```
O humor do NPC vai de 0 a 4:
  - 0: deprimido
  - 1: triste
  - 2: neutro
  - 3: feliz
  - 4: eufórico

A reputação vai de -100 a 100:
  - -100 a -50: inimigo
  - -50 a 0: desconfiado
  - 0 a 50: neutro
  - 50 a 100: aliado
```

### 10.10 Stats Temporários

```
O jogador tem um buff de força.
O buff dura 5 turnos.
O buff aumenta a força em 5.

A cada turno:
  diminua a duração do buff em 1.
  se a duração chega a 0:
    remova o buff.
```

---

## 11. Links — Relações

### 11.1 Links Espaciais

```
O Ferreiro está na Vila.
A Espada está no Baú.
O Baú está na Caverna.
A Caverna está ao norte da Vila.
```

**Links:** `está_em`, `contém`, `ao_norte_de`

### 11.2 Links de Posse

```
O Ferreiro tem um martelo.
O Rei tem uma coroa.
O Mercador tem 1000 moedas.
```

**Links:** `tem`, `possui`, `carrega`

### 11.3 Links Sociais

```
O Ferreiro é amigo do Guarda.
O Ferreiro é rival do Mercador.
O Ferreiro é casado com a Filha do Padeiro.
O Ferreiro é pai do Jovem Ferreiro.
```

**Links:** `amigo_de`, `rival_de`, `casado_com`, `pai_de`

### 11.4 Links de Facção

```
O Ferreiro é membro da Guilda.
O Guarda é leal ao Reino.
O Rebelde é líder da Rebelião.
```

**Links:** `membro_de`, `leal_a`, `líder_de`

### 11.5 Links de Conhecimento

```
O Mago conhece o Segredo do Rei.
O Ferreiro conhece a Localização do Tesouro.
O Guarda conhece o Mapa Antigo.
```

**Links:** `conhece`, `sabe_de`, `descobriu`

### 11.6 Links de Causa

```
A Maldição causou a Queda do Reino.
O Dragão causou a Destruição da Vila.
O Jogador causou a Queda do Dragão.
```

**Links:** `causou`, `provocou`, `originou`

### 11.7 Links de Parte

```
A Espada tem uma lâmina.
A Espada tem um cabo.
A Espada tem uma guarda.
```

**Links:** `tem_parte`, `é_parte_de`, `compõe`

### 11.8 Links de Categoria

```
A Espada é um tipo de arma.
O Ferreiro é um tipo de artesão.
A Vila é um tipo de lugar.
```

**Links:** `é_um_tipo_de`, `é_uma_instância_de`

### 11.9 Links de Evento

```
O Jogador participou da Queda do Dragão.
O Guarda testemunhou a Queda do Dragão.
O Reino foi salvo pela Queda do Dragão.
```

**Links:** `participou_de`, `testemunhou`, `foi_salvo_por`

### 11.10 Links Temporais

```
A Queda do Dragão aconteceu depois da Coroação do Rei.
A Guerra aconteceu antes da Queda do Dragão.
A Festa acontece durante o Outono.
```

**Links:** `antes_de`, `depois_de`, `durante`

---

## 12. Componentes — Blocos de Dados

### 12.1 Componente de Localização

```
O Ferreiro tem um componente de localização.
Ele está na Vila.
Ele está na Forja.
Ele está no andar térreo.
```

### 12.2 Componente de Inventário

```
O Ferreiro tem um componente de inventário.
Ele carrega 10 itens.
Ele carrega até 50 de peso.
```

### 12.3 Componente de Equipamento

```
O Ferreiro tem um componente de equipamento.
Ele tem uma armadura.
Ele tem uma arma.
Ele tem um anel.
```

### 12.4 Componente de Combate

```
O Ferreiro tem um componente de combate.
Ele tem 100 de vida.
Ele tem 15 de ataque.
Ele tem 10 de defesa.
```

### 12.5 Componente de Diálogo

```
O Ferreiro tem um componente de diálogo.
Ele conhece 5 tópicos.
Ele tem 3 opções de resposta.
```

### 12.6 Componente de IA

```
O Ferreiro tem um componente de IA.
Ele tem uma rotina diária.
Ele tem objetivos de curto, médio e longo prazo.
Ele tem uma memória de eventos.
```

### 12.7 Componente de Física

```
A Espada tem um componente de física.
Ela tem massa 3.
Ela tem volume 0.5.
Ela tem temperatura 20.
```

### 12.8 Componente de Magia

```
A Espada tem um componente de magia.
Ela tem 50 de poder mágico.
Ela tem uma maldição.
Ela tem uma resistência de 10.
```

---

## 13. Traits — Capacidades

### 13.1 Trait de Portabilidade

```
A Espada tem o trait "Portável".
Ela pode ser carregada.
Ela pesa 3.
```

### 13.2 Trait de Abertura

```
A Porta tem o trait "Abrível".
Ela pode ser aberta.
Ela pode ser fechada.
Ela pode ser trancada.
```

### 13.3 Trait de Contenção

```
O Baú tem o trait "Contenedor".
Ele pode conter itens.
Ele tem capacidade 10.
```

### 13.4 Trait de Equipamento

```
A Espada tem o trait "Equipável".
Ela pode ser empunhada.
Ela ocupa o slot "mão principal".
```

### 13.5 Trait de Consumível

```
A Poção tem o trait "Consumível".
Ela pode ser bebida.
Ela desaparece após o uso.
```

### 13.6 Trait de Combate

```
O Dragão tem o trait "Combatente".
Ele pode atacar.
Ele pode defender.
Ele pode fugir.
```

### 13.7 Trait de Diálogo

```
O Ferreiro tem o trait "Falante".
Ele pode conversar.
Ele pode negociar.
Ele pode dar informações.
```

### 13.8 Trait de Magia

```
O Mago tem o trait "Mágico".
Ele pode lançar feitiços.
Ele pode ler mentes.
Ele pode se teleportar.
```

### 13.9 Trait de Comércio

```
O Mercador tem o trait "Comerciante".
Ele pode comprar.
Ele pode vender.
Ele pode negociar preços.
```

### 13.10 Trait de Facção

```
O Guarda tem o trait "Membro de Facção".
Ele é leal ao Reino.
Ele obedece ao Rei.
Ele protege a cidade.
```

---

## 14. Grupos e Categorias

### 14.1 Grupo de Agentes

```
O grupo "Humanos" inclui:
  - o Ferreiro
  - o Guarda
  - o Mercador
  - o Prefeito
```

### 14.2 Grupo de Objetos

```
O grupo "Armas" inclui:
  - a Espada
  - o Machado
  - a Lança
  - o Martelo
```

### 14.3 Grupo de Lugares

```
O grupo "Vilas" inclui:
  - a Vila de Pedra
  - a Vila do Rio
  - a Vila da Montanha
```

### 14.4 Grupo de Facções

```
O grupo "Facções do Reino" inclui:
  - o Reino
  - os Rebeldes
  - os Mercadores
  - a Guilda dos Ferreiros
```

### 14.5 Categoria com Herança

```
A categoria "Arma" tem:
  - dano
  - peso
  - durabilidade

A categoria "Espada" herda de "Arma" e adiciona:
  - fio
  - guarda
  - cabo

A categoria "Espada Longa" herda de "Espada" e adiciona:
  - alcance
  - duas mãos
```

---

## 15. Hierarquias

### 15.1 Hierarquia de Lugares

```
O Mundo contém:
  - o Reino de Eldoria
    - a Vila de Pedra
      - a Forja
      - a Taverna
    - a Floresta Sombria
    - as Montanhas Geladas
    - o Castelo do Rei
```

### 15.2 Hierarquia de Objetos

```
O Baú contém:
  - a Coroa
  - o Anel Mágico
  - o Mapa Antigo
    - a Localização do Tesouro
```

### 15.3 Hierarquia de Facções

```
O Reino contém:
  - a Guilda dos Ferreiros
  - a Guilda dos Mercadores
  - a Guarda Real
```

### 15.4 Hierarquia de Eventos

```
A Queda do Dragão contém:
  - a Batalha nas Montanhas
  - a Morte do Dragão
  - a Salvação do Reino
```

---

## 16. Herança

### 16.1 Herança de Agente

```
O Ferreiro é um Humano.
O Humano é um Agente.
O Agente é uma Entidade.

O Ferreiro herda:
  - os stats de Humano
  - os traits de Agente
  - os links de Entidade
```

### 16.2 Herança de Objeto

```
A Espada é uma Arma.
A Arma é um Objeto.
O Objeto é uma Entidade.

A Espada herda:
  - os stats de Arma
  - os traits de Objeto
  - os links de Entidade
```

### 16.3 Herança de Lugar

```
A Vila é um Lugar.
O Lugar é uma Entidade.

A Vila herda:
  - os stats de Lugar
  - os traits de Entidade
  - os links de Entidade
```

### 16.4 Herança Múltipla

```
O Ferreiro é um Humano.
O Ferreiro é um Artesão.
O Ferreiro é um Membro da Guilda.

O Ferreiro herda:
  - os stats de Humano
  - os traits de Artesão
  - os links de Membro da Guilda
```

---

## 17. Templates

### 17.1 Template de NPC

```
Template "NPC Comum":
  - vida: 50
  - força: 10
  - destreza: 10
  - constituição: 10
  - inteligência: 10
  - sabedoria: 10
  - carisma: 10
  - humor: 2
  - traits: [Falante]
```

### 17.2 Template de Arma

```
Template "Arma Comum":
  - dano: 10
  - peso: 2
  - durabilidade: 50
  - valor: 50
  - traits: [Equipável, Portável]
```

### 17.3 Template de Lugar

```
Template "Sala Comum":
  - iluminação: 2
  - temperatura: 20
  - perigo: 0
  - traits: [Explorável]
```

### 17.4 Template de Evento

```
Template "Evento Comum":
  - importância: 50
  - dificuldade: 50
  - recompensa: 100
  - duração: 10 turnos
```

### 17.5 Usando um Template

```
O Ferreiro é um NPC Comum.
O Ferreiro tem força 12.
O Ferreiro tem inteligência 14.

A Espada é uma Arma Comum.
A Espada tem dano 15.
A Espada tem peso 3.
```

---

## 18. Exemplo Completo — O Reino de Eldoria

```
╔══════════════════════════════════════════╗
║  CADERNO DE ENTIDADES: O Reino de Eldoria║
║  Autora: Maria                            ║
║  Data: 13 de setembro de 2026             ║
╚══════════════════════════════════════════╝

## 1. Agentes

### O Ferreiro

O Ferreiro é um agente.
Ele é um humano.
Ele é um NPC.
Ele é um artesão.
Ele é amigável.
Ele está na Vila de Pedra.

Ele tem:
  - força: 12
  - destreza: 8
  - constituição: 10
  - inteligência: 14
  - sabedoria: 12
  - carisma: 10
  - vida: 100
  - mana: 0
  - ouro: 50

Ele é amigo do Guarda.
Ele é rival do Mercador.
Ele é membro da Guilda dos Ferreiros.
Ele é casado com a Filha do Padeiro.
Ele é pai do Jovem Ferreiro.

Ele tem o trait "Falante".
Ele tem o trait "Comerciante".

---

## 2. Objetos

### A Espada Enferrujada

A Espada Enferrujada é um objeto.
Ela é uma arma.
Ela é uma espada.
Ela é amaldiçoada.
Ela está na Caverna.

Ela tem:
  - dano: 15
  - peso: 3
  - durabilidade: 50
  - valor: 100

Ela pertence ao Rei.
Ela foi forjada pelo Ferreiro Lendário.
Ela é a chave para a Maldição.

Ela tem o trait "Equipável".
Ela tem o trait "Portável".

---

## 3. Lugares

### A Vila de Pedra

A Vila de Pedra é um lugar.
Ela é uma vila.
Ela é pequena.
Ela é pacata.

Ela tem:
  - população: 200
  - riqueza: 50
  - segurança: 80
  - iluminação: 2

Ela contém:
  - a Forja do Ferreiro
  - a Taverna do Cervo
  - a Casa do Prefeito

Ela leva ao norte para a Floresta Sombria.
Ela leva ao sul para o Rio.

---

## 4. Abstratos

### A Magia

A Magia é um abstrato.
Ela é uma força.
Ela é antiga.
Ela é misteriosa.

Ela tem:
  - poder: 100
  - raridade: 80
  - perigo: 50

Ela é canalizada pelos Magos.
Ela é temida pelos Camponeses.
Ela é estudada pela Academia.

---

## 5. Informações

### O Segredo do Rei

O Segredo do Rei é uma informação.
Ele é um segredo.
Ele é perigoso.
Ele é valioso.

Ele tem:
  - importância: 100
  - veracidade: 100
  - perigo: 90

Ele é conhecido pelo Conselheiro.
Ele é desconhecido pelo Povo.
Ele é temido pelos Rebeldes.

---

## 6. Eventos

### A Queda do Dragão

A Queda do Dragão é um evento.
Ele é um evento importante.
Ele é lendário.

Ele tem:
  - importância: 100
  - dificuldade: 90
  - recompensa: 1000

Ele aconteceu nas Montanhas Geladas.
Ele foi causado pelo Jogador.
Ele envolveu o Dragão.
Ele salvou o Reino.

Ele acontece quando:
  - o jogador tem a Espada do Herói
  - o jogador está nas Montanhas Geladas
  - o jogador enfrenta o Dragão
  - o jogador derrota o Dragão

---

## 7. Grupos

O grupo "Humanos" inclui:
  - o Ferreiro
  - o Guarda
  - o Mercador
  - o Prefeito

O grupo "Facções do Reino" inclui:
  - o Reino
  - os Rebeldes
  - os Mercadores
  - a Guilda dos Ferreiros

---

## 8. Templates

Template "NPC Comum":
  - vida: 50
  - força: 10
  - destreza: 10
  - constituição: 10
  - inteligência: 10
  - sabedoria: 10
  - carisma: 10
  - humor: 2
  - traits: [Falante]

Template "Arma Comum":
  - dano: 10
  - peso: 2
  - durabilidade: 50
  - valor: 50
  - traits: [Equipável, Portável]
```

---

## 19. Tabela Resumo — Todos os Padrões

| Categoria | Padrão | Exemplo |
|-----------|--------|---------|
| **Agente** | `X é um agente` | `O Ferreiro é um agente.` |
| **Agente** | `Ele é um humano` | `Ele é um humano.` |
| **Agente** | `Ele tem força` | `Ele tem força: 12.` |
| **Agente** | `Ele está em` | `Ele está na Vila.` |
| **Agente** | `Ele é amigo de` | `Ele é amigo do Guarda.` |
| **Objeto** | `X é um objeto` | `A Espada é um objeto.` |
| **Objeto** | `Ela é uma arma` | `Ela é uma arma.` |
| **Objeto** | `Ela tem dano` | `Ela tem dano: 15.` |
| **Objeto** | `Ela está em` | `Ela está na Caverna.` |
| **Objeto** | `Ela pertence a` | `Ela pertence ao Rei.` |
| **Lugar** | `X é um lugar` | `A Vila é um lugar.` |
| **Lugar** | `Ela tem população` | `Ela tem população: 200.` |
| **Lugar** | `Ela contém` | `Ela contém a Forja.` |
| **Lugar** | `Ela leva ao norte` | `Ela leva ao norte para a Floresta.` |
| **Abstrato** | `X é um abstrato` | `A Magia é um abstrato.` |
| **Abstrato** | `Ela é uma força` | `Ela é uma força.` |
| **Abstrato** | `Ela é canalizada por` | `Ela é canalizada pelos Magos.` |
| **Informação** | `X é uma informação` | `O Segredo é uma informação.` |
| **Informação** | `Ele é um segredo` | `Ele é um segredo.` |
| **Informação** | `Ele é conhecido por` | `Ele é conhecido pelo Conselheiro.` |
| **Evento** | `X é um evento` | `A Queda é um evento.` |
| **Evento** | `Ele aconteceu em` | `Ele aconteceu nas Montanhas.` |
| **Evento** | `Ele acontece quando` | `Ele acontece quando...` |
| **Tag** | `X é um Y` | `O Ferreiro é um humano.` |
| **Tag** | `X está Y` | `A Porta está trancada.` |
| **Stat** | `X tem Y` | `O Ferreiro tem força: 12.` |
| **Link** | `X está em Y` | `O Ferreiro está na Vila.` |
| **Link** | `X é amigo de Y` | `O Ferreiro é amigo do Guarda.` |
| **Link** | `X contém Y` | `O Baú contém a Coroa.` |
| **Componente** | `X tem um componente de Y` | `O Ferreiro tem um componente de IA.` |
| **Trait** | `X tem o trait Y` | `A Espada tem o trait "Equipável".` |
| **Grupo** | `O grupo X inclui Y` | `O grupo "Humanos" inclui o Ferreiro.` |
| **Herança** | `X herda de Y` | `A Espada herda de Arma.` |
| **Template** | `Template "X"` | `Template "NPC Comum":` |

---

## 20. Resumo Final

A linguagem de entidades cobre **seis tipos de entidade** (agentes, objetos, lugares, abstratos, informações, eventos), com **três eixos** (tags, stats, links) e **dois complementos** (componentes, traits). Cada entidade:

- ✅ Escreve-se em português claro
- ✅ Usa `é um`, `tem`, `está em`, `é amigo de`, `contém`
- ✅ Suporta tags, stats, links, componentes, traits
- ✅ Suporta grupos, hierarquias, herança, templates
- ✅ Suporta comportamento reativo (via regras)
- ✅ Traduz automaticamente para o ECS + Sharpee + ENE

A autora **escreve como se estivesse preenchendo um caderno de entidades**. O sistema **tece** as conexões. O mundo **ganha forma**.

---

**Fim do Guia de Entidades.**

*Versão: 1.0 · Licença: MIT*

---

