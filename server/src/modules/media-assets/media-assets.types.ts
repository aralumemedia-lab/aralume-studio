import type {
  ChannelsRepository,
  ID as ChannelID,
  ISODate as ChannelISODate,
} from "../channels/channel.types.js";

export type ID = string;
export type ISODate = string;

export type MediaAssetType =
  | "narration"
  | "audio"
  | "image"
  | "video"
  | "intermediate_video"
  | "thumbnail"
  | "soundtrack"
  | "sound_effect"
  | "subtitle"
  | "caption"
  | "auxiliary"
  | "brand_asset"
  | "music"
  | "other";

export type MediaAssetCategory =
  | "audio"
  | "video"
  | "visual"
  | "text"
  | "auxiliary"
  | "brand"
  | "other";
export type MediaAssetStatus =
  | "available"
  | "processing"
  | "failed"
  | "pending"
  | "blocked"
  | "invalid"
  | "corrupted"
  | "missing"
  | "replaced"
  | "archived";
export type MediaAssetOrigin =
  | "internal"
  | "generated"
  | "uploaded"
  | "licensed"
  | "demo"
  | "channel_provided"
  | "public_domain"
  | "external_authorized"
  | "unknown"
  | "prohibited";
export type MediaAssetLicenseStatus =
  | "known"
  | "verified"
  | "not_applicable"
  | "pending"
  | "unknown"
  | "confirmed"
  | "unconfirmed"
  | "restricted"
  | "attribution_required"
  | "blocked";
export type MediaAssetUsageType =
  | "content"
  | "workflow_run"
  | "script"
  | "scene"
  | "video"
  | "clip";
export type VideoRenderStatus = "not_started" | "rendering" | "rendered" | "failed";
export type VideoQualityStatus = "not_checked" | "passed" | "warning" | "failed";
export type MediaAssetChecksumAlgorithm = "sha256";

export type MediaAssetIntegrityState = {
  checksumAlgorithm: MediaAssetChecksumAlgorithm;
  checksum: string;
  sizeBytes: number;
  lastValidatedAt?: ISODate;
  observedChecksum?: string;
  observedSizeBytes?: number;
  checksumMatches?: boolean;
  sizeMatches?: boolean;
};

