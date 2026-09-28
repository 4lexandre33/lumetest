/**
 * Envelope — unidade de comunicação entre capabilities.
 * Não conhece narrativa.
 */
export type Envelope<T = unknown> = {
  id: string;
  type: string;
  version: string;
  source: string;
  target?: string;
  capability?: string;
  slot?: string;
  payload?: T;
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
