import type { ApiListSuccess, ApiSuccess } from "@/contracts/api-contracts";
import type {
  DerivedClip,
  DerivedClipFilters,
  ID,
  MediaAssetBase,
  MediaAssetCategory,
  MediaAssetLicenseStatus,
  MediaAssetOrigin,
  MediaAssetStatus,
  MediaAssetType,
  MediaAssetUsage,
  VideoAsset,
} from "@/contracts/types";

import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

export type MediaAssetFilters = {
  channelId: ID;
  type?: MediaAssetType;
  category?: MediaAssetCategory;
  status?: MediaAssetStatus;
  riskLevel?: MediaAssetBase["riskLevel"];
  origin?: MediaAssetOrigin;
  licenseStatus?: MediaAssetLicenseStatus;
  search?: string;
  contentId?: ID;
};

export type CreateMediaAssetInput = Pick<
  MediaAssetBase,
  | "channelId"
  | "type"
  | "name"
  | "title"
  | "description"
  | "mimeType"
  | "extension"
  | "sizeBytes"
  | "checksum"
  | "storagePath"
  | "origin"
  | "provenance"
  | "licenseStatus"
  | "licenseName"
  | "status"
  | "riskLevel"
  | "costActualCents"
  | "contentId"
  | "workflowRunId"
  | "scriptId"
  | "scenePlanId"
  | "stepId"
  | "providerName"
  | "modelName"
  | "prompt"
  | "thumbnailUri"
  | "technicalMetadata"
  | "usageSummary"
  | "sourceAssetId"
  | "notes"
  | "category"
> & {
  category: MediaAssetCategory;
  name: string;
  title: string;
  description: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  checksum: string;
  storagePath: string;
  origin: MediaAssetOrigin;
  provenance: string;
  licenseStatus: MediaAssetLicenseStatus;
  status: MediaAssetStatus;
  riskLevel: MediaAssetBase["riskLevel"];
  costActualCents: number;
};

export type UpdateMediaAssetInput = Partial<Omit<CreateMediaAssetInput, "channelId">>;

export type StorageReferenceValidationInput = {
  channelId: ID;
  type: MediaAssetType;
  storagePath: string;
};

export type IntegrityValidationInput = {
  channelId: ID;
  checksum?: string;
  sizeBytes?: number;
};

export type CreateDerivedClipInput = {
  channelId: ID;
  parentVideoId: ID;
  startSeconds: number;
  endSeconds: number;
  idempotencyKey: string;
  targetPlatform?: DerivedClip["targetPlatform"];
  title?: string;
  hook?: string;
  description?: string;
  requestedBy?: string;
};

const MEDIA_ASSETS_PATH = "/media-assets";
const VIDEOS_PATH = "/videos";
const CLIPS_PATH = "/clips";

export async function getMediaAssets(
  filters: MediaAssetFilters,
): Promise<ApiListSuccess<MediaAssetBase>> {
  return requestApiEnvelope<ApiListSuccess<MediaAssetBase>>(withQuery(MEDIA_ASSETS_PATH, filters));
}

export async function getMediaAsset(channelId: ID, id: ID): Promise<ApiSuccess<MediaAssetBase>> {
  return requestApiEnvelope<ApiSuccess<MediaAssetBase>>(
    withQuery(`${MEDIA_ASSETS_PATH}/${id}`, { channelId }),
  );
}

