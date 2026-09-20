import { createProject, type Project } from "./project.ts";

export type ExampleMeta = { id: string; name: string; genre: string; blurb: string; teaches: string };

export const EXAMPLE_CATALOG: ExampleMeta[] = [
  {
    id: "goblin-cave",
    name: "Caverna do Goblin",
    genre: "Aventura",
    blurb: "Tocha, escuridão, um goblin que não devia ser acordado.",
    teaches: "Tags, taxonomia, stats, links, IF, @jogador.intent.",
  },
  {
    id: "planetarium",
    name: "Planetário das Nove",
    genre: "Astronomia",
    blurb: "A cúpula está morta. A astrônoma pede a carta e a lente.",
    teaches: "{ENTIDADE.name}, $.name, relíquias, ciclo {a | b | c}, IF intent.",
  },
];

const GOBLIN_ENTITIES = `@jogador.{
tags: agent;
stats: fear=0, courage=1;
links: current_location=@entrada;
}

@entrada.{
tags: place;
stats: ;
links: ;
name: Boca da caverna;
description: A pedra fria da entrada.
}

@trilha.{
tags: place;
stats: ;
links: ;
name: Trilha da floresta;
}

@caverna.{
tags: place, dark;
stats: ;
links: ;
name: Caverna;
}

@goblin.{
tags: goblin, sleeping;
stats: ;
links: current_location=@caverna;
name: Goblin;
}

@isqueiro.{
tags: object;
stats: illumination=2;
links: current_location=@jogador;
name: Isqueiro;
description: Um isqueiro gasto.
}

@tocha.{
tags: object;
stats: illumination=7;
links: current_location=@entrada;
name: Tocha;
description: Uma tocha no chão.
}

@ouro.{
tags: object, quest_item;
stats: ;
links: current_location=@caverna, guarded_by=@goblin;
name: Saco de ouro;
}

start()
`;

const GOBLIN_RULES = `# start
ON: start
narrativa: "A boca da caverna se abre à sua frente. A {@tocha.name} está no chão, ao lado de um isqueiro gasto."

# escuro demais
ON: *.place.dark
IF: @jogador.!current_location=$
IF: *.object.current_location=@jogador.illumination<6
narrativa: "Está escuro demais para entrar aí."

# entrar com luz
ON: @caverna.!explored
IF: *.object.current_location=@jogador.illumination>5
DO: @jogador.current_location=@caverna.fear+2
    @caverna.explored
narrativa: "Você entra, {@jogador.fear>4? o coração disparado | com coragem}. Um ronco horrível ecoa."

# cutucar goblin
ON: @goblin.sleeping
DO: @goblin.-sleeping
    @jogador.fear=9
narrativa: "Nunca se deve cutucar a onça com vara curta."

# atacar goblin
ON: @goblin.sleeping
IF: @jogador.intent=attack
DO: @goblin.-sleeping
    @jogador.fear=9
narrativa: "Nunca se deve cutucar a onça com vara curta."

# falar com goblin
ON: @goblin.sleeping
IF: @jogador.intent=talk
narrativa: "O goblin ronca. Melhor não cutucá-lo."

# comunicar com goblin
ON: @goblin.sleeping
IF: @jogador.intent=communicate
narrativa: "O goblin ronca. Melhor não cutucá-lo."

# goblin acordado
ON: *.monster.!sleeping
narrativa: "O goblin olha para você. Não deveria ter acordado."

# atacar goblin acordado
ON: *.monster.!sleeping
IF: @jogador.intent=attack
narrativa: "O goblin olha para você. Não deveria ter acordado."

# falar com goblin acordado
ON: *.monster.!sleeping
IF: @jogador.intent=talk
narrativa: "O goblin rosna. Não parece de conversa."

# comunicar com goblin acordado
ON: *.monster.!sleeping
IF: @jogador.intent=communicate
narrativa: "O goblin rosna. Não parece de conversa."

# pegar objeto
ON: *.object.!current_location=@jogador
DO: $.current_location=@jogador
narrativa: "Você pega {$.name}."

# pegar com intent
ON: *.object.!current_location=@jogador
IF: @jogador.intent=take
DO: $.current_location=@jogador
narrativa: "Você pega {$.name}."

# andar
ON: *.place
DO: @jogador.current_location=$
narrativa: "Você vai para {$.name}."

# andar com intent
ON: *.place
IF: @jogador.intent=move
DO: @jogador.current_location=$
narrativa: "Você vai para {$.name}."
`;

