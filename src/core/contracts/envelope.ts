/**
 * Envelope — unidade de comunicação entre capabilities.
 * Não conhece narrativa.
 */
export type EnvelopeMode = "read" | "write" | "simulate";

export type Envelope<T = unknown> = {
  id: string;
  type: string;
  version: string;
  source: string;
  target?: string;
  capability?: string;
  slot?: string;
  payload?: T;
  correlationId: string;
  causationId?: string;
  timestamp: string;
  permissions: string[];
  context?: Record<string, unknown>;
  mode: EnvelopeMode;
};

export type DispatchResult<T = unknown> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/** Uma capability pequena: um método. */
export type CapabilityHandler = {
  capability: string;
  version: string;
  method: string;
  provider: string;
  handle: (payload: unknown) => unknown | Promise<unknown>;
};
