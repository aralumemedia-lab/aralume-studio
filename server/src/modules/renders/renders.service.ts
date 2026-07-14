import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, renameSync, rmSync, statSync } from "node:fs";
import path from "node:path";

import { AppError } from "../../http/errors.js";
import type { EditorialRepository } from "../editorial/editorial.types.js";
import type { ChannelsRepository } from "../channels/channel.types.js";
import type { CostsService } from "../costs/costs.types.js";
import {
  buildInternalUri,
  checksumFile,
  normalizeRelativeStoragePath,
  readFileSizeBytes,
  resolveAbsoluteStoragePath,
  resolveStorageRoot,
} from "../media-assets/media-assets.storage.js";
import type {
  MediaAssetBase,
  MediaAssetLicenseStatus,
  MediaAssetOrigin,
  MediaAssetStatus,
  MediaAssetsRepository,
  VideoAsset,
} from "../media-assets/media-assets.types.js";
import type { AuditRepository } from "../audit/audit.types.js";

import { createFfmpegRenderEngine, RenderEngineError } from "./renders.engine.js";
import type {
  CreateRenderJobInput,
  CreateRendersServiceOptions,
  RenderEngine,
  RenderJob,
  RenderJobFilters,
  RenderJobsDependencies,
  RenderJobsRepository,
  RendersService,
} from "./renders.types.js";

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

const renderDurationSeconds = 3;
const renderCostBaseCents = 180;

