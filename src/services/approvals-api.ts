import type {
  ApprovalDecision,
  ApprovalStatus,
  GovernanceEntityType,
  HumanApproval,
  RiskLevel,
} from "@/contracts/types";
import type { ApiListSuccess, ApiSuccess } from "@/contracts/api-contracts";

import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

const APPROVALS_PATH = "/approvals";

export type ApprovalFilters = {
  channelId?: string;
  status?: ApprovalStatus;
  riskLevel?: RiskLevel;
  entityType?: GovernanceEntityType;
  entityId?: string;
};

export type CreateApprovalInput = Pick<
  HumanApproval,
  "channelId" | "entityType" | "entityId" | "requestedBy"
> & {
  title?: string;
  summary?: string;
};

export type ApprovalDecisionInput = {
  channelId: string;
  decidedBy: string;
  decisionReason: string;
};

export async function getApprovals(
  filters: ApprovalFilters = {},
): Promise<ApiListSuccess<HumanApproval>> {
  return requestApiEnvelope<ApiListSuccess<HumanApproval>>(withQuery(APPROVALS_PATH, filters));
}

export async function getApproval(
  id: string,
  channelId: string,
): Promise<ApiSuccess<HumanApproval>> {
  return requestApiEnvelope<ApiSuccess<HumanApproval>>(
    withQuery(`${APPROVALS_PATH}/${id}`, { channelId }),
  );
}

export async function createApproval(
  input: CreateApprovalInput,
): Promise<ApiSuccess<HumanApproval>> {
  return requestApiEnvelope<ApiSuccess<HumanApproval>>(APPROVALS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function approveApproval(
  id: string,
  input: ApprovalDecisionInput,
): Promise<ApiSuccess<HumanApproval>> {
  return requestApiEnvelope<ApiSuccess<HumanApproval>>(`${APPROVALS_PATH}/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function rejectApproval(
  id: string,
  input: ApprovalDecisionInput,
): Promise<ApiSuccess<HumanApproval>> {
  return requestApiEnvelope<ApiSuccess<HumanApproval>>(`${APPROVALS_PATH}/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function requestApprovalChanges(
  id: string,
  input: ApprovalDecisionInput,
): Promise<ApiSuccess<HumanApproval>> {
  return requestApiEnvelope<ApiSuccess<HumanApproval>>(`${APPROVALS_PATH}/${id}/request-changes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getApprovalHistory(
  id: string,
  channelId: string,
): Promise<ApiListSuccess<ApprovalDecision>> {
  return requestApiEnvelope<ApiListSuccess<ApprovalDecision>>(
    withQuery(`${APPROVALS_PATH}/${id}/history`, { channelId }),
  );
}

export function describeApprovalsApiError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return "Nao foi possivel carregar as aprovacoes.";
  }

  if (error.kind === "network") {
    return "Backend indisponivel. Tente novamente.";
  }

  if (error.kind === "timeout") {
    return "A requisicao de aprovacoes expirou. Tente novamente.";
  }

  if (error.kind === "invalid_json") {
    return "O backend respondeu com um formato invalido.";
  }

  if (error.kind === "unexpected_envelope") {
    if (error.status === 404) {
      return "Aprovacao nao encontrada.";
    }

    if (error.code === "COMPLIANCE_BLOCKED") {
      return "A decisao foi bloqueada por conformidade.";
    }

    if (error.code === "OPERATION_BLOCKED") {
      return "A decisao foi bloqueada pela qualidade ou pelo estado operacional.";
    }

    if (error.status === 400) {
      return "Os dados da aprovacao enviados sao invalidos.";
    }

    if (error.status === 409) {
      return "O estado da aprovacao entrou em conflito.";
    }

    return "O backend respondeu de forma inesperada.";
  }

  return "Nao foi possivel carregar as aprovacoes.";
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
