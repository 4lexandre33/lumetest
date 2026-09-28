import type { CapabilityHandler, DispatchResult, Envelope } from "../contracts/envelope.ts";

export class Dispatcher {
  private handlers = new Map<string, CapabilityHandler>();
  private slots = new Map<string, string>();

  register(handler: CapabilityHandler): void {
    const key = this.key(handler.capability, handler.version, handler.method);
    if (this.handlers.has(key)) throw new Error(`Handler ${key} already registered`);
    this.handlers.set(key, handler);
  }

  bind(plugin: string, slot: string, capability: string): void {
    this.slots.set(`${plugin}\0${slot}`, capability);
  }

  unbind(plugin: string): void {
    for (const key of this.slots.keys()) {
      if (key.startsWith(`${plugin}\0`)) this.slots.delete(key);
    }
  }

  resolve(envelope: Envelope, sourceActive: boolean): { handler: CapabilityHandler } | { error: string } {
    if (!envelope?.id || !envelope.type || !envelope.version || !envelope.source || !envelope.correlationId || !envelope.timestamp || !envelope.mode) {
      return { error: "envelope inválido" };
    }
    if (!envelope.permissions?.length) return { error: "sem permissão" };
    if (envelope.source !== "core" && !sourceActive) return { error: "plugin inactivo" };
    const capability = envelope.capability ?? (envelope.slot ? this.slots.get(`${envelope.source}\0${envelope.slot}`) : undefined);
    if (!capability) return { error: envelope.slot ? "slot desconhecido" : "capability desconhecida" };
    if (!envelope.permissions.includes(capability)) return { error: "sem permissão" };
    const handler = this.handlers.get(this.key(capability, envelope.version, envelope.type));
    if (!handler) return { error: "capability desconhecida" };
    return { handler };
  }

  async run(handler: CapabilityHandler, envelope: Envelope): Promise<DispatchResult> {
    try {
      return { ok: true, value: await handler.handle(envelope.payload) };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  list() {
    return [...this.handlers.values()].map((handler) => ({
      capability: handler.capability,
      version: handler.version,
      method: handler.method,
      provider: handler.provider,
    }));
  }

  private key(capability: string, version: string, method: string): string {
    return `${capability}@${version}#${method}`;
  }
}
