import { randomUUID } from "node:crypto";

import { AppError } from "../../http/errors.js";
import type { AuditRepository } from "../audit/audit.types.js";
import type { ChannelsRepository } from "../channels/channel.types.js";
import type { EditorialRepository } from "../editorial/editorial.types.js";
import type {
  ComplianceCheck,
  HumanApproval,
  GovernanceRepository,
} from "../governance/governance.types.js";
import type { MediaAssetsRepository } from "../media-assets/media-assets.types.js";
import {
  publicationJobCreateSchema,
  publicationJobListQuerySchema,
  publicationJobRescheduleSchema,
  publicationTargetCreateSchema,
  publicationTargetListQuerySchema,
  idSchema,
} from "./publications.schema.js";
import type {
  PublicationGateResult,
  PublicationJob,
  PublicationJobCreateInput,
  PublicationJobFilters,
  PublicationJobRescheduleInput,
  PublicationJobStatus,
  PublicationTarget,
  PublicationTargetCreateInput,
  PublicationTargetFilters,
  PublicationTargetReadinessStatus,
  PublicationTargetView,
  PublicationsDependencies,
} from "./publications.types.js";
import type { InMemoryPublicationsRepository } from "./publications.repository.js";

export type PublicationsService = {
  listPublicationTargets(filters?: PublicationTargetFilters): PublicationTargetView[];
  getPublicationTarget(id: string): PublicationTargetView;
  createPublicationTarget(input: PublicationTargetCreateInput): PublicationTargetView;
  listPublicationJobs(filters?: PublicationJobFilters): PublicationJob[];
  getPublicationJob(id: string): PublicationJob;
  createPublicationJob(input: PublicationJobCreateInput): PublicationJob;
  reschedulePublicationJob(id: string, input: PublicationJobRescheduleInput): PublicationJob;
};

type PublicationSource =
  | {
      kind: "video";
      id: string;
      channelId: string;
      title: string;
      contentId: string;
      complianceStatus: string;
      renderStatus: string;
      status: string;
    }
  | {
      kind: "clip";
      id: string;
      channelId: string;
      title: string;
      contentId: string;
      complianceStatus: string;
      renderStatus: string;
      status: string;
      parentVideoId: string;
      parentVideoStatus: string;
      parentRenderStatus: string;
    };

