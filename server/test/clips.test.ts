import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import test from "node:test";

import { createApp } from "../src/app.js";
import { createAuditRepository } from "../src/modules/audit/audit.repository.js";
import { createChannelsRepository } from "../src/modules/channels/channel.repository.js";
import { channelDemoSeed } from "../src/modules/channels/channel.seed.js";
import { createCostsRepository } from "../src/modules/costs/costs.repository.js";
import { createCostsService } from "../src/modules/costs/costs.service.js";
import { createEditorialRepository } from "../src/modules/editorial/editorial.repository.js";
import { editorialDemoSeed } from "../src/modules/editorial/editorial.seed.js";
import { createMediaAssetsRepository } from "../src/modules/media-assets/media-assets.repository.js";
import { mediaAssetsDemoSeed } from "../src/modules/media-assets/media-assets.seed.js";
import { resolveAbsoluteStoragePath } from "../src/modules/media-assets/media-assets.storage.js";
import type { MediaAssetBase, VideoAsset } from "../src/modules/media-assets/media-assets.types.js";
import { createRenderJobsRepository } from "../src/modules/renders/renders.repository.js";
import { createRendersService } from "../src/modules/renders/renders.service.js";
import { renderJobsDemoSeed } from "../src/modules/renders/renders.seed.js";
import { AppError } from "../src/http/errors.js";
import type { CostSeed } from "../src/modules/costs/costs.types.js";
import type { RenderEngine, RenderJob } from "../src/modules/renders/renders.types.js";

const baseTime = Date.parse("2026-07-13T03:30:00.000Z");

test("derived clip service creates, persists and deduplicates controlled clips", async () => {
  const harness = createClipHarness(createRecordingEngine());

  try {
    const input = {
      channelId: "ch_historia" as const,
      inputAssetIds: [] as string[],
      renderType: "controlled_clip" as const,
      renderProfile: "controlled_demo_clip_segment_v1" as const,
      idempotencyKey: "clip:ch_historia:001",
      parentVideoId: "vd_historia_01",
      startSeconds: 12,
      endSeconds: 57,
      targetPlatform: "youtube_shorts" as const,
    };

    const created = await harness.service.createRenderJob(input);
    const replay = await harness.service.createRenderJob(input);

    assert.equal(created.id, replay.id);
    assert.equal(created.status, "completed");
    assert.equal(created.outputAssetId, replay.outputAssetId);
    assert.ok(created.outputAssetId);
    assert.equal(harness.engineCalls, 1);

    const clip = harness.mediaAssetsRepository.getDerivedClip(created.outputAssetId!);
    assert.ok(clip);
    assert.equal(clip?.channelId, "ch_historia");
    assert.equal(clip?.parentVideoId, "vd_historia_01");
    assert.equal(clip?.renderJobId, created.id);
    assert.equal(clip?.status, "completed");
    assert.equal(clip?.startSeconds, 12);
    assert.equal(clip?.endSeconds, 57);
    assert.equal(clip?.durationSeconds, 2);
    assert.equal(clip?.storagePath?.startsWith("ch_historia/clip/rendered/"), true);

    const clipResolution = resolveAbsoluteStoragePath(harness.storageRoot, clip!.storagePath!);
    assert.ok(existsSync(clipResolution.absolutePath));

    const persistedClip = createMediaAssetsRepository(undefined, {
      storageRoot: harness.storageRoot,
    }).getDerivedClip(created.outputAssetId!);
    assert.ok(persistedClip);

    const clipCosts = harness.costsRepository.listCostEntries({
      channelId: "ch_historia",
      stage: "clips",
    });
    assert.equal(clipCosts.length, 1);
    assert.equal(clipCosts[0].description.includes(created.id), true);

    const clipAuditActions = harness.auditRepository
      .listAuditLogs({ channelId: "ch_historia", entityId: created.id })
      .map((entry) => entry.action);
    assert.ok(clipAuditActions.includes("clip.execution_completed"));
  } finally {
    harness.cleanup();
  }
});

