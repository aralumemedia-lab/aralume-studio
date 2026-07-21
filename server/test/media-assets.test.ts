import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
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
import {
  MAX_MEDIA_ASSET_SIZE_BYTES,
  sizeBytesSchema,
  videoAssetImportSchema,
} from "../src/modules/media-assets/media-assets.schema.js";
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
    authTestBypass: true,
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
    status: "pending",
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
    () =>
      harness.service.createMediaAsset({
        channelId: "ch_historia",
        type: "image",
        category: "visual",
        name: "Mismatched image",
        title: "Mismatched image",
        description: "MIME and extension must agree.",
        mimeType: "image/png",
        extension: "mp4",
        sizeBytes: 12,
        checksum: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        storagePath: "ch_historia/image/mismatched.mp4",
        origin: "generated",
        provenance: "Negative security test",
        licenseStatus: "confirmed",
        status: "available",
        riskLevel: "ok",
        costActualCents: 0,
      }),
    (error) => error instanceof AppError && error.status === 400,
  );

  assert.equal(
    videoAssetImportSchema.safeParse({
      channelId: "ch_historia",
      storagePath: "ch_historia/video/unauthorized.mov",
      title: "Invalid import extension",
      description: "The importer only accepts the controlled MP4 path.",
      origin: "generated",
      provenance: "Negative security test",
      licenseStatus: "not_applicable",
      contentId: "idea_06",
      idempotencyKey: "sprint24-invalid-ext",
    }).success,
    false,
  );
  assert.equal(sizeBytesSchema.safeParse(MAX_MEDIA_ASSET_SIZE_BYTES + 1).success, false);

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

test("media assets create and update narration with queryable audit state", () => {
  const harness = createHarness();
  const auditContext = {
    actorId: "owner-media-test",
    actorName: "owner-media-test",
    role: "owner" as const,
    channelId: "ch_negocios",
    requestId: "req-media-create",
  };
  const created = harness.service.createMediaAsset(
    {
      channelId: "ch_negocios",
      type: "narration",
      category: "audio",
      name: "Sprint 17 narration",
      title: "Sprint 17 narration",
      description: "Narration asset created for persistence checks.",
      mimeType: "audio/wav",
      extension: "wav",
      sizeBytes: 2048,
      checksum: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      storagePath: "ch_negocios/narration/sprint-17.wav",
      origin: "generated",
      provenance: "Created by the controlled persistence test.",
      licenseStatus: "confirmed",
      status: "pending",
      riskLevel: "ok",
      costActualCents: 0,
      providerName: "Aralume TTS",
      modelName: "voice-v3",
    },
    auditContext.requestId,
    auditContext,
  );

  const updated = harness.service.updateMediaAsset(
    "ch_negocios",
    created.id,
    {
      description: "Narration asset updated for persistence checks.",
      usageSummary: "Used to verify same-process reload persistence.",
      sizeBytes: 4096,
    },
    "req-media-update",
    { ...auditContext, requestId: "req-media-update" },
  );
  const queried = harness.service.getMediaAsset("ch_negocios", updated.id);

  assert.equal(queried.channelId, "ch_negocios");
  assert.equal(queried.description, "Narration asset updated for persistence checks.");
  assert.equal(queried.usageSummary, "Used to verify same-process reload persistence.");
  assert.equal(queried.sizeBytes, 4096);
  assert.ok(
    harness.auditRepository
      .listAuditLogs({ channelId: "ch_negocios" })
      .some((log) => log.action === "media_asset.updated"),
  );
  const registeredAudit = harness.auditRepository
    .listAuditLogs({ channelId: "ch_negocios" })
    .find((log) => log.action === "media_asset.registered");
  const updatedAudit = harness.auditRepository
    .listAuditLogs({ channelId: "ch_negocios" })
    .find((log) => log.action === "media_asset.updated");
  assert.equal(registeredAudit?.actorName, "owner-media-test");
  assert.equal(registeredAudit?.requestId, "req-media-create");
  assert.equal(registeredAudit?.metadata?.actorId, "owner-media-test");
  assert.equal(updatedAudit?.actorName, "owner-media-test");
  assert.equal(updatedAudit?.requestId, "req-media-update");
});