export function createRendersService(
  repository: RenderJobsRepository,
  dependencies: RenderJobsDependencies,
  options: CreateRendersServiceOptions = {},
): RendersService {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? (() => randomUUID());
  const storageRoot = resolveStorageRoot(
    options.storageRoot,
    path.resolve(process.cwd(), ".aralume", "storage", "media-assets"),
  );
  const engine =
    options.engine ??
    createFfmpegRenderEngine({
      ffmpegPath: options.ffmpegPath,
      timeoutMs: 30_000,
    });

  return {
    listRenderJobs(filters) {
      validateChannelExists(dependencies.channelsRepository, filters.channelId);
      return repository.listRenderJobs(filters);
    },

    getRenderJob(channelId, id) {
      validateChannelExists(dependencies.channelsRepository, channelId);
      const found = repository.getRenderJob(id);
      if (!found) {
        recordAudit(dependencies.auditRepository, {
          id: `au_${idFactory()}`,
          channelId,
          actorType: "system",
          actorName: "Aralume Core",
          action: "render_job.not_found",
          entityType: "RenderJob",
          entityId: id,
          status: "failed",
          message: "Render job not found.",
          metadata: { channelId, entityId: id },
          createdAt: clock().toISOString(),
        });
        throw notFound("Render job not found", { channelId, id });
      }

      if (found.channelId !== channelId) {
        auditCrossChannelAttempt(
          dependencies.auditRepository,
          channelId,
          id,
          "render_job.cross_channel_denied",
          idFactory,
          clock().toISOString(),
        );
        throw notFound("Render job not found", { channelId, id });
      }

      return found;
    },

    async createRenderJob(input) {
      const parsed = normalizeCreateInput(input);
      validateChannelExists(dependencies.channelsRepository, parsed.channelId);

      const existing = repository.findRenderJobByIdempotencyKey(
        parsed.channelId,
        parsed.idempotencyKey,
      );
      const requestFingerprint = fingerprintFor(parsed);

      if (existing) {
        const existingFingerprint = existing.technicalMetadata?.requestFingerprint;
        if (existingFingerprint && existingFingerprint !== requestFingerprint) {
          throw conflict("Idempotency key already used for a different render request", {
            channelId: parsed.channelId,
            idempotencyKey: parsed.idempotencyKey,
          });
        }

        recordAudit(dependencies.auditRepository, {
          id: `au_${idFactory()}`,
          channelId: parsed.channelId,
          actorType: parsed.requestedBy?.trim() ? "user" : "system",
          actorName: parsed.requestedBy?.trim() || "Aralume Core",
          action: "render_job.idempotent_replay",
          entityType: "RenderJob",
          entityId: existing.id,
          status: "success",
          message: "Idempotent render request replayed.",
          metadata: {
            idempotencyKey: parsed.idempotencyKey,
            renderType: parsed.renderType,
            renderProfile: parsed.renderProfile,
          },
          createdAt: clock().toISOString(),
        });

        return existing;
      }

      const jobId = `rj_${idFactory()}`;
      const now = clock().toISOString();
      const queuedJob = createJob({
        id: jobId,
        channelId: parsed.channelId,
        renderType: parsed.renderType,
        status: "queued",
        inputAssetIds: parsed.inputAssetIds,
        renderProfile: parsed.renderProfile,
        idempotencyKey: parsed.idempotencyKey,
        outputStoragePath: buildFinalOutputStoragePath(parsed.channelId, `vd_${jobId}`),
        createdAt: now,
        startedAt: undefined,
        completedAt: undefined,
        durationSeconds: undefined,
        attemptCount: 0,
        errorCode: undefined,
        errorMessage: undefined,
        logSummary: "Render job accepted.",
        logEntries: [
          {
            timestamp: now,
            level: "info",
            message: "Render job accepted.",
            metadata: {
              renderType: parsed.renderType,
              renderProfile: parsed.renderProfile,
              inputAssetIds: parsed.inputAssetIds,
            },
          },
        ],
        technicalMetadata: {
          requestFingerprint,
          inputCount: parsed.inputAssetIds.length,
          renderProfile: parsed.renderProfile,
        },
        contentId: parsed.contentId,
        workflowRunId: parsed.workflowRunId,
        updatedAt: now,
      });

      repository.upsertRenderJob(queuedJob);
      recordAudit(dependencies.auditRepository, {
        id: `au_${idFactory()}`,
        channelId: parsed.channelId,
        actorType: parsed.requestedBy?.trim() ? "user" : "system",
        actorName: parsed.requestedBy?.trim() || "Aralume Core",
        action: "render.request_received",
        entityType: "RenderJob",
        entityId: queuedJob.id,
        status: "success",
        message: "Render request received.",
        metadata: {
          renderType: parsed.renderType,
          renderProfile: parsed.renderProfile,
          inputAssetIds: parsed.inputAssetIds,
          idempotencyKey: parsed.idempotencyKey,
          contentId: parsed.contentId,
          workflowRunId: parsed.workflowRunId,
        },
        createdAt: now,
      });
      recordAudit(dependencies.auditRepository, {
        id: `au_${idFactory()}`,
        channelId: parsed.channelId,
        actorType: parsed.requestedBy?.trim() ? "user" : "system",
        actorName: parsed.requestedBy?.trim() || "Aralume Core",
        action: "render.job_created",
        entityType: "RenderJob",
        entityId: queuedJob.id,
        status: "success",
        message: "Render job created.",
        metadata: {
          renderType: parsed.renderType,
          renderProfile: parsed.renderProfile,
          outputStoragePath: queuedJob.outputStoragePath,
        },
        createdAt: now,
      });

      let currentJob = queuedJob;

      try {
        const linkedContent = validateLinkedContent(parsed, dependencies.editorialRepository);
        const linkedWorkflow = validateLinkedWorkflow(parsed, dependencies.editorialRepository);
        const inputAssets = resolveInputAssets({
          channelId: parsed.channelId,
          inputAssetIds: parsed.inputAssetIds,
          repository: dependencies.mediaAssetsRepository,
          storageRoot,
        });

        currentJob = updateRenderJob(repository, currentJob, {
          status: "running",
          startedAt: clock().toISOString(),
          attemptCount: 1,
          logSummary: "Render job executing.",
          logEntries: [
            ...(currentJob.logEntries ?? []),
            {
              timestamp: clock().toISOString(),
              level: "info",
              message: "Render execution started.",
            },
          ],
          technicalMetadata: {
            ...(currentJob.technicalMetadata ?? {}),
            linkedContentId: linkedContent?.id,
            linkedWorkflowRunId: linkedWorkflow?.workflowRunId,
            inputAssetIds: inputAssets.map((asset) => asset.id),
            inputAssets: inputAssets.map((asset) => ({
              id: asset.id,
              type: asset.type,
              storagePath: asset.storagePath,
            })),
          },
        });

        recordAudit(dependencies.auditRepository, {
          id: `au_${idFactory()}`,
          channelId: parsed.channelId,
          actorType: parsed.requestedBy?.trim() ? "user" : "system",
          actorName: parsed.requestedBy?.trim() || "Aralume Core",
          action: "render.execution_started",
          entityType: "RenderJob",
          entityId: currentJob.id,
          status: "success",
          message: "Render execution started.",
          metadata: {
            renderProfile: parsed.renderProfile,
            inputAssetIds: parsed.inputAssetIds,
          },
          createdAt: clock().toISOString(),
        });

        const plannedCostCents = estimateRenderCostCents(parsed.inputAssetIds.length);
        const decision = dependencies.costsService.evaluateOperationalAction({
          channelId: parsed.channelId,
          action: "real_video_generation",
          actor: parsed.requestedBy?.trim() || "Aralume Core",
          plannedCostCents,
        });

        if (!decision.allowed) {
          currentJob = markBlocked(repository, currentJob, {
            errorCode:
              decision.decisionCode === "BUDGET_EXCEEDED" ? "BUDGET_EXCEEDED" : "OPERATION_BLOCKED",
            errorMessage: decision.reason,
            logSummary: "Render bloqueado por policy operacional.",
            logEntryMessage: "Render bloqueado por policy operacional.",
            metadata: {
              decision,
              plannedCostCents,
            },
            clock,
          });

          recordAudit(dependencies.auditRepository, {
            id: `au_${idFactory()}`,
            channelId: parsed.channelId,
            actorType: parsed.requestedBy?.trim() ? "user" : "system",
            actorName: parsed.requestedBy?.trim() || "Aralume Core",
            action: "render.execution_blocked",
            entityType: "RenderJob",
            entityId: currentJob.id,
            status: "warning",
            message: decision.reason,
            metadata: {
              decisionCode: decision.decisionCode,
              policySource: decision.policySource,
              plannedCostCents,
            },
            createdAt: clock().toISOString(),
          });

          return currentJob;
        }

        const outputAssetId = `vd_${idFactory()}`;
        const finalOutputStoragePath = buildFinalOutputStoragePath(parsed.channelId, outputAssetId);
        const tempOutputPath = buildTempOutputStoragePath(parsed.channelId, currentJob.id);

        ensureStoragePathsAreSafe(
          storageRoot,
          finalOutputStoragePath,
          tempOutputPath,
          parsed.channelId,
        );
        prepareOutputDirectory(storageRoot, tempOutputPath);

        const engineResult = await engine({
          job: currentJob,
          inputAssets,
          storageRoot,
          outputStoragePath: finalOutputStoragePath,
          tempOutputPath,
          ffmpegPath: options.ffmpegPath,
          ffprobePath: options.ffprobePath,
        });

        finalizeOutputFile(storageRoot, tempOutputPath, finalOutputStoragePath);

        const finalOutputAbsolutePath = resolveAbsoluteStoragePath(
          storageRoot,
          finalOutputStoragePath,
        ).absolutePath;
        if (!existsSync(finalOutputAbsolutePath)) {
          throw new RenderEngineError("process_failed", "Render output file was not created.");
        }

        const outputSizeBytes = readFileSizeBytes(finalOutputAbsolutePath);
        if (outputSizeBytes <= 0) {
          throw new RenderEngineError("process_failed", "Render output file is empty.");
        }

        const outputChecksum = checksumFile(finalOutputAbsolutePath);
        const durationSeconds = Math.max(
          1,
          Math.round(engineResult.durationMilliseconds / 1000) || renderDurationSeconds,
        );
        const outputAsset = buildVideoAsset({
          channelId: parsed.channelId,
          outputAssetId,
          finalOutputStoragePath,
          inputAssets,
          renderJobId: currentJob.id,
          contentId: linkedContent?.id ?? parsed.contentId,
          workflowRunId: linkedWorkflow?.workflowRunId ?? parsed.workflowRunId,
          now: clock().toISOString(),
          outputSizeBytes,
          outputChecksum,
          durationSeconds,
          plannedCostCents,
          engineResult,
        });

        dependencies.mediaAssetsRepository.upsertVideoAsset(outputAsset);

        const costEntry = dependencies.costsService.createCostEntry({
          channelId: parsed.channelId,
          contentId: outputAsset.contentId,
          workflowRunId: currentJob.workflowRunId,
          stage: "render",
          providerName: outputAsset.providerName ?? "Aralume Renderer",
          costType: "render",
          description: `Controlled render job ${currentJob.id}`,
          amountCents: plannedCostCents,
        });

        currentJob = updateRenderJob(repository, currentJob, {
          status: "completed",
          outputAssetId,
          outputStoragePath: finalOutputStoragePath,
          completedAt: clock().toISOString(),
          durationSeconds,
          logSummary: "Render concluido com sucesso.",
          logEntries: [
            ...(currentJob.logEntries ?? []),
            ...buildExecutionLogEntries(engineResult, clock().toISOString()),
            {
              timestamp: clock().toISOString(),
              level: "info",
              message: "Render concluido.",
              metadata: {
                outputAssetId,
                outputStoragePath: finalOutputStoragePath,
                costEntryId: costEntry.id,
              },
            },
          ],
          errorCode: undefined,
          errorMessage: undefined,
          technicalMetadata: {
            ...(currentJob.technicalMetadata ?? {}),
            ...engineResult.technicalMetadata,
            outputAssetId,
            outputChecksum,
            outputSizeBytes,
            outputStoragePath: finalOutputStoragePath,
            plannedCostCents,
            costEntryId: costEntry.id,
            renderDurationSeconds: durationSeconds,
          },
        });

        recordAudit(dependencies.auditRepository, {
          id: `au_${idFactory()}`,
          channelId: parsed.channelId,
          actorType: parsed.requestedBy?.trim() ? "user" : "system",
          actorName: parsed.requestedBy?.trim() || "Aralume Core",
          action: "render.output_asset_registered",
          entityType: "VideoAsset",
          entityId: outputAsset.id,
          status: "success",
          message: "Rendered video asset registered.",
          metadata: {
            renderJobId: currentJob.id,
            outputStoragePath: finalOutputStoragePath,
            outputChecksum,
            outputSizeBytes,
          },
          createdAt: clock().toISOString(),
        });

        recordAudit(dependencies.auditRepository, {
          id: `au_${idFactory()}`,
          channelId: parsed.channelId,
          actorType: parsed.requestedBy?.trim() ? "user" : "system",
          actorName: parsed.requestedBy?.trim() || "Aralume Core",
          action: "render.execution_completed",
          entityType: "RenderJob",
          entityId: currentJob.id,
          status: "success",
          message: "Render execution completed.",
          metadata: {
            outputAssetId,
            outputStoragePath: finalOutputStoragePath,
            outputChecksum,
            outputSizeBytes,
            durationSeconds,
            plannedCostCents,
          },
          createdAt: clock().toISOString(),
        });

        return currentJob;
      } catch (error) {
        cleanupTempArtifact(storageRoot, buildTempOutputPath(parsed.channelId, currentJob.id));

        if (error instanceof RenderEngineError) {
          if (error.kind === "unavailable") {
            currentJob = markBlocked(repository, currentJob, {
              errorCode: "FFMPEG_UNAVAILABLE",
              errorMessage: error.message,
              logSummary: "FFmpeg indisponivel no ambiente.",
              logEntryMessage: "FFmpeg indisponivel no ambiente.",
              metadata: {
                renderType: parsed.renderType,
                renderProfile: parsed.renderProfile,
              },
              clock,
            });

            recordAudit(dependencies.auditRepository, {
              id: `au_${idFactory()}`,
              channelId: parsed.channelId,
              actorType: parsed.requestedBy?.trim() ? "user" : "system",
              actorName: parsed.requestedBy?.trim() || "Aralume Core",
              action: "render.execution_blocked",
              entityType: "RenderJob",
              entityId: currentJob.id,
              status: "warning",
              message: error.message,
              metadata: {
                errorCode: "FFMPEG_UNAVAILABLE",
                renderType: parsed.renderType,
                renderProfile: parsed.renderProfile,
              },
              createdAt: clock().toISOString(),
            });

            return currentJob;
          }

          currentJob = markFailed(repository, currentJob, {
            errorCode: error.kind === "timeout" ? "TIMEOUT" : "PROCESS_FAILED",
            errorMessage: error.message,
            logSummary:
              error.kind === "timeout"
                ? "Render excedeu o timeout."
                : "Falha no processo de render.",
            logEntryMessage: error.message,
            metadata: {
              exitCode: error.exitCode,
            },
            clock,
          });

          recordAudit(dependencies.auditRepository, {
            id: `au_${idFactory()}`,
            channelId: parsed.channelId,
            actorType: parsed.requestedBy?.trim() ? "user" : "system",
            actorName: parsed.requestedBy?.trim() || "Aralume Core",
            action: "render.execution_failed",
            entityType: "RenderJob",
            entityId: currentJob.id,
            status: "failed",
            message: error.message,
            metadata: {
              errorCode: currentJob.errorCode,
              exitCode: error.exitCode,
            },
            createdAt: clock().toISOString(),
          });

          return currentJob;
        }

        if (error instanceof AppError) {
          currentJob = markBlocked(repository, currentJob, {
            errorCode:
              error.code === "BUDGET_EXCEEDED"
                ? "BUDGET_EXCEEDED"
                : error.code === "OPERATION_BLOCKED"
                  ? "OPERATION_BLOCKED"
                  : error.code,
            errorMessage: error.message,
            logSummary: error.message,
            logEntryMessage: error.message,
            metadata: error.details,
            clock,
          });

          recordAudit(dependencies.auditRepository, {
            id: `au_${idFactory()}`,
            channelId: parsed.channelId,
            actorType: parsed.requestedBy?.trim() ? "user" : "system",
            actorName: parsed.requestedBy?.trim() || "Aralume Core",
            action: "render.execution_blocked",
            entityType: "RenderJob",
            entityId: currentJob.id,
            status: "warning",
            message: error.message,
            metadata: {
              errorCode: currentJob.errorCode,
              errorDetails: error.details,
            },
            createdAt: clock().toISOString(),
          });

          return currentJob;
        }

        currentJob = markFailed(repository, currentJob, {
          errorCode: "INTERNAL_ERROR",
          errorMessage: "Unexpected render failure.",
          logSummary: "Falha interna inesperada.",
          logEntryMessage: "Unexpected render failure.",
          metadata: {},
          clock,
        });

        recordAudit(dependencies.auditRepository, {
          id: `au_${idFactory()}`,
          channelId: parsed.channelId,
          actorType: parsed.requestedBy?.trim() ? "user" : "system",
          actorName: parsed.requestedBy?.trim() || "Aralume Core",
          action: "render.execution_failed",
          entityType: "RenderJob",
          entityId: currentJob.id,
          status: "failed",
          message: "Unexpected render failure.",
          metadata: {},
          createdAt: clock().toISOString(),
        });

        return currentJob;
      }
    },
  };
}

