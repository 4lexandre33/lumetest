export type BootNode = {
  name: string;
  provides: string[];
  requires: string[];
};

/** Ordena pelo manifesto. Sem aresta, fica a ordem de registo. */
export function ordemDeBoot(nodes: BootNode[]): string[] {
  const index = new Map(nodes.map((node, at) => [node.name, at]));
  const provider = new Map<string, string>();
  for (const node of nodes) {
    for (const capability of node.provides) {
      if (!provider.has(capability)) provider.set(capability, node.name);
    }
  }
  const incoming = new Map(nodes.map((node) => [node.name, 0]));
  const next = new Map(nodes.map((node) => [node.name, [] as string[]]));
  for (const node of nodes) {
    const deps = new Set<string>();
    for (const capability of node.requires) {
      const from = provider.get(capability);
      if (from && from !== node.name) deps.add(from);
    }
    for (const dep of deps) {
      next.get(dep)!.push(node.name);
      incoming.set(node.name, (incoming.get(node.name) ?? 0) + 1);
    }
  }
  const ready = nodes.filter((node) => incoming.get(node.name) === 0).map((node) => node.name);
  const out: string[] = [];
  while (ready.length > 0) {
    const name = ready.shift()!;
    out.push(name);
    for (const kid of (next.get(name) ?? []).slice().sort((a, b) => index.get(a)! - index.get(b)!)) {
      incoming.set(kid, (incoming.get(kid) ?? 1) - 1);
      if (incoming.get(kid) === 0) {
        const at = ready.findIndex((item) => index.get(item)! > index.get(kid)!);
        if (at === -1) ready.push(kid);
        else ready.splice(at, 0, kid);
      }
    }
  }
  if (out.length !== nodes.length) throw new Error("ciclo no grafo de boot");
  return out;
}
