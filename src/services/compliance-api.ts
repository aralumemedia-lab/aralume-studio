import type {
  ComplianceCheck,
  ComplianceStatus,
  GovernanceEntityType,
  RiskLevel,
} from "@/contracts/types";
import type { ApiListSuccess, ApiSuccess } from "@/contracts/api-contracts";

import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

const COMPLIANCE_CHECKS_PATH = "/compliance-checks";

export type ComplianceFilters = {
  channelId?: string;
  status?: ComplianceStatus;
  riskLevel?: RiskLevel;
  entityType?: GovernanceEntityType;
  entityId?: string;
};

export type CreateComplianceCheckInput = {
  channelId: string;
  entityType: GovernanceEntityType;
  entityId: string;
  requestedBy?: string;
};

export async function getComplianceChecks(
  filters: ComplianceFilters = {},
): Promise<ApiListSuccess<ComplianceCheck>> {
  return requestApiEnvelope<ApiListSuccess<ComplianceCheck>>(
    withQuery(COMPLIANCE_CHECKS_PATH, filters),
  );
}

export async function getComplianceCheck(
  id: string,
  channelId: string,
): Promise<ApiSuccess<ComplianceCheck>> {
  return requestApiEnvelope<ApiSuccess<ComplianceCheck>>(
    withQuery(`${COMPLIANCE_CHECKS_PATH}/${id}`, { channelId }),
  );
}

export async function createComplianceCheck(
  input: CreateComplianceCheckInput,
): Promise<ApiSuccess<ComplianceCheck>> {
  return requestApiEnvelope<ApiSuccess<ComplianceCheck>>(COMPLIANCE_CHECKS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function describeComplianceApiError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return "Nao foi possivel carregar as verificacoes de conformidade.";
  }

  if (error.kind === "network") {
    return "Backend indisponivel. Tente novamente.";
  }

  if (error.kind === "timeout") {
    return "A requisicao de conformidade expirou. Tente novamente.";
  }

  if (error.kind === "invalid_json") {
    return "O backend respondeu com um formato invalido.";
  }

  if (error.kind === "unexpected_envelope") {
    if (error.status === 404) {
      return "Verificacao de conformidade nao encontrada.";
    }

    if (error.status === 400) {
      return "Os dados de conformidade enviados sao invalidos.";
    }

    if (error.code === "COMPLIANCE_BLOCKED") {
      return "A conformidade bloqueou o item.";
    }

    if (error.status === 409) {
      return "A verificacao de conformidade entrou em conflito.";
    }

    return "O backend respondeu de forma inesperada.";
  }

  return "Nao foi possivel carregar as verificacoes de conformidade.";
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
