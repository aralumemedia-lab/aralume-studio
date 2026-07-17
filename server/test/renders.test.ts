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
import { RenderEngineError } from "../src/modules/renders/renders.engine.js";
import { createRenderJobsRepository } from "../src/modules/renders/renders.repository.js";
import { createRendersService } from "../src/modules/renders/renders.service.js";
import { renderJobsDemoSeed } from "../src/modules/renders/renders.seed.js";
import { AppError } from "../src/http/errors.js";
import type { CostSeed } from "../src/modules/costs/costs.types.js";
import type { MediaAssetBase } from "../src/modules/media-assets/media-assets.types.js";
import type { RenderEngine, RenderJob } from "../src/modules/renders/renders.types.js";

const baseTime = Date.parse("2026-07-13T03:30:00.000Z");

test("render service creates a controlled job, registers the output video and records transitions", async () => {
  const harness = createRenderHarness(createRecordingEngine());

  try {
    const created = await harness.service.createRenderJob({
      channelId: "ch_historia",
      inputAssetIds: ["ma_hist_narration_01", "ma_hist_image_01"],
      renderType: "controlled_video",
      renderProfile: "controlled_demo_short_v1",
      idempotencyKey: "render:ch_historia:valid-001",
      contentId: "idea_02",
      workflowRunId: "wf_idea_02",
    });

    assert.equal(created.status, "completed");
    assert.equal(created.channelId, "ch_historia");
    assert.equal(created.renderType, "controlled_video");
    assert.equal(created.inputAssetIds.length, 2);
    assert.ok(created.outputAssetId);
    assert.ok(created.outputStoragePath);
    assert.ok(created.completedAt);
    assert.ok(typeof created.durationSeconds === "number" && created.durationSeconds > 0);
    assert.equal(harness.engineCalls, 1);
    assert.equal(harness.seenRunningState, true);

    const outputAsset = harness.mediaAssetsRepository.getVideoAsset(created.outputAssetId!);
    assert.ok(outputAsset);
    assert.equal(outputAsset?.channelId, "ch_historia");
    assert.equal(outputAsset?.renderStatus, "rendered");
    assert.equal(outputAsset?.contentId, "idea_02");
    assert.equal(outputAsset?.storagePath?.startsWith("ch_historia/video/rendered/"), true);

    const outputResolution = resolveAbsoluteStoragePath(
      harness.storageRoot,
      outputAsset!.storagePath!,
    );
    assert.ok(existsSync(outputResolution.absolutePath));
    assert.ok(outputAsset?.sizeBytes && outputAsset.sizeBytes > 0);
    assert.ok(outputAsset?.checksum && outputAsset.checksum.length === 64);

    const channelJobs = harness.service.listRenderJobs({ channelId: "ch_historia" });
    assert.ok(channelJobs.every((job) => job.channelId === "ch_historia"));
    assert.ok(channelJobs.some((job) => job.id === created.id));
    assert.throws(
      () => harness.service.getRenderJob("ch_curiosidades", created.id),
      (error) => error instanceof AppError && error.status === 404,
    );

    const auditActions = harness.auditRepository
      .listAuditLogs({ channelId: "ch_historia" })
      .map((entry) => entry.action);
    assert.ok(auditActions.includes("render.request_received"));
    assert.ok(auditActions.includes("render.job_created"));
    assert.ok(auditActions.includes("render.execution_started"));
    assert.ok(auditActions.includes("render.output_asset_registered"));
    assert.ok(auditActions.includes("render.execution_completed"));

    const costEntries = harness.costsRepository.listCostEntries({ channelId: "ch_historia" });
    assert.ok(costEntries.some((entry) => entry.costType === "render"));
  } finally {
    harness.cleanup();
  }
});

