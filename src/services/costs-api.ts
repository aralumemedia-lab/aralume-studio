import type {
  CostBreakdown,
  CostEntry,
  CostSummary,
  ID,
  OperationalAction,
  OperationalModeDecision,
  OperationalModePolicy,
  OperationalModeSnapshot,
} from "@/contracts/types";
import type { ApiListSuccess, ApiSuccess } from "@/contracts/api-contracts";

import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

const COSTS_PATH = "/costs";
const OPERATIONAL_MODES_PATH = "/operational-modes";

export type CreateCostEntryInput = Omit<CostEntry, "id" | "currency" | "createdAt">;

export type OperationalModePolicyUpdateInput = Partial<
  Pick<
    OperationalModePolicy,
    | "mode"
    | "allowRealAi"
    | "allowRealTts"
    | "allowRealImageGeneration"
    | "allowRealVideoGeneration"
    | "allowExternalPublication"
    | "requireHumanApproval"
    | "budgetConfigured"
    | "dailyBudgetLimitCents"
    | "monthlyBudgetLimitCents"
  >
>;

export type OperationalActionEvaluationInput = {
  channelId: ID;
  action: OperationalAction;
  actor?: string;
  costEntryId?: ID;
  plannedCostCents?: number;
};

export async function getCostEntries(channelId?: ID): Promise<ApiListSuccess<CostEntry>> {
  return requestApiEnvelope<ApiListSuccess<CostEntry>>(withQuery(COSTS_PATH, { channelId }));
}

export async function getCostEntry(id: ID): Promise<ApiSuccess<CostEntry>> {
  return requestApiEnvelope<ApiSuccess<CostEntry>>(`${COSTS_PATH}/${id}`);
}

export async function createCostEntry(input: CreateCostEntryInput): Promise<ApiSuccess<CostEntry>> {
  return requestApiEnvelope<ApiSuccess<CostEntry>>(COSTS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCostSummary(channelId?: ID): Promise<ApiSuccess<CostSummary>> {
  return requestApiEnvelope<ApiSuccess<CostSummary>>(
    withQuery(`${COSTS_PATH}/summary`, { channelId }),
  );
}

export async function getCostBreakdown(channelId?: ID): Promise<ApiSuccess<CostBreakdown>> {
  return requestApiEnvelope<ApiSuccess<CostBreakdown>>(
    withQuery(`${COSTS_PATH}/breakdown`, { channelId }),
  );
}

export async function getOperationalModes(
  channelId?: ID,
): Promise<ApiSuccess<OperationalModeSnapshot>> {
  return requestApiEnvelope<ApiSuccess<OperationalModeSnapshot>>(
    withQuery(OPERATIONAL_MODES_PATH, { channelId }),
  );
}

export async function updateGlobalOperationalModePolicy(
  input: OperationalModePolicyUpdateInput,
): Promise<ApiSuccess<OperationalModePolicy>> {
  return requestApiEnvelope<ApiSuccess<OperationalModePolicy>>(`${OPERATIONAL_MODES_PATH}/global`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateChannelOperationalModePolicy(
  channelId: ID,
  input: OperationalModePolicyUpdateInput,
): Promise<ApiSuccess<OperationalModePolicy>> {
  return requestApiEnvelope<ApiSuccess<OperationalModePolicy>>(
    `${OPERATIONAL_MODES_PATH}/channels/${channelId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export async function evaluateOperationalAction(
  input: OperationalActionEvaluationInput,
): Promise<ApiSuccess<OperationalModeDecision>> {
  return requestApiEnvelope<ApiSuccess<OperationalModeDecision>>(
    `${OPERATIONAL_MODES_PATH}/evaluate`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function describeCostsApiError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return "Nao foi possivel carregar os custos.";
  }

  if (error.kind === "network") {
    return "Backend indisponivel. Tente novamente.";
  }

  if (error.kind === "timeout") {
    return "A requisicao de custos expirou. Tente novamente.";
  }

  if (error.kind === "invalid_json") {
    return "O backend respondeu com um formato invalido.";
  }

  if (error.kind === "unexpected_envelope") {
    if (error.status === 404) {
      return "Custo ou canal nao encontrado.";
    }

    if (error.status === 400) {
      return "Os dados de custos enviados sao invalidos.";
    }

    if (error.code === "BUDGET_EXCEEDED") {
      return "O budget operacional foi excedido.";
    }

    if (error.code === "OPERATION_BLOCKED") {
      return "A operacao foi bloqueada pela policy.";
    }

    return "O backend respondeu de forma inesperada.";
  }

  return "Nao foi possivel carregar os custos.";
}

export function describeOperationalModesApiError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return "Nao foi possivel carregar os modos operacionais.";
  }

  if (error.kind === "network") {
    return "Backend indisponivel. Tente novamente.";
  }

  if (error.kind === "timeout") {
    return "A requisicao de modos operacionais expirou. Tente novamente.";
  }

  if (error.kind === "invalid_json") {
    return "O backend respondeu com um formato invalido.";
  }

  if (error.kind === "unexpected_envelope") {
    if (error.status === 404) {
      return "Policy ou canal nao encontrado.";
    }

    if (error.status === 400) {
      return "Os dados de policy enviados sao invalidos.";
    }

    if (error.code === "BUDGET_EXCEEDED") {
      return "O budget bloqueou a operacao.";
    }

    if (error.code === "OPERATION_BLOCKED") {
      return "A acao foi bloqueada pelo modo operacional.";
    }

    return "O backend respondeu de forma inesperada.";
  }

  return "Nao foi possivel carregar os modos operacionais.";
}

function withQuery(path: string, query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}
