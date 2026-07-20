import { randomUUID } from "node:crypto";
import { existsSync, lstatSync, realpathSync, statSync } from "node:fs";
import path from "node:path";

import { AppError } from "../../http/errors.js";
import type { AuditRequestContext } from "../audit/audit.types.js";
import type { ChannelsRepository } from "../channels/channel.types.js";
import { isMimeExtensionPairAllowed, MAX_MEDIA_ASSET_SIZE_BYTES } from "./media-assets.schema.js";
import {
  buildInternalUri,
  checksumFile,
  detectFileMimeType,
  normalizeRelativeStoragePath,
  probeVideoFile,
  readFileSizeBytes,
  resolveAbsoluteStoragePath,
  resolveStorageRoot,
  validation,
} from "./media-assets.storage.js";
import type {
  IntegrityValidationInput,
  MediaAssetBase,
  MediaAssetCreateInput,
  MediaAssetIntegrityValidation,
  MediaAssetLicenseStatus,
  MediaAssetOrigin,
  MediaAssetPatchInput,
  MediaAssetStatus,
  MediaAssetStorageValidation,
  MediaAssetType,
  MediaAssetUsage,
  MediaAssetsDependencies,
  MediaAssetsRepository,
  MediaAssetsService,
  StorageReferenceValidationInput,
  VideoAssetFilters,
  VideoAssetImportInput,
  VideoAsset,
} from "./media-assets.types.js";

export type MediaAssetsClock = () => Date;
export type CreateMediaAssetsServiceOptions = {
  clock?: MediaAssetsClock;
  idFactory?: () => string;
  storageRoot?: string;
};

const usableOrigins: MediaAssetOrigin[] = [
  "internal",
  "generated",
  "uploaded",
  "licensed",
  "channel_provided",
  "public_domain",
  "external_authorized",
];

const usableLicenseStatuses: MediaAssetLicenseStatus[] = [
  "known",
  "verified",
  "not_applicable",
  "confirmed",
  "restricted",
  "attribution_required",
];