test("derived clip service rejects invalid intervals, channel mismatches and storage violations", async () => {
  const harness = createClipHarness(createRecordingEngine());

  try {
    const absoluteParent = cloneVideo(
      harness.mediaAssetsRepository.getVideoAsset("vd_historia_01")!,
      { id: "vd_historia_absolute", storagePath: "/tmp/escape.mp4" },
    );
    const traversalParent = cloneVideo(
      harness.mediaAssetsRepository.getVideoAsset("vd_historia_01")!,
      { id: "vd_historia_traversal", storagePath: "../escape.mp4" },
    );
    const crossChannelParent = cloneVideo(
      harness.mediaAssetsRepository.getVideoAsset("vd_historia_01")!,
      { id: "vd_curio_cross", channelId: "ch_curiosidades" },
    );
    const missingFileParent = cloneVideo(
      harness.mediaAssetsRepository.getVideoAsset("vd_historia_01")!,
      { id: "vd_historia_missing", storagePath: "ch_historia/video/missing.mp4" },
    );

    harness.mediaAssetsRepository.upsertVideoAsset(absoluteParent);
    harness.mediaAssetsRepository.upsertVideoAsset(traversalParent);
    harness.mediaAssetsRepository.upsertVideoAsset(crossChannelParent);
    harness.mediaAssetsRepository.upsertVideoAsset(missingFileParent);

    const cases: Array<{
      name: string;
      input: Parameters<typeof harness.service.createRenderJob>[0];
      expectedStatus: number;
    }> = [
      {
        name: "negative start",
        input: {
          channelId: "ch_historia",
          inputAssetIds: [],
          renderType: "controlled_clip",
          renderProfile: "controlled_demo_clip_segment_v1",
          idempotencyKey: "clip:negative-start",
          parentVideoId: "vd_historia_01",
          startSeconds: -1,
          endSeconds: 10,
        },
        expectedStatus: 400,
      },
      {
        name: "end before start",
        input: {
          channelId: "ch_historia",
          inputAssetIds: [],
          renderType: "controlled_clip",
          renderProfile: "controlled_demo_clip_segment_v1",
          idempotencyKey: "clip:end-before-start",
          parentVideoId: "vd_historia_01",
          startSeconds: 10,
          endSeconds: 10,
        },
        expectedStatus: 400,
      },
      {
        name: "end beyond duration",
        input: {
          channelId: "ch_historia",
          inputAssetIds: [],
          renderType: "controlled_clip",
          renderProfile: "controlled_demo_clip_segment_v1",
          idempotencyKey: "clip:end-beyond",
          parentVideoId: "vd_historia_01",
          startSeconds: 10,
          endSeconds: 9999,
        },
        expectedStatus: 400,
      },
      {
        name: "cross channel video",
        input: {
          channelId: "ch_historia",
          inputAssetIds: [],
          renderType: "controlled_clip",
          renderProfile: "controlled_demo_clip_segment_v1",
          idempotencyKey: "clip:cross-channel",
          parentVideoId: "vd_curio_cross",
          startSeconds: 10,
          endSeconds: 25,
        },
        expectedStatus: 404,
      },
    ];

    for (const scenario of cases) {
      await assert.rejects(
        harness.service.createRenderJob(scenario.input),
        (error) => error instanceof AppError && error.status === scenario.expectedStatus,
        scenario.name,
      );
      assert.equal(
        harness.renderJobsRepository.findRenderJobByIdempotencyKey(
          scenario.input.channelId,
          scenario.input.idempotencyKey,
        ),
        undefined,
        `${scenario.name} must not leave a queued render job`,
      );
    }

    await assert.rejects(
      harness.service.createRenderJob({
        channelId: "ch_historia",
        inputAssetIds: [],
        renderType: "controlled_clip",
        renderProfile: "controlled_demo_clip_segment_v1",
        idempotencyKey: "clip:absolute",
        parentVideoId: "vd_historia_absolute",
        startSeconds: 10,
        endSeconds: 25,
      }),
      (error) => error instanceof AppError && error.status === 400,
    );

    await assert.rejects(
      harness.service.createRenderJob({
        channelId: "ch_historia",
        inputAssetIds: [],
        renderType: "controlled_clip",
        renderProfile: "controlled_demo_clip_segment_v1",
        idempotencyKey: "clip:traversal",
        parentVideoId: "vd_historia_traversal",
        startSeconds: 10,
        endSeconds: 25,
      }),
      (error) => error instanceof AppError && error.status === 400,
    );

    const missingFileResult = await harness.service.createRenderJob({
      channelId: "ch_historia",
      inputAssetIds: [],
      renderType: "controlled_clip",
      renderProfile: "controlled_demo_clip_segment_v1",
      idempotencyKey: "clip:missing-file",
      parentVideoId: "vd_historia_missing",
      startSeconds: 10,
      endSeconds: 25,
    });
    assert.equal(missingFileResult.status, "blocked");
    assert.equal(missingFileResult.errorCode, "SOURCE_MISSING");
    assert.equal(harness.engineCalls, 0);
  } finally {
    harness.cleanup();
  }
});