function normalizeCreateInput(input: CreateRenderJobInput): CreateRenderJobInput {
  return {
    ...input,
    channelId: input.channelId.trim(),
    idempotencyKey: input.idempotencyKey.trim(),
    inputAssetIds: input.inputAssetIds.map((value) => value.trim()),
    requestedBy: input.requestedBy?.trim() || undefined,
    contentId: input.contentId?.trim() || undefined,
    workflowRunId: input.workflowRunId?.trim() || undefined,
  };
}

function fingerprintFor(input: CreateRenderJobInput): string {
  return JSON.stringify({
    channelId: input.channelId,
    inputAssetIds: input.inputAssetIds,
    renderType: input.renderType,
    renderProfile: input.renderProfile,
    idempotencyKey: input.idempotencyKey,
    contentId: input.contentId ?? null,
    workflowRunId: input.workflowRunId ?? null,
  });
}

function createJob(job: RenderJob): RenderJob {
  return job;
}

function updateRenderJob(
  repository: RenderJobsRepository,
  job: RenderJob,
  patch: Partial<RenderJob>,
): RenderJob {
  const next: RenderJob = {
    ...job,
    ...patch,
    inputAssetIds: patch.inputAssetIds ?? job.inputAssetIds,
    logEntries: patch.logEntries ?? job.logEntries,
    technicalMetadata: patch.technicalMetadata ?? job.technicalMetadata,
    updatedAt: patch.updatedAt ?? job.updatedAt,
  };
  repository.upsertRenderJob(next);
  return next;
}