export function createMediaAssetsService(
  repository: MediaAssetsRepository,
  dependencies: MediaAssetsDependencies,
  options: CreateMediaAssetsServiceOptions = {},
): MediaAssetsService {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? (() => randomUUID());
  const storageRoot = resolveStorageRoot(
    options.storageRoot,
    path.resolve(process.cwd(), ".aralume", "storage", "media-assets"),
  );
  const importsInFlight = new Map<string, Promise<import("./media-assets.types.js").VideoAsset>>();

  return {
    listMediaAssets(filters) {
      assertChannelExists(dependencies.channelsRepository, filters.channelId);
      return repository.listMediaAssets(filters);
    },

    getMediaAsset(channelId, id) {
      assertChannelExists(dependencies.channelsRepository, channelId);
      return getAssetForChannel(
        repository,
        channelId,
        id,
        dependencies.auditRepository,
        clock,
        idFactory,
      );
    },

    createMediaAsset(input, requestId, auditContext) {
      try {
        assertChannelExists(dependencies.channelsRepository, input.channelId);
        assertMediaAssetSize(input.sizeBytes);
        if (!isMimeExtensionPairAllowed(input.mimeType, input.extension)) {
          throw validation("MIME type and extension are incompatible", {
            mimeType: input.mimeType,
            extension: input.extension,
          });
        }
        const storageValidation = validateStorageReferenceInternal(
          input.channelId,
          input.storagePath,
          input.type,
          storageRoot,
        );
        const now = clock().toISOString();
        const assetId = `ma_${idFactory()}`;
        const internalUri = buildInternalUri(input.channelId, assetId);
        const fileValidation =
          input.status === "available"
            ? validateAvailableMediaFile(
                storageRoot,
                storageValidation.normalizedStoragePath,
                input.mimeType,
                input.extension,
                input.sizeBytes,
                input.checksum,
              )
            : undefined;
        const integrity = buildIntegrity(
          input.checksum,
          input.sizeBytes,
          now,
          undefined,
          fileValidation,
        );
        assertUsableState(input.status, input.origin, input.licenseStatus, integrity);

        const asset: MediaAssetBase = {
          id: assetId,
          channelId: input.channelId,
          type: input.type,
          category: input.category,
          name: input.name.trim(),
          title: input.title?.trim() || input.name.trim(),
          description: input.description.trim(),
          mimeType: input.mimeType.trim(),
          extension: input.extension.trim().toLowerCase(),
          sizeBytes: input.sizeBytes,
          checksumAlgorithm: "sha256",
          checksum: input.checksum.toLowerCase(),
          internalUri,
          storagePath: storageValidation.normalizedStoragePath,
          origin: input.origin,
          provenance: input.provenance.trim(),
          licenseStatus: input.licenseStatus,
          licenseName: input.licenseName?.trim(),
          status: input.status,
          riskLevel: input.riskLevel,
          costActualCents: input.costActualCents,
          contentId: input.contentId,
          workflowRunId: input.workflowRunId,
          scriptId: input.scriptId,
          scenePlanId: input.scenePlanId,
          stepId: input.stepId,
          providerName: input.providerName?.trim(),
          modelName: input.modelName?.trim(),
          prompt: input.prompt?.trim(),
          thumbnailUri: input.thumbnailUri?.trim(),
          technicalMetadata: input.technicalMetadata,
          usageSummary: input.usageSummary?.trim(),
          sourceAssetId: input.sourceAssetId,
          notes: input.notes?.trim(),
          integrity,
          createdAt: now,
          updatedAt: now,
        };

        repository.upsertMediaAsset(asset);
        recordAudit(dependencies.auditRepository, {
          id: `au_${idFactory()}`,
          channelId: asset.channelId,
          requestId,
          ...auditActorFields(auditContext, requestId),
          action: "media_asset.registered",
          entityType: "MediaAsset",
          entityId: asset.id,
          status: "success",
          message: "Media asset registered.",
          metadata: {
            ...auditMetadata(auditContext),
            type: asset.type,
            category: asset.category,
            storagePath: asset.storagePath,
            internalUri: asset.internalUri,
            origin: asset.origin,
            licenseStatus: asset.licenseStatus,
            checksumAlgorithm: asset.checksumAlgorithm,
            sizeBytes: asset.sizeBytes,
            costActualCents: asset.costActualCents,
          },
          createdAt: now,
        });

        return asset;
      } catch (error) {
        auditRejectedMediaAsset(
          dependencies.auditRepository,
          idFactory,
          clock,
          input.channelId,
          requestId,
          auditContext,
          {
            action: "media_asset.registration_rejected",
            entityType: "MediaAsset",
            entityId: input.contentId ?? input.channelId,
            error,
            metadata: {
              type: input.type,
              storagePath: input.storagePath,
              origin: input.origin,
              licenseStatus: input.licenseStatus,
            },
          },
        );
        throw error;
      }
    },

    updateMediaAsset(channelId, id, input, requestId, auditContext) {
      try {
        const existing = getAssetForChannel(
          repository,
          channelId,
          id,
          dependencies.auditRepository,
          clock,
          idFactory,
          requestId,
        );
        const now = clock().toISOString();
        const nextStoragePath =
          input.storagePath !== undefined
            ? validateStorageReferenceInternal(
                channelId,
                input.storagePath,
                input.type ?? existing.type,
                storageRoot,
                id,
              ).normalizedStoragePath
            : existing.storagePath;
        const nextChecksum = input.checksum?.toLowerCase() ?? existing.checksum;
        const nextSizeBytes = input.sizeBytes ?? existing.sizeBytes;
        assertMediaAssetSize(nextSizeBytes);
        const nextMimeType = input.mimeType?.trim() ?? existing.mimeType;
        const nextExtension = input.extension?.trim().toLowerCase() ?? existing.extension;
        const nextStatus = input.status ?? existing.status;
        if (!isMimeExtensionPairAllowed(nextMimeType, nextExtension)) {
          throw validation("MIME type and extension are incompatible", {
            mimeType: nextMimeType,
            extension: nextExtension,
          });
        }
        const fileValidation =
          nextStatus === "available"
            ? validateAvailableMediaFile(
                storageRoot,
                nextStoragePath,
                nextMimeType,
                nextExtension,
                nextSizeBytes,
                nextChecksum,
              )
            : undefined;
        const nextIntegrity = buildIntegrity(
          nextChecksum,
          nextSizeBytes,
          now,
          existing.integrity,
          fileValidation,
        );
        const next: MediaAssetBase = {
          ...existing,
          ...input,
          title: input.title?.trim() ?? existing.title,
          name: input.name?.trim() ?? existing.name,
          description: input.description?.trim() ?? existing.description,
          mimeType: nextMimeType,
          extension: nextExtension,
          sizeBytes: nextSizeBytes,
          checksum: nextChecksum,
          storagePath: nextStoragePath,
          origin: input.origin ?? existing.origin,
          provenance: input.provenance?.trim() ?? existing.provenance,
          licenseStatus: input.licenseStatus ?? existing.licenseStatus,
          licenseName: input.licenseName?.trim() ?? existing.licenseName,
          status: nextStatus,
          riskLevel: input.riskLevel ?? existing.riskLevel,
          costActualCents: input.costActualCents ?? existing.costActualCents,
          providerName: input.providerName?.trim() ?? existing.providerName,
          modelName: input.modelName?.trim() ?? existing.modelName,
          prompt: input.prompt?.trim() ?? existing.prompt,
          thumbnailUri: input.thumbnailUri?.trim() ?? existing.thumbnailUri,
          technicalMetadata: input.technicalMetadata ?? existing.technicalMetadata,
          usageSummary: input.usageSummary?.trim() ?? existing.usageSummary,
          sourceAssetId: input.sourceAssetId ?? existing.sourceAssetId,
          notes: input.notes?.trim() ?? existing.notes,
          integrity: nextIntegrity,
          updatedAt: now,
        };

        assertUsableState(next.status, next.origin, next.licenseStatus, next.integrity);
        repository.upsertMediaAsset(next);
        recordAudit(dependencies.auditRepository, {
          id: `au_${idFactory()}`,
          channelId,
          requestId,
          ...auditActorFields(auditContext, requestId),
          action: "media_asset.updated",
          entityType: "MediaAsset",
          entityId: next.id,
          status: "success",
          message: "Media asset metadata updated.",
          metadata: {
            changedFields: Object.keys(input),
            storagePath: next.storagePath,
            checksum: next.checksum,
            sizeBytes: next.sizeBytes,
            status: next.status,
          },
          createdAt: now,
        });
        return next;
      } catch (error) {
        auditRejectedMediaAsset(
          dependencies.auditRepository,
          idFactory,
          clock,
          channelId,
          requestId,
          auditContext,
          {
            action: "media_asset.update_rejected",
            entityType: "MediaAsset",
            entityId: id,
            error,
            metadata: {
              ...auditMetadata(auditContext),
              changedFields: Object.keys(input),
              storagePath: input.storagePath,
              origin: input.origin,
              licenseStatus: input.licenseStatus,
            },
          },
        );
        throw error;
      }
    },

    validateStorageReference(input, auditContext) {
      try {
        assertChannelExists(dependencies.channelsRepository, input.channelId);
        const result = validateStorageReferenceInternal(
          input.channelId,
          input.storagePath,
          input.type,
          storageRoot,
        );
        recordAudit(dependencies.auditRepository, {
          id: `au_${idFactory()}`,
          channelId: input.channelId,
          ...auditActorFields(auditContext),
          action: "media_asset.storage_validated",
          entityType: "MediaAsset",
          entityId: `storage:${input.channelId}:${result.normalizedStoragePath}`,
          status: "success",
          message: "Storage reference validated.",
          metadata: {
            ...auditMetadata(auditContext),
            type: input.type,
            storagePath: result.normalizedStoragePath,
            internalUri: result.internalUri,
          },
          createdAt: clock().toISOString(),
        });
        return result;
      } catch (error) {
        auditRejectedMediaAsset(
          dependencies.auditRepository,
          idFactory,
          clock,
          input.channelId,
          undefined,
          auditContext,
          {
            action: "media_asset.storage_rejected",
            entityType: "MediaAsset",
            entityId: input.storagePath,
            error,
            metadata: {
              type: input.type,
              storagePath: input.storagePath,
            },
          },
        );
        throw error;
      }
    },

    validateAssetIntegrity(channelId, id, input, auditContext) {
      const asset = getAssetForChannel(
        repository,
        channelId,
        id,
        dependencies.auditRepository,
        clock,
        idFactory,
      );
      const observedChecksum = input?.checksum?.toLowerCase();
      const observedSizeBytes = input?.sizeBytes;
      const checksumMatches =
        observedChecksum === undefined ? true : observedChecksum === asset.checksum;
      const sizeMatches =
        observedSizeBytes === undefined ? true : observedSizeBytes === asset.sizeBytes;
      const valid = checksumMatches && sizeMatches && asset.status === "available";
      const now = clock().toISOString();
      const next: MediaAssetBase = {
        ...asset,
        integrity: {
          checksumAlgorithm: asset.integrity?.checksumAlgorithm ?? "sha256",
          checksum: asset.checksum,
          sizeBytes: asset.sizeBytes,
          lastValidatedAt: now,
          observedChecksum: observedChecksum ?? asset.checksum,
          observedSizeBytes: observedSizeBytes ?? asset.sizeBytes,
          checksumMatches,
          sizeMatches,
        },
        status: valid ? asset.status : asset.status === "missing" ? "missing" : asset.status,
        updatedAt: now,
      };

      if (!checksumMatches || !sizeMatches) {
        next.status = "corrupted";
      }

      repository.upsertMediaAsset(next);
      recordAudit(dependencies.auditRepository, {
        id: `au_${idFactory()}`,
        channelId,
        ...auditActorFields(auditContext),
        action: valid ? "media_asset.integrity_validated" : "media_asset.integrity_mismatch",
        entityType: "MediaAsset",
        entityId: next.id,
        status: valid ? "success" : "warning",
        message: valid ? "Media asset integrity validated." : "Media asset integrity mismatch.",
        metadata: {
          ...auditMetadata(auditContext),
          checksumMatches,
          sizeMatches,
          observedChecksum,
          observedSizeBytes,
          expectedChecksum: asset.checksum,
          expectedSizeBytes: asset.sizeBytes,
        },
        createdAt: now,
      });

      if (!valid) {
        throw conflict("Media asset integrity validation failed", {
          assetId: asset.id,
          checksumMatches,
          sizeMatches,
        });
      }

      return {
        channelId,
        assetId: asset.id,
        expectedChecksum: asset.checksum,
        expectedSizeBytes: asset.sizeBytes,
        observedChecksum,
        observedSizeBytes,
        checksumMatches,
        sizeMatches,
        valid,
      };
    },

    listMediaAssetUsages(channelId, id) {
      const asset = getAssetForChannel(
        repository,
        channelId,
        id,
        dependencies.auditRepository,
        clock,
        idFactory,
      );
      return buildUsages(asset);
    },

    listVideoAssets(filters) {
      assertChannelExists(dependencies.channelsRepository, filters.channelId);
      return repository.listVideoAssets(filters);
    },

    getVideoAsset(channelId, id) {
      assertChannelExists(dependencies.channelsRepository, channelId);
      const found = repository.getVideoAsset(id);
      if (!found) {
        recordAudit(dependencies.auditRepository, {
          id: `au_${idFactory()}`,
          channelId,
          actorType: "system",
          actorName: "Aralume Core",
          action: "video_asset.not_found",
          entityType: "VideoAsset",
          entityId: id,
          status: "failed",
          message: "Video asset not found.",
          metadata: { channelId, entityId: id },
          createdAt: clock().toISOString(),
        });
        throw notFound("Video asset not found", { channelId, id });
      }

      if (found.channelId !== channelId) {
        auditCrossChannelAttempt(
          dependencies.auditRepository,
          channelId,
          id,
          "video_asset.cross_channel_denied",
          idFactory,
          clock().toISOString(),
        );
        throw notFound("Video asset not found", { channelId, id });
      }

      return found;
    },

    async importVideoAssetFromStorage(input: VideoAssetImportInput, auditContext) {
      assertChannelExists(dependencies.channelsRepository, input.channelId);
      const content = dependencies.editorialRepository?.getContentIdea(input.contentId);
      if (!content || content.channelId !== input.channelId) {
        throw notFound("Content is not available for this channel", {
          channelId: input.channelId,
          contentId: input.contentId,
        });
      }

      const key = `${input.channelId}:${input.idempotencyKey}`;
      const fingerprint = JSON.stringify({
        channelId: input.channelId,
        storagePath: input.storagePath,
        title: input.title,
        description: input.description,
        origin: input.origin,
        provenance: input.provenance,
        licenseStatus: input.licenseStatus,
        licenseName: input.licenseName,
        contentId: input.contentId,
      });
      const existing = findImportedVideo(repository, input.channelId, input.idempotencyKey);
      if (existing) {
        assertImportFingerprint(existing, fingerprint, input.channelId, input.idempotencyKey);
        recordImportAudit(
          dependencies.auditRepository,
          idFactory,
          clock,
          input.channelId,
          existing.id,
          "video_asset.import_idempotent_replay",
          {
            storagePath: existing.storagePath,
            idempotencyKey: input.idempotencyKey,
          },
          auditContext,
        );
        return existing;
      }

      const current = importsInFlight.get(key);
      if (current) {
        const result = await current;
        assertImportFingerprint(result, fingerprint, input.channelId, input.idempotencyKey);
        return result;
      }

      const operation = (async () => {
        try {
          const validation = validateStorageReferenceInternal(
            input.channelId,
            input.storagePath,
            "video",
            storageRoot,
          );
          const absolutePath = validationPath(storageRoot, validation.normalizedStoragePath);
          if (!existsSync(absolutePath) || !lstatSync(absolutePath).isFile()) {
            throw validationError("Video file is not available", {
              reason: "VIDEO_FILE_NOT_FOUND",
              channelId: input.channelId,
              storagePath: validation.normalizedStoragePath,
            });
          }
          if (lstatSync(absolutePath).isSymbolicLink()) {
            throw validationError("Video file must be a regular file", {
              reason: "VIDEO_SYMLINK_REJECTED",
              channelId: input.channelId,
              storagePath: validation.normalizedStoragePath,
            });
          }
          if (
            !supportedVideoExtensions.has(
              path.extname(validation.normalizedStoragePath).toLowerCase(),
            )
          ) {
            throw validationError("Video extension is not supported", {
              reason: "VIDEO_EXTENSION_UNSUPPORTED",
              channelId: input.channelId,
              storagePath: validation.normalizedStoragePath,
            });
          }
          const observedSizeBytes = readFileSizeBytes(absolutePath);
          if (observedSizeBytes <= 0) {
            throw validationError("Video file must not be empty", {
              reason: "VIDEO_FILE_EMPTY",
              channelId: input.channelId,
              storagePath: validation.normalizedStoragePath,
            });
          }
          if (observedSizeBytes > MAX_MEDIA_ASSET_SIZE_BYTES) {
            throw validationError("Video file exceeds the allowed size", {
              reason: "VIDEO_FILE_TOO_LARGE",
              channelId: input.channelId,
              storagePath: validation.normalizedStoragePath,
            });
          }
          recordImportAudit(
            dependencies.auditRepository,
            idFactory,
            clock,
            input.channelId,
            `storage:${validation.normalizedStoragePath}`,
            "video_asset.import_validation_started",
            { storagePath: validation.normalizedStoragePath },
            auditContext,
          );
          const probe = await probeVideoFile(absolutePath);
          if (!isMp4Container(probe.containerFormat)) {
            throw validationError("Video container does not match the authorized MP4 contract", {
              reason: "VIDEO_CONTAINER_MISMATCH",
            });
          }
          const checksum = checksumFile(absolutePath);
          const finalSizeBytes = readFileSizeBytes(absolutePath);
          if (finalSizeBytes !== observedSizeBytes) {
            throw conflict("Video file changed during validation", {
              reason: "VIDEO_FILE_CHANGED",
              channelId: input.channelId,
              storagePath: validation.normalizedStoragePath,
            });
          }
          const now = clock().toISOString();
          const assetId = `vd_${idFactory()}`;
          const format: VideoAsset["format"] =
            probe.width === probe.height
              ? "square"
              : probe.width > probe.height
                ? "horizontal"
                : "vertical";
          const asset = {
            id: assetId,
            channelId: input.channelId,
            contentId: input.contentId,
            title: input.title.trim(),
            status: "approved" as const,
            durationSeconds: probe.durationSeconds,
            format,
            resolution: `${probe.width}x${probe.height}`,
            renderStatus: "rendered" as const,
            qualityStatus: "passed" as const,
            complianceStatus: "approved" as const,
            costActualCents: 0,
            type: "video" as const,
            origin: input.origin,
            licenseStatus: input.licenseStatus,
            internalUri: buildInternalUri(input.channelId, assetId),
            storagePath: validation.normalizedStoragePath,
            mimeType: mimeTypeForExtension(path.extname(validation.normalizedStoragePath)),
            sizeBytes: finalSizeBytes,
            checksumAlgorithm: "sha256" as const,
            checksum,
            riskLevel: "ok" as const,
            technicalMetadata: {
              container: probe.containerFormat,
              codec: probe.videoCodec,
              width: probe.width,
              height: probe.height,
              durationSeconds: probe.durationSeconds,
              importedFromStorage: true,
              importIdempotencyKey: input.idempotencyKey,
              importRequestFingerprint: fingerprint,
              description: input.description.trim(),
              provenance: input.provenance.trim(),
              licenseName: input.licenseName?.trim(),
            },
            createdAt: now,
            updatedAt: now,
          };
          repository.upsertVideoAsset(asset);
          recordImportAudit(
            dependencies.auditRepository,
            idFactory,
            clock,
            input.channelId,
            asset.id,
            "video_asset.import_completed",
            {
              storagePath: asset.storagePath,
              sizeBytes: asset.sizeBytes,
              checksum,
              durationSeconds: asset.durationSeconds,
              resolution: asset.resolution,
            },
            auditContext,
          );
          return asset;
        } catch (error) {
          recordImportAudit(
            dependencies.auditRepository,
            idFactory,
            clock,
            input.channelId,
            `storage:${input.storagePath}`,
            "video_asset.import_failed",
            {
              storagePath: input.storagePath,
              reason: error instanceof AppError ? error.code : "IMPORT_FAILED",
            },
            auditContext,
          );
          throw error;
        }
      })();
      importsInFlight.set(key, operation);
      try {
        return await operation;
      } finally {
        importsInFlight.delete(key);
      }
    },

    listDerivedClips(filters) {
      assertChannelExists(dependencies.channelsRepository, filters.channelId);
      return repository.listDerivedClips(filters);
    },

    getDerivedClip(channelId, id) {
      assertChannelExists(dependencies.channelsRepository, channelId);
      const found = repository.getDerivedClip(id);
      if (!found) {
        recordAudit(dependencies.auditRepository, {
          id: `au_${idFactory()}`,
          channelId,
          actorType: "system",
          actorName: "Aralume Core",
          action: "derived_clip.not_found",
          entityType: "DerivedClip",
          entityId: id,
          status: "failed",
          message: "Derived clip not found.",
          metadata: { channelId, entityId: id },
          createdAt: clock().toISOString(),
        });
        throw notFound("Derived clip not found", { channelId, id });
      }

      if (found.channelId !== channelId) {
        auditCrossChannelAttempt(
          dependencies.auditRepository,
          channelId,
          id,
          "derived_clip.cross_channel_denied",
          idFactory,
          clock().toISOString(),
        );
        throw notFound("Derived clip not found", { channelId, id });
      }

      return found;
    },
  };
}