test("derived clip service survives restart with parent linkage, job, cost and audit", async () => {
  const harness = createClipHarness(createRecordingEngine());

  try {
    const created = await harness.service.createRenderJob({
      channelId: "ch_historia",
      inputAssetIds: [],
      renderType: "controlled_clip",
      renderProfile: "controlled_demo_clip_segment_v1",
      idempotencyKey: "clip:persist:001",
      parentVideoId: "vd_historia_01",
      startSeconds: 12,
      endSeconds: 57,
      targetPlatform: "youtube_shorts",
    });

    const reloadedRenderJobsRepository = createRenderJobsRepository(undefined, {
      storageRoot: harness.storageRoot,
    });
    const reloadedMediaAssetsRepository = createMediaAssetsRepository(undefined, {
      storageRoot: harness.storageRoot,
    });
    const reloadedCostsRepository = createCostsRepository(undefined, {
      storageRoot: harness.storageRoot,
    });
    const reloadedAuditRepository = createAuditRepository(undefined, {
      storageRoot: harness.storageRoot,
    });

    assert.ok(reloadedRenderJobsRepository.getRenderJob(created.id));
    assert.ok(reloadedMediaAssetsRepository.getDerivedClip(created.outputAssetId!));
    assert.ok(
      reloadedCostsRepository
        .listCostEntries({ channelId: "ch_historia", stage: "clips" })
        .some((entry) => entry.description.includes(created.id)),
    );
    assert.ok(
      reloadedAuditRepository
        .listAuditLogs({ channelId: "ch_historia", entityId: created.id })
        .some((entry) => entry.action === "clip.execution_completed"),
    );
  } finally {
    harness.cleanup();
  }
});

