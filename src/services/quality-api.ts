import type {
  GovernanceEntityType,
  QualityCheck,
  QualityCheckStatus,
  RiskLevel,
} from "@/contracts/types";
import type { ApiListSuccess, ApiSuccess } from "@/contracts/api-contracts";

import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

const QUALITY_CHECKS_PATH = "/quality-checks";

export type QualityCheckFilters = {
  channelId?: string;
  status?: QualityCheckStatus;
  riskLevel?: RiskLevel;
  entityType?: GovernanceEntityType;
  entityId?: string;
};

export type CreateQualityCheckInput = {
  channelId: string;
  entityType: GovernanceEntityType;
  entityId: string;
  requestedBy?: string;
};

export async function getQualityChecks(
  filters: QualityCheckFilters = {},
): Promise<ApiListSuccess<QualityCheck>> {
  return requestApiEnvelope<ApiListSuccess<QualityCheck>>(withQuery(QUALITY_CHECKS_PATH, filters));
}

export async function getQualityCheck(
  id: string,
  channelId?: string,
): Promise<ApiSuccess<QualityCheck>> {
  return requestApiEnvelope<ApiSuccess<QualityCheck>>(
    withQuery(`${QUALITY_CHECKS_PATH}/${id}`, { channelId }),
  );
}

export async function createQualityCheck(
  input: CreateQualityCheckInput,
): Promise<ApiSuccess<QualityCheck>> {
  return requestApiEnvelope<ApiSuccess<QualityCheck>>(QUALITY_CHECKS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function describeQualityApiError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return "Nao foi possivel carregar as verificacoes de qualidade.";
  }

  if (error.kind === "network") {
    return "Backend indisponivel. Tente novamente.";
  }

  if (error.kind === "timeout") {
    return "A requisicao de qualidade expirou. Tente novamente.";
  }

  if (error.kind === "invalid_json") {
    return "O backend respondeu com um formato invalido.";
  }

  if (error.kind === "unexpected_envelope") {
    if (error.status === 404) {
      return "Verificacao de qualidade nao encontrada.";
    }

    if (error.status === 400) {
      return "Os dados de qualidade enviados sao invalidos.";
    }

    if (error.status === 409) {
      return "A verificacao de qualidade entrou em conflito.";
    }

    return "O backend respondeu de forma inesperada.";
  }

  return "Nao foi possivel carregar as verificacoes de qualidade.";
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
