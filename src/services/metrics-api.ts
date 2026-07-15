import type { ApiListSuccess, ApiSuccess } from "@/contracts/api-contracts";
import type { ID, MetricsSummary, PerformanceMetric } from "@/contracts/types";
import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

const METRICS_PATH = "/metrics";

export type MetricFilters = {
  channelId: ID;
  from?: string;
  to?: string;
  contentId?: ID;
  platform?: string;
  page?: number;
  pageSize?: number;
};

export type CreateMetricInput = Omit<
  PerformanceMetric,
  "id" | "createdAt" | "updatedAt" | "validationStatus"
> & {
  validationStatus?: PerformanceMetric["validationStatus"];
};

export async function getPerformanceMetrics(
  filters: ID | MetricFilters,
): Promise<ApiListSuccess<PerformanceMetric>> {
  const normalized = typeof filters === "string" ? { channelId: filters } : filters;
  return requestApiEnvelope<ApiListSuccess<PerformanceMetric>>(
    `${METRICS_PATH}?${toQuery(normalized)}`,
  );
}

export async function getPerformanceMetric(
  id: ID,
  channelId: ID,
): Promise<ApiSuccess<PerformanceMetric>> {
  return requestApiEnvelope<ApiSuccess<PerformanceMetric>>(
    `${METRICS_PATH}/${id}?channelId=${encodeURIComponent(channelId)}`,
  );
}

export async function createPerformanceMetric(
  input: CreateMetricInput,
): Promise<ApiSuccess<PerformanceMetric>> {
  return requestApiEnvelope<ApiSuccess<PerformanceMetric>>(METRICS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getMetricsSummary(
  filters: Pick<MetricFilters, "channelId" | "from" | "to">,
): Promise<ApiSuccess<MetricsSummary>> {
  return requestApiEnvelope<ApiSuccess<MetricsSummary>>(
    `${METRICS_PATH}/summary?${toQuery(filters)}`,
  );
}

export function describeMetricsApiError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) return "Nao foi possivel carregar as metricas.";
  if (error.kind === "network") return "Backend indisponivel. Tente novamente.";
  if (error.kind === "timeout") return "A requisicao de metricas expirou. Tente novamente.";
  if (error.kind === "invalid_json") return "O backend respondeu com um formato invalido.";
  if (error.kind === "unexpected_envelope") {
    if (error.status === 400) return "Os filtros de metricas sao invalidos.";
    if (error.status === 404) return "Canal, conteudo ou metrica nao encontrado.";
    if (error.status === 409) return "A metrica entrou em conflito ou foi repetida.";
    return "O backend respondeu de forma inesperada.";
  }
  return "Nao foi possivel carregar as metricas.";
}

function toQuery(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  return params.toString();
}