export async function createMediaAsset(
  input: CreateMediaAssetInput,
): Promise<ApiSuccess<MediaAssetBase>> {
  return requestApiEnvelope<ApiSuccess<MediaAssetBase>>(MEDIA_ASSETS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateMediaAsset(
  channelId: ID,
  id: ID,
  input: UpdateMediaAssetInput,
): Promise<ApiSuccess<MediaAssetBase>> {
  return requestApiEnvelope<ApiSuccess<MediaAssetBase>>(`${MEDIA_ASSETS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ channelId, ...input }),
  });
}

export async function validateMediaStorageReference(
  input: StorageReferenceValidationInput,
): Promise<
  ApiSuccess<{
    channelId: ID;
    type: MediaAssetType;
    storagePath: string;
    normalizedStoragePath: string;
    internalUri: string;
  }>
> {
  return requestApiEnvelope<
    ApiSuccess<{
      channelId: ID;
      type: MediaAssetType;
      storagePath: string;
      normalizedStoragePath: string;
      internalUri: string;
    }>
  >(`${MEDIA_ASSETS_PATH}/validate-storage`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function validateMediaAssetIntegrity(
  id: ID,
  input: IntegrityValidationInput,
): Promise<
  ApiSuccess<{
    channelId: ID;
    assetId: ID;
    expectedChecksum: string;
    expectedSizeBytes: number;
    observedChecksum?: string;
    observedSizeBytes?: number;
    checksumMatches: boolean;
    sizeMatches: boolean;
    valid: boolean;
  }>
> {
  return requestApiEnvelope<
    ApiSuccess<{
      channelId: ID;
      assetId: ID;
      expectedChecksum: string;
      expectedSizeBytes: number;
      observedChecksum?: string;
      observedSizeBytes?: number;
      checksumMatches: boolean;
      sizeMatches: boolean;
      valid: boolean;
    }>
  >(`${MEDIA_ASSETS_PATH}/${id}/validate-integrity`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getMediaAssetUsages(
  channelId: ID,
  id: ID,
): Promise<ApiListSuccess<MediaAssetUsage>> {
  return requestApiEnvelope<ApiListSuccess<MediaAssetUsage>>(
    withQuery(`${MEDIA_ASSETS_PATH}/${id}/usages`, { channelId }),
  );
}

export async function getVideoAssets(channelId: ID): Promise<ApiListSuccess<VideoAsset>> {
  return requestApiEnvelope<ApiListSuccess<VideoAsset>>(withQuery(VIDEOS_PATH, { channelId }));
}

export async function getDerivedClips(
  filters: DerivedClipFilters,
): Promise<ApiListSuccess<DerivedClip>> {
  return requestApiEnvelope<ApiListSuccess<DerivedClip>>(withQuery(CLIPS_PATH, filters));
}

export async function getDerivedClip(channelId: ID, id: ID): Promise<ApiSuccess<DerivedClip>> {
  return requestApiEnvelope<ApiSuccess<DerivedClip>>(
    withQuery(`${CLIPS_PATH}/${id}`, { channelId }),
  );
}

export async function createDerivedClip(
  input: CreateDerivedClipInput,
): Promise<ApiSuccess<DerivedClip>> {
  return requestApiEnvelope<ApiSuccess<DerivedClip>>(CLIPS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function describeMediaAssetsApiError(
  error: unknown,
  context: "assets" | "storage" | "integrity" | "videos" | "clips" = "assets",
): string {
  if (!(error instanceof ApiRequestError)) {
    return "Nao foi possivel carregar os ativos de midia.";
  }

  if (error.kind === "network") {
    return "Backend indisponivel. Tente novamente.";
  }

  if (error.kind === "timeout") {
    return "A requisicao de midia expirou. Tente novamente.";
  }

  if (error.kind === "invalid_json") {
    return "O backend respondeu com um formato invalido.";
  }

  if (error.kind === "unexpected_envelope") {
    if (error.status === 404) {
      switch (context) {
        case "storage":
          return "Referencia de storage nao encontrada.";
        case "integrity":
          return "Integridade do ativo nao encontrada.";
        case "videos":
          return "Video nao encontrado.";
        case "clips":
          return "Corte nao encontrado.";
        default:
          return "Ativo de midia nao encontrado.";
      }
    }

    if (error.status === 409) {
      return "O ativo de midia entrou em conflito.";
    }

    if (error.status === 400) {
      return "Os dados de midia enviados sao invalidos.";
    }

    return "O backend respondeu de forma inesperada.";
  }

  return "Nao foi possivel carregar os ativos de midia.";
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
