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
import {
  YOUTUBE_REQUIRED_SCOPES,
  YOUTUBE_UPLOAD_SCOPE,
  type YouTubeExternalClient,
} from "../src/modules/youtube/youtube.types.js";

const secret = "test-publication-secret";

function createScopeFixture(input: {
  exchangeScope: string;
  refreshScope?: string;
  channels?: Array<{ id: string; title: string }>;
}) {
  const storageRoot = path.join(
    os.tmpdir(),
    `aralume-youtube-scope-${Date.now()}-${Math.random()}`,
  );
  mkdirSync(storageRoot, { recursive: true });
  const externalClient: YouTubeExternalClient = {
    async exchangeCode() {
      return {
        accessToken: "scope-access-token",
        refreshToken: "scope-refresh-token",
        expiresIn: 3600,
        scope: input.exchangeScope,
      };
    },
    async refreshAccessToken() {
      return {
        accessToken: "scope-refreshed-token",
        expiresIn: 3600,
        scope: input.refreshScope ?? input.exchangeScope,
      };
    },
    async revokeToken() {},
    async listChannels() {
      return input.channels ?? [];
    },
    async uploadVideo() {
      return { videoId: "scope-video" };
    },
  };
  const repository = createYouTubeRepository(undefined, storageRoot);
  const service = createYouTubeService({
    repository,
    dependencies: {
      channelsRepository: createChannelsRepository(channelDemoSeed),
      publicationsRepository: createPublicationsRepository(publicationDemoSeed, { storageRoot }),
      mediaAssetsRepository: createMediaAssetsRepository(mediaAssetsDemoSeed, { storageRoot }),
      governanceRepository: createGovernanceRepository(governanceDemoSeed),
      auditRepository: createAuditRepository(undefined, { storageRoot }),
      costsService: {
        evaluateOperationalAction: () => ({
          allowed: true,
          decisionCode: "ALLOWED",
          reason: "Allowed",
        }),
      } as never,
    },
    externalClient,
    clientId: "client-id",
    clientSecret: "client-secret",
    redirectUri: "http://localhost/api/integrations/youtube/oauth/callback",
    tokenSecret: secret,
    storageRoot,
    clock: () => new Date("2026-07-14T00:00:00.000Z"),
  });
  return { repository, service, storageRoot };
}

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

test("YouTube requires both approved scopes and blocks legacy or partial tokens", async () => {
  const fixture = createScopeFixture({
    exchangeScope: YOUTUBE_UPLOAD_SCOPE,
    refreshScope: YOUTUBE_UPLOAD_SCOPE,
    channels: [{ id: "yt-a", title: "Canal A" }],
  });
  const start = fixture.service.startOAuth("ch_historia");
  const scope = new URL(start.authorizationUrl).searchParams.get("scope")?.split(/\s+/).sort();
  assert.deepEqual(scope, [...YOUTUBE_REQUIRED_SCOPES].sort());
  const state = new URL(start.authorizationUrl).searchParams.get("state")!;
  const partial = await fixture.service.handleCallback({ code: "code", state });
  assert.equal(partial.status, "reauthorization_required");
  assert.equal(fixture.repository.getConnection("ch_historia")?.token, undefined);
  await assert.rejects(
    fixture.service.listChannels("ch_historia"),
    (error: { code?: string }) => error.code === "UNAUTHORIZED",
  );

  fixture.repository.upsertConnection({
    channelId: "ch_historia",
    status: "connected",
    token: encryptToken("legacy-access-token", secret),
    refreshToken: encryptToken("legacy-refresh-token", secret),
    grantedScopes: [YOUTUBE_UPLOAD_SCOPE],
  });
  assert.equal(fixture.service.getConnection("ch_historia").status, "reauthorization_required");
  assert.equal(
    fixture.service.getReadiness("ch_historia").reasons.includes("youtube_insufficient_scope"),
    true,
  );
  await assert.rejects(
    fixture.service.listChannels("ch_historia"),
    (error: { code?: string }) => error.code === "FORBIDDEN",
  );
  fixture.repository.upsertConnection({
    channelId: "ch_historia",
    status: "connected",
    token: encryptToken("expired-access-token", secret),
    refreshToken: encryptToken("legacy-refresh-token", secret),
    accessTokenExpiresAt: "2020-01-01T00:00:00.000Z",
    grantedScopes: [...YOUTUBE_REQUIRED_SCOPES],
  });
  await assert.rejects(
    fixture.service.listChannels("ch_historia"),
    (error: { code?: string }) => error.code === "FORBIDDEN",
  );
  assert.equal(fixture.service.getConnection("ch_historia").status, "reauthorization_required");
  assert.equal(
    JSON.stringify(fixture.service.getConnection("ch_historia")).includes("legacy-access-token"),
    false,
  );
  rmSync(fixture.storageRoot, { recursive: true, force: true });
});

