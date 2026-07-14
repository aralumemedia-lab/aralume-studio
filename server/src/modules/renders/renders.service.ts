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
  validation,
} from "../media-assets/media-assets.storage.js";
import type {
  MediaAssetBase,
  MediaAssetLicenseStatus,
  MediaAssetOrigin,
  MediaAssetStatus,
  MediaAssetsRepository,
  DerivedClip,
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
  RenderStatus,
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
      const queuedOutputAssetId =
        parsed.renderType === "controlled_clip" ? `cl_${idFactory()}` : undefined;
      const now = clock().toISOString();
      let outputAssetId = queuedOutputAssetId;
      let finalOutputStoragePath = buildFinalOutputStoragePath(
        parsed.channelId,
        queuedOutputAssetId ?? jobId,
        parsed.renderType,
      );
      let tempOutputPath = buildTempOutputStoragePath(parsed.channelId, jobId, parsed.renderType);
      const queuedJob = createJob({
        id: jobId,
        channelId: parsed.channelId,
        renderType: parsed.renderType,
        status: "queued",
        inputAssetIds: parsed.inputAssetIds,
        parentVideoId: parsed.parentVideoId,
        startSeconds: parsed.startSeconds,
        endSeconds: parsed.endSeconds,
        targetPlatform: parsed.targetPlatform,
        renderProfile: parsed.renderProfile,
        idempotencyKey: parsed.idempotencyKey,
        outputAssetId,
        outputStoragePath: finalOutputStoragePath,
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
          outputAssetId,
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

      if (parsed.renderType === "controlled_clip") {
        return await processControlledClipJob({
          job: queuedJob,
          parsed,
          repository,
          dependencies,
          storageRoot,
          engine,
          clock,
          idFactory,
          outputAssetId: outputAssetId!,
          finalOutputStoragePath,
          tempOutputPath,
          ffmpegPath: options.ffmpegPath,
          ffprobePath: options.ffprobePath,
        });
      }

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

        outputAssetId = `vd_${idFactory()}`;
        finalOutputStoragePath = buildFinalOutputStoragePath(
          parsed.channelId,
          outputAssetId,
          parsed.renderType,
        );
        tempOutputPath = buildTempOutputStoragePath(
          parsed.channelId,
          currentJob.id,
          parsed.renderType,
        );

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
        cleanupTempArtifact(storageRoot, tempOutputPath);

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
    title: input.title?.trim() || undefined,
    hook: input.hook?.trim() || undefined,
    description: input.description?.trim() || undefined,
    contentId: input.contentId?.trim() || undefined,
    workflowRunId: input.workflowRunId?.trim() || undefined,
    parentVideoId: input.parentVideoId?.trim() || undefined,
  };
}

function fingerprintFor(input: CreateRenderJobInput): string {
  return JSON.stringify({
    channelId: input.channelId,
    inputAssetIds: input.inputAssetIds,
    renderType: input.renderType,
    renderProfile: input.renderProfile,
    idempotencyKey: input.idempotencyKey,
    parentVideoId: input.parentVideoId ?? null,
    startSeconds: input.startSeconds ?? null,
    endSeconds: input.endSeconds ?? null,
    targetPlatform: input.targetPlatform ?? null,
    title: input.title ?? null,
    hook: input.hook ?? null,
    description: input.description ?? null,
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

function buildFinalOutputStoragePath(
  channelId: string,
  assetId: string,
  renderType: RenderJob["renderType"],
): string {
  const namespace = renderType === "controlled_clip" ? "clip" : "video";
  const segment = renderType === "controlled_clip" ? "rendered" : "rendered";
  return normalizeRelativeStoragePath(
    path.posix.join(channelId, namespace, segment, `${assetId}.mp4`),
  );
}

function buildTempOutputStoragePath(
  channelId: string,
  renderJobId: string,
  renderType: RenderJob["renderType"],
): string {
  const namespace = renderType === "controlled_clip" ? "clip" : "video";
  return normalizeRelativeStoragePath(
    path.posix.join(channelId, namespace, "renders", renderJobId, "output.tmp.mp4"),
  );
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

async function processControlledClipJob(input: {
  job: RenderJob;
  parsed: CreateRenderJobInput;
  repository: RenderJobsRepository;
  dependencies: RenderJobsDependencies;
  storageRoot: string;
  engine: RenderEngine;
  clock: () => Date;
  idFactory: () => string;
  outputAssetId: string;
  finalOutputStoragePath: string;
  tempOutputPath: string;
  ffmpegPath?: string;
  ffprobePath?: string;
}): Promise<RenderJob> {
  const now = input.clock().toISOString();
  const parentVideo = resolveParentVideo(input.parsed, input.dependencies.mediaAssetsRepository);
  validateClipInterval(input.parsed, parentVideo);

  let currentJob = updateRenderJob(input.repository, input.job, {
    contentId: parentVideo.contentId,
    technicalMetadata: {
      ...(input.job.technicalMetadata ?? {}),
      parentVideoId: parentVideo.id,
      parentVideoContentId: parentVideo.contentId,
      parentVideoDurationSeconds: parentVideo.durationSeconds,
      startSeconds: input.parsed.startSeconds,
      endSeconds: input.parsed.endSeconds,
      targetPlatform: input.parsed.targetPlatform ?? "youtube_shorts",
      outputAssetId: input.outputAssetId,
    },
  });

  const clipCostCents = estimateRenderCostCents(1);
  const operationalDecision = input.dependencies.costsService.evaluateOperationalAction({
    channelId: input.parsed.channelId,
    action: "real_video_generation",
    actor: input.parsed.requestedBy?.trim() || "Aralume Core",
    plannedCostCents: clipCostCents,
  });

  const clipRecord = buildDerivedClip({
    channelId: input.parsed.channelId,
    outputAssetId: input.outputAssetId,
    finalOutputStoragePath: input.finalOutputStoragePath,
    parentVideo,
    renderJobId: currentJob.id,
    title: input.parsed.title,
    hook: input.parsed.hook,
    description: input.parsed.description,
    targetPlatform: input.parsed.targetPlatform ?? "youtube_shorts",
    now,
    startSeconds: input.parsed.startSeconds!,
    endSeconds: input.parsed.endSeconds!,
    durationSeconds: input.parsed.endSeconds! - input.parsed.startSeconds!,
    plannedCostCents: clipCostCents,
    status: "queued",
  });

  input.dependencies.mediaAssetsRepository.upsertDerivedClip(clipRecord);

  currentJob = updateRenderJob(input.repository, currentJob, {
    status: "running",
    startedAt: input.clock().toISOString(),
    attemptCount: 1,
    logSummary: "Clip job executing.",
    logEntries: [
      ...(currentJob.logEntries ?? []),
      {
        timestamp: input.clock().toISOString(),
        level: "info",
        message: "Clip execution started.",
        metadata: {
          parentVideoId: parentVideo.id,
          startSeconds: input.parsed.startSeconds,
          endSeconds: input.parsed.endSeconds,
          targetPlatform: input.parsed.targetPlatform ?? "youtube_shorts",
        },
      },
    ],
    technicalMetadata: {
      ...(currentJob.technicalMetadata ?? {}),
      parentVideoId: parentVideo.id,
      parentVideoContentId: parentVideo.contentId,
      parentVideoDurationSeconds: parentVideo.durationSeconds,
      startSeconds: input.parsed.startSeconds,
      endSeconds: input.parsed.endSeconds,
      targetPlatform: input.parsed.targetPlatform ?? "youtube_shorts",
      clipCostCents,
    },
  });

  recordAudit(input.dependencies.auditRepository, {
    id: `au_${input.idFactory()}`,
    channelId: input.parsed.channelId,
    actorType: input.parsed.requestedBy?.trim() ? "user" : "system",
    actorName: input.parsed.requestedBy?.trim() || "Aralume Core",
    action: "clip.execution_started",
    entityType: "RenderJob",
    entityId: currentJob.id,
    status: "success",
    message: "Clip execution started.",
    metadata: {
      parentVideoId: parentVideo.id,
      startSeconds: input.parsed.startSeconds,
      endSeconds: input.parsed.endSeconds,
      targetPlatform: input.parsed.targetPlatform ?? "youtube_shorts",
    },
    createdAt: input.clock().toISOString(),
  });

  input.dependencies.mediaAssetsRepository.upsertDerivedClip({
    ...clipRecord,
    status: "running",
    updatedAt: input.clock().toISOString(),
  });

  const decision = operationalDecision;
  if (!decision.allowed) {
    currentJob = markBlocked(input.repository, currentJob, {
      errorCode:
        decision.decisionCode === "BUDGET_EXCEEDED" ? "BUDGET_EXCEEDED" : "OPERATION_BLOCKED",
      errorMessage: decision.reason,
      logSummary: "Clip bloqueado por policy operacional.",
      logEntryMessage: "Clip bloqueado por policy operacional.",
      metadata: {
        decision,
        plannedCostCents: clipCostCents,
      },
      clock: input.clock,
    });

    input.dependencies.mediaAssetsRepository.upsertDerivedClip({
      ...clipRecord,
      status: "blocked",
      errorCode: currentJob.errorCode,
      errorMessage: currentJob.errorMessage,
      updatedAt: input.clock().toISOString(),
    });

    recordAudit(input.dependencies.auditRepository, {
      id: `au_${input.idFactory()}`,
      channelId: input.parsed.channelId,
      actorType: input.parsed.requestedBy?.trim() ? "user" : "system",
      actorName: input.parsed.requestedBy?.trim() || "Aralume Core",
      action: "clip.execution_blocked",
      entityType: "RenderJob",
      entityId: currentJob.id,
      status: "warning",
      message: decision.reason,
      metadata: {
        decisionCode: decision.decisionCode,
        policySource: decision.policySource,
        plannedCostCents: clipCostCents,
        parentVideoId: parentVideo.id,
      },
      createdAt: input.clock().toISOString(),
    });

    return currentJob;
  }

  const inputAssets: VideoAsset[] = [parentVideo];
  const sourceResolved = resolveAbsoluteStoragePath(
    input.storageRoot,
    normalizeRelativeStoragePath(parentVideo.storagePath ?? ""),
  );
  if (!existsSync(sourceResolved.absolutePath) || !statSync(sourceResolved.absolutePath).isFile()) {
    currentJob = markBlocked(input.repository, currentJob, {
      errorCode: "SOURCE_MISSING",
      errorMessage: "Parent video source file is missing.",
      logSummary: "Video principal sem arquivo.",
      logEntryMessage: "Parent video source file is missing.",
      metadata: {
        parentVideoId: parentVideo.id,
        storagePath: parentVideo.storagePath,
      },
      clock: input.clock,
    });

    input.dependencies.mediaAssetsRepository.upsertDerivedClip({
      ...clipRecord,
      status: "blocked",
      errorCode: currentJob.errorCode,
      errorMessage: currentJob.errorMessage,
      updatedAt: input.clock().toISOString(),
    });

    recordAudit(input.dependencies.auditRepository, {
      id: `au_${input.idFactory()}`,
      channelId: input.parsed.channelId,
      actorType: "system",
      actorName: "Aralume Core",
      action: "clip.execution_blocked",
      entityType: "RenderJob",
      entityId: currentJob.id,
      status: "warning",
      message: "Parent video source file is missing.",
      metadata: {
        parentVideoId: parentVideo.id,
        storagePath: parentVideo.storagePath,
      },
      createdAt: input.clock().toISOString(),
    });

    return currentJob;
  }

  ensureStoragePathsAreSafe(
    input.storageRoot,
    input.finalOutputStoragePath,
    input.tempOutputPath,
    input.parsed.channelId,
  );
  prepareOutputDirectory(input.storageRoot, input.tempOutputPath);

  try {
    const engineResult = await input.engine({
      job: currentJob,
      inputAssets,
      storageRoot: input.storageRoot,
      outputStoragePath: input.finalOutputStoragePath,
      tempOutputPath: input.tempOutputPath,
      ffmpegPath: input.ffmpegPath,
      ffprobePath: input.ffprobePath,
    });

    finalizeOutputFile(input.storageRoot, input.tempOutputPath, input.finalOutputStoragePath);

    const finalOutputAbsolutePath = resolveAbsoluteStoragePath(
      input.storageRoot,
      input.finalOutputStoragePath,
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
      Math.round(engineResult.durationMilliseconds / 1000) || clipRecord.durationSeconds,
    );
    const technicalMetadata = engineResult.technicalMetadata ?? {};
    const resolvedResolution =
      typeof technicalMetadata.resolution === "string"
        ? technicalMetadata.resolution
        : parentVideo.resolution;
    const resolvedFormat = parentVideo.format;
    const resolvedAspectRatio =
      typeof technicalMetadata.aspectRatio === "string"
        ? technicalMetadata.aspectRatio
        : parentVideo.format === "vertical"
          ? "9:16"
          : parentVideo.format === "square"
            ? "1:1"
            : "16:9";
    const completedClip = buildDerivedClip({
      channelId: input.parsed.channelId,
      outputAssetId: input.outputAssetId,
      finalOutputStoragePath: input.finalOutputStoragePath,
      parentVideo,
      renderJobId: currentJob.id,
      title: input.parsed.title,
      hook: input.parsed.hook,
      description: input.parsed.description,
      targetPlatform: input.parsed.targetPlatform ?? "youtube_shorts",
      now: input.clock().toISOString(),
      startSeconds: input.parsed.startSeconds!,
      endSeconds: input.parsed.endSeconds!,
      durationSeconds,
      plannedCostCents: clipCostCents,
      status: "completed",
      outputSizeBytes,
      outputChecksum,
      format: resolvedFormat,
      resolution: resolvedResolution,
      aspectRatio: resolvedAspectRatio,
    });

    input.dependencies.mediaAssetsRepository.upsertDerivedClip(completedClip);

    const costEntry = input.dependencies.costsService.createCostEntry({
      channelId: input.parsed.channelId,
      contentId: parentVideo.contentId,
      workflowRunId: currentJob.workflowRunId,
      stage: "clips",
      providerName: "Aralume Renderer",
      costType: "render",
      description: `Controlled clip job ${currentJob.id} from ${parentVideo.id}`,
      amountCents: clipCostCents,
    });

    currentJob = updateRenderJob(input.repository, currentJob, {
      status: "completed",
      outputAssetId: input.outputAssetId,
      outputStoragePath: input.finalOutputStoragePath,
      completedAt: input.clock().toISOString(),
      durationSeconds,
      logSummary: "Clip concluido com sucesso.",
      logEntries: [
        ...(currentJob.logEntries ?? []),
        ...buildExecutionLogEntries(engineResult, input.clock().toISOString()),
        {
          timestamp: input.clock().toISOString(),
          level: "info",
          message: "Clip concluido.",
          metadata: {
            outputAssetId: input.outputAssetId,
            outputStoragePath: input.finalOutputStoragePath,
            costEntryId: costEntry.id,
          },
        },
      ],
      errorCode: undefined,
      errorMessage: undefined,
      technicalMetadata: {
        ...(currentJob.technicalMetadata ?? {}),
        ...engineResult.technicalMetadata,
        parentVideoId: parentVideo.id,
        parentVideoContentId: parentVideo.contentId,
        parentVideoStoragePath: parentVideo.storagePath,
        outputAssetId: input.outputAssetId,
        outputChecksum,
        outputSizeBytes,
        outputStoragePath: input.finalOutputStoragePath,
        plannedCostCents: clipCostCents,
        costEntryId: costEntry.id,
        renderDurationSeconds: durationSeconds,
        targetPlatform: input.parsed.targetPlatform ?? "youtube_shorts",
        sourceDurationSeconds: parentVideo.durationSeconds,
        startSeconds: input.parsed.startSeconds,
        endSeconds: input.parsed.endSeconds,
      },
    });

    recordAudit(input.dependencies.auditRepository, {
      id: `au_${input.idFactory()}`,
      channelId: input.parsed.channelId,
      actorType: input.parsed.requestedBy?.trim() ? "user" : "system",
      actorName: input.parsed.requestedBy?.trim() || "Aralume Core",
      action: "clip.output_asset_registered",
      entityType: "DerivedClip",
      entityId: completedClip.id,
      status: "success",
      message: "Derived clip registered.",
      metadata: {
        renderJobId: currentJob.id,
        parentVideoId: parentVideo.id,
        outputStoragePath: input.finalOutputStoragePath,
        outputChecksum,
        outputSizeBytes,
      },
      createdAt: input.clock().toISOString(),
    });

    recordAudit(input.dependencies.auditRepository, {
      id: `au_${input.idFactory()}`,
      channelId: input.parsed.channelId,
      actorType: input.parsed.requestedBy?.trim() ? "user" : "system",
      actorName: input.parsed.requestedBy?.trim() || "Aralume Core",
      action: "clip.execution_completed",
      entityType: "RenderJob",
      entityId: currentJob.id,
      status: "success",
      message: "Clip execution completed.",
      metadata: {
        outputAssetId: completedClip.id,
        parentVideoId: parentVideo.id,
        outputStoragePath: input.finalOutputStoragePath,
        outputChecksum,
        outputSizeBytes,
        durationSeconds,
        plannedCostCents: clipCostCents,
      },
      createdAt: input.clock().toISOString(),
    });

    return currentJob;
  } catch (error) {
    cleanupTempArtifact(input.storageRoot, input.tempOutputPath);

    if (error instanceof RenderEngineError) {
      if (error.kind === "unavailable") {
        currentJob = markBlocked(input.repository, currentJob, {
          errorCode: "FFMPEG_UNAVAILABLE",
          errorMessage: error.message,
          logSummary: "FFmpeg indisponivel no ambiente.",
          logEntryMessage: "FFmpeg indisponivel no ambiente.",
          metadata: {
            renderType: input.parsed.renderType,
            renderProfile: input.parsed.renderProfile,
            parentVideoId: parentVideo.id,
          },
          clock: input.clock,
        });

        input.dependencies.mediaAssetsRepository.upsertDerivedClip({
          ...clipRecord,
          status: "blocked",
          errorCode: currentJob.errorCode,
          errorMessage: currentJob.errorMessage,
          updatedAt: input.clock().toISOString(),
        });

        recordAudit(input.dependencies.auditRepository, {
          id: `au_${input.idFactory()}`,
          channelId: input.parsed.channelId,
          actorType: input.parsed.requestedBy?.trim() ? "user" : "system",
          actorName: input.parsed.requestedBy?.trim() || "Aralume Core",
          action: "clip.execution_blocked",
          entityType: "RenderJob",
          entityId: currentJob.id,
          status: "warning",
          message: error.message,
          metadata: {
            errorCode: "FFMPEG_UNAVAILABLE",
            renderType: input.parsed.renderType,
            renderProfile: input.parsed.renderProfile,
            parentVideoId: parentVideo.id,
          },
          createdAt: input.clock().toISOString(),
        });

        return currentJob;
      }

      currentJob = markFailed(input.repository, currentJob, {
        errorCode: error.kind === "timeout" ? "TIMEOUT" : "PROCESS_FAILED",
        errorMessage: error.message,
        logSummary:
          error.kind === "timeout" ? "Clip excedeu o timeout." : "Falha no processo de clip.",
        logEntryMessage: error.message,
        metadata: {
          exitCode: error.exitCode,
          parentVideoId: parentVideo.id,
        },
        clock: input.clock,
      });

      input.dependencies.mediaAssetsRepository.upsertDerivedClip({
        ...clipRecord,
        status: "failed",
        errorCode: currentJob.errorCode,
        errorMessage: currentJob.errorMessage,
        updatedAt: input.clock().toISOString(),
      });

      recordAudit(input.dependencies.auditRepository, {
        id: `au_${input.idFactory()}`,
        channelId: input.parsed.channelId,
        actorType: input.parsed.requestedBy?.trim() ? "user" : "system",
        actorName: input.parsed.requestedBy?.trim() || "Aralume Core",
        action: "clip.execution_failed",
        entityType: "RenderJob",
        entityId: currentJob.id,
        status: "failed",
        message: error.message,
        metadata: {
          errorCode: currentJob.errorCode,
          exitCode: error.exitCode,
          parentVideoId: parentVideo.id,
        },
        createdAt: input.clock().toISOString(),
      });

      return currentJob;
    }

    if (error instanceof AppError) {
      currentJob = markBlocked(input.repository, currentJob, {
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
        clock: input.clock,
      });

      input.dependencies.mediaAssetsRepository.upsertDerivedClip({
        ...clipRecord,
        status: "blocked",
        errorCode: currentJob.errorCode,
        errorMessage: currentJob.errorMessage,
        updatedAt: input.clock().toISOString(),
      });

      recordAudit(input.dependencies.auditRepository, {
        id: `au_${input.idFactory()}`,
        channelId: input.parsed.channelId,
        actorType: input.parsed.requestedBy?.trim() ? "user" : "system",
        actorName: input.parsed.requestedBy?.trim() || "Aralume Core",
        action: "clip.execution_blocked",
        entityType: "RenderJob",
        entityId: currentJob.id,
        status: "warning",
        message: error.message,
        metadata: {
          errorCode: currentJob.errorCode,
          errorDetails: error.details,
          parentVideoId: parentVideo.id,
        },
        createdAt: input.clock().toISOString(),
      });

      return currentJob;
    }

    currentJob = markFailed(input.repository, currentJob, {
      errorCode: "INTERNAL_ERROR",
      errorMessage: "Unexpected clip failure.",
      logSummary: "Falha interna inesperada.",
      logEntryMessage: "Unexpected clip failure.",
      metadata: { parentVideoId: parentVideo.id },
      clock: input.clock,
    });

    input.dependencies.mediaAssetsRepository.upsertDerivedClip({
      ...clipRecord,
      status: "failed",
      errorCode: currentJob.errorCode,
      errorMessage: currentJob.errorMessage,
      updatedAt: input.clock().toISOString(),
    });

    recordAudit(input.dependencies.auditRepository, {
      id: `au_${input.idFactory()}`,
      channelId: input.parsed.channelId,
      actorType: input.parsed.requestedBy?.trim() ? "user" : "system",
      actorName: input.parsed.requestedBy?.trim() || "Aralume Core",
      action: "clip.execution_failed",
      entityType: "RenderJob",
      entityId: currentJob.id,
      status: "failed",
      message: "Unexpected clip failure.",
      metadata: {
        parentVideoId: parentVideo.id,
      },
      createdAt: input.clock().toISOString(),
    });

    return currentJob;
  }
}

function resolveParentVideo(
  input: CreateRenderJobInput,
  repository: MediaAssetsRepository,
): VideoAsset {
  if (!input.parentVideoId) {
    throw validation("Controlled clip renders require a parent video id", {
      channelId: input.channelId,
    });
  }

  const parentVideo = repository.getVideoAsset(input.parentVideoId);
  if (!parentVideo) {
    throw notFound("Parent video not found", {
      channelId: input.channelId,
      parentVideoId: input.parentVideoId,
    });
  }

  if (parentVideo.channelId !== input.channelId) {
    throw notFound("Parent video not found", {
      channelId: input.channelId,
      parentVideoId: input.parentVideoId,
    });
  }

  if (!isConcludedVideo(parentVideo)) {
    throw blocked("Parent video is not concluded", {
      channelId: input.channelId,
      parentVideoId: parentVideo.id,
      status: parentVideo.status,
      renderStatus: parentVideo.renderStatus,
    });
  }

  if (!parentVideo.storagePath?.trim()) {
    throw blocked("Parent video does not have an accessible storage path", {
      channelId: input.channelId,
      parentVideoId: parentVideo.id,
    });
  }

  return parentVideo;
}

function validateClipInterval(input: CreateRenderJobInput, parentVideo: VideoAsset): void {
  const startSeconds = input.startSeconds;
  const endSeconds = input.endSeconds;

  if (startSeconds === undefined || endSeconds === undefined) {
    throw validation("Controlled clip interval is incomplete", {
      channelId: input.channelId,
      parentVideoId: parentVideo.id,
    });
  }

  if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) {
    throw validation("Controlled clip interval must be finite", {
      channelId: input.channelId,
      parentVideoId: parentVideo.id,
      startSeconds,
      endSeconds,
    });
  }

  if (startSeconds < 0) {
    throw validation("Controlled clip start cannot be negative", {
      channelId: input.channelId,
      parentVideoId: parentVideo.id,
      startSeconds,
    });
  }

  if (endSeconds <= startSeconds) {
    throw validation("Controlled clip end must be greater than start", {
      channelId: input.channelId,
      parentVideoId: parentVideo.id,
      startSeconds,
      endSeconds,
    });
  }

  if (parentVideo.durationSeconds <= 0) {
    throw blocked("Parent video duration is invalid", {
      channelId: input.channelId,
      parentVideoId: parentVideo.id,
      durationSeconds: parentVideo.durationSeconds,
    });
  }

  if (endSeconds > parentVideo.durationSeconds) {
    throw validation("Controlled clip end exceeds parent duration", {
      channelId: input.channelId,
      parentVideoId: parentVideo.id,
      startSeconds,
      endSeconds,
      durationSeconds: parentVideo.durationSeconds,
    });
  }
}

function isConcludedVideo(video: VideoAsset): boolean {
  return (
    video.renderStatus === "rendered" &&
    (video.status === "approved" || video.status === "published" || video.status === "scheduled")
  );
}

function buildDerivedClip(input: {
  channelId: string;
  outputAssetId: string;
  finalOutputStoragePath: string;
  parentVideo: VideoAsset;
  renderJobId: string;
  title?: string;
  hook?: string;
  description?: string;
  targetPlatform: NonNullable<CreateRenderJobInput["targetPlatform"]>;
  now: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  plannedCostCents: number;
  status: RenderStatus;
  outputSizeBytes?: number;
  outputChecksum?: string;
  format?: VideoAsset["format"];
  resolution?: string;
  aspectRatio?: string;
  errorCode?: string;
  errorMessage?: string;
}): DerivedClip {
  const format = input.format ?? input.parentVideo.format;
  const resolution = input.resolution ?? input.parentVideo.resolution;
  const aspectRatio =
    input.aspectRatio ?? (format === "vertical" ? "9:16" : format === "square" ? "1:1" : "16:9");
  const durationSeconds = Math.max(1, Math.round(input.durationSeconds));
  const title = buildClipTitle(input.parentVideo, input.title, durationSeconds);
  const hook = input.hook?.trim() || buildClipHook(input.parentVideo, durationSeconds);
  const description =
    input.description?.trim() || buildClipDescription(input.parentVideo, durationSeconds);

  return {
    id: input.outputAssetId,
    channelId: input.channelId,
    parentVideoId: input.parentVideo.id,
    renderJobId: input.renderJobId,
    title,
    hook,
    description,
    startSeconds: input.startSeconds,
    endSeconds: input.endSeconds,
    durationSeconds,
    targetPlatform: input.targetPlatform,
    status: input.status,
    format,
    resolution,
    aspectRatio,
    riskLevel: input.parentVideo.riskLevel ?? "ok",
    clipPotentialScore: computeClipPotentialScore(durationSeconds, input.targetPlatform),
    type: "clip",
    origin: input.parentVideo.origin ?? "generated",
    licenseStatus: input.parentVideo.licenseStatus ?? "confirmed",
    internalUri: buildInternalUri(input.channelId, input.outputAssetId),
    storagePath: input.finalOutputStoragePath,
    mimeType: "video/mp4",
    sizeBytes: input.outputSizeBytes,
    checksumAlgorithm: input.outputChecksum ? "sha256" : undefined,
    checksum: input.outputChecksum,
    costActualCents: input.plannedCostCents,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

function buildClipTitle(
  parentVideo: VideoAsset,
  title: string | undefined,
  durationSeconds: number,
): string {
  if (title?.trim()) {
    return title.trim();
  }

  return `${parentVideo.title} - corte de ${formatClipDuration(durationSeconds)}`;
}

function buildClipHook(parentVideo: VideoAsset, durationSeconds: number): string {
  return `Trecho de ${parentVideo.title} com ${formatClipDuration(durationSeconds)}.`;
}

function buildClipDescription(parentVideo: VideoAsset, durationSeconds: number): string {
  return `Corte derivado do video principal ${parentVideo.id} com duracao de ${formatClipDuration(durationSeconds)}.`;
}

function formatClipDuration(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m${String(seconds).padStart(2, "0")}s`;
}

function computeClipPotentialScore(
  durationSeconds: number,
  targetPlatform: CreateRenderJobInput["targetPlatform"],
): number {
  const base =
    targetPlatform === "linkedin"
      ? 72
      : targetPlatform === "other"
        ? 68
        : targetPlatform === "youtube_shorts"
          ? 90
          : targetPlatform === "instagram_reels"
            ? 88
            : 89;

  if (durationSeconds <= 30) {
    return Math.min(100, base + 5);
  }

  if (durationSeconds <= 60) {
    return Math.min(100, base);
  }

  return Math.max(50, base - Math.min(20, Math.round((durationSeconds - 60) / 5)));
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
