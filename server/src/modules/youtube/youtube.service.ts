import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  resolveAbsoluteStoragePath,
  resolveStorageRoot,
} from "../media-assets/media-assets.storage.js";
import { AppError } from "../../http/errors.js";
import type {
  YouTubeRepository,
  YouTubeExternalClient,
  YouTubeService,
  YouTubeServiceDependencies,
  YouTubeStoredConnection,
} from "./youtube.types.js";
import type {
  YouTubeChannel,
  YouTubeConnectionState,
  YouTubeReadiness,
  YouTubeReadinessStatus,
  YouTubeUploadResult,
} from "./youtube.types.js";
import { YOUTUBE_REQUIRED_SCOPES } from "./youtube.types.js";
import {
  createState,
  decryptToken,
  encryptToken,
  hashState,
  verifyState,
} from "./youtube.crypto.js";

const now = () => new Date();
const externalCode = (error: unknown) =>
  error instanceof Error && error.name === "YouTubeExternalError"
    ? error.message
    : "YOUTUBE_EXTERNAL_UNAVAILABLE";
const normalizeScopes = (scope?: string | string[]) =>
  [...new Set((Array.isArray(scope) ? scope : (scope?.split(/\s+/) ?? [])).filter(Boolean))].sort();
const hasRequiredScopes = (scopes: string[]) =>
  YOUTUBE_REQUIRED_SCOPES.every((required) => scopes.includes(required));
const hasOnlyApprovedScopes = (scopes: string[]) =>
  scopes.every((scope) =>
    YOUTUBE_REQUIRED_SCOPES.includes(scope as (typeof YOUTUBE_REQUIRED_SCOPES)[number]),
  );
const scopesAreSufficient = (scope?: string[]) =>
  Boolean(scope && hasRequiredScopes(scope) && hasOnlyApprovedScopes(scope));

