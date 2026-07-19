import type { ApiListSuccess, ApiSuccess } from "@/contracts/api-contracts";
import type {
  AgentDefinition,
  AgentOfficeSnapshot,
  DashboardSummary,
  ID,
  WorkflowRun,
} from "@/contracts/types";
import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

function withChannel(path: string, channelId?: ID): string {
  return channelId ? `${path}?channelId=${encodeURIComponent(channelId)}` : path;
}

export function getDashboardSummary(channelId?: ID): Promise<ApiSuccess<DashboardSummary>> {
  return requestApiEnvelope<ApiSuccess<DashboardSummary>>(
    withChannel("/dashboard/summary", channelId),
  );
}

export function getAgentDefinitions(channelId?: ID): Promise<ApiListSuccess<AgentDefinition>> {
  return requestApiEnvelope<ApiListSuccess<AgentDefinition>>(withChannel("/agents", channelId));
}

export function getAgentOfficeSnapshot(channelId?: ID): Promise<ApiSuccess<AgentOfficeSnapshot>> {
  return requestApiEnvelope<ApiSuccess<AgentOfficeSnapshot>>(
    withChannel("/agent-office/snapshot", channelId),
  );
}

export function getWorkflowRuns(channelId?: ID): Promise<ApiListSuccess<WorkflowRun>> {
  return requestApiEnvelope<ApiListSuccess<WorkflowRun>>(withChannel("/workflows", channelId));
}

export function getWorkflowRun(id: ID, channelId: ID): Promise<ApiSuccess<WorkflowRun>> {
  return requestApiEnvelope<ApiSuccess<WorkflowRun>>(
    `/workflows/${encodeURIComponent(id)}?channelId=${encodeURIComponent(channelId)}`,
  );
}

export function describeCockpitsApiError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) return "Nao foi possivel carregar o cockpit.";
  if (error.kind === "network") return "Backend indisponivel. Tente novamente.";
  if (error.kind === "timeout") return "A requisicao do cockpit expirou. Tente novamente.";
  if (error.kind === "invalid_json") return "O backend respondeu com um formato invalido.";
  if (error.status === 400) return "O contexto do cockpit e invalido.";
  if (error.status === 404) return "Canal ou workflow nao encontrado.";
  return "Nao foi possivel carregar os dados operacionais.";
}