export function createPublicationsService(
  repository: InMemoryPublicationsRepository,
  dependencies: PublicationsDependencies & {
    channelsRepository: ChannelsRepository;
    editorialRepository: EditorialRepository;
    mediaAssetsRepository: MediaAssetsRepository;
    governanceRepository: GovernanceRepository;
    auditRepository: AuditRepository;
  },
  options: {
    clock?: () => Date;
    idFactory?: () => string;
  } = {},
): PublicationsService {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? (() => randomUUID());

  return {
    listPublicationTargets(filters = {}) {
      const normalized = publicationTargetListQuerySchema.parse(filters);
      validateChannelExists(dependencies.channelsRepository, normalized.channelId);
      const { readinessStatus: _readinessStatus, ...repositoryFilters } = normalized;

      const targets = repository
        .listPublicationTargets(repositoryFilters)
        .map((target) => enrichTarget(target, repository, dependencies, clock().toISOString()));

      if (!normalized.readinessStatus) {
        return targets;
      }

      return targets.filter((target) => target.readinessStatus === normalized.readinessStatus);
    },

    getPublicationTarget(id) {
      const parsed = idSchema.parse(id);
      const found = repository.getPublicationTarget(parsed);
      if (!found) {
        throw notFound("Publication target not found", { publicationTargetId: parsed });
      }

      return enrichTarget(found, repository, dependencies, clock().toISOString());
    },

    createPublicationTarget(input) {
      const parsed = publicationTargetCreateSchema.parse(input);
      validateChannelExists(dependencies.channelsRepository, parsed.channelId);

      const now = clock().toISOString();
      const existing = parsed.id ? repository.getPublicationTarget(parsed.id) : undefined;
      const validatedSourceContentId = validateTargetContentReference({
        editorialRepository: dependencies.editorialRepository,
        channelId: parsed.channelId,
        sourceContentId: parsed.sourceContentId,
      });
      const validatedSourceVideoAsset = validateTargetVideoReference({
        mediaAssetsRepository: dependencies.mediaAssetsRepository,
        channelId: parsed.channelId,
        sourceVideoAssetId: parsed.sourceVideoAssetId,
      });

      if (
        validatedSourceContentId &&
        validatedSourceVideoAsset &&
        validatedSourceVideoAsset.contentId !== validatedSourceContentId
      ) {
        throw conflict("Publication target references mismatched source content and video", {
          channelId: parsed.channelId,
          sourceContentId: validatedSourceContentId,
          sourceVideoAssetId: validatedSourceVideoAsset.id,
        });
      }

      if (existing && existing.channelId !== parsed.channelId) {
        throw notFound("Publication target not found", {
          publicationTargetId: parsed.id,
          channelId: parsed.channelId,
        });
      }

      const target: PublicationTarget = {
        id: existing?.id ?? parsed.id ?? `pt_${idFactory()}`,
        channelId: parsed.channelId,
        platform: parsed.platform,
        accountName: parsed.accountName,
        status: parsed.status,
        lastConnectedAt: parsed.lastConnectedAt,
        tokenExpiresAt: parsed.tokenExpiresAt,
        sourceContentId:
          validatedSourceContentId ??
          validatedSourceVideoAsset?.contentId ??
          existing?.sourceContentId,
        sourceVideoAssetId:
          validatedSourceVideoAsset?.id ??
          parsed.sourceVideoAssetId ??
          existing?.sourceVideoAssetId,
        latestApprovalId: existing?.latestApprovalId,
        latestComplianceCheckId: existing?.latestComplianceCheckId,
        latestPublicationJobId: existing?.latestPublicationJobId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      repository.upsertPublicationTarget(target);
      recordAudit(dependencies.auditRepository, {
        id: `au_${idFactory()}`,
        channelId: target.channelId,
        actorType: parsed.requestedBy?.trim() ? "user" : "system",
        actorName: parsed.requestedBy?.trim() || "Aralume Core",
        action: existing ? "publication_target.updated" : "publication_target.created",
        entityType: "PublicationTarget",
        entityId: target.id,
        status: "success",
        message: existing ? "Publication target updated." : "Publication target created.",
        metadata: {
          platform: target.platform,
          status: target.status,
          accountName: target.accountName,
          tokenExpiresAt: target.tokenExpiresAt,
        },
        createdAt: now,
      });

      return enrichTarget(target, repository, dependencies, now);
    },

    listPublicationJobs(filters = {}) {
      const normalized = publicationJobListQuerySchema.parse(filters);
      validateChannelExists(dependencies.channelsRepository, normalized.channelId);
      return repository.listPublicationJobs(normalized);
    },

    getPublicationJob(id) {
      const parsed = idSchema.parse(id);
      const found = repository.getPublicationJob(parsed);
      if (!found) {
        throw notFound("Publication job not found", { publicationJobId: parsed });
      }

      return found;
    },

    createPublicationJob(input) {
      const parsed = publicationJobCreateSchema.parse(input);
      validateChannelExists(dependencies.channelsRepository, parsed.channelId);

      const requestFingerprint = fingerprintFor(parsed);
      const existing = repository.findPublicationJobByIdempotencyKey(
        parsed.channelId,
        parsed.idempotencyKey,
      );
      if (existing) {
        const existingFingerprint = fingerprintFor(
          existing as PublicationJob & {
            requestedBy?: string;
          },
        );
        if (existingFingerprint && existingFingerprint !== requestFingerprint) {
          throw conflict("Publication idempotency key already used for a different package", {
            channelId: parsed.channelId,
            idempotencyKey: parsed.idempotencyKey,
          });
        }

        recordAudit(dependencies.auditRepository, {
          id: `au_${idFactory()}`,
          channelId: parsed.channelId,
          actorType: parsed.requestedBy?.trim() ? "user" : "system",
          actorName: parsed.requestedBy?.trim() || "Aralume Core",
          action: "publication.job_idempotent_replay",
          entityType: "PublicationJob",
          entityId: existing.id,
          status: "success",
          message: "Publication package replayed by idempotency key.",
          metadata: {
            publicationTargetId: existing.publicationTargetId,
            idempotencyKey: existing.idempotencyKey,
          },
          createdAt: clock().toISOString(),
        });

        return existing;
      }

      const target = repository.getPublicationTarget(parsed.publicationTargetId);
      if (!target) {
        throw notFound("Publication target not found", {
          publicationTargetId: parsed.publicationTargetId,
          channelId: parsed.channelId,
        });
      }

      if (target.channelId !== parsed.channelId) {
        throw notFound("Publication target not found", {
          publicationTargetId: parsed.publicationTargetId,
          channelId: parsed.channelId,
        });
      }

      const contentIdea = dependencies.editorialRepository.getContentIdea(parsed.contentId);
      if (!contentIdea) {
        throw notFound("Content idea not found", {
          channelId: parsed.channelId,
          contentId: parsed.contentId,
        });
      }

      if (contentIdea.channelId !== parsed.channelId) {
        throw notFound("Content idea not found", {
          channelId: parsed.channelId,
          contentId: parsed.contentId,
        });
      }

      const source = resolvePublicationSource(
        dependencies.mediaAssetsRepository,
        parsed.channelId,
        parsed.sourceVideoAssetId,
      );

      if (source.contentId !== contentIdea.id) {
        throw conflict("Publication source does not belong to the selected content", {
          channelId: parsed.channelId,
          contentId: contentIdea.id,
          sourceVideoAssetId: parsed.sourceVideoAssetId,
        });
      }

      const gate = evaluatePublicationGate({
        channelId: parsed.channelId,
        target,
        source,
        contentIdea,
        repository,
        dependencies,
        clock,
      });

      if (!gate.canProceed) {
        recordBlockedPublicationAttempt(
          parsed,
          gate,
          dependencies.auditRepository,
          clock,
          idFactory,
        );
        throw new AppError({
          code: gate.blockCode ?? "OPERATION_BLOCKED",
          status: 409,
          message: gate.blockMessage ?? "Publication package blocked.",
          details: {
            channelId: parsed.channelId,
            publicationTargetId: parsed.publicationTargetId,
            contentId: parsed.contentId,
            sourceVideoAssetId: parsed.sourceVideoAssetId,
            readinessStatus: gate.readinessStatus,
            readinessReasons: gate.readinessReasons,
            approvalId: gate.approval?.id,
            complianceCheckId: gate.compliance?.id,
          },
        });
      }

      const now = clock().toISOString();
      const jobStatus: PublicationJobStatus = parsed.scheduledAt ? "scheduled" : "draft";
      const job: PublicationJob = {
        id: `pj_${idFactory()}`,
        channelId: parsed.channelId,
        publicationTargetId: parsed.publicationTargetId,
        contentId: contentIdea.id,
        sourceVideoAssetId: source.id,
        platform: target.platform,
        title: parsed.title,
        description: parsed.description,
        idempotencyKey: parsed.idempotencyKey,
        scheduledAt: parsed.scheduledAt,
        status: jobStatus,
        approvalId: gate.approval?.id,
        complianceCheckId: gate.compliance?.id,
        createdAt: now,
        updatedAt: now,
      };

      repository.upsertPublicationJob(job);
      repository.upsertPublicationTarget({
        ...target,
        sourceContentId: contentIdea.id,
        sourceVideoAssetId: source.id,
        latestApprovalId: gate.approval?.id,
        latestComplianceCheckId: gate.compliance?.id,
        latestPublicationJobId: job.id,
        updatedAt: now,
      });

      recordAudit(dependencies.auditRepository, {
        id: `au_${idFactory()}`,
        channelId: parsed.channelId,
        actorType: parsed.requestedBy?.trim() ? "user" : "system",
        actorName: parsed.requestedBy?.trim() || "Aralume Core",
        action: "publication.package_prepared",
        entityType: "PublicationJob",
        entityId: job.id,
        status: "success",
        message: "Publication package prepared.",
        metadata: {
          publicationTargetId: job.publicationTargetId,
          sourceVideoAssetId: job.sourceVideoAssetId,
          contentId: job.contentId,
          scheduledAt: job.scheduledAt,
        },
        createdAt: now,
      });

      recordAudit(dependencies.auditRepository, {
        id: `au_${idFactory()}`,
        channelId: parsed.channelId,
        actorType: parsed.requestedBy?.trim() ? "user" : "system",
        actorName: parsed.requestedBy?.trim() || "Aralume Core",
        action: "publication.job_created",
        entityType: "PublicationJob",
        entityId: job.id,
        status: "success",
        message: "Publication job created.",
        metadata: {
          publicationTargetId: job.publicationTargetId,
          sourceVideoAssetId: job.sourceVideoAssetId,
          approvalId: job.approvalId,
          complianceCheckId: job.complianceCheckId,
        },
        createdAt: now,
      });

      recordAudit(dependencies.auditRepository, {
        id: `au_${idFactory()}`,
        channelId: parsed.channelId,
        actorType: parsed.requestedBy?.trim() ? "user" : "system",
        actorName: parsed.requestedBy?.trim() || "Aralume Core",
        action:
          jobStatus === "scheduled" ? "publication.job_scheduled" : "publication.job_saved_draft",
        entityType: "PublicationJob",
        entityId: job.id,
        status: "success",
        message:
          jobStatus === "scheduled"
            ? "Publication job scheduled."
            : "Publication package saved as draft.",
        metadata: {
          publicationTargetId: job.publicationTargetId,
          scheduledAt: job.scheduledAt,
        },
        createdAt: now,
      });

      return job;
    },

    reschedulePublicationJob(id, input) {
      const parsed = publicationJobRescheduleSchema.parse(input);
      validateChannelExists(dependencies.channelsRepository, parsed.channelId);

      const job = repository.getPublicationJob(idSchema.parse(id));
      if (!job) {
        throw notFound("Publication job not found", { publicationJobId: id });
      }

      if (job.channelId !== parsed.channelId) {
        throw notFound("Publication job not found", {
          publicationJobId: id,
          channelId: parsed.channelId,
        });
      }

      if (job.status === "published") {
        throw conflict("Published jobs cannot be rescheduled", { publicationJobId: id });
      }

      const now = clock().toISOString();
      const nextStatus: PublicationJobStatus = parsed.scheduledAt ? "scheduled" : "draft";
      const updated: PublicationJob = {
        ...job,
        scheduledAt: parsed.scheduledAt ?? undefined,
        status: nextStatus,
        updatedAt: now,
      };

      repository.upsertPublicationJob(updated);
      recordAudit(dependencies.auditRepository, {
        id: `au_${idFactory()}`,
        channelId: parsed.channelId,
        actorType: parsed.requestedBy?.trim() ? "user" : "system",
        actorName: parsed.requestedBy?.trim() || "Aralume Core",
        action: "publication.job_rescheduled",
        entityType: "PublicationJob",
        entityId: updated.id,
        status: "success",
        message:
          nextStatus === "scheduled"
            ? "Publication job rescheduled."
            : "Publication schedule cleared.",
        metadata: {
          publicationTargetId: updated.publicationTargetId,
          scheduledAt: updated.scheduledAt,
        },
        createdAt: now,
      });

      return updated;
    },
  };
}

function evaluatePublicationGate(input: {
  channelId: string;
  target: PublicationTarget;
  source: PublicationSource;
  contentIdea: { id: string; channelId: string; title: string; summary: string; status: string };
  repository: InMemoryPublicationsRepository;
  dependencies: PublicationsDependencies & {
    channelsRepository: ChannelsRepository;
    editorialRepository: EditorialRepository;
    mediaAssetsRepository: MediaAssetsRepository;
    governanceRepository: GovernanceRepository;
    auditRepository: AuditRepository;
  };
  clock: () => Date;
}): PublicationGateResult {
  const now = input.clock().toISOString();
  const readiness = computeTargetReadiness(input.target, now);
  const latestApproval = resolveLatestApproval(
    input.dependencies.governanceRepository,
    input.channelId,
    input.contentIdea.id,
  );
  const latestCompliance = resolveLatestCompliance(
    input.dependencies.governanceRepository,
    input.channelId,
    input.contentIdea.id,
  );

  if (readiness.readinessStatus !== "ready") {
    return {
      channelId: input.channelId,
      targetId: input.target.id,
      contentId: input.contentIdea.id,
      sourceVideoAssetId: input.source.id,
      readinessStatus: readiness.readinessStatus,
      readinessReason: readiness.readinessReason,
      readinessReasons: readiness.readinessReasons,
      canProceed: false,
      blockCode: "OPERATION_BLOCKED",
      blockMessage: readiness.readinessReason,
      blockDetails: {
        publicationTargetId: input.target.id,
        readinessReasons: readiness.readinessReasons,
      },
    };
  }

  if (!latestApproval) {
    return {
      channelId: input.channelId,
      targetId: input.target.id,
      contentId: input.contentIdea.id,
      sourceVideoAssetId: input.source.id,
      readinessStatus: readiness.readinessStatus,
      readinessReason: readiness.readinessReason,
      readinessReasons: readiness.readinessReasons,
      canProceed: false,
      blockCode: "OPERATION_BLOCKED",
      blockMessage: "Human approval is required before assisted publication.",
      blockDetails: {
        publicationTargetId: input.target.id,
        contentId: input.contentIdea.id,
        missingApproval: true,
      },
      approval: undefined,
      compliance: latestCompliance,
    };
  }

  if (latestApproval.status !== "approved") {
    return {
      channelId: input.channelId,
      targetId: input.target.id,
      contentId: input.contentIdea.id,
      sourceVideoAssetId: input.source.id,
      readinessStatus: readiness.readinessStatus,
      readinessReason: readiness.readinessReason,
      readinessReasons: readiness.readinessReasons,
      canProceed: false,
      blockCode: "OPERATION_BLOCKED",
      blockMessage: `Human approval is ${latestApproval.status}.`,
      blockDetails: {
        publicationTargetId: input.target.id,
        approvalId: latestApproval.id,
        approvalStatus: latestApproval.status,
      },
      approval: latestApproval,
      compliance: latestCompliance,
    };
  }

  if (!latestCompliance) {
    return {
      channelId: input.channelId,
      targetId: input.target.id,
      contentId: input.contentIdea.id,
      sourceVideoAssetId: input.source.id,
      readinessStatus: readiness.readinessStatus,
      readinessReason: readiness.readinessReason,
      readinessReasons: readiness.readinessReasons,
      canProceed: false,
      blockCode: "COMPLIANCE_BLOCKED",
      blockMessage: "Compliance review is required before assisted publication.",
      blockDetails: {
        publicationTargetId: input.target.id,
        contentId: input.contentIdea.id,
        missingCompliance: true,
      },
      approval: latestApproval,
      compliance: undefined,
    };
  }

  if (
    latestCompliance.status !== "approved" ||
    latestCompliance.blockingFindings.length > 0 ||
    latestCompliance.requiresHumanReview
  ) {
    return {
      channelId: input.channelId,
      targetId: input.target.id,
      contentId: input.contentIdea.id,
      sourceVideoAssetId: input.source.id,
      readinessStatus: readiness.readinessStatus,
      readinessReason: readiness.readinessReason,
      readinessReasons: readiness.readinessReasons,
      canProceed: false,
      blockCode: "COMPLIANCE_BLOCKED",
      blockMessage: `Compliance status is ${latestCompliance.status}.`,
      blockDetails: {
        publicationTargetId: input.target.id,
        complianceCheckId: latestCompliance.id,
        complianceStatus: latestCompliance.status,
        blockingFindings: latestCompliance.blockingFindings.map((finding) => finding.code),
      },
      approval: latestApproval,
      compliance: latestCompliance,
    };
  }

  if (input.source.kind === "video") {
    if (
      input.source.complianceStatus !== "approved" ||
      input.source.renderStatus !== "rendered" ||
      !["approved", "published", "scheduled"].includes(input.source.status)
    ) {
      return {
        channelId: input.channelId,
        targetId: input.target.id,
        contentId: input.contentIdea.id,
        sourceVideoAssetId: input.source.id,
        readinessStatus: readiness.readinessStatus,
        readinessReason: readiness.readinessReason,
        readinessReasons: readiness.readinessReasons,
        canProceed: false,
        blockCode:
          input.source.complianceStatus !== "approved" ? "COMPLIANCE_BLOCKED" : "OPERATION_BLOCKED",
        blockMessage: "Source video is not eligible for assisted publication.",
        blockDetails: {
          publicationTargetId: input.target.id,
          sourceVideoAssetId: input.source.id,
          renderStatus: input.source.renderStatus,
          status: input.source.status,
          complianceStatus: input.source.complianceStatus,
        },
        approval: latestApproval,
        compliance: latestCompliance,
      };
    }
  } else if (
    input.source.complianceStatus !== "approved" ||
    input.source.parentRenderStatus !== "rendered" ||
    input.source.status !== "completed" ||
    !["approved", "published", "scheduled"].includes(input.source.parentVideoStatus)
  ) {
    return {
      channelId: input.channelId,
      targetId: input.target.id,
      contentId: input.contentIdea.id,
      sourceVideoAssetId: input.source.id,
      readinessStatus: readiness.readinessStatus,
      readinessReason: readiness.readinessReason,
      readinessReasons: readiness.readinessReasons,
      canProceed: false,
      blockCode:
        input.source.complianceStatus !== "approved" ? "COMPLIANCE_BLOCKED" : "OPERATION_BLOCKED",
      blockMessage: "Clip source is not eligible for assisted publication.",
      blockDetails: {
        publicationTargetId: input.target.id,
        sourceVideoAssetId: input.source.id,
        renderStatus: input.source.renderStatus,
        status: input.source.status,
        parentVideoStatus: input.source.parentVideoStatus,
        complianceStatus: input.source.complianceStatus,
      },
      approval: latestApproval,
      compliance: latestCompliance,
    };
  }

  return {
    channelId: input.channelId,
    targetId: input.target.id,
    contentId: input.contentIdea.id,
    sourceVideoAssetId: input.source.id,
    readinessStatus: readiness.readinessStatus,
    readinessReason: readiness.readinessReason,
    readinessReasons: readiness.readinessReasons,
    canProceed: true,
    approval: latestApproval,
    compliance: latestCompliance,
  };
}

function computeTargetReadiness(
  target: PublicationTarget,
  nowIso: string,
): {
  readinessStatus: PublicationTargetReadinessStatus;
  readinessReason: string;
  readinessReasons: string[];
} {
  if (target.status === "not_connected") {
    return {
      readinessStatus: "blocked",
      readinessReason: "Target is not connected.",
      readinessReasons: ["Target is not connected."],
    };
  }

  if (target.status === "token_expired") {
    return {
      readinessStatus: "blocked",
      readinessReason: "Target token expired.",
      readinessReasons: ["Target token expired."],
    };
  }

  if (target.tokenExpiresAt && target.tokenExpiresAt <= nowIso) {
    return {
      readinessStatus: "blocked",
      readinessReason: "Target token expired.",
      readinessReasons: ["Target token expired."],
    };
  }

  if (target.tokenExpiresAt && daysUntil(target.tokenExpiresAt, nowIso) <= 7) {
    return {
      readinessStatus: "warning",
      readinessReason: "Target token expires soon.",
      readinessReasons: ["Target token expires soon."],
    };
  }

  return {
    readinessStatus: "ready",
    readinessReason: "Target is ready for assisted publication.",
    readinessReasons: ["Target is ready for assisted publication."],
  };
}

function resolveLatestApproval(
  repository: PublicationsDependencies["governanceRepository"],
  channelId: string,
  contentId: string,
): HumanApproval | undefined {
  const approvals = repository.listApprovals({
    channelId,
    entityType: "content_idea",
    entityId: contentId,
  });

  return approvals
    .slice()
    .sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) || right.id.localeCompare(left.id),
    )[0];
}

