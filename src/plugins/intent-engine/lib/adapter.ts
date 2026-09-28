import { descerMutacao } from "../../narrative-engine/index.ts";
import type { GameState } from "../../narrative-engine/types.ts";
import type { Intent, IntentExecution, ParseIntentOptions } from "../types.ts";
import { presentIntent } from "./present.ts";
import { resolveIntent, type QueryFn } from "./resolver.ts";
import { DRY_RUN_NOTICE } from "./notices.ts";
import { splitCommands } from "./parser.ts";
import { mapPhrase } from "./phrase.ts";

export type InteractFn = (state: GameState, triggerId: string) => GameState;

const INTENT_KEY = "intent";
const INTENT_PREFIX = "intent_";

function leafOperation(intent: Intent): string {
  return intent.operation[intent.operation.length - 1] ?? intent.family ?? "";
}

function pickTrigger(intent: Intent, resolvedArgs: Record<string, string>, actor: string, loc: string | null): string {
  const leaf = leafOperation(intent);
  if (leaf === "wait" || leaf === "inventory") return actor;
  if (leaf === "look") return loc ?? actor;
  return resolvedArgs.destination ?? resolvedArgs.target ?? resolvedArgs.object ?? resolvedArgs.receiver ?? actor;
}

function unchanged(game: GameState, resolution: ReturnType<typeof resolveIntent>): IntentExecution {
  return { resolution, game, executed: false };
}

/**
 * Revalidates, then:
 * - ACTION annotates the actor, calls interact(trigger), clears intent links
 * - PERCEIVE / COGNIZE present a beat without mutating the world
 * - `a; b` runs each command through this same function (no second engine)
 */
export function executeIntent(
  text: string,
  game: GameState,
  query: QueryFn,
  interact: InteractFn,
  options: ParseIntentOptions = {},
): IntentExecution {
  const hit = mapPhrase(text, game, options.scope);
  if (hit?.dryRun) {
    const resolution = resolveIntent(hit.command, game, query, options);
    return {
      resolution: { ...resolution, message: DRY_RUN_NOTICE },
      game,
      executed: false,
      dryRun: true,
    };
  }
  if (hit) text = hit.command;
  const parts = splitCommands(text);
  if (parts.length <= 1) return executeSingle(parts[0] ?? text, game, query, interact, options);
  let current = game;
  let last: IntentExecution | null = null;
  let any = false;
  for (const part of parts) {
    const result = executeSingle(part, current, query, interact, options);
    if (!result.executed) return { ...result, game: current, executed: any };
    any = true;
    current = result.game;
    last = result;
  }
  return last ?? unchanged(game, resolveIntent(text, game, query, options));
}

function executeSingle(
  text: string,
  game: GameState,
  query: QueryFn,
  interact: InteractFn,
  options: ParseIntentOptions,
): IntentExecution {
  const resolution = resolveIntent(text, game, query, options);
  if (resolution.status !== "VALID") return unchanged(game, resolution);

  const family = resolution.intent.family;
  if (family === "perceive" || family === "cognize") {
    const presented = presentIntent(resolution, game, options.scope);
    return {
      resolution,
      game: presented.game,
      executed: true,
      triggerId: presented.triggerId,
    };
  }
  if (family !== "action") return unchanged(game, resolution);

  const actorId = resolution.intent.actor || game.playerEntityId;
  const resolvedArgs = resolution.resolvedArgs ?? {};
  const loc = game.worldModel.get(actorId)?.links.current_location ?? null;
  const triggerId = pickTrigger(resolution.intent, resolvedArgs, actorId, loc);

  const leaf = leafOperation(resolution.intent);
  const linhas: string[] = [];
  if (leaf) linhas.push(`SET_LINK ${actorId}.softLinks.intent ${leaf}`);
  if (resolution.intent.family) linhas.push(`SET_LINK ${actorId}.softLinks.intent_family ${resolution.intent.family}`);
  for (const [name, value] of Object.entries(resolvedArgs)) {
    if (value) linhas.push(`SET_LINK ${actorId}.softLinks.intent_${name} ${value}`);
  }
  let world = game.worldModel;
  for (const line of linhas) {
    const decision = descerMutacao("intent", line, world, "");
    if (!decision.ok || !decision.world.get(actorId)) return unchanged(game, resolution);
    world = decision.world;
  }

  const next = interact({ ...game, worldModel: world }, triggerId);
  let cleared = next.worldModel;
  const actor = cleared.get(actorId);
  const keys = actor
    ? new Set([...Object.keys(actor.links), ...Object.keys(actor.softLinks), ...Object.keys(actor.hardLinks)])
    : new Set<string>();
  const apagar: string[] = [];
  if (keys.has(INTENT_KEY)) apagar.push(`UNLINK ${actorId}.${INTENT_KEY}`);
  for (const key of keys) if (key.startsWith(INTENT_PREFIX)) apagar.push(`UNLINK ${actorId}.${key}`);
  for (const line of apagar) {
    const decision = descerMutacao("intent", line, cleared, "");
    if (!decision.ok) return unchanged(game, resolution);
    cleared = decision.world;
  }

  return {
    resolution,
    game: { ...next, worldModel: cleared },
    executed: true,
    triggerId,
  };
}
