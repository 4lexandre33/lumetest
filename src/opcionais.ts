/** Continuam no código. Não são obrigatórios. O destino é o da especificação. */
export type Opcional = {
  id: "kits" | "mapa" | "sentidos" | "sift" | "processo" | "vida" | "multiplayer";
  plugin: string;
  capability: string;
  destino: string;
};

export const OPCIONAIS: readonly Opcional[] = [
  { id: "kits", plugin: "lume-kit-adventure", capability: "AdventureKit", destino: "pacote de regras opcionais" },
  { id: "kits", plugin: "lume-kit-social", capability: "SocialKit", destino: "pacote de domínio social" },
  { id: "kits", plugin: "lume-kit-channel", capability: "ChannelKit", destino: "pacote de canais narrativos" },
  { id: "kits", plugin: "lume-kit-combat", capability: "CombatKit", destino: "pacote opcional de combate" },
  { id: "kits", plugin: "lume-kit-prose", capability: "Prose", destino: "prose-presentation, recap, narrative-display" },
  { id: "mapa", plugin: "lume-spatial", capability: "Spatial", destino: "mapa; consome WorldQuery e WorldMutation" },
  { id: "sentidos", plugin: "lume-senses", capability: "Senses", destino: "scope, perception, visibility, hearing, touch" },
  { id: "sift", plugin: "lume-sift", capability: "Sift", destino: "pattern analysis, story filtering" },
  { id: "processo", plugin: "lume-process", capability: "Process", destino: "processamento temporal explícito" },
  { id: "vida", plugin: "lume-life", capability: "Life", destino: "comportamento opt-in no estado existente" },
  { id: "multiplayer", plugin: "lume-multiplayer", capability: "Multiplayer", destino: "opcional e isolado" },
];

export function pluginsOpcionais(): string[] {
  return OPCIONAIS.map((item) => item.plugin);
}
