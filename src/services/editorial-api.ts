import type { ContentIdea, ID, ProductionItem } from "@/contracts/types";
import type { ApiListSuccess, ApiSuccess } from "@/contracts/api-contracts";

import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

const CONTENT_IDEAS_PATH = "/content-ideas";
const PRODUCTION_ITEMS_PATH = "/production-items";
const DEFAULT_REQUESTED_BY = "Ana Ribeiro";

export type ContentIdeaFilters = {
  channelId?: ID;
  status?: ContentIdea["status"];
};

export type CreateContentIdeaInput = Pick<
  ContentIdea,
  | "channelId"
  | "title"
  | "summary"
  | "niche"
  | "source"
  | "opportunityScore"
  | "originalityScore"
  | "visualPotentialScore"
  | "clipPotentialScore"
  | "riskLevel"
  | "status"
> & {
  requestedBy?: string;
};

export type UpdateContentIdeaInput = Partial<Omit<CreateContentIdeaInput, "channelId">>;

export type ProductionItemFilters = {
  channelId?: ID;
  status?: ProductionItem["status"];
  contentId?: ID;
};

export async function getContentIdeas(
  filters: ContentIdeaFilters = {},
): Promise<ApiListSuccess<ContentIdea>> {
  return requestApiEnvelope<ApiListSuccess<ContentIdea>>(withQuery(CONTENT_IDEAS_PATH, filters));
}

export async function getContentIdea(id: ID): Promise<ApiSuccess<ContentIdea>> {
  return requestApiEnvelope<ApiSuccess<ContentIdea>>(`${CONTENT_IDEAS_PATH}/${id}`);
}

export async function createContentIdea(
  input: CreateContentIdeaInput,
): Promise<ApiSuccess<ContentIdea>> {
  return requestApiEnvelope<ApiSuccess<ContentIdea>>(CONTENT_IDEAS_PATH, {
    method: "POST",
    body: JSON.stringify({
      ...input,
      requestedBy: input.requestedBy ?? DEFAULT_REQUESTED_BY,
    }),
  });
}

export async function updateContentIdea(
  id: ID,
  input: UpdateContentIdeaInput,
): Promise<ApiSuccess<ContentIdea>> {
  return requestApiEnvelope<ApiSuccess<ContentIdea>>(`${CONTENT_IDEAS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...input,
      requestedBy: input.requestedBy ?? DEFAULT_REQUESTED_BY,
    }),
  });
}

export async function getProductionItems(
  filters: ProductionItemFilters = {},
): Promise<ApiListSuccess<ProductionItem>> {
  return requestApiEnvelope<ApiListSuccess<ProductionItem>>(
    withQuery(PRODUCTION_ITEMS_PATH, filters),
  );
}

export async function getProductionItem(id: ID): Promise<ApiSuccess<ProductionItem>> {
  return requestApiEnvelope<ApiSuccess<ProductionItem>>(`${PRODUCTION_ITEMS_PATH}/${id}`);
}

export function describeEditorialApiError(
  error: unknown,
  context: "ideas" | "production" = "ideas",
) {
  if (!(error instanceof ApiRequestError)) {
    return "Nao foi possivel carregar os dados editoriais.";
  }

  if (error.kind === "network") {
    return "Backend indisponivel. Tente novamente.";
  }

  if (error.kind === "timeout") {
    return "A requisicao editorial expirou. Tente novamente.";
  }

  if (error.kind === "invalid_json") {
    return "O backend respondeu com um formato invalido.";
  }

  if (error.kind === "unexpected_envelope") {
    if (error.status === 404) {
      return context === "production"
        ? "Item de producao nao encontrado."
        : "Ideia nao encontrada.";
    }

    if (error.status === 400) {
      return "Os dados editoriais enviados sao invalidos.";
    }

    if (error.status === 409) {
      return "O estado editorial entrou em conflito.";
    }

    return "O backend respondeu de forma inesperada.";
  }

  return "Nao foi possivel carregar os dados editoriais.";
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