function resolveLatestCompliance(
  repository: PublicationsDependencies["governanceRepository"],
  channelId: string,
  contentId: string,
): ComplianceCheck | undefined {
  const checks = repository.listComplianceChecks({
    channelId,
    entityType: "content_idea",
    entityId: contentId,
  });

  return checks
    .slice()
    .sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) || right.id.localeCompare(left.id),
    )[0];
}

function resolvePublicationSource(
  repository: MediaAssetsRepository,
  channelId: string,
  sourceId: string,
): PublicationSource {
  const videoAsset = repository.getVideoAsset(sourceId);
  if (videoAsset) {
    if (videoAsset.channelId !== channelId) {
      throw notFound("Source video not found", {
        channelId,
        sourceVideoAssetId: sourceId,
      });
    }

    return {
      kind: "video",
      id: videoAsset.id,
      channelId: videoAsset.channelId,
      title: videoAsset.title,
      contentId: videoAsset.contentId,
      complianceStatus: videoAsset.complianceStatus,
      renderStatus: videoAsset.renderStatus,
      status: videoAsset.status,
    };
  }

  const clipAsset = repository.getDerivedClip(sourceId);
  if (clipAsset) {
    if (clipAsset.channelId !== channelId) {
      throw notFound("Source clip not found", {
        channelId,
        sourceVideoAssetId: sourceId,
      });
    }

    const parentVideo = repository.getVideoAsset(clipAsset.parentVideoId);
    if (!parentVideo || parentVideo.channelId !== channelId) {
      throw conflict("Source clip is not linked to a valid parent video", {
        channelId,
        sourceVideoAssetId: sourceId,
      });
    }

    return {
      kind: "clip",
      id: clipAsset.id,
      channelId: clipAsset.channelId,
      title: clipAsset.title,
      contentId: parentVideo.contentId,
      complianceStatus: parentVideo.complianceStatus,
      renderStatus: clipAsset.status,
      status: clipAsset.status,
      parentVideoId: clipAsset.parentVideoId,
      parentVideoStatus: parentVideo.status,
      parentRenderStatus: parentVideo.renderStatus,
    };
  }

  throw notFound("Source video not found", {
    channelId,
    sourceVideoAssetId: sourceId,
  });
}