test("YouTube channel discovery is server-side and empty or invalid destinations remain blocked", async () => {
  const fixture = createScopeFixture({ exchangeScope: YOUTUBE_REQUIRED_SCOPES.join(" ") });
  const start = fixture.service.startOAuth("ch_historia");
  const state = new URL(start.authorizationUrl).searchParams.get("state")!;
  assert.equal((await fixture.service.handleCallback({ code: "code", state })).status, "connected");
  assert.deepEqual(await fixture.service.listChannels("ch_historia"), []);
  assert.deepEqual(fixture.service.getReadiness("ch_historia").reasons, [
    "youtube_channel_not_selected",
  ]);
  await assert.rejects(fixture.service.selectChannel("ch_historia", "yt-missing"));
  rmSync(fixture.storageRoot, { recursive: true, force: true });
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
  let uploadCalls = 0;
  let grantedScope = YOUTUBE_REQUIRED_SCOPES.join(" ");
  let releaseUpload!: () => void;
  let uploadStartedResolve!: () => void;
  const uploadStarted = new Promise<void>((resolve) => {
    uploadStartedResolve = resolve;
  });
  const uploadRelease = new Promise<void>((resolve) => {
    releaseUpload = resolve;
  });
  const externalClient: YouTubeExternalClient = {
    async exchangeCode() {
      calls.push("exchange");
      return {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 3600,
        scope: grantedScope,
      };
    },
    async refreshAccessToken() {
      calls.push("refresh");
      return {
        accessToken: "refreshed-token",
        expiresIn: 3600,
        scope: grantedScope,
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
      uploadCalls += 1;
      uploadStartedResolve();
      await uploadRelease;
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
  const deniedStart = service.startOAuth("ch_historia");
  const deniedState = new URL(deniedStart.authorizationUrl).searchParams.get("state")!;
  const denied = await service.handleCallback({ state: deniedState, error: "refresh-token-value" });
  assert.equal(denied.lastErrorCode, "OAUTH_PROVIDER_DENIED");
  assert.equal(JSON.stringify(denied).includes("refresh-token-value"), false);
  const started = service.startOAuth("ch_historia");
  assert.deepEqual(
    new URL(started.authorizationUrl).searchParams.get("scope")?.split(/\s+/).sort(),
    [...YOUTUBE_REQUIRED_SCOPES].sort(),
  );
  grantedScope = YOUTUBE_UPLOAD_SCOPE;
  const insufficientState = new URL(
    service.startOAuth("ch_historia").authorizationUrl,
  ).searchParams.get("state")!;
  const insufficient = await service.handleCallback({ code: "code", state: insufficientState });
  assert.equal(insufficient.status, "reauthorization_required");
  assert.equal(insufficient.reauthorizationRequired, true);
  assert.equal(insufficient.scopesSufficient, false);
  assert.deepEqual(insufficient.grantedScopes, [YOUTUBE_UPLOAD_SCOPE]);
  assert.deepEqual(service.getReadiness("ch_historia").reasons, [
    "youtube_insufficient_scope",
    "youtube_reauthorization_required",
  ]);
  grantedScope = YOUTUBE_REQUIRED_SCOPES.join(" ");
  const reauthorizationState = new URL(
    service.startOAuth("ch_historia").authorizationUrl,
  ).searchParams.get("state")!;
  assert.equal(
    (await service.handleCallback({ code: "code", state: reauthorizationState })).status,
    "connected",
  );
  assert.equal((await service.listChannels("ch_historia")).length, 2);
  assert.equal((await service.selectChannel("ch_historia", "yt-a")).youtubeChannelId, "yt-a");
  assert.equal(service.getConnection("ch_curiosidades").status, "disconnected");
  const firstUpload = service.uploadPublication({
    publicationJobId: "pj_historia_01",
    channelId: "ch_historia",
    requestedBy: "Ana Ribeiro",
  });
  await uploadStarted;
  await assert.rejects(
    service.uploadPublication({
      publicationJobId: "pj_historia_01",
      channelId: "ch_historia",
      requestedBy: "Ana Ribeiro",
    }),
    (error: { code?: string }) => error.code === "CONFLICT",
  );
  releaseUpload();
  const result = await firstUpload;
  assert.equal(uploadCalls, 1);
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