function getAssetForChannel(
  repository: MediaAssetsRepository,
  channelId: string,
  id: string,
  auditRepository: MediaAssetsDependencies["auditRepository"],
  clock: () => Date,
  idFactory: () => string,
  requestId?: string,
): MediaAssetBase {
  const found = repository.getMediaAsset(id);
  if (!found) {
    recordAudit(auditRepository, {
      id: `au_${idFactory()}`,
      channelId,
      requestId,
      actorType: "system",
      actorName: "Aralume Core",
      action: "media_asset.not_found",
      entityType: "MediaAsset",
      entityId: id,
      status: "failed",
      message: "Media asset not found.",
      metadata: { channelId, entityId: id },
      createdAt: clock().toISOString(),
    });
    throw notFound("Media asset not found", { channelId, id });
  }

  if (found.channelId !== channelId) {
    auditCrossChannelAttempt(
      auditRepository,
      channelId,
      id,
      "media_asset.cross_channel_denied",
      idFactory,
      clock().toISOString(),
      requestId,
    );
    throw notFound("Media asset not found", { channelId, id });
  }

  return found;
}

function validateStorageReferenceInternal(
  channelId: string,
  storagePath: string,
  type: MediaAssetType,
  storageRoot: string,
  assetId?: string,
): MediaAssetStorageValidation {
  const normalizedStoragePath = normalizeRelativeStoragePath(storagePath);
  assertStoragePathMatchesChannel(channelId, normalizedStoragePath);
  resolveAbsoluteStoragePath(storageRoot, normalizedStoragePath);
  const previewId = normalizedStoragePath.replaceAll("/", "_").replaceAll(".", "_");
  return {
    channelId,
    type,
    storagePath: normalizedStoragePath,
    normalizedStoragePath,
    internalUri: assetId
      ? buildInternalUri(channelId, assetId)
      : buildInternalUri(channelId, `preview_${previewId}`),
  };
}

