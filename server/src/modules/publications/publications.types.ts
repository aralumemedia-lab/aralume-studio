import type { AuditLog } from "../audit/audit.types.js";
import type { ComplianceCheck, HumanApproval } from "../governance/governance.types.js";
import type { DerivedClip, ID, ISODate, VideoAsset } from "../media-assets/media-assets.types.js";

export type PublicationPlatform = "youtube" | "tiktok" | "instagram" | "linkedin" | "other";

export type PublicationStatus =
  | "not_connected"
  | "authenticated"
  | "token_expired"
  | "draft"
  | "scheduled"
  | "published"
  | "failed";

export type PublicationTargetStatus = Extract<
  PublicationStatus,
  "not_connected" | "authenticated" | "token_expired"
>;

export type PublicationJobStatus = Extract<
  PublicationStatus,
  "draft" | "scheduled" | "published" | "failed"
>;

export type PublicationTargetReadinessStatus = "ready" | "warning" | "blocked";

export type PublicationTarget = {
  id: ID;
  channelId: ID;
  platform: PublicationPlatform;
  accountName: string;
  status: PublicationTargetStatus;
  lastConnectedAt?: ISODate;
  tokenExpiresAt?: ISODate;
  sourceContentId?: ID;
  sourceVideoAssetId?: ID;
  latestApprovalId?: ID;
  latestComplianceCheckId?: ID;
  latestPublicationJobId?: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type PublicationJob = {
  id: ID;
  channelId: ID;
  publicationTargetId: ID;
  contentId: ID;
  sourceVideoAssetId: ID;
  platform: PublicationPlatform;
  title: string;
  description: string;
  idempotencyKey: string;
  scheduledAt?: ISODate;
  status: PublicationJobStatus;
  approvalId?: ID;
  complianceCheckId?: ID;
  blockedReason?: string;
  errorCode?: string;
  errorMessage?: string;
  externalId?: string;
  externalPublishedAt?: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type PublicationTargetView = PublicationTarget & {
  readinessStatus: PublicationTargetReadinessStatus;
  readinessReason: string;
  readinessReasons: string[];
  latestPublicationJobId?: ID;
};

export type PublicationSeed = {
  publicationTargets: PublicationTarget[];
  publicationJobs: PublicationJob[];
};

export type PublicationTargetFilters = {
  channelId?: ID;
  platform?: PublicationPlatform;
  status?: PublicationTargetStatus;
  readinessStatus?: PublicationTargetReadinessStatus;
};

export type PublicationJobFilters = {
  channelId?: ID;
  platform?: PublicationPlatform;
  status?: PublicationJobStatus;
  publicationTargetId?: ID;
  contentId?: ID;
  sourceVideoAssetId?: ID;
  idempotencyKey?: string;
};

export type PublicationTargetCreateInput = {
  id?: ID;
  channelId: ID;
  platform: PublicationPlatform;
  accountName: string;
  status: PublicationTargetStatus;
  lastConnectedAt?: ISODate;
  tokenExpiresAt?: ISODate;
  sourceContentId?: ID;
  sourceVideoAssetId?: ID;
  requestedBy?: string;
};

export type PublicationJobCreateInput = {
  channelId: ID;
  publicationTargetId: ID;
  contentId: ID;
  sourceVideoAssetId: ID;
  title: string;
  description: string;
  idempotencyKey: string;
  scheduledAt?: ISODate;
  requestedBy?: string;
};

export type PublicationJobRescheduleInput = {
  channelId: ID;
  scheduledAt?: ISODate | null;
  requestedBy?: string;
};

export type PublicationGateResult = {
  readinessStatus: PublicationTargetReadinessStatus;
  readinessReason: string;
  readinessReasons: string[];
  approval?: HumanApproval;
  compliance?: ComplianceCheck;
  videoAsset?: VideoAsset;
  clipAsset?: DerivedClip;
  contentId?: ID;
  sourceVideoAssetId?: ID;
  targetId?: ID;
  channelId: ID;
  canProceed: boolean;
  blockCode?: "OPERATION_BLOCKED" | "COMPLIANCE_BLOCKED" | "CONFLICT" | "NOT_FOUND";
  blockMessage?: string;
  blockDetails?: Record<string, unknown>;
};

export type PublicationsDependencies = {
  channelsRepository: {
    getChannel(id: ID): { id: ID } | undefined;
  };
  editorialRepository: {
    getContentIdea(
      id: ID,
    ): { id: ID; channelId: ID; title: string; summary: string; status: string } | undefined;
  };
  mediaAssetsRepository: {
    getVideoAsset(id: ID): VideoAsset | undefined;
    getDerivedClip(id: ID): DerivedClip | undefined;
  };
  governanceRepository: {
    listApprovals(filters?: {
      channelId?: ID;
      entityType?: "content_idea";
      entityId?: ID;
    }): HumanApproval[];
    listComplianceChecks(filters?: {
      channelId?: ID;
      entityType?: "content_idea";
      entityId?: ID;
    }): ComplianceCheck[];
  };
  auditRepository: {
    appendAuditLog(log: AuditLog): void;
  };
};
