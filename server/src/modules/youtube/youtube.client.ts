import type { YouTubeChannel, YouTubeExternalClient } from "./youtube.types.js";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const API_URL = "https://www.googleapis.com/youtube/v3";
const UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";

export function createYouTubeExternalClient(input: {
  clientId: string;
  clientSecret: string;
  fetchImpl?: typeof fetch;
}): YouTubeExternalClient {
  const fetchImpl = input.fetchImpl ?? fetch;
  return {
    async exchangeCode(code, redirectUri) {
      const response = await fetchImpl(TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: input.clientId,
          client_secret: input.clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      return parseTokenResponse(response);
    },
    async refreshAccessToken(refreshToken) {
      const response = await fetchImpl(TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: input.clientId,
          client_secret: input.clientSecret,
          grant_type: "refresh_token",
        }),
      });
      return parseTokenResponse(response);
    },
    async revokeToken(token) {
      const response = await fetchImpl(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      if (!response.ok && response.status !== 400) throw externalError("YOUTUBE_REVOCATION_FAILED");
    },
    async listChannels(accessToken) {
      const response = await fetchImpl(`${API_URL}/channels?part=snippet&mine=true`, {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      const body = await parseJson(response);
      if (!response.ok) throw externalError("YOUTUBE_CHANNELS_UNAVAILABLE");
      return (
        (body.items ?? []) as Array<{
          id: string;
          snippet?: {
            title?: string;
            description?: string;
            thumbnails?: { default?: { url?: string } };
          };
        }>
      ).map(
        (item) =>
          ({
            id: item.id,
            title: item.snippet?.title ?? item.id,
            description: item.snippet?.description,
            thumbnailUrl: item.snippet?.thumbnails?.default?.url,
          }) satisfies YouTubeChannel,
      );
    },
    async uploadVideo(upload) {
      const initResponse = await fetchImpl(
        `${UPLOAD_URL}?part=snippet,status&uploadType=resumable`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${upload.accessToken}`,
            "content-type": "application/json; charset=UTF-8",
            "x-upload-content-type": upload.contentType,
            "x-upload-content-length": String(upload.file.byteLength),
          },
          body: JSON.stringify({
            snippet: { title: upload.metadata.title, description: upload.metadata.description },
            status: { privacyStatus: upload.metadata.privacyStatus },
          }),
        },
      );
      if (!initResponse.ok) throw externalError("YOUTUBE_UPLOAD_INIT_FAILED");
      const location = initResponse.headers.get("location");
      if (!location) throw externalError("YOUTUBE_UPLOAD_LOCATION_MISSING");
      const result = await fetchImpl(location, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${upload.accessToken}`,
          "content-type": upload.contentType,
        },
        body: Buffer.from(upload.file),
      });
      const body = await parseJson(result);
      if (!result.ok || typeof body.id !== "string") throw externalError("YOUTUBE_UPLOAD_FAILED");
      return { videoId: body.id as string };
    },
  };
}

async function parseTokenResponse(response: Response) {
  const body = await parseJson(response);
  if (!response.ok || typeof body.access_token !== "string" || typeof body.expires_in !== "number")
    throw externalError("YOUTUBE_OAUTH_TOKEN_FAILED");
  return {
    accessToken: body.access_token as string,
    refreshToken: typeof body.refresh_token === "string" ? body.refresh_token : undefined,
    expiresIn: body.expires_in as number,
    scope: typeof body.scope === "string" ? body.scope : undefined,
  };
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
function externalError(code: string): Error {
  const error = new Error(code);
  error.name = "YouTubeExternalError";
  return error;
}