type ValidatedMediaFile = {
  observedChecksum: string;
  observedSizeBytes: number;
};

function validateAvailableMediaFile(
  storageRoot: string,
  normalizedStoragePath: string,
  declaredMimeType: string,
  declaredExtension: string,
  declaredSizeBytes: number,
  declaredChecksum: string,
): ValidatedMediaFile {
  const resolution = resolveAbsoluteStoragePath(storageRoot, normalizedStoragePath);
  let fileStats: ReturnType<typeof statSync>;
  try {
    const linkStats = lstatSync(resolution.absolutePath);
    if (linkStats.isSymbolicLink() || !linkStats.isFile()) {
      throw validation("Media asset file validation failed", { reason: "MEDIA_FILE_INVALID" });
    }
    fileStats = statSync(resolution.absolutePath);
    const realRoot = realpathSync(storageRoot);
    const realFile = realpathSync(resolution.absolutePath);
    const relative = path.relative(realRoot, realFile);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw validation("Media asset file validation failed", { reason: "MEDIA_FILE_OUTSIDE_ROOT" });
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw validation("Media asset file validation failed", { reason: "MEDIA_FILE_UNAVAILABLE" });
  }

  const actualExtension = path.posix.extname(normalizedStoragePath).slice(1).toLowerCase();
  if (actualExtension !== declaredExtension.trim().toLowerCase().replace(/^\./, "")) {
    throw validation("Media asset file validation failed", { reason: "MEDIA_EXTENSION_MISMATCH" });
  }

  const actualMimeType = detectFileMimeType(resolution.absolutePath);
  if (!actualMimeType || !mimeTypesMatch(actualMimeType, declaredMimeType)) {
    throw validation("Media asset file validation failed", { reason: "MEDIA_MIME_MISMATCH" });
  }
  if (fileStats.size !== declaredSizeBytes) {
    throw validation("Media asset file validation failed", { reason: "MEDIA_SIZE_MISMATCH" });
  }

  const observedChecksum = checksumFile(resolution.absolutePath);
  if (observedChecksum !== declaredChecksum.trim().toLowerCase()) {
    throw validation("Media asset file validation failed", { reason: "MEDIA_CHECKSUM_MISMATCH" });
  }

  return {
    observedChecksum,
    observedSizeBytes: fileStats.size,
  };
}

