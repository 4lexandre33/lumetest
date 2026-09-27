export type GuideSlide = { kicker: string; title: string; body: string[]; sample?: { label: string; code: string } };

export const GUIDE_SLIDES: GuideSlide[] = [
  {
    kicker: "1 · O que é",
    title: "A Lume escreve jogos de texto",
    body: [
      "Você descreve um mundo: pessoas, lugares, objetos. O jogador clica. O motor escolhe a regra mais precisa e responde com um parágrafo.",
      "Não precisa programar. Precisa saber o que acontece se alguém pega a tocha, ou se entra no escuro.",
    ],
  },
  {
    kicker: "2 · Entidades",
    title: "Tudo o que existe tem um id @ em minúsculas",
    body: [
      "Uma entidade é uma pessoa, um lugar, um objeto, um evento, uma informação ou um conceito. O nome técnico é o id: @jogador, @caverna, @tocha.",
      "Há 6 categorias fixas (em inglês, minúsculas): agent, object, place, event, information, abstract. hidden é uma flag, não uma categoria.",
      "Escreva @, o nome em minúsculas, um ponto, e Enter — a Lume monta o bloco. Sem @, ou com maiúsculas, o editor marca E040.",
    ],
    sample: {
      label: "Uma tocha no chão",
      code: `@tocha.{
tags: object;
stats: illumination=7;
links: current_location=@entrada;
name: Tocha;
description: Uma tocha no chão.
}`,
    },
  },
  {
    kicker: "3 · tags, stats, links, name",
    title: "Quatro gavetas, funções diferentes",
    body: [
      "tags: etiquetas. Palavras sem número. agent, sleeping, dark, quest_item. Uma entidade casa com *.place se tiver a tag place.",
      "stats: números. fear=0, illumination=7, vida=100. Dá para comparar (fear>4) e mudar (fear+2, fear=9, fear*2).",
      "links: relações com OUTRA entidade. current_location=@caverna quer dizer 'está na caverna'. O motor usa current_location (em inglês) para saber onde o jogador está.",
      "name e description NÃO são tags. São propriedades visíveis. {@astronoma.name} lê o campo name da entidade @astronoma. Se não houver name, a Lume humaniza o id (@astronoma → Astronoma).",
    ],
  },
  {
    kicker: "4 · Taxonomia",
    title: "Uma tag pode herdar de outra",
    body: [
      "A aba Taxonomia classifica tags. Não muda a entidade: o goblin continua só com a tag goblin. Na hora de casar regras, o motor também vê os pais.",
      "Uma linha, um pai: goblin → monster. monster → agent. Assim, *.monster e *.agent encontram o goblin. hidden nunca é herdada, nem as tags da entidade pai. Stats, flags, enums, phrases, links, lists, fuses e struct do pai vêem-se na regra, não no caderno da filha. A chave da filha ganha.",
      "Se a taxonomia estiver vazia, o motor funciona como antes. A regra mais específica vence: on: @goblin > *.goblin > *.monster.",
      "A árvore ao lado do caderno mostra os pais. Clique numa tag para ver quem herda e quais regras citam. No depurador, Efetiva encontra descendentes; Direta só a tag escrita na entidade.",
    ],
    sample: {
      label: "O goblin é um monstro",
      code: `goblin → monster
monster → agent

@goblin.{
tags: goblin, sleeping;
}

on: *.monster.!sleeping
text: "O goblin já acordou."`,
    },
  },
  {
    kicker: "5 · Regras",
    title: "on, if, do, text",
    body: [
      "on: o que o jogador clicou. Pode ser um id (@caverna), um filtro (*.object) ou start (o boot da história).",
      "if: condição extra. Só dispara se essa pergunta for verdadeira agora no mundo. Pode haver vários if:.",
      "do: o que muda no mundo. No editor, usa verbos nomeados (ADD_TAG, SET_STAT, SET_FLAG…). Compacto continua a compilar.",
      "text: o único parágrafo que o jogador lê.",
    ],
    sample: {
      label: "Entrar só com luz",
      code: `on: @caverna.!explored
if: *.object.current_location=@jogador.illumination>5
do: SET_LINK @jogador.softLinks.current_location @caverna
text: "Você entra, com a tocha à frente."`,
    },
  },
  {
    kicker: "6 · *  $  !",
    title: "Qualquer, o clicado, o contrário",
    body: [
      "*.place — qualquer entidade que tenha a tag place. *.object, *.agent, *.event funcionam igual.",
      "$ — a entidade que o jogador acabou de clicar (o gatilho). Em on: *.object, o $ é aquele objeto. {$.name} é o nome visível dele. $.current_location=@jogador põe o clicado no jogador.",
      "! — negação. @caverna.!explored = a caverna SEM a tag explored. @jogador.!current_location=$ = o jogador NÃO está no lugar clicado.",
      "-tag no do: tira a tag: @goblin.-sleeping acorda o goblin.",
    ],
    sample: {
      label: "Pegar qualquer objeto que não está com você",
      code: `on: *.object.!current_location=@jogador
do: $.current_location=@jogador
text: "Você pega {$.name}."`,
    },
  },
  {
    kicker: "7 · Números",
    title: "Comparar e mudar",
    body: [
      "Na pergunta (on/if): illumination>5, fear<4, fear>=9, fear=0. O motor usa um = só (não precisa de ==). > < >= <= =.",
      "No do: fear=9 põe o valor; fear+2 soma; fear-1 diminui; fear*2 multiplica (o dobro do medo).",
      "Só stats (números) aceitam > < + - *. Links usam = (current_location=@caverna).",
    ],
    sample: {
      label: "Medo sobe, depois dobra",
      code: `do: @jogador.fear+2
    @jogador.fear*2`,
    },
  },
  {
    kicker: "8 · Chaves { }",
    title: "O parágrafo pode mudar sozinho",
    body: [
      "Propriedade: {@astronoma.name} → o name da astrônoma. {@tocha.description}. {$.name} → o name de quem você clicou.",
      "Pergunta: {@jogador.fear>4? o coração disparado | com coragem}. Se o medo for alto, usa a primeira frase; senão, a segunda.",
      "Ciclo, sem pergunta, só barras: {primeira vez | segunda | já cansou}. Cada clique seguinte avança a opção e para na última. É assim que o zelador diz três falas diferentes.",
    ],
    sample: {
      label: "Três falas do zelador",
      code: `on: @zelador
text: "{O zelador sacode um pano. 'A lente está aí, embaixo da poeira.' | 'Não peço a chave. A cúpula é que pede.' | Ele já varreu o suficiente.}"`,
    },
  },
  {
    kicker: "9 · Quem ganha",
    title: "A regra mais específica fala primeiro",
    body: [
      "Se duas regras servem para o mesmo clique, vence a que tem mais detalhes (mais pontos, mais IFs).",
      "Se empatarem, vale a que está escrita mais acima.",
      "Por isso regras genéricas — 'qualquer objeto, pega' — ficam no fim. As especiais — 'a cúpula, se tiver carta E lente' — ficam em cima.",
    ],
  },
  {
    kicker: "10 · start",
    title: "A história começa sozinha",
    body: [
      "start() no caderno de entidades marca o ponto de partida. Não é uma pessoa nem um objeto: não leva tags, stats nem links. É só o marco de abertura.",
      "Ao abrir o preview, o motor 'clica' em start. A regra on: start é a primeira narrativa. É ali que a astrônoma pede a carta e a lente.",
    ],
    sample: {
      label: "Marco e abertura",
      code: `start()

on: start
text: "A sessão das nove não começou. A {@astronoma.name} não levanta a luneta."`,
    },
  },
  {
    kicker: "11 · A tela",
    title: "Quatro cantos",
    body: [
      "À esquerda, o índice. Clique numa entidade para saltar no caderno, no começo exato da linha. Categorias usam a taxonomia: um goblin com tag goblin aparece em Agent se goblin → agent.",
      "No centro, o caderno. Entidades, taxonomia e regras ficam no motor. O menu de sugestões abre no cursor com ponto (.) ou Ctrl+Espaço. Cada item tem nome, uma linha e um selo: entidade, gaveta, lei ou frase. Enter substitui o trecho.",
      "À direita, o preview. Cada parágrafo já lido tem um ícone para voltar àquele ponto e seguir por outro caminho. O círculo no canto recomeça do zero.",
      "O documento completo — todos os métodos do editor de entidades, do editor de regras e do caderno, com exemplos — está em Ajuda → Rever guia, e dá para descarregar.",
    ],
  },
];