function markBlocked(
  repository: RenderJobsRepository,
  job: RenderJob,
  input: {
    errorCode: string;
    errorMessage: string;
    logSummary: string;
    logEntryMessage: string;
    metadata: Record<string, unknown>;
    clock: () => Date;
  },
): RenderJob {
  const now = input.clock().toISOString();
  return updateRenderJob(repository, job, {
    status: "blocked",
    completedAt: now,
    durationSeconds: job.startedAt ? Math.max(0, diffSeconds(job.startedAt, now)) : undefined,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
    logSummary: input.logSummary,
    logEntries: [
      ...(job.logEntries ?? []),
      {
        timestamp: now,
        level: "warn",
        message: input.logEntryMessage,
        code: input.errorCode,
        metadata: input.metadata,
      },
    ],
    technicalMetadata: {
      ...(job.technicalMetadata ?? {}),
      ...input.metadata,
    },
    updatedAt: now,
  });
}

function markFailed(
  repository: RenderJobsRepository,
  job: RenderJob,
  input: {
    errorCode: string;
    errorMessage: string;
    logSummary: string;
    logEntryMessage: string;
    metadata: Record<string, unknown>;
    clock: () => Date;
  },
): RenderJob {
  const now = input.clock().toISOString();
  return updateRenderJob(repository, job, {
    status: "failed",
    completedAt: now,
    durationSeconds: job.startedAt ? Math.max(0, diffSeconds(job.startedAt, now)) : undefined,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
    logSummary: input.logSummary,
    logEntries: [
      ...(job.logEntries ?? []),
      {
        timestamp: now,
        level: "error",
        message: input.logEntryMessage,
        code: input.errorCode,
        metadata: input.metadata,
      },
    ],
    technicalMetadata: {
      ...(job.technicalMetadata ?? {}),
      ...input.metadata,
    },
    updatedAt: now,
  });
}

