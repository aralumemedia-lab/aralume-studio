import type { AuditLog, ID } from "@/contracts/types";
import type { ApiListSuccess } from "@/contracts/api-contracts";

import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

const AUDIT_LOGS_PATH = "/audit-logs";

export async function getAuditLogs(channelId?: ID): Promise<ApiListSuccess<AuditLog>> {
  return requestApiEnvelope<ApiListSuccess<AuditLog>>(withQuery(AUDIT_LOGS_PATH, { channelId }));
}

export function describeAuditApiError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return "Nao foi possivel carregar os logs de auditoria.";
  }

  if (error.kind === "network") {
    return "Backend indisponivel. Tente novamente.";
  }

  if (error.kind === "timeout") {
    return "A requisicao de auditoria expirou. Tente novamente.";
  }

  if (error.kind === "invalid_json") {
    return "O backend respondeu com um formato invalido.";
  }

  if (error.kind === "unexpected_envelope") {
    if (error.status === 404) {
      return "Logs de auditoria nao encontrados.";
    }

    if (error.status === 400) {
      return "Os filtros de auditoria enviados sao invalidos.";
    }

    return "O backend respondeu de forma inesperada.";
  }

  return "Nao foi possivel carregar os logs de auditoria.";
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