const PLANET_ENTITIES = `@jogador.{
tags: agent;
stats: ;
links: current_location=@cupoula;
}

@cupoula.{
tags: place, morta;
stats: ;
links: ;
name: Cúpula;
description: A cúpula do planetário. Sem luz.
}

@sala_cartas.{
tags: place;
stats: ;
links: ;
name: Sala das cartas;
}

@astronoma.{
tags: agent;
stats: ;
links: current_location=@cupoula;
name: Astrônoma;
description: Não levanta a luneta.
}

@zelador.{
tags: agent;
stats: ;
links: current_location=@sala_cartas;
name: Zelador;
}

@carta.{
tags: carta;
stats: ;
links: current_location=@sala_cartas;
name: Carta do céu;
}

@lente.{
tags: lente;
stats: ;
links: current_location=@sala_cartas;
name: Lente;
}

start()
`;

const PLANET_RULES = `# start
ON: start
narrativa: "A sessão das nove não começou. A {@astronoma.name} não levanta a luneta. 'A cúpula está morta. Traga a carta. Traga a lente.'"

# astrônoma ciclo
ON: @astronoma
narrativa: "{Ela não se vira. 'A carta. A lente.' | 'Sem as duas, a cúpula continua morta.' | Ela já disse o que precisava.}"

# falar com astrônoma
ON: @astronoma
IF: @jogador.intent=talk
narrativa: "{Ela não se vira. 'A carta. A lente.' | 'Sem as duas, a cúpula continua morta.' | Ela já disse o que precisava.}"

# comunicar com astrônoma
ON: @astronoma
IF: @jogador.intent=communicate
narrativa: "{Ela não se vira. 'A carta. A lente.' | 'Sem as duas, a cúpula continua morta.' | Ela já disse o que precisava.}"

# zelador ciclo
ON: @zelador
narrativa: "{O zelador sacode um pano. 'A lente está aí, embaixo da poeira.' | 'Não peço a chave. A cúpula é que pede.' | Ele já varreu o suficiente.}"

# falar com zelador
ON: @zelador
IF: @jogador.intent=talk
narrativa: "{O zelador sacode um pano. 'A lente está aí, embaixo da poeira.' | 'Não peço a chave. A cúpula é que pede.' | Ele já varreu o suficiente.}"

# comunicar com zelador
ON: @zelador
IF: @jogador.intent=communicate
narrativa: "{O zelador sacode um pano. 'A lente está aí, embaixo da poeira.' | 'Não peço a chave. A cúpula é que pede.' | Ele já varreu o suficiente.}"

# acender cúpula
ON: @cupoula.morta
IF: @carta.current_location=@jogador
IF: @lente.current_location=@jogador
DO: @cupoula.-morta
narrativa: "A {@astronoma.name} encaixa a {@lente.name} na luneta. O céu da {@cupoula.name} acende sobre vocês."

ON: @cupoula.morta
narrativa: "A cúpula continua morta. Falta a carta e a lente."

ON: *.object.!current_location=@jogador
DO: $.current_location=@jogador
narrativa: "Você pega {$.name}."

# pegar com intent
ON: *.object.!current_location=@jogador
IF: @jogador.intent=take
DO: $.current_location=@jogador
narrativa: "Você pega {$.name}."

ON: *.relic.current_location=@jogador
narrativa: "A relíquia {$.name} brilha na palma. Ainda é um objeto — e a cúpula precisa dela."

ON: *.place
DO: @jogador.current_location=$
narrativa: "Você vai para {$.name}."

# andar com intent
ON: *.place
IF: @jogador.intent=move
DO: @jogador.current_location=$
narrativa: "Você vai para {$.name}."
`;

export function createExampleProject(id: string): Project {
  if (id === "planetarium") {
    return createProject("Planetário das Nove", {
      id: "planetarium",
      entitiesSource: PLANET_ENTITIES,
      taxonomySource: `/* relíquias do planetário */
carta → relic
lente → relic
relic → object
`,
      rulesSource: PLANET_RULES,
      extras: {},
      settings: { playerEntityId: "@jogador", debug: true },
    });
  }
  return createProject("Caverna do Goblin", {
    id: "goblin-cave",
    entitiesSource: GOBLIN_ENTITIES,
    taxonomySource: `/* criaturas */
goblin → monster
monster → agent
`,
    rulesSource: GOBLIN_RULES,
    extras: {},
    settings: { playerEntityId: "@jogador", debug: true },
  });
}
