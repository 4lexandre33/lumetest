import { EXT_HOST_MANIFEST } from "../manifest.ts";
import { DENIED_METHODS } from "./kit.ts";
import type { HostInspect } from "../types.ts";

export type HostGrant = {
  capabilities: { name: string; version: string; provider: string; methods: string[]; api: Record<string, unknown> }[];
  slots: { name: string; capability: string }[];
  events: readonly string[];
  emit: (guest: string, topic: string, payload: unknown) => void;
  world: null;
};

const CAPACIDADES = ["NarrativeEngine", "IntentEngine", "IdeState", "RuleEffects", "RuleSemantics"] as const;

/** Só capability, slot e evento autorizados. Não recebe o kernel. */
export function vistaAutorizada(
  get: (name: string) => Record<string, unknown> | null,
  emit: (guest: string, topic: string, payload: unknown) => void,
): HostGrant {
  const capabilities = [];
  for (const name of CAPACIDADES) {
    const api = get(name);
    if (!api || typeof api !== "object") continue;
    capabilities.push({
      name,
      version: "1.0.0",
      provider: "autorizado",
      methods: Object.keys(api)
        .filter((method) => !(DENIED_METHODS as readonly string[]).includes(method))
        .sort(),
      api,
    });
  }
  const presentes = new Set(capabilities.map((item) => item.name));
  return {
    capabilities,
    slots: (EXT_HOST_MANIFEST.slots ?? []).filter((slot) => presentes.has(slot.capability)),
    events: [...(EXT_HOST_MANIFEST.permissions?.events ?? [])],
    emit,
    world: null,
  };
}

export function ver(grant: HostGrant): HostInspect {
  return {
    plugins: [],
    capabilities: grant.capabilities.map(({ name, version, provider, methods }) => ({ name, version, provider, methods })),
    slots: grant.slots.map((slot) => ({ ...slot })),
    events: [...grant.events],
    world: null,
  };
}
