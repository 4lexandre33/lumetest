# Sistemas para escrita narrativa

**User:** Anonymous  
**Created:** 9/27/2026 18:55:09  
**Updated:** 9/27/2026 20:39:15  
**Exported:** 9/27/2026 21:14:09  
**Link:** [https://chatgpt.com/c/6ab990bc-f1f0-83e9-813d-522f23a3dd83](https://chatgpt.com/c/6ab990bc-f1f0-83e9-813d-522f23a3dd83)  

## Prompt:
27/09/2026, 18:53:20

além de ECS (que existe em elm narrative engine) , o que mais sistemas é interessante para narrativa ficção linear dinamica

a ideia não é ficção interativa, mas usar mecnaimso e tecnolgoias diferents para fazer uama plicação web para escritores definitiva, onde o autor pode escrever com o auxilio complto da aplicação, diferente de world,etc, a ideia é ser uma ferramnete sepcifca para escritores

## Response:
27/09/2026, 18:56:25 · gpt-5-6

> **Pesquisou 16 sites**
>
> 
>
> Pensou por 5s

Alexandre, acho que a ideia que você está buscando é algo mais ambicioso do que um **Scrivener com IA, um World Anvil com editor ou um gerenciador de personagens baseado em ECS**.

Você está descrevendo uma espécie de **Ambiente Integrado de Engenharia Narrativa e Escrita Literária**: uma aplicação em que o autor escreve normalmente, mas dispõe de sistemas especializados que compreendem, organizam, relacionam e analisam os elementos da obra.

A distinção fundamental seria:

- **Ficção interativa:** o sistema administra possibilidades narrativas para que o leitor escolha ou altere o percurso.
- **Sua proposta:** o autor controla integralmente a narrativa linear. O sistema auxilia a concepção, a escrita, a revisão e a manutenção da coerência da obra.

O ECS pode ser uma das fundações internas, mas não deveria ser o centro conceitual da aplicação. O centro deveria ser o **manuscrito e o processo criativo do escritor**.

Uma pesquisa sobre geração narrativa baseada em grafos, por exemplo, apresenta justamente a possibilidade de estruturar eventos e relações causais antes de transformar o planejamento em texto. Isso é aproveitável sem transformar a obra em ficção interativa. <Cite refs={["turn426819search1","turn426819search8"]}/>

A seguir, eu dividiria a arquitetura em sistemas especializados, alguns inspirados em tecnologias existentes e outros concebidos especificamente para escritores.

# 1. Sistemas fundamentais além do ECS

## 1.1. Narrative Graph - Grafo de conhecimento narrativo

<badge color="success">Fundamental</badge>

<AsyncImageGroup query={["narrative knowledge graph characters events relationships visualization","story plot causal graph visualization nodes edges"]} aspectRatio="5:4" layout="carousel"/>

O ECS representa entidades, componentes e estados. Mas não é, por si só, a melhor representação de todas as relações semânticas de uma história.

Um sistema de grafos permitiria relacionar:

- Personagens e seus relacionamentos.
- Eventos e suas consequências.
- Cenas e seus acontecimentos.
- Objetos e seus proprietários.
- Informações e quem conhece cada informação.
- Preparações narrativas e suas resoluções.
- Causas, consequências, conflitos e motivações.

Exemplo:

O interessante é que o mesmo grafo pode alimentar diferentes visualizações, sem duplicar informações.

**Aplicações para o escritor:**

- Visualizar relacionamentos.
- Encontrar personagens esquecidos.
- Identificar acontecimentos sem consequência.
- Consultar a origem de determinada informação.
- Encontrar elementos relacionados a uma cena.

O grafo não precisa determinar o enredo. Ele apenas representa relações que o autor estabeleceu ou que a aplicação identificou como possibilidades.

---

## 1.2. Temporal Narrative System - Sistema temporal narrativo

<badge color="success">Fundamental</badge>

<AsyncImageGroup query={["Aeon Timeline novel writing software timeline interface","fiction character multiple parallel timelines timeline software"]} aspectRatio="5:4"/>

Uma história possui pelo menos duas temporalidades diferentes:

1. **Tempo diegético:** quando os acontecimentos realmente ocorrem no universo ficcional.
2. **Tempo discursivo:** quando os acontecimentos são apresentados ao leitor.

Exemplo:

| Ordem de leitura | Acontecimento | Tempo da história |
|---|---|---|
| Cap. 1 | João encontra uma fotografia | Dia 10 |
| Cap. 2 | Maria desaparece | Dia 12 |
| Cap. 3 | João recorda sua infância | 15 anos antes |
| Cap. 4 | Revelação sobre a fotografia | Dia 10 |

O sistema precisa compreender que a ordem dos capítulos não é necessariamente a ordem cronológica.

Também deveria controlar:

- Duração dos acontecimentos.
- Intervalos entre cenas.
- Idade dos personagens em cada evento.
- Deslocamentos e viagens.
- Eventos simultâneos.
- Flashbacks e antecipações.
- Datas aproximadas ou desconhecidas.
- Mudanças de localização.

**Funcionalidade interessante:** selecionar uma cena e perguntar:

> Em que situação temporal todos os personagens estão neste momento da história?

A aplicação poderia reconstruir a situação com base nos eventos anteriores.

---

## 1.3. Narrative Causality Engine - Motor de causalidade

<badge color="success">Muito importante</badge>

Esse é um dos sistemas que considero mais interessantes para diferenciar sua aplicação de um editor convencional.

Uma história não é apenas uma sequência de acontecimentos. Os acontecimentos frequentemente produzem consequências que motivam os seguintes.

Exemplo:

O sistema poderia identificar relações como:

- A causa de determinado acontecimento.
- A consequência de uma decisão.
- A motivação para uma ação.
- O conflito que impede um objetivo.
- A informação que possibilitou uma descoberta.

A aplicação poderia perguntar:

> João tomou essa decisão por causa de qual acontecimento anterior?

Ou:

> A cena atual depende de alguma informação que ainda não foi apresentada ao leitor?

Pesquisas sobre planejamento narrativo exploram grafos de eventos e relações causais para organizar histórias antes da geração textual. <Cite refs={["turn426819search1","turn426819search4"]}/>

Para sua aplicação, eu adaptaria essa ideia como um sistema de **análise e rastreabilidade causal**, não como um gerador automático de enredos.

---

# 2. Sistemas específicos para a construção literária

Aqui começa a parte que realmente diferencia uma ferramenta para escritores de uma aplicação de worldbuilding.

## 2.1. Character Arc Engine - Motor de desenvolvimento de personagens

<badge color="success">Fundamental</badge>

<AsyncImage query="character arc development visual diagram character transformation story writing" aspectRatio="16:9"/>

O ECS pode armazenar atributos de personagens, mas o desenvolvimento dramático exige outro tipo de representação.

Eu criaria um sistema de arcos que acompanha transformações narrativas.

Exemplo:

<box border radius="lg" padding={3} gap={3}>
  <title size="lg">Arco de João</title>
  <list connector="solid" marker="number" gap={3}>
    <list-item>
      **Estado inicial**

      Acredita que confiar nos outros é uma fraqueza.
    </list-item>
    <list-item>
      **Pressão narrativa**

      Precisa depender de Maria para sobreviver.
    </list-item>
    <list-item>
      **Contradição**

      Sua desconfiança provoca a perda de uma oportunidade.
    </list-item>
    <list-item>
      **Crise**

      Precisa escolher entre manter suas convicções ou confiar em alguém.
    </list-item>
    <list-item>
      **Transformação**

      Aprende a confiar, mas não abandona completamente sua cautela.
    </list-item>
  </list>
</box>

O motor pode acompanhar:

- Crenças.
- Valores.
- Objetivos.
- Medos.
- Contradições.
- Estratégias de enfrentamento.
- Mudanças de comportamento.
- Relações entre experiências e transformações.

Uma funcionalidade avançada seria comparar o comportamento do personagem em diferentes cenas e identificar possíveis inconsistências.

Por exemplo:

> Nas três cenas anteriores, João evitou situações de confronto. Na cena atual, enfrenta Pedro diretamente. Existe algum acontecimento que justifique essa mudança?

A aplicação não deve decidir se o comportamento está errado. Deve mostrar a mudança e solicitar contexto ao autor.

---

## 2.2. Character Knowledge System - Sistema de conhecimento dos personagens

<badge color="success">Essencial para coerência</badge>

Este sistema seria separado do conhecimento global do universo.

Imagine:

- Maria conhece o segredo.
- João suspeita do segredo, mas não sabe a verdade.
- Pedro acredita em uma informação falsa.
- O leitor conhece a verdade desde o capítulo 2.

Isso gera quatro estados distintos:

| Informação | Maria | João | Pedro | Leitor |
|---|---|---|---|---|
| Segredo familiar | Conhece | Desconhece | Conhece parcialmente | Conhece |
| Identidade do culpado | Conhece | Suspeita | Desconhece | Conhece |
| Carta falsa | Desconhece | Acredita | Conhece | Desconhece |

O sistema poderia verificar:

- Personagem agindo com informação que ainda não recebeu.
- Diálogo que revela conhecimento indevido.
- Segredos que deveriam continuar ocultos.
- Revelações apresentadas ao leitor antes do planejado.
- Diferenças entre o que aconteceu e o que cada personagem acredita ter acontecido.

É uma aplicação particularmente útil para mistérios, suspense, romances com múltiplos pontos de vista e narrativas não cronológicas.

---

## 2.3. Narrative Intent System - Sistema de intenção autoral

<badge color="discovery">Diferencial da aplicação</badge>

Esse sistema seria uma espécie de camada de interpretação do autor.

Cada cena poderia ter intenções declaradas:

Depois, a IA poderia analisar o texto e verificar se os elementos planejados estão presentes.

Não seria uma análise objetiva de qualidade literária, mas uma comparação entre:

**O que o autor pretendia realizar** versus **o que está efetivamente representado no texto**.

Isso permite uma revisão muito mais específica do que simplesmente perguntar a uma IA se uma cena está boa.

---

# 3. Sistemas de linguagem e compreensão do manuscrito

Esta é uma área em que sua aplicação poderia se tornar realmente especializada.

## 3.1. Narrative AST - Árvore sintática narrativa

<badge color="success">Fundamental para sua arquitetura</badge>

Como você já está trabalhando com uma DSL narrativa e um pipeline de análise linguística, eu aproveitaria essa base.

O texto seria interpretado em diferentes níveis:

Isso não significa obrigar o escritor a trabalhar com árvores sintáticas.

A análise acontece em segundo plano, e o escritor continua vendo prosa normal.

A árvore seria útil para:

- Identificar personagens presentes em cada cena.
- Extrair ações e acontecimentos.
- Reconhecer diálogos.
- Identificar mudanças de tempo verbal.
- Detectar referências ambíguas.
- Localizar mudanças de focalização.
- Relacionar sentenças com entidades do universo.

O autor poderia selecionar uma frase e visualizar sua interpretação narrativa.

---

## 3.2. Discourse & Focalization Engine - Motor de discurso e focalização

<badge color="discovery">Diferencial literário</badge>

Um sistema dedicado a compreender como a história está sendo narrada.

Distinguiria:

- Narrador em primeira pessoa.
- Narrador em terceira pessoa.
- Narrador onisciente.
- Narrador limitado.
- Discurso direto.
- Discurso indireto.
- Discurso indireto livre.
- Pensamento interior.
- Descrição objetiva.
- Percepção subjetiva.

Exemplo:

> João entrou na sala. Maria estava sorrindo. Naturalmente, ela já havia planejado tudo.

O sistema poderia perguntar se a última sentença representa uma afirmação do narrador ou uma interpretação de João.

Essa distinção é relevante para a coerência da perspectiva narrativa.

Também permitiria acompanhar mudanças deliberadas de focalização e sinalizar mudanças possivelmente acidentais.

---

## 3.3. Style & Voice Engine - Motor de estilo e voz autoral

<badge color="success">Fundamental para uma ferramenta de escrita</badge>

Diferentemente de um corretor gramatical, esse sistema analisaria características estilísticas da própria obra.

Exemplos de dimensões:

| Dimensão | Análise |
|---|---|
| Ritmo | Variação de comprimento das sentenças |
| Vocabulário | Repetições e diversidade lexical |
| Diálogo | Distribuição entre narração e fala |
| Descrição | Densidade descritiva |
| Voz | Características recorrentes da prosa |
| Cadência | Alternância entre frases curtas e longas |
| Ponto de vista | Consistência da perspectiva |
| Repetição | Palavras, imagens e construções recorrentes |

O diferencial seria permitir que o autor definisse referências internas de estilo.

Por exemplo:

> Nos capítulos narrados por João, utilizar uma linguagem mais objetiva e observacional. Nos capítulos narrados por Maria, permitir maior subjetividade e associações sensoriais.

A IA teria acesso a essas diretrizes ao revisar ou sugerir alterações.

**Importante:** o objetivo não seria padronizar a prosa, mas preservar as escolhas estilísticas deliberadas do escritor.

---

# 4. Sistemas de análise estrutural e revisão

## 4.1. Narrative Constraint Engine - Motor de restrições narrativas

<badge color="success">Muito importante</badge>

Esse sistema verificaria regras estabelecidas pelo autor.

Exemplos:

As restrições podem ser classificadas como:

- Temporais.
- Espaciais.
- Causais.
- Informacionais.
- Relacionais.
- Estruturais.
- Estilísticas.

O sistema poderia apresentar inconsistências com evidências e referências às passagens relevantes.

A diferença para um corretor comum é que as regras pertencem à obra e são definidas pelo autor.

---

## 4.2. Setup & Payoff Tracker - Rastreador de preparação e resolução

<badge color="discovery">Altamente recomendável</badge>

<AsyncImage query="story setup payoff plot writing visual board foreshadowing narrative structure" aspectRatio="16:9"/>

Este sistema acompanharia elementos introduzidos em uma parte da narrativa e retomados posteriormente.

Exemplo:

<box border radius="lg" padding={3} gap={3}>
  <box background="surface-secondary" radius="md" padding={3}>
    <badge color="info">Capítulo 2 - Preparação</badge>
    João encontra uma chave antiga escondida no escritório.
  </box>
  <box align="center">
    <icon name="arrow-down" size="lg" color="secondary"/>
    <text color="secondary" size="xs">Relação narrativa: preparação</text>
  </box>
  <box background="surface-secondary" radius="md" padding={3}>
    <badge color="success">Capítulo 11 - Resolução</badge>
    A chave permite abrir o compartimento onde está escondida a carta.
  </box>
</box>

O sistema também identificaria possíveis preparações sem resolução.

A ferramenta StoryLine, por exemplo, apresenta rastreamento de setup/payoff como uma funcionalidade específica para conectar preparações e resoluções no manuscrito. <Cite refs={["turn426819search10"]}/>

Para sua aplicação, eu ampliaria isso para incluir:

- Objetos.
- Informações.
- Diálogos.
- Promessas.
- Conflitos.
- Características de personagens.
- Imagens e símbolos recorrentes.

---

## 4.3. Narrative Diagnostics - Diagnóstico narrativo

Em vez de uma única IA revisora, eu criaria um conjunto de analisadores especializados.

<box border radius="lg" gap={0}>
  {#each [{name:"Continuity Inspector",desc:"Procura inconsistências temporais, espaciais e de estado."},{name:"Causality Inspector",desc:"Investiga acontecimentos sem motivação ou consequências pouco estabelecidas."},{name:"Character Inspector",desc:"Analisa coerência de comportamento, objetivos e transformação."},{name:"Knowledge Inspector",desc:"Verifica o que cada personagem sabe em cada momento."},{name:"Structure Inspector",desc:"Examina distribuição de cenas, conflitos e progressão narrativa."},{name:"Style Inspector",desc:"Analisa padrões de linguagem e consistência da voz."},{name:"Reader Experience Inspector",desc:"Examina clareza, suspense, ritmo e distribuição de informações."}] as item,i}
    <box padding={3} gap={1}>
      **{item.name}**
      <text color="secondary" size="sm">{item.desc}</text>
    </box>
    {#if i<6}<divider color="subtle"/>{/if}
  {/each}
</box>

Cada analisador apresentaria:

1. Problema ou oportunidade identificada.
2. Trecho que motivou a análise.
3. Regra, intenção ou elemento narrativo relacionado.
4. Justificativa.
5. Sugestão opcional.
6. Ação de aceitar, ignorar ou registrar como decisão autoral.

Isso é particularmente importante porque uma obra literária pode violar deliberadamente convenções narrativas.

---

# 5. Sistemas que tornam a aplicação uma verdadeira ferramenta de escrita

Até aqui, falamos bastante sobre compreender a história. Mas a aplicação também precisa ajudar o autor a efetivamente escrever.

## 5.1. Context Assembly Engine - Montador inteligente de contexto

<badge color="success">Prioridade máxima para IA</badge>

Esse seria um dos componentes centrais da aplicação.

Quando o escritor solicita ajuda para continuar uma cena, o sistema não deveria simplesmente enviar o manuscrito inteiro à IA.

Deveria montar um contexto específico:

O contexto seria montado de acordo com a tarefa.

| Solicitação | Contexto necessário |
|---|---|
| Continuar parágrafo | Texto próximo + estilo |
| Escrever diálogo | Personagens + relação + conhecimento |
| Revisar cena | Cena + intenção + contexto anterior |
| Verificar continuidade | Linha temporal + estados + eventos |
| Desenvolver personagem | Arco + experiências + decisões |
| Reestruturar capítulo | Estrutura + cenas + objetivos dramáticos |

A aplicação teria uma espécie de **memória narrativa estruturada**, mas sempre subordinada ao manuscrito e às decisões do autor.

---

## 5.2. Revision & Provenance System - Sistema de revisão e rastreabilidade

<badge color="success">Essencial</badge>

Uma ferramenta definitiva para escritores deveria preservar não apenas o texto atual, mas também o histórico de suas transformações.

Eu aproveitaria conceitos de:

- Versionamento semelhante ao Git.
- Histórico de documentos.
- Branches de revisão.
- Diff textual.
- Snapshots de cenas.
- Registro de decisões autorais.

Exemplo:

O grande diferencial seria o **impact analysis**.

Ao alterar um acontecimento, a aplicação identifica quais outras partes da narrativa podem ter sido afetadas.

Isso é muito mais útil para romances extensos do que apenas manter versões do texto.

---

## 5.3. Writing Flow Engine - Motor de fluxo de escrita

A aplicação também deveria compreender que escrever e planejar são atividades diferentes.

Eu criaria modos de trabalho específicos:

<box border radius="lg" gap={0}>
  <row padding={3} align="center">
    <box background="surface-secondary" radius="lg" size="44px" align="center" justify="center">
      <icon name="pen-line" size="xl"/>
    </box>
    <box flex="1" gap={1}>
      **Modo Escrita**
      <text color="secondary" size="sm">Editor limpo, foco no manuscrito, assistência contextual discreta.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row padding={3} align="center">
    <box background="surface-secondary" radius="lg" size="44px" align="center" justify="center">
      <icon name="network" size="xl"/>
    </box>
    <box flex="1" gap={1}>
      **Modo Estrutura**
      <text color="secondary" size="sm">Cenas, capítulos, arcos, eventos e relações causais.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row padding={3} align="center">
    <box background="surface-secondary" radius="lg" size="44px" align="center" justify="center">
      <icon name="search" size="xl"/>
    </box>
    <box flex="1" gap={1}>
      **Modo Investigação**
      <text color="secondary" size="sm">Consultar personagens, fatos, eventos e referências do manuscrito.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row padding={3} align="center">
    <box background="surface-secondary" radius="lg" size="44px" align="center" justify="center">
      <icon name="clipboard-check" size="xl"/>
    </box>
    <box flex="1" gap={1}>
      **Modo Revisão**
      <text color="secondary" size="sm">Diagnósticos, comparações, consistência e sugestões editoriais.</text>
    </box>
  </row>
  <divider color="subtle"/>
  <row padding={3} align="center">
    <box background="surface-secondary" radius="lg" size="44px" align="center" justify="center">
      <icon name="brain" size="xl"/>
    </box>
    <box flex="1" gap={1}>
      **Modo Assistente**
      <text color="secondary" size="sm">Conversa com IA sobre a obra, com contexto recuperado automaticamente.</text>
    </box>
  </row>
</box>

---

# 6. Arquitetura que eu recomendaria para sua aplicação

Eu não colocaria todos esses sistemas dentro do ECS. Usaria uma arquitetura híbrida, com diferentes modelos especializados e contratos entre eles.

<box border radius="xl" padding={3} gap={2}>
  <title size="lg" textAlign="center">Integrated Narrative Writing Environment</title>
  <text color="secondary" size="xs" textAlign="center">Arquitetura conceitual proposta</text>
  <box background="surface-secondary" radius="lg" padding={3} align="center" gap={1}>
    **AUTHOR WORKSPACE**
    <text size="xs" color="secondary" textAlign="center">Editor · Manuscrito · Canvas · Navegação · Assistente</text>
  </box>
  <box align="center"><icon name="arrow-down-up" color="secondary" size="lg"/></box>
  <box border radius="lg" padding={3} align="center" gap={1}>
    **NARRATIVE CORE / BROKER**
    <text color="secondary" size="xs" textAlign="center">Contratos · Eventos · Contexto · Sincronização · Histórico</text>
  </box>
  <box align="center"><icon name="arrow-down-up" color="secondary" size="lg"/></box>
  <grid columns={2} gap={2}>
    {#each [{name:"Document Engine",desc:"Texto, AST, capítulos, cenas"},{name:"Narrative Graph",desc:"Relações e causalidade"},{name:"ECS",desc:"Entidades e estados"},{name:"Temporal Engine",desc:"Cronologia e ordem de leitura"},{name:"Knowledge Engine",desc:"Conhecimento e informação"},{name:"Character Arc Engine",desc:"Transformações e objetivos"},{name:"Constraint Engine",desc:"Regras e consistência"},{name:"Style Engine",desc:"Voz e características da prosa"}] as item}
      <grid-item>
        <box background="surface-secondary" radius="md" padding={3} height="100%" gap={1}>
          **{item.name}**
          <text color="secondary" size="xs">{item.desc}</text>
        </box>
      </grid-item>
    {/each}
  </grid>
  <box align="center"><icon name="arrow-down-up" color="secondary" size="lg"/></box>
  <box border radius="lg" padding={3} align="center" gap={1}>
    **AI ORCHESTRATION LAYER**
    <text color="secondary" size="xs" textAlign="center">Context Assembly · RAG · Agentes especializados · Ferramentas locais ou remotas</text>
  </box>
  <box align="center"><icon name="arrow-down-up" color="secondary" size="lg"/></box>
  <box background="surface-secondary" radius="lg" padding={3} align="center" gap={1}>
    **AUTHOR-APPROVED CHANGES**
    <text color="secondary" size="xs" textAlign="center">Sugestões · Diff · Validação · Aceitação · Reversão</text>
  </box>
</box>

A regra arquitetural mais importante seria:

**O manuscrito é a fonte primária da obra. Os modelos narrativos são representações auxiliares, sincronizadas e verificáveis.**

Por exemplo, se o autor escreve que João entregou a chave a Maria, o sistema pode sugerir atualizar o estado de posse do objeto. Mas não deveria alterar silenciosamente a história.

---

# 7. O que eu desenvolveria primeiro

Para evitar construir um sistema gigantesco antes de validar sua utilidade, eu organizaria o desenvolvimento em etapas.

| Fase | Sistemas | Resultado |
|---|---|---|
| 1 | Document Engine + Scene Model | Editor literário estruturado |
| 2 | Narrative Graph + ECS | Personagens, eventos e relações |
| 3 | Temporal + Knowledge Engine | Coerência temporal e informacional |
| 4 | Context Assembly + AI | Assistência contextual realmente útil |
| 5 | Character Arc + Intent Engine | Apoio à construção dramática |
| 6 | Constraint + Diagnostics | Verificação de continuidade |
| 7 | Revision + Impact Analysis | Revisão e manutenção de romances extensos |
| 8 | Style + Discourse Engine | Assistência literária especializada |

## Minha conclusão

Eu definiria o produto como:

**Narrative Authoring Environment - um ambiente de autoria literária assistida, com representação narrativa estruturada, análise contextual e ferramentas de escrita integradas.**

O diferencial não seria simplesmente possuir IA, personagens, timelines ou mapas.

Seria conectar essas funcionalidades ao ato de escrever.

Imagine o autor selecionar uma cena e ter acesso imediato a:

- O que aconteceu antes.
- O que cada personagem sabe.
- Qual é o estado emocional e narrativo dos envolvidos.
- Quais acontecimentos motivaram a cena.
- Qual é o objetivo dramático.
- Quais elementos precisam ser preparados ou resolvidos.
- Quais regras de continuidade se aplicam.
- Qual é a voz narrativa esperada.
- Como a cena se relaciona com o restante do manuscrito.

E, depois de escrever, a aplicação atualiza suas representações, aponta possíveis inconsistências e oferece assistência contextual.

Esse seria o verdadeiro salto: **não um sistema que escreve a história pelo autor, mas um sistema que compreende suficientemente a estrutura da obra para ajudar o autor a escrevê-la, revisá-la e transformá-la sem perder o controle criativo.**

## Prompt:
27/09/2026, 19:00:19

mostre   experiencia de um usuario escritor usando esaa aplicação

## Response:
27/09/2026, 19:03:25 · gpt-5-6

> **Pesquisou 14 sites**
>
> 
>
> Processou por alguns segundos

# Experiência de uso: um escritor trabalhando com o ambiente de autoria narrativa

Vamos imaginar uma aplicação chamada provisoriamente **NARRATIVE STUDIO**.

O usuário é um escritor trabalhando em um romance de suspense psicológico. Ele não quer programar, administrar bancos de dados ou preencher dezenas de formulários sobre seus personagens. Quer escrever sua história, organizar suas ideias e receber ajuda inteligente quando precisar.

A aplicação funciona como uma combinação de editor literário, assistente editorial, caderno de criação, organizador narrativo e ambiente de análise.

O princípio da experiência é simples:

**O escritor trabalha com a história. A aplicação trabalha nos bastidores para compreender, organizar e apoiar essa história.**

A seguir, vamos acompanhar um dia de trabalho desse escritor, desde a abertura do projeto até a revisão de uma cena.

# 1. O escritor abre o projeto

<box border radius="xl" gap={0}>
  <box padding={3} background="surface-secondary" gap={2}>
    <row align="center">
      <icon name="book-open" size="lg"/>
      **NARRATIVE STUDIO**
      <spacer/>
      <badge color="success">Projeto salvo</badge>
    </row>
    <title size="2xl">A Casa das Marés</title>
    <text color="secondary" size="sm">Romance psicológico · Rascunho em desenvolvimento</text>
    <divider color="subtle"/>
    <grid columns={3} gap={2}>
      <grid-item>
        <title size="xl" tabularNums>18</title>
        <text size="xs" color="secondary">Capítulos</text>
      </grid-item>
      <grid-item>
        <title size="xl" tabularNums>42</title>
        <text size="xs" color="secondary">Cenas</text>
      </grid-item>
      <grid-item>
        <title size="xl" tabularNums>36 mil</title>
        <text size="xs" color="secondary">Palavras</text>
      </grid-item>
    </grid>
  </box>
  <box padding={3} gap={3}>
    <title size="lg">Continuar trabalhando</title>
    <box border radius="lg" padding={3} gap={2}>
      <row align="center">
        <badge color="info">Última sessão</badge>
        <spacer/>
        <text color="secondary" size="xs">Ontem, 22:14</text>
      </row>
      **Capítulo 7 — A carta**
      <text color="secondary" size="sm">Cena 3 · João encontra uma fotografia antiga no escritório.</text>
      <button block onClick={() => GenUI.issueNewTurn("Continue a demonstração de experiência do escritor no Narrative Studio, abrindo o capítulo 7, cena 3, e mostrando a interface de escrita.")}>Continuar escrita <icon name="arrow-right" size="sm"/></button>
    </box>
    <title size="md">Seu projeto</title>
    <row align="center">
      <icon name="book" color="secondary"/>
      Manuscrito
      <spacer/>
      <badge>42 cenas</badge>
    </row>
    <row align="center">
      <icon name="users" color="secondary"/>
      Personagens
      <spacer/>
      <badge>12</badge>
    </row>
    <row align="center">
      <icon name="git-branch" color="secondary"/>
      Tramas e relações
    </row>
    <row align="center">
      <icon name="calendar-days" color="secondary"/>
      Cronologia
    </row>
    <row align="center">
      <icon name="clipboard-check" color="secondary"/>
      Revisão narrativa
      <spacer/>
      <badge color="warning">3 observações</badge>
    </row>
  </box>
</box>

O escritor não precisa começar pela ficha de personagens, pelo mapa ou pela configuração de um banco de dados.

Ele pode simplesmente abrir o manuscrito e continuar escrevendo.

A aplicação já possui informações extraídas e confirmadas durante o trabalho anterior.

---

# 2. O escritor entra no editor

Ele abre o capítulo 7.

A interface apresenta três áreas principais:

<box border radius="xl" gap={0}>
  <box background="surface-secondary" padding={3}>
    <row align="center">
      <icon name="panel-left" size="sm"/>
      <text weight="medium">A Casa das Marés</text>
      <spacer/>
      <badge color="success">Salvo</badge>
      <icon name="ellipsis" size="lg"/>
    </row>
  </box>
  <box padding={2} gap={2}>
    <row align="center" gap={1}>
      <badge>Manuscrito</badge>
      <badge variant="outline">Escrita</badge>
      <badge variant="outline">Revisão</badge>
    </row>
    <box border radius="md" padding={3} gap={3}>
      <text color="secondary" size="xs">CAPÍTULO 7 · CENA 3</text>
      <title size="xl" weight="medium">A carta</title>
      <text color="secondary" size="xs">POV: João · Local: Escritório · Noite</text>
      <divider color="subtle"/>
      A chuva havia começado antes do anoitecer. João permaneceu diante da escrivaninha, observando a gaveta entreaberta.
      <text highlight="blue">A fotografia estava ali.</text>
      Ele a reconheceu imediatamente, embora não conseguisse recordar onde a havia visto pela primeira vez.
      <text color="secondary" italic>O cursor permanece aqui...</text>
    </box>
    <row align="center">
      <text color="secondary" size="xs">Cena 3 de 4 · 684 palavras</text>
      <spacer/>
      <icon name="check-circle" color="success" size="sm"/>
      <text color="secondary" size="xs">Salvamento automático</text>
    </row>
  </box>
  <divider color="subtle"/>
  <box padding={3} gap={2}>
    <row align="center">
      **Contexto da cena**
      <spacer/>
      <icon name="panel-right" size="sm"/>
    </row>
    <row align="center">
      <icon name="user-round" color="secondary"/>
      João
      <spacer/>
      <badge color="info">Protagonista</badge>
    </row>
    <row align="center">
      <icon name="map-pin" color="secondary"/>
      Escritório da casa
    </row>
    <row align="center">
      <icon name="clock" color="secondary"/>
      21h30 · Dia 12
    </row>
    <row align="center">
      <icon name="target" color="secondary"/>
      Objetivo: descobrir a origem da fotografia
    </row>
    <button block variant="outline" onClick={() => GenUI.issueNewTurn("Continue a demonstração mostrando o escritor expandindo o painel de contexto da cena e consultando personagens, cronologia, conhecimento e acontecimentos relacionados.")}>Explorar contexto da cena</button>
  </box>
</box>

A diferença importante é que o painel lateral não contém apenas notas soltas. Ele apresenta informações relacionadas à cena atual.

O escritor pode continuar digitando sem abrir outras telas.

---

# 3. O escritor precisa lembrar de um detalhe

Durante a escrita, ele pensa:

*Quem havia entregado aquela fotografia a João?*

Em vez de procurar manualmente nos 18 capítulos, ele abre o assistente contextual.

<box border radius="xl" gap={3} padding={3}>
  <row align="center">
    <icon name="brain-circuit" size="lg"/>
    **Assistente narrativo**
    <spacer/>
    <badge color="success">Contexto do projeto</badge>
  </row>
  <box background="surface-secondary" radius="lg" padding={3}>
    Quem entregou a fotografia a João?
  </box>
  <box gap={2}>
    **Encontrei uma referência relevante.**
    <box border radius="md" padding={3} gap={2}>
      <badge color="info">Capítulo 3 · Cena 2</badge>
      Maria entregou a João uma fotografia antiga durante a conversa na cozinha.
      <text color="secondary" size="sm">Trecho localizado no manuscrito.</text>
      <button variant="outline" block onClick={() => GenUI.issueNewTurn("Continue a demonstração mostrando a navegação do escritor diretamente até o trecho original do capítulo 3, mantendo a cena atual preservada.")}>Abrir trecho original <icon name="arrow-up-right" size="sm"/></button>
    </box>
    **Informações relacionadas**
    - Maria entregou a fotografia.
    - João ainda não conhecia sua origem.
    - A fotografia foi identificada como pertencente à família de Maria.
  </box>
  <box background="surface-secondary" radius="lg" padding={3}>
    <text color="secondary" size="sm">Pergunte sobre personagens, acontecimentos, relações ou detalhes do manuscrito...</text>
  </box>
</box>

O escritor não precisou lembrar o capítulo, pesquisar palavras ou alternar entre documentos.

A aplicação recuperou a informação e apresentou a passagem original como evidência.

Esse tipo de consulta contextual já aparece como proposta em ferramentas contemporâneas de escrita assistida, mas aqui seria integrado aos modelos narrativos e às referências verificáveis do manuscrito. <Cite refs={["turn990464search5","turn990464search9"]}/>

---

# 4. O escritor continua escrevendo, e a aplicação acompanha

Ele escreve:

> João pegou a fotografia e a entregou a Pedro, que acabara de entrar no escritório.

A aplicação identifica uma possível alteração narrativa.

<box border radius="xl" padding={3} gap={3}>
  <row align="center">
    <icon name="activity" color="success"/>
    **Atualização narrativa detectada**
    <spacer/>
    <badge color="warning">Aguardando confirmação</badge>
  </row>
  O texto sugere uma transferência de posse de um objeto.
  <box background="surface-secondary" radius="md" padding={3} gap={2}>
    <row align="center">
      <box flex="1" align="center" gap={1}>
        <icon name="user-round" size="xl"/>
        **João**
        <text color="secondary" size="xs">Possuidor anterior</text>
      </box>
      <icon name="arrow-right" size="lg"/>
      <box flex="1" align="center" gap={1}>
        <icon name="user-round" size="xl"/>
        **Pedro**
        <text color="secondary" size="xs">Possuidor proposto</text>
      </box>
    </row>
    <divider color="subtle"/>
    <row align="center">
      <icon name="image" size="lg"/>
      Fotografia antiga
      <spacer/>
      <badge color="info">Transferência</badge>
    </row>
  </box>
  <text color="secondary" size="sm">A aplicação identificou uma possível mudança no estado do objeto. A atualização só será registrada após confirmação.</text>
  <row>
    <button block variant="outline" color="secondary" onClick={() => GenUI.issueNewTurn("Continue a demonstração mostrando o escritor rejeitando a atualização automática da posse da fotografia, mantendo a informação apenas no texto.")}>Ignorar</button>
    <button block onClick={() => GenUI.issueNewTurn("Continue a demonstração mostrando o escritor confirmando a transferência da fotografia de João para Pedro e a atualização do estado narrativo.")}>Confirmar</button>
  </row>
</box>

O escritor confirma.

A aplicação registra o acontecimento e atualiza o estado narrativo correspondente.

Não foi necessário abrir uma ficha de objeto e editar manualmente seu proprietário.

O sistema apenas propôs uma interpretação; a decisão permaneceu com o autor.

---

# 5. O escritor percebe um problema de continuidade

Mais tarde, enquanto revisa a cena, ele escreve:

> Pedro guardou a fotografia no bolso e saiu da casa.

A aplicação consulta o histórico narrativo e encontra algo relevante.

<box border radius="xl" padding={3} gap={3}>
  <row align="center">
    <icon name="alert-triangle" color="warning" size="lg"/>
    **Possível inconsistência narrativa**
  </row>
  <badge color="warning">Verificação de continuidade</badge>
  **A fotografia pode estar sendo utilizada por dois personagens simultaneamente.**
  <box background="surface-secondary" radius="md" padding={3} gap={2}>
    **Capítulo 7 · Cena 3**
    João entrega a fotografia a Pedro.
    <divider color="subtle"/>
    **Capítulo 7 · Cena 4**
    Pedro guarda a fotografia no bolso.
  </box>
  <text color="secondary" size="sm">A sequência parece coerente. Entretanto, uma referência posterior indica que João ainda está com a fotografia.</text>
  <box border radius="md" padding={3} gap={2}>
    <badge color="info">Capítulo 9 · Cena 1</badge>
    João retirou a fotografia do bolso e examinou o verso.
    <button variant="outline" block onClick={() => GenUI.issueNewTurn("Continue a demonstração mostrando a aplicação abrindo a referência do capítulo 9 e oferecendo alternativas para corrigir ou justificar a continuidade.")}>Examinar referência</button>
  </box>
  **Possíveis explicações**
  - Pedro devolveu a fotografia entre as cenas.
  - João recuperou a fotografia posteriormente.
  - A cena do capítulo 9 precisa ser modificada.
  <text color="secondary" size="xs">Nenhuma alteração será feita automaticamente.</text>
</box>

Aqui a aplicação começa a atuar como um assistente de continuidade.

Ela não afirma que existe um erro definitivo. Mostra a relação entre os acontecimentos e deixa o escritor decidir.

---

# 6. O escritor trabalha no desenvolvimento dramático

O escritor percebe que João está agindo de maneira diferente nas últimas cenas.

Ele abre a visualização do arco do personagem.

<box border radius="xl" padding={3} gap={3}>
  <row align="center">
    <icon name="user-round" size="lg"/>
    **João — Desenvolvimento do personagem**
    <spacer/>
    <badge>Arco principal</badge>
  </row>
  <box background="surface-secondary" radius="md" padding={3} gap={1}>
    <text color="secondary" size="xs">CRENÇA INICIAL</text>
    **Confiar nos outros significa perder o controle.**
  </box>
  <box align="center">
    <icon name="arrow-down" color="secondary"/>
  </box>
  <box border radius="md" padding={3} gap={1}>
    <text color="secondary" size="xs">EXPERIÊNCIA REGISTRADA · CAPÍTULO 4</text>
    João precisou depender de Maria para escapar da casa.
  </box>
  <box align="center">
    <icon name="arrow-down" color="secondary"/>
  </box>
  <box border radius="md" padding={3} gap={1}>
    <text color="secondary" size="xs">MUDANÇA OBSERVADA · CAPÍTULO 7</text>
    João compartilha uma informação que antes esconderia.
  </box>
  <box align="center">
    <icon name="arrow-down" color="secondary"/>
  </box>
  <box background="surface-secondary" radius="md" padding={3} gap={1}>
    <text color="secondary" size="xs">HIPÓTESE DE TRANSFORMAÇÃO</text>
    João começa a aceitar a possibilidade de confiar em outras pessoas.
  </box>
  <button block variant="outline" onClick={() => GenUI.issueNewTurn("Continue a demonstração mostrando o escritor abrindo o histórico do arco de João, comparando cenas e registrando sua intenção autoral para o desenvolvimento do personagem.")}>Analisar arco completo</button>
</box>

O escritor pode comparar cenas e consultar como as experiências do personagem se relacionam com suas decisões.

Ele também pode registrar uma intenção:

> Quero que João comece a confiar em Maria, mas que essa mudança seja gradual e acompanhada de resistência.

A aplicação passa a usar essa intenção como referência em futuras análises.

---

# 7. O escritor solicita ajuda para continuar uma cena

Agora ele está diante de um diálogo difícil.

Escreve:

> — Você sabia desde o começo? — perguntou João.

Não sabe como Maria deveria responder.

Em vez de solicitar simplesmente “continue a história”, ele seleciona o trecho e abre o assistente.

<box border radius="xl" padding={3} gap={3}>
  <row align="center">
    <icon name="sparkles" size="lg"/>
    **Assistência de escrita**
  </row>
  <text color="secondary" size="sm">Trecho selecionado: diálogo entre João e Maria.</text>
  <box background="surface-secondary" radius="md" padding={3}>
    Ajude-me a desenvolver a resposta de Maria. Ela sabe a verdade, mas ainda não quer revelar tudo. Quero manter a tensão e evitar uma explicação excessivamente direta.
  </box>
  <divider color="subtle"/>
  **Contexto utilizado**
  <row align="center">
    <icon name="check-circle" color="success" size="sm"/>
    <text size="sm">Personalidade e histórico de Maria</text>
  </row>
  <row align="center">
    <icon name="check-circle" color="success" size="sm"/>
    <text size="sm">Conhecimento atual de João</text>
  </row>
  <row align="center">
    <icon name="check-circle" color="success" size="sm"/>
    <text size="sm">Objetivo dramático da cena</text>
  </row>
  <row align="center">
    <icon name="check-circle" color="success" size="sm"/>
    <text size="sm">Diretrizes de estilo do manuscrito</text>
  </row>
  <box border radius="md" padding={3} gap={2}>
    **Sugestão de continuação**
    — Você sabia desde o começo? — perguntou João.

    Maria olhou para a fotografia sobre a mesa. Por alguns segundos, pareceu procurar uma resposta no próprio silêncio.

    — Eu sabia que alguma coisa estava errada.

    — Não foi isso que perguntei.

    Ela ergueu os olhos.

    — Eu sei.
    <row align="center">
      <spacer/>
      <badge color="info">Sugestão não aplicada</badge>
    </row>
  </box>
  <row>
    <button block variant="outline" onClick={() => GenUI.issueNewTurn("Continue a demonstração mostrando o escritor descartando a sugestão e escrevendo manualmente sua própria resposta.")}>Descartar</button>
    <button block onClick={() => GenUI.issueNewTurn("Continue a demonstração mostrando o escritor inserindo a sugestão no manuscrito como um rascunho revisável, com possibilidade de desfazer.")}>Inserir como rascunho</button>
  </row>
</box>

O assistente conhece o contexto necessário para produzir uma sugestão coerente, mas não substitui a voz do escritor.

Ele pode inserir o texto como rascunho, comparar alternativas ou simplesmente fechar a janela e continuar escrevendo.

---

# 8. O escritor muda de ideia sobre o enredo

No dia seguinte, ele decide que Pedro não deveria ter recebido a fotografia.

Quer que Maria seja a responsável por guardá-la.

Em um editor comum, isso poderia exigir procurar e corrigir diversas passagens.

No Narrative Studio, ele abre o evento correspondente.

<box border radius="xl" padding={3} gap={3}>
  **Evento 042 — Transferência da fotografia**
  <badge color="warning">Alteração proposta</badge>
  <box background="surface-secondary" radius="md" padding={3}>
    <text color="secondary" size="xs">VERSÃO ANTERIOR</text>
    João entrega a fotografia a Pedro.
  </box>
  <box align="center">
    <icon name="arrow-down" color="secondary"/>
  </box>
  <box border radius="md" padding={3}>
    <text color="secondary" size="xs">NOVA VERSÃO</text>
    João entrega a fotografia a Maria.
  </box>
  **Impactos encontrados**
  <list marker="bullet" gap={2}>
    <list-item>Capítulo 7: diálogo da entrega precisa ser atualizado.</list-item>
    <list-item>Capítulo 9: referência à posse da fotografia pode precisar de revisão.</list-item>
    <list-item>Capítulo 11: a descoberta da fotografia por Pedro depende da versão anterior.</list-item>
  </list>
  <button block onClick={() => GenUI.issueNewTurn("Continue a demonstração mostrando o painel de impacto da mudança narrativa, com os trechos dependentes e ações para revisar cada ocorrência.")}>Examinar impactos</button>
</box>

O sistema apresenta os trechos relacionados e permite que o escritor revise cada um.

Ele não reescreve os capítulos automaticamente nem descarta as versões anteriores.

O histórico preserva a decisão e permite reverter a mudança.

---

# 9. Ao terminar a sessão, o escritor recebe um resumo útil

Em vez de um relatório técnico cheio de logs, a aplicação apresenta um resumo editorial.

<box border radius="xl" padding={3} gap={3}>
  <row align="center">
    <icon name="notebook-pen" size="lg"/>
    **Resumo da sessão**
    <spacer/>
    <badge color="success">Concluída</badge>
  </row>
  <title size="2xl" tabularNums>1.284</title>
  <text color="secondary" size="sm">Palavras adicionadas ao manuscrito</text>
  <divider color="subtle"/>
  **O que foi desenvolvido**
  - Continuação da cena do escritório.
  - Diálogo entre João e Maria.
  - Introdução de uma nova informação sobre a fotografia.
  - Revisão do arco de João.
  **Alterações narrativas registradas**
  - Transferência da fotografia revisada.
  - Intenção dramática da cena atualizada.
  **Pontos para a próxima sessão**
  <box background="surface-secondary" radius="md" padding={3} gap={2}>
    <row align="center">
      <icon name="circle" color="secondary"/>
      Revisar a posse da fotografia no capítulo 9.
    </row>
    <row align="center">
      <icon name="circle" color="secondary"/>
      Verificar a participação de Pedro no capítulo 11.
    </row>
    <row align="center">
      <icon name="circle" color="secondary"/>
      Desenvolver a reação de Maria após a revelação.
    </row>
  </box>
  <button block variant="outline" onClick={() => GenUI.issueNewTurn("Continue a demonstração mostrando a aplicação retomando o projeto no dia seguinte e abrindo diretamente a tarefa pendente sobre a fotografia no capítulo 9.")}>Retomar na próxima sessão</button>
</box>

---

# 10. A experiência completa em uma única visão

<box border radius="xl" padding={3} gap={3}>
  <title size="lg">O ciclo de trabalho do escritor</title>
  <list connector="solid" marker="number" gap={3}>
    <list-item>
      **Escrever**

      O autor trabalha diretamente no manuscrito, sem precisar estruturar tudo antecipadamente.
    </list-item>
    <list-item>
      **Interpretar**

      A aplicação identifica possíveis personagens, eventos, referências, ações e mudanças de estado.
    </list-item>
    <list-item>
      **Organizar**

      As informações confirmadas são conectadas aos modelos narrativos.
    </list-item>
    <list-item>
      **Contextualizar**

      O sistema recupera automaticamente informações relevantes para a cena e para a tarefa atual.
    </list-item>
    <list-item>
      **Assistir**

      A IA auxilia na escrita, consulta, análise e revisão.
    </list-item>
    <list-item>
      **Verificar**

      Os sistemas de diagnóstico identificam possíveis inconsistências e relações importantes.
    </list-item>
    <list-item>
      **Decidir**

      O autor aceita, rejeita, modifica ou ignora as sugestões.
    </list-item>
    <list-item>
      **Preservar**

      As alterações são registradas, e o projeto permanece rastreável e reversível.
    </list-item>
  </list>
</box>

## O que torna essa experiência diferente?

A aplicação não deveria obrigar o escritor a pensar como um programador, bibliotecário ou gerente de projetos.

O escritor não deveria precisar perguntar:

- Qual entidade ECS preciso atualizar?
- Qual componente representa esse acontecimento?
- Em qual tabela devo registrar essa informação?
- Qual agente de IA devo executar?
- Como sincronizo a cronologia com o manuscrito?

Essas são responsabilidades internas da aplicação.

O escritor deveria poder simplesmente perguntar:

> O que João sabe neste momento?

> Como Maria reagiria a essa revelação?

> Existe alguma contradição entre estas duas cenas?

> Quais elementos plantei no início e ainda não resolvi?

> Ajude-me a desenvolver este diálogo sem perder a voz do personagem.

E, principalmente:

> Quero escrever. Deixe a parte administrativa da narrativa com você.

**Essa é a experiência que eu buscaria construir: um ambiente em que a inteligência da aplicação aparece na redução do esforço mental e operacional do escritor, e não na quantidade de ferramentas que ele precisa aprender a utilizar.**

## Prompt:
27/09/2026, 19:11:15

o que cada sistema fica responsavel e comom funcionara o UX/UI/IHC

## Response:
27/09/2026, 19:14:21 · gpt-5-6-t-mini

Vou separar a arquitetura em duas camadas: **o que cada sistema faz internamente** e **como isso aparece para o escritor**, para evitar uma aplicação cheia de telas técnicas.

Sim. E aqui existe uma decisão arquitetural muito importante para sua aplicação:

> **Cada sistema pode ser complexo internamente, mas o escritor não deve enxergar essa complexidade.**

O usuário não deve navegar por “ECS”, “Knowledge Engine”, “Causal Engine”, “Resolver”, “Narrative Graph” etc. Isso é arquitetura interna. Na interface, ele enxerga **Escrever, Personagens, Cenas, Linha do tempo, Relações, Revisão, Assistente**.

A aplicação pode ter 15–20 subsistemas, mas a experiência pode continuar parecendo um único ambiente de escrita.

---

# 1. Primeiro: separar as 3 camadas

Eu estruturaria o produto assim:

```text
                ESCRITOR
                   │
                   ▼
        ┌─────────────────────┐
        │       UX / UI       │
        │ ambiente de escrita │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │   NARRATIVE CORE    │
        │ representação da    │
        │ obra + coordenação  │
        └──────────┬──────────┘
                   │
        ┌──────────┼───────────┐
        ▼          ▼           ▼
      ECS       GRAPH       TIMELINE
      KNOWLEDGE CAUSALITY   DISCOURSE
      ARC       STYLE       CONSTRAINTS
      etc.
```

E uma quarta camada transversal:

```text
              AI / CONTEXT ENGINE
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
   recuperação    análise      geração
   contexto       narrativa    assistida
```

A IA não seria o “cérebro da história”.

O **Narrative Core** é a representação estruturada da obra.

A IA consulta essa estrutura para trabalhar.

---

# 2. O sistema mais importante: Manuscript Engine

## Responsabilidade

É o dono do **texto literário**.

Ele controla:

```text
Projeto
 └── Livro
      ├── Parte
      ├── Capítulo
      │    ├── Cena
      │    │    ├── Parágrafo
      │    │    └── Diálogo
      │    └── Cena
      └── Capítulo
```

Também controla:

- ordem editorial;
- texto;
- seleção;
- cursor;
- formatação;
- comentários;
- marcações;
- versões.

### UX

Esse é o **centro absoluto da aplicação**.

O escritor abre o projeto e vê o manuscrito.

Não abre o ECS.

Não abre o grafo.

Não abre a timeline.

Ele simplesmente escreve.

---

# 3. Scene Model

O segundo conceito mais importante é a **cena**.

Uma cena não é apenas um trecho de texto.

Internamente:

```text
SCENE
 ├── texto
 ├── localização
 ├── tempo
 ├── personagens
 ├── eventos
 ├── objetivo
 ├── conflito
 ├── conhecimento
 ├── focalização
 ├── intenção
 └── relações
```

### UX

Ao colocar o cursor dentro de uma cena:

**barra lateral direita**

```text
CENA 07

João
Maria

Escritório
21:30 · Dia 12

Objetivo
Descobrir a origem da fotografia

Conflito
Maria não quer revelar tudo

Focalização
João

[Contexto]
[Eventos]
[Personagens]
[Problemas]
```

Isso é muito mais natural que obrigar o escritor a abrir uma ficha.

---

# 4. ECS — Estado da obra

Aqui o ECS entra.

Eu não usaria ECS como “sistema narrativo inteiro”.

Ele seria responsável principalmente por **estado mutável**.

Exemplo:

```text
João
 ├── localização = escritório
 ├── estado = desconfiado
 ├── ferimento = braço direito
 └── relacionamento[M aria] = confiança baixa

Fotografia
 ├── localização = escritório
 └── possuidor = João
```

### Responsabilidade

Responder:

> Como o mundo está neste momento?

Não:

> Qual é a estrutura literária da obra?

### UX

Quase nunca aparece diretamente.

O autor vê coisas como:

```text
João
Estado atual

Ferido
Desconfiado
No escritório

Fotografia
Em posse de João
```

O sistema técnico fica invisível.

---

# 5. Narrative Graph

Esse é o sistema de **relações**.

```text
João ── ama ──> Maria
João ── suspeita de ──> Pedro

João ── encontrou ──> Fotografia

Evento A ── causou ──> Evento B

Cena 03 ── prepara ──> Cena 11
```

## Responsabilidade

Descobrir e representar:

- quem está ligado a quem;
- o que depende de quê;
- quais eventos estão relacionados;
- quais objetos pertencem a quem;
- quais elementos estão conectados.

### UX

Aqui vale utilizar um **grafo visual**, mas somente quando fizer sentido.

Exemplo:

```text
             Maria
            /     \
        ama       esconde
         /           \
      João -------- Fotografia
       |
    suspeita
       |
      Pedro
```

O escritor pode:

**clicar em Maria → visualizar relações**

**clicar em Fotografia → visualizar histórico**

**clicar em uma relação → ir à cena que originou a relação**

Esse último ponto é muito importante:

> **Toda estrutura deve possuir ligação de volta ao texto.**

---

# 6. Timeline Engine

Responsável pelo **tempo da história**.

Não apenas uma timeline horizontal.

Ele precisa representar:

```text
TEMPO DIEGÉTICO

Dia 1
 │
 ├── João conhece Maria
 │
Dia 7
 │
 ├── desaparecimento
 │
Dia 12
 │
 ├── fotografia
 │
 └── confronto
 │
15 anos antes
 │
 └── acidente
```

Também precisa distinguir:

```text
ORDEM CRONOLÓGICA
        ≠
ORDEM DE NARRAÇÃO
```

### UX

Modo:

**Cronologia**

O escritor arrasta cenas.

A aplicação mostra:

```text
CAPÍTULO 1
Dia 12

CAPÍTULO 2
Dia 14

CAPÍTULO 3
15 anos antes

CAPÍTULO 4
Dia 12
```

E pode mostrar conexões:

```text
Flashback ←──── Cena 3
             Dia -5475
```

O escritor pode alternar:

**Ordem do manuscrito**

ou

**Ordem cronológica**

sem mudar a narrativa.

---

# 7. Knowledge Engine

Esse sistema é particularmente importante para ficção linear.

Ele pergunta:

> **Quem sabe o quê, e em qual momento?**

Exemplo:

```text
INFORMAÇÃO
Pedro é o culpado.

Maria
✓ sabe

João
? suspeita

Pedro
✓ sabe

Leitor
✗ ainda não sabe
```

### UX

Na cena atual:

```text
CONHECIMENTO

João sabe:
✓ Maria mentiu
✓ Pedro estava na casa

João não sabe:
🔒 Pedro é o culpado

Maria sabe:
✓ identidade do culpado
```

Se o escritor escrever:

> João sabia que Pedro era o culpado.

o sistema poderia mostrar:

```text
⚠ POSSÍVEL INCONSISTÊNCIA

João ainda não possui essa informação
nesta altura da narrativa.

[Ver por quê]
[Manter assim]
[Corrigir]
```

---

# 8. Causality Engine

Responsável pela **cadeia de causa e consequência**.

Não basta saber:

```text
Acontecimento A
Acontecimento B
Acontecimento C
```

Ele tenta representar:

```text
A
↓
porque
↓
B
↓
provoca
↓
C
```

Exemplo:

```text
João encontra fotografia
          ↓
descobre mentira
          ↓
desconfia de Maria
          ↓
confronta Maria
          ↓
Maria foge
          ↓
João fica sozinho
```

### UX

Na cena:

```text
POR QUE ESTA CENA EXISTE?

Precedente
→ descoberta da fotografia

Objetivo
→ confronto

Consequência esperada
→ Maria foge
```

Pode existir um botão:

**Ver cadeia causal**

que abre:

```text
[Evento anterior]
       ↓
[Esta cena]
       ↓
[Evento posterior]
```

Isso é muito poderoso na revisão.

---

# 9. Character Arc Engine

Responsável por **transformação**.

O ECS diz:

> João está desconfiado.

O Character Arc Engine diz:

> João chegou a esse estado por uma sequência de experiências.

Representação:

```text
CRENÇA INICIAL
"Não devo confiar em ninguém."
          ↓
EXPERIÊNCIA
Maria salva João.
          ↓
CONFLITO
João ainda desconfia.
          ↓
DECISÃO
João decide confiar.
          ↓
TRANSFORMAÇÃO
Sua visão começa a mudar.
```

### UX

Página:

# João

**Arco**

```text
        CONFIANÇA
100 ┤
 80 ┤
 60 ┤               ╭──
 40 ┤         ╭─────╯
 20 ┤─────────╯
  0 ┼────────────────────────
      1   3   5   7   9
```

Mas não seria somente gráfico.

Ao clicar no ponto 7:

> **Capítulo 7 · Cena 3**

e a aplicação leva o escritor diretamente ao trecho.

---

# 10. Intent Engine

Esse é um dos sistemas mais interessantes para uma ferramenta **específica de escritores**.

O autor consegue registrar:

```text
INTENÇÃO DA CENA

Quero:
✓ aumentar a desconfiança
✓ revelar parcialmente o passado
✓ criar tensão
✓ preparar a fuga de Maria
```

A aplicação posteriormente compara:

**intenção declarada**

versus

**elementos encontrados no texto**.

### UX

No painel:

```text
OBJETIVOS DA CENA

✓ Desconfiança
██████████

✓ Revelação parcial
███████

⚠ Fuga de Maria
██

[Analisar cena]
```

Isso não deveria virar uma “nota”.

Não é:

> sua cena tirou 72/100.

É:

> Você registrou X como intenção. O texto atualmente apresenta evidências de A e B; não foi identificada uma preparação evidente para C.

Essa diferença é importantíssima para IHC e para preservar autonomia autoral.

---

# 11. Setup / Payoff Engine

Responsável por **rastreamento de promessas narrativas**.

Exemplo:

```text
CAP. 2
"João encontrou uma chave."

        ↓

        ?

CAP. 8
"A chave aparece novamente."

        ↓

CAP. 11
"A chave abre o compartimento."
```

### UX

Uma visualização própria:

```text
PROMESSAS NARRATIVAS

🔑 Chave antiga
CAP. 2
     ↓
CAP. 8
     ↓
CAP. 11 ✓ Resolvida
```

Também:

```text
⚠ Elemento introduzido

O relógio de Helena foi introduzido
no Capítulo 3.

Nenhuma retomada identificada até
o capítulo 18.
```

Mas “nenhuma retomada” não significa “erro”.

Pode ser simplesmente um detalhe decorativo.

O autor decide.

---

# 12. Constraint Engine

Responsável pelas **regras da obra**.

Exemplo:

```text
REGRA

Pedro não sabe que Maria descobriu
a carta antes do capítulo 10.
```

Ou:

```text
João permanece ferido até o capítulo 6.
```

### UX

Não deve parecer programação.

Em vez disso:

# Regras da história

**Conhecimento**

Pedro não sabe que Maria descobriu a carta.

**Temporal**

João permanece ferido até o capítulo 6.

**Objeto**

A fotografia precisa permanecer com Maria
até a cena 11.

O escritor pode criar regras em linguagem natural.

A aplicação transforma internamente isso em estruturas formais.

---

# 13. Discourse / Focalization Engine

Responsável por:

- ponto de vista;
- focalização;
- narrador;
- discurso direto;
- pensamento;
- percepção;
- acesso à informação.

### UX

Na barra da cena:

```text
POV
João

FOCALIZAÇÃO
Interna

NARRADOR
3ª pessoa

ACESSO
Limitado ao conhecimento de João
```

Se uma frase parecer revelar algo fora do alcance de João:

```text
⚠ POSSÍVEL MUDANÇA DE FOCALIZAÇÃO

"Maria sabia que o assassino estava
observando pela janela."

Esta informação parece exceder
o conhecimento disponível a João.

[Ver trecho]
[Manter]
```

---

# 14. Style / Voice Engine

Esse é o sistema que trabalha com a **voz literária**, não apenas gramática.

Ele poderia observar:

```text
Ritmo
Vocabulário
Comprimento das frases
Diálogo
Descrição
Uso de metáforas
Repetições
Cadência
POV
```

Mas a interface deve ser extremamente discreta.

O escritor seleciona um trecho:

```text
Analisar estilo
```

E obtém:

```text
CARACTERÍSTICAS DO TRECHO

Frases predominantemente curtas
↑

Diálogo intenso
↑

Pouca descrição visual
↑

Narrativa bastante subjetiva
↑
```

Pode comparar:

```text
Capítulo 3 ↔ Capítulo 7
```

Isso seria muito mais útil do que um simples “melhore seu estilo”.

---

# 15. Narrative Diagnostics

Esse seria o **centro de revisão**.

Todos os sistemas anteriores podem gerar diagnósticos.

Mas eles não devem aparecer espalhados pela interface.

Eles convergem para uma única caixa:

# Revisão narrativa

```text
7 observações

🔴 Possível inconsistência
Fotografia parece estar simultaneamente
com João e Pedro.

🟡 Informação antecipada
João menciona algo que aparentemente
ainda não sabe.

🟡 Preparação sem resolução
A chave do Capítulo 2 não foi retomada.

🔵 Mudança de comportamento
João enfrenta Pedro pela primeira vez.
```

Clicar:

**abre o diagnóstico + trecho + contexto + explicação.**

---

# 16. Context Engine

Esse talvez seja o componente mais importante para a IA.

Ele decide:

> **Que parte da obra a IA precisa conhecer para esta tarefa?**

Por exemplo, o escritor pergunta:

> “Como Maria responderia?”

O Context Engine monta:

```text
CONTEXTO

Cena atual
+
2 cenas anteriores
+
Maria
+
João
+
relação João/Maria
+
o que Maria sabe
+
o que João sabe
+
objetivo da cena
+
arco de Maria
+
voz narrativa
+
restrições da obra
```

A IA recebe isso.

Não precisa necessariamente receber 100% do romance.

---

# 17. Versioning / Provenance Engine

Responsável pelo histórico.

Mas eu iria além do “Ctrl+Z”.

Imagine:

```text
CAPÍTULO 7

v18
v19
v20
v21 ← atual
```

O escritor seleciona duas versões:

```text
VERSÃO 18              VERSÃO 21

Maria entrou.          Maria permaneceu parada.

João olhou para ela.   João evitou seus olhos.
```

E a aplicação mostra:

**o que mudou no texto**

e, mais interessante:

**quais estruturas narrativas podem ter sido afetadas.**

---

# 18. AI Orchestrator

É o sistema responsável por coordenar modelos de IA.

Não precisa aparecer para o escritor como “agente 1, agente 2, agente 3”.

Internamente:

```text
Pedido do escritor
       ↓
Classificador
       ↓
Context Engine
       ↓
Ferramentas narrativas
       ↓
Modelo de IA
       ↓
Validação
       ↓
Resposta
```

Exemplo:

> “Tem alguma inconsistência nesta cena?”

O sistema pode consultar:

```text
Timeline
+
Knowledge
+
ECS
+
Graph
+
Constraints
+
Manuscript
```

e então produzir a resposta.

---

# 19. Agora vem a parte mais importante: UX/UI

Eu evitaria construir uma aplicação com:

```text
Tela Personagens
Tela ECS
Tela Grafo
Tela Timeline
Tela Conhecimento
Tela Causalidade
Tela Arcos
Tela Constraints
Tela Setup
...
```

Isso seria tecnicamente organizado e **péssimo para o escritor**.

Em vez disso:

# UMA INTERFACE PRINCIPAL

```text
┌──────────────────────────────────────────────────────────────────┐
│ Projeto       Cap. 7   Cena 3          Buscar      Assistente AI │
├──────────────┬───────────────────────────────┬───────────────────┤
│              │                               │                   │
│ ESTRUTURA    │                               │ CONTEXTO          │
│              │                               │                   │
│ Cap. 1       │      MANUSCRITO              │ João              │
│ Cap. 2       │                               │ Maria             │
│ Cap. 3       │      A chuva havia...        │                   │
│ Cap. 4       │                               │ Escritório        │
│ Cap. 5       │      João olhou...           │ Dia 12            │
│ Cap. 6       │                               │                   │
│ Cap. 7  ←    │      Maria respondeu...      │ Objetivo           │
│ Cap. 8       │                               │ Conflito           │
│              │                               │                   │
├──────────────┴───────────────────────────────┴───────────────────┤
│ ✓ Salvo    1 observação    3 relações    2 elementos relevantes │
└──────────────────────────────────────────────────────────────────┘
```

Isso é o **workspace principal**.

---

# 20. O segredo: painel contextual

A interface não mostra tudo ao mesmo tempo.

O painel direito muda conforme o que o escritor está fazendo.

### Cursor numa cena

```text
CENA
Personagens
Objetivo
Tempo
Local
```

### Clicou em João

```text
JOÃO

Estado atual
Arco
Relações
Conhecimento
Histórico
Cenas
```

### Clicou na fotografia

```text
FOTOGRAFIA

Origem
Proprietário atual
Histórico
Aparições
Eventos relacionados
```

### Clicou numa relação

```text
JOÃO ── suspeita ──> PEDRO

Origem
Capítulo 6 · Cena 2

Evidência textual
...

Status
Confirmada
```

Isso reduz enormemente a carga cognitiva.

---

# 21. Canvas infinito

Aqui sua ideia do **EditorNarrative** pode entrar muito bem.

O canvas não deve substituir o editor.

Ele seria o espaço de **pensamento espacial**.

O escritor pode colocar:

```text
             [ARCO DE JOÃO]

                   ↓

[CAP. 2] ─── [CAP. 5] ─── [CAP. 7]
                      \
                       \
                       [CAP. 11]

[MARIA] ─────────── [JOÃO]
    │                  │
    └──── [SEGREDO] ───┘
```

E também:

```text
[IDEIA]

"Talvez Maria já soubesse..."

       ↓

[NOTA]

Ver capítulo 3

       ↓

[CENA 11]
```

O canvas é o espaço de **exploração livre**.

O manuscrito é o espaço de **produção definitiva**.

---

# 22. Command Palette

Eu colocaria uma experiência semelhante ao:

**Ctrl + K**

O escritor digita:

```text
> verificar continuidade da fotografia
```

ou:

```text
> mostrar tudo que Maria sabe
```

ou:

```text
> encontrar todas as cenas em que João mente
```

ou:

```text
> mostrar o arco de João
```

ou simplesmente:

```text
> pesquisar "fotografia"
```

A mesma interface serve como busca, comando e consulta narrativa.

---

# 23. Selecionar texto deveria ser uma interação central

Imagine selecionar:

> “Maria desviou os olhos e guardou a carta.”

Aparece uma pequena barra flutuante:

```text
 Analisar
 Personagem
 Evento
 Relação
 Contexto
 Revisar
 Perguntar à IA
```

O escritor clica:

**Evento**

e a aplicação mostra:

```text
EVENTO DETECTADO

Maria
↓
guarda
↓
carta

Tipo:
Ação

Objeto:
Carta

Estado alterado:
Possuidor = Maria
```

O escritor pode:

**Confirmar**

ou:

**Ignorar**

Isso cria uma UX muito natural para alimentar a estrutura narrativa.

---

# 24. O sistema deve aprender com confirmações

Isso é fundamental.

Primeira vez:

> “Esta frase indica que Maria conhece o segredo?”

[Sim] [Não]

Depois de várias confirmações semelhantes, o sistema passa a compreender melhor o projeto.

Não significa treinamento de modelo necessariamente.

Significa aprender as **decisões estruturais daquele projeto**.

---

# 25. IHC: os princípios que eu colocaria como regras do produto

## 1. Escrever sempre deve ser possível

Nenhuma estrutura narrativa pode bloquear a escrita.

O escritor pode criar:

```text
cena
```

sem preencher:

```text
objetivo
conflito
personagens
timeline
arco
```

Tudo isso pode ser descoberto depois.

---

## 2. Estrutura progressiva

A aplicação deve permitir:

```text
Texto
  ↓
interpretação
  ↓
estrutura sugerida
  ↓
confirmação
  ↓
modelo narrativo
```

e não:

```text
Preencha 17 campos antes de escrever.
```

---

## 3. Reconhecimento > memória

O sistema deve mostrar contexto.

Não obrigar o escritor a lembrar onde determinada informação está.

---

## 4. Tudo deve ser reversível

Toda operação importante:

```text
Alterar
Excluir
Aceitar IA
Mover cena
Modificar relação
Alterar evento
```

deve possuir:

**Desfazer**

e histórico.

---

## 5. IA nunca modifica o manuscrito silenciosamente

Sempre:

```text
SUGESTÃO

[Aplicar]

[Aplicar como nova versão]

[Editar]

[Ignorar]
```

Nunca:

> IA alterou 12 trechos automaticamente.

---

## 6. Diagnóstico não é sentença

Em literatura:

```text
"há uma possível inconsistência"
```

é melhor do que:

```text
"isso está errado"
```

A ferramenta trabalha como um **editor assistivo**, não como juiz da obra.

---

# 26. E eu criaria apenas 6 grandes áreas visíveis

Apesar de existirem todos esses sistemas internos:

```text
┌────────────────────────────────────────────┐
│ 1. ESCRITA                                │
│                                            │
│ Manuscrito + cenas + contexto              │
├────────────────────────────────────────────┤
│ 2. ESTRUTURA                              │
│                                            │
│ capítulos + cenas + canvas                │
├────────────────────────────────────────────┤
│ 3. UNIVERSO                               │
│                                            │
│ personagens + lugares + objetos + relações │
├────────────────────────────────────────────┤
│ 4. CRONOLOGIA                             │
│                                            │
│ tempo + eventos + versões                  │
├────────────────────────────────────────────┤
│ 5. REVISÃO                                │
│                                            │
│ continuidade + causalidade + estilo       │
├────────────────────────────────────────────┤
│ 6. ASSISTENTE                             │
│                                            │
│ IA contextual da obra                      │
└────────────────────────────────────────────┘
```

E mesmo essas seis áreas poderiam ser apenas **modos**, não seis aplicações separadas.

---

# 27. A arquitetura completa ficaria assim

```text
                         ESCRITOR
                            │
                            ▼
                 ┌───────────────────┐
                 │       UX/UI       │
                 │                   │
                 │ Workspace         │
                 │ Command Palette   │
                 │ Canvas            │
                 │ Context Panel     │
                 │ Diagnostics       │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │  NARRATIVE CORE   │
                 └─────────┬─────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    MANUSCRIPT           SCENE             EVENT
       ENGINE             MODEL             MODEL
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
       ┌──────────────┬────┼────┬───────────────┐
       ▼              ▼    ▼    ▼               ▼
     ECS            GRAPH TIME KNOWLEDGE     CAUSALITY
       │              │    │    │               │
       ▼              ▼    ▼    ▼               ▼
     ARC          RELATIONSHIPS      CONSTRAINTS
       │
       ▼
   INTENTION
       │
       ▼
   SETUP/PAYOFF
       │
       ▼
 DISCOURSE/POV
       │
       ▼
 STYLE/VOICE
       │
       └───────────────┬─────────────────┘
                       ▼
               NARRATIVE DIAGNOSTICS
                       │
                       ▼
                CONTEXT ENGINE
                       │
                       ▼
                 AI ORCHESTRATOR
```

# 28. A maior oportunidade da sua ideia

Na minha visão, existe uma mudança de paradigma importante aqui.

Um editor tradicional trabalha assim:

```text
ESCRITOR
   ↓
TEXTO
   ↓
FERRAMENTAS EXTERNAS
```

Um sistema de worldbuilding trabalha mais assim:

```text
ESCRITOR
   ↓
BANCO DE MUNDO
   ↓
TEXTO
```

O que você está propondo pode funcionar como:

```text
                     ┌──────────────┐
                     │   ESCRITOR   │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  MANUSCRITO  │
                     └──────┬───────┘
                            │
                 ┌──────────┼──────────┐
                 ▼          ▼          ▼
              eventos   personagens relações
                 │          │          │
                 └──────────┼──────────┘
                            ▼
                    NARRATIVE MODEL
                            │
        ┌───────────────────┼──────────────────┐
        ▼                   ▼                  ▼
     tempo              conhecimento       causalidade
        │                   │                  │
        └───────────────────┼──────────────────┘
                            ▼
                      CONTEXTO
                            │
                            ▼
                            AI
                            │
                            ▼
                     ESCRITOR NOVAMENTE
```

Ou seja:

**o texto alimenta o modelo narrativo, o modelo narrativo enriquece a compreensão do texto, e essa compreensão volta para o escritor.**

Essa é a parte que eu considero realmente interessante.

Não seria **“um editor de texto + vários recursos”**.

Seria um **ambiente de autoria no qual o manuscrito, a estrutura narrativa, a representação dos personagens, a cronologia, a causalidade, o conhecimento e a IA estão continuamente relacionados**, enquanto o escritor continua vendo principalmente aquilo que importa: **a história que está escrevendo**.

E isso combina muito bem com o caminho que você já vinha imaginando para o **EditorNarrative**: o canvas pode ser a camada espacial de pensamento; o editor, a camada textual; e o Narrative Core, a camada semântica que conecta os dois.

## Prompt:
27/09/2026, 19:57:42

qual é o nome da ia que entende portugues, ou seja, seu unico  trabalh pé entender portugues, epesa bme menos de 1 gb, ele intrerpteta alingua protuguesa e entende a intenção na frase por frase, sentença por sentença,  e é possivel colocar em uma aplicação web para transformar em comandos para um sistema ecs , por exmeplo, preenchendo o conteuod do mundo narrativo

O usuário quer saber o nome de uma IA que entende português, pesa menos de 1 GB, interpreta a língua portuguesa frase por frase, entende a intenção e pode ser colocada em uma aplicação web para transformar em comandos para um sistema ECS (Entity Component System), por exemplo, preenchendo o conteúdo do mundo narrativo.

Precisamos encontrar opções de modelos de IA (provavelmente modelos de linguagem pequenos, SLMs) que atendam a esses requisitos. Vamos pesquisar.

Requisitos:

- Entende português.
- Pesa menos de 1 GB.
- Interpreta frase por frase, sentença por sentença.
- Entende a intenção.
- Pode ser integrada em aplicação web.
- Transforma em comandos para um sistema ECS.
- Exemplo: preencher conteúdo do mundo narrativo.

Vamos pesquisar por modelos de linguagem pequenos para português, com menos de 1 GB, que possam ser usados em web. Também podemos pesquisar por "SLM português menos de 1GB", "modelo de linguagem português leve", "NLP português pequeno", "intent recognition português modelo pequeno", etc.

Vamos fazer várias pesquisas.

svg

Found 56 web pages

Os resultados da pesquisa mostram vários modelos potenciais. Precisamos analisar cada um para ver se atendem aos requisitos. Vamos abrir alguns links.

- Resultado 0: "Magurofg/pocket-lm-269m" - Pocket-LM 269M, 169 MB em Q4_K_M. Parece muito promissor.
- Resultado 1: "cnmoro/Tucano-160m-Portuguese-Instruct-ONNX" - 163 MB quantizado.
- Resultado 2: "ARES-Nano-SLM" - 9.37M parâmetros, extrator de intenção sintática.
- Resultado 0 da pesquisa 2: "AresAGI/ARES-Nano-SLM" - 9.37M parâmetros, projetado para extrair intenção.
- Resultado 0 da pesquisa 3: "rendeia/Arandu-Nano-1.1-GGUF" - modelo para rodar localmente, portátil em pendrive.
- Resultado 0 da pesquisa 4: "Gemma 3 270M Model Router" - fine-tuned para português brasileiro, classificação de intenções em JSON.
- Resultado 2 da pesquisa 0: "Tucano-160m-Portuguese-Instruct-ONNX" - 163 MB.
- Resultado 4 da pesquisa 0: "Qwen2.5-0.5B-Portuguese-v1" - 0.5B parâmetros, fine-tuned para português.

Vamos abrir alguns desses links para obter mais detalhes.

svg

Read 5 pages

[Magurofg/pocket-lm-269m · Hugging Face - Pocket-LM 269M — LM brasileiro para rodar no celular](https://huggingface.co/Magurofg/pocket-lm-269m#1)

svg

[Update README.md · cnmoro/Tucano-160m-Portuguese-Instruct-ONNX at 9503eeb](https://huggingface.co/cnmoro/Tucano-160m-Portuguese-Instruct-ONNX/commit/9503eeb29ddc7d97bbc1cedd84abce1f664dfe5f)

svg

[README.md · AresAGI/ARES-Nano-SLM at main](https://huggingface.co/AresAGI/ARES-Nano-SLM/blob/main/README.md#1)

svg

[Gemma 3 270M Model Router - G](https://model.aibase.com/models/details/1994345767040716800#1)

svg

[rendeia/Arandu-Nano-1.1-GGUF · Hugging Face](https://huggingface.co/rendeia/Arandu-Nano-1.1-GGUF?local-app=unsloth#1)

svg

Vamos analisar os resultados:

1. Pocket-LM 269M: 269M parâmetros, 169 MB em Q4_K_M. Treinado em português. Tem métricas de intenção (MASSIVE-BR) e F1 de campos. Pode ser usado para extração de intenção. É leve o suficiente para web? 169 MB é menos de 1 GB. Pode rodar em navegador? Possivelmente com WebAssembly ou WebGPU.
2. Tucano-160m-Portuguese-Instruct-ONNX: 163 MB, formato ONNX, para instruções em português. Leve.
3. ARES-Nano SLM: 9.37M parâmetros, projetado para extrair intenção sintática. Extremamente leve. Ideal para comandos.
4. Gemma 3 270M Model Router: 270M parâmetros, fine-tuned para português brasileiro, classificação de intenções em JSON. Leve.
5. Arandu Nano 1.1: Baseado em Qwen3-1.7B, quantizado em Q4_K_M. Pode ser maior que 1 GB? Vamos ver: Qwen3-1.7B quantizado em Q4_K_M provavelmente tem cerca de 1 GB ou mais. O usuário quer menos de 1 GB. Talvez não atenda.

O usuário pergunta "qual é o nome da ia que entende portugues... pesa menos de 1 gb... interpreta a língua portuguesa e entende a intenção... é possível colocar em uma aplicação web para transformar em comandos para um sistema ecs".

Precisamos recomendar um modelo específico. O ARES-Nano SLM parece ser o mais adequado para extração de intenção, com 9.37M parâmetros, treinado para converter fala em comandos (intenção|parâmetro). Ele é extremamente leve e projetado para esse propósito. No entanto, ele é muito pequeno e pode não ter uma compreensão profunda da linguagem. O Pocket-LM 269M tem um bom desempenho em tarefas de intenção (MASSIVE-BR) e é leve (169 MB). O Tucano-160m também é uma opção.

Para uma aplicação web que transforma comandos em ECS, o modelo precisa ser capaz de extrair intenções e parâmetros. O ARES-Nano é especificamente projetado para isso. O Gemma 3 270M Router também é para classificação de intenções, mas é mais voltado para delivery.

Podemos recomendar o Pocket-LM 269M ou o ARES-Nano SLM, dependendo da necessidade de generalidade. O Pocket-LM tem benchmarks de intenção e pode ser mais robusto. O ARES-Nano é ultra-leve e focado.

Também podemos mencionar que para integração web, modelos em formato ONNX ou GGUF podem ser executados no navegador via WebAssembly (WASM) ou WebGPU, usando bibliotecas como Transformers.js, ONNX Runtime Web, ou llama.cpp compilado para WASM.

Vamos pesquisar sobre como integrar esses modelos em aplicações web.

svg

Found 38 web pages

Os resultados de pesquisa mostram várias ferramentas para execução de modelos no navegador. O usuário pode usar Transformers.js, ONNX Runtime Web, wllama (WASM binding para llama.cpp) ou WebGPU.

Agora, vamos formular a resposta. Precisamos indicar o nome da IA. O usuário provavelmente espera um nome específico. Podemos listar as opções mais adequadas e explicar como cada uma atende aos requisitos.

Vamos destacar:

- **Pocket-LM 269M** (Magurofg/pocket-lm-269m): 269M parâmetros, 169 MB em Q4_K_M, treinado em português, com benchmark de intenção (MASSIVE-BR) e F1 de campos. Pode ser executado no navegador via WebAssembly (wllama) ou ONNX Runtime Web se convertido.
- **ARES-Nano SLM** (AresAGI/ARES-Nano-SLM): 9.37M parâmetros, projetado especificamente para extrair intenção sintática (intenção|parâmetro). Extremamente leve, ideal para comandos.
- **Tucano-160m-Portuguese-Instruct-ONNX** (cnmoro/Tucano-160m-Portuguese-Instruct-ONNX): 163 MB, formato ONNX, pronto para uso com ONNX Runtime Web.
- **Gemma 3 270M Model Router** (RiosWesley): 270M parâmetros, fine-tuned para português brasileiro, saída JSON de intenções.

Para integração web, podemos mencionar:

- Transformers.js (Hugging Face) para modelos ONNX.
- ONNX Runtime Web para modelos ONNX.
- wllama (WASM binding para llama.cpp) para modelos GGUF.
- WebGPU para aceleração.

O usuário também mencionou "sistema ecs". Isso pode ser Entity Component System (ECS) em desenvolvimento de jogos, ou Amazon ECS (Elastic Container Service). Pelo contexto ("preenchendo o conteuod do mundo narrativo"), parece ser Entity Component System para um jogo ou simulação narrativa. Portanto, o modelo precisa traduzir frases em português para comandos que manipulam entidades e componentes.

Vamos estruturar a resposta:

1. Introduzir o conceito de SLM (Small Language Model) e sua viabilidade em web.
2. Apresentar os modelos mais adequados, com seus nomes, tamanhos e características.
3. Explicar como integrar em aplicação web (ferramentas).
4. Dar um exemplo de fluxo: frase em português -> modelo extrai intenção e parâmetros -> mapeia para comandos ECS.
5. Concluir com recomendação.

Devemos citar as fontes. Vamos usar as citações dos resultados de pesquisa.

Vamos começar a escrever.

Para atender à sua necessidade — uma IA que entenda português, pese menos de 1 GB, interprete intenções frase a frase e possa ser embutida em uma aplicação web para gerar comandos para um sistema ECS (Entity Component System) —, existem hoje vários **Small Language Models (SLMs)** especializados em português que se encaixam perfeitamente nesse cenário. Diferente de LLMs gigantes, esses modelos são projetados para rodar localmente, muitas vezes direto no navegador, com consumo mínimo de memória e latência baixa.

Abaixo estão os modelos mais adequados, todos com menos de 1 GB e com capacidade de extração de intenção.

### 🧠 Modelos recomendados

**1. Pocket-LM 269M (Magurofg/pocket-lm-269m)**

- **Tamanho:** 269M de parâmetros, **169 MB** na quantização Q4_K_M.
- **Idioma:** Treinado do zero em português brasileiro.
- **Intenção:** Possui benchmark específico para intenção (MASSIVE-BR) com acurácia de \~87% e F1 de campos de \~78%. Isso significa que ele não apenas entende a frase, mas consegue extrair a intenção e os parâmetros associados.
- **Destaque:** Foi feito para rodar offline em celulares de entrada; em um navegador, pode ser executado via WebAssembly (usando `wllama`) ou convertido para ONNX e rodado com ONNX Runtime Web.

**2. ARES-Nano SLM (AresAGI/ARES-Nano-SLM)**

- **Tamanho:** Apenas **9,37 milhões de parâmetros** — provavelmente o menor SLM funcional para português.
- **Propósito:** Projetado especificamente como **Extrator de Intenção Sintática** para converter fala humana em comandos no formato `intencao|parametro` (ex.: `nav|youtube.com`, `busca|preço do btc`).
- **Vantagem:** Soberania linguística (tokenizador nativo PT-BR) e zero dependência de APIs. É ideal para mapear diretamente frases em português para comandos de ECS, já que sua saída é estruturada e minimalista.
- **Web:** Roda em CPUs modestas e pode ser embarcado em JavaScript usando ONNX Runtime Web ou Transformers.js.

**3. Tucano-160m-Portuguese-Instruct-ONNX (cnmoro/Tucano-160m-Portuguese-Instruct-ONNX)**

- **Tamanho:** **163 MB** (arquivo quantizado).
- **Formato:** Já está em **ONNX**, o que facilita a execução no navegador com ONNX Runtime Web ou Transformers.js sem conversões adicionais.
- **Uso:** Ajustado para seguir instruções em português, podendo ser adaptado para tarefas de classificação de intenção com um fine-tuning leve.

**4. Gemma 3 270M Model Router (RiosWesley)**

- **Tamanho:** 270M de parâmetros.
- **Especialização:** Fine-tuned para **português brasileiro**, entende gírias, abreviações e linguagem informal. Sua saída é em **JSON estruturado** com classificação de intenções.
- **Aplicação:** Excelente para roteamento de comandos, pois já entrega a intenção pronta para ser mapeada ao ECS.

### 🌐 Como colocar no navegador

Para rodar qualquer um desses modelos em uma aplicação web, você tem três caminhos principais:

- **Transformers.js (Hugging Face):** biblioteca JavaScript que executa modelos ONNX no navegador usando WebAssembly ou WebGPU. É a forma mais direta para modelos já convertidos para ONNX (como o Tucano-160m).
- **ONNX Runtime Web:** runtime oficial da Microsoft para modelos ONNX. Oferece controle fino sobre provedores de execução (WASM ou WebGPU) e é ideal para tarefas de classificação e extração de intenção.
- **wllama (WebAssembly binding para llama.cpp):** permite rodar modelos no formato GGUF (como o Pocket-LM) diretamente no navegador, usando SIMD para acelerar a inferência sem precisar de backend.

### 🔄 Fluxo para comandos ECS

O fluxo típico seria:

1. O usuário digita uma frase em português (ex.: *“crie uma taverna na vila com um NPC ferreiro”*).
2. O SLM processa a frase e extrai a **intenção** e os **parâmetros**. Com o Pocket-LM, por exemplo, isso pode ser feito com um prompt do tipo: *“Classifique a intenção e extraia os campos: entidade, ação, local, atributos”*.
3. O resultado é mapeado para comandos do seu ECS. Por exemplo:
   - Intenção: `criar_entidade`
   - Parâmetros: `{ tipo: "taverna", local: "vila", npc: "ferreiro" }`
4. O ECS recebe esses comandos e atualiza o mundo narrativo.

### ✅ Recomendação final

Se você precisa do **menor modelo possível** e a tarefa é estritamente extrair intenções para comandos, o **ARES-Nano SLM** é imbatível (9,37M de parâmetros). Porém, se deseja um modelo mais robusto, com benchmarks de intenção já validados e ainda assim extremamente leve, o **Pocket-LM 269M** (169 MB) é a melhor escolha. Para uma integração web imediata, o **Tucano-160m ONNX** (163 MB) já vem pronto para rodar com ONNX Runtime Web.

Todos eles cabem facilmente na sua restrição de menos de 1 GB e podem ser executados no navegador, sem depender de servidores externos, garantindo privacidade e baixa latência para o seu sistema ECS.

svg

ele eentende e interpreta, ams demora para interpreter? istp é, se demorar para entendr frase e entender a intenção nãok vai funcionar a dieia é que ele entenda enquando escrevre, e digamos transforme  em código automaticamente para ecs entendr, e faze ro mudno ,alterar, mutar, etc.. (dá uma olhada na aplicação lumetest_c1, na parte de códifos esclusivamente e vai entender), imagina aplicar a IA pequena nesta aplicação para interpretentar, e transfomra r inteção narrativa deum pesonagme em algum mutavel no mudno ,por exemplo "ele deu o objeto para o seu amigo", essa frase irá entender que um homem (e a ia vai buscar na frase anteiror ou referencia de quem é este "ele" e vai identificar quem saõ os amigos desse "ele" e também identificar quem é o amigo, e vai sugerir na tela a a transfencia do objeto em ques\~toa (também vai identificar qual obeto), a o usuár opode aceitar sugestão , e o mundo altera. etc. (também teria u mmodo automaico,)onde não eria sugestão mas a ia iria faze ro trablaho automaicmentcom permissão do usuário

svg

Length limit reached. DeepSeek can only read the first 34%.

The user is asking about a small AI model that understands Portuguese for their LumeTest application. They want it to:

1. Understand Portuguese in real-time as user types
2. Convert narrative intent into ECS commands
3. Resolve references (pronouns like "ele" referring to previous context)
4. Suggest actions (transfer object between characters)
5. Have an automatic mode

They also mention "demora para interpretar?" - they're asking if it would be slow.

Let me address this properly:

1. The models I mentioned (Pocket-LM 269M, ARES-Nano, etc.) are small language models - they're fast on modern hardware, but you need to think about the architecture.
2. For real-time "as you type" processing - this is a different task than raw LLM inference. You'd need:
   - Fast tokenization
   - Streaming inference
   - Intent classification (not full generation)
3. The actual task of resolving "ele deu o objeto para seu amigo" requires:
   - Coreference resolution (who is "ele"?)
   - Entity linking (which object?)
   - Relation extraction (gave to whom?)
   - Action mapping to ECS commands

The key insight: **you don't need a generative LLM for this**. You need a specialized pipeline:

**Option A: Fine-tuned small classifier**

- Use BERTimbau (Portuguese BERT, \~110M params, \~400MB) or DistilBERT multilingual
- Fine-tune for intent classification + NER + coreference
- Fast inference (10-50ms per sentence on CPU)

**Option B: Hybrid approach (recommended)**

1. Fast rule-based/tokenizer for real-time tokenization
2. Small intent classifier (DistilBERT/MobileBERT multilingual)
3. Entity linker that references the LumeTest world state
4. Command generator that produces ECS mutations

**Option C: Look at the LumeTest codebase**
Looking at the file listing, I can see:

- `src/plugins/intent-engine/` - this is EXACTLY where this AI would plug in!
- `src/plugins/nlp/` - NLP plugin
- `src/plugins/vocab/` - vocabulary/grammar
- `src/plugins/rule-semantics/` - semantic rules
- `src/plugins/narrative-engine/` - the narrative engine
- `src/plugins/knowledge/` - knowledge store

This app already has an intent-engine plugin! The AI would be a new adapter for it.

Let me give a proper, technical answer:

1. **Latency reality check**: Small models (100-400MB) can run at 20-100 tokens/sec on modern CPU, which means each sentence (\~20 tokens) takes 200ms-1s. That's NOT real-time for "as you type" but it IS real-time for "after sentence complete" (like Grammarly).
2. **For real-time as-you-type**: You need something even smaller - a classifier, not a generator. Something like:
   - DistilBERT multilingual (135M, \~540MB) - 10-30ms per inference
   - Or even smaller: a custom tiny transformer or BiLSTM with Portuguese embeddings
3. **The reference resolution problem** (who is "ele"?) is not something a small LM does well. You need:
   - A world-state context (which LumeTest already has)
   - A candidate ranking step (which entities are mentioned in recent sentences?)
   - A small classification model to pick the right candidate
4. **Architecture that would work for LumeTest**:

text

```
[User types] 
  → [Debounced tokenizer: 300ms after typing stops]
  → [Small intent classifier: ~50MB model]
     - Detects: transfer_object, move, attack, speak, etc.
  → [Slot filler: NER + coreference using world state]
     - Resolves entities from context
  → [Suggestion UI: shows resolved intent]
  → [User accepts] → [ECS command emitted]
     → [World mutated]
```

svgsvg

5. **Where this plugs into LumeTest**: The `intent-engine` plugin is literally designed for this. The AI would be a new `nlp` plugin that outputs structured `intent` objects that the intent-engine consumes.

Let me write a thorough answer in Portuguese (since the user is writing in Portuguese).

Also I should note: the user's message is a bit rambling and misspelled. They're asking in Portuguese and I should respond in Portuguese.

Let me structure:

1. Direct answer about latency
2. The right architecture (not a generative LLM, but a pipeline)
3. Specific models with real latency numbers
4. How it plugs into LumeTest specifically
5. The reference resolution approach
6. Auto mode vs suggestion mode

I'll be technical but clear. This deserves a substantial response given the depth of the question.

# Resposta direta: sim, mas não com um LLM generativo

Você tocou no ponto exato. Um SLM de 269M–400MB **é rápido demais para "entender enquanto escreve" se você tentar gerar texto**, mas **é rápido o suficiente se você usar como classificador**, não como gerador. A diferença é crucial.

## ⏱️ Latência real por abordagem

| **Abordagem**                 | **Modelo**                     | **Tempo por frase (\~20 tokens)** | **Viável "enquanto digita"?** |
| :---------------------------- | :----------------------------- | :-------------------------------- | :---------------------------- |
| Geração completa              | Pocket-LM 269M                 | 300ms–1s                          | ❌ Não                         |
| Geração completa              | Gemma 3 270M                   | 400ms–1.2s                        | ❌ Não                         |
| **Classificação de intenção** | DistilBERT multilingual (135M) | **15–40ms**                       | ✅ Sim                         |
| **Classificação + NER**       | BERTimbau-small fine-tuned     | **25–60ms**                       | ✅ Sim                         |
| **Pipeline híbrido**          | Tokenizer + Tiny classifier    | **10–30ms**                       | ✅ Sim                         |

**Conclusão:** você não quer um LLM generativo para isso. Você quer um **classificador de intenção + NER + coreference resolver**, e o LumeTest **já tem o lugar certo para plugar isso**.

## 🧩 O LumeTest já tem a arquitetura para isso

Olhando sua árvore de arquivos, você já tem exatamente os plugins que precisam existir:

text

```
src/plugins/intent-engine/     ← o consumidor (parser, resolver, adapter, choice)
src/plugins/nlp/               ← onde a IA entra como nova fonte
src/plugins/vocab/             ← gramática/tokens PT-BR (já existe!)
src/plugins/rule-semantics/    ← classificação semântica (já existe!)
src/plugins/knowledge/         ← store de conhecimento do mundo
src/plugins/narrative-engine/  ← o ECS narrativo alvo (beat, rule-engine, runtime)
```

svgsvg

A IA pequena **não substitui nada** — ela é um **adaptador semântico** que traduz:

text

```
"ele deu o objeto para seu amigo"
        ↓  [adaptador IA pequena]
{ intent: "transfer_item",
  agent: ?{resolve},        // "ele"
  patient: ?{resolve},      // "o objeto"
  recipient: ?{resolve} }   // "seu amigo"
        ↓  [resolver do intent-engine]
{ intent: "transfer_item",
  agent: "npc_joao",
  patient: "item_espada_01",
  recipient: "npc_maria" }
        ↓  [adapter → ECS]
world.transferItem("npc_joao", "item_espada_01", "npc_maria")
```

svgsvg

Isso é **exatamente** o que `src/plugins/intent-engine/lib/adapter.ts` e `lib/resolver.ts` já fazem — só falta o passo de linguagem natural → intent estruturado.

## 🎯 A arquitetura que funciona

text

```
┌─────────────────────────────────────────────────────────────┐
│  Usuário digita em português                                │
└────────────────────────┬────────────────────────────────────┘
                         │ debounce 300ms (para de digitar)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  1. TOKENIZADOR PT-BR (já existe em vocab/lib/tokens.ts)    │
│     → tokens, POS, dependências básicas                     │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  2. CLASSIFICADOR DE INTENÇÃO  ~50-150MB                    │
│     DistilBERT multilingual ou BERTimbau-small              │
│     Output: { intent, confidence, slots[] }                 │
│     Latência: 15-40ms                                        │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  3. RESOLVEDOR DE REFERÊNCIA  (usa o MUNDO do LumeTest)     │
│     "ele" → busca nas últimas N sentenças + estado do mundo │
│     "seu amigo" → consulta relations do kit-social          │
│     "o objeto" → consulta inventory/hand do agente          │
│     Latência: 5-20ms (é lookup, não IA)                     │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  4. UI DE SUGESTÃO (modo assistido)                         │
│     "Transferir [Espada] de [João] para [Maria]? [✓] [✗]"   │
│     OU                                                       │
│     ECS direto (modo automático com permissão)              │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  5. INTENT-ENGINE → ECS MUTATION                            │
│     Via rule-engine / effects do narrative-engine           │
└─────────────────────────────────────────────────────────────┘
```

svgsvg

## 🤖 Modelos concretos que caem nesse papel

| **Modelo**                  | **Tamanho**    | **Uso**                         | **Onde achar**                                       |
| :-------------------------- | :------------- | :------------------------------ | :--------------------------------------------------- |
| **DistilBERT multilingual** | 135M / \~540MB | Classificação de intenção PT-BR | HuggingFace, ONNX                                    |
| **BERTimbau-small**         | 29M / \~120MB  | NER + intenção PT-BR            | neuralmind/bert-base-portuguese-cased (versão small) |
| **MobileBERT multilingual** | 25M / \~100MB  | Classificação ultra-rápida      | ONNX pronto                                          |
| **TinyBERT PT**             | 14M / \~60MB   | Classificador de comandos       | custom fine-tune                                     |
| **ARES-Nano SLM**           | 9.37M          | Extrator de intenção sintática  | já mencionado antes                                  |

**Nenhum deles passa de 550MB.** O DistilBERT multilingual é o sweet spot: entende PT-BR razoavelmente, roda em 15–40ms por frase em CPU moderna, e cabe em WebAssembly/ONNX Runtime Web.

## 🧠 Como resolver "ele" sem IA gigante

O truque é que **coreference resolution não precisa de LLM**. Precisa de:

1. **Buffer de contexto** — últimas 3–5 frases + entidades mencionadas
2. **Candidate ranking** — quais entidades do mundo são compatíveis com o gênero/número/semântica do pronome
3. **Score de proximidade** — entidade mais recente ganha peso maior
4. **Validação com o mundo** — a ação faz sentido? (ex: "ele deu" → agente precisa ter item no inventário)

typescript

```
// Pseudocódigo do resolvedor
function resolvePronoun(pronoun: "ele" | "ela" | "eles", context: WorldContext) {
  const candidates = context.recentEntities
    .filter(e => e.gender === pronounGender(pronoun))
    .map(e => ({
      entity: e,
      score: recencyScore(e) * 0.6 + worldConsistencyScore(e) * 0.4
    }))
    .sort((a, b) => b.score - a.score);
  
  return candidates[0]; // ou oferece top-3 na UI de sugestão
}
```

svgsvg

Isso roda em **<5ms**. A IA pequena só entra para classificar a intenção bruta.

## 🔀 Modo assistido vs modo automático

Você já tem a distinção arquitetural no `intent-engine`:

- **Modo assistido** (`choice.ts` do intent-engine): a IA produz `Suggestion` objects, o usuário aceita/rejeita via UI.
- **Modo automático**: as mesmas sugestões passam por um `rule-engine` de permissões (`rule-semantics` já classifica regras) e aplicam direto via `effects.ts` do narrative-engine.

O `dry-run` plugin também já existe — perfeito para pré-visualizar a mutação antes de aplicar.

## ⚠️ O que NÃO fazer

1. **Não use um LLM generativo** — você vai ter 500ms+ de latência e alucinação.
2. **Não processe a cada tecla** — use debounce de 200–400ms após parar de digitar.
3. **Não tente resolver coreferência com o SLM** — use o estado do mundo do LumeTest, que é a fonte de verdade.
4. **Não envie para servidor** — rode tudo em ONNX Runtime Web / wllama no navegador.

## ✅ Resumo prático

| **Pergunta**                         | **Resposta**                                                                           |
| :----------------------------------- | :------------------------------------------------------------------------------------- |
| "Demora para interpretar?"           | Com classificador: **15–40ms/frase**. Com LLM generativo: 300ms–1s. Use classificador. |
| "Dá para entender enquanto escreve?" | Sim, com debounce de \~300ms e classificador pequeno.                                  |
| "Qual modelo?"                       | **DistilBERT multilingual fine-tuned** para intenção + **BERTimbau-small** para NER.   |
| "Onde pluga no LumeTest?"            | Novo plugin em `src/plugins/nlp/` que alimenta o `intent-engine`.                      |
| "Precisa de GPU?"                    | Não. CPU + ONNX Runtime Web / wllama roda em <100ms.                                   |
| "Como resolve 'ele'?"                | Buffer de contexto + candidate ranking + estado do mundo. Não precisa de IA.           |

O LumeTest já tem 90% da infraestrutura pronta (`intent-engine`, `vocab`, `rule-semantics`, `knowledge`, `dry-run`). O que falta é **um adaptador NL→intent** — e ele é o menor componente de todos, com menos de 200MB e latência sub-100ms.

dá uma olhada nesta conveersa

## Response:
27/09/2026, 20:00:48 · gpt-5-6-t-mini

Sim. Li toda a conversa que você trouxe, e agora ficou bem mais claro o que você está tentando construir.

O ponto central **não é colocar um chatbot ou um LLM dentro do LumeTest**. É criar uma espécie de **camada linguística ultraleve**, que fica observando o manuscrito e transforma linguagem natural em operações semânticas sobre o mundo narrativo.

A ideia que você está descrevendo é mais parecida com isto:

```text
ESCRITOR ESCREVE

"João entrou na sala."

        ↓

INTERPRETAÇÃO

AGENT = João
ACTION = enter
TARGET = sala

        ↓

INTENT

{
  type: "move",
  actor: "joao",
  destination: "sala"
}

        ↓

ECS

João.location = sala
```

E então vem a parte realmente interessante.

O escritor continua:

> “Ele pegou a espada e deu o objeto para seu amigo.”

A IA não deveria simplesmente interpretar essa frase isoladamente.

Ela recebe o **contexto narrativo recente**:

```text
João entrou na sala.
Pedro estava esperando por ele.

Ele pegou a espada e deu o objeto para seu amigo.
```

Então o sistema produz algo semelhante a:

```text
"ele"
→ João

"o objeto"
→ espada

"seu amigo"
→ Pedro
```

e monta:

```text
TRANSFER_ITEM

actor      = João
item       = espada
recipient  = Pedro
```

A interface poderia mostrar:

```text
┌──────────────────────────────────────────┐
│ Sugestão narrativa                       │
│                                          │
│ João → entregou → espada → para → Pedro  │
│                                          │
│ [✓ Aplicar] [✕ Ignorar] [Editar]         │
└──────────────────────────────────────────┘
```

Depois:

```text
ECS MUTATION

inventory(João)
    espada ❌

inventory(Pedro)
    espada ✅
```

E o mundo narrativo muda.

---

# E existe uma distinção muito importante

A conversa anterior acertou ao separar **interpretação linguística** de **resolução contextual**, mas eu corrigiria uma coisa importante:

### Não tentaria fazer uma única IA minúscula fazer tudo.

Eu faria:

```text
                 FRASE
                   │
                   ▼
          ┌─────────────────┐
          │ NLP ULTRALEVE   │
          │                 │
          │ intenção        │
          │ entidades       │
          │ ação            │
          │ papéis          │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ CONTEXT ENGINE  │
          │                 │
          │ "ele"           │
          │ "seu amigo"     │
          │ "o objeto"      │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ WORLD RESOLVER  │
          │                 │
          │ quem?           │
          │ qual objeto?    │
          │ relação existe? │
          └────────┬────────┘
                   │
                   ▼
             INTENT IR
                   │
                   ▼
              ECS COMMAND
                   │
                   ▼
             WORLD MUTATION
```

Isso é **muito mais interessante para sua aplicação**.

---

# E o detalhe mais importante: não precisa interpretar a cada tecla

Você quer a sensação de:

> **“Estou escrevendo e a aplicação está entendendo.”**

Mas não precisa processar:

```text
e
el
ele
ele 
ele d
ele de
ele deu
...
```

A arquitetura pode trabalhar com **unidades linguísticas progressivas**.

Por exemplo:

```text
texto sendo digitado
        ↓
debounce
        ↓
sentença candidata
        ↓
parser rápido
        ↓
interpretação
```

Quando o escritor digita:

> “Ele pegou a espada e deu o objeto para seu amigo.”

a aplicação pode esperar o fechamento da sentença:

```text
.
```

ou uma pequena pausa.

Aí processa a sentença inteira.

Isso muda completamente o requisito de desempenho.

Você não precisa de uma IA que responda instantaneamente a cada caractere.

Você precisa de uma IA que **interprete uma sentença em dezenas de milissegundos ou poucos centenas de milissegundos**, enquanto o escritor continua trabalhando.

---

# E eu faria algo ainda melhor no LumeTest

A interpretação poderia ocorrer em **três níveis**.

### Nível 1 — imediato

Enquanto o escritor escreve:

```text
João pegou...
```

o sistema já detecta possíveis entidades:

```text
João
```

e:

```text
pegou
```

sem alterar nada.

---

### Nível 2 — fechamento da sentença

Quando chega:

> “João pegou a espada.”

o sistema interpreta:

```text
ACTION
take

ACTOR
João

OBJECT
espada
```

e sugere:

```text
João adquiriu "Espada".

[Aplicar]
```

---

### Nível 3 — contexto narrativo

Quando aparece:

> “Ele deu o objeto para seu amigo.”

aí entra o sistema contextual:

```text
ELE
↓
João

OBJETO
↓
Espada

SEU AMIGO
↓
Pedro
```

e só então cria:

```text
transfer(
    João,
    Espada,
    Pedro
)
```

---

# Isso muda também a escolha da IA

Depois de entender a conversa, eu **não escolheria o modelo simplesmente por ser “uma IA que entende português”**.

Eu procuraria um modelo especializado para:

```text
NLU / semantic parsing / intent detection
```

e, idealmente, adaptado para:

```text
Português brasileiro
+
NER
+
relation extraction
+
semantic parsing
```

A geração livre de texto é secundária.

O que você quer é:

```text
PORTUGUÊS
      ↓
ESTRUTURA SEMÂNTICA
      ↓
INTENT
      ↓
ECS
```

Não:

```text
PORTUGUÊS
      ↓
TEXTO GERADO
```

Essa diferença é enorme.

---

# E agora entendi melhor o que você quer do LumeTest

Você não quer apenas:

**“escrever uma narrativa e ter personagens estruturados.”**

Você quer que o **próprio texto seja uma interface de manipulação do mundo narrativo**.

O escritor escreve:

> “Maria abriu a porta.”

e isso pode gerar:

```text
ACTION
OPEN

actor = Maria
target = porta

door.open = true
```

Escreve:

> “Pedro entregou a chave para Maria.”

e isso pode gerar:

```text
TRANSFER

Pedro
    ↓
chave
    ↓
Maria
```

Escreve:

> “João percebeu que Maria estava escondendo alguma coisa.”

e isso pode gerar algo mais abstrato:

```text
COGNIZE

actor = João
target = Maria

belief[João]["Maria esconde algo"] = true
```

E isso é muito mais interessante do que um simples ECS de jogo.

Você está começando a chegar a uma espécie de:

# **Narrative Semantic Runtime**

O texto é a entrada.

A interpretação semântica produz intenções.

As intenções produzem eventos.

Os eventos modificam o estado narrativo.

E o estado narrativo volta a influenciar a interpretação das próximas frases.

```text
                 ┌───────────────┐
                 │   MANUSCRITO  │
                 └───────┬───────┘
                         │
                         ▼
                ┌─────────────────┐
                │  NLU / PARSER   │
                └────────┬────────┘
                         ▼
                ┌─────────────────┐
                │ CONTEXT RESOLVER│
                └────────┬────────┘
                         ▼
                ┌─────────────────┐
                │ INTENT / EVENT  │
                └────────┬────────┘
                         ▼
                ┌─────────────────┐
                │       ECS       │
                └────────┬────────┘
                         ▼
                ┌─────────────────┐
                │ NARRATIVE STATE │
                └────────┬────────┘
                         │
                         └───────► próxima interpretação
```

E o **modo automático** que você imaginou é perfeitamente compatível com isso:

```text
MODO SUGESTÃO

texto
 ↓
interpretação
 ↓
sugestão
 ↓
autor aprova
 ↓
mutação ECS
```

ou:

```text
MODO AUTOMÁTICO

texto
 ↓
interpretação
 ↓
validação
 ↓
mutação ECS
```

com permissões configuráveis, por exemplo:

```text
☑ atualizar localização
☑ atualizar posse de objetos
☑ registrar ações
☑ registrar eventos

☐ alterar personalidade
☐ alterar relações
☐ criar entidades automaticamente
☐ alterar fatos estabelecidos
```

Isso é especialmente importante porque **“João pegou a espada”** é uma mutação relativamente segura, enquanto **“João passou a odiar Pedro”** envolve uma interpretação narrativa muito mais ambígua.

Então a confiança da interpretação poderia fazer parte do próprio runtime:

```text
0.97  → aplicar
0.84  → sugerir
0.54  → perguntar
0.31  → não alterar
```

E aqui eu faria uma mudança em relação à conversa anterior: **não faria a decisão depender apenas do confidence da IA**. A confiança final deveria considerar também regras do mundo, evidência contextual e validade da operação ECS.

Exemplo:

```text
IA:
"seu amigo" → Pedro       0.82

MUNDO:
João possui relação FRIEND com Pedro
        +0.15

Pedro está presente
        +0.05

resultado:
1.02 → confiança contextual alta
```

Isso combina muito bem com o **LumeTest + intent-engine + knowledge + ECS** que você está imaginando.

A partir daqui, eu já trataria o componente como um sistema próprio da arquitetura, algo como **Narrative NLU / Semantic Interpreter**, e não simplesmente como “uma IA pequena”.

## Prompt:
27/09/2026, 20:00:22

quero que leia todos este arqivo também, é o projeto, onde seria adaptarado, alterado, refatorado e atualizado, acredntando e impemntado todos os sistemas, para funcionar em conjuntoo de forma organizada, estrutuda, modular, etc, com kenrle +plugins, slots, venvelop, registry, capacbility, boot, matcher, resolver, dispatcher.  etc,, de forma totalmentr desclpada, com alto nivel de isolamento,  com facilitar para acrescentar e alterar, e remover partes, etc, seja runtime e també em desenvolvimentod e codigo,

[Attachment: lumetest_c1.md]

## Response:
27/09/2026, 20:03:26 · gpt-5-6-t-mini

Vou tratar `lumetest_c1.md` como a fonte principal e cruzar a arquitetura existente com a nova proposta. Primeiro vou mapear os contratos atuais; depois separo o que deve permanecer, ser refatorado, virar plugin ou ser substituído.

> **Lendo o projeto completo**
>
> Estou analisando o arquivo inteiro e organizando o conteúdo por arquitetura, módulos, fluxos e decisões técnicas. Vou cruzar essa visão ampla com os componentes centrais para preparar um plano de adaptação consistente.
>
> **Leu o projeto completo**
>
> 
>
> **Analisado o arquivo completo do projeto**
>
> 
>
> **Lendo e analisando o arquivo completo**
>
>
> **Analisou o arquivo completo e sua estrutura seccional**
>
> 
>
> **Analisadas seções relevantes por arquivo e categoria**
>
> 
>
> **Localizando seções de arquivos no código**
>
>
> **Consolidando a arquitetura**
>
> Estou cruzando o arquivo completo com a estrutura atual para separar o que já está implementado do que precisa ser adaptado: kernel, plugins, intents, IHC, memória, narrativa e testes, evitando conclusões baseadas só no índice.
>
> **Inspecionou arquitetura, documentação, APIs, plugins e módulos centrais do projeto**
>
> 
>
> **Localizadas e inspecionadas seções-chave do código e arquivos do LumeTest**
>
> 
>
> **Analisando imports entre plugins para detectar violações de isolamento**
>
>
> **Analisou isolamento modular, imports cruzados e pipeline narrativo do LumeTest**
>
> 
>
> **Mapeou e analisou a arquitetura e os pipelines narrativos do projeto**
>
> 
>
> **Inspecionando arquivos aninhados do boot**
>
>
> **Mapeando a adaptação**
>
> Estou tratando o projeto como um estúdio de escrita semântica: o autor escreve prosa normal, enquanto o sistema interpreta entidades, contexto e eventos. Vou preservar o microkernel existente e evoluí-lo para plugins, slots, envelopes e resolução desacoplada.
>
> **Avaliando acoplamentos existentes**
>
> Estou identificando os pontos que impedem o isolamento completo: dependências diretas entre plugins, acesso amplo a serviços, inicialização manual e ausência de envelopes explícitos. Esses serão alvos prioritários da refatoração arquitetural.
>
> **Mapeou a adaptação e avaliou acoplamentos existentes**
>
> 
>
> **Inspecionou arquivos aninhados do boot**
>
> 
>
> **Refatorou LumeTest com Kernel Modular e analisou narrativas e contratos**
>
> 
>
> **Analisando arquitetura modular de plugins e contratos de interface**
>
>
> **Analisou arquitetura modular, plugins, gateway e arquivos de infraestrutura do LumeTest**
>
> 
>
> **Analisou e consolidou a arquitetura Lume**
>
> 
>
> Pensou por 5m 16s

Li o arquivo consolidado inteiro como fonte do projeto - ele contém **636 arquivos selecionados**, e a parte atual do código tem **407 arquivos em `src` e 29 plugins**. Além disso, o próprio arquivo inclui o projeto anterior `projeto_narrative-write`, que é muito importante porque nele já existe uma arquitetura mais próxima do que você agora está propondo. 

E, depois de cruzar as duas arquiteturas, minha conclusão mudou um pouco:

> **Não devemos simplesmente “adicionar IA + novos plugins” ao LumeTest atual.**
>
> O correto é fazer uma **refatoração arquitetural de fundação**, aproveitando o que já existe e incorporando o melhor do `projeto_narrative-write`, mas colocando tudo atrás de um Kernel 0 realmente pequeno, contratos fortes, envelopes, slots, capabilities e dispatcher.

O projeto já possui uma boa base para isso, mas ainda há uma diferença importante entre a **arquitetura declarada** e a **arquitetura efetivamente implementada**.

---

# 1. O que encontrei no projeto atual

O Lume atual já possui:

```text
Core
PluginRegistry
CapabilityRegistry
EventBus
ErrorBoundary
PluginManifest
PluginContext
bootstrap
```

O `Core` realmente se comporta como microkernel e concentra EventBus, PluginRegistry, CapabilityRegistry e ErrorBoundary. O próprio `CONTEXT.md` do core diz explicitamente que ele não deve conter lógica de jogo. 

Também já há manifests com `provides`, `requires`, lifecycle e permissões. 

Mas há três problemas estruturais.

### Problema 1 - o bootstrap ainda conhece praticamente tudo

O `bootstrap.ts` importa diretamente todos os plugins, registra todos e ativa todos em sequência; depois ainda monta um `LumePlatformServices` enorme com dezenas de serviços. 

Isso funciona, mas cria:

```text
BOOT
 ├── conhece plugin A
 ├── conhece plugin B
 ├── conhece plugin C
 ├── conhece plugin D
 ...
 └── conhece praticamente a plataforma inteira
```

Isso não é o nível de desacoplamento que você está buscando.

---

### Problema 2 - capability hoje ainda entrega objeto diretamente

O `CoreAPI` expõe:

```ts
getService<T>(name, version): T
```

e o `CapabilityRegistry` retorna diretamente o objeto da API.

Ou seja, conceitualmente:

```text
Plugin A
   ↓
getService()
   ↓
objeto interno do Plugin B
```

Isso é melhor que import direto, mas ainda não é isolamento forte.

O objetivo futuro deveria ser:

```text
Plugin A
   ↓
Envelope
   ↓
Slot / Capability Port
   ↓
Dispatcher
   ↓
Plugin B
```

Assim A não conhece o objeto interno de B.

O próprio contrato atual do projeto já afirma que plugins deveriam conversar por capability/evento, mas a implementação ainda oferece uma superfície mais direta do que esse princípio sugere. 

---

### Problema 3 - ainda existem imports diretos entre plugins

Isso é muito importante.

Eu fiz uma varredura estática do projeto inteiro. Ela encontrou **57 pares de plugins com imports relativos cruzados**, com destaque para:

```text
intent-engine → narrative-engine
notebook       → narrative-engine
ide-ui         → narrative-engine
ide-ui         → ide-state
ide-state      → narrative-engine
```

O `intent-engine`, por exemplo, importa diretamente partes internas do `narrative-engine`, e seu `resolver.ts` acessa diretamente o `rule-engine`. O projeto reconhece essa dívida em seus próprios documentos. 

Portanto:

> **A arquitetura nova deve eliminar essa classe de dependência, não apenas documentá-la como “não faça”.**

---

# 2. E o projeto antigo contém uma peça valiosíssima

O `projeto_narrative-write` possui o `context-machine`.

Ele já tinha:

```text
Machine
Router
Pipeline
Registry
Matcher
EventBus
World
LinkIndex
IdRegistry
Snapshot
Timeline
```

e o `Machine` era o orquestrador central que conhecia os sistemas. 

Isso mostra que a evolução do projeto já estava caminhando nessa direção.

Mas há um problema:

```text
Machine
   ↓
injeta diretamente
   ├── world
   ├── bus
   ├── machine
   ├── links
   └── ids
```

E todos os sistemas recebiam isso diretamente.

Então temos duas arquiteturas no mesmo projeto:

### Arquitetura atual TS

```text
Microkernel
Plugin Registry
Capability Registry
EventBus
```

mais desacoplada.

### Arquitetura antiga Narrative Write

```text
Machine
Pipeline
Matcher
Registry
World
Systems
```

mais rica semanticamente, porém fortemente acoplada.

A solução não é escolher uma das duas.

É **fundir as duas corretamente**.

---

# 3. A nova arquitetura que eu usaria

Eu chamaria conceitualmente de:

# Kernel 0 + Narrative Runtime + Authoring Runtime

```text
                         ESCRITOR
                            │
                            ▼
                   ┌─────────────────┐
                   │  AUTHORING UI   │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   KERNEL 0      │
                   │                 │
                   │ Boot            │
                   │ Registry        │
                   │ Slots           │
                   │ Capabilities    │
                   │ Envelope        │
                   │ Dispatcher      │
                   │ EventBus        │
                   │ Isolation       │
                   └────────┬────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
       AUTHORING         NARRATIVE       PLATFORM
        PLUGINS           RUNTIME         PLUGINS
```

E a regra de ouro:

> **Kernel não entende narrativa.**
>
> **Plugins não conhecem a implementação interna uns dos outros.**

---

# 4. Kernel 0

Eu reduziria o kernel a aproximadamente estas responsabilidades.

```text
kernel/
├── boot/
├── registry/
├── capabilities/
├── slots/
├── envelope/
├── dispatcher/
├── events/
├── lifecycle/
├── isolation/
├── permissions/
├── diagnostics/
└── contracts/
```

Nada de:

```text
Character
World
Scene
Narrative
Knowledge
Intent
Timeline
```

no Kernel.

---

# 5. Registry

O registry passa a ser **universal e tipado**.

Não apenas:

```text
components
snippets
commands
```

como no antigo `context-machine/registry.js`. 

Ele passa a registrar:

```text
Plugin
Capability
Slot
Handler
Command
Event
View
Analyzer
Model
Policy
```

Exemplo:

```text
registry

plugin:narrative-nlu
capability:narrative.parse
slot:world.query
slot:world.mutate
handler:intent.transfer
event:world.mutated
view:narrative-inspector
```

---

# 6. Capability

Capability deve representar:

> **“o que o plugin oferece”**

Exemplo:

```text
world.read
world.mutate
world.query
knowledge.lookup
knowledge.update
narrative.parse
reference.resolve
intent.resolve
timeline.query
diagnostic.report
```

Não:

```text
NarrativeEngineService
```

como um objeto gigante com 30 métodos.

A capability deveria ser pequena e especializada.

---

# 7. Slot

Aqui entra uma das mudanças que considero essenciais.

`Slot` será:

> **uma porta tipada que um plugin pode fornecer ou consumir.**

Exemplo:

```text
slot:narrative.input
slot:narrative.semantic
slot:reference.resolve
slot:intent.dispatch
slot:world.query
slot:world.mutate
slot:timeline.read
slot:knowledge.lookup
```

Então:

```text
NLP Plugin
     │
     └── provides → narrative.semantic
```

e:

```text
Narrative Resolver
     │
     └── requires → narrative.semantic
```

Sem import entre eles.

---

# 8. Envelope

O Envelope passa a ser a unidade universal de comunicação.

Algo conceitualmente assim:

```ts
{
  id,
  type,
  version,

  source,
  target,

  capability,
  slot,

  correlationId,
  causationId,

  mode,

  permissions,

  context,

  payload
}
```

Por exemplo:

```text
type:
author.prose.interpret

source:
writer.editor

target:
slot:narrative.semantic

mode:
suggest
```

Payload:

```text
{
  text:
    "Ele deu a espada para seu amigo.",

  documentId:
    "book-01",

  sceneId:
    "scene-07",

  cursor:
    4182
}
```

A IA não recebe objetos internos do ECS.

Recebe um envelope.

---

# 9. Dispatcher

O Dispatcher passa a ser o **corredor central**.

```text
Envelope
   ↓
Dispatcher
   ↓
Matcher
   ↓
Capability Resolver
   ↓
Slot Handler
   ↓
resultado
```

Ele controla:

```text
roteamento
validação
versão
permissão
prioridade
trace
timeout
isolamento
erro
```

E, principalmente:

> **nenhum plugin chama outro plugin diretamente.**

---

# 10. Matcher não deve ser um único Matcher

Aqui também faria uma mudança importante.

No projeto antigo existe um `Matcher` para snippets/triggers. `lumetest_c1.md`

Na arquitetura nova, eu separaria:

```text
InputMatcher
```

determina:

```text
prosa
comando
slash
seleção
evento
```

Depois:

```text
IntentMatcher
```

determina:

```text
give
take
move
open
speak
observe
remember
...
```

Depois:

```text
RuleMatcher
```

determina qual regra se aplica.

E:

```text
ReferenceMatcher
```

determina candidatos para:

```text
ele
ela
isso
o objeto
seu amigo
aquela casa
```

Assim cada matcher tem uma responsabilidade.

---

# 11. Resolver também precisa ser dividido

Isso será fundamental para a sua IA narrativa.

Não quero um `resolver.ts` gigante.

Quero:

```text
CapabilityResolver
IntentResolver
ReferenceResolver
EntityResolver
ContextResolver
RuleResolver
```

Por exemplo:

### ReferenceResolver

Recebe:

```text
"ele"
```

e devolve:

```text
candidate 1 → @joao
candidate 2 → @pedro
```

com evidências:

```text
proximidade
gênero
número
foco narrativo
personagem ativo
presença na cena
coerência de ação
```

Depois o `EntityResolver` consulta o mundo.

---

# 12. E aqui entra a grande evolução do NLP

O `nlp` atual do Lume é deliberadamente pequeno e baseado em:

```text
vocabulário
gramática
aliases
slots
scope
```

e transforma frase em `intent.*`. 

Isso **não deve ser apagado**.

Deve virar uma das camadas.

Eu faria:

```text
                PROSA
                  │
                  ▼
          Sentence Segmenter
                  │
                  ▼
            Fast NLP Layer
                  │
        ┌─────────┴─────────┐
        │                   │
      regras              modelo
      léxico              pequeno
        │                   │
        └─────────┬─────────┘
                  ▼
           Narrative IR
                  │
                  ▼
       Reference Resolution
                  │
                  ▼
         Intent / Event IR
```

E o projeto antigo já possui justamente uma peça extraordinariamente útil para isso.

---

# 13. Narrative IR

Esse é um dos melhores ativos que encontrei no arquivo.

O `narrativeIR@1.0` já define:

```text
represent
describe
enunciate
expose
evaluate
interiorize
structure
focalize
```

além de:

```text
agent
experiencer
patient
theme
target
source
recipient
beneficiary
instrument
location
destination
cause
purpose
...
```

e dimensões de:

```text
voice
focalization
discourse
epistemic
temporality
aspect
modality
negation
```

O IR também possui `sourceSpan`, `references`, `provenance`, `diagnostics` e `confidence`. 

Isso é **exatamente a ponte que estava faltando** entre:

```text
português
```

e

```text
mundo narrativo
```

---

# 14. E o SourceMap é fundamental

O `SourceMap` existente mapeia:

```text
texto
  ↕
Narrative Act
```

permitindo ir do texto para o act e do act de volta para o trecho original. 

Isso significa que podemos fazer algo muito poderoso:

> A estrutura narrativa nunca fica “solta” em um banco de dados separado.

Ela mantém ligação com a frase que originou a interpretação.

Por exemplo:

```text
"Ele deu a espada para Maria."
          │
          ▼
      NarrativeAct
          │
          ▼
transfer
          │
          ▼
João → espada → Maria
```

Se o escritor clicar na transferência:

**a aplicação volta à frase original.**

---

# 15. World Runtime

Aqui eu faria uma mudança conceitual importante por causa do próprio arquivo.

O glossário atual do Lume diz explicitamente que o sistema atual **não é ECS** e representa entidades por `tags`, `stats`, `links` e `extra`. 

Então eu não faria:

```text
Plugin → ECS internals
```

Faria:

```text
Plugin
  ↓
World Capability
  ↓
World Runtime
  ↓
implementação ECS
```

Assim podemos trocar futuramente:

```text
Entity Map
```

por:

```text
real ECS
```

sem quebrar:

```text
NLP
Intent
Timeline
Knowledge
UI
```

Esse é o verdadeiro desacoplamento.

---

# 16. Mutation Runtime

O escritor não deveria executar diretamente:

```text
world.entities["joao"].inventory.push(...)
```

A operação deveria virar:

```text
MutationEnvelope
```

por exemplo:

```text
{
  type: "world.mutate",

  operation: "transfer",

  actor: "@joao",

  object: "@espada",

  recipient: "@maria"
}
```

Então:

```text
Dispatcher
    ↓
Mutation Validator
    ↓
World Mutation
    ↓
Event
```

---

# 17. Isso encaixa perfeitamente no exemplo “ele deu o objeto...”

Fluxo completo:

```text
O escritor digita:

"Ele deu o objeto para seu amigo."
```

↓

### Sentence Segmenter

```text
SENTENCE
```

↓

### NLU

```text
predicate = dar

agent = ?ref(ele)

theme = ?ref(objeto)

recipient = ?ref(seu amigo)
```

↓

### Reference Resolver

Consulta:

```text
contexto textual
+
Narrative IR anterior
+
world
+
knowledge
+
social relations
```

↓

Resultado:

```text
ele
→ @joao

objeto
→ @espada

seu amigo
→ @pedro
```

↓

### Semantic Intent

```text
intent:
transfer

agent:
@joao

theme:
@espada

recipient:
@pedro
```

↓

### Validation

```text
João possui espada?       ✓
Pedro é amigo de João?    ✓
A espada existe?          ✓
Operação permitida?       ✓
```

↓

### Suggestion

```text
┌────────────────────────────────────┐
│ Transferência detectada            │
│                                    │
│ João                               │
│   ↓                                │
│ espada                             │
│   ↓                                │
│ Pedro                              │
│                                    │
│ [Aplicar] [Editar] [Ignorar]       │
└────────────────────────────────────┘
```

↓

**Aplicar**

↓

### Mutation

```text
remove @espada from @joao.inventory
add @espada to @pedro.inventory
```

↓

### Event

```text
world:mutated
```

↓

### Diagnostics / Timeline / History

Todos os plugins interessados recebem o evento.

---

# 18. E no modo automático

Exatamente o mesmo fluxo.

A diferença é apenas o `Policy`.

```text
mode = suggest
```

ou:

```text
mode = auto
```

Portanto não queremos dois motores.

Queremos:

```text
mesma interpretação
mesma validação
mesma mutation
```

com:

```text
política diferente
```

Isso é arquiteturalmente muito melhor.

---

# 19. A política pode ser por operação

Por exemplo:

```text
AUTO

move               ✓
take               ✓
drop               ✓
give               ✓
open               ✓
close              ✓

MODERADO

create entity      perguntar
create relation    perguntar

SENSÍVEL

change belief      perguntar
change personality perguntar
change character arc
                   perguntar
```

Isso não fica no plugin de IA.

Fica no:

```text
Policy / Permission Plugin
```

---

# 20. O `notebook` atual já possui parte da experiência que queremos

O projeto atual já consegue:

```text
prosa
→ anotação
→ DO
→ timeline
→ reconstrução do mundo
→ diff
```

e seu `timeline.ts` já calcula diferenças entre estados de entidades e reconstrói o mundo a partir das anotações. Isso é uma base excelente para o novo **Authoring Runtime**.

Portanto eu não eliminaria o Notebook.

Eu mudaria seu papel.

De:

```text
Caderno com comandos embutidos
```

para:

```text
Authoring Workspace
```

---

# 21. O editor passa a ser o centro

A interface final que eu imaginaria:

```text
┌─────────────────────────────────────────────────────────────┐
│ LUME                                                       │
│ Livro › Capítulo 7 › Cena 3                  ○ Auto / Sugest │
├───────────────┬─────────────────────────────┬───────────────┤
│               │                             │               │
│ ESTRUTURA     │         MANUSCRITO          │ CONTEXTO      │
│               │                             │               │
│ Capítulo 1    │ João entrou na sala.        │ João          │
│ Capítulo 2    │                             │ Maria         │
│ ...           │ Pedro estava esperando.     │ Pedro         │
│               │                             │               │
│ Capítulo 7    │ Ele deu a espada para...    │ espada        │
│   Cena 1      │                             │               │
│   Cena 2      │                             │ Relações      │
│   Cena 3 ←    │                             │ João → Pedro  │
│   Cena 4      │                             │               │
│               │                             │               │
├───────────────┴─────────────────────────────┴───────────────┤
│ ✓ salvo   1 sugestão   0 inconsistências   2 alterações    │
└─────────────────────────────────────────────────────────────┘
```

O escritor quase nunca verá:

```text
ECS
CapabilityRegistry
Envelope
Dispatcher
Matcher
Resolver
Plugin
```

Isso ficará por baixo.

---

# 22. O Canvas continua existindo

O antigo conceito do `context-machine` e do editor visual também pode permanecer.

Mas como uma **segunda superfície**:

```text
ESCRITA
ESTRUTURA
UNIVERSO
CRONOLOGIA
REVISÃO
```

No Canvas:

```text
[JOÃO]
   │
   ├── amigo → [PEDRO]
   │
   └── possui → [ESPADA]

[CAP. 7]
   │
   └── revela → [SEGREDO]
```

Clicar em qualquer elemento leva ao trecho do manuscrito.

---

# 23. Arquitetura final dos plugins

Eu não dividiria simplesmente por “feature”.

A divisão seria por **responsabilidade e contrato**.

```text
src/
├── kernel/
│
├── plugins/
│
│   ├── manuscript/
│   ├── authoring/
│   ├── narrative-ir/
│   ├── prose-nlu/
│   ├── reference-resolution/
│   ├── intent/
│   ├── world/
│   ├── mutation/
│   ├── rules/
│   ├── query/
│   ├── taxonomy/
│   ├── knowledge/
│   ├── timeline/
│   ├── causality/
│   ├── character/
│   ├── discourse/
│   ├── diagnostics/
│   ├── persistence/
│   ├── ai-model/
│   ├── policy/
│   └── ui/
│
└── contracts/
```

E os atuais kits continuariam como módulos opcionais:

```text
kit-social
kit-adventure
kit-combat
kit-channel
kit-prose
life
spatial
senses
...
```

---

# 24. O que acontece com o `narrative-engine` atual?

Eu **não manteria aquele plugin gigantesco como está**.

O próprio projeto atual diz que ele é o dono de:

```text
world
taxonomy
query
compile
ON/IF/DO
interact
rewind
```

e fornece várias capabilities. 

Isso é muito para uma única unidade.

Eu dividiria internamente:

```text
WorldRuntime
QueryRuntime
TaxonomyRuntime
RuleRuntime
EffectRuntime
ReplayRuntime
```

Pode haver um plugin “Narrative Runtime” agregador, mas suas partes passam a conversar por contratos.

---

# 25. O que acontece com o `intent-engine`?

Ele continua existindo.

Mas deixa de ser:

```text
parser
+
resolver
+
adapter
+
acesso direto ao NarrativeEngine
```

e passa a ser:

```text
Intent Core
   │
   ├── intent.catalog
   ├── intent.normalize
   ├── intent.resolve
   └── intent.execute
```

O execute nunca toca diretamente no mundo.

Ele envia:

```text
world.mutate
```

---

# 26. O que acontece com o `nlp`?

Esse é um caso especialmente interessante.

Hoje:

```text
nlp
 ↓
vocab
 ↓
intent.*
```

Isso continua como **Fast Path**.

Mas teremos:

```text
Fast Path
   ↓
rule / vocabulary NLP

Semantic Path
   ↓
small local model

Fallback / deep Path
   ↓
optional larger model
```

O restante da aplicação não precisa saber qual modelo fez a interpretação.

Todos devolvem:

```text
NarrativeIR
```

ou um contrato equivalente.

Isso significa que amanhã você pode trocar:

```text
modelo A
```

por:

```text
modelo B
```

sem alterar:

```text
ECS
World
Intent
UI
Timeline
```

---

# 27. E o mais importante para desenvolvimento de código

Eu colocaria uma barreira arquitetural real:

```text
src/plugins/foo
     X
src/plugins/bar
```

Isso deveria falhar no lint/teste.

Permitido:

```text
foo
 ↓
core contract
 ↓
dispatcher
 ↓
bar
```

ou:

```text
foo
 ↓
capability
 ↓
bar
```

mas a implementação não é compartilhada.

---

# 28. Um plugin teria uma superfície muito pequena

```text
plugins/reference-resolution/

CONTEXT.md
manifest.ts
types.ts
index.ts

contracts/
  resolve-reference.ts

lib/
  resolver.ts
  ranking.ts
  candidates.ts
  evidence.ts

__tests__/
```

E nada de:

```text
import "../../world/lib/..."
```

O plugin recebe:

```text
WorldQueryPort
NarrativeContextPort
```

pelos slots.

---

# 29. E isso também melhora MUITO a manutenção pela IA

O projeto atual já tem uma preocupação excelente com `CONTEXT.md`, `MAPA.md`, `ROTEAMENTO.md`, `INVARIANTES.md` e manifests. A documentação de eficiência já determina que a IA deve descobrir primeiro o plugin e seu contrato, em vez de vasculhar o código. 

Eu manteria essa ideia e a transformaria em regra da nova arquitetura.

Cada plugin:

```text
CONTEXT
MANIFEST
TYPES
INDEX
CONTRACTS
LIB
TESTS
```

E o mapa:

```text
plugin
→ capability
→ slot
→ event
→ handler
→ dependências
```

poderia ser gerado automaticamente.

---

# 30. Boot novo

O boot deixaria de ser:

```text
import plugin A
import plugin B
import plugin C
register A
register B
register C
activate A
activate B
activate C
```

e passaria a:

```text
Boot
 ↓
Plugin Catalog
 ↓
Manifest Validation
 ↓
Dependency Graph
 ↓
Capability Graph
 ↓
Slot Binding
 ↓
Permission Graph
 ↓
Lifecycle Plan
 ↓
Instantiate
 ↓
Activate
 ↓
Health Check
 ↓
READY
```

Assim o Boot conhece:

```text
manifestos
```

e não os detalhes de cada domínio.

---

# 31. E eu faria dois tipos de isolamento

### Isolamento lógico

Todo plugin:

```text
Context
Capabilities
Slots
Envelope
Permissions
```

### Isolamento físico opcional

Para plugins mais arriscados:

```text
Worker
Realm
iframe sandbox
ExtHost
```

Isso aproveita a ideia que já existe no `ext-host`, embora o sandbox atual seja apenas uma camada de execução controlada em JavaScript e não deva ser tratado como uma fronteira de segurança forte. O projeto já possui esse host externo e permissões declaradas. 

---

# 32. A arquitetura que eu considero ideal para o Lume

```text
                           AUTHOR
                             │
                             ▼
                     ┌───────────────┐
                     │      UI       │
                     └───────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   AUTHORING    │
                    │     RUNTIME    │
                    └───────┬────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │   NARRATIVE    │
                    │      IR        │
                    └───────┬────────┘
                            │
                  ┌─────────┼──────────┐
                  ▼         ▼          ▼
                NLU     RESOLVER    DISCOURSE
                  │         │          │
                  └─────────┼──────────┘
                            ▼
                         INTENT
                            │
                            ▼
                         POLICY
                            │
                            ▼
                       DISPATCHER
                            │
                            ▼
                       WORLD PORT
                            │
                            ▼
                     WORLD RUNTIME
                            │
                            ▼
                        MUTATION
                            │
            ┌───────────────┼────────────────┐
            ▼               ▼                ▼
        KNOWLEDGE        TIMELINE         CAUSALITY
            │               │                │
            └───────────────┼────────────────┘
                            ▼
                       DIAGNOSTICS
                            │
                            ▼
                           UI
```

E tudo isso repousa sobre:

```text
                    KERNEL 0

       Registry
       Capability
       Slot
       Envelope
       Dispatcher
       EventBus
       Lifecycle
       Isolation
       Permission
       Diagnostics
       Boot
```

---

# 33. Minha avaliação do que deve ser aproveitado

### Manter

```text
Current Core
Plugin Manifest
Plugin Registry
Capability Registry
EventBus
ErrorBoundary
CONTEXT.md
MAPA
ROTEAMENTO
INVARIANTES
Testing strategy
ext-host
```

### Aproveitar fortemente do projeto antigo

```text
Context Machine
Matcher
Router
Registry
Narrative IR
SourceMap
Narrative Language
Reference Resolution
Discourse Analysis
Timeline
Snapshot
Diff
Authoring annotations
```

### Refatorar profundamente

```text
bootstrap.ts
narrative-engine
intent-engine
nlp
notebook
ide-state
ide-ui
```

principalmente removendo dependências diretas entre plugins.

### Criar como nova camada

```text
Kernel Slots
Envelope Bus
Dispatcher
Capability Ports
Reference Resolver
Narrative NLU
Mutation Gateway
Policy Engine
Context Assembly
Authoring Runtime
```

---

# 34. O ponto mais importante

Depois de ler o projeto completo, eu **não começaria pela IA pequena**.

A IA é apenas um fornecedor de:

```text
semantics
```

O coração da nova aplicação é:

```text
             TEXTO
               ↓
          NARRATIVE IR
               ↓
       CONTEXT + REFERENCES
               ↓
          INTENT / EVENT
               ↓
          POLICY GATE
               ↓
           MUTATION
               ↓
              WORLD
               ↓
            EVENTS
               ↓
     TIMELINE / KNOWLEDGE /
      DIAGNOSTICS / UI
```

E isso é justamente o que permitirá trocar o modelo de IA, trocar o backend do mundo, remover um plugin, acrescentar outro, alterar o resolver, adicionar uma nova capacidade ou até remover completamente uma parte do sistema **sem desmontar o restante da aplicação**.

O projeto que você enviou **já possui boa parte das peças necessárias**; o trabalho principal não é inventar tudo do zero, mas **transformar duas arquiteturas parcialmente sobrepostas em uma única arquitetura coerente e realmente desacoplada**. O próximo artefato técnico adequado para isso é uma **especificação arquitetural mestre do LumeTest**, contendo Kernel 0, contratos de Envelope/Slot/Capability, grafo de plugins, regras de isolamento, pipeline de autoria e o mapa de migração de cada plugin atual para a nova arquitetura.

## Prompt:
27/09/2026, 20:16:29

faça isso, já com os novos sitemas (lembrando que  a ideia é transformar o lmte em uma ferram definitiva para escritores (sobre comandos durante o manuscristo, por exemplo "ent.create " etc,, ainda quero qeu fica no ssitema, todos os comandos como modo opcional, para escritores mais avançados que squemre ter mais liberdade manual e tecnica sobre a eshitoria)

O próximo artefato técnico adequado para isso é uma **especificação arquitetural mestre do LumeTest**, contendo Kernel 0, contratos de Envelope/Slot/Capability, grafo de plugins, regras de isolamento, pipeline de autoria e o mapa de migração de cada plugin atual para a nova arquitetura.

## Response:
27/09/2026, 20:19:37 · gpt-5-6-t-mini

A especificação vai preservar o modo técnico atual (`ent.*`, `mut.*`, `intent.*`, `narr.*`, `phr.*`, etc.) como uma **camada opcional de autoria avançada**, sem obrigar o escritor comum a conhecê-la. Também vou separar claramente o que é texto, o que é semântica e o que é mutação do mundo.

> **Organizando a arquitetura**
>
> Estou agrupando módulos por função: linguagem, autoria, interface, mundo narrativo, continuidade, causalidade, personagens, políticas e execução. Também estou avaliando um runtime compatível com ECS sem afirmar que o sistema atual já seja ECS.
>
> **Organizou a arquitetura**
>
> 
>
> **Especificou a arquitetura-mestra do Narrative Write e analisou o LUME**
>
> 
>
> Pensou por 54s

Li o `lumetest_c1.md` como base da especificação. O projeto já contém uma fundação de microkernel, manifests, capabilities, EventBus, isolamento de erros, 29 plugins no boot, além de `intent-engine`, `nlp`, `notebook`, `narrative-engine`, `dry-run`, `timeline`, `source-map` e um `Narrative IR` bastante rico. 

A especificação abaixo trata isso como **arquitetura-alvo**: preservar o que já funciona, eliminar acoplamentos indevidos, incorporar os novos sistemas e transformar o Lume em um **ambiente de autoria literária completo**, sem retirar os comandos técnicos dos usuários avançados.

**document: LumeTest - Especificação Arquitetural Mestre**

# LumeTest - Especificação Arquitetural Mestre

## Plataforma Modular de Autoria Narrativa Assistida

**Versão:** 2.0  
**Status:** arquitetura-alvo  
**Base:** `lumetest_c1.md` + evolução da arquitetura `projeto_narrative-write`  
**Princípio:** o escritor controla a obra; a plataforma compreende, organiza, verifica e executa aquilo que o autor autorizou.

---

# 1. VISÃO DO PRODUTO

O LumeTest deixa de ser tratado como um simples editor narrativo ou como um motor de ficção interativa.

O produto-alvo é um:

> **Ambiente Integrado de Autoria Narrativa**

A finalidade é fornecer ao escritor um espaço único no qual ele possa:

- escrever prosa normalmente;
- estruturar capítulos e cenas;
- criar personagens, objetos, lugares e relações;
- controlar o estado do mundo narrativo;
- acompanhar cronologia;
- controlar o conhecimento de personagens;
- acompanhar arcos;
- relacionar acontecimentos;
- controlar preparações e resoluções;
- verificar continuidade;
- analisar focalização, voz e discurso;
- executar simulações;
- receber assistência de IA;
- aceitar ou rejeitar interpretações;
- manter histórico e versões;
- usar comandos técnicos manualmente;
- trabalhar em modo totalmente livre;
- ou deixar a aplicação interpretar a escrita e atualizar o mundo automaticamente.

A aplicação não deve obrigar o escritor a conhecer a arquitetura interna.

O escritor pode trabalhar somente com texto.

O escritor avançado pode trabalhar diretamente com comandos.

Os dois modos devem utilizar a mesma infraestrutura interna.

---

# 2. PRINCÍPIO FUNDAMENTAL

A arquitetura deve separar três coisas:

```text
MANUSCRITO
    ↓
INTERPRETAÇÃO
    ↓
ESTADO NARRATIVO
```

E nunca confundir:

```text
texto literário
```

com:

```text
estado estrutural da obra
```

O texto permanece a representação autoral primária.

O estado narrativo é uma representação derivada, verificável e atualizável.

A arquitetura deve permitir:

```text
Texto
→ interpretação
→ proposta
→ aprovação
→ mutação
```

ou:

```text
Comando técnico
→ interpretação determinística
→ mutação
```

ou:

```text
API / plugin
→ envelope
→ dispatcher
→ capacidade
→ mutação
```

Todos os caminhos terminam nos mesmos contratos internos.

---

# 3. PRINCÍPIOS ARQUITETURAIS

## 3.1 Kernel pequeno

Kernel 0 fornece mecanismos.

Kernel 0 não sabe o que é personagem, romance, combate, diálogo, timeline ou ECS narrativo.

---

## 3.2 Plugins isolados

Código novo não importa implementação interna de outro plugin.

A comunicação ocorre por:

```text
Capability
Slot
Envelope
Event
Command
Query
```

---

## 3.3 Uma única fonte de execução

Não devem existir dois motores concorrentes para a mesma responsabilidade.

Existe um caminho canônico para:

```text
match
validate
dispatch
mutate
replay
```

---

## 3.4 Texto e comandos coexistem

O modo técnico não será removido.

O escritor poderá escrever:

```text
ent.create @joao
```

ou:

```text
mut.set.stats @joao.forca 8
```

ou:

```text
intent.move.@joao.@sala
```

ou:

```text
narr.catalog ...
```

ou outros comandos existentes no catálogo.

Esses comandos são um **modo avançado e explícito de autoria**.

A linguagem natural é uma camada adicional.

---

## 3.5 IA nunca é fonte de verdade

A IA interpreta.

O sistema determina se a interpretação pode ser aceita.

O mundo determina o estado.

O autor determina a obra.

---

# 4. MODELOS DE USO

A plataforma deve suportar quatro regimes.

## 4.1 Modo manual

O escritor trabalha diretamente com comandos técnicos.

Exemplo:

```text
ent.create @joao
ent.create @espada
mut.set.tags @joao guerreiro
mut.push.list @joao.inventario @espada
```

Nenhuma inferência linguística é necessária.

---

## 4.2 Modo preview

A aplicação interpreta a escrita, mostra estrutura e diagnósticos, mas não modifica o mundo.

O projeto atual já possui o conceito `preview`, no qual há análise e IR, mas nenhuma mutação. 

---

## 4.3 Modo sugestão

A aplicação interpreta e apresenta:

```text
João
   ↓ entregou
Espada
   ↓ para
Maria
```

O escritor decide:

```text
Aplicar
Editar
Ignorar
```

O projeto atual já define esse regime como `suggest`. 

---

## 4.4 Modo automático

A aplicação pode aplicar automaticamente interpretações que estejam dentro das políticas permitidas.

O projeto já possui `auto` e thresholds por operação. 

O novo sistema deve tornar isso mais granular:

```text
AUTO

movimentação               permitida
posse de objeto            permitida
estado simples             permitida

criação de personagem      pedir
nova relação               pedir

mudança psicológica        pedir
alteração estrutural       pedir
```

Essas permissões devem pertencer ao `Policy Plugin`, não ao modelo de IA.

---

# 5. KERNEL 0

Estrutura:

```text
src/kernel/

boot/
registry/
capabilities/
slots/
envelope/
matcher/
resolver/
dispatcher/
events/
lifecycle/
permissions/
isolation/
diagnostics/
contracts/
```

## 5.1 Responsabilidades

Kernel 0:

- descobre plugins;
- valida manifestos;
- monta o grafo de dependências;
- registra capabilities;
- registra slots;
- registra handlers;
- valida contratos;
- resolve providers;
- cria contextos;
- despacha envelopes;
- encaminha eventos;
- verifica permissões;
- controla lifecycle;
- isola falhas;
- fornece diagnostics.

## 5.2 Não pertence ao Kernel

Não colocar:

```text
World
Character
Timeline
NarrativeIR
Knowledge
Intent
Rule
Scene
Manuscript
Dialogue
Style
```

no Kernel.

---

# 6. PLUGIN MANIFEST

O manifest atual já possui identidade, versão, `provides`, `requires`, hooks e permissões. 

A nova versão deve ampliar isso:

```ts
interface PluginManifest {

  id: string;
  version: string;

  provides: CapabilityDeclaration[];

  requires: RequirementDeclaration[];

  slots?: SlotDeclaration[];

  events?: {
    emits?: EventDeclaration[];
    listens?: EventDeclaration[];
  };

  permissions?: PermissionDeclaration[];

  isolation?: {
    level: "in-process" | "worker" | "sandbox";
  };

  lifecycle?: {
    init?: string;
    start?: string;
    stop?: string;
    destroy?: string;
  };
}
```

---

# 7. CAPABILITY

Capability define:

> o que um plugin oferece.

Exemplos:

```text
world.read
world.query
world.mutate

narrative.parse
narrative.ir
narrative.validate

reference.resolve
reference.rank

intent.resolve
intent.execute

knowledge.read
knowledge.write

timeline.read
timeline.write

causality.analyze

continuity.analyze

character.read
character.arc

context.assemble

diagnostics.report
```

Capabilities devem ser pequenas.

Evitar:

```text
NarrativeEngine
```

como um serviço gigante com dezenas de responsabilidades.

Um plugin pode fornecer várias capabilities independentes.

---

# 8. SLOT

Slot define:

> qual porta uma funcionalidade pode ocupar.

Exemplos:

```text
slot:narrative.input
slot:narrative.semantic
slot:narrative.reference
slot:narrative.intent

slot:world.query
slot:world.mutation

slot:knowledge.lookup
slot:timeline.lookup

slot:ai.interpreter
slot:ai.classifier
```

Um plugin pode fornecer um slot.

Outro pode consumir.

Isso permite substituir implementações sem alterar consumidores.

---

# 9. ENVELOPE

Toda comunicação significativa entre módulos deve poder ser representada por envelope.

```ts
interface Envelope<T> {

  id: string;

  type: string;
  version: string;

  source: Endpoint;
  target?: Endpoint;

  capability?: string;
  slot?: string;

  mode?: "manual" | "preview" | "suggest" | "auto";

  correlationId?: string;
  causationId?: string;

  timestamp: number;

  permissions?: PermissionContext;

  context?: ContextRef;

  payload: T;
}
```

Exemplo:

```json
{
  "type": "narrative.semantic.request",
  "version": "1.0",
  "source": "authoring.editor",
  "target": "slot:narrative.semantic",
  "mode": "suggest",
  "payload": {
    "sentence": "João deu a espada para Maria."
  }
}
```

---

# 10. DISPATCHER

O Dispatcher é o mecanismo que recebe envelopes e encontra o destino.

Fluxo:

```text
Envelope
   ↓
validate
   ↓
permission
   ↓
Matcher
   ↓
Resolver
   ↓
Capability
   ↓
Handler
   ↓
result
```

O Dispatcher não sabe o significado narrativo.

Ele sabe apenas:

```text
quem
→ pode
→ receber
→ este envelope
```

---

# 11. MATCHER

O Matcher deve ser dividido por domínio.

```text
InputMatcher
IntentMatcher
ReferenceMatcher
CapabilityMatcher
SlotMatcher
RuleMatcher
CommandMatcher
```

### InputMatcher

Classifica:

```text
empty
slash-command
technical-command
snippet
prose
```

### IntentMatcher

Classifica:

```text
give
take
move
open
speak
observe
remember
...
```

### ReferenceMatcher

Localiza ocorrências como:

```text
ele
ela
isso
o objeto
seu amigo
aquela casa
```

---

# 12. RESOLVER

O Resolver deve ser especializado.

```text
CapabilityResolver
ReferenceResolver
EntityResolver
IntentResolver
ContextResolver
RuleResolver
```

Nenhum `resolver.ts` gigante deve conter todos esses comportamentos.

---

# 13. WORLD RUNTIME

O projeto atual possui um `WorldModel` com entidades, tags, stats, links e outros campos. O próprio glossário atual deixa claro que isso ainda não é um ECS formal. 

A nova arquitetura não deve obrigar o restante do sistema a conhecer isso.

Criar:

```text
WorldPort
```

com operações conceituais:

```text
readEntity
queryEntities
createEntity
updateEntity
destroyEntity
addRelation
removeRelation
```

A implementação atual pode ser:

```text
WorldModelAdapter
```

Futuramente:

```text
ECSWorldAdapter
```

O restante da plataforma permanece igual.

Assim o ECS se torna um detalhe de implementação do runtime.

---

# 14. MUTATION GATEWAY

Nenhum plugin altera o mundo diretamente.

Tudo passa por:

```text
MutationGateway
```

Exemplo:

```json
{
  "operation": "transfer",
  "actor": "@joao",
  "object": "@espada",
  "recipient": "@maria"
}
```

O Gateway verifica:

```text
entidades existem?
objeto pertence ao agente?
operação válida?
permissão?
regra?
modo?
```

Depois executa.

---

# 15. NARRATIVE IR

O `Narrative IR` existente deve se tornar a principal ponte entre linguagem e runtime.

O projeto já possui:

```text
operations
voice
focalization
semantic roles
epistemic state
temporal frame
aspect
modality
negation
references
provenance
diagnostics
source spans
```

e oito operações narrativas:

```text
represent
describe
enunciate
expose
evaluate
interiorize
structure
focalize
```

Isso deve ser preservado e ampliado.

---

# 16. LINGUAGEM → IR

Exemplo:

```text
João deu a espada para Maria.
```

deve produzir algo aproximadamente assim:

```json
{
  "operation": "represent",

  "proposition": {
    "predicate": "dar",

    "roles": {
      "agent": "@joao",
      "theme": "@espada",
      "recipient": "@maria"
    }
  }
}
```

Isso não é ainda uma mutação.

É interpretação.

---

# 17. REFERÊNCIA

A frase:

```text
Ele deu o objeto para seu amigo.
```

não deve ser interpretada isoladamente.

O `Context Engine` fornece:

```text
sentenças anteriores
personagens presentes
objetos recentes
focalização
estado atual
relações
conhecimento
posição no manuscrito
```

O `ReferenceResolver` produz:

```text
ele
→ candidatos

o objeto
→ candidatos

seu amigo
→ candidatos
```

Depois o ranking utiliza evidências.

---

# 18. EVIDENCE ENGINE

Cada resolução deve poder possuir evidências.

Exemplo:

```text
@joao
+ recente no texto
+ sujeito da sentença anterior
+ compatível com gênero
+ está no foco atual
+ possui espada

@pedro
+ personagem recente
- não é sujeito
- não possui espada
```

Resultado:

```text
@joao
confidence = 0.94
```

---

# 19. NARRATIVE NLU

O `nlp` existente é propositalmente simples e transforma linguagem conhecida em `intent.*`; ele utiliza vocabulário, aliases, gramática, scope e resolução de entidades. 

Ele deve continuar.

A nova arquitetura adiciona um segundo nível:

```text
FAST NLU
   ↓
regras + vocabulário

SMALL MODEL
   ↓
semântica / intenção / referência

DEEP ANALYSIS
   ↓
Narrative IR
```

Nenhuma parte do sistema depende do modelo específico.

---

# 20. AI MODEL ADAPTER

Criar:

```text
ai-runtime/
```

com:

```text
ModelRegistry
ModelAdapter
InferenceEngine
ModelCache
LatencyMonitor
ModelCapabilities
```

Um modelo pequeno pode fornecer:

```text
intent classification
entity extraction
semantic classification
reference candidates
```

Outro modelo pode futuramente fornecer:

```text
discourse analysis
style analysis
deep revision
```

O restante não precisa saber qual modelo executou a tarefa.

---

# 21. CONTEXT ENGINE

Responsável por montar o contexto adequado.

Não deve simplesmente enviar o romance inteiro ao modelo.

Exemplo:

```text
TASK
reference.resolve

CURRENT SENTENCE
"Ele deu o objeto para seu amigo."

LOCAL CONTEXT
3 sentenças anteriores

ENTITIES
João
Pedro
Espada

WORLD
João possui espada

RELATIONS
João → amigo → Pedro

FOCALIZATION
João
```

Resultado:

```text
resolved context
```

---

# 22. AUTHORING RUNTIME

Novo núcleo de experiência do escritor.

Responsabilidades:

```text
cursor
selection
current scene
current chapter
current sentence
author intent
pending suggestions
annotations
draft state
session state
context
```

Esse runtime conecta:

```text
editor
Narrative IR
Context
AI
World
Diagnostics
History
```

---

# 23. MANUSCRIPT ENGINE

O Manuscript Engine passa a ser a fonte autoral.

Modelo:

```text
Project

Book
 ├── Part
 │    └── Chapter
 │         └── Scene
 │              ├── paragraph
 │              ├── sentence
 │              └── dialogue
```

Cada unidade deve possuir IDs estáveis.

Exemplo:

```text
book-01
chapter-07
scene-03
paragraph-12
sentence-04
```

---

# 24. SOURCE MAP

O SourceMap já existente deve ser mantido.

Ele permite:

```text
texto
  ↕
NarrativeAct
```

O projeto atual já possui `actToSource`, `sourceToAct`, `sourceToActs`, `spanKey` e estatísticas determinísticas. 

Essa infraestrutura será fundamental para a UX.

Clicar numa estrutura narrativa sempre deve poder voltar ao texto que a originou.

---

# 25. KNOWLEDGE ENGINE

Responsabilidade:

```text
quem sabe o quê
quando sabe
como sabe
o que acredita
o que lembra
o que desconhece
```

Modelo:

```text
Fact
Knowledge
Belief
Memory
Perception
Ignorance
```

Exemplo:

```text
Maria
knows → "Pedro é o assassino"

João
believes → "Pedro mente"

João
does_not_know → "Pedro é o assassino"
```

O sistema atual já separa informação do estado de conhecimento e utiliza conhecimento associado ao agente. Essa separação deve ser preservada. 

---

# 26. CHARACTER STATE

Separar:

```text
estado atual
```

de:

```text
arco
```

ECS/World:

```text
João
mood = preocupado
health = 7
location = @sala
```

Character Arc:

```text
crença inicial
→ experiência
→ crise
→ decisão
→ transformação
```

---

# 27. CHARACTER ARC ENGINE

Responsável por rastrear:

```text
beliefs
values
goals
fears
relationships
decisions
turning points
transformations
```

Pode produzir visualizações.

Não deve impor uma estrutura obrigatória.

O autor pode ter:

```text
sem arco
arco simples
múltiplos arcos
arco contraditório
arco incompleto
```

---

# 28. TIMELINE ENGINE

Deve manter dois eixos independentes:

```text
story time
```

e:

```text
discourse order
```

E opcionalmente:

```text
simulation time
```

O Narrative IR existente já separa explicitamente `story`, `discourse` e `simulation`. 

---

# 29. CAUSALITY ENGINE

Representa:

```text
causa
efeito
motivação
consequência
dependência
preparação
```

Exemplo:

```text
João descobre segredo
       ↓
perde confiança
       ↓
confronta Maria
       ↓
Maria foge
```

Isso é diferente de timeline.

Duas coisas podem ser próximas no tempo sem serem causalmente relacionadas.

---

# 30. SETUP / PAYOFF ENGINE

Rastreia elementos preparados e retomados.

Exemplo:

```text
Capítulo 2
introdução da chave

Capítulo 7
menção da chave

Capítulo 11
chave resolve o mistério
```

Categorias:

```text
objeto
informação
promessa
conflito
personagem
imagem
tema
diálogo
mistério
```

O sistema deve permitir:

```text
resolved
unresolved
intentionally-open
abandoned
unknown
```

---

# 31. CONTINUITY ENGINE

Verifica:

```text
tempo
localização
posse
estado
conhecimento
relações
aparência
ferimentos
objetos
participação
```

Exemplo:

```text
Capítulo 4:
João está ferido no braço esquerdo.

Capítulo 6:
João usa normalmente o braço esquerdo.

→ possível divergência
```

A ferramenta apresenta:

```text
possível inconsistência
```

Não:

```text
erro obrigatório
```

---

# 32. DISCOURSE ENGINE

Analisa:

```text
voice
POV
focalization
direct speech
indirect speech
thought
free indirect discourse
description
exposition
commentary
```

O projeto já possui essas dimensões no Narrative IR. 

---

# 33. STYLE ENGINE

Responsável por analisar:

```text
cadência
ritmo
repetição
vocabulário
comprimento das frases
densidade de diálogo
densidade descritiva
voz
padrões recorrentes
```

Não deve transformar estilo em score global.

Deve mostrar evidências.

---

# 34. INTENT ENGINE

O `intent-engine` atual continua existindo, mas muda de posição.

Antes:

```text
entrada
→ intent-engine
→ narrative-engine
```

Depois:

```text
entrada
→ language layer
→ Narrative IR
→ Intent Resolver
→ Policy
→ Dispatcher
→ World
```

O `intent-engine` continua sendo o domínio responsável por intenções executáveis.

---

# 35. COMMAND SURFACE

Novo conceito explícito.

O sistema de comandos não será removido.

Criar:

```text
command-surface
```

responsável por:

```text
technical commands
slash commands
autocomplete
command help
command parser
command validation
command execution
```

Ele é um **modo oficial de autoria**.

---

# 36. COMANDOS E PROSA NO MESMO EDITOR

O editor deve reconhecer:

```text
ent.create @joao
```

como comando técnico.

E:

```text
João entrou na sala.
```

como prosa.

Também:

```text
intent.move.@joao.@sala
```

como comando técnico.

E:

```text
João caminhou até a sala.
```

como prosa.

A coexistência é obrigatória.

---

# 37. ROUTER DEFINITIVO

```text
INPUT
 │
 ├── /
 │     ↓
 │  SlashCommand
 │
 ├── prefixo técnico
 │     ↓
 │  Command Surface
 │
 ├── snippet
 │     ↓
 │  Matcher
 │
 └── demais
       ↓
    Prose Pipeline
```

Isso preserva compatibilidade com o Router atual.

---

# 38. PROSE PIPELINE

```text
texto
 ↓
segmenter
 ↓
linguistic layer
 ↓
fast NLU
 ↓
small model
 ↓
Narrative IR
 ↓
reference resolver
 ↓
semantic resolver
 ↓
intent/event compiler
 ↓
policy
 ↓
suggestion / mutation
```

---

# 39. AUTHOR INTENT

O autor poderá registrar intenção explícita da cena.

Exemplo:

```text
OBJETIVO
Aumentar a desconfiança.

INFORMAÇÃO
Revelar parcialmente o passado.

PERSONAGEM
Mostrar a resistência de João.

ESTRUTURA
Preparar a fuga de Maria.
```

Isso entra no Context Engine.

---

# 40. NARRATIVE DIAGNOSTICS

Todos os analisadores produzem diagnostics.

Tipos:

```text
lexical
syntactic
semantic
referential
narrative
epistemic
continuity
causal
temporal
execution
validation
```

O projeto já possui várias dessas fases no IR. 

---

# 41. SUGGESTION OBJECT

Qualquer interpretação que não seja imediatamente executável deve virar uma sugestão estruturada.

```ts
interface Suggestion {

  id: string;

  sourceSpan: SourceSpan;

  interpretation: NarrativeInterpretation;

  confidence: number;

  evidence: Evidence[];

  proposedMutations: Mutation[];

  relatedEntities: string[];

  impact: ImpactSummary;

  actions: [
    "accept",
    "edit",
    "reject"
  ];
}
```

---

# 42. POLICY ENGINE

A política avalia:

```text
quem fez
o quê
em qual modo
com qual confiança
com quais evidências
com qual impacto
```

Exemplo:

```text
transfer item
confidence 0.96
policy = auto
→ executar
```

Outro:

```text
change relationship
confidence 0.88
policy = suggest
→ mostrar sugestão
```

---

# 43. IMPACT ANALYSIS

Toda mutação pode informar:

```text
entities affected
scenes affected
timeline affected
knowledge affected
relationships affected
future references affected
```

Isso é essencial quando o escritor altera algo antigo.

Exemplo:

```text
mudar proprietário da espada
```

pode afetar:

```text
capítulo 7
capítulo 9
capítulo 11
setup/payoff
continuidade
```

---

# 44. DRY RUN

O `dry-run` existente deve virar uma capability transversal.

O projeto já garante que dry-run não modifica o mundo vivo, histórico ou rule counts. 

Novo fluxo:

```text
MutationProposal
        ↓
DryRun
        ↓
World Preview
        ↓
Diff
```

Isso pode ser utilizado tanto pela IA quanto pelo comando manual.

---

# 45. VERSIONING

O sistema deve preservar:

```text
document version
world version
narrative IR version
project version
session version
```

O escritor pode restaurar:

```text
texto
mundo
ou ambos
```

---

# 46. REPLAY

O replay atual baseado em seed/triggerId deve continuar.

O objetivo é reproduzir o estado derivado.

O replay não deve depender de:

```text
wall-clock
```

nem de eventos aleatórios não controlados.

---

# 47. EVENTOS

Eventos do Kernel devem ser eventos de plataforma.

Exemplos:

```text
lume:project-opened
lume:project-saved

lume:document-changed
lume:sentence-analyzed

lume:narrative-ir-generated
lume:reference-resolved

lume:intent-created
lume:intent-dispatched

lume:world-mutated

lume:knowledge-updated
lume:timeline-updated

lume:diagnostic-created
```

Eventos diegéticos continuam separados:

```text
world-event
```

A distinção existente entre eventos de plataforma e eventos narrativos deve permanecer. 

---

# 48. QUERY SYSTEM

Queries nunca devem mutar.

Exemplos:

```text
findCharacter
findObject
findRelations
findKnowledge
findTimelineEvents
findSceneReferences
findRelevantContext
```

Queries devem possuir:

```text
scope
permissions
version
timeout
```

---

# 49. TRANSACTION MODEL

Mutations importantes devem ser tratadas como operação lógica:

```text
prepare
validate
apply
emit
record
```

Em caso de falha:

```text
não aplicar parcialmente
```

Quando necessário:

```text
draft mutation
→ dry-run
→ commit
```

---

# 50. PLUGIN ISOLATION

### Level 1 - logical

Capability + Envelope + Slot.

### Level 2 - error isolation

Falha de plugin não derruba o Kernel.

### Level 3 - worker isolation

Modelos de IA e plugins pesados podem executar em Worker.

### Level 4 - sandbox

Plugins externos executam isolados.

O `ext-host` atual já possui um sistema para plugins externos, manifesto, storage e API controlada; ele deve ser integrado ao novo modelo de slots/capabilities. 

---

# 51. PLUGINS DE DOMÍNIO

## Núcleo de autoria

```text
manuscript
authoring-runtime
narrative-ir
context
```

## Linguagem

```text
vocab
prose-nlu
reference-resolution
discourse
```

## Mundo

```text
world
mutation
query
taxonomy
knowledge
```

## Narrativa

```text
intent
character
timeline
causality
continuity
setup-payoff
```

## Revisão

```text
diagnostics
style
impact-analysis
```

## Plataforma

```text
project
persistence
history
ui
settings
guide
ext-host
```

## Recursos opcionais

```text
social
adventure
combat
channel
life
spatial
senses
process
chain
sift
multiplayer
```

---

# 52. MIGRAÇÃO DOS PLUGINS ATUAIS

## `narrative-engine`

Não deve desaparecer imediatamente.

Deve ser desmontado internamente em:

```text
world-runtime
query
taxonomy
rule-runtime
rule-effects
replay
```

Mantendo temporariamente uma capability agregada para compatibilidade.

---

## `project-cloud`

Migrar para:

```text
project
persistence
history
sync
```

Separar armazenamento do domínio narrativo.

---

## `ide-state`

Transformar em:

```text
authoring-state
workspace-state
session-state
```

Não deverá armazenar lógica narrativa.

---

## `intent-engine`

Transformar em:

```text
intent
intent-catalog
intent-resolver
intent-executor
```

Sem importar diretamente `narrative-engine`.

---

## `rule-semantics`

Preservar como:

```text
semantic classification
```

Nunca substituir o Rule Matcher.

O próprio projeto estabelece que semântica não deve alterar o match. 

---

## `world-events`

Preservar.

Responsável pela projeção de acontecimentos narrativos no sistema de eventos.

---

## `knowledge`

Preservar, mas expor somente capabilities.

---

## `agency`

Preservar como:

```text
agent intent execution
```

através de Dispatcher.

---

## `spatial`

Preservar.

Passa a consumir:

```text
WorldQuery
WorldMutation
```

---

## `senses`

Preservar.

Deve ser exclusivamente responsável por:

```text
scope
perception
visibility
hearing
touch
```

---

## `kit-adventure`

Transformar em pacote de regras opcionais.

---

## `kit-social`

Transformar em pacote de domínio social.

---

## `kit-channel`

Transformar em pacote de canais narrativos.

---

## `kit-combat`

Transformar em pacote opcional de combate.

---

## `kit-prose`

Migrar para:

```text
prose-presentation
recap
narrative-display
```

---

## `sift`

Preservar como:

```text
pattern analysis
story filtering
```

---

## `dry-run`

Promover para capability transversal:

```text
simulation.preview
```

---

## `process`

Preservar como processamento temporal explícito.

---

## `chain`

Preservar como composição de intenções/eventos.

---

## `life`

Preservar como comportamento opt-in baseado no estado existente.

---

## `vocab`

Preservar.

Transformar no provider de:

```text
lexicon
grammar
aliases
command vocabulary
```

---

## `nlp`

Evoluir para:

```text
prose-nlu
```

mantendo o fast path existente.

---

## `notebook`

Promover a:

```text
manuscript
authoring
```

porque a escrita passa a ser a experiência principal.

---

## `ide-ui`

Tornar-se o único dono da UI canônica.

O projeto já determina que os componentes de IDE tenham uma fonte única em `ide-ui`. 

---

## `ide-guide`

Preservar como documentação contextual.

---

## `ide-settings`

Preservar como configuração da plataforma.

---

## `entity-extras`

Preservar como extensão de entidades.

---

## `multiplayer`

Continuar opcional e completamente isolado.

---

## `ext-host`

Preservar e adaptar ao novo contrato de capabilities/slots.

---

# 53. NOVOS PLUGINS

A nova arquitetura adiciona:

```text
narrative-ir
reference-resolution
context-assembly
character
causality
continuity
setup-payoff
discourse
style
mutation-gateway
policy
ai-runtime
authoring-runtime
manuscript
command-surface
impact-analysis
```

---

# 54. DEPENDENCY GRAPH

A direção desejada:

```text
KERNEL
  ↓
PLATFORM CONTRACTS
  ↓
AUTHORING
  ↓
LANGUAGE
  ↓
NARRATIVE
  ↓
WORLD
```

Mas nenhum domínio deve importar implementação concreta de outro.

As dependências reais:

```text
Plugin
 ↓
Capability
 ↓
Dispatcher
 ↓
Provider
```

---

# 55. BOOT NOVO

O boot deve funcionar assim:

```text
BOOT
 ↓
Kernel 0
 ↓
Contract registry
 ↓
Plugin discovery
 ↓
Manifest validation
 ↓
Dependency graph
 ↓
Capability graph
 ↓
Slot binding
 ↓
Permission graph
 ↓
Load infrastructure
 ↓
Load authoring
 ↓
Load language
 ↓
Load narrative
 ↓
Load optional kits
 ↓
Health checks
 ↓
Workspace restore
 ↓
READY
```

O boot atual possui uma lista manual de registro/ativação de plugins. Essa lista deve deixar de ser a fonte operacional de dependências e tornar-se um manifesto/catalog entrypoint. 

---

# 56. BOOT FAILURE

Se faltar capability obrigatória:

```text
plugin A
requires
world.query@1
```

e não existir provider compatível:

```text
A = não iniciado
```

mas:

```text
Kernel = continua ativo
```

Capability opcional ausente não deve derrubar a plataforma.

---

# 57. RUNTIME FLOW PRINCIPAL

## Quando o escritor escreve prosa

```text
Editor
 ↓
DocumentChanged
 ↓
SentenceSegmenter
 ↓
Fast Analysis
 ↓
Narrative NLU
 ↓
Narrative IR
 ↓
Reference Resolver
 ↓
Context Builder
 ↓
Semantic Intent
 ↓
Policy
 ↓
Suggestion / Auto
 ↓
Mutation Gateway
 ↓
World
 ↓
Events
 ↓
Timeline
Knowledge
Character
Diagnostics
UI
```

---

# 58. EXEMPLO COMPLETO

Texto:

> João estava na sala. Pedro entrou carregando uma espada. Ele deu o objeto para seu amigo.

Primeira sentença:

```text
João
location = sala
```

Segunda:

```text
Pedro
location = sala

Pedro
possesses
espada
```

Terceira:

```text
ele
→ Pedro

o objeto
→ espada

seu amigo
→ João
```

Proposta:

```text
TRANSFER

source = Pedro
object = espada
target = João
```

O sistema exibe:

```text
Pedro
   ↓ entregou
espada
   ↓
João
```

Com evidências:

```text
"Ele"
→ Pedro
porque Pedro é sujeito da sentença anterior.

"o objeto"
→ espada
porque espada foi introduzida imediatamente antes.

"seu amigo"
→ João
porque João possui relação compatível no mundo narrativo.
```

---

# 59. AO ACEITAR

Mutation:

```text
remove espada from Pedro
add espada to João
```

Event:

```text
world:mutated
```

Timeline:

```text
T42
Pedro perdeu espada.
João recebeu espada.
```

Knowledge:

```text
João sabe que recebeu espada.
Pedro sabe que entregou espada.
```

Setup/payoff:

```text
espada → ownership changed
```

Diagnostics:

```text
nenhuma inconsistência
```

---

# 60. MODO AUTOMÁTICO

No modo automático:

```text
texto
 ↓
interpretação
 ↓
evidências
 ↓
policy
 ↓
commit
```

A UI mostra apenas um indicador discreto:

```text
Mundo atualizado
```

E o usuário pode abrir:

```text
Histórico
```

para ver exatamente qual mutação foi criada.

---

# 61. SEGURANÇA DO AUTO

O automático precisa usar pelo menos quatro fatores:

```text
linguisticConfidence
referenceConfidence
worldConsistency
policyPermission
```

Não basta:

```text
confidence = 0.91
```

para executar qualquer coisa.

Uma operação pode exigir:

```text
0.85
```

enquanto outra exige:

```text
0.98
```

---

# 62. LATÊNCIA

O projeto existente já trabalha com:

```text
fast pass
slow pass
debounce
cache
```

e define metas iniciais de aproximadamente:

```text
fast = 8 ms
slow = 80 ms
debounce = 70 ms
```

Esses valores são metas arquiteturais internas, não garantias universais de hardware. 

A nova arquitetura deve preservar esse conceito:

```text
PASS 1
ultrarrápida
→ highlight / entidades / intenção preliminar

PASS 2
completa
→ IR / referência / proposta

PASS 3
opcional
→ análise profunda
```

---

# 63. UX - REGRA CENTRAL

O escritor comum deve poder ignorar completamente:

```text
ECS
plugins
capabilities
slots
IR
dispatcher
```

O usuário vê:

```text
Escrever
Personagens
Cenas
Cronologia
Universo
Revisão
Assistente
```

---

# 64. UX PARA USUÁRIO AVANÇADO

O mesmo ambiente possui:

```text
Comandos
```

com:

```text
autocomplete
help
syntax
inspection
raw command
```

Um usuário pode:

```text
ent.create @maria
```

diretamente.

Ou abrir:

```text
Modo Técnico
```

e visualizar:

```text
Entity
Tags
Stats
Links
Rules
Intent
Events
```

---

# 65. CAMADAS DE INTERFACE

## Workspace

```text
Projeto
Capítulos
Cenas
Manuscrito
```

## Context Panel

```text
Personagens presentes
Local
Tempo
Objetivos
Estado
```

## Narrative Inspector

```text
Interpretação
Referências
Relações
Eventos
Confidence
Evidence
```

## Technical Inspector

```text
Entity
Components
Rules
Commands
Events
Capabilities
```

A camada técnica só aparece quando solicitada.

---

# 66. COMMAND PALETTE

`Ctrl+K`

Exemplos:

```text
mostrar João
```

```text
mostrar tudo que Maria sabe
```

```text
ver cronologia
```

```text
ver cadeia causal
```

```text
ver inconsistências
```

```text
ent.create @pedro
```

```text
mut.set.stats @joao.forca 8
```

Uma única interface pode pesquisar:

```text
ações
entidades
comandos
cenas
diagnósticos
```

---

# 67. SELEÇÃO DE TEXTO

Selecionar:

> Pedro deu a espada para João.

barra contextual:

```text
Interpretar
Analisar
Evento
Entidades
Relações
Intent
Aplicar
Perguntar à IA
```

Isso é especialmente importante para o escritor avançado.

Ele consegue transformar manualmente qualquer trecho em estrutura.

---

# 68. AUTORIA EXPLÍCITA

Sempre deve ser possível registrar:

```text
Confirmar
```

ou:

```text
Esta interpretação é intencional.
```

Isso serve para evitar que diagnósticos futuros insistam numa alteração que o autor conscientemente rejeitou.

---

# 69. AUTORIA COMO DADO

Decisões do escritor devem poder ser armazenadas:

```text
author-decision
```

Exemplo:

```json
{
  "type": "reference",
  "span": "s7.t13",
  "decision": "Pedro",
  "reason": "intencional"
}
```

Assim o sistema aprende o projeto sem alterar silenciosamente seu modelo.

---

# 70. PLUGIN CONTRACT

Todo plugin:

```text
CONTEXT.md
manifest.ts
types.ts
index.ts
lib/
tests/
```

O projeto já possui essa convenção documental e recomenda `CONTEXT.md`, `manifest.ts`, `types.ts`, `index.ts` e testes espelhados por assunto. 

Essa regra deve permanecer.

---

# 71. CONTRATO DE IMPLEMENTAÇÃO

Novo plugin nunca deve começar assim:

```ts
import "../../outro-plugin/lib/x";
```

Deve começar assim:

```text
requires capability
```

e depois:

```text
get/dispatch/query
```

por contrato.

---

# 72. TESTE DE FRONTEIRA

Cada plugin deve testar:

```text
manifest
capabilities
permissions
events
failure isolation
contract compatibility
```

Além de seus próprios testes de domínio.

---

# 73. TESTES DO NARRATIVE NLU

Devem existir conjuntos:

```text
L0 lexical
L1 syntax
L2 entities
L3 intent
L4 reference
L5 world grounding
L6 narrative semantics
L7 mutations
```

Cada sentença deve possuir:

```text
texto
expected IR
expected references
expected intent
expected mutation
```

quando aplicável.

---

# 74. GOLDEN TESTS

Exemplo:

```text
"João deu a espada para Maria."
```

deve gerar exatamente:

```text
agent = @joao
theme = @espada
recipient = @maria
```

com tolerância apenas onde o contrato permitir ambiguidade.

---

# 75. DETERMINISMO

Para o mesmo:

```text
texto
contexto
estado do mundo
modelo
configuração
```

a interpretação deve ser reprodutível dentro da política de determinismo definida.

Quando houver IA probabilística:

```text
model version
seed
temperature
```

devem ser registrados quando necessário.

---

# 76. HISTÓRICO

Toda mutação automática deve registrar:

```text
quem
quando
texto original
interpretação
evidências
confidence
policy
mutation
resultado
```

Assim o escritor pode responder:

> Por que a espada foi parar com João?

E obter:

```text
Capítulo 7
Sentença 3
Interpretação automática
Aceita automaticamente
```

---

# 77. REVERSÃO

O usuário deve poder fazer:

```text
Desfazer mutação
```

sem necessariamente desfazer o texto.

E:

```text
Restaurar texto
```

sem necessariamente restaurar o mundo.

A relação entre versões deve ser explícita.

---

# 78. MODOS DO PROJETO

Cada projeto pode definir:

```text
languageMode
narrativeMode
projectionPolicy
autoPolicy
diagnosticsMode
technicalMode
aiMode
```

Os modos existentes:

```text
off
preview
suggest
auto
```

continuam válidos. 

As políticas de projeção existentes:

```text
none
literary
simulate
```

também podem continuar como camada separada. 

---

# 79. PROJECTION POLICY

## none

```text
texto
→ IR
```

Sem alteração.

## literary

```text
texto
→ interpretação literária
→ possíveis entidades / relações
```

Sem mutação comportamental.

## simulate

```text
texto
→ interpretação
→ command
→ world mutation
```

O sistema já possui esses três conceitos; a nova arquitetura deve formalizá-los como política de execução. 

---

# 80. PERFORMANCE

O pipeline não deve reconstruir todo o romance a cada tecla.

Deve utilizar:

```text
incremental parsing
incremental IR
sentence cache
context cache
entity index
reference index
timeline index
dependency graph
```

Alteração em:

```text
sentence 42
```

não deve obrigatoriamente reprocessar:

```text
100.000 palavras
```

---

# 81. CONTEXT INVALIDATION

Se uma entidade mudar:

```text
@joao.name
```

invalidar apenas contextos dependentes.

Se uma relação mudar:

```text
@joao → friend → @maria
```

invalidar:

```text
reference candidates
knowledge context
social context
```

quando necessário.

---

# 82. REMOÇÃO DE PLUGIN

Desativar:

```text
causality
```

não pode destruir:

```text
manuscript
world
timeline
intent
```

A aplicação simplesmente perde aquela capacidade.

UI deve indicar:

```text
Causalidade indisponível.
```

O restante continua funcionando.

---

# 83. SUBSTITUIÇÃO DE IA

Remover:

```text
model A
```

e instalar:

```text
model B
```

não altera:

```text
Narrative IR
ReferenceResolver
Intent
World
Mutation
UI
```

Esse é um dos objetivos principais do Adapter/Capability layer.

---

# 84. SUBSTITUIÇÃO DO WORLD BACKEND

Também deve ser possível substituir:

```text
WorldModel
```

por:

```text
ECS Runtime
```

sem alterar o editor ou o NLP.

---

# 85. EXTENSÕES DE TERCEIROS

Um plugin externo só recebe:

```text
capabilities autorizadas
slots autorizados
events autorizados
storage isolado
```

Nunca:

```text
World interno
PluginRegistry interno
Kernel interno
```

O modelo atual de `ext-host` deve evoluir nessa direção.

---

# 86. UI REGISTRY

Views devem ser registradas por capability:

```text
view.editor
view.inspector
view.timeline
view.character
view.diagnostics
view.graph
view.commands
```

Um plugin pode fornecer uma nova view sem alterar o shell principal.

---

# 87. UI COMO PLUGIN

Exemplo:

```text
CharacterArcPlugin
```

pode fornecer:

```text
capability:
character.arc

view:
character.arc.panel
```

A UI registra o painel.

Nenhuma outra parte precisa conhecer a implementação.

---

# 88. WORLD AS SINGLE AUTHORITY

Somente um runtime deve ser responsável pelo estado efetivo.

Nenhum:

```text
CharacterPlugin
TimelinePlugin
KnowledgePlugin
UI
```

pode manter cópias conflitantes do mundo.

Eles podem manter:

```text
indexes
cache
projections
```

mas o estado autoritativo pertence ao World Runtime.

---

# 89. HISTORY AS IMMUTABLE FACTS

Histórico deve registrar fatos:

```text
event
mutation
author decision
document revision
```

Não deve armazenar exclusivamente estados finais.

Isso permite:

```text
replay
audit
impact analysis
explanation
undo
```

---

# 90. NARRATIVE GRAPH

Pode ser uma projeção derivada:

```text
entities
relations
events
causes
knowledge
scenes
characters
```

O Graph Plugin não deve virar fonte de verdade separada.

---

# 91. EXEMPLO DO GRAFO

```text
João
 │
 ├── amigo → Pedro
 │
 ├── possui → espada
 │
 └── desconfia → Maria

Evento 42
 │
 ├── causado por → descoberta
 ├── altera → relação
 └── prepara → evento 57
```

Cada nó deve permitir voltar ao manuscrito.

---

# 92. NARRATIVE CONTEXT GRAPH

Além do grafo do mundo, haverá relações entre texto e estrutura:

```text
Sentence
 ↓
NarrativeAct
 ↓
Entity
 ↓
Event
 ↓
State
 ↓
Future references
```

Isso torna possível responder:

> onde esta informação foi estabelecida?

sem vasculhar o livro inteiro.

---

# 93. AUTHORING LOOP DEFINITIVO

```text
ESCREVER
   ↓
INTERPRETAR
   ↓
CONTEXTUALIZAR
   ↓
RESOLVER
   ↓
VALIDAR
   ↓
PROPOR
   ↓
AUTORIZAR
   ↓
MUTAR
   ↓
REGISTRAR
   ↓
CONTINUAR ESCREVENDO
```

O ciclo acontece continuamente.

---

# 94. O ESCRITOR COMUM

Ele vê:

```text
Capítulo 7

João abriu a porta.

[continua escrevendo]
```

Abaixo:

```text
✓ João identificado
✓ Porta identificada
```

Nada mais.

---

# 95. O ESCRITOR INTERMEDIÁRIO

Ele pode abrir:

```text
Contexto
```

e ver:

```text
João
Estado
Relações
Conhecimento

Porta
Localização
Estado
Histórico
```

---

# 96. O ESCRITOR AVANÇADO

Pode ativar:

```text
Modo Técnico
```

e escrever diretamente:

```text
mut.set.stats @joao.coragem 7
```

ou:

```text
ent.create @guardiao
```

ou inspecionar:

```text
Narrative IR
Intent
Evidence
Mutation
World
Events
```

Sem perder o ambiente literário.

---

# 97. O SISTEMA DEVE TER DOIS “IDIOMAS”

### Idioma humano

```text
João deu a espada para Maria.
```

### Idioma técnico

```text
intent.transfer.@joao.@espada.@maria
```

Ambos chegam ao mesmo domínio:

```text
transfer
```

Isso é importante.

A linguagem natural não substitui o DSL.

Ela é outra interface para o mesmo runtime.

---

# 98. MANUAL E IA NÃO PODEM TER COMPORTAMENTOS DIFERENTES

Se:

```text
mut.set...
```

faz uma operação.

A operação equivalente gerada pela IA deve utilizar exatamente a mesma infraestrutura.

Não:

```text
IA → caminho especial
```

Mas:

```text
IA
 ↓
Intent/Mutation
 ↓
mesmo Gateway
```

---

# 99. REGRA MAIS IMPORTANTE DA IA

A IA pode criar:

```text
interpretação
```

mas nunca:

```text
efeito executável não validado
```

O pipeline obrigatório é:

```text
AI
→ IR
→ Validation
→ Policy
→ Mutation Gateway
```

---

# 100. DEFINIÇÃO FINAL DA ARQUITETURA

O LumeTest passa a ser conceitualmente:

```text
              LUMETEST
                  │
        ┌─────────┴─────────┐
        │                   │
    AUTHORING            KERNEL 0
        │                   │
        │             registry
        │             capability
        │             slot
        │             envelope
        │             matcher
        │             resolver
        │             dispatcher
        │             events
        │             lifecycle
        │
        ▼
    MANUSCRIPT
        │
        ▼
   NARRATIVE IR
        │
   ┌────┼────┬────┬────┐
   ▼    ▼    ▼    ▼    ▼
REFER  INTENT TIME KNOW CAUSAL
   │    │    │    │    │
   └────┴────┴────┴────┘
               │
               ▼
             POLICY
               │
               ▼
        MUTATION GATEWAY
               │
               ▼
        WORLD RUNTIME
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
   KNOWLEDGE TIMELINE CHARACTER
       │       │        │
       └───────┼────────┘
               ▼
          DIAGNOSTICS
               │
               ▼
               UI
```

---

# 101. RESULTADO DO PRODUTO

O resultado não deve parecer:

```text
um jogo
```

nem:

```text
um editor de código
```

nem:

```text
um banco de dados de personagens
```

nem:

```text
um chatbot para escritores
```

Ele deve parecer:

> **um ateliê digital de autoria narrativa.**

O escritor escreve.

A plataforma compreende.

A plataforma organiza.

A plataforma mantém continuidade.

A plataforma acompanha o mundo.

A plataforma mostra consequências.

A plataforma oferece estrutura.

A plataforma pode executar aquilo que o escritor autorizar.

---

# 102. REGRA DE OURO DO LUMETEST

```text
O ESCRITOR PODE ESCREVER COMO UM ESCRITOR.

O ESCRITOR AVANÇADO PODE CONTROLAR COMO UM ENGENHEIRO.

A IA PODE INTERPRETAR COMO UMA ASSISTENTE.

O RUNTIME PODE EXECUTAR COMO UMA MÁQUINA.

MAS NENHUMA CAMADA DEVE SER OBRIGADA A CONHECER A IMPLEMENTAÇÃO DAS OUTRAS.
```

---

# 103. ESTADO FINAL ESPERADO

Ao final da refatoração, o projeto deve permitir remover:

```text
um modelo de IA
um plugin
um kit
um analisador
uma view
um backend de World
um sistema opcional
```

sem obrigatoriamente modificar:

```text
Kernel
Manuscript
Narrative IR
Command Surface
World Contracts
Authoring UI
```

E deve permitir adicionar:

```text
novo modelo
novo parser
novo resolver
novo analisador
novo kit narrativo
novo painel
novo comando
novo tipo de diagnóstico
```

simplesmente registrando:

```text
manifest
capability
slot
handler
event
view
tests
```

---

# 104. ORDEM DE IMPLEMENTAÇÃO

A migração deve seguir esta ordem:

```text
FASE 0
Congelar comportamento atual + baseline de testes.

FASE 1
Kernel 0 definitivo.

FASE 2
Envelope + Slot + Capability + Dispatcher.

FASE 3
Eliminar imports cruzados diretos.

FASE 4
WorldPort + MutationGateway.

FASE 5
Manuscript + Authoring Runtime.

FASE 6
Narrative IR como contrato central.

FASE 7
Reference Resolution.

FASE 8
Context Engine.

FASE 9
NLP + pequeno modelo local como provider.

FASE 10
Intent → Policy → Mutation.

FASE 11
Timeline + Knowledge + Causality.

FASE 12
Character + Setup/Payoff + Continuity.

FASE 13
Discourse + Style.

FASE 14
Diagnostics + Impact Analysis.

FASE 15
UX final integrada.

FASE 16
Plugins externos + isolamento.

FASE 17
ECS adapter / evolução do World Runtime.

FASE 18
Deprecar compatibilidade antiga somente após todos os testes.
```

---

# 105. CRITÉRIO DE CONCLUSÃO

A arquitetura somente será considerada concluída quando:

```text
✓ prosa funciona
✓ comandos técnicos funcionam
✓ ambos usam o mesmo runtime
✓ plugins não dependem de implementações internas
✓ capabilities são versionadas
✓ slots são resolvidos
✓ envelopes são validados
✓ dispatcher é único
✓ world é uma única autoridade
✓ IA gera interpretação, não acesso direto ao world
✓ referência contextual funciona
✓ sugestão funciona
✓ auto funciona por policy
✓ dry-run funciona
✓ undo/replay funciona
✓ timeline funciona
✓ knowledge funciona
✓ diagnostics funcionam
✓ UI funciona sem expor a arquitetura
✓ modo técnico continua disponível
✓ plugins podem ser adicionados/removidos
✓ backend de IA pode ser substituído
✓ backend do world pode ser substituído
```

---

# 106. DEFINIÇÃO FINAL

O LumeTest não será simplesmente um:

**ECS para narrativas.**

Nem somente um:

**Editor Narrativo com IA.**

A arquitetura-alvo é:

> **uma plataforma modular de autoria narrativa em que linguagem natural, comandos técnicos, representação semântica, estado do mundo, conhecimento, causalidade, cronologia, personagens, diagnóstico e inteligência artificial convergem para um único runtime desacoplado, extensível e controlado pelo autor.**

A tecnologia deve desaparecer atrás da experiência.

O escritor vê a obra.

O sistema vê a estrutura.

O Kernel vê contratos.

Os plugins veem capacidades.

O Dispatcher vê envelopes.

O World Runtime vê mutações.

E todas essas camadas trabalham juntas sem se tornarem dependentes umas das outras.

A base atual já chega surpreendentemente perto desse desenho: os quatro modos `off/preview/suggest/auto`, políticas `none/literary/simulate`, thresholds por operação, `Narrative IR`, `SourceMap`, `nlp`, `intent-engine`, `dry-run` e a disciplina de `CONTEXT/MAPA/ROTEAMENTO/INVARIANTES` já existem no projeto. O principal trabalho agora é **transformar essas peças existentes em uma arquitetura única**, em vez de acrescentar funcionalidades paralelamente. 

O ponto mais importante da especificação é este: **`ent.create`, `mut.*`, `intent.*`, `narr.*`, `phr.*` e os demais comandos continuam sendo cidadãos de primeira classe**. A linguagem natural não substitui o sistema técnico; ela se torna outra interface para o mesmo runtime. Isso preserva exatamente a liberdade que você quer para o escritor avançado, ao mesmo tempo em que permite que um escritor comum simplesmente escreva prosa.

## Prompt:
27/09/2026, 20:33:58

faça a cgora um context machine completo, para passar par aotra IA saber tudo para prepara a ordme de imeplemtnação, de como refatorar, atualzia, imepemtnar, acrscenta, alterar, etc.. mesmo se tiver alguma invariante izendo que não é para aterar (em alguns casoss com matcher de regras tem siso mas se necessário precisa ser alterado) etcfaça com que a IA entenda que agora o lume é um edito narrativo linear dinamico para escritoe,s aferamenta deifnitava para escritores e não apra jgoo inteirativo

## Response:
27/09/2026, 20:37:04 · gpt-5-6-t-mini

Vou transformar a especificação anterior em um **Context Machine operacional para outra IA**, com regras de leitura do projeto, ordem de refatoração, critérios para alterar invariantes e um plano de migração até o Lume virar um editor narrativo linear para escritores.

> **Estruturando o documento**
>
> Estou preparando um bloco de especificação em português para orientar outra IA na reformulação completa do produto. Vou preservar o legado útil, distinguir regras históricas de princípios atuais e organizar arquitetura, fases, contratos e testes sem expor detalhes internos de ferramentas.
>
> **Estruturou o documento**
>
> 
>
> **Construí contexto abrangente, li trechos específicos e calculei intervalos do sistema**
>
> 
>
> Pensou por 23s

Abaixo está o **Context Machine mestre**, estruturado para ser entregue diretamente a outra IA de programação. Ele trata `lumetest_c1.md` como base do estado atual, mas deixa explícito que **as invariantes atuais são guardrails históricos, não dogmas imutáveis**. Quando uma delas impedir a arquitetura-alvo ou a transformação do Lume em editor narrativo para escritores, a IA deve propor a alteração controlada da própria invariante, migrar código e testes e registrar a nova regra.

**document: Lume - Context Machine Mestre para Refatoração, Evolução e Implementação**

# LUME - CONTEXT MACHINE MESTRE

## 0. PROPÓSITO DESTE DOCUMENTO

Este documento é um **Context Machine operacional para uma IA de desenvolvimento** responsável por refatorar, reorganizar, atualizar, corrigir, substituir, ampliar e implementar o Lume.

A IA deve tratar este documento como o **contexto mestre de execução** para qualquer alteração arquitetural ou funcional de grande porte.

A fonte concreta do estado atual do projeto é:

`lumetest_c1.md`

Esse arquivo contém a implementação existente, contratos, plugins, documentação interna, invariantes, contexto de plugins, planos e partes legadas.

O objetivo não é apenas “consertar o projeto atual”.

O objetivo é **transformar arquiteturalmente o Lume** em:

> **um editor narrativo linear, dinâmico e profissional para escritores, no qual o manuscrito é a superfície principal do produto e todo o restante existe para compreender, estruturar, acompanhar, verificar e enriquecer a obra.**

O Lume **não deve mais ser conceitualmente tratado como uma ferramenta de criação de jogos interativos que também possui um editor de texto**.

A direção correta é o oposto:

> **Lume é um editor narrativo para escritores que possui um runtime narrativo estruturado por baixo.**

O runtime pode simular estado, regras, causalidade, entidades, intenções, conhecimento, acontecimentos e consequências.

Isso é infraestrutura da autoria.

Não é a identidade do produto.

---

# 1. ORDEM DE PRIORIDADE DA IA

Quando houver conflito entre documentação, código antigo, comentário, teste, invariante ou objetivo novo, seguir esta hierarquia:

1. Objetivo explícito do usuário nesta tarefa.
2. Produto-alvo definido neste Context Machine.
3. Arquitetura-alvo definida neste Context Machine.
4. Contratos arquiteturais novos e decisões de migração.
5. Comportamentos funcionais que devem ser preservados.
6. Invariantes antigas do projeto.
7. Implementação atual.
8. Comentários antigos, documentos antigos e decisões históricas.

Portanto:

**uma invariante antiga pode ser alterada.**

Mas não deve ser simplesmente ignorada.

Quando uma invariante precisar mudar:

```text
INVARIANTE ANTIGA
        ↓
verificar por que existe
        ↓
verificar se ainda serve ao produto
        ↓
definir nova regra
        ↓
alterar contrato
        ↓
alterar implementação
        ↓
alterar testes
        ↓
alterar documentação
        ↓
validar migração
        ↓
registrar nova invariante
```

Nunca faça:

```text
"o documento mandou não alterar"
```

sem verificar:

```text
"isso ainda é necessário para a arquitetura-alvo?"
```

As invariantes antigas são **proteções contra regressão**, não barreiras contra evolução.

---

# 2. NOVA IDENTIDADE DO PRODUTO

## 2.1 Lume não é mais definido pelo paradigma de jogo

A antiga arquitetura possui conceitos como:

- jogador;
- play;
- turn;
- score;
- command prompt;
- regras interativas;
- combate;
- viagem;
- NPC;
- LIVE;
- WAIT;
- TICK;
- sessão de jogo;
- Skein;
- dry-run;
- play-skin.

Esses recursos não precisam desaparecer.

O que muda é sua **posição conceitual**.

Eles passam a ser:

```text
recursos de runtime narrativo
```

e não:

```text
centro da experiência do usuário
```

---

# 2.2 O centro do produto

O centro do Lume passa a ser:

```text
MANUSCRITO
```

O manuscrito é a fonte principal da autoria.

Ao redor dele existem:

```text
PERSONAGENS
ENTIDADES
CENAS
LOCALIDADES
TEMPO
LINHA NARRATIVA
CONTINUIDADE
CONHECIMENTO
RELACIONAMENTOS
CAUSALIDADE
EVENTOS
FOCALIZAÇÃO
VOZ
DIÁLOGO
CONTEXTOS
NOTAS
REFERÊNCIAS
REGRAS NARRATIVAS
ASSISTENTE
DIAGNÓSTICOS
HISTÓRICO
```

O runtime fica abaixo disso.

---

# 2.3 O que significa “editor linear”

Linear significa:

```text
o manuscrito é escrito e lido em sequência.
```

A unidade principal é:

```text
documento
→ capítulo
→ cena
→ bloco
→ parágrafo
→ sentença
```

O fluxo principal é:

```text
escrever
→ interpretar
→ atualizar contexto
→ atualizar entidades
→ atualizar linha temporal
→ atualizar relações
→ verificar continuidade
→ fornecer feedback
```

Não significa:

```text
jogo linear
```

Não significa:

```text
narrativa sem estrutura interna
```

Não significa:

```text
proibir ramificações conceituais
```

Significa que a **experiência de autoria é centrada no texto sequencial**.

---

# 2.4 O que significa “dinâmico”

Dinâmico significa que o sistema acompanha a escrita em tempo real ou quase tempo real:

```text
texto alterado
→ análise atualizada
→ referências resolvidas
→ estado narrativo atualizado
→ timeline atualizada
→ continuidade recalculada
→ sugestões atualizadas
→ diagnósticos atualizados
```

O dinamismo principal não é um loop de jogo.

É um:

```text
NARRATIVE AUTHORING RUNTIME
```

---

# 3. VISÃO CONCEITUAL FINAL

A arquitetura desejada deve convergir para:

```text
                 ┌──────────────────────────┐
                 │          AUTOR           │
                 │      escreve texto       │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │       MANUSCRIPT         │
                 │ documento linear         │
                 │ capítulos / cenas        │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │   CONTEXT / LANGUAGE     │
                 │ interpretação narrativa  │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │       NARRATIVE IR       │
                 └────────────┬─────────────┘
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
        ENTIDADES         CONTINUIDADE      TIMELINE
              │               │                │
              └───────────────┼────────────────┘
                              ▼
                 ┌──────────────────────────┐
                 │   NARRATIVE RUNTIME      │
                 │ rules / state / events   │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │ PROJEÇÕES / DIAGNÓSTICO  │
                 │ visualizações / revisão  │
                 └──────────────────────────┘
```

Por baixo de tudo:

```text
KERNEL 0
ENVELOPE
SLOT
CAPABILITY
REGISTRY
MATCHER
RESOLVER
DISPATCHER
EVENT BUS
PERMISSION
LIFECYCLE
DIAGNOSTICS
```

---

# 4. REGRA FUNDAMENTAL DE ARQUITETURA

O Lume deve funcionar como:

> **uma plataforma de capacidades desacopladas que colaboram por contratos.**

Nenhum módulo deve depender da implementação concreta de outro módulo.

O fluxo correto é:

```text
Plugin A
   ↓
Capability / Slot
   ↓
Envelope
   ↓
Dispatcher
   ↓
Plugin B
```

ou:

```text
Plugin A
   ↓
Event
   ↓
Event Bus
   ↓
Plugin B
```

Nunca:

```text
Plugin A
   ↓
import "../../plugin-b/lib/..."
```

Código novo nunca deve ampliar esse padrão de dependência direta.

Código antigo que ainda possui dependência direta deve ser migrado gradualmente.

---

# 5. KERNEL 0

## 5.1 Responsabilidade

Kernel 0 não conhece narrativa.

Não conhece escritor.

Não conhece regra de jogo.

Não conhece personagem.

Não conhece manuscrito.

Não conhece NLP.

Não conhece IA.

Não conhece UI.

Kernel 0 fornece apenas mecanismos:

```text
plugin lifecycle
registry
capability registry
slot registry
envelope transport
dispatcher
event bus
permission
storage isolation
diagnostics
logging
health
```

---

# 5.2 Kernel 0 NÃO PODE virar um “super serviço”

Evitar:

```text
Core.narrative()
Core.editor()
Core.ai()
Core.world()
Core.rules()
Core.nlp()
Core.manuscript()
```

Isso destruiria o isolamento.

Kernel 0 não é um god object.

---

# 5.3 Objetos fundamentais

A arquitetura deve possuir explicitamente:

```text
Kernel
Plugin
Capability
Requirement
Slot
Envelope
Registry
Matcher
Resolver
Dispatcher
Event
Permission
Context
Diagnostic
```

---

# 6. ENVELOPE

Todas as comunicações importantes entre capacidades devem poder trafegar através de um envelope comum.

Modelo conceitual:

```ts
Envelope<T> {
  id
  type
  version

  source
  target?

  capability?
  slot?

  mode?

  correlationId?
  causationId?

  timestamp

  permissions?

  context?

  payload
}
```

O envelope deve permitir:

```text
request
response
event
command
query
proposal
mutation
diagnostic
projection
analysis
```

O envelope não deve conter conhecimento específico da narrativa.

---

# 7. SLOT

Capability define:

```text
o que um plugin oferece
```

Slot define:

```text
o que um plugin precisa conectar
```

Exemplo conceitual:

```text
NarrativeAnalyzer
    provides:
        narrative.analysis@1

ManuscriptRuntime
    requires slot:
        narrative-analysis
```

O plugin consumidor não deve conhecer a implementação real.

O binding acontece pelo kernel.

---

# 8. CAPABILITY

Capabilities devem ser:

```text
pequenas
estáveis
versionadas
com responsabilidade única
substituíveis
testáveis
```

Evitar:

```text
NarrativeEngine
```

como uma gigantesca capability que contém tudo.

Preferir:

```text
WorldQuery
WorldMutation
NarrativeRules
NarrativeAnalysis
ReferenceResolver
Timeline
Continuity
Manuscript
Authoring
Intent
Vocabulary
Diagnostics
```

A divisão final deve seguir responsabilidade real.

---

# 9. REGISTRY

O registry deve catalogar pelo menos:

```text
Plugin
Capability
Slot
Handler
Event
Command
View
Analyzer
Model
Policy
Projection
```

O registry deve ser consultável sem necessidade de importar implementação.

---

# 10. MATCHER

A arquitetura deve possuir um conceito claro de Matcher.

Porém:

**“um matcher” não significa obrigatoriamente que nunca poderá existir mais de um algoritmo especializado.**

A regra arquitetural correta é:

> Não criar motores paralelos que produzam decisões conflitantes sem um contrato único de resolução.

Para regras narrativas, deve existir uma **fonte canônica de decisão de regra**.

Se o matcher atual precisar ser alterado para suportar o produto-alvo:

```text
alterar.
```

Mas então:

```text
atualizar contrato
→ atualizar testes
→ preservar comportamento não afetado
→ atualizar diagnósticos
→ atualizar Replay
→ atualizar DryRun
→ atualizar documentação
```

Não preservar uma implementação simplesmente porque uma documentação antiga diz:

```text
não mexer
```

---

# 11. MATCHER SEMÂNTICO

Uma classificação como:

```text
agency
constraint
transformation
```

não deve alterar silenciosamente o resultado da seleção de uma regra.

Porém, isso também é uma decisão revisável.

Se no futuro a arquitetura definir que:

```text
semântica
```

passará a participar da resolução:

isso deve ser tratado como:

```text
mudança de contrato do resolver
```

e não como uma alteração escondida do matcher.

---

# 12. RESOLVER

Separar responsabilidades sempre que necessário.

Resolver conceitualmente pode ser dividido em:

```text
CapabilityResolver
SlotResolver
ReferenceResolver
EntityResolver
IntentResolver
ContextResolver
RuleResolver
```

O objetivo é evitar:

```text
resolver.ts
```

como um mecanismo gigantesco.

---

# 13. DISPATCHER

O Dispatcher passa a ser o mecanismo central que decide:

```text
qual capability
qual slot
qual handler
qual permissão
qual contexto
qual modo
```

Fluxo:

```text
Envelope
   ↓
validate
   ↓
permission check
   ↓
resolve
   ↓
match
   ↓
dispatch
   ↓
handler
   ↓
result
   ↓
event / response / diagnostic
```

O Dispatcher não deve conter lógica narrativa.

---

# 14. REGRA DE ISOLAMENTO

Código novo:

```text
NÃO importar implementação de outro plugin.
```

Pode importar:

```text
contracts
shared kernel types
domain-neutral types
```

Mas não:

```text
../../other-plugin/lib/foo
```

Quando uma dependência for necessária:

```text
criar capability
ou
criar slot
ou
usar event
```

Código antigo pode continuar temporariamente.

Mas deve entrar numa lista de:

```text
LEGACY DIRECT DEPENDENCIES
```

e ser migrado progressivamente.

---

# 15. WORLD AUTHORITY

O mundo narrativo precisa possuir uma autoridade canônica.

Conceitualmente:

```text
WorldState
```

ou

```text
NarrativeWorld
```

O mundo é responsável por:

```text
entities
tags
stats
links
state
relationships
properties
```

Mas outros sistemas não devem manipular o mundo diretamente.

A escrita deve passar por:

```text
WorldQuery
WorldMutation
MutationGateway
```

---

# 16. MUTATION GATEWAY

Toda mutação significativa deve passar por uma porta única.

Fluxo:

```text
AI
NLP
Command
Rule
Narrative IR
User Action
    ↓
Mutation Proposal
    ↓
Validation
    ↓
Policy
    ↓
MutationGateway
    ↓
World
```

Isso permite:

```text
preview
suggest
approve
apply
undo
replay
audit
```

---

# 17. IA NUNCA ALTERA O MUNDO DIRETAMENTE

A IA pode:

```text
interpretar
sugerir
classificar
resumir
extrair
detectar
propor
inferir
```

Mas não deve possuir:

```text
AI → world.mutate()
```

O caminho é:

```text
AI
→ Narrative IR
→ validation
→ policy
→ mutation proposal
→ MutationGateway
→ world
```

---

# 18. NARRATIVE IR É O CENTRO SEMÂNTICO

O `narrativeIR` existente deve evoluir para ser o principal contrato entre:

```text
texto
```

e:

```text
runtime narrativo
```

A implementação atual já define operações:

```text
represent
describe
enunciate
expose
evaluate
interiorize
structure
focalize
```

e dimensões para:

```text
voice
focalization
discourse
semantic roles
epistemic kinds
story time
discourse time
simulation time
aspect
modality
negation
```

Preservar essa direção. 

---

# 19. NARRATIVE IR NÃO É ECS

Nunca transformar o IR em:

```text
um saco de componentes
```

O IR descreve:

```text
o que a escrita está fazendo
```

Exemplo:

```text
"Maria entrou na sala."

pode produzir:

represent
  actor = Maria
  action = enter
  destination = sala
  aspect = punctual
  tense = past
```

Isso não significa que o IR deva virar diretamente:

```text
EntityComponentSystem
```

O IR deve permanecer semântico e narrativo.

---

# 20. SOURCE MAP

Toda interpretação textual relevante deve ser rastreável.

Manter a relação:

```text
texto
↔ span
↔ narrative act
↔ entity
↔ event
↔ diagnostic
↔ mutation
```

Isso permite:

```text
clicar no problema
→ localizar sentença
→ localizar entidade
→ localizar evento
→ localizar regra
```

A capacidade de rastreamento é central para um editor profissional.

---

# 21. MANUSCRIPT É O PRIMEIRO CIDADÃO

O plugin ou subsistema `manuscript` deve se tornar uma entidade arquitetural central.

Ele deve representar:

```text
Project
  → Manuscript
      → Document
          → Chapter
              → Scene
                  → Block
                      → Paragraph
                          → Sentence
```

Não significa que toda essa árvore precisa existir imediatamente.

Significa que essa é a direção.

---

# 22. NOTEBOOK DEVE EVOLUIR PARA MANUSCRIPT

O notebook existente foi concebido como caderno em linguagem humana e compilador para fontes Lume.

Essa direção continua válida.

O notebook não deve continuar sendo percebido apenas como uma ferramenta secundária.

Ele deve convergir para:

```text
Authoring / Manuscript subsystem
```

A escrita humana continua podendo produzir:

```text
entitiesSource
rulesSource
taxonomy
intent
semantic structure
```

mas o autor não precisa ver isso.

---

# 23. REGRA FUNDAMENTAL DO MANUSCRITO

Nunca forçar:

```text
texto humano
↓
DSL técnica
↓
autor precisa editar DSL
```

O fluxo desejado é:

```text
texto humano
↓
interpretação
↓
modelo narrativo
```

A DSL técnica continua existindo, mas como interface avançada.

---

# 24. DOIS MODOS DE AUTORIA

O Lume deve possuir pelo menos:

## Modo Autor

O escritor trabalha com:

```text
texto
capítulos
cenas
personagens
timeline
continuidade
notas
assistente
```

O sistema traduz internamente a escrita.

## Modo Técnico

Usuário avançado pode editar diretamente:

```text
ON:
IF:
DO:
intent.*
@entity.stat
@entity.link
EMIT
KNOW
WAIT
TICK
THEN
LIVE
```

Esses comandos **não devem ser removidos**.

A existência desses comandos continua sendo parte importante do poder do sistema.

A diferença é:

```text
Autor comum:
    quase nunca precisa vê-los.

Autor avançado:
    pode usá-los conscientemente.
```

---

# 25. OS DOIS MODOS NÃO PODEM GERAR DOIS MOTORES

Não criar:

```text
motor do escritor
```

e:

```text
motor técnico
```

Devem ser duas interfaces do mesmo runtime.

```text
Texto humano
      ↓
Narrative IR
      ↓
runtime

DSL técnica
      ↓
parser técnico
      ↓
IR / intent / runtime
```

---

# 26. NLP

O NLP atual possui a filosofia:

```text
frase humana
→ intent.*
```

Essa ideia continua válida para comandos técnicos ou interativos.

O problema é apenas de escopo.

No novo Lume:

```text
NLP rápido
```

serve para:

```text
comandos
intenção operacional
atalhos
linguagem técnica naturalizada
```

Enquanto:

```text
Narrative Language Pipeline
```

serve para:

```text
prosa
narrador
personagem
descrição
interioridade
discurso
tempo
focalização
referência
continuidade
```

Não misturar as duas funções.

---

# 27. PIPELINE NARRATIVO DESEJADO

```text
Texto do Autor
      ↓
Lexer
      ↓
Parser
      ↓
Análise Linguística
      ↓
Análise Narrativa
      ↓
Reference Resolution
      ↓
Narrative IR
      ↓
Context Assembly
      ↓
Continuity
      ↓
Timeline
      ↓
Entity / World projection
      ↓
Rules / Events / Knowledge
      ↓
Diagnostics
      ↓
Authoring UI
```

---

# 28. ANÁLISE LINGUÍSTICA

A máquina deve progressivamente reconhecer:

```text
sujeito
verbo
objeto
tempo
aspecto
negação
modalidade
referência
voz
focalização
estrutura discursiva
papéis semânticos
```

Não é necessário implementar tudo em uma única fase.

Mas a arquitetura deve ser capaz de suportar essas dimensões.

---

# 29. REFERENCE RESOLUTION

Esse subsistema é fundamental para um editor literário.

Exemplo:

```text
João entrou na sala.
Ele fechou a porta.
Depois colocou o livro sobre a mesa.
```

A IA deve poder produzir relações como:

```text
Ele → João
a porta → objeto previamente introduzido
a mesa → entidade contextual
```

Com estados:

```text
resolved
ambiguous
unresolved
```

Os diagnósticos já existentes para referências ambíguas e não resolvidas devem ser preservados/evoluídos. 

---

# 30. CONTEXT ASSEMBLY

O sistema precisa construir contexto para cada trecho do manuscrito.

Contexto pode reunir:

```text
personagens ativos
local atual
cena atual
entidades mencionadas
tempo narrativo
tempo da história
relações
conhecimento
eventos recentes
eventos anteriores
focalização
voz
objetivos
estado físico
estado emocional quando explicitamente modelado
objetos presentes
regras relevantes
continuidade
```

Esse contexto deve ser determinístico sempre que possível.

---

# 31. CONTEXTO NÃO É SINÔNIMO DE “MANDAR O DOCUMENTO INTEIRO PARA A IA”

Construir contexto significa:

```text
selecionar contexto relevante
```

e não:

```text
enviar o manuscrito inteiro sempre
```

Criar:

```text
Context Index
Context Resolver
Context Window
Context Assembly
```

---

# 32. AI RUNTIME

A IA deve existir como uma capability substituível:

```text
AIProvider
```

ou equivalente.

O resto do Lume não deve depender de:

```text
OpenAI
Claude
Gemini
DeepSeek
modelo local
```

diretamente.

Arquitetura:

```text
Authoring
    ↓
AI Runtime
    ↓
Provider Adapter
    ↓
Modelo
```

Trocar modelo não deve exigir reescrever o editor.

---

# 33. IA LOCAL E IA REMOTA

A arquitetura deve suportar:

```text
local model
remote model
mock provider
rule-based provider
small model
large model
```

sempre atrás do mesmo contrato.

---

# 34. MODOS DO SUBSISTEMA NARRATIVO

A implementação atual define:

```text
off
preview
suggest
auto
```

e isso é uma base muito boa para a nova arquitetura. 

O comportamento desejado:

### off

Nada é inferido automaticamente.

### preview

Mostra:

```text
interpretação
IR
entidades detectadas
referências
consequências
```

sem aplicar.

### suggest

O sistema propõe:

```text
criar personagem
atualizar atributo
registrar acontecimento
corrigir referência
adicionar nota
marcar inconsistência
```

O autor decide.

### auto

Mudanças de alta confiança podem ser aplicadas conforme política configurável.

---

# 35. PROJEÇÃO

A configuração existente já possui:

```text
none
literary
simulate
```

Essa ideia deve evoluir.

Sugestão de semântica:

```text
none
    → somente análise

literary
    → atualiza representação narrativa segura

simulate
    → projeta consequências no runtime
```

Não assumir que essas políticas precisam permanecer com os mesmos nomes para sempre.

Mas preservar o conceito:

> **analisar não é o mesmo que aplicar.**

---

# 36. O PRODUTO NÃO DEVE OBRIGAR O ESCRITOR A PENSAR EM “SIMULAÇÃO”

O usuário pode simplesmente escrever:

```text
João abriu a porta.
```

O sistema pode internamente atualizar:

```text
João
porta
estado da porta
evento de abertura
linha temporal
causalidade
```

O autor não precisa conhecer:

```text
ChangeAST
RuleEffects
MutationGateway
```

---

# 37. RUNTIME NARRATIVO

O antigo `narrative-engine` possui atualmente responsabilidades muito amplas: mundo, taxonomia, query, compilação, `ON/IF/DO`, `interact` e rewind, além das capabilities correspondentes. 

Ele deve ser **desmembrado progressivamente**.

Destino conceitual:

```text
world-runtime
world-query
world-mutation
taxonomy
rule-runtime
rule-effects
event-runtime
replay
timeline-runtime
causality
```

Não fazer big bang.

Usar migração incremental.

---

# 38. ESTRATÉGIA DE MIGRAÇÃO DO NARRATIVE-ENGINE

Primeiro:

```text
preservar API
```

Depois:

```text
mover implementação interna
```

Depois:

```text
introduzir capabilities novas
```

Depois:

```text
migrar consumidores
```

Depois:

```text
deprecate old facade
```

Finalmente:

```text
remover facade quando seguro
```

Não quebrar tudo de uma vez.

---

# 39. REPLAY

O replay existente é importante.

Hoje a lógica conceitual é:

```text
initialWorld
+
triggerIds
→ replay
```

Isso deve evoluir para o editor narrativo.

Replay deixa de significar apenas:

```text
"reexecutar um jogo"
```

e passa a permitir:

```text
ver como o estado narrativo chegou até aqui
```

Exemplo:

```text
Por que João está ferido?
```

Resposta estrutural:

```text
evento A
→ evento B
→ consequência C
→ estado atual
```

---

# 40. TIMELINE

Criar um subsistema explícito de timeline narrativa.

Deve distinguir pelo menos:

```text
story time
discourse time
simulation time
```

Essa separação já existe conceitualmente no Narrative IR e deve ser preservada. 

---

# 41. CAUSALIDADE

Criar um modelo de:

```text
Event
Cause
Effect
Dependency
Precondition
Consequence
```

Exemplo:

```text
João perdeu a espada
```

pode ter:

```text
causa:
  goblin roubou a espada

consequência:
  João não possui mais a espada
```

Isso é extremamente importante para revisão narrativa.

---

# 42. CONTINUIDADE

Criar um subsistema capaz de detectar:

```text
personagem em dois lugares ao mesmo tempo
objeto inexistente
personagem morto aparecendo depois
idade incompatível
evento fora da ordem
contradição de estado
nome inconsistente
relação impossível
tempo impossível
```

A continuidade não deve reescrever o texto automaticamente sem consentimento.

Ela deve primeiro produzir:

```text
diagnóstico
```

---

# 43. DIAGNÓSTICOS

Os diagnósticos já possuem fases:

```text
lexical
syntactic
semantic
referential
narrative
epistemic
continuity
execution
validation
```

Essa taxonomia deve ser mantida ou evoluída, pois é adequada a um editor narrativo. 

---

# 44. DIAGNÓSTICO NÃO É ERRO DE COMPILAÇÃO APENAS

No Lume novo, diagnóstico pode significar:

```text
erro
aviso
inconsistência
ambiguidade
sugestão
observação
oportunidade de revisão
```

Exemplo:

```text
"Ela entrou novamente na casa."
```

Sistema:

```text
warning:
referência "Ela" ambígua.
Candidatas: Maria, Ana.
```

---

# 45. CONTEXTO DA CENA

Cada cena deve poder possuir contexto próprio:

```text
setting
characters
location
time
focalization
voice
goals
knowledge
active entities
recent events
```

A cena deve ser uma unidade de análise útil.

---

# 46. PERSONAGENS

Criar um subsistema de Character.

Ele deve permitir:

```text
identity
aliases
attributes
relationships
knowledge
memory
goals
states
appearance
voice
history
arc
```

Não criar um “Character Engine gigantesco”.

Usar capabilities.

---

# 47. ARC

Uma ferramenta para escritor precisa acompanhar:

```text
estado inicial
eventos importantes
mudanças
conflitos
decisões
consequências
estado final
```

Isso pode alimentar:

```text
character arc
plot review
continuity
assistant
```

---

# 48. KNOWLEDGE

A distinção atual entre:

```text
information
```

e:

```text
knowledge
```

deve permanecer conceitualmente correta.

Uma informação existir no mundo não significa que um personagem saiba dela.

Isso é importante para:

```text
mistério
suspense
dramatic irony
focalization
```

---

# 49. FOCALIZAÇÃO

A focalização deixa de ser apenas um campo técnico.

Ela passa a ser uma propriedade importante do manuscrito.

Exemplo:

```text
POV:
Maria
```

O sistema pode verificar:

```text
Maria conhece esta informação?
```

Se não:

```text
warning epistemológico
```

---

# 50. VOZ

A distinção:

```text
narrator
character
group
document
external
unknown
```

deve permanecer disponível para análise narrativa. 

---

# 51. DISCURSO

O sistema deve reconhecer gradualmente:

```text
narration
description
direct speech
indirect speech
thought
free indirect discourse
exposition
commentary
```

Isso permite ferramentas literárias reais.

---

# 52. MANUSCRIPT UI

A UX deve ser redesenhada em torno de algo como:

```text
┌─────────────────────────────────────────────┐
│ Lume                         Assistente     │
├─────────────┬─────────────────┬─────────────┤
│ Estrutura   │                 │ Contexto    │
│             │   MANUSCRITO    │ Personagem  │
│ Capítulos   │                 │ Cena        │
│ Cenas       │   texto         │ Timeline    │
│ Notas       │   texto         │ Relações    │
│ Personagens │   texto         │ Diagnóstico │
│             │                 │             │
├─────────────┴─────────────────┴─────────────┤
│ Revisão / Continuidade / Histórico          │
└─────────────────────────────────────────────┘
```

A arquitetura interna continua complexa.

A interface não.

---

# 53. PRINCÍPIO DE UX

O escritor deve pensar:

```text
"estou escrevendo"
```

e não:

```text
"estou programando um agente".
```

A aplicação deve esconder:

```text
ECS
plugin registry
capabilities
dispatcher
envelopes
matcher
resolver
dependency graph
```

exceto no modo técnico.

---

# 54. COMMAND SURFACE

O CommandBar atual não deve desaparecer.

Ele deve evoluir para:

```text
Command Surface
```

Com dois contextos:

```text
autor
técnico
```

No modo autor:

```text
Criar personagem
Mostrar linha do tempo
Ver problemas desta cena
Explicar esta inconsistência
Revisar diálogo
```

No modo técnico:

```text
intent.look
intent.talk.@joao
@joao.hp-10
DO: EMIT porta_aberta
```

---

# 55. DSL TÉCNICA

Preservar a linguagem Lume existente quando possível.

Exemplos atualmente documentados:

```text
ON: @porta
IF: @jogador.intent=open
DO: @porta.aberta

CREATE @fumaca.event.current_location=$

DESTROY @trava

EMIT porta_aberta

KNOW @jogador.@porta

INTENT @goblin.attack.@jogador

WAIT 3.@fuse_porta

TICK

THEN @corredor

LIVE

LIVE @goblin
```

Também continuam válidos conceitos como:

```text
@jogador.hp-10
$.hp-@jogador.force
intent.a; intent.b
```

O projeto documenta deliberadamente essa linguagem e sua distinção em relação a abordagens de Elm/Allegory. 

---

# 56. NÃO REMOVER OS COMANDOS TÉCNICOS

Mesmo que o foco passe para escritores:

```text
intent.*
ON
IF
DO
EMIT
KNOW
WAIT
TICK
THEN
LIVE
```

continuam fazendo sentido.

Eles serão:

```text
advanced authoring API
```

e:

```text
debug / precise control API
```

---

# 57. REGRAS DE DOMÍNIO

Não transformar o sistema em uma floresta de engines:

```text
FearEngine
AttackEngine
ConversationEngine
ConstraintEngine
EmotionEngine
LifecycleEngine
CombatEngine
```

Preferir:

```text
primitives
+
capabilities
+
rules
+
data
+
narrative semantics
```

Mas isso também não significa proibir novos subsistemas reais.

Um novo subsistema é válido quando possui:

```text
responsabilidade própria
contrato claro
necessidade real
fronteira independente
```

---

# 58. KITS

Os kits existentes:

```text
adventure
social
channel
combat
prose
```

não devem desaparecer automaticamente.

Devem ser classificados como:

```text
domain packs
```

ou:

```text
optional narrative capabilities
```

O autor não precisa ativar “combate” para escrever um romance.

Se uma obra usa violência, isso pode simplesmente existir como narrativa.

O `kit-combat` deve ser necessário apenas quando o autor quer **modelar mecanicamente** isso.

---

# 59. REPOSICIONAMENTO DOS KITS

Exemplo:

```text
CombatKit
```

não significa:

```text
Lume é jogo de combate.
```

Significa:

```text
há uma capability opcional para modelar sistemas de combate.
```

O mesmo vale para:

```text
SocialKit
ChannelKit
AdventureKit
Process
Life
```

---

# 60. PLAY-SKIN

A play-skin não precisa ser removida.

Deve ser tratada como:

```text
Narrative Simulation View
```

ou:

```text
Interactive Preview
```

Ela é útil para:

```text
testar regras
simular cenas
ver consequências
experimentar diálogos
```

Mas não deve ser a Home principal.

---

# 61. DRY-RUN

Dry-run é extremamente valioso para escritores.

Transformar:

```text
"posso abrir esta porta?"
```

em uma ferramenta de:

```text
"o que aconteceria se..."
```

Isso pode ser usado para:

```text
previsão narrativa
análise de consequência
teste de continuidade
teste de regra
```

A implementação atual garante que DryRun não muta o mundo vivo e não executa determinadas cadeias de efeitos. Isso deve ser preservado enquanto essa semântica continuar desejável. 

---

# 62. MUDANÇA IMPORTANTE SOBRE AS INVARIANTES

Quando uma regra antiga disser:

```text
NÃO ALTERAR X
```

a IA deve perguntar internamente:

```text
X é:
A) princípio arquitetural ainda necessário?
B) proteção temporária de uma implementação antiga?
C) workaround?
D) dependência de uma fase anterior?
E) decisão que o novo produto tornou obsoleta?
```

Somente A deve ser tratada como forte.

B, C, D e E podem ser refatoradas.

---

# 63. PROCESSO PARA ALTERAR UMA INVARIANTE

Criar uma pequena decisão arquitetural:

```text
ADR
```

com:

```text
INVARIANTE ANTIGA
MOTIVO ORIGINAL
PROBLEMA ATUAL
NOVA NECESSIDADE
NOVA REGRA
IMPACTOS
PLANO DE MIGRAÇÃO
TESTES
```

Não esconder alterações de contratos.

---

# 64. EXEMPLO: MATCHER

Antiga:

```text
Não alterar findMatchingRule.
```

Nova decisão possível:

```text
findMatchingRule continua como autoridade semântica,
mas sua implementação interna será substituída por
RuleResolver + RuleMatcher + indexed candidate selection.
```

Nesse caso:

```text
API pode ser preservada
implementação pode mudar
```

---

# 65. REGRA DE COMPATIBILIDADE

Toda grande mudança deve responder:

```text
O comportamento antigo precisa continuar?
```

Classificar:

```text
PRESERVE
MIGRATE
DEPRECATE
REPLACE
REMOVE
```

Nunca fazer:

```text
alterar tudo sem classificação
```

---

# 66. MAPA DOS PLUGINS ATUAIS

A arquitetura atual possui um conjunto amplo de plugins, incluindo:

```text
narrative-engine
project-cloud
ide-state
intent-engine
rule-semantics
world-events
knowledge
agency
spatial
senses
kit-adventure
kit-social
kit-channel
kit-combat
kit-prose
sift
dry-run
process
chain
life
vocab
nlp
notebook
ide-ui
ide-guide
ide-settings
entity-extras
multiplayer
ext-host
```

O bootstrap atual registra/ativa esse ecossistema diretamente. 

Isso é uma fotografia do estado atual.

Não deve ser tratado automaticamente como arquitetura final.

---

# 67. BOOTSTRAP ALVO

O bootstrap deve evoluir de:

```text
lista manual gigantesca
```

para algo próximo de:

```text
Kernel
→ registries
→ manifest discovery
→ validation
→ dependency graph
→ capability graph
→ slot binding
→ permission graph
→ core infrastructure
→ authoring infrastructure
→ language
→ narrative runtime
→ optional packs
→ UI
```

---

# 68. BOOT NÃO DEVE CONHECER DETALHES DE DOMÍNIO

Evitar:

```ts
activateNarrativeEngine()
activateSocialKit()
activateCombatKit()
...
```

como única forma de descoberta.

Preferir:

```text
plugin descriptors
+
resolver
+
dependency graph
```

Mesmo que durante a migração o bootstrap antigo continue temporariamente.

---

# 69. CURRENT CORE

O Core atual já funciona como uma fachada de microkernel e coordena:

```text
EventBus
PluginRegistry
CapabilityRegistry
ErrorBoundary
```

e expõe operações para registrar, ativar, consultar plugins e capabilities. 

Essa é uma fundação aproveitável.

Não jogar fora sem necessidade.

---

# 70. CURRENT CAPABILITY REGISTRY

O `CapabilityRegistry` atual registra:

```text
name
version
provider
api
```

e disponibiliza a API diretamente.

Esse ponto deve evoluir para uma abstração mais forte de:

```text
capability
contract
proxy
permissions
version
binding
slot
```

Não expor automaticamente a implementação concreta quando isso comprometer isolamento.

---

# 71. CURRENT PLUGIN CONTRACT

O contrato existente já possui:

```text
IPluginManifest
IPlugin
PluginFactory
PluginContext
permissions
capabilities
requires
hooks
```

Essa infraestrutura deve ser reaproveitada. 

---

# 72. PLUGIN MANIFEST ALVO

Evoluir gradualmente para algo como:

```ts
PluginManifest {

  identity

  version

  provides[]

  requires[]

  slots[]

  events {
    emits[]
    consumes[]
  }

  commands[]

  views[]

  policies[]

  permissions

  lifecycle

  compatibility

}
```

---

# 73. CONTEXT.md DOS PLUGINS

Todo plugin deve manter:

```text
CONTEXT.md
```

contendo:

```text
owner
purpose
public capabilities
dependencies
events
files importantes
não fazer
fora de escopo
```

A IA deve ler:

```text
EFICIENCIA
MAPA
ROTEAMENTO
plugin CONTEXT
manifest
types
implementation
```

nessa ordem quando estiver investigando o projeto. O próprio projeto estabelece essa estratégia de busca para reduzir exploração desnecessária. 

---

# 74. CONTEXT MACHINE DE CADA PLUGIN

Cada plugin novo deve responder:

```text
O que ele possui?
O que ele fornece?
O que ele precisa?
Quem pode falar com ele?
O que ele nunca deve fazer?
Onde está sua implementação?
Quais eventos produz?
Quais eventos consome?
Qual estado é dele?
Qual estado não é dele?
```

---

# 75. MIGRAÇÃO DO IDE-STATE

O `ide-state` atual concentra muito orchestration e possui imports diretos para várias partes do sistema.

Isso deve ser progressivamente dividido em:

```text
workspace-state
authoring-state
manuscript-state
session-state
editor-state
selection-state
```

e seus accessos devem usar capabilities.

Não tentar reescrever tudo em uma etapa.

---

# 76. MIGRAÇÃO DO IDE-UI

O `ide-ui` deve permanecer como dono da UI.

Mas sua responsabilidade muda de:

```text
UI de IDE de ferramenta técnica
```

para:

```text
UI do estúdio de autoria narrativa
```

---

# 77. COMPONENTES PRINCIPAIS DO NOVO UI

Prioridade:

```text
ManuscriptEditor
ChapterTree
SceneTree
CharacterPanel
TimelinePanel
ContinuityPanel
ContextPanel
AssistantPanel
DiagnosticPanel
EntityInspector
TechnicalMode
HistoryPanel
```

---

# 78. UI TÉCNICA CONTINUA EXISTINDO

Componentes como:

```text
CommandBar
PreviewPane
BeatDebug
WorldIndex
WorldMap
Skein
```

não precisam ser destruídos.

Eles devem ser reposicionados como:

```text
Advanced
Developer
Simulation
Analysis
Technical
```

---

# 79. HOME DO LUME

A tela inicial deve comunicar:

```text
comece a escrever
```

não:

```text
comece a configurar um jogo.
```

Exemplo conceitual:

```text
Novo Manuscrito
Abrir Manuscrito
Continuar escrita
Personagens
Projetos recentes
```

---

# 80. O QUE O ESCRITOR DEVE CONSEGUIR SEM DSL

Sem escrever:

```text
ON
IF
DO
intent
```

o autor deve conseguir:

```text
criar personagem
descrever personagem
definir relação
escrever diálogo
mencionar local
registrar acontecimento
criar cena
adicionar flashback
mudar focalização
estabelecer fato
estabelecer crença
criar evento
registrar consequência
```

---

# 81. EXEMPLO DO FLUXO ALVO

Autor escreve:

```text
João entrou na cozinha.
Maria já estava lá, esperando por ele.
- Precisamos conversar - disse ela.
```

Lume pode inferir:

```text
Entity:
João

Entity:
Maria

Place:
cozinha

Event:
João entra na cozinha

Relation:
João ↔ Maria

Dialogue:
Maria → João

Scene state:
João present
Maria present

Discourse:
direct speech

Continuity:
valid

Knowledge:
uncertain

Timeline:
ordered
```

Tudo isso sem exigir comandos técnicos.

---

# 82. SUGESTÕES

No modo `suggest`, o sistema pode sugerir:

```text
"João" parece ser uma nova personagem.
Criar personagem?
```

ou:

```text
"ela" pode se referir a Maria.
Confirmar?
```

ou:

```text
A cena anterior diz que Maria estava no hospital.
Quer registrar uma transição?
```

---

# 83. AUTO

No modo `auto`, apenas mudanças com política de confiança adequada podem ocorrer.

Os thresholds atuais são apenas valores iniciais; a documentação diz explicitamente que podem precisar ser recalibrados usando dados reais. 

Portanto:

```text
threshold != dogma
```

Eles são política configurável.

---

# 84. EDIÇÃO NÃO PODE SER DESTRUTIVA

A IA nunca deve silenciosamente alterar um manuscrito do autor.

Mudanças automáticas devem ser:

```text
rastreáveis
reversíveis
auditáveis
visualizáveis
desfazíveis
```

---

# 85. HISTÓRICO

Criar histórico de:

```text
text change
semantic change
entity change
world change
rule change
AI proposal
user approval
```

Não apenas:

```text
Ctrl+Z textual.
```

---

# 86. DIFF NARRATIVO

O editor deve futuramente conseguir mostrar:

```text
Texto alterado

+
Entidade adicionada

+
Estado alterado

+
Evento criado
```

ou:

```text
esta frase causou estas alterações.
```

---

# 87. IMPACT ANALYSIS

Criar:

```text
ImpactAnalysis
```

capaz de responder:

```text
Se eu mudar esta entidade, o que será afetado?
```

Exemplo:

```text
remover personagem X

→ 14 referências
→ 3 cenas
→ 2 relações
→ 1 evento
→ 4 regras
```

Esse tipo de ferramenta é muito mais importante para escritores do que conceitos tradicionais de engine.

---

# 88. CONTINUIDADE INTERESSA MAIS QUE SCORE

Na experiência padrão do escritor:

```text
score
turn
HP
combat
```

devem ser secundários.

No lugar deles:

```text
continuity
timeline
character state
plot state
scene state
```

---

# 89. O QUE FAZER COM SCORE / TURN

Não necessariamente remover.

Pode continuar em:

```text
simulation view
```

ou:

```text
technical view
```

---

# 90. O QUE FAZER COM MULTIPLAYER

O `multiplayer` não deve ser removido automaticamente.

Mas deve deixar de ser assumido como prioridade central.

Pode evoluir para:

```text
collaborative authoring
```

em vez de:

```text
multiplayer game
```

---

# 91. EXT-HOST

O plugin externo atual deve continuar sendo tratado como área isolada.

O mecanismo existente de execução com `new Function` não deve ser confundido com uma sandbox de segurança forte.

Portanto:

```text
ext-host
```

deve ser tratado como:

```text
extensibility boundary
```

e não como:

```text
security boundary perfeita
```

A arquitetura de plugins externos deve ser endurecida apenas quando isso virar requisito explícito.

---

# 92. REGRAS DE SEGURANÇA ARQUITETURAL

Código externo nunca deve ganhar automaticamente:

```text
world mutation
storage unrestricted
network unrestricted
AI unrestricted
```

Capacidades devem ser concedidas explicitamente.

---

# 93. AUTORIA COMO SISTEMA DE CAPACIDADES

O escritor deve poder ter:

```text
Narrative Authoring
Language Analysis
Character Analysis
Timeline
Continuity
Knowledge
Causality
Assistant
Technical Commands
Simulation
```

como capabilities internas.

---

# 94. ARQUITETURA ALVO DE PLUGINS

Uma decomposição desejada, não obrigatoriamente final, é:

```text
kernel-0

platform:
  registry
  event
  dispatch
  diagnostics
  permissions

authoring:
  manuscript
  authoring-runtime
  workspace
  command-surface

language:
  vocab
  prose-nlu
  narrative-parser
  narrative-analysis
  narrative-ir
  source-map
  reference-resolution

narrative:
  world-runtime
  world-query
  world-mutation
  rules
  rule-effects
  taxonomy
  knowledge
  events
  timeline
  causality
  continuity
  character
  discourse
  style
  setup-payoff

ai:
  ai-runtime
  context-assembly
  suggestion-policy

tools:
  dry-run
  replay
  impact-analysis
  diagnostics
  sift

ui:
  ide-ui
```

Isso é uma direção arquitetural.

Não é obrigatório implementar todas essas pastas exatamente assim antes de avaliar o código real.

---

# 95. REGRA DE GRANULARIDADE

Não criar plugins simplesmente porque uma palavra parece importante.

Criar um plugin quando:

```text
há fronteira de responsabilidade
```

Não:

```text
emotion-plugin
chair-plugin
door-plugin
dialogue-plugin
```

simplesmente por nomenclatura.

---

# 96. ENTITY

Entidade deve continuar sendo uma abstração simples.

A arquitetura documentada já trabalha com:

```text
tags
stats
links
extra
```

e IDs canônicos.

Não converter automaticamente entidade em ECS apenas porque isso parece arquiteturalmente sofisticado.

---

# 97. RECONHECER O LEGADO

A base atual contém:

```text
arquitetura microkernel
plugins
capabilities
event bus
narrative engine
intent engine
NLP
notebook
narrative IR
dry-run
replay
world model
kits
UI
```

O problema principal não é ausência total de arquitetura.

É:

```text
responsabilidades sobrepostas
acoplamentos históricos
fronteiras imprecisas
experiência de produto orientada pelo legado
```

A IA deve **evoluir a fundação existente**, não descartá-la por estética.

---

# 98. ESTRATÉGIA DE REFACTOR

Usar:

```text
Strangler Migration
```

Sempre que possível.

Padrão:

```text
LEGACY
  ↓
ADAPTER
  ↓
NEW CONTRACT
  ↓
NEW IMPLEMENTATION
```

Depois:

```text
LEGACY
  ↓
deprecate
  ↓
remove
```

---

# 99. NÃO FAZER BIG-BANG

Nunca realizar simultaneamente:

```text
novo kernel
+
novo editor
+
novo parser
+
novo runtime
+
novo AI
+
novo world
```

sem ponte.

Isso é alto risco.

Fazer por camadas.

---

# 100. ORDEM MACRO DE IMPLEMENTAÇÃO

A ordem recomendada é:

```text
FASE 0
baseline e testes

FASE 1
Kernel 0

FASE 2
Envelope / Slot / Capability / Registry

FASE 3
Resolver / Matcher / Dispatcher

FASE 4
isolamento dos plugins

FASE 5
World Query / Mutation Gateway

FASE 6
Narrative IR

FASE 7
Manuscript / Authoring Runtime

FASE 8
Reference Resolution / Context Assembly

FASE 9
Timeline / Causality / Continuity

FASE 10
AI Runtime

FASE 11
Authoring UI

FASE 12
Technical Mode

FASE 13
Simulation / Dry-run / Replay

FASE 14
migração dos kits

FASE 15
desligamento gradual do legado
```

---

# 101. FASE 0 - BASELINE

Antes de qualquer grande refatoração:

```text
rodar testes
catalogar falhas
catalogar capacidades
catalogar plugins
catalogar dependências
catalogar eventos
catalogar imports diretos
catalogar APIs públicas
catalogar invariantes
```

Criar:

```text
ARCHITECTURE_BASELINE.md
```

---

# 102. BASELINE NÃO DEVE SER “LIMPAR O CÓDIGO”

Objetivo:

```text
saber onde estamos.
```

Não:

```text
refatorar tudo já.
```

---

# 103. FASE 1 - KERNEL 0

Implementar:

```text
Envelope
Slot
Dispatcher
permission model
capability binding
```

sem mexer no domínio narrativo ainda.

---

# 104. FASE 2 - REGISTRY

Tornar explícitos:

```text
PluginRegistry
CapabilityRegistry
SlotRegistry
HandlerRegistry
EventRegistry
CommandRegistry
```

---

# 105. FASE 3 - DISPATCH

Criar o fluxo:

```text
resolve
→ authorize
→ dispatch
```

com:

```text
correlationId
causationId
diagnostics
```

---

# 106. FASE 4 - ISOLAMENTO

Migrar primeiro plugins pequenos.

Exemplo:

```text
dry-run
sift
process
chain
life
```

Depois:

```text
vocab
nlp
intent
knowledge
spatial
senses
```

Depois:

```text
narrative-engine
ide-state
```

---

# 107. FASE 5 - WORLD

Criar:

```text
WorldQuery
WorldMutation
MutationGateway
```

Migrar o acesso direto.

---

# 108. FASE 6 - NARRATIVE IR

Transformar IR em contrato oficial da linguagem narrativa.

Criar:

```text
versioning
validator
source-map
diagnostics
projection
```

A evolução do schema deve manter versionamento explícito; o schema atual já estabelece `narrativeIR@1.0` e a necessidade de bump para evoluções incompatíveis. 

---

# 109. FASE 7 - MANUSCRIPT

Criar a camada:

```text
Document
Chapter
Scene
Block
Paragraph
Sentence
```

e conectar ao estado atual.

---

# 110. FASE 8 - REFERENCE + CONTEXT

Adicionar:

```text
reference resolution
context assembly
entity memory
scene context
character context
```

---

# 111. FASE 9 - TIMELINE

Adicionar:

```text
story timeline
event graph
causality
continuity
```

---

# 112. FASE 10 - AI

Somente depois dos contratos estarem claros:

```text
AI Runtime
Provider
Prompt builder
Context assembly
AI response parser
IR conversion
Suggestion engine
```

---

# 113. FASE 11 - NOVO EDITOR

Redesenhar a UI ao redor de:

```text
Manuscript
```

e não:

```text
Game / Player
```

---

# 114. FASE 12 - MODO TÉCNICO

Dar acesso explícito a:

```text
DSL
debug
commands
rules
world
events
simulation
```

sem contaminar a interface padrão.

---

# 115. FASE 13 - SIMULAÇÃO

Reintegrar:

```text
Dry-run
Play Preview
Replay
Skein
Beat Debug
```

como ferramentas de análise narrativa.

---

# 116. FASE 14 - KITS

Converter kits em:

```text
optional packs
```

e verificar quais precisam realmente existir.

---

# 117. FASE 15 - REMOÇÃO DO LEGADO

Só remover quando houver:

```text
replacement
parity
migration
tests
```

Nunca remover por estética.

---

# 118. TESTE DE CADA MIGRAÇÃO

Toda alteração grande precisa de:

```text
unit test
integration test
contract test
migration test
regression test
```

quando aplicável.

---

# 119. CONTRATO É MAIS IMPORTANTE QUE IMPLEMENTAÇÃO

Para cada capability definir:

```text
input
output
errors
version
permissions
side effects
events
```

A IA deve poder substituir a implementação sem alterar consumidores.

---

# 120. EVENTOS

Eventos devem ser usados para:

```text
facts
notifications
lifecycle
cross-plugin reactions
```

Não para tudo.

Não transformar o sistema em:

```text
event spaghetti
```

---

# 121. EVENTO VS CAPABILITY

Usar:

```text
Capability
```

quando se quer:

```text
consultar
executar
obter serviço
```

Usar:

```text
Event
```

quando se quer:

```text
notificar
reagir
propagar fato
```

---

# 122. COMMAND VS INTENT

Distinguir:

```text
command
```

de:

```text
intent
```

Command:

```text
o autor solicita uma operação ao sistema.
```

Intent:

```text
descrição da intenção que será resolvida pelo runtime.
```

Os dois podem compartilhar infraestrutura, mas não devem ser semanticamente confundidos.

---

# 123. RULE VS NARRATIVE ACT

Rule:

```text
comportamento operacional
```

Narrative Act:

```text
operação de escrita/narração
```

Exemplo:

```text
"Maria entrou na sala."
```

pode virar:

```text
Narrative Act
```

e gerar uma mudança de estado.

A mudança de estado não transforma o texto inteiro numa “regra”.

---

# 124. AUTHORING RUNTIME

Criar uma camada que coordene:

```text
manuscript
analysis
IR
context
suggestions
projection
diagnostics
history
```

Ela é o equivalente narrativo do runtime de autoria.

Não deve ser colocada no Kernel 0.

---

# 125. MANUSCRIPT ENGINE VS NARRATIVE ENGINE

Separar claramente:

```text
Manuscript Engine
```

cuida de:

```text
documentos
texto
estrutura
edição
seleção
versionamento
```

Enquanto:

```text
Narrative Runtime
```

cuida de:

```text
mundo
eventos
regras
estado
consequências
```

Eles cooperam.

Não se fundem.

---

# 126. PRODUCT LAYER

Criar mentalmente quatro níveis:

```text
LEVEL 0
Kernel

LEVEL 1
Platform

LEVEL 2
Narrative Runtime

LEVEL 3
Authoring Product
```

O usuário enxerga principalmente:

```text
LEVEL 3
```

---

# 127. O PRODUTO DEVE PARECER SIMPLES MESMO SENDO COMPLEXO

Internamente:

```text
plugins
capabilities
resolver
dispatcher
IR
world
timeline
AI
```

Externamente:

```text
escrever
organizar
entender
revisar
explorar
corrigir
```

---

# 128. AI ASSISTANT

O Assistente deve poder responder:

```text
Quem é este personagem?
O que ele sabe?
Onde ele estava?
O que aconteceu nesta cena?
Por que isso está inconsistente?
Que eventos levaram a isso?
Quais personagens aparecem pouco?
Quem mudou mais?
Há algum foreshadowing sem payoff?
```

A arquitetura deve ser capaz de responder isso através dos índices e modelos internos.

---

# 129. SETUP / PAYOFF

Adicionar posteriormente:

```text
setup
foreshadowing
promise
payoff
unresolved thread
```

Exemplo:

```text
Capítulo 2:
"Maria viu uma chave estranha."
```

Depois:

```text
Capítulo 17:
nenhum uso.
```

Sistema:

```text
possível thread narrativa sem resolução.
```

---

# 130. STYLE

Criar capability para:

```text
style analysis
```

mas nunca alterar o estilo do autor automaticamente por padrão.

Pode analisar:

```text
repetição
ritmo
frases
diálogos
voz
descrição
densidade
```

---

# 131. PROSE

O `kit-prose` atual possui funções narrativas e `recap`.

Esse tipo de recurso deve migrar para:

```text
prose
narrative presentation
recap
summary
style
```

sem depender do paradigma de jogo.

---

# 132. SIFT

O `sift` pode evoluir para ferramenta de:

```text
pattern search
motif detection
story thread analysis
```

Não somente:

```text
história emergente de gameplay
```

---

# 133. MAPA ESPACIAL

O recurso espacial continua válido para literatura.

Ele pode mostrar:

```text
lugares
trajetos
relações espaciais
cenas
movimentações
```

Mas deve ser uma visualização do universo narrativo.

Não o centro do produto.

---

# 134. BEAT

O conceito de beat deve continuar.

Mas pode evoluir de:

```text
game beat
```

para:

```text
narrative beat
```

Um beat pode representar:

```text
evento
decisão
mudança
revelação
consequência
```

---

# 135. NARRATIVE HISTORY

Criar histórico estrutural:

```text
beat 1
beat 2
beat 3
...
```

com links para o manuscrito.

---

# 136. CADA MODIFICAÇÃO IMPORTANTE DEVE SER EXPLICÁVEL

Idealmente:

```text
Linha 243
↓
NarrativeAct 932
↓
Entity @maria
↓
Event ev-182
↓
State mutation
```

Isso transforma o Lume em uma ferramenta auditável.

---

# 137. AI CODING RULE - NÃO EXPLORAR O REPOSITÓRIO À TOA

A IA deve seguir:

```text
EFICIENCIA
↓
MAPA
↓
ROTEAMENTO
↓
CONTEXT do plugin
↓
manifest
↓
types
↓
arquivo indicado
↓
teste
```

O projeto já estabelece explicitamente esse procedimento para reduzir exploração desnecessária. 

---

# 138. QUANDO O CONTEXT ESTIVER ERRADO

Não fazer:

```text
vasculhar 100 arquivos.
```

Fazer:

```text
corrigir CONTEXT
```

e então continuar.

---

# 139. QUANDO UM ARQUIVO ESTIVER GRANDE DEMAIS

Dividir por responsabilidade.

Evitar:

```text
engine.ts 4000 linhas
```

Preferir:

```text
engine/
  runtime.ts
  query.ts
  mutation.ts
  timeline.ts
  causality.ts
```

---

# 140. CÓDIGO LEGADO

Ao encontrar código antigo:

classificar:

```text
KEEP
MIGRATE
WRAP
DEPRECATE
REPLACE
REMOVE
```

Nunca apagar simplesmente porque “é antigo”.

---

# 141. DOCUMENTAÇÃO LEGADA

Documentação antiga pode estar descrevendo:

```text
produto anterior
```

ou:

```text
arquitetura anterior
```

Nesse caso:

```text
não tratar como verdade absoluta.
```

Comparar com:

```text
produto-alvo
```

---

# 142. O QUE NÃO DEVE SER PRESERVADO SÓ POR SER LEGADO

Exemplos:

```text
player-first UX
score-first UX
turn-first UX
game prompt como UI principal
```

Esses conceitos podem ser rebaixados ou removidos da experiência padrão.

---

# 143. O QUE DEVE SER PRESERVADO CUIDADOSAMENTE

Principalmente:

```text
DSL técnica
Narrative IR
SourceMap
world model
rules
intent
dry-run
replay
diagnostics
plugin contract
capabilities
event bus
```

porque são ativos arquiteturais úteis.

---

# 144. DEFINIÇÃO DE “FEITO”

Uma tarefa arquitetural só é considerada completa quando:

```text
código
contrato
testes
documentação
integração
migração
```

estiverem coerentes.

---

# 145. DEFINIÇÃO DE “FEITO” PARA NOVO PLUGIN

Um plugin só está completo quando possui:

```text
CONTEXT.md
manifest
types
factory
capabilities
slots
tests
events
permissions
integration
```

---

# 146. DEFINIÇÃO DE “FEITO” PARA NOVO FLUXO DE AUTORIA

Precisa demonstrar:

```text
autor escreve texto
→ sistema entende
→ IR produzido
→ referência resolvida
→ contexto atualizado
→ diagnóstico produzido
→ estado narrativo atualizado
→ UI mostra resultado
```

---

# 147. DEFINIÇÃO DE “FEITO” PARA IA

Precisa demonstrar:

```text
contexto reunido
→ prompt/input estruturado
→ resposta
→ parser
→ IR/proposal
→ validação
→ política
→ usuário
```

Nunca:

```text
AI output
→ eval()
→ mutate world
```

---

# 148. DEFINIÇÃO DE “FEITO” PARA REFACTOR

O refactor só termina quando:

```text
API está estável ou versionada
consumidores migrados
testes migrados
imports legados reduzidos
novo caminho ativo
documentação atualizada
```

---

# 149. ESTRATÉGIA DE BRANCH

Para grandes mudanças:

```text
architecture/*
authoring/*
kernel/*
narrative-ir/*
ai-runtime/*
```

Preferir mudanças menores e integráveis.

---

# 150. REGRA DE COMMITS

Cada mudança arquitetural importante deve responder:

```text
o que mudou?
por quê?
qual contrato?
qual impacto?
como validar?
```

---

# 151. REGRA DE NÃO “GOLD PLATING”

Quando a IA receber:

```text
implemente X
```

ela não deve aproveitar para:

```text
implementar X
+
timeline
+
AI
+
emotion
+
new UI
+
new DSL
+
new runtime
```

a menos que sejam necessários ao objetivo.

---

# 152. MAS NÃO CONFUNDIR “SEM GOLD PLATING” COM “PRESERVAR ARQUITETURA RUIM”

Se implementar X exige mudar:

```text
matcher
registry
dispatcher
contract
```

então essas mudanças são parte necessária de X.

Não devem ser evitadas só para reduzir o diff.

---

# 153. REGRA DE ALTERAÇÃO MÍNIMA SEM SER CONSERVADOR DEMAIS

Princípio:

> Faça a menor mudança que realmente conduz o sistema para a arquitetura-alvo, não a menor mudança que mantém a arquitetura antiga intacta.

Essa distinção é crítica.

---

# 154. NOVO CRITÉRIO DE QUALIDADE

Não perguntar apenas:

```text
isso funciona?
```

Perguntar:

```text
isso melhora o Lume como editor narrativo?
```

e:

```text
isso fortalece o desacoplamento?
```

e:

```text
isso continua substituível?
```

e:

```text
isso continua acessível ao escritor?
```

---

# 155. MÉTRICAS ARQUITETURAIS

Acompanhar:

```text
direct plugin imports
capability bindings
slot bindings
legacy adapters
duplicated logic
god objects
files > reasonable size
public API instability
```

---

# 156. MÉTRICAS DE PRODUTO

Acompanhar:

```text
time to first writing
time to understand scene
time to find character
time to identify inconsistency
time to trace event
number of required technical operations
```

O objetivo é reduzir a carga cognitiva do escritor.

---

# 157. TESTE FUNDAMENTAL DO NOVO LUME

Perguntar:

> Um escritor consegue abrir o Lume e começar a escrever sem saber como funciona o runtime?

A resposta desejada é:

```text
SIM.
```

---

# 158. SEGUNDO TESTE FUNDAMENTAL

Perguntar:

> Um autor avançado consegue acessar o mecanismo técnico sem abandonar o runtime principal?

Resposta desejada:

```text
SIM.
```

---

# 159. TERCEIRO TESTE

Perguntar:

> É possível substituir um modelo de IA sem reescrever o editor?

```text
SIM.
```

---

# 160. QUARTO TESTE

Perguntar:

> É possível substituir um plugin sem alterar consumidores?

```text
SIM.
```

ou pelo menos:

```text
SIM, se o contrato da capability continuar compatível.
```

---

# 161. QUINTO TESTE

Perguntar:

> Uma alteração em uma entidade pode ser rastreada até as cenas e eventos afetados?

```text
SIM.
```

---

# 162. SEXTO TESTE

Perguntar:

> A escrita comum exige que o autor conheça ON/IF/DO?

```text
NÃO.
```

---

# 163. SÉTIMO TESTE

Perguntar:

> O autor avançado pode escrever ON/IF/DO e intent.* diretamente?

```text
SIM.
```

---

# 164. OITAVO TESTE

Perguntar:

> Texto natural e comandos técnicos usam runtimes diferentes?

```text
NÃO.
```

Usam interfaces diferentes para o mesmo núcleo semântico/runtime.

---

# 165. NONO TESTE

Perguntar:

> A IA pode modificar o mundo diretamente?

```text
NÃO.
```

Ela deve passar por:

```text
IR
validation
policy
MutationGateway
```

---

# 166. DÉCIMO TESTE

Perguntar:

> O Lume precisa parecer um jogo para entregar seus recursos narrativos?

```text
NÃO.
```

---

# 167. PROTOCOLO DE EXECUÇÃO DA IA

Sempre que receber uma tarefa:

## PASSO 1

Identificar:

```text
qual produto
qual camada
qual plugin
qual capability
qual contrato
```

## PASSO 2

Ler:

```text
CONTEXT
manifest
types
```

## PASSO 3

Identificar:

```text
API atual
comportamento atual
testes atuais
invariantes atuais
```

## PASSO 4

Classificar o trabalho:

```text
bug
feature
refactor
migration
replacement
architecture
UI
domain
```

## PASSO 5

Determinar:

```text
KEEP
CHANGE
ADD
MIGRATE
DEPRECATE
REMOVE
```

## PASSO 6

Implementar em ordem:

```text
contract
adapter
implementation
integration
tests
docs
```

---

# 168. QUANDO HOUVER CONFLITO

Registrar:

```text
CONFLICT:
old invariant X
target requirement Y
```

Depois:

```text
decide
```

Não mascarar o conflito.

---

# 169. QUANDO A IA NÃO SOUBER ONDE ESTÁ ALGO

Não procurar o repositório inteiro imediatamente.

Primeiro:

```text
ROTEAMENTO
MAPA
CONTEXT
```

Depois busca dirigida.

---

# 170. QUANDO UMA IMPLEMENTAÇÃO ESTIVER ACOPLADA

Perguntar:

```text
qual capability deveria existir aqui?
```

e não:

```text
como deixar este import menos feio?
```

---

# 171. QUANDO UM PLUGIN FICAR GRANDE

Separar:

```text
contract
runtime
query
mutation
policy
adapter
```

mas manter uma única fronteira de domínio quando fizer sentido.

---

# 172. QUANDO UMA NOVA FUNÇÃO PARECER “ENGINE”

Verificar primeiro:

```text
é capability?
é regra?
é analyzer?
é policy?
é projection?
é service?
```

Antes de criar um engine.

---

# 173. QUANDO A IA QUISER CRIAR UM SEGUNDO MOTOR

Parar e verificar:

```text
qual responsabilidade do motor original?
```

Se houver sobreposição:

```text
refatorar o original
ou
adicionar capability especializada
```

em vez de criar competição silenciosa.

---

# 174. QUANDO O MATCHER PRECISAR SER ALTERADO

Pode alterar.

Obrigatório então:

```text
mapear comportamento antigo
mapear comportamento desejado
especificar novo contrato
testar casos antigos
testar casos novos
atualizar replay
atualizar dry-run
atualizar diagnostics
```

---

# 175. QUANDO A DSL PRECISAR SER ALTERADA

Nunca quebrar silenciosamente.

Preferir:

```text
parser version
migration
compatibility layer
diagnostics
```

---

# 176. QUANDO O NARRATIVE IR PRECISAR SER ALTERADO

Usar versionamento explícito:

```text
MAJOR
MINOR
```

e migradores quando necessário.

---

# 177. QUANDO O WORLD MODEL PRECISAR SER ALTERADO

Verificar:

```text
query
mutation
replay
dry-run
continuity
timeline
AI
UI
```

porque o world é transversal.

---

# 178. QUANDO A UI PRECISAR SER ALTERADA

Primeiro perguntar:

```text
qual é o fluxo do escritor?
```

Depois:

```text
qual componente?
```

Não começar pela estética.

---

# 179. QUANDO UMA FEATURE FOR “PARA JOGO”

Perguntar:

```text
ela é útil para autoria narrativa?
```

Se sim:

```text
recontextualizar.
```

Se não:

```text
deixar opcional.
```

---

# 180. PRINCÍPIO DA RECONTEXTUALIZAÇÃO

Exemplos:

```text
play
→ simulation preview

beat
→ narrative event

score
→ opcional de simulação

turn
→ temporal step opcional

Skein
→ causal/history graph

dry-run
→ consequence preview

world map
→ story geography

combat
→ domain pack

social kit
→ relationship modeling
```

---

# 181. PRODUTO FINAL DESEJADO

O usuário abre o Lume.

Vê:

```text
manuscrito
```

Escreve.

O sistema entende.

O escritor continua escrevendo.

O Lume acompanha:

```text
quem está na cena
onde estão
o que sabem
o que aconteceu
o que mudou
o que foi prometido
o que ainda não foi resolvido
```

Quando existe problema:

```text
o Lume mostra.
```

Quando há sugestão:

```text
o Lume propõe.
```

Quando o autor quer precisão:

```text
o modo técnico existe.
```

Quando o autor quer experimentar:

```text
simulação existe.
```

Quando quer revisar:

```text
timeline
causalidade
continuidade
personagens
histórico
```

existem.

---

# 182. PRINCÍPIO FINAL DE PRODUTO

Nunca inverter esta relação:

```text
ESCRITOR
  ↓
LUME
```

para:

```text
ENGINE
  ↓
ESCRITOR
```

O engine existe para servir a autoria.

---

# 183. PRINCÍPIO FINAL DE ARQUITETURA

Nunca inverter esta relação:

```text
CONTRATO
  ↓
IMPLEMENTAÇÃO
```

para:

```text
IMPLEMENTAÇÃO
  ↓
CONTRATO
```

Os contratos devem permitir:

```text
substituição
evolução
isolamento
teste
versionamento
```

---

# 184. PRINCÍPIO FINAL DE IA

Nunca assumir:

```text
documentação antiga = verdade eterna.
```

Usar:

```text
documentação
+
código
+
testes
+
objetivo do produto
+
arquitetura-alvo
```

e produzir uma migração coerente.

---

# 185. INSTRUÇÃO FINAL PARA A IA IMPLEMENTADORA

Você não está mantendo simplesmente um antigo motor de aventuras.

Você está transformando uma base existente em um:

> **EDITOR NARRATIVO LINEAR, DINÂMICO E PROFISSIONAL PARA ESCRITORES.**

O manuscrito é a superfície principal.

A narrativa estruturada é o modelo semântico.

O runtime é a infraestrutura.

O Kernel 0 é a fundação.

Plugins são módulos substituíveis.

Capabilities são contratos.

Slots são portas.

Envelopes são unidades de comunicação.

Matcher e Resolver são mecanismos de decisão especializados.

Dispatcher controla a passagem das operações.

Narrative IR conecta linguagem e runtime.

Context Assembly conecta o texto ao mundo narrativo.

Reference Resolution conecta palavras a entidades.

Timeline conecta eventos.

Causality conecta causas e consequências.

Continuity protege consistência.

AI Runtime fornece inteligência substituível.

MutationGateway controla alterações.

Manuscript preserva a autoria.

Technical Mode preserva o poder da DSL.

Simulation preserva o poder do runtime.

A experiência final deve esconder a complexidade e revelar apenas aquilo que ajuda o escritor a:

```text
ESCREVER
ENTENDER
ORGANIZAR
REVISAR
EXPLORAR
DECIDIR
```

---

# 186. PRIMEIRA TAREFA DA IA ANTES DE IMPLEMENTAR

Antes de modificar código em uma grande fase, produzir internamente:

```text
1. estado atual
2. arquitetura-alvo
3. delta arquitetural
4. invariantes que continuam válidas
5. invariantes que precisam mudar
6. contratos a criar
7. contratos a migrar
8. plugins afetados
9. ordem de implementação
10. estratégia de compatibilidade
11. testes afetados
12. critérios de conclusão
```

Não iniciar uma grande refatoração sem essa visão.

---

# 187. SEGUNDA TAREFA

Separar explicitamente:

```text
LEGADO
```

de:

```text
ALVO
```

Não confundir ambos.

---

# 188. TERCEIRA TAREFA

Implementar:

```text
fundação
→ contratos
→ adapters
→ migração
→ produto
```

e não:

```text
UI nova
→ remendos
→ mais acoplamento
```

---

# 189. QUARTA TAREFA

Sempre que uma decisão antiga bloquear a evolução, perguntar:

```text
"Essa decisão ainda serve ao Lume que estamos construindo?"
```

Se não:

```text
mude-a conscientemente.
```

---

# 190. DEFINIÇÃO SUPREMA DE SUCESSO

O Lume terá alcançado a arquitetura e produto desejados quando:

```text
um escritor possa abrir o sistema,
começar a escrever naturalmente,
ter seu texto compreendido progressivamente,
ver personagens, lugares, eventos e relações surgirem,
acompanhar a continuidade da obra,
acompanhar a timeline,
receber diagnósticos,
receber sugestões,
explorar consequências,
revisar causas e efeitos,
e nunca precisar entender a arquitetura interna
para usar o sistema em seu fluxo normal.
```

Ao mesmo tempo:

```text
um autor técnico possa ativar o Modo Técnico,
editar DSL,
consultar regras,
usar intent.*,
inspecionar entidades,
executar dry-run,
simular consequências,
examinar beats,
replayar estado
e controlar precisamente o runtime.
```

Ambas as experiências devem usar:

```text
o mesmo sistema.
```

Não dois Lumes.

Não dois motores.

Não dois mundos.

```text
UMA PLATAFORMA.
DUAS SUPERFÍCIES DE AUTORIA.
UM RUNTIME NARRATIVO.
UM CONTRATO ARQUITETURAL.
```

# FIM DO CONTEXT MACHINE MESTRE

Esse documento muda um ponto importante em relação às especificações anteriores: **as invariantes passam a ser classificadas como regras evolutivas**, e a IA tem autorização explícita para alterá-las quando forem obstáculos à arquitetura-alvo, desde que faça a migração de contrato, implementação, testes e documentação em conjunto. Isso é especialmente relevante para `findMatchingRule`, para a decomposição do `narrative-engine` e para a transição da experiência de “jogo” para “autoria narrativa”.  

Também preservei explicitamente a DSL técnica `ON/IF/DO`, `intent.*`, `EMIT`, `KNOW`, `WAIT`, `TICK`, `THEN`, `LIVE` como **modo avançado**, em vez de eliminá-la, enquanto o manuscrito e a escrita natural passam a ser a experiência principal.



---
Powered by [ChatGPT Exporter](https://www.chatgptexporter.com)