export type MediaAssetBase = {
  id: ID;
  channelId: ID;
  type: MediaAssetType;
  category: MediaAssetCategory;
  name: string;
  title?: string;
  description: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  checksumAlgorithm: MediaAssetChecksumAlgorithm;
  checksum: string;
  internalUri: string;
  storagePath: string;
  origin: MediaAssetOrigin;
  provenance: string;
  licenseStatus: MediaAssetLicenseStatus;
  licenseName?: string;
  status: MediaAssetStatus;
  riskLevel: "ok" | "attention" | "warning" | "critical" | "blocked";
  costActualCents: number;
  contentId?: ID;
  workflowRunId?: ID;
  scriptId?: ID;
  scenePlanId?: ID;
  stepId?: ID;
  providerName?: string;
  modelName?: string;
  prompt?: string;
  thumbnailUri?: string;
  technicalMetadata?: Record<string, unknown>;
  usageSummary?: string;
  sourceAssetId?: ID;
  notes?: string;
  integrity?: MediaAssetIntegrityState;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type NarrationAsset = MediaAssetBase & {
  type: "narration";
  voiceName: string;
  durationSeconds: number;
  language: string;
};

export type VisualAsset = MediaAssetBase & {
  type: "image" | "video" | "thumbnail" | "brand_asset" | "intermediate_video";
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export type VideoAsset = {
  id: ID;
  channelId: ID;
  contentId: ID;
  title: string;
  status:
    | "idea"
    | "research"
    | "script"
    | "visual_plan"
    | "narration"
    | "editing"
    | "clips"
    | "quality_check"
    | "compliance_check"
    | "waiting_approval"
    | "approved"
    | "scheduled"
    | "published"
    | "failed"
    | "blocked";
  durationSeconds: number;
  format: "horizontal" | "vertical" | "square";
  resolution: string;
  thumbnailUri?: string;
  renderStatus: VideoRenderStatus;
  qualityStatus: VideoQualityStatus;
  complianceStatus: "approved" | "attention" | "rejected" | "blocked" | "needs_human_review";
  costActualCents: number;
  type?: "video";
  origin?: MediaAssetOrigin;
  licenseStatus?: MediaAssetLicenseStatus;
  internalUri?: string;
  storagePath?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksumAlgorithm?: MediaAssetChecksumAlgorithm;
  checksum?: string;
  providerName?: string;
  modelName?: string;
  prompt?: string;
  riskLevel?: MediaAssetBase["riskLevel"];
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type DerivedClip = {
  id: ID;
  channelId: ID;
  parentVideoId: ID;
  title: string;
  hook: string;
  description: string;
  durationSeconds: number;
  targetPlatform: "youtube_shorts" | "tiktok" | "instagram_reels" | "linkedin" | "other";
  status:
    | "idea"
    | "research"
    | "script"
    | "visual_plan"
    | "narration"
    | "editing"
    | "clips"
    | "quality_check"
    | "compliance_check"
    | "waiting_approval"
    | "approved"
    | "scheduled"
    | "published"
    | "failed"
    | "blocked";
  riskLevel: MediaAssetBase["riskLevel"];
  clipPotentialScore: number;
  type?: "video" | "clip";
  origin?: MediaAssetOrigin;
  licenseStatus?: MediaAssetLicenseStatus;
  internalUri?: string;
  storagePath?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksumAlgorithm?: MediaAssetChecksumAlgorithm;
  checksum?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type MediaAssetUsage = {
  id: ID;
  channelId: ID;
  assetId: ID;
  usageType: MediaAssetUsageType;
  referenceId: ID;
  referenceLabel: string;
  summary: string;
  createdAt: ISODate;
};

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

export type VideoAssetFilters = {
  channelId: ID;
  status?: VideoAsset["status"];
  renderStatus?: VideoRenderStatus;
  qualityStatus?: VideoQualityStatus;
  complianceStatus?: VideoAsset["complianceStatus"];
  search?: string;
};

export type DerivedClipFilters = {
  channelId: ID;
  status?: DerivedClip["status"];
  targetPlatform?: DerivedClip["targetPlatform"];
  search?: string;
};

export type MediaAssetCreateInput = {
  channelId: ID;
  type: MediaAssetType;
  category: MediaAssetCategory;
  name: string;
  title?: string;
  description: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  checksum: string;
  storagePath: string;
  origin: MediaAssetOrigin;
  provenance: string;
  licenseStatus: MediaAssetLicenseStatus;
  licenseName?: string;
  status: MediaAssetStatus;
  riskLevel: MediaAssetBase["riskLevel"];
  costActualCents: number;
  contentId?: ID;
  workflowRunId?: ID;
  scriptId?: ID;
  scenePlanId?: ID;
  stepId?: ID;
  providerName?: string;
  modelName?: string;
  prompt?: string;
  thumbnailUri?: string;
  technicalMetadata?: Record<string, unknown>;
  usageSummary?: string;
  sourceAssetId?: ID;
  notes?: string;
};

export type MediaAssetPatchInput = Partial<
  Omit<MediaAssetCreateInput, "channelId" | "checksum" | "sizeBytes" | "storagePath">
> & {
  storagePath?: string;
  checksum?: string;
  sizeBytes?: number;
};

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

export type MediaAssetStorageValidation = {
  channelId: ID;
  type: MediaAssetType;
  storagePath: string;
  normalizedStoragePath: string;
  internalUri: string;
};

export type MediaAssetIntegrityValidation = {
  channelId: ID;
  assetId: ID;
  expectedChecksum: string;
  expectedSizeBytes: number;
  observedChecksum?: string;
  observedSizeBytes?: number;
  checksumMatches: boolean;
  sizeMatches: boolean;
  valid: boolean;
};

export type MediaAssetsSeed = {
  mediaAssets: MediaAssetBase[];
  videoAssets: VideoAsset[];
  derivedClips: DerivedClip[];
};

export type MediaAssetsRepository = {
  replaceAll(seed: Partial<MediaAssetsSeed>): void;
  listMediaAssets(filters?: Partial<MediaAssetFilters>): MediaAssetBase[];
  getMediaAsset(id: ID): MediaAssetBase | undefined;
  upsertMediaAsset(asset: MediaAssetBase): void;
  listVideoAssets(filters?: Partial<VideoAssetFilters>): VideoAsset[];
  getVideoAsset(id: ID): VideoAsset | undefined;
  upsertVideoAsset(asset: VideoAsset): void;
  listDerivedClips(filters?: Partial<DerivedClipFilters>): DerivedClip[];
  getDerivedClip(id: ID): DerivedClip | undefined;
  upsertDerivedClip(asset: DerivedClip): void;
};

export type MediaAssetsDependencies = {
  channelsRepository: ChannelsRepository;
  auditRepository: {
    appendAuditLog(log: {
      id: ID;
      channelId?: ID;
      actorType: "user" | "agent" | "system";
      actorName: string;
      action: string;
      entityType: string;
      entityId: ID;
      status: "success" | "warning" | "failed";
      message: string;
      metadata?: Record<string, unknown>;
      createdAt: ISODate;
    }): void;
  };
};

export type CreateMediaAssetsServiceOptions = {
  clock?: () => Date;
  idFactory?: () => string;
  storageRoot?: string;
};

export type MediaAssetsService = {
  listMediaAssets(filters: MediaAssetFilters): MediaAssetBase[];
  getMediaAsset(channelId: ID, id: ID): MediaAssetBase;
  createMediaAsset(input: MediaAssetCreateInput): MediaAssetBase;
  updateMediaAsset(channelId: ID, id: ID, input: MediaAssetPatchInput): MediaAssetBase;
  validateStorageReference(input: StorageReferenceValidationInput): MediaAssetStorageValidation;
  validateAssetIntegrity(
    channelId: ID,
    id: ID,
    input?: IntegrityValidationInput,
  ): MediaAssetIntegrityValidation;
  listMediaAssetUsages(channelId: ID, id: ID): MediaAssetUsage[];
  listVideoAssets(filters: VideoAssetFilters): VideoAsset[];
  getVideoAsset(channelId: ID, id: ID): VideoAsset;
  listDerivedClips(filters: DerivedClipFilters): DerivedClip[];
  getDerivedClip(channelId: ID, id: ID): DerivedClip;
};
