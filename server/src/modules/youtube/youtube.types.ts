import type { AuditLog } from "../audit/audit.types.js";
import type { CostsService } from "../costs/costs.types.js";
import type { GovernanceRepository } from "../governance/governance.types.js";
import type { MediaAssetsRepository } from "../media-assets/media-assets.types.js";
import type { InMemoryPublicationsRepository } from "../publications/publications.repository.js";
import type { PublicationJob, PublicationTarget } from "../publications/publications.types.js";

export const YOUTUBE_UPLOAD_SCOPE = "https://www.googleapis.com/auth/youtube.upload" as const;
export const YOUTUBE_READONLY_SCOPE = "https://www.googleapis.com/auth/youtube.readonly" as const;
export const YOUTUBE_REQUIRED_SCOPES = [YOUTUBE_UPLOAD_SCOPE, YOUTUBE_READONLY_SCOPE] as const;

export type YouTubeConnectionStatus =
  | "disconnected"
  | "pending"
  | "connected"
  | "expired"
  | "revoked"
  | "reauthorization_required"
  | "error";
export type YouTubeReadinessStatus = "ready" | "warning" | "blocked";
export type YouTubeUploadStatus = "pending" | "uploading" | "published" | "failed";

export type YouTubeChannel = {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
};

export type OAuthStartResponse = { authorizationUrl: string; expiresAt: string };
export type YouTubeConnectionState = {
  channelId: string;
  provider: "youtube";
  status: YouTubeConnectionStatus;
  youtubeChannelId?: string;
  youtubeChannelTitle?: string;
  connectedAt?: string;
  expiresAt?: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  grantedScopes: string[];
  scopesSufficient: boolean;
  reauthorizationRequired: boolean;
};
export type YouTubeReadiness = {
  channelId: string;
  status: YouTubeReadinessStatus;
  reasons: string[];
  connection: YouTubeConnectionState;
  selectedChannel?: YouTubeChannel;
};
export type YouTubeUploadResult = {
  publicationJobId: string;
  channelId: string;
  status: YouTubeUploadStatus;
  youtubeVideoId?: string;
  youtubeChannelId?: string;
  startedAt?: string;
  completedAt?: string;
  errorCode?: string;
  errorMessage?: string;
};

export type EncryptedToken = {
  algorithm: "aes-256-gcm";
  iv: string;
  tag: string;
  ciphertext: string;
};
export type YouTubeStoredConnection = {
  channelId: string;
  status: YouTubeConnectionStatus;
  selectedChannel?: YouTubeChannel;
  token?: EncryptedToken;
  refreshToken?: EncryptedToken;
  accessTokenExpiresAt?: string;
  connectedAt?: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  grantedScopes?: string[];
  selectionValidatedAt?: string;
};
export type OAuthStateRecord = {
  stateHash: string;
  channelId: string;
  expiresAt: string;
  usedAt?: string;
};
export type YouTubeSeed = {
  connections?: YouTubeStoredConnection[];
  oauthStates?: OAuthStateRecord[];
};

export type YouTubeRepository = {
  getConnection(channelId: string): YouTubeStoredConnection | undefined;
  upsertConnection(connection: YouTubeStoredConnection): void;
  listConnections(): YouTubeStoredConnection[];
  getState(stateHash: string): OAuthStateRecord | undefined;
  upsertState(state: OAuthStateRecord): void;
  consumeState(stateHash: string, now: string): OAuthStateRecord | undefined;
};

export type YouTubeExternalClient = {
  exchangeCode(
    code: string,
    redirectUri: string,
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number; scope?: string }>;
  refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: number; scope?: string }>;
  revokeToken(token: string): Promise<void>;
  listChannels(accessToken: string): Promise<YouTubeChannel[]>;
  uploadVideo(input: {
    accessToken: string;
    metadata: {
      title: string;
      description: string;
      privacyStatus: "private" | "unlisted" | "public";
    };
    file: Uint8Array;
    contentType: string;
  }): Promise<{ videoId: string; channelId?: string }>;
};

export type YouTubeServiceDependencies = {
  channelsRepository: { getChannel(id: string): { id: string } | undefined };
  publicationsRepository: InMemoryPublicationsRepository;
  mediaAssetsRepository: MediaAssetsRepository;
  governanceRepository: GovernanceRepository;
  auditRepository: { appendAuditLog(log: AuditLog): void };
  costsService: CostsService;
};

export type YouTubeService = {
  startOAuth(channelId: string): OAuthStartResponse;
  handleCallback(input: {
    code?: string;
    state?: string;
    error?: string;
  }): Promise<YouTubeConnectionState>;
  getConnection(channelId: string): YouTubeConnectionState;
  listChannels(channelId: string): Promise<YouTubeChannel[]>;
  selectChannel(channelId: string, youtubeChannelId: string): Promise<YouTubeConnectionState>;
  getReadiness(channelId: string): YouTubeReadiness;
  revoke(channelId: string): Promise<YouTubeConnectionState>;
  uploadPublication(input: {
    publicationJobId: string;
    channelId: string;
    requestedBy?: string;
  }): Promise<YouTubeUploadResult>;
  getUploadResult(publicationJobId: string, channelId: string): YouTubeUploadResult | undefined;
};
