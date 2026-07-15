import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createAuditRepository } from "../src/modules/audit/audit.repository.js";
import { createChannelsRepository } from "../src/modules/channels/channel.repository.js";
import { channelDemoSeed } from "../src/modules/channels/channel.seed.js";
import { createGovernanceRepository } from "../src/modules/governance/governance.repository.js";
import { governanceDemoSeed } from "../src/modules/governance/governance.seed.js";
import { createMediaAssetsRepository } from "../src/modules/media-assets/media-assets.repository.js";
import { mediaAssetsDemoSeed } from "../src/modules/media-assets/media-assets.seed.js";
import { createPublicationsRepository } from "../src/modules/publications/publications.repository.js";
import { publicationDemoSeed } from "../src/modules/publications/publications.seed.js";
import { createYouTubeRepository } from "../src/modules/youtube/youtube.repository.js";
import { createYouTubeService } from "../src/modules/youtube/youtube.service.js";
import { decryptToken, encryptToken } from "../src/modules/youtube/youtube.crypto.js";
import type { YouTubeExternalClient } from "../src/modules/youtube/youtube.types.js";

const secret = "test-publication-secret";

test("YouTube OAuth state is expirable, one-shot, and tokens are encrypted/redacted", () => {
  const root = os.tmpdir();
  const repository = createYouTubeRepository(
    undefined,
    path.join(root, `aralume-youtube-state-${Date.now()}`),
  );
  repository.upsertState({
    stateHash: "state",
    channelId: "ch_historia",
    expiresAt: "2099-01-01T00:00:00.000Z",
  });
  assert.equal(
    repository.consumeState("state", "2026-01-01T00:00:00.000Z")?.channelId,
    "ch_historia",
  );
  assert.equal(repository.consumeState("state", "2026-01-01T00:00:01.000Z"), undefined);
  const encrypted = encryptToken("access-token-value", secret);
  assert.notEqual(encrypted.ciphertext, "access-token-value");
  assert.equal(decryptToken(encrypted, secret), "access-token-value");
  assert.equal(JSON.stringify(encrypted).includes("access-token-value"), false);
});

test("YouTube connection, selection, upload, isolation and revocation are channel-scoped", async () => {
  const storageRoot = path.join(os.tmpdir(), `aralume-youtube-${Date.now()}`);
  mkdirSync(path.join(storageRoot, "ch_historia", "video"), { recursive: true });
  writeFileSync(
    path.join(storageRoot, "ch_historia", "video", "vd_historia_01.mp4"),
    Buffer.from("controlled-test-video"),
  );
  const channelsRepository = createChannelsRepository(channelDemoSeed);
  const mediaAssetsRepository = createMediaAssetsRepository(mediaAssetsDemoSeed, { storageRoot });
  const video = mediaAssetsRepository.getVideoAsset("vd_historia_01")!;
  mediaAssetsRepository.upsertVideoAsset({ ...video, sizeBytes: 21 });
  const publicationsRepository = createPublicationsRepository(publicationDemoSeed, { storageRoot });
  const governanceRepository = createGovernanceRepository(governanceDemoSeed);
  const auditRepository = createAuditRepository(undefined, { storageRoot });
  const calls: string[] = [];
  const externalClient: YouTubeExternalClient = {
    async exchangeCode() {
      calls.push("exchange");
      return {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 3600,
        scope: "https://www.googleapis.com/auth/youtube.upload",
      };
    },
    async refreshAccessToken() {
      calls.push("refresh");
      return {
        accessToken: "refreshed-token",
        expiresIn: 3600,
        scope: "https://www.googleapis.com/auth/youtube.upload",
      };
    },
    async revokeToken(token) {
      calls.push(`revoke:${token}`);
    },
    async listChannels() {
      calls.push("channels");
      return [
        { id: "yt-a", title: "Canal A" },
        { id: "yt-b", title: "Canal B" },
      ];
    },
    async uploadVideo() {
      calls.push("upload");
      return { videoId: "yt-video-1" };
    },
  };
  const costsService = {
    evaluateOperationalAction: () => ({
      allowed: true,
      decisionCode: "ALLOWED",
      reason: "Allowed",
    }),
  } as never;
  const service = createYouTubeService({
    repository: createYouTubeRepository(undefined, storageRoot),
    dependencies: {
      channelsRepository,
      publicationsRepository,
      mediaAssetsRepository,
      governanceRepository,
      auditRepository,
      costsService,
    },
    externalClient,
    clientId: "client-id",
    clientSecret: "client-secret",
    redirectUri: "http://localhost/api/integrations/youtube/oauth/callback",
    tokenSecret: secret,
    storageRoot,
    clock: () => new Date("2026-07-14T00:00:00.000Z"),
    idFactory: () => "test",
  });
  const started = service.startOAuth("ch_historia");
  const state = new URL(started.authorizationUrl).searchParams.get("state")!;
  assert.equal((await service.handleCallback({ code: "code", state })).status, "connected");
  assert.equal((await service.listChannels("ch_historia")).length, 2);
  assert.equal((await service.selectChannel("ch_historia", "yt-a")).youtubeChannelId, "yt-a");
  assert.equal(service.getConnection("ch_curiosidades").status, "disconnected");
  const result = await service.uploadPublication({
    publicationJobId: "pj_historia_01",
    channelId: "ch_historia",
    requestedBy: "Ana Ribeiro",
  });
  assert.equal(result.youtubeVideoId, "yt-video-1");
  assert.equal(
    publicationsRepository.getPublicationJob("pj_historia_01")?.externalId,
    "yt-video-1",
  );
  assert.equal(JSON.stringify(result).includes("access-token"), false);
  assert.equal((await service.revoke("ch_historia")).status, "revoked");
  assert.equal(service.getConnection("ch_curiosidades").status, "disconnected");
  assert.ok(calls.includes("upload"));
  assert.ok(calls.some((call) => call.startsWith("revoke:")));
  rmSync(storageRoot, { recursive: true, force: true });
});
