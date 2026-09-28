import { caretAnchor } from "../../notebook/index.ts";

export type MenuSeal = "entidade" | "gaveta" | "lei" | "frase";

const DRAWER = /^(name|description|templateId|tags|stats|flags|enums|hardLinks|softLinks|lists|fuses|struct)$/i;

export function menuOpens(source: string, offset: number, force = false): boolean {
  if (force) return true;
  return (source[Math.max(0, offset) - 1] ?? "") === ".";
}

export function menuSeal(label: string, kind: string): MenuSeal {
  const bare = label.replace(/:\s*$/, "").trim();
  if (kind === "id" || kind === "entity" || bare.startsWith("@")) return "entidade";
  if (kind === "phrase" || /^phrases?$/i.test(bare) || /^frases$/i.test(bare)) return "frase";
  if (kind === "tag" || kind === "stat" || kind === "link" || kind === "prop" || DRAWER.test(bare)) return "gaveta";
  return "lei";
}

export function menuDetail(detail?: string, documentation?: string): string {
  const line = (detail || documentation || "").split("\n")[0]?.trim() ?? "";
  return line || "—";
}

export function menuAnchor(
  source: string,
  offset: number,
  scroll: { scrollLeft: number; scrollTop: number } | null,
  gutter: number,
): { left: number; top: number } {
  const anchor = caretAnchor(source, offset, { linePx: 24, padTop: 16, gutter });
  return {
    left: Math.max(8, anchor.left - (scroll?.scrollLeft ?? 0)),
    top: Math.max(8, anchor.top - (scroll?.scrollTop ?? 0)),
  };
}
