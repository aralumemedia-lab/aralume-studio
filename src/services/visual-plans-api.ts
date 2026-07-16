import type { ID, ScenePlan, VisualPlan } from "@/contracts/types";
import type { ApiListSuccess, ApiSuccess } from "@/contracts/api-contracts";

import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

const VISUAL_PLANS_PATH = "/visual-plans";

export type VisualPlanFilters = {
  channelId?: ID;
  status?: VisualPlan["status"];
  contentId?: ID;
  scriptVersionId?: ID;
};

export type CreateVisualPlanInput = Pick<
  VisualPlan,
  | "channelId"
  | "contentId"
  | "scriptVersionId"
  | "title"
  | "status"
  | "sceneCount"
  | "estimatedDurationSeconds"
  | "visualStyle"
>;

export type UpdateVisualPlanInput = Partial<
  Pick<VisualPlan, "title" | "status" | "sceneCount" | "estimatedDurationSeconds" | "visualStyle">
>;

export type CreateScenePlanInput = Pick<
  ScenePlan,
  | "order"
  | "title"
  | "narrationExcerpt"
  | "durationSeconds"
  | "visualDescription"
  | "assetRequirements"
>;

export async function getVisualPlans(
  filters: VisualPlanFilters = {},
): Promise<ApiListSuccess<VisualPlan>> {
  return requestApiEnvelope<ApiListSuccess<VisualPlan>>(withQuery(VISUAL_PLANS_PATH, filters));
}

export async function getVisualPlan(id: ID): Promise<ApiSuccess<VisualPlan>> {
  return requestApiEnvelope<ApiSuccess<VisualPlan>>(`${VISUAL_PLANS_PATH}/${id}`);
}

export async function getScenePlans(visualPlanId: ID): Promise<ApiListSuccess<ScenePlan>> {
  return requestApiEnvelope<ApiListSuccess<ScenePlan>>(
    `${VISUAL_PLANS_PATH}/${visualPlanId}/scenes`,
  );
}

export async function createVisualPlan(
  input: CreateVisualPlanInput,
): Promise<ApiSuccess<VisualPlan>> {
  return requestApiEnvelope<ApiSuccess<VisualPlan>>(VISUAL_PLANS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateVisualPlan(
  id: ID,
  input: UpdateVisualPlanInput,
): Promise<ApiSuccess<VisualPlan>> {
  return requestApiEnvelope<ApiSuccess<VisualPlan>>(`${VISUAL_PLANS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function createScenePlan(
  visualPlanId: ID,
  input: CreateScenePlanInput,
): Promise<ApiSuccess<ScenePlan>> {
  return requestApiEnvelope<ApiSuccess<ScenePlan>>(`${VISUAL_PLANS_PATH}/${visualPlanId}/scenes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function describeVisualPlanApiError(error: unknown) {
  if (!(error instanceof ApiRequestError)) {
    return "Nao foi possivel carregar os planos visuais.";
  }

  if (error.kind === "network") {
    return "Backend indisponivel. Tente novamente.";
  }

  if (error.kind === "timeout") {
    return "A requisicao de plano visual expirou. Tente novamente.";
  }

  if (error.kind === "invalid_json") {
    return "O backend respondeu com um formato invalido.";
  }

  if (error.kind === "unexpected_envelope") {
    if (error.status === 404) {
      return "Plano visual nao encontrado.";
    }

    if (error.status === 400) {
      return "Os dados do plano visual enviados sao invalidos.";
    }

    if (error.status === 409) {
      return "O plano visual entrou em conflito.";
    }

    return "O backend respondeu de forma inesperada.";
  }

  return "Nao foi possivel carregar os planos visuais.";
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