function diffSeconds(startedAt: string, endedAt: string): number {
  return Math.max(0, Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 1000));
}

function estimateRenderCostCents(inputCount: number): number {
  return renderCostBaseCents + inputCount * 25;
}

function validateLinkedContent(
  input: CreateRenderJobInput,
  editorialRepository: EditorialRepository,
): { id: string } | undefined {
  if (!input.contentId) {
    return undefined;
  }

  const content = editorialRepository.getContentIdea(input.contentId);
  if (!content) {
    throw notFound("Content idea not found", {
      channelId: input.channelId,
      contentId: input.contentId,
    });
  }

  if (content.channelId !== input.channelId) {
    throw notFound("Content idea not found", {
      channelId: input.channelId,
      contentId: input.contentId,
    });
  }

  return { id: content.id };
}

function validateLinkedWorkflow(
  input: CreateRenderJobInput,
  editorialRepository: EditorialRepository,
): { workflowRunId: string; contentId?: string } | undefined {
  if (!input.workflowRunId) {
    return undefined;
  }

  const item = editorialRepository
    .listProductionItems({ channelId: input.channelId })
    .find((productionItem) => productionItem.workflowRunId === input.workflowRunId);

  if (!item) {
    throw notFound("Workflow run not found", {
      channelId: input.channelId,
      workflowRunId: input.workflowRunId,
    });
  }

  if (input.contentId && item.contentId !== input.contentId) {
    throw conflict("Workflow run and content id do not match", {
      channelId: input.channelId,
      workflowRunId: input.workflowRunId,
      contentId: input.contentId,
    });
  }

  return {
    workflowRunId: input.workflowRunId,
    contentId: item.contentId,
  };
}

