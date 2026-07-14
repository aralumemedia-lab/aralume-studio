import type { ApiListSuccess, ApiSuccess } from "@/contracts/api-contracts";
import type { ID, RenderJob, RenderProfile, RenderStatus, RenderType } from "@/contracts/types";

import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

const RENDERS_PATH = "/renders";

export type RenderJobFilters = {
  channelId: ID;
  status?: RenderStatus;
  renderType?: RenderType;
  contentId?: ID;
  workflowRunId?: ID;
  idempotencyKey?: string;
};

export type CreateRenderJobInput = {
  channelId: ID;
  inputAssetIds: ID[];
  renderType: RenderType;
  renderProfile: RenderProfile;
  idempotencyKey: string;
  contentId?: ID;
  workflowRunId?: ID;
  requestedBy?: string;
};

export async function getRenderJobs(filters: RenderJobFilters): Promise<ApiListSuccess<RenderJob>> {
  return requestApiEnvelope<ApiListSuccess<RenderJob>>(withQuery(RENDERS_PATH, filters));
}

export async function getRenderJob(channelId: ID, id: ID): Promise<ApiSuccess<RenderJob>> {
  return requestApiEnvelope<ApiSuccess<RenderJob>>(
    withQuery(`${RENDERS_PATH}/${id}`, { channelId }),
  );
}

export async function createRenderJob(input: CreateRenderJobInput): Promise<ApiSuccess<RenderJob>> {
  return requestApiEnvelope<ApiSuccess<RenderJob>>(RENDERS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function describeRendersApiError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return "Nao foi possivel carregar os jobs de renderizacao.";
  }

  if (error.kind === "network") {
    return "Backend indisponivel. Tente novamente.";
  }

  if (error.kind === "timeout") {
    return "A requisicao de renderizacao expirou. Tente novamente.";
  }

  if (error.kind === "invalid_json") {
    return "O backend respondeu com um formato invalido.";
  }

  if (error.kind === "unexpected_envelope") {
    if (error.status === 404) {
      return "Job de renderizacao nao encontrado.";
    }

    if (error.status === 400) {
      return "Os dados de renderizacao enviados sao invalidos.";
    }

    if (error.status === 409) {
      if (error.code === "BUDGET_EXCEEDED") {
        return "O budget operacional bloqueou a renderizacao.";
      }

      if (error.code === "OPERATION_BLOCKED") {
        return "A renderizacao foi bloqueada pela policy operacional.";
      }

      return "O job de renderizacao entrou em conflito.";
    }

    return "O backend respondeu de forma inesperada.";
  }

  return "Nao foi possivel carregar os jobs de renderizacao.";
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