test("render service blocks invalid inputs, channel mismatches and storage traversal", async () => {
  const harness = createRenderHarness(createRecordingEngine());

  try {
    const inactiveAsset = cloneAsset(
      harness.mediaAssetsRepository.getMediaAsset("ma_hist_narration_01")!,
      {
        id: "ma_hist_narration_blocked",
        status: "blocked",
        storagePath: "ch_historia/audio/ma_hist_narration_blocked.wav",
      },
    );
    const absoluteAsset = cloneAsset(
      harness.mediaAssetsRepository.getMediaAsset("ma_hist_image_01")!,
      {
        id: "ma_hist_image_absolute",
        storagePath: "/tmp/escape.png",
      },
    );
    const traversalAsset = cloneAsset(
      harness.mediaAssetsRepository.getMediaAsset("ma_hist_image_01")!,
      {
        id: "ma_hist_image_traversal",
        storagePath: "../escape.png",
      },
    );
    const encodedTraversalAsset = cloneAsset(
      harness.mediaAssetsRepository.getMediaAsset("ma_hist_image_01")!,
      {
        id: "ma_hist_image_encoded",
        storagePath: "ch_historia/image/%2e%2e/escape.png",
      },
    );

    harness.mediaAssetsRepository.upsertMediaAsset(inactiveAsset);
    harness.mediaAssetsRepository.upsertMediaAsset(absoluteAsset);
    harness.mediaAssetsRepository.upsertMediaAsset(traversalAsset);
    harness.mediaAssetsRepository.upsertMediaAsset(encodedTraversalAsset);

    const cases: Array<{
      name: string;
      inputAssetIds: string[];
      expectedStatus: "blocked";
      expectedCode: string;
    }> = [
      {
        name: "missing asset",
        inputAssetIds: ["ma_missing"],
        expectedStatus: "blocked",
        expectedCode: "NOT_FOUND",
      },
      {
        name: "inactive asset",
        inputAssetIds: ["ma_hist_narration_blocked"],
        expectedStatus: "blocked",
        expectedCode: "OPERATION_BLOCKED",
      },
      {
        name: "cross channel asset",
        inputAssetIds: ["ma_curio_video_01"],
        expectedStatus: "blocked",
        expectedCode: "NOT_FOUND",
      },
      {
        name: "absolute path",
        inputAssetIds: ["ma_hist_image_absolute"],
        expectedStatus: "blocked",
        expectedCode: "VALIDATION_ERROR",
      },
      {
        name: "traversal path",
        inputAssetIds: ["ma_hist_image_traversal"],
        expectedStatus: "blocked",
        expectedCode: "VALIDATION_ERROR",
      },
      {
        name: "encoded traversal",
        inputAssetIds: ["ma_hist_image_encoded"],
        expectedStatus: "blocked",
        expectedCode: "VALIDATION_ERROR",
      },
    ];

    for (const [index, scenario] of cases.entries()) {
      const result = await harness.service.createRenderJob({
        channelId: "ch_historia",
        inputAssetIds: scenario.inputAssetIds,
        renderType: "controlled_video",
        renderProfile: "controlled_demo_short_v1",
        idempotencyKey: `render:ch_historia:blocked-${index}`,
      });

      assert.equal(result.status, scenario.expectedStatus, scenario.name);
      assert.equal(result.errorCode, scenario.expectedCode, scenario.name);
      assert.ok(result.completedAt, scenario.name);
      assert.equal(result.outputAssetId, undefined, scenario.name);
    }
  } finally {
    harness.cleanup();
  }
});

