import type { ChannelsRepository, ID, ISODate } from "../channels/channel.types.js";
import type { EditorialRepository } from "../editorial/editorial.types.js";
import type { CostsService } from "../costs/costs.types.js";
import type {
  MediaAssetBase,
  MediaAssetsRepository,
  VideoAsset,
} from "../media-assets/media-assets.types.js";
import type { AuditRepository } from "../audit/audit.types.js";

export type RenderType = "controlled_video" | "controlled_clip";
export type RenderProfile = "controlled_demo_short_v1" | "controlled_demo_clip_segment_v1";
export type RenderStatus = "queued" | "running" | "completed" | "failed" | "blocked";
export type RenderLogLevel = "info" | "warn" | "error";

export type RenderLogEntry = {
  timestamp: ISODate;
  level: RenderLogLevel;
  message: string;
  code?: string;
  metadata?: Record<string, unknown>;
};

export type RenderJob = {
  id: ID;
  channelId: ID;
  renderType: RenderType;
  status: RenderStatus;
  inputAssetIds: ID[];
  outputAssetId?: ID;
  parentVideoId?: ID;
  startSeconds?: number;
  endSeconds?: number;
  targetPlatform?: "youtube_shorts" | "tiktok" | "instagram_reels" | "linkedin" | "other";
  renderProfile: RenderProfile;
  idempotencyKey: string;
  outputStoragePath?: string;
  createdAt: ISODate;
  startedAt?: ISODate;
  completedAt?: ISODate;
  durationSeconds?: number;
  attemptCount: number;
  errorCode?: string;
  errorMessage?: string;
  logSummary?: string;
  logEntries?: RenderLogEntry[];
  technicalMetadata?: Record<string, unknown>;
  contentId?: ID;
  workflowRunId?: ID;
  updatedAt: ISODate;
};

export type RenderJobsSeed = {
  renderJobs: RenderJob[];
};

export type RenderJobsRepository = {
  replaceAll(seed: Partial<RenderJobsSeed>): void;
  listRenderJobs(filters?: Partial<RenderJobFilters>): RenderJob[];
  getRenderJob(id: ID): RenderJob | undefined;
  findRenderJobByIdempotencyKey(channelId: ID, idempotencyKey: string): RenderJob | undefined;
  upsertRenderJob(job: RenderJob): void;
};

export type RenderJobFilters = {
  channelId: ID;
  status?: RenderStatus;
  renderType?: RenderType;
  contentId?: ID;
  workflowRunId?: ID;
  parentVideoId?: ID;
  idempotencyKey?: string;
};

export type CreateRenderJobInput = {
  channelId: ID;
  inputAssetIds: ID[];
  renderType: RenderType;
  renderProfile: RenderProfile;
  idempotencyKey: string;
  parentVideoId?: ID;
  startSeconds?: number;
  endSeconds?: number;
  targetPlatform?: "youtube_shorts" | "tiktok" | "instagram_reels" | "linkedin" | "other";
  title?: string;
  hook?: string;
  description?: string;
  contentId?: ID;
  workflowRunId?: ID;
  requestedBy?: string;
};

export type RenderJobsDependencies = {
  channelsRepository: ChannelsRepository;
  editorialRepository: EditorialRepository;
  mediaAssetsRepository: MediaAssetsRepository;
  costsService: CostsService;
  auditRepository: AuditRepository;
};

export type RenderEngineInput = {
  job: RenderJob;
  inputAssets: Array<MediaAssetBase | VideoAsset>;
  storageRoot: string;
  outputStoragePath: string;
  tempOutputPath: string;
  ffmpegPath?: string;
  ffprobePath?: string;
};

export type RenderEngineResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMilliseconds: number;
  outputSizeBytes: number;
  outputChecksum: string;
  technicalMetadata: Record<string, unknown>;
};

export type RenderEngine = (input: RenderEngineInput) => Promise<RenderEngineResult>;

export type CreateRendersServiceOptions = {
  clock?: () => Date;
  idFactory?: () => string;
  storageRoot?: string;
  ffmpegPath?: string;
  ffprobePath?: string;
  engine?: RenderEngine;
};

export type RendersService = {
  listRenderJobs(filters: RenderJobFilters): RenderJob[];
  getRenderJob(channelId: ID, id: ID): RenderJob;
  createRenderJob(input: CreateRenderJobInput): Promise<RenderJob>;
};
