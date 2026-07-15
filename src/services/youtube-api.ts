import type { ApiSuccess, ApiListSuccess } from "@/contracts/api-contracts";
import type {
  ID,
  YouTubeChannel,
  YouTubeConnectionState,
  YouTubeReadiness,
  YouTubeUploadResult,
} from "@/contracts/types";
import { requestApiEnvelope } from "@/services/http-client";

const base = "/integrations/youtube";
const query = (path: string, channelId: ID) => `${path}?channelId=${encodeURIComponent(channelId)}`;
export const getYouTubeOAuthStart = (channelId: ID) =>
  requestApiEnvelope<ApiSuccess<{ authorizationUrl: string; expiresAt: string }>>(
    query(`${base}/oauth/start`, channelId),
  );
export const getYouTubeConnection = (channelId: ID) =>
  requestApiEnvelope<ApiSuccess<YouTubeConnectionState>>(query(`${base}/connection`, channelId));
export const getYouTubeChannels = (channelId: ID) =>
  requestApiEnvelope<ApiListSuccess<YouTubeChannel>>(query(`${base}/channels`, channelId));
export const selectYouTubeChannel = (input: { channelId: ID; youtubeChannelId: ID }) =>
  requestApiEnvelope<ApiSuccess<YouTubeConnectionState>>(`${base}/selection`, {
    method: "POST",
    body: JSON.stringify(input),
  });
export const getYouTubeReadiness = (channelId: ID) =>
  requestApiEnvelope<ApiSuccess<YouTubeReadiness>>(query(`${base}/readiness`, channelId));
export const revokeYouTube = (channelId: ID) =>
  requestApiEnvelope<ApiSuccess<YouTubeConnectionState>>(`${base}/revoke`, {
    method: "POST",
    body: JSON.stringify({ channelId }),
  });
export const uploadYouTubePublication = (
  publicationJobId: ID,
  input: { channelId: ID; requestedBy?: string },
) =>
  requestApiEnvelope<ApiSuccess<YouTubeUploadResult>>(`/publications/${publicationJobId}/upload`, {
    method: "POST",
    body: JSON.stringify(input),
  });
export const getYouTubeUploadResult = (publicationJobId: ID, channelId: ID) =>
  requestApiEnvelope<ApiSuccess<YouTubeUploadResult>>(
    `/publications/${publicationJobId}/upload?channelId=${encodeURIComponent(channelId)}`,
  );
