import type { IrOperation } from "../../notebook/index.ts";

/** Provider opcional. O editor não importa este ficheiro. */
export type SmallModel = {
  id: string;
  act(sentence: string): IrOperation | null;
};

let current: SmallModel | null = null;

export function definirModelo(model: SmallModel | null): void {
  current = model;
}

export function modeloPequeno(): SmallModel | null {
  return current;
}