function resolveInputAssets(input: {
  channelId: string;
  inputAssetIds: string[];
  repository: MediaAssetsRepository;
  storageRoot: string;
}): MediaAssetBase[] {
  const assets: MediaAssetBase[] = [];
  for (const assetId of input.inputAssetIds) {
    const asset = input.repository.getMediaAsset(assetId);
    if (!asset) {
      throw notFound("Media asset not found", {
        channelId: input.channelId,
        assetId,
      });
    }

    if (asset.channelId !== input.channelId) {
      throw notFound("Media asset not found", {
        channelId: input.channelId,
        assetId,
      });
    }

    if (!isRenderableMediaAsset(asset)) {
      throw blocked("Media asset is not available for rendering", {
        channelId: input.channelId,
        assetId,
        status: asset.status,
      });
    }

    const normalizedStoragePath = normalizeRelativeStoragePath(asset.storagePath ?? "");
    if (normalizedStoragePath.split("/")[0] !== input.channelId) {
      throw blocked("Media asset path does not belong to the channel", {
        channelId: input.channelId,
        assetId,
        storagePath: asset.storagePath,
      });
    }

    const resolved = resolveAbsoluteStoragePath(input.storageRoot, normalizedStoragePath);
    if (!existsSync(resolved.absolutePath) || !statSync(resolved.absolutePath).isFile()) {
      throw blocked("Media asset source file is missing", {
        channelId: input.channelId,
        assetId,
        storagePath: normalizedStoragePath,
      });
    }

    if (
      asset.integrity &&
      (asset.integrity.checksumMatches === false || asset.integrity.sizeMatches === false)
    ) {
      throw blocked("Media asset integrity is invalid", {
        channelId: input.channelId,
        assetId,
        storagePath: normalizedStoragePath,
      });
    }

    assets.push(asset);
  }

  return assets;
}