function enrichTarget(
  target: PublicationTarget,
  repository: InMemoryPublicationsRepository,
  dependencies: PublicationsDependencies & {
    channelsRepository: ChannelsRepository;
    editorialRepository: EditorialRepository;
    mediaAssetsRepository: MediaAssetsRepository;
    governanceRepository: GovernanceRepository;
    auditRepository: AuditRepository;
  },
  nowIso: string,
): PublicationTargetView {
  const readiness = computeTargetReadiness(target, nowIso);
  const latestJob = repository
    .listPublicationJobs({
      channelId: target.channelId,
      publicationTargetId: target.id,
    })
    .at(0);

  const latestApprovalId = target.latestApprovalId ?? latestJob?.approvalId;
  const latestComplianceCheckId = target.latestComplianceCheckId ?? latestJob?.complianceCheckId;
  const latestPublicationJobId = target.latestPublicationJobId ?? latestJob?.id;

  return {
    ...target,
    readinessStatus: readiness.readinessStatus,
    readinessReason: readiness.readinessReason,
    readinessReasons: readiness.readinessReasons,
    latestApprovalId,
    latestComplianceCheckId,
    latestPublicationJobId,
    sourceContentId: target.sourceContentId ?? latestJob?.contentId,
    sourceVideoAssetId: target.sourceVideoAssetId ?? latestJob?.sourceVideoAssetId,
  };
}