test("render service normalizes timeout, process failure and unavailable engine states", async () => {
  const timeoutHarness = createRenderHarness(createThrowingEngine("timeout"));
  const failureHarness = createRenderHarness(createThrowingEngine("process_failed"));
  const unavailableHarness = createRenderHarness(createThrowingEngine("unavailable"));

  try {
    const timeoutJob = await timeoutHarness.service.createRenderJob({
      channelId: "ch_historia",
      inputAssetIds: ["ma_hist_narration_01"],
      renderType: "controlled_video",
      renderProfile: "controlled_demo_short_v1",
      idempotencyKey: "render:timeout",
    });
    assert.equal(timeoutJob.status, "failed");
    assert.equal(timeoutJob.errorCode, "TIMEOUT");
    assert.ok(timeoutJob.completedAt);
    assert.ok(timeoutJob.durationSeconds !== undefined);

    const failureJob = await failureHarness.service.createRenderJob({
      channelId: "ch_historia",
      inputAssetIds: ["ma_hist_narration_01"],
      renderType: "controlled_video",
      renderProfile: "controlled_demo_short_v1",
      idempotencyKey: "render:failure",
    });
    assert.equal(failureJob.status, "failed");
    assert.equal(failureJob.errorCode, "PROCESS_FAILED");
    assert.ok(failureJob.completedAt);

    const unavailableJob = await unavailableHarness.service.createRenderJob({
      channelId: "ch_historia",
      inputAssetIds: ["ma_hist_narration_01"],
      renderType: "controlled_video",
      renderProfile: "controlled_demo_short_v1",
      idempotencyKey: "render:unavailable",
    });
    assert.equal(unavailableJob.status, "blocked");
    assert.equal(unavailableJob.errorCode, "FFMPEG_UNAVAILABLE");
    assert.ok(unavailableJob.completedAt);
  } finally {
    timeoutHarness.cleanup();
    failureHarness.cleanup();
    unavailableHarness.cleanup();
  }
});

test("render service deduplicates idempotent requests and keeps listings channel-scoped", async () => {
  const harness = createRenderHarness(createRecordingEngine());

  try {
    const input = {
      channelId: "ch_historia" as const,
      inputAssetIds: ["ma_hist_narration_01", "ma_hist_image_01"],
      renderType: "controlled_video" as const,
      renderProfile: "controlled_demo_short_v1" as const,
      idempotencyKey: "render:ch_historia:idem-001",
      contentId: "idea_02",
      workflowRunId: "wf_idea_02",
    };

    const first = await harness.service.createRenderJob(input);
    const second = await harness.service.createRenderJob(input);

    assert.equal(first.id, second.id);
    assert.equal(harness.engineCalls, 1);
    assert.equal(
      harness.mediaAssetsRepository.listVideoAssets({ channelId: "ch_historia" }).length >= 1,
      true,
    );
    assert.ok(
      harness.service
        .listRenderJobs({ channelId: "ch_curiosidades" })
        .every((job) => job.channelId === "ch_curiosidades"),
    );
  } finally {
    harness.cleanup();
  }
});

test("render job and output video survive a repository restart", async () => {
  const storageRoot = mkdtempSync(path.join(os.tmpdir(), "aralume-render-restart-"));
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

  try {
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
        clock: createClock(),
        idFactory: () => "persist-001",
        storageRoot,
        engine: createRecordingEngine(),
      },
    );

    const created = await service.createRenderJob({
      channelId: "ch_historia",
      inputAssetIds: ["ma_hist_narration_01", "ma_hist_image_01"],
      renderType: "controlled_video",
      renderProfile: "controlled_demo_short_v1",
      idempotencyKey: "render:persist:001",
      contentId: "idea_02",
      workflowRunId: "wf_idea_02",
    });

    const reloadedRenderJobsRepository = createRenderJobsRepository(undefined, {
      storageRoot,
    });
    const reloadedMediaAssetsRepository = createMediaAssetsRepository(undefined, {
      storageRoot,
    });
    const reloadedCostsRepository = createCostsRepository(undefined, {
      storageRoot,
    });
    const reloadedAuditRepository = createAuditRepository(undefined, {
      storageRoot,
    });

    assert.ok(reloadedRenderJobsRepository.getRenderJob(created.id));
    assert.ok(reloadedMediaAssetsRepository.getVideoAsset(created.outputAssetId!));
    assert.ok(
      reloadedCostsRepository
        .listCostEntries({ channelId: "ch_historia", costType: "render" })
        .some((entry) => entry.description.includes(created.id)),
    );
    assert.ok(
      reloadedAuditRepository
        .listAuditLogs({ channelId: "ch_historia", entityId: created.id })
        .some((entry) => entry.action === "render.execution_completed"),
    );
  } finally {
    rmSync(storageRoot, { recursive: true, force: true });
  }
});

