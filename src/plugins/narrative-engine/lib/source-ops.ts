import { compileRuleFile } from "./rule-engine.ts";
import { blankEntityBlock, canonicalEntityId, compileEntityFile, isCanonicalEntityId, isSystemEntityId } from "./world-model.ts";

export type SourceRange = { startLine: number; endLine: number };

/** Same marker the caderno writes; engine does not import notebook. */
const CADERNO_SLICE_OPEN = "# --- lume-caderno ---";

export function lineColumnFromOffset(source: string, offset: number): { line: number; column: number } {
  const clamped = Math.max(0, Math.min(offset, source.length));
  let line = 1;
  let col = 1;
  for (let i = 0; i < clamped; i++) {
    if (source[i] === "\n") {
      line += 1;
      col = 1;
    } else col += 1;
  }
  return { line, column: col };
}

export function offsetOfLine(source: string, line: number): number {
  if (line <= 1) return 0;
  let current = 1;
  for (let i = 0; i < source.length; i++) {
    if (source[i] === "\n") {
      current += 1;
      if (current === line) return i + 1;
    }
  }
  return source.length;
}

export function isValidEntityId(id: string): boolean {
  return isCanonicalEntityId(id) || isSystemEntityId(id);
}

export function uniqueId(base: string, taken: Iterable<string>): string {
  const set = new Set(taken);
  if (!set.has(base)) return base;
  let i = 2;
  while (set.has(`${base}_${i}`)) i += 1;
  return `${base}_${i}`;
}