function mimeTypesMatch(actualMimeType: string, declaredMimeType: string): boolean {
  const actual = actualMimeType.trim().toLowerCase();
  const declared = declaredMimeType.trim().toLowerCase();
  return actual === declared || (actual === "audio/wav" && declared === "audio/x-wav");
}

function assertStoragePathMatchesChannel(channelId: string, storagePath: string): void {
  const [pathChannelId, ...segments] = storagePath.split("/");
  if (pathChannelId !== channelId || segments.length < 2) {
    throw validation("Storage path must stay within the active channel namespace", {
      channelId,
      storagePath,
    });
  }
}

function buildIntegrity(
  checksum: string,
  sizeBytes: number,
  now: string,
  existing?: MediaAssetBase["integrity"],
  fileValidation?: ValidatedMediaFile,
) {
  return {
    checksumAlgorithm: existing?.checksumAlgorithm ?? "sha256",
    checksum,
    sizeBytes,
    lastValidatedAt: now,
    observedChecksum: fileValidation?.observedChecksum ?? existing?.observedChecksum,
    observedSizeBytes: fileValidation?.observedSizeBytes ?? existing?.observedSizeBytes,
    checksumMatches: fileValidation ? true : existing?.checksumMatches,
    sizeMatches: fileValidation ? true : existing?.sizeMatches,
  };
}

