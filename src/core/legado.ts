/** Um caminho velho só sai se o substituto está no sítio e a paridade existe. */
export type CaminhoVelho = {
  velho: string;
  substituto: string;
  paridade: string;
};

export function podeSair(caminho: CaminhoVelho, existe: (path: string) => boolean): boolean {
  return existe(caminho.substituto) && existe(caminho.paridade);
}

export const SAIDAS: CaminhoVelho[] = [
  {
    velho: "src/components/ide",
    substituto: "src/plugins/ide-ui/lib/components/IdeApp.tsx",
    paridade: "src/plugins/ide-ui/__tests__/integration/parity-components.test.ts",
  },
  {
    velho: "src/lib/ide",
    substituto: "src/plugins/ide-state/lib/orchestrator.ts",
    paridade: "src/core/__tests__/integration/platform-bootstrap.test.ts",
  },
  {
    velho: "src/lib/engine",
    substituto: "src/plugins/narrative-engine/lib/index.ts",
    paridade: "src/plugins/narrative-engine/__tests__/integration/parity-taxonomy.test.ts",
  },
  {
    velho: "espelho-de-boot",
    substituto: "src/core/boot-order.ts",
    paridade: "src/core/__tests__/integration/platform-bootstrap.test.ts",
  },
];

export const FICA: CaminhoVelho[] = [
  {
    velho: "src/components/preview-host-bridge.tsx",
    substituto: "src/nao-ha-substituto",
    paridade: "src/core/__tests__/integration/platform-bootstrap.test.ts",
  },
  {
    velho: "src/lib/multiplayer/index.ts",
    substituto: "src/nao-ha-substituto",
    paridade: "src/core/__tests__/integration/platform-bootstrap.test.ts",
  },
];