function recordBlockedPublicationAttempt(
  input: PublicationJobCreateInput,
  gate: PublicationGateResult,
  auditRepository: AuditRepository,
  clock: () => Date,
  idFactory: () => string,
): void {
  const now = clock().toISOString();
  recordAudit(auditRepository, {
    id: `au_${idFactory()}`,
    channelId: input.channelId,
    actorType: input.requestedBy?.trim() ? "user" : "system",
    actorName: input.requestedBy?.trim() || "Aralume Core",
    action: "publication.job_blocked",
    entityType: "PublicationJob",
    entityId: input.idempotencyKey,
    status: "warning",
    message: gate.blockMessage ?? "Publication package blocked.",
    metadata: {
      publicationTargetId: input.publicationTargetId,
      contentId: input.contentId,
      sourceVideoAssetId: input.sourceVideoAssetId,
      readinessStatus: gate.readinessStatus,
      readinessReasons: gate.readinessReasons,
      approvalId: gate.approval?.id,
      complianceCheckId: gate.compliance?.id,
      blockCode: gate.blockCode,
    },
    createdAt: now,
  });
}

function recordAudit(
  auditRepository: AuditRepository,
  log: Parameters<AuditRepository["appendAuditLog"]>[0],
): void {
  auditRepository.appendAuditLog(log);
}