function isRenderableMediaAsset(asset: MediaAssetBase): boolean {
  return (
    usableOrigins.includes(asset.origin) &&
    usableLicenseStatuses.includes(asset.licenseStatus) &&
    asset.status === "available"
  );
}

function buildFinalOutputStoragePath(channelId: string, videoAssetId: string): string {
  return normalizeRelativeStoragePath(
    path.posix.join(channelId, "video", "rendered", `${videoAssetId}.mp4`),
  );
}

function buildTempOutputStoragePath(channelId: string, renderJobId: string): string {
  return normalizeRelativeStoragePath(
    path.posix.join(channelId, "video", "renders", renderJobId, "output.tmp.mp4"),
  );
}

function buildTempOutputPath(channelId: string, renderJobId: string): string {
  return buildTempOutputStoragePath(channelId, renderJobId);
}

function ensureStoragePathsAreSafe(
  storageRoot: string,
  finalOutputStoragePath: string,
  tempOutputPath: string,
  channelId: string,
): void {
  const finalResolved = resolveAbsoluteStoragePath(storageRoot, finalOutputStoragePath);
  const tempResolved = resolveAbsoluteStoragePath(storageRoot, tempOutputPath);

  if (finalResolved.normalizedStoragePath.split("/")[0] !== channelId) {
    throw blocked("Final output path is outside the channel namespace", {
      channelId,
      outputStoragePath: finalOutputStoragePath,
    });
  }

  if (tempResolved.normalizedStoragePath.split("/")[0] !== channelId) {
    throw blocked("Temporary output path is outside the channel namespace", {
      channelId,
      outputStoragePath: tempOutputPath,
    });
  }
}

function prepareOutputDirectory(storageRoot: string, tempOutputPath: string): void {
  const resolved = resolveAbsoluteStoragePath(storageRoot, tempOutputPath);
  mkdirSync(path.dirname(resolved.absolutePath), { recursive: true });
}

function finalizeOutputFile(
  storageRoot: string,
  tempOutputPath: string,
  finalOutputStoragePath: string,
): void {
  const tempResolved = resolveAbsoluteStoragePath(storageRoot, tempOutputPath);
  const finalResolved = resolveAbsoluteStoragePath(storageRoot, finalOutputStoragePath);
  mkdirSync(path.dirname(finalResolved.absolutePath), { recursive: true });
  if (existsSync(finalResolved.absolutePath)) {
    rmSync(finalResolved.absolutePath, { force: true });
  }
  renameSync(tempResolved.absolutePath, finalResolved.absolutePath);
}

function cleanupTempArtifact(storageRoot: string, tempOutputPath: string): void {
  try {
    const resolved = resolveAbsoluteStoragePath(storageRoot, tempOutputPath);
    rmSync(resolved.absolutePath, { force: true });
  } catch {
    // Ignore cleanup errors; the temp path may not exist yet.
  }
}