function assertUsableState(
  status: MediaAssetStatus,
  origin: MediaAssetOrigin,
  licenseStatus: MediaAssetLicenseStatus,
  integrity?: MediaAssetBase["integrity"],
): void {
  if (status === "available") {
    if (!usableOrigins.includes(origin)) {
      throw conflict("Media asset origin is not usable", { origin, status });
    }

    if (!usableLicenseStatuses.includes(licenseStatus)) {
      throw conflict("Media asset license is not usable", { licenseStatus, status });
    }

    if (!integrity?.checksum || integrity.sizeBytes <= 0) {
      throw conflict("Media asset integrity metadata is incomplete", {
        checksum: integrity?.checksum,
        sizeBytes: integrity?.sizeBytes,
      });
    }
  }

  if (origin === "unknown" || origin === "prohibited") {
    if (status === "available") {
      throw conflict("Media asset origin cannot be marked usable", { origin });
    }
  }

  if (
    licenseStatus === "pending" ||
    licenseStatus === "unconfirmed" ||
    licenseStatus === "blocked"
  ) {
    if (status === "available") {
      throw conflict("Media asset license cannot be marked usable", { licenseStatus });
    }
  }
}

function buildUsages(asset: MediaAssetBase): MediaAssetUsage[] {
  const usages: MediaAssetUsage[] = [];
  const now = asset.updatedAt;

  if (asset.contentId) {
    usages.push({
      id: `usage_${asset.id}_content`,
      channelId: asset.channelId,
      assetId: asset.id,
      usageType: "content",
      referenceId: asset.contentId,
      referenceLabel: "Content",
      summary: asset.usageSummary ?? "Linked to content item.",
      createdAt: now,
    });
  }

  if (asset.workflowRunId) {
    usages.push({
      id: `usage_${asset.id}_workflow`,
      channelId: asset.channelId,
      assetId: asset.id,
      usageType: "workflow_run",
      referenceId: asset.workflowRunId,
      referenceLabel: "Workflow",
      summary: "Linked to workflow execution.",
      createdAt: now,
    });
  }

  if (asset.scriptId) {
    usages.push({
      id: `usage_${asset.id}_script`,
      channelId: asset.channelId,
      assetId: asset.id,
      usageType: "script",
      referenceId: asset.scriptId,
      referenceLabel: "Script",
      summary: "Linked to script source.",
      createdAt: now,
    });
  }

  if (asset.scenePlanId) {
    usages.push({
      id: `usage_${asset.id}_scene`,
      channelId: asset.channelId,
      assetId: asset.id,
      usageType: "scene",
      referenceId: asset.scenePlanId,
      referenceLabel: "Scene",
      summary: "Linked to a visual scene requirement.",
      createdAt: now,
    });
  }

  return usages;
}

