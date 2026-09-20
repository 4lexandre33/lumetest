import type { Project } from "../../narrative-engine/types.ts";

export const KIT_MARK = "# kit:adventure";

export const ADVENTURE_TAXONOMY = `${KIT_MARK}
portable → object
fixture → object
container → object
openable → object
lockable → openable
topic → information
`;

export const ADVENTURE_RULES = `# take
ON: *.portable
IF: @jogador.intent=take
IF: $.!current_location=@jogador
DO: $.current_location=@jogador
SEMANTIC: transformation
narrativa: "Você pega {$.name}."

# take fixture
ON: *.fixture
IF: @jogador.intent=take
SEMANTIC: constraint
narrativa: "Isso não sai daqui."

# drop
ON: *.portable.current_location=@jogador
IF: @jogador.intent=drop
DO: $.current_location=(link @jogador.current_location)
SEMANTIC: transformation
narrativa: "Você larga {$.name}."

# put into closed container
ON: *.container.!aberta
IF: @jogador.intent=put
SEMANTIC: constraint
narrativa: "Está fechado."

# put
ON: *.container
IF: @jogador.intent=put
DO: (link @jogador.intent_object).current_location=$
SEMANTIC: transformation
narrativa: "Você guarda isso em {$.name}."

# open locked
ON: *.openable.!aberta.locked
IF: @jogador.intent=open
SEMANTIC: constraint
narrativa: "Está trancado."

# open
ON: *.openable.!aberta
IF: @jogador.intent=open
DO: $.aberta
SEMANTIC: transformation
narrativa: "Você abre {$.name}."

# close
ON: *.openable.aberta
IF: @jogador.intent=close
DO: $.-aberta
SEMANTIC: transformation
narrativa: "Você fecha {$.name}."

# lock while open
ON: *.lockable.aberta
IF: @jogador.intent=lock
SEMANTIC: constraint
narrativa: "Fecha primeiro."

# lock
ON: *.lockable.!locked
IF: @jogador.intent=lock
DO: $.locked
SEMANTIC: transformation
narrativa: "Você tranca {$.name}."

# unlock
ON: *.lockable.locked
IF: @jogador.intent=unlock
DO: $.-locked
SEMANTIC: transformation
narrativa: "Você destranca {$.name}."

# go
ON: *.place
IF: @jogador.intent=go
DO: @jogador.current_location=$
SEMANTIC: transformation
narrativa: "Você vai para {$.name}."

# move
ON: *.place
IF: @jogador.intent=move
DO: @jogador.current_location=$
SEMANTIC: transformation
narrativa: "Você vai para {$.name}."

# look
ON: *.place
IF: @jogador.intent=look
SEMANTIC: cognition
narrativa: "Você olha {$.name}."

# inventory
ON: *.agent
IF: @jogador.intent=inventory
SEMANTIC: cognition
narrativa: "Você revê o que carrega."

# talk
ON: *.agent
IF: @jogador.intent=talk
SEMANTIC: agency
narrativa: "{$.name} não tem nada a dizer."

# communicate
ON: *.agent
IF: @jogador.intent=communicate
SEMANTIC: agency
narrativa: "{$.name} não tem nada a dizer."

# ask
ON: *.agent
IF: @jogador.intent=ask
SEMANTIC: agency
narrativa: "{$.name} não sabe disso."

# tell
ON: *.agent
IF: @jogador.intent=tell
SEMANTIC: agency
narrativa: "{$.name} ouve em silêncio."

# bye while talking
ON: *.agent.falando
IF: @jogador.intent=bye
DO: $.-falando
SEMANTIC: agency
narrativa: "A conversa termina."

# bye
ON: *.agent
IF: @jogador.intent=bye
SEMANTIC: agency
narrativa: "Não estavam a falar."
`;

const CHILD_RE = /^([\p{L}_][\p{L}\p{N}\p{M}_]*)\s*(→|->)/u;

function declaredChildren(source: string): Set<string> {
  const out = new Set<string>();
  for (const line of source.split(/\r?\n/)) {
    const m = line.trim().match(CHILD_RE);
    if (m?.[1]) out.add(m[1]);
  }
  return out;
}

function mergeTaxonomy(existing: string, kit: string): string {
  if (existing.includes(KIT_MARK)) return existing;
  const skip = declaredChildren(existing);
  const kept = kit.split(/\r?\n/).filter((line) => {
    const m = line.trim().match(CHILD_RE);
    if (m?.[1] && skip.has(m[1])) return false;
    return true;
  });
  const body = kept.join("\n").trim();
  if (!body) return existing;
  return existing.trim() ? `${existing.trimEnd()}\n\n${body}\n` : `${body}\n`;
}

function mergeRules(existing: string, kit: string): string {
  return existing.trim() ? `${existing.trimEnd()}\n\n${kit.trim()}\n` : `${kit.trim()}\n`;
}

export function kitApplied(project: Project): boolean {
  return project.taxonomySource.includes(KIT_MARK);
}

export function applyAdventureKit(project: Project): Project {
  if (kitApplied(project)) return project;
  return {
    ...project,
    taxonomySource: mergeTaxonomy(project.taxonomySource, ADVENTURE_TAXONOMY),
    rulesSource: mergeRules(project.rulesSource, ADVENTURE_RULES),
  };
}
