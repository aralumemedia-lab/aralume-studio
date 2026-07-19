import type { ClaimEvidence, ID, ResearchSession, ResearchSource } from "@/contracts/types";
import type { ApiListSuccess, ApiSuccess } from "@/contracts/api-contracts";

import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

const RESEARCH_SESSIONS_PATH = "/research-sessions";
const DEFAULT_REQUESTED_BY = "Ana Ribeiro";

export type ResearchSessionFilters = {
  channelId?: ID;
  status?: ResearchSession["status"];
  contentId?: ID;
};

export type CreateResearchSessionInput = Pick<
  ResearchSession,
  | "channelId"
  | "contentId"
  | "title"
  | "status"
  | "sourceCount"
  | "claimCount"
  | "confidenceScore"
  | "riskLevel"
> & {
  summary?: string;
  requestedBy?: string;
};

export type CreateResearchSourceInput = Pick<
  ResearchSource,
  | "title"
  | "url"
  | "publisher"
  | "accessedAt"
  | "sourceType"
  | "confidenceLevel"
  | "freshnessRisk"
  | "usageNotes"
> & {
  requestedBy?: string;
};

export type CreateClaimEvidenceInput = Pick<
  ClaimEvidence,
  "sourceId" | "claim" | "evidenceSummary" | "informationType" | "confidenceLevel" | "riskLevel"
> & {
  requestedBy?: string;
};

export async function getResearchSessions(
  filters: ResearchSessionFilters = {},
): Promise<ApiListSuccess<ResearchSession>> {
  return requestApiEnvelope<ApiListSuccess<ResearchSession>>(
    withQuery(RESEARCH_SESSIONS_PATH, filters),
  );
}

export async function getResearchSession(
  id: ID,
  channelId: ID,
): Promise<ApiSuccess<ResearchSession>> {
  return requestApiEnvelope<ApiSuccess<ResearchSession>>(
    withQuery(`${RESEARCH_SESSIONS_PATH}/${id}`, { channelId }),
  );
}

export async function getResearchSources(
  sessionId: ID,
  channelId: ID,
): Promise<ApiListSuccess<ResearchSource>> {
  return requestApiEnvelope<ApiListSuccess<ResearchSource>>(
    withQuery(`${RESEARCH_SESSIONS_PATH}/${sessionId}/sources`, { channelId }),
  );
}

export async function getClaimEvidenceList(
  sessionId: ID,
  channelId: ID,
): Promise<ApiListSuccess<ClaimEvidence>> {
  return requestApiEnvelope<ApiListSuccess<ClaimEvidence>>(
    withQuery(`${RESEARCH_SESSIONS_PATH}/${sessionId}/claims`, { channelId }),
  );
}

export async function createResearchSession(
  input: CreateResearchSessionInput,
): Promise<ApiSuccess<ResearchSession>> {
  return requestApiEnvelope<ApiSuccess<ResearchSession>>(RESEARCH_SESSIONS_PATH, {
    method: "POST",
    body: JSON.stringify({
      ...input,
      requestedBy: input.requestedBy ?? DEFAULT_REQUESTED_BY,
    }),
  });
}

export async function createResearchSource(
  sessionId: ID,
  channelId: ID,
  input: CreateResearchSourceInput,
): Promise<ApiSuccess<ResearchSource>> {
  return requestApiEnvelope<ApiSuccess<ResearchSource>>(
    withQuery(`${RESEARCH_SESSIONS_PATH}/${sessionId}/sources`, { channelId }),
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        requestedBy: input.requestedBy ?? DEFAULT_REQUESTED_BY,
      }),
    },
  );
}

export async function createClaimEvidence(
  sessionId: ID,
  channelId: ID,
  input: CreateClaimEvidenceInput,
): Promise<ApiSuccess<ClaimEvidence>> {
  return requestApiEnvelope<ApiSuccess<ClaimEvidence>>(
    withQuery(`${RESEARCH_SESSIONS_PATH}/${sessionId}/claims`, { channelId }),
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        requestedBy: input.requestedBy ?? DEFAULT_REQUESTED_BY,
      }),
    },
  );
}

export function describeResearchApiError(error: unknown) {
  if (!(error instanceof ApiRequestError)) {
    return "Nao foi possivel carregar as pesquisas.";
  }

  if (error.kind === "network") {
    return "Backend indisponivel. Tente novamente.";
  }

  if (error.kind === "timeout") {
    return "A requisicao de pesquisa expirou. Tente novamente.";
  }

  if (error.kind === "invalid_json") {
    return "O backend respondeu com um formato invalido.";
  }

  if (error.kind === "unexpected_envelope") {
    if (error.status === 404) {
      return "Pesquisa nao encontrada.";
    }

    if (error.status === 400) {
      return "Os dados de pesquisa enviados sao invalidos.";
    }

    if (error.status === 409) {
      return "O vinculo de pesquisa entrou em conflito.";
    }

    return "O backend respondeu de forma inesperada.";
  }

  return "Nao foi possivel carregar as pesquisas.";
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
