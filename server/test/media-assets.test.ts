import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createApp } from "../src/app.js";
import { createAuditRepository } from "../src/modules/audit/audit.repository.js";
import { auditDemoSeed } from "../src/modules/audit/audit.seed.js";
import { createChannelsRepository } from "../src/modules/channels/channel.repository.js";
import { channelDemoSeed } from "../src/modules/channels/channel.seed.js";
import { createMediaAssetsRepository } from "../src/modules/media-assets/media-assets.repository.js";
import { mediaAssetsDemoSeed } from "../src/modules/media-assets/media-assets.seed.js";
import { createMediaAssetsService } from "../src/modules/media-assets/media-assets.service.js";
import { createEditorialRepository } from "../src/modules/editorial/editorial.repository.js";
import { editorialDemoSeed } from "../src/modules/editorial/editorial.seed.js";
import { AppError } from "../src/http/errors.js";

function createHarness() {
  const channelsRepository = createChannelsRepository(channelDemoSeed);
  const mediaAssetsRepository = createMediaAssetsRepository(mediaAssetsDemoSeed);
  const auditRepository = createAuditRepository(auditDemoSeed);
  let tick = 0;
  let nextId = 1;

  const service = createMediaAssetsService(
    mediaAssetsRepository,
    {
      channelsRepository,
      auditRepository,
    },
    {
      clock: () => new Date(Date.parse("2026-07-13T03:30:00.000Z") + tick++ * 1000),
      idFactory: () => String(nextId++).padStart(4, "0"),
      storageRoot: "C:/aralume/media-assets",
    },
  );

  return { channelsRepository, mediaAssetsRepository, auditRepository, service };
}

async function startServer() {
  const harness = createHarness();
  const app = createApp({
    env: {
      ARALUME_ENV: "test",
      ARALUME_LOG_LEVEL: "info",
    },
    logger: {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
    channelsRepository: harness.channelsRepository,
    mediaAssetsRepository: harness.mediaAssetsRepository,
    auditRepository: harness.auditRepository,
  });

  const server = app.listen(0);
  await once(server, "listening");

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected TCP address");
  }

  return {
    baseUrl: `http://127.0.0.1:${(address as AddressInfo).port}`,
    server,
    harness,
  };
}

async function stopServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

test("media assets service enforces storage safety, cross-channel isolation and integrity rules", () => {
  const harness = createHarness();

  const historiaAssets = harness.service.listMediaAssets({ channelId: "ch_historia" });
  assert.ok(historiaAssets.length > 0);
  assert.ok(historiaAssets.every((asset) => asset.channelId === "ch_historia"));

  const validation = harness.service.validateStorageReference({
    channelId: "ch_historia",
    type: "audio",
    storagePath: "ch_historia/audio/voice.wav",
  });
  assert.equal(validation.normalizedStoragePath, "ch_historia/audio/voice.wav");
  assert.equal(
    validation.internalUri,
    "aralume://media-assets/ch_historia/preview_ch_historia_audio_voice_wav",
  );

  assert.throws(
    () =>
      harness.service.validateStorageReference({
        channelId: "ch_historia",
        type: "audio",
        storagePath: "../escape.wav",
      }),
    (error) => error instanceof AppError && error.status === 400,
  );

  assert.throws(
    () =>
      harness.service.validateStorageReference({
        channelId: "ch_historia",
        type: "audio",
        storagePath: "ch_curiosidades/audio/voice.wav",
      }),
    (error) => error instanceof AppError && error.status === 400,
  );

  const created = harness.service.createMediaAsset({
    channelId: "ch_historia",
    type: "audio",
    category: "audio",
    name: "Fresh narration",
    title: "Fresh narration",
    description: "New narration asset",
    mimeType: "audio/wav",
    extension: "wav",
    sizeBytes: 1024,
    checksum: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    storagePath: "ch_historia/audio/fresh.wav",
    origin: "generated",
    provenance: "Created internally",
    licenseStatus: "confirmed",
    status: "available",
    riskLevel: "ok",
    costActualCents: 250,
    providerName: "Aralume TTS",
    modelName: "voice-v3",
  });

  assert.equal(created.channelId, "ch_historia");
  assert.match(created.internalUri, /^aralume:\/\/media-assets\/ch_historia\/ma_/);
  assert.equal(created.storagePath, "ch_historia/audio/fresh.wav");
  assert.equal(created.integrity?.checksumMatches, undefined);

  assert.throws(
    () => harness.service.getMediaAsset("ch_curiosidades", "ma_hist_narration_01"),
    (error) => error instanceof AppError && error.status === 404,
  );

  assert.throws(
    () =>
      harness.service.validateAssetIntegrity("ch_historia", "ma_hist_aux_01", {
        channelId: "ch_historia",
        checksum: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        sizeBytes: 1,
      }),
    (error) => error instanceof AppError && error.status === 409,
  );

  const corrupted = harness.mediaAssetsRepository.getMediaAsset("ma_hist_aux_01");
  assert.equal(corrupted?.status, "corrupted");
  assert.ok(harness.auditRepository.listAuditLogs({ channelId: "ch_historia" }).length > 0);
});