test("available media registration validates the real file and leaves no rejected asset", () => {
  const storageRoot = mkdtempSync(path.join(os.tmpdir(), "aralume-media-validation-"));
  const channelsRepository = createChannelsRepository(channelDemoSeed);
  const mediaAssetsRepository = createMediaAssetsRepository();
  const auditRepository = createAuditRepository();
  const file = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const relativePath = "ch_historia/image/validated.png";
  const absolutePath = path.join(storageRoot, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, file);
  mkdirSync(path.join(storageRoot, "ch_historia", "image", "directory.png"), {
    recursive: true,
  });
  const truncatedMp4Path = path.join(storageRoot, "ch_historia", "video", "truncated.mp4");
  mkdirSync(path.dirname(truncatedMp4Path), { recursive: true });
  writeFileSync(
    truncatedMp4Path,
    Buffer.from([0, 0, 0, 12, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]),
  );
  const checksum = createHash("sha256").update(file).digest("hex");

  const service = createMediaAssetsService(
    mediaAssetsRepository,
    { channelsRepository, auditRepository },
    { storageRoot },
  );
  const baseInput = {
    channelId: "ch_historia",
    type: "image" as const,
    category: "visual" as const,
    name: "Validated image",
    title: "Validated image",
    description: "Real fixture used by the security regression test.",
    mimeType: "image/png",
    extension: "png",
    sizeBytes: file.length,
    checksum,
    storagePath: relativePath,
    origin: "generated" as const,
    provenance: "Deterministic security fixture.",
    licenseStatus: "confirmed" as const,
    status: "available" as const,
    riskLevel: "ok" as const,
    costActualCents: 0,
  };

  try {
    const created = service.createMediaAsset(baseInput, "req_media_valid");
    assert.equal(created.status, "available");
    assert.equal(created.integrity?.observedSizeBytes, file.length);
    assert.equal(created.integrity?.observedChecksum, checksum);
    assert.equal(created.integrity?.checksumMatches, true);
    assert.equal(created.integrity?.sizeMatches, true);

    for (const invalidInput of [
      { ...baseInput, storagePath: "ch_historia/image/missing.png" },
      { ...baseInput, name: "Directory", storagePath: "ch_historia/image/directory.png" },
      { ...baseInput, name: "Wrong MIME", mimeType: "image/jpeg", extension: "jpg" },
      { ...baseInput, name: "Wrong size", sizeBytes: file.length + 1 },
      { ...baseInput, name: "Wrong checksum", checksum: "f".repeat(64) },
      { ...baseInput, name: "Cross channel", storagePath: "ch_curiosidades/image/other.png" },
      {
        ...baseInput,
        type: "video" as const,
        category: "video" as const,
        name: "Truncated MP4",
        title: "Truncated MP4",
        mimeType: "video/mp4",
        extension: "mp4",
        sizeBytes: statSync(truncatedMp4Path).size,
        checksum: createHash("sha256").update(readFileSync(truncatedMp4Path)).digest("hex"),
        storagePath: "ch_historia/video/truncated.mp4",
      },
    ]) {
      assert.throws(
        () => service.createMediaAsset(invalidInput, "req_media_rejected"),
        (error) => error instanceof AppError && error.status === 400,
      );
    }

    assert.equal(mediaAssetsRepository.listMediaAssets({ channelId: "ch_historia" }).length, 1);
    const rejectedAudits = auditRepository
      .listAuditLogs({ channelId: "ch_historia" })
      .filter((log) => log.action === "media_asset.registration_rejected");
    assert.equal(rejectedAudits.length, 7);
    assert.equal(
      auditRepository
        .listAuditLogs({ channelId: "ch_historia" })
        .some(
          (log) =>
            log.action === "media_asset.registered" && log.requestId === "req_media_rejected",
        ),
      false,
    );
    assert.equal(
      auditRepository
        .listAuditLogs({ channelId: "ch_historia" })
        .some((log) => log.entityId === "truncated.mp4" && log.status === "success"),
      false,
    );
  } finally {
    rmSync(storageRoot, { recursive: true, force: true });
  }
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

test("media assets HTTP create and patch routes remain queryable in the active process", async () => {
  const createdAsset = {
    channelId: "ch_negocios",
    type: "image",
    category: "visual",
    name: "Runner visual asset",
    title: "Runner visual asset",
    description: "Controlled visual asset created through HTTP.",
    mimeType: "image/png",
    extension: "png",
    sizeBytes: 1024,
    checksum: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    storagePath: "ch_negocios/image/runner-visual.png",
    origin: "generated",
    provenance: "Created by HTTP route test.",
    licenseStatus: "known",
    status: "pending",
    riskLevel: "ok",
    costActualCents: 0,
  };

  const { baseUrl, server, harness } = await startServer();

  try {
    const createResponse = await fetch(`${baseUrl}/api/media-assets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createdAsset),
    });
    const createPayload = (await createResponse.json()) as {
      data: { id: string; title?: string; description: string };
      meta: { requestId: string };
    };
    assert.equal(createResponse.status, 201);
    assert.ok(createPayload.data.id.startsWith("ma_"));
    assert.equal(createPayload.data.description, createdAsset.description);
    const createdId = createPayload.data.id;

    const patchResponse = await fetch(`${baseUrl}/api/media-assets/${createdId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: "ch_negocios",
        description: "Controlled visual asset updated through HTTP.",
        usageSummary: "Updated through HTTP patch.",
      }),
    });
    const patchPayload = (await patchResponse.json()) as {
      data: { id: string; description: string; usageSummary?: string };
      meta: { requestId: string };
    };
    assert.equal(patchResponse.status, 200);
    assert.equal(patchPayload.data.id, createdId);
    assert.equal(patchPayload.data.description, "Controlled visual asset updated through HTTP.");
    const detailResponse = await fetch(
      `${baseUrl}/api/media-assets/${createdId}?channelId=ch_negocios`,
    );
    const detailPayload = (await detailResponse.json()) as {
      data: { id: string; description: string; usageSummary?: string; channelId: string };
    };
    assert.equal(detailResponse.status, 200);
    assert.equal(detailPayload.data.channelId, "ch_negocios");
    assert.equal(detailPayload.data.description, "Controlled visual asset updated through HTTP.");
    assert.equal(detailPayload.data.usageSummary, "Updated through HTTP patch.");

    const auditLogs = harness.auditRepository.listAuditLogs({ channelId: "ch_negocios" });
    const registrationAudit = auditLogs.find(
      (log) => log.action === "media_asset.registered" && log.entityId === createdId,
    );
    const updateAudit = auditLogs.find(
      (log) => log.action === "media_asset.updated" && log.entityId === createdId,
    );
    assert.equal(registrationAudit?.requestId, createPayload.meta.requestId);
    assert.equal(updateAudit?.requestId, patchPayload.meta.requestId);
  } finally {
    await stopServer(server);
  }
});

test("official video import calculates integrity, preserves old assets and is idempotent", async () => {
  const ffmpegPath = resolveFfmpegPath();
  if (!ffmpegPath) {
    return;
  }

  const storageRoot = mkdtempSync(path.join(os.tmpdir(), "aralume-import-"));
  const videoPath = path.join(storageRoot, "ch_historia", "video", "e13-fixture.mp4");
  mkdirSync(path.dirname(videoPath), { recursive: true });
  execFileSync(ffmpegPath, [
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
  const auditContext = {
    actorId: "owner-import-test",
    actorName: "owner-import-test",
    role: "owner" as const,
    channelId: "ch_historia",
    requestId: "req-video-import-replay",
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

    const replay = await service.importVideoAssetFromStorage(input, auditContext);
    assert.equal(replay.id, first.id);
    const replayAudit = auditRepository
      .listAuditLogs({ channelId: "ch_historia" })
      .find((log) => log.action === "video_asset.import_idempotent_replay");
    assert.equal(replayAudit?.actorName, "owner-import-test");
    assert.equal(replayAudit?.requestId, "req-video-import-replay");
    assert.equal(replayAudit?.metadata?.actorId, "owner-import-test");
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