test("derived clip HTTP routes create a real clip and survive a repository restart", async () => {
  const ffmpegPath = resolveFfmpegPath();
  if (!ffmpegPath) {
    return;
  }

  const harness = createHttpHarness(ffmpegPath);
  const app = createApp({
    authTestBypass: true,
    env: {
      ARALUME_ENV: "test",
      ARALUME_LOG_LEVEL: "info",
      ARALUME_ASSET_STORAGE_ROOT: harness.storageRoot,
    },
    logger: {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
    channelsRepository: harness.channelsRepository,
    editorialRepository: harness.editorialRepository,
    mediaAssetsRepository: harness.mediaAssetsRepository,
    renderJobsRepository: harness.renderJobsRepository,
    costsRepository: harness.costsRepository,
    auditRepository: harness.auditRepository,
    ffmpegPath,
  });

  const server = app.listen(0);
  await once(server, "listening");

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected TCP address");
  }

  const baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;

  try {
    const renderResponse = await fetch(`${baseUrl}/api/renders`, {
      method: "POST",
      headers: { "content-type": "application/json", connection: "close" },
      body: JSON.stringify({
        channelId: "ch_historia",
        inputAssetIds: ["ma_hist_narration_01", "ma_hist_image_01"],
        renderType: "controlled_video",
        renderProfile: "controlled_demo_short_v1",
        idempotencyKey: "clip:http:render:001",
        contentId: "idea_02",
        workflowRunId: "wf_idea_02",
      }),
    });

    const renderedPayload = (await renderResponse.json()) as { data: RenderJob };
    assert.equal(renderResponse.status, 201);
    assert.equal(renderedPayload.data.status, "completed");
    assert.ok(renderedPayload.data.outputAssetId);

    const concludedParentVideo = harness.mediaAssetsRepository.getVideoAsset("vd_historia_01");
    assert.ok(concludedParentVideo);
    harness.mediaAssetsRepository.upsertVideoAsset({
      ...concludedParentVideo!,
      status: "editing",
      complianceStatus: "pending",
      qualityStatus: "pending",
      storagePath: renderedPayload.data.outputStoragePath,
      sizeBytes: renderedPayload.data.outputSizeBytes,
      checksum: renderedPayload.data.outputChecksum,
      checksumAlgorithm: "sha256",
      durationSeconds: renderedPayload.data.durationSeconds,
    });

    const clipResponse = await fetch(`${baseUrl}/api/clips`, {
      method: "POST",
      headers: { "content-type": "application/json", connection: "close" },
      body: JSON.stringify({
        channelId: "ch_historia",
        parentVideoId: "vd_historia_01",
        startSeconds: 0,
        endSeconds: 1,
        idempotencyKey: "clip:http:001",
        targetPlatform: "youtube_shorts",
        title: "Clip HTTP",
      }),
    });

    const clipPayload = (await clipResponse.json()) as {
      data: {
        id: string;
        parentVideoId: string;
        renderJobId: string;
        status: string;
        storagePath?: string;
      };
      meta: { requestId: string };
    };

    assert.equal(clipResponse.status, 201);
    assert.equal(clipPayload.data.status, "completed");
    assert.equal(clipPayload.data.parentVideoId, "vd_historia_01");
    assert.ok(clipPayload.data.storagePath);
    assert.ok(
      harness.auditRepository
        .listAuditLogs({ channelId: "ch_historia", entityId: clipPayload.data.renderJobId })
        .some(
          (entry) =>
            entry.action === "clip.execution_completed" &&
            entry.requestId === clipPayload.meta.requestId,
        ),
    );

    const clipFileResponse = await fetch(
      `${baseUrl}/api/clips/${clipPayload.data.id}/file?channelId=ch_historia`,
      {
        headers: { connection: "close" },
      },
    );
    assert.equal(clipFileResponse.status, 200);
    await clipFileResponse.arrayBuffer();

    const removedClipPath = path.join(harness.storageRoot, clipPayload.data.storagePath!);
    rmSync(removedClipPath, { force: true });
    const missingClipFileResponse = await fetch(
      `${baseUrl}/api/clips/${clipPayload.data.id}/file?channelId=ch_historia`,
      {
        headers: { connection: "close" },
      },
    );
    assert.equal(missingClipFileResponse.status, 404);

    const reloadedApp = createApp({
      authTestBypass: true,
      env: {
        ARALUME_ENV: "test",
        ARALUME_LOG_LEVEL: "info",
        ARALUME_ASSET_STORAGE_ROOT: harness.storageRoot,
      },
      logger: {
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
      },
      ffmpegPath,
    });

    const reloadedServer = reloadedApp.listen(0);
    await once(reloadedServer, "listening");
    const reloadedAddress = reloadedServer.address();
    if (!reloadedAddress || typeof reloadedAddress === "string") {
      throw new Error("Expected TCP address");
    }

    const reloadedBaseUrl = `http://127.0.0.1:${(reloadedAddress as AddressInfo).port}`;
    const reloadedClipResponse = await fetch(
      `${reloadedBaseUrl}/api/clips/${clipPayload.data.id}?channelId=ch_historia`,
      {
        headers: { connection: "close" },
      },
    );
    const reloadedClipPayload = (await reloadedClipResponse.json()) as {
      data: { id: string; parentVideoId: string; renderJobId: string };
    };
    assert.equal(reloadedClipResponse.status, 200);
    assert.equal(reloadedClipPayload.data.id, clipPayload.data.id);
    assert.equal(reloadedClipPayload.data.parentVideoId, "vd_historia_01");

    await stopServer(reloadedServer);
    await closeFetchPools();
  } finally {
    await stopServer(server);
    harness.cleanup();
  }
});

