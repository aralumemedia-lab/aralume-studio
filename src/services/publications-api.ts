import type { ApiListSuccess, ApiSuccess } from "@/contracts/api-contracts";
import type { ID, PublicationJob, PublicationStatus, PublicationTarget } from "@/contracts/types";

import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

const PUBLICATION_TARGETS_PATH = "/publication-targets";
const PUBLICATIONS_PATH = "/publications";

export type PublicationTargetFilters = {
  channelId?: ID;
  platform?: PublicationTarget["platform"];
  status?: Extract<PublicationStatus, "not_connected" | "authenticated" | "token_expired">;
  readinessStatus?: "ready" | "warning" | "blocked";
};

export type CreatePublicationTargetInput = {
  id?: ID;
  channelId: ID;
  platform: PublicationTarget["platform"];
  accountName: string;
  status: Extract<PublicationStatus, "not_connected" | "authenticated" | "token_expired">;
  lastConnectedAt?: string;
  tokenExpiresAt?: string;
  sourceContentId?: ID;
  sourceVideoAssetId?: ID;
  requestedBy?: string;
};

export type PublicationJobFilters = {
  channelId?: ID;
  platform?: PublicationJob["platform"];
  status?: Extract<PublicationStatus, "draft" | "scheduled" | "published" | "failed">;
  publicationTargetId?: ID;
  contentId?: ID;
  sourceVideoAssetId?: ID;
  idempotencyKey?: string;
};

export type CreatePublicationJobInput = {
  channelId: ID;
  publicationTargetId: ID;
  contentId: ID;
  sourceVideoAssetId: ID;
  title: string;
  description: string;
  idempotencyKey: string;
  scheduledAt?: string;
  requestedBy?: string;
};

export type ReschedulePublicationJobInput = {
  channelId: ID;
  scheduledAt?: string | null;
  requestedBy?: string;
};

export async function getPublicationTargets(
  channelId: ID,
): Promise<ApiListSuccess<PublicationTarget>>;
export async function getPublicationTargets(
  filters?: PublicationTargetFilters,
): Promise<ApiListSuccess<PublicationTarget>>;
export async function getPublicationTargets(
  filters: ID | PublicationTargetFilters = {},
): Promise<ApiListSuccess<PublicationTarget>> {
  const normalized = typeof filters === "string" ? { channelId: filters } : filters;
  return requestApiEnvelope<ApiListSuccess<PublicationTarget>>(
    withQuery(PUBLICATION_TARGETS_PATH, normalized),
  );
}

export async function createPublicationTarget(
  input: CreatePublicationTargetInput,
): Promise<ApiSuccess<PublicationTarget>> {
  return requestApiEnvelope<ApiSuccess<PublicationTarget>>(PUBLICATION_TARGETS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getPublicationJobs(channelId: ID): Promise<ApiListSuccess<PublicationJob>>;
export async function getPublicationJobs(
  filters?: PublicationJobFilters,
): Promise<ApiListSuccess<PublicationJob>>;
export async function getPublicationJobs(
  filters: ID | PublicationJobFilters = {},
): Promise<ApiListSuccess<PublicationJob>> {
  const normalized = typeof filters === "string" ? { channelId: filters } : filters;
  return requestApiEnvelope<ApiListSuccess<PublicationJob>>(
    withQuery(PUBLICATIONS_PATH, normalized),
  );
}

export async function createPublicationJob(
  input: CreatePublicationJobInput,
): Promise<ApiSuccess<PublicationJob>> {
  return requestApiEnvelope<ApiSuccess<PublicationJob>>(PUBLICATIONS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function reschedulePublicationJob(
  publicationJobId: string,
  input: ReschedulePublicationJobInput,
): Promise<ApiSuccess<PublicationJob>> {
  return requestApiEnvelope<ApiSuccess<PublicationJob>>(
    `${PUBLICATIONS_PATH}/${publicationJobId}/reschedule`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function describePublicationsApiError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return "Nao foi possivel carregar as publicacoes.";
  }

  if (error.kind === "network") {
    return "Backend indisponivel. Tente novamente.";
  }

  if (error.kind === "timeout") {
    return "A requisicao de publicacoes expirou. Tente novamente.";
  }

  if (error.kind === "invalid_json") {
    return "O backend respondeu com um formato invalido.";
  }

  if (error.kind === "unexpected_envelope") {
    if (error.status === 404) {
      return "Publicacao ou alvo nao encontrado.";
    }

    if (error.code === "COMPLIANCE_BLOCKED") {
      return "A publicacao foi bloqueada por conformidade.";
    }

    if (error.code === "OPERATION_BLOCKED") {
      return "A publicacao foi bloqueada por aprovacao, readiness ou eligibility.";
    }

    if (error.status === 400) {
      return "Os dados de publicacao enviados sao invalidos.";
    }

    if (error.status === 409) {
      return "A publicacao entrou em conflito ou foi repetida.";
    }

    return "O backend respondeu de forma inesperada.";
  }

  return "Nao foi possivel carregar as publicacoes.";
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