function validateChannelExists(channelsRepository: ChannelsRepository, channelId: string): void {
  if (!channelsRepository.getChannel(channelId)) {
    throw notFound("Channel not found", { channelId });
  }
}

function validateTargetContentReference(input: {
  editorialRepository: EditorialRepository;
  channelId: string;
  sourceContentId?: string;
}): string | undefined {
  if (!input.sourceContentId) {
    return undefined;
  }

  const contentIdea = input.editorialRepository.getContentIdea(input.sourceContentId);
  if (!contentIdea || contentIdea.channelId !== input.channelId) {
    throw notFound("Content idea not found", {
      channelId: input.channelId,
      contentId: input.sourceContentId,
    });
  }

  return contentIdea.id;
}

function validateTargetVideoReference(input: {
  mediaAssetsRepository: MediaAssetsRepository;
  channelId: string;
  sourceVideoAssetId?: string;
}): { id: string; contentId: string } | undefined {
  if (!input.sourceVideoAssetId) {
    return undefined;
  }

  const source = resolvePublicationSource(
    input.mediaAssetsRepository,
    input.channelId,
    input.sourceVideoAssetId,
  );

  return {
    id: source.id,
    contentId: source.contentId,
  };
}

function fingerprintFor(
  input:
    | PublicationTargetCreateInput
    | PublicationJobCreateInput
    | (PublicationJob & { requestedBy?: string }),
): string {
  return JSON.stringify({
    channelId: input.channelId,
    publicationTargetId: "publicationTargetId" in input ? input.publicationTargetId : undefined,
    contentId: "contentId" in input ? input.contentId : undefined,
    sourceVideoAssetId: "sourceVideoAssetId" in input ? input.sourceVideoAssetId : undefined,
    title: "title" in input ? input.title : undefined,
    description: "description" in input ? input.description : undefined,
    scheduledAt: "scheduledAt" in input ? (input.scheduledAt ?? undefined) : undefined,
    idempotencyKey: "idempotencyKey" in input ? input.idempotencyKey : undefined,
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

function daysUntil(targetIso: string, nowIso: string): number {
  return Math.floor((Date.parse(targetIso) - Date.parse(nowIso)) / (24 * 60 * 60 * 1000));
}