test("media assets HTTP routes keep channel context explicit and reject invalid storage paths", async () => {
  const { baseUrl, server } = await startServer();

  try {
    const listResponse = await fetch(`${baseUrl}/api/media-assets?channelId=ch_historia`);
    const listPayload = (await listResponse.json()) as {
      data: Array<{ channelId: string; internalUri?: string }>;
      meta: { requestId: string };
    };
    assert.equal(listResponse.status, 200);
    assert.ok(listPayload.data.length > 0);
    assert.ok(listPayload.data.every((asset) => asset.channelId === "ch_historia"));
    assert.ok(listPayload.meta.requestId.length > 0);

    const detailResponse = await fetch(
      `${baseUrl}/api/media-assets/ma_hist_narration_01?channelId=ch_historia`,
    );
    assert.equal(detailResponse.status, 200);

    const forbiddenResponse = await fetch(
      `${baseUrl}/api/media-assets/ma_hist_narration_01?channelId=ch_curiosidades`,
    );
    const forbiddenPayload = (await forbiddenResponse.json()) as {
      error: { code: string; message: string; details: Record<string, unknown> };
    };
    assert.equal(forbiddenResponse.status, 404);
    assert.equal(forbiddenPayload.error.code, "NOT_FOUND");

    const storageResponse = await fetch(`${baseUrl}/api/media-assets/validate-storage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: "ch_historia",
        type: "audio",
        storagePath: "../escape.wav",
      }),
    });
    const storagePayload = (await storageResponse.json()) as {
      error: { code: string; message: string; details: { issues: Array<{ message: string }> } };
    };
    assert.equal(storageResponse.status, 400);
    assert.equal(storagePayload.error.code, "VALIDATION_ERROR");
    assert.ok(storagePayload.error.details.issues.length > 0);

    const usageResponse = await fetch(
      `${baseUrl}/api/media-assets/ma_hist_narration_01/usages?channelId=ch_historia`,
    );
    const usagePayload = (await usageResponse.json()) as {
      data: Array<{ usageType: string; referenceId: string }>;
    };
    assert.equal(usageResponse.status, 200);
    assert.ok(usagePayload.data.length > 0);

    const integrityResponse = await fetch(
      `${baseUrl}/api/media-assets/ma_hist_aux_01/validate-integrity`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channelId: "ch_historia",
          checksum: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
          sizeBytes: 1,
        }),
      },
    );
    const integrityPayload = (await integrityResponse.json()) as {
      error: { code: string };
    };
    assert.equal(integrityResponse.status, 409);
    assert.equal(integrityPayload.error.code, "CONFLICT");

    const videosResponse = await fetch(`${baseUrl}/api/videos?channelId=ch_historia`);
    const clipsResponse = await fetch(`${baseUrl}/api/clips?channelId=ch_historia`);
    assert.equal(videosResponse.status, 200);
    assert.equal(clipsResponse.status, 200);
  } finally {
    await stopServer(server);
  }
});

test("official video import calculates integrity, preserves old assets and is idempotent", async () => {
  const storageRoot = mkdtempSync(path.join(os.tmpdir(), "aralume-import-"));
  const videoPath = path.join(storageRoot, "ch_historia", "video", "e13-fixture.mp4");
  mkdirSync(path.dirname(videoPath), { recursive: true });
  execFileSync("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    "color=c=0x111827:s=320x180:r=10",
    "-t",
    "1",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    videoPath,
  ]);
  const channelsRepository = createChannelsRepository(channelDemoSeed);
  const editorialRepository = createEditorialRepository(editorialDemoSeed);
  const mediaAssetsRepository = createMediaAssetsRepository(mediaAssetsDemoSeed);
  const auditRepository = createAuditRepository(auditDemoSeed);
  const service = createMediaAssetsService(
    mediaAssetsRepository,
    {
      channelsRepository,
      editorialRepository,
      auditRepository,
    },
    { storageRoot },
  );
  const input = {
    channelId: "ch_historia",
    storagePath: "ch_historia/video/e13-fixture.mp4",
    title: "E13 controlled YouTube validation",
    description: "Controlled technical fixture with no third-party content.",
    origin: "generated" as const,
    provenance: "Generated locally by the controlled E13 validation fixture.",
    licenseStatus: "not_applicable" as const,
    contentId: "idea_06",
    idempotencyKey: "e13-video-import-001",
  };

  try {
    const [first, concurrent] = await Promise.all([
      service.importVideoAssetFromStorage(input),
      service.importVideoAssetFromStorage(input),
    ]);
    assert.equal(first.id, concurrent.id);
    assert.notEqual(first.id, "vd_historia_01");
    assert.equal(first.channelId, "ch_historia");
    assert.equal(first.storagePath, input.storagePath);
    assert.equal(first.status, "approved");
    assert.equal(first.renderStatus, "rendered");
    assert.equal(first.qualityStatus, "passed");
    assert.equal(first.complianceStatus, "approved");
    assert.equal(first.sizeBytes, statSync(videoPath).size);
    assert.equal(
      first.checksum,
      (await import("node:crypto"))
        .createHash("sha256")
        .update(readFileSync(videoPath))
        .digest("hex"),
    );
    assert.ok(first.technicalMetadata?.durationSeconds);
    assert.equal(
      mediaAssetsRepository.getVideoAsset("vd_historia_01")?.storagePath,
      "ch_historia/video/vd_historia_01.mp4",
    );

    const replay = await service.importVideoAssetFromStorage(input);
    assert.equal(replay.id, first.id);
    await assert.rejects(
      () =>
        service.importVideoAssetFromStorage({
          ...input,
          title: "different",
          idempotencyKey: input.idempotencyKey,
        }),
      (error) => error instanceof AppError && error.status === 409,
    );
    await assert.rejects(
      () =>
        service.importVideoAssetFromStorage({
          ...input,
          storagePath: "ch_curiosidades/video/e13-fixture.mp4",
          idempotencyKey: "e13-video-import-cross-channel",
        }),
      (error) => error instanceof AppError && error.status === 400,
    );
  } finally {
    rmSync(storageRoot, { recursive: true, force: true });
  }
});