function buildVideoAsset(input: {
  channelId: string;
  outputAssetId: string;
  finalOutputStoragePath: string;
  inputAssets: MediaAssetBase[];
  renderJobId: string;
  contentId?: string;
  workflowRunId?: string;
  now: string;
  outputSizeBytes: number;
  outputChecksum: string;
  durationSeconds: number;
  plannedCostCents: number;
  engineResult: Awaited<ReturnType<RenderEngine>>;
}): VideoAsset {
  const primaryAsset = input.inputAssets[0];
  const title = buildVideoTitle(primaryAsset, input.contentId, input.renderJobId);
  const riskLevel = deriveRiskLevel(input.inputAssets);

  return {
    id: input.outputAssetId,
    channelId: input.channelId,
    contentId: input.contentId ?? primaryAsset?.contentId ?? input.renderJobId,
    title,
    status: "editing",
    durationSeconds: input.durationSeconds,
    format: "horizontal",
    resolution: "1280x720",
    thumbnailUri: primaryAsset?.thumbnailUri,
    renderStatus: "rendered",
    qualityStatus: "not_checked",
    complianceStatus: "needs_human_review",
    costActualCents: input.plannedCostCents,
    type: "video",
    origin: "generated",
    licenseStatus: "confirmed",
    internalUri: buildInternalUri(input.channelId, input.outputAssetId),
    storagePath: input.finalOutputStoragePath,
    mimeType: "video/mp4",
    sizeBytes: input.outputSizeBytes,
    checksumAlgorithm: "sha256",
    checksum: input.outputChecksum,
    providerName: "Aralume Renderer",
    modelName: "ffmpeg-controlled-v1",
    prompt: "controlled_demo_short_v1",
    riskLevel,
    technicalMetadata: {
      renderJobId: input.renderJobId,
      outputSizeBytes: input.outputSizeBytes,
      outputChecksum: input.outputChecksum,
      durationSeconds: input.durationSeconds,
      plannedCostCents: input.plannedCostCents,
      engineExitCode: input.engineResult.exitCode,
      engineDurationMilliseconds: input.engineResult.durationMilliseconds,
      engineStdoutLines: countLines(input.engineResult.stdout),
      engineStderrLines: countLines(input.engineResult.stderr),
      ...(input.engineResult.technicalMetadata ?? {}),
    },
    createdAt: input.now,
    updatedAt: input.now,
  };
}

function buildVideoTitle(
  primaryAsset: MediaAssetBase | undefined,
  contentId: string | undefined,
  renderJobId: string,
): string {
  if (contentId) {
    return `Render controlado - ${contentId}`;
  }

  if (primaryAsset?.title) {
    return `Render controlado - ${primaryAsset.title}`;
  }

  if (primaryAsset?.name) {
    return `Render controlado - ${primaryAsset.name}`;
  }

  return `Render controlado - ${renderJobId}`;
}

function deriveRiskLevel(inputAssets: MediaAssetBase[]): MediaAssetBase["riskLevel"] {
  const order: MediaAssetBase["riskLevel"][] = [
    "ok",
    "attention",
    "warning",
    "critical",
    "blocked",
  ];
  return inputAssets.reduce<MediaAssetBase["riskLevel"]>((current, asset) => {
    const currentIndex = order.indexOf(current);
    const nextIndex = order.indexOf(asset.riskLevel);
    return nextIndex > currentIndex ? asset.riskLevel : current;
  }, "ok");
}

function buildExecutionLogEntries(
  result: Awaited<ReturnType<RenderEngine>>,
  timestamp: string,
): Array<{
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  code?: string;
  metadata?: Record<string, unknown>;
}> {
  return [
    {
      timestamp,
      level: "info",
      message: "FFmpeg stdout captured.",
      metadata: { lineCount: countLines(result.stdout) },
    },
    {
      timestamp,
      level: result.exitCode === 0 ? "info" : "error",
      message: "FFmpeg stderr captured.",
      metadata: { lineCount: countLines(result.stderr), exitCode: result.exitCode },
    },
  ];
}

function countLines(value: string): number {
  if (!value.trim()) {
    return 0;
  }

  return value.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
}

function validateChannelExists(channelsRepository: ChannelsRepository, channelId: string): void {
  if (!channelsRepository.getChannel(channelId)) {
    throw notFound("Channel not found", { channelId });
  }
}

function recordAudit(
  auditRepository: AuditRepository,
  log: Parameters<AuditRepository["appendAuditLog"]>[0],
): void {
  auditRepository.appendAuditLog(log);
}

function auditCrossChannelAttempt(
  auditRepository: AuditRepository,
  channelId: string,
  entityId: string,
  action: string,
  idFactory: () => string,
  now: string,
): void {
  recordAudit(auditRepository, {
    id: `au_${idFactory()}`,
    channelId,
    actorType: "system",
    actorName: "Aralume Core",
    action,
    entityType: "RenderJob",
    entityId,
    status: "failed",
    message: "Cross-channel render access rejected.",
    metadata: { channelId, entityId },
    createdAt: now,
  });
}

function blocked(message: string, details: Record<string, unknown>): AppError {
  return new AppError({
    code: "OPERATION_BLOCKED",
    status: 409,
    message,
    details,
  });
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
