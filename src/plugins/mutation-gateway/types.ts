export type { MutationDecision, MutationPolicy, OrigemMutacao, PoliticaComOrigem } from "./lib/gateway.ts";

export type MutationGatewayService = {
  descerMutacao: typeof import("./lib/gateway.ts").descerMutacao;
  definirPolitica: typeof import("./lib/gateway.ts").definirPolitica;
  mutationGateway: typeof import("./lib/gateway.ts").mutationGateway;
};