function createClipHarness(engine: RenderEngine) {
  const storageRoot = mkdtempSync(path.join(os.tmpdir(), "aralume-clips-"));
  seedDemoStorage(storageRoot);

  const channelsRepository = createChannelsRepository(channelDemoSeed);
  const editorialRepository = createEditorialRepository(editorialDemoSeed);
  const mediaAssetsRepository = createMediaAssetsRepository(mediaAssetsDemoSeed, {
    storageRoot,
  });
  const renderJobsRepository = createRenderJobsRepository(renderJobsDemoSeed, {
    storageRoot,
  });
  const costsRepository = createCostsRepository(createAllowedCostSeed(), {
    storageRoot,
  });
  const auditRepository = createAuditRepository(undefined, {
    storageRoot,
  });
  const costsService = createCostsService(costsRepository, {
    channelsRepository,
    auditRepository,
  });
  const clock = createClock();
  let nextId = 1;

  costsRepository.upsertOperationalModePolicy(
    allowedVideoPolicy(clock.peek().toISOString(), "op_ch_historia"),
  );

  const service = createRendersService(
    renderJobsRepository,
    {
      channelsRepository,
      editorialRepository,
      mediaAssetsRepository,
      costsService,
      auditRepository,
    },
    {
      clock,
      idFactory: () => String(nextId++).padStart(4, "0"),
      storageRoot,
      engine,
    },
  );

  return {
    storageRoot,
    channelsRepository,
    editorialRepository,
    mediaAssetsRepository,
    renderJobsRepository,
    costsRepository,
    auditRepository,
    service,
    get engineCalls() {
      return engineCallCounter;
    },
    cleanup() {
      rmSync(storageRoot, { recursive: true, force: true });
    },
  };
}

function createHttpHarness(ffmpegPath: string) {
  const storageRoot = mkdtempSync(path.join(os.tmpdir(), "aralume-clips-http-"));
  seedDemoStorage(storageRoot);
  const costsRepository = createCostsRepository(createAllowedCostSeed(), {
    storageRoot,
  });
  costsRepository.upsertOperationalModePolicy(
    allowedVideoPolicy(new Date(baseTime).toISOString(), "op_ch_historia"),
  );

  return {
    storageRoot,
    channelsRepository: createChannelsRepository(channelDemoSeed),
    editorialRepository: createEditorialRepository(editorialDemoSeed),
    mediaAssetsRepository: createMediaAssetsRepository(mediaAssetsDemoSeed, {
      storageRoot,
    }),
    renderJobsRepository: createRenderJobsRepository(renderJobsDemoSeed, {
      storageRoot,
    }),
    costsRepository,
    auditRepository: createAuditRepository(undefined, {
      storageRoot,
    }),
    ffmpegPath,
    cleanup() {
      rmSync(storageRoot, { recursive: true, force: true });
    },
  };
}

function createAllowedCostSeed(): CostSeed {
  const now = new Date(baseTime).toISOString();
  return {
    costEntries: [],
    operationalModePolicies: [allowedGlobalPolicy(now), allowedVideoPolicy(now, "op_ch_historia")],
  };
}

function allowedVideoPolicy(now: string, id: string) {
  return {
    id,
    scope: "channel" as const,
    channelId: "ch_historia",
    mode: "supervised_production" as const,
    allowRealAi: false,
    allowRealTts: false,
    allowRealImageGeneration: false,
    allowRealVideoGeneration: true,
    allowExternalPublication: false,
    requireHumanApproval: false,
    budgetConfigured: true,
    dailyBudgetLimitCents: 200000,
    monthlyBudgetLimitCents: 500000,
    createdAt: now,
    updatedAt: now,
  };
}