export function locateEntityBlock(source: string, id: string): SourceRange | null {
  const lines = source.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();
    if (trimmed.startsWith("/*") || trimmed.startsWith(".") || trimmed.startsWith("#")) continue;
    const head = trimmed.split(/[.\s{(]/)[0];
    if (head === id || canonicalEntityId(head) === canonicalEntityId(id)) {
      if (trimmed.includes("{") && !trimmed.includes("}")) {
        let end = i;
        while (end + 1 < lines.length && !lines[end]!.includes("}")) end += 1;
        return { startLine: i + 1, endLine: end + 1 };
      }
      let end = i;
      while (end + 1 < lines.length && lines[end + 1]!.trim().startsWith(".")) end += 1;
      return { startLine: i + 1, endLine: end + 1 };
    }
  }
  return null;
}

export function locateRuleBlock(source: string, id: string): SourceRange | null {
  const compiled = compileRuleFile(source);
  const rule = compiled.rules.find((r) => r.id === id);
  if (!rule) return null;
  return { startLine: rule.startLine, endLine: rule.startLine + rule.source.split("\n").length - 1 };
}

/** Offset of the handwritten pad: before `start()`, else before the caderno slice, else EOF. */
export function handwrittenInsertAt(source: string): number {
  const sliceAt = source.indexOf(CADERNO_SLICE_OPEN);
  const regionEnd = sliceAt >= 0 ? sliceAt : source.length;
  const region = source.slice(0, regionEnd);
  const m = /(^|\n)start\(\)[ \t]*(?:\n|$)/.exec(region);
  if (!m) return regionEnd;
  return m.index + (m[1] === "\n" ? 1 : 0);
}

export function inCadernoSlice(source: string, offset: number): boolean {
  const start = source.indexOf(CADERNO_SLICE_OPEN);
  if (start < 0) return false;
  return offset >= start;
}

function joinParts(left: string, block: string, right: string): string {
  const l = left.replace(/\n+$/, "");
  const r = right.replace(/^\n+/, "");
  const mid = block.replace(/\n+$/, "") + "\n";
  if (!l && !r) return mid;
  if (!l) return `${mid}\n${r}`.replace(/\n+$/, "\n");
  if (!r) return `${l}\n\n${mid}`;
  return `${l}\n\n${mid}\n${r}`;
}

export function insertEntity(source: string, id = "@nova"): { source: string; id: string; line: number } {
  const taken = compileEntityFile(source).worldModel.keys();
  const seed = isCanonicalEntityId(id) ? id : canonicalEntityId(id);
  const nextId = uniqueId(seed, taken);
  const block = blankEntityBlock(nextId) + "\n";
  const at = handwrittenInsertAt(source);
  const next = joinParts(source.slice(0, at), block, source.slice(at));
  const loc = locateEntityBlock(next, nextId);
  return { source: next, id: nextId, line: loc?.startLine ?? 1 };
}

export function insertRule(source: string, id = "nova_regra"): { source: string; id: string; line: number } {
  const taken = compileRuleFile(source).rules.map((r) => r.id);
  const nextId = uniqueId(id, taken);
  const block = `# ${nextId}\non: ${nextId}\nnarrativa: "…"`;
  const at = handwrittenInsertAt(source);
  const next = joinParts(source.slice(0, at), block + "\n", source.slice(at));
  const loc = locateRuleBlock(next, nextId);
  return { source: next, id: nextId, line: loc?.startLine ?? 1 };
}

/** `@id.` / `start.` / `start` at `pos` → block. Inside the caderno slice, the block goes to the handwritten pad. */
export function expandEntityDecl(source: string, pos: number): { source: string; caret: number } | null {
  const lineStart = source.lastIndexOf("\n", pos - 1) + 1;
  const before = source.slice(lineStart, pos);
  const m = before.trim().match(/^(@?[\p{L}_][\p{L}\p{N}\p{M}_]*)\.$/u);
  if (!m) {
    if (!/^start$/i.test(before.trim())) return null;
    return { source: source.slice(0, pos) + "()" + source.slice(pos), caret: pos + 2 };
  }
  const id = m[1]!;
  const indent = before.match(/^\s*/)?.[0] ?? "";
  const from = lineStart + indent.length;
  if (id.toLowerCase() === "start" || id.toLowerCase() === "@start") {
    const next = source.slice(0, from) + "start()" + source.slice(pos);
    return { source: next, caret: from + "start()".length };
  }
  const block = blankEntityBlock(id);
  const nameAt = block.indexOf("name: ");
  const caretOff = nameAt >= 0 ? nameAt + "name: ".length : block.length;
  if (inCadernoSlice(source, from)) {
    const stripped = source.slice(0, from) + source.slice(pos);
    const at = handwrittenInsertAt(stripped);
    const next = joinParts(stripped.slice(0, at), block + "\n", stripped.slice(at));
    const insertedAt = next.indexOf(block);
    return { source: next, caret: (insertedAt >= 0 ? insertedAt : at) + caretOff };
  }
  const next = source.slice(0, from) + block + source.slice(pos);
  return { source: next, caret: from + caretOff };
}

export function deleteEntityBlock(source: string, id: string): string | null {
  const loc = locateEntityBlock(source, id);
  if (!loc) return null;
  const lines = source.split("\n");
  lines.splice(loc.startLine - 1, loc.endLine - loc.startLine + 1);
  return lines.join("\n");
}

export function deleteRuleBlock(source: string, id: string): string | null {
  const loc = locateRuleBlock(source, id);
  if (!loc) return null;
  const lines = source.split("\n");
  lines.splice(loc.startLine - 1, loc.endLine - loc.startLine + 1);
  return lines.join("\n");
}

export function searchSources(entities: string, rules: string, query: string): { file: "entities" | "rules"; line: number; column: number; text: string }[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const hits: { file: "entities" | "rules"; line: number; column: number; text: string }[] = [];
  const scan = (source: string, file: "entities" | "rules") => {
    source.split("\n").forEach((line, i) => {
      const idx = line.toLowerCase().indexOf(needle);
      if (idx >= 0) hits.push({ file, line: i + 1, column: idx + 1, text: line.trim() });
    });
  };
  scan(entities, "entities");
  scan(rules, "rules");
  return hits;
}

/** True when caret is inside a tags/stats/links list of an entity block. */
export function inEntityFieldList(source: string, offset: number): boolean {
  const before = source.slice(0, offset);
  const lastOpen = before.lastIndexOf("{");
  const lastClose = before.lastIndexOf("}");
  if (lastOpen < 0 || lastOpen < lastClose) return false;
  const chunk = before.slice(lastOpen);
  const m = chunk.match(/(tags|stats|flags|enums|phrases|hardLinks|softLinks|links|lists|fuses|struct|name|description)\s*:\s*([^;]*)$/i);
  return Boolean(m);
}

export function fieldListShouldComma(source: string, offset: number): boolean {
  if (!inEntityFieldList(source, offset)) return false;
  const prev = source[offset - 1] ?? "";
  return /[\p{L}\p{N}_]/u.test(prev);
}