function auditCrossChannelAttempt(
  auditRepository: MediaAssetsDependencies["auditRepository"],
  channelId: string,
  entityId: string,
  action: string,
  idFactory: () => string,
  now: string,
  requestId?: string,
): void {
  recordAudit(auditRepository, {
    id: `au_${idFactory()}`,
    channelId,
    requestId,
    actorType: "system",
    actorName: "Aralume Core",
    action,
    entityType: "MediaAsset",
    entityId,
    status: "failed",
    message: "Cross-channel media access rejected.",
    metadata: { channelId, entityId },
    createdAt: now,
  });
}

function auditRejectedMediaAsset(
  auditRepository: MediaAssetsDependencies["auditRepository"],
  idFactory: () => string,
  clock: () => Date,
  channelId: string,
  requestId: string | undefined,
  auditContext: AuditRequestContext | undefined,
  input: {
    action: string;
    entityType: string;
    entityId: string;
    error: unknown;
    metadata?: Record<string, unknown>;
  },
): void {
  if (!(input.error instanceof AppError)) {
    return;
  }

  if (input.error.status !== 400 && input.error.status !== 409) {
    return;
  }

  recordAudit(auditRepository, {
    id: `au_${idFactory()}`,
    channelId,
    ...auditActorFields(auditContext, requestId),
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    status: "warning",
    message: input.error.message,
    metadata: {
      ...auditMetadata(auditContext),
      ...input.metadata,
      errorStatus: input.error.status,
      errorCode: input.error.code,
      errorDetails: input.error.details,
    },
    createdAt: clock().toISOString(),
  });
}