function allowedGlobalPolicy(now: string) {
  return {
    id: "op_global",
    scope: "global" as const,
    mode: "supervised_production" as const,
    allowRealAi: false,
    allowRealTts: false,
    allowRealImageGeneration: false,
    allowRealVideoGeneration: true,
    allowExternalPublication: false,
    requireHumanApproval: false,
    budgetConfigured: true,
    dailyBudgetLimitCents: 500000,
    monthlyBudgetLimitCents: 1000000,
    createdAt: now,
    updatedAt: now,
  };
}

function createClock() {
  let tick = 0;
  const clock = () => new Date(baseTime + tick++ * 1000);
  return Object.assign(clock, {
    peek() {
      return new Date(baseTime);
    },
  });
}

function createRecordingEngine(): RenderEngine {
  engineCallCounter = 0;
  return async (input) => {
    engineCallCounter += 1;
    const resolution = resolveAbsoluteStoragePath(input.storageRoot, input.tempOutputPath);
    mkdirSync(path.dirname(resolution.absolutePath), { recursive: true });
    const payload = Buffer.from(`rendered:${input.job.id}:${input.job.channelId}`);
    writeFileSync(resolution.absolutePath, payload);
    return {
      stdout: "ffmpeg stdout",
      stderr: "ffmpeg stderr",
      exitCode: 0,
      durationMilliseconds: 2400,
      outputSizeBytes: payload.byteLength,
      outputChecksum: createHash("sha256").update(payload).digest("hex"),
      technicalMetadata: {
        codec: "stub",
        container: "mp4",
        source: "test-engine",
      },
    };
  };
}

function cloneVideo(asset: VideoAsset, patch: Partial<VideoAsset>): VideoAsset {
  return {
    ...structuredClone(asset),
    ...patch,
  };
}

function seedDemoStorage(storageRoot: string) {
  writeSeedFile(storageRoot, "ch_historia/narration/ma_hist_narration_01.wav", "narration");
  writeSeedFile(storageRoot, "ch_historia/image/ma_hist_image_01.jpg", "image");
  writeSeedFile(storageRoot, "ch_curiosidades/video/ma_curio_video_01.mp4", "video");
  writeSeedFile(storageRoot, "ch_historia/video/vd_historia_01.mp4", "video");
}

function writeSeedFile(storageRoot: string, relativePath: string, contents: string) {
  const resolution = resolveAbsoluteStoragePath(storageRoot, relativePath);
  mkdirSync(path.dirname(resolution.absolutePath), { recursive: true });
  writeFileSync(resolution.absolutePath, contents);
}

function resolveFfmpegPath(): string | undefined {
  const candidates = new Set<string>();

  if (process.env.ARALUME_FFMPEG_PATH) {
    candidates.add(process.env.ARALUME_FFMPEG_PATH);
  }

  const command = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(command, ["ffmpeg"], { encoding: "utf8" });
  if (result.status === 0) {
    for (const line of result.stdout.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed) {
        candidates.add(trimmed);
      }
    }
  }

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      const packagesRoot = path.join(localAppData, "Microsoft", "WinGet", "Packages");
      const discovered = findFileRecursive(packagesRoot, "ffmpeg.exe");
      if (discovered) {
        candidates.add(discovered);
      }
    }
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function findFileRecursive(root: string, fileName: string): string | undefined {
  if (!existsSync(root)) {
    return undefined;
  }

  const entries = readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const candidate = path.join(root, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) {
      return candidate;
    }

    if (entry.isDirectory()) {
      const nested = findFileRecursive(candidate, fileName);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

function stopServer(server: Server): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    server.closeIdleConnections?.();
    server.closeAllConnections?.();
    server.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function closeFetchPools(): Promise<void> {
  try {
    const { getGlobalDispatcher } = await import("undici");
    await getGlobalDispatcher().close();
  } catch {
    // Ignore environments without an exposed undici dispatcher.
  }
}

let engineCallCounter = 0;
