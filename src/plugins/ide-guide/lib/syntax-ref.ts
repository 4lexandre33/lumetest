export type RefSection = { id: string; title: string; body: string[]; sample?: string };

export const SYNTAX_REF: RefSection[] = [
  {
    id: "bloco",
    title: "Bloco de entidade (FBE)",
    body: [
      "O id (HumanSlug) vai em maiúsculas. Ponto + Enter monta o bloco com name e description no topo, depois as 10 gavetas. Cada gaveta termina com ponto-e-vírgula; itens internos separam-se por vírgula. Texto com delimitadores usa aspas simples ' '.",
      "Quad-IDs: o slug é a chave do mundo (JOGADOR). O motor gera shortCode (#A8F2); o UUID fica escondido. templateId aponta para um protótipo usado em SPAWN. extra não é gaveta-base. CREATE ID ou CREATE ID.tag — o 2.º segmento é tag, nunca gaveta.",
    ],
    sample: `DRAGAO_ANCIAO.{
  name: Dragão Ancião do Abismo;
  description: 'Uma besta ancestral envolta em chamas étereas.';
  tags: agent, vivo, chefe, voador, dragao;
  stats: hp=500[0..1000], mp=200, ataque=85;
  flags: em_combate=true, derrotado=false;
  enums: estado_fsm=COMBATE_AEREO, postura=AGRESSIVO;
  phrases: titulo='O Flagelo dos CÉUS';
  hardLinks: elemento_core=CORACAO_DRAGAO;
  softLinks: current_location=PICO_SERPENTE, alvo_foco=JOGADOR;
  lists: inventario=[GEMA_FOGO, ESCAMA_ANCIA];
  fuses: temporizador_sopro=2, recarga_voo=4;
  struct: resistencias='fogo:100,gelo:-50';
}`,
  },
  {
    id: "gavetas",
    title: "As 10 gavetas",
    body: [
      "tags — aspectos e taxonomia: agent, object, place, event, information, abstract, hidden. *.place casa quem tem a tag place.",
      "stats — só número ou gauge: `hp=10`, `hp=10[0..100]`. flags — booleanos, sempre chave=true ou chave=false. enums — estados discretos de FSM. phrases — diálogos e títulos consultáveis.",
      "hardLinks — posse/composição: apagar o pai destrói os filhotes. softLinks — foco/posição: apagar o alvo faz null-reset (\"\") sem apagar o pai. Destino só ID ou #A8F2 (`alvo=JOGADOR`). links: legado vira softLinks.",
      "lists — inventários/filas, forma `nome=[a, b]`. PUSH, POP, REMOVE, CLEAR, ADD_UNIQUE. fuses — só `N` ou `N>alvo` (`sopro=2`, `sopro=2>BOOM`). struct — objetos/matrizes aninhados.",
      "name / description — texto de topo para o jogador, não tags. {ASTRONOMA.name} lê o campo. Se faltar, a Lume humaniza o id.",
    ],
  },
  {
    id: "taxonomia",
    title: "Taxonomia: filho → pai",
    body: [
      "A aba Taxonomia fica entre Entidades e Regras. Cada linha é uma herança: tag → pai. Só um pai por tag. Pai desconhecido vira raiz. Comentários só /* assim */.",
      "A entidade não ganha as tags do pai. GOBLIN com tags: goblin continua {goblin}. Consultas e regras on/if vêem os ancestrais: *.monster e *.agent casam.",
      "hidden nunca herda. Stats e links também não. Seta → ou ->. Ciclo, dois pais e linha inválida sublinham no caderno. Taxonomia vazia = motor antigo.",
      "A regra mais específica vence: on: GOBLIN > *.goblin > *.monster > *.creature.",
      "A árvore ao lado lista os pais. Clique para ver impacto: entidades que herdam e regras on/if que citam a tag. No depurador, Efetiva (padrão) vê ancestrais; Direta ignora a taxonomia.",
    ],
    sample: `goblin → monster
monster → agent

on: *.monster.!sleeping
narrativa: "O goblin já acordou."`,
  },
  {
    id: "regras",
    title: "on · if · do · narrativa",
    body: [
      "Canónico em minúsculas: on: if: do: narrativa:. ON: IF: DO: continuam a compilar — o parser não distingue a caixa.",
      "on: o que o jogador clicou (id, filtro ou start). Sem on: a regra não existe.",
      "if: condição extra sobre o mundo agora. Pode haver vários if:; todos precisam ser verdadeiros.",
      "do: o que muda. Várias linhas. Acrescenta tag, tira tag, muda número, muda ligação, SPAWN, CREATE ID ou CREATE ID.tag, DESTROY, PUSH/POP de listas.",
      "narrativa: o único parágrafo que o jogador lê.",
    ],
    sample: `on: CAVERNA.!explored
if: *.object.current_location=JOGADOR.illumination>5
do: JOGADOR.current_location=CAVERNA
narrativa: "Você entra, com a tocha à frente."`,
  },
  {
    id: "estrelas",
    title: "*  $  !",
    body: [
      "* — qualquer entidade. *.place = qualquer uma com a tag place. *.object, *.agent, *.event, *.information, *.abstract funcionam igual.",
      "$ — a entidade que o jogador acabou de clicar (o gatilho). Em on: *.object, o $ é aquele objeto. {$.name} é o nome visível dele. $.current_location=JOGADOR põe o clicado no jogador.",
      "! — negação. CAVERNA.!explored = a caverna SEM a tag explored. *.object.!current_location=JOGADOR = objeto que NÃO está com o jogador.",
      "-tag no do: tira a tag: GOBLIN.-sleeping acorda o goblin.",
    ],
    sample: `on: *.object.!current_location=JOGADOR
do: $.current_location=JOGADOR
narrativa: "Você pega {$.name}."`,
  },
  {
    id: "numeros",
    title: "Números: comparar e mudar",
    body: [
      "Na pergunta (on/if): illumination>5, hp<4, hp>=9, hp=0. Um = só (não precisa de ==; == também é aceito). Operadores: > < >= <= =.",
      "No do: hp=9 põe o valor; hp+2 soma; hp-1 diminui; hp*2 multiplica. Gauge [min..max] clamp automaticamente.",
      "Só stats (números) aceitam > < + - *. Links usam = : current_location=CAVERNA. flags usam true/false.",
    ],
    sample: `do: JOGADOR.hp+2
    JOGADOR.hp*2
    JOGADOR.hp-1`,
  },
  {
    id: "chaves",
    title: "Chaves { } na narrativa",
    body: [
      "Propriedade: {ASTRONOMA.name} → o name da astrônoma. {TOCHA.description}. {$.name} → o name de quem você clicou.",
      "Pergunta: {JOGADOR.hp>4? o coração disparado | com coragem}. Se a pergunta for verdadeira, usa a primeira frase; senão, a segunda.",
      "Ciclo, sem pergunta, só barras: {primeira | segunda | já cansou}. Cada clique seguinte avança a opção e para na última. Pontos dentro do texto são permitidos.",
    ],
    sample: `on: ZELADOR
narrativa: "{O zelador sacode um pano. 'A lente está aí.' | 'Não peço a chave.' | Ele já varreu o suficiente.}"`,
  },
  {
    id: "start",
    title: "start, especificidade, lugar",
    body: [
      "start no caderno de entidades é o marco de abertura — não é uma entidade com tags/stats/links. O motor aceita start(). A regra on: start é a primeira narrativa.",
      "Se duas regras servem para o mesmo clique, vence a que tem mais detalhes. Se empatam, vale a que está escrita mais acima. Regras genéricas (on: *.object) ficam no fim.",
      "current_location é o nome do softLink que o preview consulta. Mantenha em inglês. SPAWN ID FROM TEMPLATE instancia um protótipo (templateId).",
    ],
  },
  {
    id: "caminhos",
    title: "Caminho de gaveta",
    body: [
      "No on:, if: e no do: compacto podes nomear a gaveta: JOGADOR.stats.hp>4, JOGADOR.flags.em_combate, JOGADOR.softLinks.alvo=GOBLIN, JOGADOR.tags.ferido, JOGADOR.phrases.titulo='Oi'.",
      "Sem gaveta o motor resolve como antes — tag, stat ou link conforme o que existir. #A8F2 no lugar do slug também é o mesmo alvo (Quad-ID).",
      "lists, fuses e struct não têm caminho compacto no do:. Listas usam PUSH/POP/REMOVE/CLEAR/ADD_UNIQUE. Fusíveis usam SET_FUSE.",
    ],
    sample: `on: JOGADOR.stats.hp>0
if: JOGADOR.flags.em_combate
do: JOGADOR.softLinks.current_location=CAVERNA
    JOGADOR.tags.explorado
    JOGADOR.stats.hp-1`,
  },
  {
    id: "nomeados",
    title: "do: nomeado",
    body: [
      "Os verbos nomeados são o mesmo do: compacto, com a gaveta implícita: ADD_TAG, REMOVE_TAG, SET_STAT, ADD_STAT, MUL_STAT, SET_FLAG, SET_ENUM, SET_LINK.",
      "No editor e no Vincular, o do: oferece só nomeados (mais PUSH/CLEAR/CREATE/DESTROY/SPAWN). Compacto (JOGADOR.ferido) continua a compilar no motor; STRUCT não sai do retrato.",
      "Buracos FBE: SET_PHRASE (phrases), UNLINK (parte o link sem DESTROY), SET_FUSE (turnos ou turnos>alvo). TICK continua um efeito, não uma mutação.",
      "A caixa não conta: set_flag JOGADOR.em_combate false = SET_FLAG JOGADOR.flags.em_combate false = JOGADOR.flags.em_combate=false.",
    ],
    sample: `do: ADD_TAG JOGADOR ferido
    SET_STAT JOGADOR.hp 10
    SET_PHRASE JOGADOR.titulo 'O herói'
    UNLINK JOGADOR.alvo
    SET_FUSE BOMBA.estouro 3>BOOM`,
  },
  {
    id: "ramos",
    title: "/ e ()",
    body: [
      "/ é OU. on: JOGADOR / GOBLIN casa qualquer um dos dois. O ponto liga mais forte do que /: JOGADOR.vivo / GOBLIN.vivo.",
      "() agrupam. (JOGADOR / GOBLIN).vivo distribui o sufixo pelos dois ramos. JOGADOR.(vivo / morto) é OU só nas cláusulas.",
      "A especificidade de um OU é a do ramo mais fraco, para JOGADOR / *.object não roubar o clique ao id. Comentário só /* assim */ — tem de abrir e fechar. // já não é comentário: / é OU.",
    ],
    sample: `on: JOGADOR / GOBLIN
if: (*.agent / *.object).vivo
narrativa: "Alguém vivo responde."`,
  },
  {
    id: "posse",
    title: "(link) · TEM · NAO_TEM",
    body: [
      "(link JOGADOR.alvo) no on:/if: é um passeio: casa a entidade para onde o link aponta. (link $.current_location) parte de quem foi clicado. Link vazio ou em falta não casa ninguém.",
      "Depois de =, (link X.y) continua a ser valor, como sempre. (link / GOBLIN) é agrupamento, não passeio — falta o ponto da chave.",
      "TEM e NAO_TEM perguntam se o detentor tem o item no conteúdo: current_location, in, ou uma lists do detentor. Um link qualquer (alvo, foco) não conta. NÃO_TEM e nao_tem são o mesmo. TEM ESPADA no gatilho é $ TEM ESPADA. TEM sozinho não parseia.",
      "No caderno, «Quando o jogador tem a espada» vira on: JOGADOR TEM ESPADA. «Se o jogador não tem a tocha» vira if: JOGADOR NAO_TEM TOCHA. «Ele tem 100 de vida» no retrato continua stat, não matcher.",
    ],
    sample: `on: (link JOGADOR.alvo).vivo
if: JOGADOR TEM ESPADA
if: JOGADOR NAO_TEM PEDRA
narrativa: "A lâmina está na tua mão."`,
  },
  {
    id: "escrita",
    title: "Escrita e Jogo",
    body: [
      "Um IDE, dois modos (ideMode). Chrome: Modo Escrita | Modo Jogo. Entidades, regras e caderno existem nos dois. Só o preview e o caderno vivo mudam. Caderno = Quando/Se/narre; motor cru = aba Regras.",
      "Escrita: o preview é o estado. Clique em ¹ ² ³ para o histórico da entidade (L nº, pôr/tirar). Ver entidade mostra as 10 gavetas no painel direito. Tags #combate (cerca ## regras) abrem N sugestões — não escolhem vencedor de Play. Sem beat.",
      "Jogo: o preview é o runtime — parágrafo, CommandBar, rewind. Um matcher. O caderno edita e recompila; Vincular mutação e o popover só na Escrita.",
      "Vista do jogador (menu Executar) não é o modo Jogo: é o ecrã só para jogar, sem os editores.",
      "Botão direito na Escrita: Vincular mutação (Gaveta ou Entidade: CREATE ID / CREATE ID.tag / DESTROY), Inserir frase, ou Secção de regras (## regras … ## /regras). A mutação vai para a fatia # --- lume-anotacoes ---, não para o Markdown. /* nota */ continua nota. #combate é tag de prosa; #A8F2 é Quad-ID.",
      "Linha do tempo no preview: todas as mutações da entidade, por capítulo e linha. O snapshot é cloneWorldModel do mundo compilado do caderno, não do GameState de play. tem N de vida = stat (canónico hp); tem a espada = TEM. marcado como = tag.",
      "/ é OU nos gatilhos. Comentário só /* assim */ — tem de abrir e fechar. // é erro.",
    ],
    sample: `## regras
Quando o jogador é marcado como "combate":
  narre "O ferro canta."
## /regras
# --- lume-anotacoes ---
1 {"id":"a1","book":"book-0","heading":"A Espada","quote":"A lâmina pesa.","do":"CREATE TOCHA.object"}
2 {"id":"a2","book":"book-0","heading":"A Espada","quote":"A lâmina pesa.","do":"SET_STAT JOGADOR.hp 10"}
# --- /lume-anotacoes ---`,
  },
];