function recordAudit(
  auditRepository: MediaAssetsDependencies["auditRepository"],
  log: Parameters<MediaAssetsDependencies["auditRepository"]["appendAuditLog"]>[0],
): void {
  auditRepository.appendAuditLog(log);
}

const supportedVideoExtensions = new Set([".mp4", ".mov", ".webm", ".mkv"]);

function validationPath(storageRoot: string, normalizedStoragePath: string): string {
  return resolveAbsoluteStoragePath(storageRoot, normalizedStoragePath).absolutePath;
}

function mimeTypeForExtension(extension: string): string {
  return extension === ".webm"
    ? "video/webm"
    : extension === ".mov"
      ? "video/quicktime"
      : "video/mp4";
}

function validationError(message: string, details: Record<string, unknown>): AppError {
  return new AppError({ code: "VALIDATION_ERROR", status: 400, message, details });
}

function findImportedVideo(
  repository: MediaAssetsRepository,
  channelId: string,
  idempotencyKey: string,
): VideoAsset | undefined {
  return repository
    .listVideoAssets({ channelId })
    .find((asset) => asset.technicalMetadata?.importIdempotencyKey === idempotencyKey);
}

function assertImportFingerprint(
  asset: VideoAsset,
  fingerprint: string,
  channelId: string,
  idempotencyKey: string,
): void {
  if (asset.technicalMetadata?.importRequestFingerprint !== fingerprint) {
    throw conflict("Idempotency key already used for a different import request", {
      channelId,
      idempotencyKey,
    });
  }
}

function recordImportAudit(
  auditRepository: MediaAssetsDependencies["auditRepository"],
  idFactory: () => string,
  clock: () => Date,
  channelId: string,
  entityId: string,
  action: string,
  metadata: Record<string, unknown>,
  auditContext?: AuditRequestContext,
): void {
  recordAudit(auditRepository, {
    id: `au_${idFactory()}`,
    channelId,
    ...auditActorFields(auditContext),
    action,
    entityType: "VideoAsset",
    entityId,
    status: action.endsWith("failed") ? "failed" : "success",
    message: "Video asset import event.",
    metadata: { ...auditMetadata(auditContext), ...metadata },
    createdAt: clock().toISOString(),
  });
}

function isMp4Container(containerFormat: string): boolean {
  return ["mov", "mp4"].includes(containerFormat.trim().toLowerCase());
}

function auditActorFields(
  auditContext: AuditRequestContext | undefined,
  fallbackRequestId?: string,
): {
  requestId?: string;
  actorType: "user" | "system";
  actorName: string;
} {
  return auditContext
    ? {
        requestId: auditContext.requestId,
        actorType: "user",
        actorName: auditContext.actorName,
      }
    : {
        requestId: fallbackRequestId,
        actorType: "system",
        actorName: "Aralume Core",
      };
}

function auditMetadata(auditContext: AuditRequestContext | undefined): Record<string, unknown> {
  return auditContext
    ? {
        actorId: auditContext.actorId,
        role: auditContext.role,
      }
    : {};
}

function assertChannelExists(channelsRepository: ChannelsRepository, channelId: string): void {
  if (!channelsRepository.getChannel(channelId)) {
    throw notFound("Channel not found", { channelId });
  }
}

function assertMediaAssetSize(sizeBytes: number): void {
  if (sizeBytes > MAX_MEDIA_ASSET_SIZE_BYTES) {
    throw validation("Media asset exceeds the allowed size", {
      maxSizeBytes: MAX_MEDIA_ASSET_SIZE_BYTES,
    });
  }
}

function notFound(message: string, details: Record<string, unknown>): AppError {
  return new AppError({
    code: "NOT_FOUND",
    status: 404,
    message,
    details,
  });
}

function conflict(message: string, details: Record<string, unknown>): AppError {
  return new AppError({
    code: "CONFLICT",
    status: 409,
    message,
    details,
  });
}