test("render HTTP routes create a real job and surface the rendered video for the active channel", async () => {
  const ffmpegPath = resolveFfmpegPath();
  if (!ffmpegPath) {
    return;
  }

  const harness = createHttpHarness(ffmpegPath);
  const app = createApp({
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
    const createResponse = await fetch(`${baseUrl}/api/renders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: "ch_historia",
        inputAssetIds: ["ma_hist_narration_01", "ma_hist_image_01"],
        renderType: "controlled_video",
        renderProfile: "controlled_demo_short_v1",
        idempotencyKey: "render:http:001",
        contentId: "idea_02",
        workflowRunId: "wf_idea_02",
      }),
    });

    const createdPayload = (await createResponse.json()) as {
      data: RenderJob;
      meta: { requestId: string };
    };
    assert.equal(createResponse.status, 201);
    assert.equal(createdPayload.data.status, "completed");
    assert.ok(createdPayload.data.outputAssetId);
    assert.ok(
      harness.auditRepository
        .listAuditLogs({ channelId: "ch_historia", entityId: createdPayload.data.id })
        .some(
          (entry) =>
            entry.action === "render.execution_completed" &&
            entry.requestId === createdPayload.meta.requestId,
        ),
    );

    const listResponse = await fetch(`${baseUrl}/api/renders?channelId=ch_historia`);
    const listPayload = (await listResponse.json()) as {
      data: RenderJob[];
    };
    assert.equal(listResponse.status, 200);
    assert.ok(listPayload.data.every((job) => job.channelId === "ch_historia"));

    const videosResponse = await fetch(`${baseUrl}/api/videos?channelId=ch_historia`);
    const videosPayload = (await videosResponse.json()) as {
      data: Array<{ id: string; channelId: string; storagePath?: string; renderStatus: string }>;
    };
    assert.equal(videosResponse.status, 200);
    assert.ok(videosPayload.data.some((video) => video.id === createdPayload.data.outputAssetId));
    assert.ok(videosPayload.data.every((video) => video.channelId === "ch_historia"));

    const outputAsset = harness.mediaAssetsRepository.getVideoAsset(
      createdPayload.data.outputAssetId!,
    );
    assert.ok(outputAsset);
    const outputResolution = resolveAbsoluteStoragePath(
      harness.storageRoot,
      outputAsset!.storagePath!,
    );
    assert.ok(existsSync(outputResolution.absolutePath));
  } finally {
    await stopServer(server);
    harness.cleanup();
  }
});

function createRenderHarness(engine: RenderEngine) {
  const storageRoot = mkdtempSync(path.join(os.tmpdir(), "aralume-render-"));
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
  let seenRunningState = false;

  costsRepository.upsertOperationalModePolicy(
    allowedVideoPolicy(clock.peek().toISOString(), "op_ch_historia"),
  );

  const wrappedEngine: RenderEngine = async (input) => {
    seenRunningState = input.job.status === "running";
    const result = await engine(input);
    return result;
  };

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
      engine: wrappedEngine,
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
    get seenRunningState() {
      return seenRunningState;
    },
    cleanup() {
      rmSync(storageRoot, { recursive: true, force: true });
    },
  };
}

function createHttpHarness(ffmpegPath: string) {
  const storageRoot = mkdtempSync(path.join(os.tmpdir(), "aralume-render-http-"));
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

function createThrowingEngine(kind: "timeout" | "process_failed" | "unavailable"): RenderEngine {
  return async () => {
    throw new RenderEngineError(
      kind,
      kind === "timeout"
        ? "FFmpeg execution timed out."
        : kind === "unavailable"
          ? "FFmpeg is not available."
          : "FFmpeg exited with a non-zero code.",
    );
  };
}

function cloneAsset(asset: MediaAssetBase, patch: Partial<MediaAssetBase>): MediaAssetBase {
  return {
    ...structuredClone(asset),
    ...patch,
  };
}

function seedDemoStorage(storageRoot: string) {
  writeSeedFile(storageRoot, "ch_historia/narration/ma_hist_narration_01.wav", "narration");
  writeSeedFile(storageRoot, "ch_historia/image/ma_hist_image_01.jpg", "image");
  writeSeedFile(storageRoot, "ch_curiosidades/video/ma_curio_video_01.mp4", "video");
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
    server.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

let engineCallCounter = 0;