export function createYouTubeService(input: {
  repository: YouTubeRepository;
  dependencies: YouTubeServiceDependencies;
  externalClient: YouTubeExternalClient;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  tokenSecret?: string;
  storageRoot?: string;
  clock?: () => Date;
  idFactory?: () => string;
}): YouTubeService {
  const clock = input.clock ?? now;
  const idFactory = input.idFactory ?? randomUUID;
  const requireConfig = () => {
    if (
      !input.clientId ||
      !input.clientSecret ||
      !input.redirectUri ||
      !input.tokenSecret ||
      !input.storageRoot
    )
      throw appError(
        "INTEGRATION_CONFIGURATION_INVALID",
        "YouTube integration is not configured.",
        409,
      );
  };
  const assertChannel = (channelId: string) => {
    if (!input.dependencies.channelsRepository.getChannel(channelId))
      throw appError("NOT_FOUND", "Channel not found.", 404, { channelId });
  };
  const audit = (
    channelId: string,
    action: string,
    entityId: string,
    status: "success" | "warning" | "failed",
    message: string,
    metadata: Record<string, unknown> = {},
  ) =>
    input.dependencies.auditRepository.appendAuditLog({
      id: `au_${idFactory()}`,
      channelId,
      actorType: "system",
      actorName: "Aralume Core",
      action,
      entityType: "YouTubeIntegration",
      entityId,
      status,
      message,
      metadata,
      createdAt: clock().toISOString(),
    });
  const publicConnection = (channelId: string): YouTubeConnectionState => {
    const stored = input.repository.getConnection(channelId);
    if (!stored)
      return {
        channelId,
        provider: "youtube",
        status: "disconnected",
        grantedScopes: [],
        scopesSufficient: false,
        reauthorizationRequired: false,
      };
    const grantedScopes = normalizeScopes(stored.grantedScopes);
    const scopesSufficient = scopesAreSufficient(grantedScopes);
    const expired =
      stored.accessTokenExpiresAt !== undefined &&
      stored.accessTokenExpiresAt <= clock().toISOString();
    const status =
      stored.status === "connected" && !scopesSufficient
        ? "reauthorization_required"
        : stored.status === "connected" && expired
          ? "expired"
          : stored.status;
    return {
      channelId,
      provider: "youtube",
      status,
      youtubeChannelId: stored.selectedChannel?.id,
      youtubeChannelTitle: stored.selectedChannel?.title,
      connectedAt: stored.connectedAt,
      expiresAt: stored.accessTokenExpiresAt,
      lastErrorCode: stored.lastErrorCode,
      lastErrorMessage: stored.lastErrorMessage,
      grantedScopes,
      scopesSufficient,
      reauthorizationRequired: status === "reauthorization_required",
    };
  };
  const refresh = async (stored: YouTubeStoredConnection): Promise<YouTubeStoredConnection> => {
    requireConfig();
    if (!stored.refreshToken)
      throw appError("UNAUTHORIZED", "YouTube authorization is unavailable.", 401);
    try {
      const result = await input.externalClient.refreshAccessToken(
        decryptToken(stored.refreshToken, input.tokenSecret!),
      );
      const grantedScopes = normalizeScopes(result.scope ?? stored.grantedScopes);
      if (!scopesAreSufficient(grantedScopes)) {
        const reauthorization = {
          channelId: stored.channelId,
          status: "reauthorization_required" as const,
          grantedScopes,
          lastErrorCode: "YOUTUBE_INSUFFICIENT_SCOPE",
          lastErrorMessage: "YouTube reauthorization is required.",
        };
        input.repository.upsertConnection(reauthorization);
        audit(
          stored.channelId,
          "youtube.scope_insufficient",
          stored.channelId,
          "warning",
          "YouTube reauthorization is required.",
          { grantedScopes },
        );
        throw appError("FORBIDDEN", "YouTube reauthorization is required.", 403);
      }
      const updated = {
        ...stored,
        status: "connected" as const,
        token: encryptToken(result.accessToken, input.tokenSecret!),
        accessTokenExpiresAt: new Date(clock().getTime() + result.expiresIn * 1000).toISOString(),
        grantedScopes,
        lastErrorCode: undefined,
        lastErrorMessage: undefined,
      };
      input.repository.upsertConnection(updated);
      audit(
        stored.channelId,
        "youtube.token_refreshed",
        stored.channelId,
        "success",
        "YouTube token refreshed.",
      );
      return updated;
    } catch (error) {
      if (error instanceof AppError && error.code === "FORBIDDEN") throw error;
      const failed = {
        ...stored,
        status: "expired" as const,
        lastErrorCode: externalCode(error),
        lastErrorMessage: "YouTube authorization expired.",
      };
      input.repository.upsertConnection(failed);
      audit(
        stored.channelId,
        "youtube.token_refresh_failed",
        stored.channelId,
        "failed",
        "YouTube token refresh failed.",
        { errorCode: failed.lastErrorCode },
      );
      throw appError("UNAUTHORIZED", "YouTube authorization expired.", 401);
    }
  };
  const accessToken = async (channelId: string) => {
    let stored = input.repository.getConnection(channelId);
    if (!stored?.token) throw appError("UNAUTHORIZED", "YouTube authorization is required.", 401);
    if (!scopesAreSufficient(normalizeScopes(stored.grantedScopes))) {
      audit(
        channelId,
        "youtube.scope_insufficient",
        channelId,
        "warning",
        "YouTube reauthorization is required.",
        { grantedScopes: normalizeScopes(stored.grantedScopes) },
      );
      throw appError("FORBIDDEN", "YouTube reauthorization is required.", 403);
    }
    if (stored.status !== "connected") stored = await refresh(stored);
    if (stored.accessTokenExpiresAt && stored.accessTokenExpiresAt <= clock().toISOString())
      stored = await refresh(stored);
    try {
      return { stored, token: decryptToken(stored.token!, input.tokenSecret!) };
    } catch {
      throw appError("UNAUTHORIZED", "YouTube authorization is invalid.", 401);
    }
  };
  const blockUpload = (
    channelId: string,
    publicationJobId: string,
    code: "OPERATION_BLOCKED" | "COMPLIANCE_BLOCKED" | "CONFLICT",
    message: string,
    details: Record<string, unknown> = {},
  ): never => {
    audit(channelId, "youtube.upload_blocked", publicationJobId, "warning", message, {
      publicationJobId,
      blockCode: code,
      ...details,
    });
    throw appError(code, message, 409, details);
  };

  return {
    startOAuth(channelId) {
      assertChannel(channelId);
      requireConfig();
      const created = createState(input.tokenSecret!);
      const expiresAt = new Date(clock().getTime() + 10 * 60 * 1000).toISOString();
      input.repository.upsertState({ stateHash: created.hash, channelId, expiresAt });
      audit(
        channelId,
        "youtube.oauth_started",
        channelId,
        "success",
        "YouTube OAuth authorization started.",
      );
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.search = new URLSearchParams({
        client_id: input.clientId!,
        redirect_uri: input.redirectUri!,
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
        scope: YOUTUBE_REQUIRED_SCOPES.join(" "),
        state: created.state,
      }).toString();
      return { authorizationUrl: url.toString(), expiresAt };
    },
    async handleCallback(callback) {
      requireConfig();
      if (!callback.state) throw appError("UNAUTHORIZED", "OAuth state is required.", 401);
      const stateHash = hashState(callback.state, input.tokenSecret!);
      const record = input.repository.consumeState(stateHash, clock().toISOString());
      if (!record || !verifyState(callback.state, record.stateHash, input.tokenSecret!))
        throw appError("UNAUTHORIZED", "OAuth state is invalid or expired.", 401);
      if (callback.error || !callback.code) {
        const errorCode = callback.error ? "OAUTH_PROVIDER_DENIED" : "OAUTH_CODE_MISSING";
        const denied: YouTubeStoredConnection = {
          channelId: record.channelId,
          status: "error",
          lastErrorCode: errorCode,
          lastErrorMessage: "YouTube authorization was denied.",
        };
        input.repository.upsertConnection(denied);
        audit(
          record.channelId,
          "youtube.oauth_denied",
          record.channelId,
          "warning",
          "YouTube OAuth authorization was denied.",
          { errorCode },
        );
        return publicConnection(record.channelId);
      }
      try {
        const token = await input.externalClient.exchangeCode(callback.code, input.redirectUri!);
        const grantedScopes = normalizeScopes(token.scope);
        if (!scopesAreSufficient(grantedScopes)) {
          try {
            await input.externalClient.revokeToken(token.accessToken);
          } catch (error) {
            audit(
              record.channelId,
              "youtube.revocation_failed",
              record.channelId,
              "failed",
              "Remote YouTube revocation failed after insufficient scope.",
              { errorCode: externalCode(error) },
            );
          }
          const reauthorization: YouTubeStoredConnection = {
            channelId: record.channelId,
            status: "reauthorization_required",
            grantedScopes,
            lastErrorCode: "YOUTUBE_INSUFFICIENT_SCOPE",
            lastErrorMessage: "YouTube reauthorization is required.",
          };
          input.repository.upsertConnection(reauthorization);
          audit(
            record.channelId,
            "youtube.scope_insufficient",
            record.channelId,
            "warning",
            "YouTube reauthorization is required.",
            { grantedScopes },
          );
          return publicConnection(record.channelId);
        }
        const stored: YouTubeStoredConnection = {
          channelId: record.channelId,
          status: "connected",
          token: encryptToken(token.accessToken, input.tokenSecret!),
          refreshToken: token.refreshToken
            ? encryptToken(token.refreshToken, input.tokenSecret!)
            : undefined,
          accessTokenExpiresAt: new Date(clock().getTime() + token.expiresIn * 1000).toISOString(),
          connectedAt: clock().toISOString(),
          grantedScopes,
        };
        input.repository.upsertConnection(stored);
        audit(
          record.channelId,
          "youtube.oauth_completed",
          record.channelId,
          "success",
          "YouTube OAuth authorization completed.",
        );
        return publicConnection(record.channelId);
      } catch (error) {
        if (error instanceof AppError) throw error;
        const code = externalCode(error);
        input.repository.upsertConnection({
          channelId: record.channelId,
          status: "error",
          lastErrorCode: code,
          lastErrorMessage: "YouTube authorization failed.",
        });
        audit(
          record.channelId,
          "youtube.oauth_failed",
          record.channelId,
          "failed",
          "YouTube OAuth authorization failed.",
          { errorCode: code },
        );
        throw appError("INTERNAL_ERROR", "YouTube authorization failed.", 502);
      }
    },
    getConnection(channelId) {
      assertChannel(channelId);
      return publicConnection(channelId);
    },
    async listChannels(channelId) {
      assertChannel(channelId);
      audit(
        channelId,
        "youtube.channels_list_started",
        channelId,
        "success",
        "YouTube channel discovery started.",
      );
      const auth = await accessToken(channelId);
      try {
        const channels = await input.externalClient.listChannels(auth.token);
        audit(
          channelId,
          channels.length ? "youtube.channels_list_completed" : "youtube.channels_empty",
          channelId,
          channels.length ? "success" : "warning",
          channels.length
            ? "YouTube channels discovered."
            : "No YouTube channels are available for this connection.",
          { count: channels.length },
        );
        return channels;
      } catch (error) {
        audit(
          channelId,
          "youtube.channels_list_failed",
          channelId,
          "failed",
          "YouTube channels could not be listed.",
          { errorCode: externalCode(error) },
        );
        throw appError("INTERNAL_ERROR", "YouTube channels are unavailable.", 502);
      }
    },
    async selectChannel(channelId, youtubeChannelId) {
      assertChannel(channelId);
      const channels = await this.listChannels(channelId);
      const selected = channels.find((channel) => channel.id === youtubeChannelId);
      if (!selected)
        throw appError("NOT_FOUND", "YouTube channel is not available for this connection.", 404);
      const stored = input.repository.getConnection(channelId);
      if (!stored) throw appError("UNAUTHORIZED", "YouTube authorization is required.", 401);
      input.repository.upsertConnection({
        ...stored,
        selectedChannel: selected,
        selectionValidatedAt: clock().toISOString(),
        status: "connected",
      });
      audit(
        channelId,
        "youtube.channel_selected",
        youtubeChannelId,
        "success",
        "YouTube destination selected.",
      );
      return publicConnection(channelId);
    },
    getReadiness(channelId) {
      assertChannel(channelId);
      const connection = publicConnection(channelId);
      const reasons: string[] = [];
      if (!connection.scopesSufficient) reasons.push("youtube_insufficient_scope");
      if (connection.reauthorizationRequired) reasons.push("youtube_reauthorization_required");
      if (connection.status === "disconnected") reasons.push("youtube_not_connected");
      if (connection.status === "expired") reasons.push("youtube_token_expired");
      if (connection.status === "revoked") reasons.push("youtube_revoked");
      if (connection.status === "error") reasons.push("youtube_connection_error");
      if (connection.status === "pending") reasons.push("youtube_connection_pending");
      if (connection.status === "connected" && !connection.youtubeChannelId)
        reasons.push("youtube_channel_not_selected");
      if (connection.status !== "connected" && connection.youtubeChannelId)
        reasons.push("youtube_selected_channel_invalid");
      const status: YouTubeReadinessStatus = reasons.length ? "blocked" : "ready";
      return {
        channelId,
        status,
        reasons,
        connection,
        selectedChannel: input.repository.getConnection(channelId)?.selectedChannel,
      };
    },
    async revoke(channelId) {
      assertChannel(channelId);
      const stored = input.repository.getConnection(channelId);
      let remoteError: unknown;
      if (stored?.token || stored?.refreshToken) {
        try {
          const token = stored.refreshToken
            ? decryptToken(stored.refreshToken, input.tokenSecret!)
            : decryptToken(stored.token!, input.tokenSecret!);
          await input.externalClient.revokeToken(token);
        } catch (error) {
          remoteError = error;
          audit(
            channelId,
            "youtube.revocation_failed",
            channelId,
            "failed",
            "Remote YouTube revocation failed.",
            { errorCode: externalCode(error) },
          );
        }
      }
      input.repository.upsertConnection({ channelId, status: "revoked" });
      audit(channelId, "youtube.revoked", channelId, "success", "YouTube authorization revoked.");
      if (remoteError)
        throw appError(
          "INTERNAL_ERROR",
          "YouTube revocation failed; local access was invalidated.",
          502,
        );
      return publicConnection(channelId);
    },
    async uploadPublication(uploadInput) {
      assertChannel(uploadInput.channelId);
      const job = input.dependencies.publicationsRepository.getPublicationJob(
        uploadInput.publicationJobId,
      );
      if (!job || job.channelId !== uploadInput.channelId)
        throw appError("NOT_FOUND", "Publication job not found.", 404, {
          publicationJobId: uploadInput.publicationJobId,
        });
      if (job.status === "published" && job.externalId) {
        audit(
          job.channelId,
          "youtube.upload_idempotent_replay",
          job.id,
          "success",
          "Completed YouTube upload returned by idempotent replay.",
          { publicationJobId: job.id, youtubeVideoId: job.externalId },
        );
        return {
          publicationJobId: job.id,
          channelId: job.channelId,
          status: "published",
          youtubeVideoId: job.externalId,
          youtubeChannelId: input.repository.getConnection(job.channelId)?.selectedChannel?.id,
          completedAt: job.externalPublishedAt,
        };
      }
      if (job.uploadStatus === "in_progress")
        return blockUpload(
          job.channelId,
          job.id,
          "CONFLICT",
          "A YouTube upload is already in progress for this publication.",
          { uploadStartedAt: job.uploadStartedAt },
        );
      const readiness = this.getReadiness(job.channelId);
      if (readiness.status !== "ready")
        return blockUpload(
          job.channelId,
          job.id,
          "OPERATION_BLOCKED",
          "YouTube integration is not ready.",
          { reasons: readiness.reasons },
        );
      const approval = input.dependencies.governanceRepository
        .listApprovals({
          channelId: job.channelId,
          entityType: "content_idea",
          entityId: job.contentId,
        })
        .slice()
        .sort(
          (left, right) =>
            right.updatedAt.localeCompare(left.updatedAt) || right.id.localeCompare(left.id),
        )
        .at(0);
      if (!approval || approval.status !== "approved")
        return blockUpload(
          job.channelId,
          job.id,
          "OPERATION_BLOCKED",
          "Human approval is required before upload.",
        );
      const compliance = input.dependencies.governanceRepository
        .listComplianceChecks({
          channelId: job.channelId,
          entityType: "content_idea",
          entityId: job.contentId,
        })
        .at(0);
      if (!compliance || compliance.status !== "approved" || compliance.blockingFindings.length)
        return blockUpload(
          job.channelId,
          job.id,
          "COMPLIANCE_BLOCKED",
          "Compliance blocks this upload.",
        );
      const mode = input.dependencies.costsService.evaluateOperationalAction({
        channelId: job.channelId,
        action: "real_publication",
        actor: uploadInput.requestedBy,
      });
      if (!mode.allowed)
        return blockUpload(job.channelId, job.id, "OPERATION_BLOCKED", mode.reason, {
          decisionCode: mode.decisionCode,
        });
      const video = input.dependencies.mediaAssetsRepository.getVideoAsset(job.sourceVideoAssetId);
      const clip = input.dependencies.mediaAssetsRepository.getDerivedClip(job.sourceVideoAssetId);
      const asset = video ?? clip;
      if (!asset || asset.channelId !== job.channelId || !asset.storagePath)
        return blockUpload(
          job.channelId,
          job.id,
          "OPERATION_BLOCKED",
          "Video asset is missing or belongs to another channel.",
          { sourceVideoAssetId: job.sourceVideoAssetId },
        );
      if (
        video &&
        (video.renderStatus !== "rendered" ||
          !["approved", "published", "scheduled"].includes(video.status) ||
          video.complianceStatus !== "approved")
      )
        return blockUpload(
          job.channelId,
          job.id,
          "OPERATION_BLOCKED",
          "Video asset is not eligible for authorized upload.",
          { sourceVideoAssetId: job.sourceVideoAssetId },
        );
      if (clip) {
        const parent = input.dependencies.mediaAssetsRepository.getVideoAsset(clip.parentVideoId);
        if (
          clip.status !== "completed" ||
          !parent ||
          parent.channelId !== job.channelId ||
          parent.renderStatus !== "rendered" ||
          !["approved", "published", "scheduled"].includes(parent.status) ||
          parent.complianceStatus !== "approved"
        )
          return blockUpload(
            job.channelId,
            job.id,
            "OPERATION_BLOCKED",
            "Clip asset is not eligible for authorized upload.",
            { sourceVideoAssetId: job.sourceVideoAssetId },
          );
      }
      let auth;
      try {
        auth = await accessToken(job.channelId);
      } catch (error) {
        audit(
          job.channelId,
          "youtube.upload_blocked",
          job.id,
          "warning",
          "YouTube authorization is not usable for upload.",
          { publicationJobId: job.id, blockCode: "UNAUTHORIZED" },
        );
        throw error;
      }
      const startedAt = clock().toISOString();
      input.dependencies.publicationsRepository.upsertPublicationJob({
        ...job,
        uploadStatus: "in_progress",
        uploadStartedAt: startedAt,
        updatedAt: startedAt,
      });
      audit(
        job.channelId,
        "youtube.upload_started",
        job.id,
        "success",
        "Authorized YouTube upload started.",
        { publicationJobId: job.id, youtubeChannelId: readiness.connection.youtubeChannelId },
      );
      try {
        const file = await readFile(
          resolveAbsoluteStoragePath(
            resolveStorageRoot(input.storageRoot, "./storage"),
            asset.storagePath,
          ).absolutePath,
        );
        const result = await input.externalClient.uploadVideo({
          accessToken: auth.token,
          metadata: { title: job.title, description: job.description, privacyStatus: "unlisted" },
          file,
          contentType: "video/mp4",
        });
        const completedAt = clock().toISOString();
        const updated = {
          ...job,
          status: "published" as const,
          externalId: result.videoId,
          externalPublishedAt: completedAt,
          updatedAt: completedAt,
          errorCode: undefined,
          errorMessage: undefined,
          uploadStatus: undefined,
          uploadStartedAt: undefined,
        };
        input.dependencies.publicationsRepository.upsertPublicationJob(updated);
        audit(
          job.channelId,
          "youtube.upload_completed",
          job.id,
          "success",
          "Authorized YouTube upload completed.",
          {
            publicationJobId: job.id,
            youtubeVideoId: result.videoId,
            youtubeChannelId: readiness.connection.youtubeChannelId,
          },
        );
        return {
          publicationJobId: job.id,
          channelId: job.channelId,
          status: "published" as const,
          youtubeVideoId: result.videoId,
          youtubeChannelId: readiness.connection.youtubeChannelId,
          startedAt,
          completedAt,
        };
      } catch (error) {
        const code = externalCode(error);
        const failed = {
          ...job,
          status: "failed" as const,
          errorCode: code,
          errorMessage: "YouTube upload failed.",
          uploadStatus: undefined,
          uploadStartedAt: undefined,
          updatedAt: clock().toISOString(),
        };
        input.dependencies.publicationsRepository.upsertPublicationJob(failed);
        audit(
          job.channelId,
          "youtube.upload_failed",
          job.id,
          "failed",
          "Authorized YouTube upload failed.",
          { publicationJobId: job.id, errorCode: code },
        );
        throw appError("INTERNAL_ERROR", "YouTube upload failed.", 502, { errorCode: code });
      }
    },
    getUploadResult(publicationJobId, channelId) {
      const job = input.dependencies.publicationsRepository.getPublicationJob(publicationJobId);
      if (
        !job ||
        job.channelId !== channelId ||
        (!job.externalId && job.status !== "failed" && job.uploadStatus !== "in_progress")
      )
        return undefined;
      return {
        publicationJobId: job.id,
        channelId: job.channelId,
        status:
          job.status === "published"
            ? "published"
            : job.uploadStatus === "in_progress"
              ? "pending"
              : "failed",
        youtubeVideoId: job.externalId,
        youtubeChannelId: input.repository.getConnection(channelId)?.selectedChannel?.id,
        startedAt: job.uploadStartedAt,
        completedAt: job.externalPublishedAt,
        errorCode: job.errorCode,
        errorMessage: job.errorMessage,
      };
    },
  };
}

function appError(
  code:
    | "NOT_FOUND"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "CONFLICT"
    | "OPERATION_BLOCKED"
    | "COMPLIANCE_BLOCKED"
    | "INTERNAL_ERROR"
    | "INTEGRATION_CONFIGURATION_INVALID",
  message: string,
  status: number,
  details: Record<string, unknown> = {},
): AppError {
  return new AppError({
    code: code === "INTEGRATION_CONFIGURATION_INVALID" ? "CONFLICT" : code,
    status,
    message,
    details,
  });
}
