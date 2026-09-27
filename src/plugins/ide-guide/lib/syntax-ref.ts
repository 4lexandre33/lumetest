export type RefSection = { id: string; title: string; body: string[]; sample?: string };

export const SYNTAX_REF: RefSection[] = [
  {
    id: "bloco",
    title: "Bloco de entidade (FBE)",
    body: [
      "O id canónico é @ + minúsculas: @pessoa, @tocha, @caverna. Sem @, ou com maiúsculas (@Pessoa, JOGADOR), o editor marca E040. Ponto + Enter monta o bloco. Cada gaveta termina com ponto-e-vírgula; itens internos separam-se por vírgula.",
      "Quad-IDs: o slug (@pessoa) é a chave do mundo. id: no bloco é o shortCode gerado (#A8F2); o UUID fica escondido. templateId aponta para um protótipo usado em SPAWN. extra não é gaveta-base. CREATE ID ou CREATE ID.tag — o 2.º segmento é tag, nunca gaveta.",
    ],
    sample: `@dragao_anciao.{
  name: Dragão Ancião do Abismo;
  description: 'Uma besta ancestral envolta em chamas étereas.';
  tags: agent, vivo, chefe, voador, dragao;
  stats: hp=500[0..1000], mp=200, ataque=85;
  flags: em_combate=true, derrotado=false;
  enums: estado=[COMBATE, FUGA, MORTO], postura=[AGRESSIVO, NEUTRO];
  phrases: titulo='O Flagelo dos CÉUS';
  hardLinks: elemento_core=@coracao_dragao;
  softLinks: current_location=@pico_serpente, alvo_foco=@jogador;
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
      "stats — só número ou gauge: `hp=10`, `hp=10[0..100]`. flags — booleanos, sempre chave=true ou chave=false. enums — domínio fechado, pelo menos 2 estados: `estado=[COMBATE, FUGA, MORTO]`. O primeiro é o estado inicial. SET_ENUM só aceita um membro da lista. phrases — diálogos e títulos consultáveis.",
      "hardLinks — posse/composição: apagar o pai destrói os filhotes. softLinks — foco/posição: apagar o alvo faz null-reset (\"\") sem apagar o pai. Destino só ID ou #A8F2 (`alvo=@jogador`). links: legado vira softLinks.",
      "lists — inventários/filas, forma `nome=[a, b]`. PUSH, POP, REMOVE, CLEAR, ADD_UNIQUE. fuses — só `N` ou `N>alvo` (`sopro=2`, `sopro=2>@boom`). struct — objetos/matrizes aninhados.",
      "name / description — texto de topo para o jogador, não tags. {@astronoma.name} lê o campo. Se faltar, a Lume humaniza o id.",
    ],
  },
  {
    id: "taxonomia",
    title: "Taxonomia: filho → pai",
    body: [
      "A aba Taxonomia fica entre Entidades e Regras. Cada linha é uma herança: tag → pai. Só um pai por tag. Pai desconhecido vira raiz. Comentários só /* assim */.",
      "A entidade não ganha as tags do pai. @goblin com tags: goblin continua {goblin}. Consultas e regras on/if vêem os ancestrais: *.monster e *.agent casam.",
      "hidden nunca herda, e as tags escritas na entidade pai também não. As outras gavetas do pai — stats, flags, enums, phrases, hardLinks, softLinks, lists, fuses, struct — vêem-se em on:, if: e do:, e não aparecem no caderno da filha. A chave da filha ganha. Seta → ou ->. Ciclo, dois pais e linha inválida sublinham no caderno. Taxonomia vazia = motor antigo.",
      "A regra mais específica vence: on: @goblin > *.goblin > *.monster > *.creature.",
      "A árvore ao lado lista os pais. Clique para ver impacto: entidades que herdam e regras on/if que citam a tag. No depurador, Efetiva (padrão) vê ancestrais; Direta ignora a taxonomia.",
    ],
    sample: `goblin → monster
monster → agent

on: *.monster.!sleeping
text: "O goblin já acordou."`,
  },
  {
    id: "regras",
    title: "on · if · do · text",
    body: [
      "Canónico em minúsculas: on: if: do: text:. ON: IF: DO: continuam a compilar — o parser não distingue a caixa.",
      "on: o que o jogador clicou (id, filtro ou start). Sem on: a regra não existe.",
      "if: condição extra sobre o mundo agora. Pode haver vários if:; todos precisam ser verdadeiros.",
      "do: o que muda. Várias linhas. Acrescenta tag, tira tag, muda número, muda ligação, SPAWN, CREATE ID ou CREATE ID.tag, DESTROY, PUSH/POP de listas.",
      "text: o único parágrafo que o jogador lê.",
    ],
    sample: `on: @caverna.!explored
if: *.object.current_location=@jogador.illumination>5
do: @jogador.current_location=@caverna
text: "Você entra, com a tocha à frente."`,
  },
  {
    id: "estrelas",
    title: "*  $  !",
    body: [
      "* — qualquer entidade. *.place = qualquer uma com a tag place. *.object, *.agent, *.event, *.information, *.abstract funcionam igual.",
      "$ — a entidade que o jogador acabou de clicar (o gatilho). Em on: *.object, o $ é aquele objeto. {$.name} é o nome visível dele. $.current_location=@jogador põe o clicado no jogador.",
      "! — negação. @caverna.!explored = a caverna SEM a tag explored. *.object.!current_location=@jogador = objeto que NÃO está com o jogador.",
      "-tag no do: tira a tag: @goblin.-sleeping acorda o goblin.",
    ],
    sample: `on: *.object.!current_location=@jogador
do: $.current_location=@jogador
text: "Você pega {$.name}."`,
  },
  {
    id: "numeros",
    title: "Números: comparar e mudar",
    body: [
      "Na pergunta (on/if): illumination>5, hp<4, hp>=9, hp=0. Um = só (não precisa de ==; == também é aceito). Operadores: > < >= <= =.",
      "No do: hp=9 põe o valor; hp+2 soma; hp-1 diminui; hp*2 multiplica. Gauge [min..max] clamp automaticamente.",
      "Só stats (números) aceitam > < + - *. Links usam = : current_location=@caverna. flags usam true/false.",
    ],
    sample: `do: @jogador.hp+2
    @jogador.hp*2
    @jogador.hp-1`,
  },
  {
    id: "chaves",
    title: "Chaves { } na narrativa",
    body: [
      "Propriedade: {@astronoma.name} → o name da astrônoma. {@tocha.description}. {$.name} → o name de quem você clicou.",
      "Pergunta: {@jogador.hp>4? o coração disparado | com coragem}. Se a pergunta for verdadeira, usa a primeira frase; senão, a segunda.",
      "Ciclo, sem pergunta, só barras: {primeira | segunda | já cansou}. Cada clique seguinte avança a opção e para na última. Pontos dentro do texto são permitidos.",
    ],
    sample: `on: @zelador
text: "{O zelador sacode um pano. 'A lente está aí.' | 'Não peço a chave.' | Ele já varreu o suficiente.}"`,
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
      "No on:, if: e no do: compacto podes nomear a gaveta: @jogador.stats.hp>4, @jogador.flags.em_combate, @jogador.softLinks.alvo=@goblin, @jogador.tags.ferido, @jogador.phrases.titulo='Oi'.",
      "Sem gaveta o motor resolve como antes — tag, stat ou link conforme o que existir. #A8F2 no lugar do slug também é o mesmo alvo (Quad-ID).",
      "lists, fuses e struct não têm caminho compacto no do:. Listas usam PUSH/POP/REMOVE/CLEAR/ADD_UNIQUE. Fusíveis usam SET_FUSE.",
    ],
    sample: `on: @jogador.stats.hp>0
if: @jogador.flags.em_combate
do: @jogador.softLinks.current_location=@caverna
    @jogador.tags.explorado
    @jogador.stats.hp-1`,
  },
  {
    id: "nomeados",
    title: "do: nomeado",
    body: [
      "Os verbos nomeados são o mesmo do: compacto, com a gaveta implícita: ADD_TAG, REMOVE_TAG, SET_STAT, ADD_STAT, MUL_STAT, SET_FLAG, SET_ENUM, SET_LINK.",
      "No editor e no Vincular, o do: oferece só nomeados (mais PUSH/CLEAR/CREATE/DESTROY/SPAWN). Compacto (@jogador.ferido) continua a compilar no motor; STRUCT não sai do retrato.",
      "Buracos FBE: SET_PHRASE (phrases), UNLINK (parte o link sem DESTROY), SET_FUSE (turnos ou turnos>alvo). TICK continua um efeito, não uma mutação.",
      "A caixa não conta: set_flag @jogador.em_combate false = SET_FLAG @jogador.flags.em_combate false = @jogador.flags.em_combate=false.",
    ],
    sample: `do: ADD_TAG @jogador ferido
    SET_STAT @jogador.hp 10
    SET_PHRASE @jogador.titulo 'O herói'
    UNLINK @jogador.alvo
    SET_FUSE @bomba.estouro 3>@boom`,
  },
  {
    id: "ramos",
    title: "/ e ()",
    body: [
      "/ é OU. on: @jogador / @goblin casa qualquer um dos dois. O ponto liga mais forte do que /: @jogador.vivo / @goblin.vivo.",
      "() agrupam. (@jogador / @goblin).vivo distribui o sufixo pelos dois ramos. @jogador.(vivo / morto) é OU só nas cláusulas.",
      "A especificidade de um OU é a do ramo mais fraco, para @jogador / *.object não roubar o clique ao id. Comentário só /* assim */ — tem de abrir e fechar. // já não é comentário: / é OU.",
    ],
    sample: `on: @jogador / @goblin
if: (*.agent / *.object).vivo
text: "Alguém vivo responde."`,
  },
  {
    id: "posse",
    title: "(link) · TEM · NAO_TEM",
    body: [
      "(link @jogador.alvo) no on:/if: é um passeio: casa a entidade para onde o link aponta. (link $.current_location) parte de quem foi clicado. Link vazio ou em falta não casa ninguém.",
      "Depois de =, (link X.y) continua a ser valor, como sempre. (link / @goblin) é agrupamento, não passeio — falta o ponto da chave.",
      "TEM e NAO_TEM perguntam se o detentor tem o item no conteúdo: current_location, in, ou uma lists do detentor. Um link qualquer (alvo, foco) não conta. NÃO_TEM e nao_tem são o mesmo. TEM @espada no gatilho é $ TEM @espada. TEM sozinho não parseia.",
      "No caderno, «Quando o jogador tem a espada» vira on: @jogador TEM @espada. «Se o jogador não tem a tocha» vira if: @jogador NAO_TEM @tocha. «Ele tem 100 de vida» no retrato continua stat, não matcher.",
    ],
    sample: `on: (link @jogador.alvo).vivo
if: @jogador TEM @espada
if: @jogador NAO_TEM @pedra
text: "A lâmina está na tua mão."`,
  },
  {
    id: "escrita",
    title: "Manuscrito",
    body: [
      "Um manuscrito. O que abre é o caderno. Entidades, leis e taxonomia são painéis do motor, não modos. Não há interruptor Escrita | Jogo.",
      "A leitura mostra a prosa até a linha do cursor, não a fonte: sem capa, sem cerca ## regras, sem fatia e sem nota. Ler mostra o caderno inteiro nessa mesma prosa, sem parar na linha; não grava e não aplica sempre. Até aqui volta ao corte. Uma linha que começa por > é um comando: > help lista e a linha sai; um comando desconhecido fica. > ent.create @id cria a entidade no editor; ent.show, ent.list e ent.delete mostram, listam e apagam. id.rename @id 'nome' e id.describe @id 'texto' mudam o bloco. Texto só entre ' '. > mut.set.stats @id.chave 3, mut.add.stats, mut.sub.stats, mut.flag.on @id chave, mut.flag.off, mut.enum @id.chave estado, mut.text @id.chave 'texto', mut.push.list, mut.pull.list, e set ou pull nas outras gavetas, viram anotação: a linha sai e o ¹ fica na prosa de cima. > inst.mark @id marca o molde. inst.create @id cria @id_1 com o nome e as gavetas; a segunda é @id_2. inst.create @id stats.chave=N cobre esse número. inst.list lista. inst.destroy @id_1 apaga a cópia, não o molde. O molde não entra na cena. > inst.sync @id_1 traz as chaves intactas do molde; a chave que a cópia mudou fica. inst.unset @id_1 stats.chave devolve essa chave. inst.reparent @id_1 @outro muda o molde e mantém as chaves tocadas. Um molde pode apontar a outro, um nível só. Se o molde se foi, a cópia fica como está. > link.set.chave @origem @destino grava a ligação dura e vira anotação; link.add.chave é a branda. link.pull.chave @origem @destino e link.clear.chave @origem tiram. link.from @id, link.to @id.chave, link.where @id e link.tree @id só mostram. > kno.learn @id 'fato' guarda na lista sabe. kno.forget @id 'fato' tira. kno.show @id e kno.at @id mostram o que ela sabe agora. > que.where @id mostra as ligações e que.where.chave @id só essa. que.when gaveta.chave=valor acha quem casa. que.at @id mostra o estado agora. que.knowledge @id mostra o que ela sabe. que.timeline @id.gaveta.chave mostra o valor agora. > sea.find 'texto' busca nas entidades. a,b pede as duas, a/b uma ou outra, a|b só uma, !a exclui. sea.in tag 'texto' limita à tag. sea.tag nome lista quem a tem. sea.help mostra isso. > aud mostra o que não fecha: ligação sem destino ou para si, código repetido, cópia sem molde, pavio sem alvo e @id solto. aud.links, aud.identities, aud.instances, aud.continuity e aud.references separam. Ler não mostra essa linha. O mundo desta linha continua ao lado: a prosa e as mutações até aqui, mais as entidades do motor. O menu do caderno usa esse mesmo mundo. Quem a prosa ainda não criou não aparece. Mutação depois desta linha não vale. Uma lei que casa com a linha é uma proposta: Aceitar grava o do na fatia; Recusar esconde-a nesta linha e não apaga a lei. Uma linha `sempre` antes de Quando ou Se aplica a mudança sozinha; se o mundo desta linha já diz o contrário, a leitura avisa e não troca. Clique em ¹ ² ³ para o histórico da entidade (L nº, pôr/tirar). Ver entidade mostra as 10 gavetas no painel direito. Tags #combate (cerca ## regras) abrem N sugestões. Sem beat.",
      "Botão direito no caderno: Vincular mutação (Gaveta ou Entidade: CREATE ID / CREATE ID.tag / DESTROY), Biblioteca (moldes de ## moldes e frases do projecto), ou Secção de regras (## regras … ## /regras). Secção de moldes abre ## moldes … ## /moldes. A mutação vai para a fatia # --- lume-anotacoes ---, não para o Markdown. /* nota */ continua nota. #combate é tag de prosa; #A8F2 é Quad-ID.",
      "Linha do tempo no preview: todas as mutações da entidade, por capítulo e linha. O snapshot é cloneWorldModel do mundo compilado do caderno, não do GameState de play. tem N de vida = stat (canónico hp); tem a espada = TEM. marcado como = tag.",
      "/ é OU nos gatilhos. Comentário só /* assim */ — tem de abrir e fechar. // é erro.",
    ],
    sample: `## regras
Quando o jogador é marcado como "combate":
  narre "O ferro canta."
## /regras
# --- lume-anotacoes ---
1 {"id":"a1","book":"book-0","heading":"A Espada","quote":"A lâmina pesa.","do":"CREATE @tocha.object"}
2 {"id":"a2","book":"book-0","heading":"A Espada","quote":"A lâmina pesa.","do":"SET_STAT @jogador.hp 10"}
# --- /lume-anotacoes ---`,
  },
  {
    id: "editor",
    title: "Editor de entidades",
    body: [
      "Escreve @pessoa. e Enter: a Lume monta o bloco com id: #shortCode e as 10 gavetas vazias. start. ou start + Enter vira start(). Sem @, ou com maiúsculas, o editor marca E040.",
      "Nova entidade (menu Editar / árvore) insere @nova antes de start(), fora da fatia # --- lume-caderno ---. A fatia é do caderno; o sítio à mão é a linha em branco acima de start().",
      "Sugestões: um menu no cursor, só com ponto (.) ou Ctrl+Espaço. Nome, uma linha e selo (entidade, gaveta, lei, frase). Enter substitui o trecho. Um ponto, um nível: `tags.` só as chaves dessa entidade (`herdada` se veio do pai); `on.` os gatilhos; `if.` as condições; `do.` um verbo, depois a entidade, a chave e só o valor legal. Na prosa, `.` lista entidades, `frases` e as leis desta linha. Tab depois de tags/on/if/do ainda completa os dois-pontos. Espaço depois de um item na gaveta põe vírgula.",
      "Texto só entre aspas simples ' '. \"duplas\" é E041; sem aspas em name/description/phrases é E042. flags sempre chave=true ou chave=false. enums sempre nome=[a, b], pelo menos 2; o primeiro é o estado inicial. lists sempre nome=[a, b]. fuses só N ou N>@alvo. Comentário só /* assim */ — tem de abrir e fechar.",
    ],
    sample: `@guarda.{
  id: #A1B2;
  name: Guarda;
  description: 'Um homem à porta.';
  tags: agent, vivo;
  stats: hp=10[0..10], forca=12;
  flags: alerta=true, dormindo=false;
  enums: posto=[SENTINELA, RONDA];
  phrases: fala='Alto lá.';
  hardLinks: arma=@alabarda;
  softLinks: current_location=@portao;
  lists: bolso=['chave', 2];
  fuses: ronda=3>@alarme;
  struct: visao='norte:1,sul:0';
}

start()`,
  },
  {
    id: "caderno",
    title: "Caderno (língua humana)",
    body: [
      "CADERNO: título na primeira linha. ### abre capítulo. A prosa vira mundo no Enter: a fatia # --- lume-caderno --- aparece no editor de entidades, abaixo de start().",
      "Tipo: Alexandre é um Agent. / objeto / lugar / npc / abstrato / evento / informação. Aspas opcionais: 'A Espada Enferrujada' é um objeto. Pronome Ele/Ela aplica-se ao último sujeito. é um humano (não-tipo) vira tag extra.",
      "Retrato: Ele tem 10 de vida. → hp=10. Ele tem força: 12. → stats. Ele está na Caverna. → current_location. pertence / é dono / contém / carrega ligam as entidades. Template \"NPC Comum\": lista indentada.",
      "Regras no caderno: Quando o jogador pega a espada: / Se / narre \"…\" / cause 3 de dano ao goblin / marque o goblin como \"ferido\". Entenda \"pega [algo]\" como take. Cerca ## regras … ## /regras isola regras sem criar entidades da prosa.",
      "No caderno, botão direito: Vincular mutação (Pôr/Tirar nas 10 gavetas, ou CREATE @id / CREATE @id.tag / DESTROY), Biblioteca, Secção de regras, Secção de moldes. ¹ ² ³ ficam ao lado da palavra. A mutação vai para # --- lume-anotacoes ---, não para o Markdown.",
    ],
    sample: `CADERNO: A Caverna
### A Espada
A espada é um objeto.
A espada está na caverna.
O jogador tem 10 de vida.

Quando o jogador pega a espada:
  narre "O ferro canta."
  cause 1 de dano ao jogador
  marque o jogador como "armado"

## regras
Quando o jogador é marcado como "combate":
  narre "A sala estreita."
## /regras`,
  },
  {
    id: "metodos",
    title: "Todos os métodos do editor de regras",
    body: [
      "Cabeçalho: on: (obrigatório) · if: (0..N, todos verdadeiros) · do: (0..N linhas) · text: (o parágrafo). Canónico em minúsculas; ON: IF: DO: compilam.",
      "Gatilho on:/if:: @id · *.tag · $.campo · !negação · / OU · () grupo · TEM @item · NAO_TEM @item · (link @id.chave) passeio. Compacto com gaveta: @jogador.stats.hp>4.",
      "do: nomeado — ADD_TAG, REMOVE_TAG, SET_STAT, ADD_STAT, MUL_STAT, SET_FLAG, SET_ENUM, SET_LINK, SET_PHRASE, UNLINK, CLEAR_LINK, SET_FUSE, PUSH, POP, REMOVE, CLEAR, ADD_UNIQUE, CREATE, DESTROY, SPAWN.",
      "do: compacto — @id.tag põe tag; @id.-tag tira; @id.hp=9 / +2 / -1 / *2; @id.current_location=@sala. Equivale ao nomeado. A caixa não conta.",
      "Mundo: CREATE @fumaça · CREATE @tocha.object · DESTROY @tocha · SPAWN @guarda_2 FROM @guarda. Listas: PUSH/POP/REMOVE/CLEAR/ADD_UNIQUE @id.lista item. Fusível: SET_FUSE @bomba.estouro 3 ou 3>@boom.",
    ],
    sample: `on: @porta / *.object
if: @jogador TEM @chave
if: (link @jogador.alvo).vivo
do: ADD_TAG @porta aberta
    REMOVE_TAG @porta trancada
    SET_STAT @jogador.hp 10
    ADD_STAT @jogador.hp 2
    MUL_STAT @jogador.medo 2
    SET_FLAG @jogador.alerta true
    SET_ENUM @porta.estado ABERTA
    SET_LINK @jogador.softLinks.current_location @sala
    SET_PHRASE @guarda.fala 'Passa.'
    UNLINK @jogador.alvo
    SET_FUSE @bomba.estouro 3>@boom
    PUSH @jogador.bolso chave
    ADD_UNIQUE @jogador.bolso chave
    CREATE @fumaca.abstract
    SPAWN @guarda_2 FROM @guarda
text: "A porta cede. {@jogador.hp>4? O peito alivia. | Ainda tontas.}"`,
  },
  {
    id: "efeitos",
    title: "WAIT · TICK · LIVE e irmãos",
    body: [
      "WAIT 3.@fuse_porta — cria um processo com 3 turnos. Não dispara já. Não é relógio de parede.",
      "TICK — tira 1 a todos os WAIT e fusíveis. A 0, corre o on: desse id. Não é a regra do fusível.",
      "LIVE @goblin — no mesmo beat, corre esse id. LIVE sem id corre até 4 entidades vivo no mesmo sítio. Não é segundo motor.",
      "EMIT @alarme — garante uma entidade tags: event e corre o on: dela. Não é evento de plataforma.",
      "INTENT @goblin.attack.@jogador — dispara um comando de intenção. Não muda o mundo se a intenção for inválida.",
      "KNOW @jogador.@segredo — põe a tag knows_@segredo no agent. Não cria entidade information.",
      "THEN @corredor — no mesmo beat, corre esse id. THEN $ corre o clicado. Não cria entidade.",
    ],
    sample: `on: @alavanca
do: WAIT 3.@fuse_porta
text: "A engrenagem queixa-se."

on: @turno
do: TICK

on: @sinal
do: LIVE @goblin

on: @sala
do: LIVE

on: @botao
do: EMIT @alarme

on: @ordem
do: INTENT @goblin.attack.@jogador

on: @livro
do: KNOW @jogador.@segredo

on: @porta
do: THEN @corredor

on: @eco
do: THEN $`,
  },
];

export function syntaxRefMarkdown(): string {
  const lines = [
    "# Lume — guia da linguagem",
    "",
    "Documento completo para usar a ferramenta: editor de entidades, editor de regras e caderno. Todos os métodos, com exemplos.",
    "",
  ];
  for (const section of SYNTAX_REF) {
    lines.push(`## ${section.title}`, "");
    for (const para of section.body) lines.push(para, "");
    if (section.sample) {
      lines.push("```", section.sample.replace(/\n$/, ""), "```", "");
    }
  }
  return lines.join("\n");
}