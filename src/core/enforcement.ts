import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

/** Regras que falham sozinhas. A arquitectura não fica à espera de disciplina. */
export type Violacao = { regra: string; onde: string };

const LIMITE_DEUS = 400;

export const DEUSES = [
  "src/plugins/ide-state/lib/orchestrator.ts",
  "src/plugins/ide-ui/lib/components/IdeApp.tsx",
  "src/plugins/intent-engine/lib/resolver.ts",
  "src/plugins/multiplayer/lib/p2p.ts",
  "src/plugins/narrative-engine/lib/complete.ts",
  "src/plugins/narrative-engine/lib/query.ts",
  "src/plugins/narrative-engine/lib/rule-engine.ts",
  "src/plugins/narrative-engine/lib/world-model.ts",
  "src/plugins/notebook/lib/annotations.ts",
  "src/plugins/notebook/lib/comando.ts",
  "src/plugins/notebook/lib/notebook.ts",
  "src/plugins/notebook/lib/pages.ts",
  "src/plugins/notebook/ui/NotebookEditor.tsx",
];

export const MUTACAO_PERMITIDA = [
  "src/plugins/mutation-gateway/",
  "src/plugins/narrative-engine/",
  "src/plugins/notebook/lib/timeline.ts",
];

export function julgar(entrada: {
  importsNovos: string[];
  capabilityNaoDeclarada: string[];
  slotInexistente: string[];
  mutacaoDirecta: string[];
  iaNoMundo: string[];
  deusNovo: string[];
}): Violacao[] {
  const out: Violacao[] = [];
  for (const onde of entrada.importsNovos) out.push({ regra: "novo cross-plugin import", onde });
  for (const onde of entrada.capabilityNaoDeclarada) out.push({ regra: "capability não declarada", onde });
  for (const onde of entrada.slotInexistente) out.push({ regra: "slot inexistente", onde });
  for (const onde of entrada.mutacaoDirecta) out.push({ regra: "mutação direta do World", onde });
  for (const onde of entrada.iaNoMundo) out.push({ regra: "AI → World direto", onde });
  for (const onde of entrada.deusNovo) out.push({ regra: "novo God Object", onde });
  return out;
}

export function capabilityDeclarada(declaradas: readonly string[], nome: string): boolean {
  return declaradas.includes(nome);
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "__tests__" || name === "node_modules") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) out.push(path.replaceAll("\\", "/"));
  }
  return out;
}

function resolveSpec(from: string, spec: string): string {
  let path = join(dirname(from), spec).replaceAll("\\", "/");
  if (!path.endsWith(".ts") && !path.endsWith(".tsx")) {
    if (existsSync(path + ".ts")) path += ".ts";
    else if (existsSync(path + ".tsx")) path += ".tsx";
    else if (existsSync(path + "/index.ts")) path += "/index.ts";
  }
  return path;
}

function nomes(bloco: string): string[] {
  return [...bloco.matchAll(/name:\s*["']([^"']+)["']/g)].map((hit) => hit[1]!);
}

/** Lê a árvore e devolve cada regressão. Lista vazia é a arquitectura a cumprir-se. */
export function vigiar(root = "."): Violacao[] {
  const files = walk(join(root, "src/plugins"));
  const listed = new Set(
    readFileSync(join(root, "src/core/legacy-imports.txt"), "utf8").trim().split("\n").filter(Boolean),
  );
  const found = new Set<string>();
  for (const file of files) {
    const source = file.split("/plugins/")[1]?.split("/")[0];
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
      const target = resolveSpec(file, match[1]!);
      if (!target.includes("/plugins/")) continue;
      const rest = target.split("/plugins/")[1];
      const targetPlugin = rest?.split("/")[0];
      if (!targetPlugin || targetPlugin === source) continue;
      found.add(`${file.replace(/^\.\//, "")} -> ${rest}`);
    }
  }
  const importsNovos = [...found].filter((row) => !listed.has(row.replace(/^\.\//, "")));

  const capabilityNaoDeclarada: string[] = [];
  const slotInexistente: string[] = [];
  const provides = new Set<string>();
  const slots: { onde: string; capability: string }[] = [];
  for (const file of files) {
    if (!file.endsWith("/manifest.ts")) continue;
    const text = readFileSync(file, "utf8");
    const blocoProvides = /provides:\s*\[([\s\S]*?)\]/.exec(text)?.[1] ?? "";
    for (const nome of nomes(blocoProvides)) provides.add(nome);
    const blocoSlots = /slots:\s*\[([\s\S]*?)\]/.exec(text)?.[1] ?? "";
    for (const match of blocoSlots.matchAll(/name:\s*["']([^"']+)["'][\s\S]*?capability:\s*["']([^"']+)["']/g)) {
      slots.push({ onde: `${file}#${match[1]}`, capability: match[2]! });
    }
  }
  for (const file of files) {
    if (file.endsWith("/manifest.ts")) continue;
    const plugin = file.split("/plugins/")[1]?.split("/")[0];
    const manifest = files.find((item) => item.endsWith(`/plugins/${plugin}/manifest.ts`));
    if (!manifest) continue;
    const declaradas = new Set(nomes(/provides:\s*\[([\s\S]*?)\]/.exec(readFileSync(manifest, "utf8"))?.[1] ?? ""));
    for (const match of readFileSync(file, "utf8").matchAll(/registerCapability\(\{[\s\S]*?name:\s*["']([^"']+)["']/g)) {
      if (!declaradas.has(match[1]!)) capabilityNaoDeclarada.push(`${file}#${match[1]}`);
    }
  }
  for (const slot of slots) {
    if (!provides.has(slot.capability)) slotInexistente.push(slot.onde);
  }

  const mutacaoDirecta: string[] = [];
  const iaNoMundo: string[] = [];
  const deusNovo: string[] = [];
  const conhecidos = new Set(DEUSES);
  for (const file of files) {
    const rel = file.replace(/^\.\//, "");
    const text = readFileSync(file, "utf8");
    const linhas = text.split("\n").length;
    if (linhas > LIMITE_DEUS && !conhecidos.has(rel)) deusNovo.push(rel);
    if (rel.includes("/ai-runtime/") && (text.includes("applyChanges") || text.includes("worldModel.set"))) iaNoMundo.push(rel);
    if (!text.includes("applyChanges(")) continue;
    if (MUTACAO_PERMITIDA.some((prefix) => rel.startsWith(prefix) || rel === prefix)) continue;
    mutacaoDirecta.push(rel);
  }
  return julgar({ importsNovos, capabilityNaoDeclarada, slotInexistente, mutacaoDirecta, iaNoMundo, deusNovo });
}

