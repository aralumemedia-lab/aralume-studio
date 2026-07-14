import assert from "node:assert/strict";
import test from "node:test";

import { ApiRequestError } from "./http-client";
import {
  createDerivedClip,
  createMediaAsset,
  describeMediaAssetsApiError,
  getDerivedClip,
  getDerivedClips,
  getMediaAsset,
  getMediaAssetUsages,
  getMediaAssets,
  getVideoAssets,
  updateMediaAsset,
  validateMediaAssetIntegrity,
  validateMediaStorageReference,
} from "./media-assets-api";

type FetchCall = {
  url: string;
  init?: RequestInit;
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function withFetchStub<T>(
  stub: (url: string, init?: RequestInit) => Promise<Response>,
  handler: (calls: FetchCall[]) => Promise<T> | T,
): Promise<T> {
  const originalFetch = globalThis.fetch;
  const calls: FetchCall[] = [];

  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return stub(String(url), init);
  }) as typeof fetch;

  try {
    return await handler(calls);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("media assets API calls the expected endpoints and preserves payloads", async () => {
  const baseMeta = { requestId: "req_1", generatedAt: "2026-07-13T03:30:00.000Z" };

  await withFetchStub(
    async (url, init) => {
      if (url === "/api/media-assets?channelId=ch_1&type=audio&status=available") {
        return jsonResponse({ data: [], meta: { ...baseMeta, total: 0, page: 1, pageSize: 0 } });
      }

      if (url === "/api/media-assets/ma_1?channelId=ch_1") {
        return jsonResponse({
          data: {
            id: "ma_1",
            channelId: "ch_1",
            type: "audio",
            category: "audio",
            title: "Narration",
            name: "Narration",
            description: "Asset",
            mimeType: "audio/wav",
            extension: "wav",
            sizeBytes: 1024,
            checksumAlgorithm: "sha256",
            checksum: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            internalUri: "aralume://media-assets/ch_1/ma_1",
            storagePath: "ch_1/audio/ma_1.wav",
            origin: "generated",
            provenance: "Internal",
            licenseStatus: "confirmed",
            status: "available",
            riskLevel: "ok",
            costActualCents: 120,
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/media-assets" && init?.method === "POST") {
        return jsonResponse({
          data: {
            id: "ma_2",
            channelId: "ch_1",
            type: "audio",
            category: "audio",
            title: "Narration",
            name: "Narration",
            description: "Asset",
            mimeType: "audio/wav",
            extension: "wav",
            sizeBytes: 1024,
            checksumAlgorithm: "sha256",
            checksum: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            internalUri: "aralume://media-assets/ch_1/ma_2",
            storagePath: "ch_1/audio/ma_2.wav",
            origin: "generated",
            provenance: "Internal",
            licenseStatus: "confirmed",
            status: "available",
            riskLevel: "ok",
            costActualCents: 120,
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/media-assets/ma_1" && init?.method === "PATCH") {
        return jsonResponse({
          data: {
            id: "ma_1",
            channelId: "ch_1",
            type: "audio",
            category: "audio",
            title: "Narration updated",
            name: "Narration updated",
            description: "Asset",
            mimeType: "audio/wav",
            extension: "wav",
            sizeBytes: 1024,
            checksumAlgorithm: "sha256",
            checksum: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            internalUri: "aralume://media-assets/ch_1/ma_1",
            storagePath: "ch_1/audio/ma_1.wav",
            origin: "generated",
            provenance: "Internal",
            licenseStatus: "confirmed",
            status: "available",
            riskLevel: "ok",
            costActualCents: 120,
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:01.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/media-assets/validate-storage" && init?.method === "POST") {
        return jsonResponse({
          data: {
            channelId: "ch_1",
            type: "audio",
            storagePath: "ch_1/audio/ma_1.wav",
            normalizedStoragePath: "ch_1/audio/ma_1.wav",
            internalUri: "aralume://media-assets/ch_1/preview_ch_1_audio_ma_1_wav",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/media-assets/ma_1/validate-integrity" && init?.method === "POST") {
        return jsonResponse({
          data: {
            channelId: "ch_1",
            assetId: "ma_1",
            expectedChecksum: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            expectedSizeBytes: 1024,
            checksumMatches: true,
            sizeMatches: true,
            valid: true,
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/media-assets/ma_1/usages?channelId=ch_1") {
        return jsonResponse({
          data: [
            {
              id: "usage_1",
              channelId: "ch_1",
              assetId: "ma_1",
              usageType: "content",
              referenceId: "idea_1",
              referenceLabel: "Content",
              summary: "Linked to content item.",
              createdAt: "2026-07-13T03:30:00.000Z",
            },
          ],
          meta: { ...baseMeta, total: 1, page: 1, pageSize: 1 },
        });
      }

      if (url === "/api/videos?channelId=ch_1") {
        return jsonResponse({ data: [], meta: { ...baseMeta, total: 0, page: 1, pageSize: 0 } });
      }

      if (url === "/api/clips?channelId=ch_1") {
        return jsonResponse({ data: [], meta: { ...baseMeta, total: 0, page: 1, pageSize: 0 } });
      }

      if (url === "/api/clips/cl_1?channelId=ch_1") {
        return jsonResponse({
          data: {
            id: "cl_1",
            channelId: "ch_1",
            parentVideoId: "vd_1",
            renderJobId: "rj_1",
            title: "Clip",
            hook: "Hook",
            description: "Description",
            startSeconds: 10,
            endSeconds: 25,
            durationSeconds: 15,
            targetPlatform: "youtube_shorts",
            status: "completed",
            format: "horizontal",
            resolution: "1920x1080",
            aspectRatio: "16:9",
            riskLevel: "ok",
            clipPotentialScore: 90,
            origin: "generated",
            licenseStatus: "confirmed",
            internalUri: "aralume://media-assets/ch_1/cl_1",
            storagePath: "ch_1/clip/rendered/cl_1.mp4",
            mimeType: "video/mp4",
            sizeBytes: 1024,
            checksumAlgorithm: "sha256",
            checksum: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            costActualCents: 0,
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/clips" && init?.method === "POST") {
        return jsonResponse({
          data: {
            id: "cl_2",
            channelId: "ch_1",
            parentVideoId: "vd_1",
            renderJobId: "rj_2",
            title: "Clip",
            hook: "Hook",
            description: "Description",
            startSeconds: 10,
            endSeconds: 25,
            durationSeconds: 15,
            targetPlatform: "youtube_shorts",
            status: "queued",
            format: "horizontal",
            resolution: "1920x1080",
            aspectRatio: "16:9",
            riskLevel: "ok",
            clipPotentialScore: 90,
            origin: "generated",
            licenseStatus: "confirmed",
            internalUri: "aralume://media-assets/ch_1/cl_2",
            storagePath: "ch_1/clip/rendered/cl_2.mp4",
            mimeType: "video/mp4",
            sizeBytes: 0,
            checksumAlgorithm: "sha256",
            costActualCents: 0,
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      throw new Error(`Unexpected request: ${url}`);
    },
    async (calls) => {
      const list = await getMediaAssets({ channelId: "ch_1", type: "audio", status: "available" });
      const detail = await getMediaAsset("ch_1", "ma_1");
      const created = await createMediaAsset({
        channelId: "ch_1",
        type: "audio",
        category: "audio",
        name: "Narration",
        title: "Narration",
        description: "Asset",
        mimeType: "audio/wav",
        extension: "wav",
        sizeBytes: 1024,
        checksum: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        storagePath: "ch_1/audio/ma_2.wav",
        origin: "generated",
        provenance: "Internal",
        licenseStatus: "confirmed",
        status: "available",
        riskLevel: "ok",
        costActualCents: 120,
      });
      const updated = await updateMediaAsset("ch_1", "ma_1", { title: "Narration updated" });
      const storage = await validateMediaStorageReference({
        channelId: "ch_1",
        type: "audio",
        storagePath: "ch_1/audio/ma_1.wav",
      });
      const integrity = await validateMediaAssetIntegrity("ma_1", {
        channelId: "ch_1",
        checksum: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        sizeBytes: 1024,
      });
      const usages = await getMediaAssetUsages("ch_1", "ma_1");
      await getVideoAssets("ch_1");
      const clips = await getDerivedClips({ channelId: "ch_1" });
      const clipDetail = await getDerivedClip("ch_1", "cl_1");
      const clipCreate = await createDerivedClip({
        channelId: "ch_1",
        parentVideoId: "vd_1",
        startSeconds: 10,
        endSeconds: 25,
        idempotencyKey: "clip:1",
        targetPlatform: "youtube_shorts",
      });

      assert.equal(list.data.length, 0);
      assert.equal(detail.data.id, "ma_1");
      assert.equal(created.data.id, "ma_2");
      assert.equal(updated.data.title, "Narration updated");
      assert.equal(storage.data.normalizedStoragePath, "ch_1/audio/ma_1.wav");
      assert.equal(integrity.data.valid, true);
      assert.equal(usages.data.length, 1);
      assert.equal(clips.data.length, 0);
      assert.equal(clipDetail.data.id, "cl_1");
      assert.equal(clipCreate.data.id, "cl_2");

      assert.equal(calls[0].url, "/api/media-assets?channelId=ch_1&type=audio&status=available");
      assert.equal(calls[1].url, "/api/media-assets/ma_1?channelId=ch_1");
      assert.equal(calls[2].url, "/api/media-assets");
      assert.equal(calls[2].init?.method, "POST");
      assert.equal(calls[3].url, "/api/media-assets/ma_1");
      assert.equal(calls[3].init?.method, "PATCH");
      assert.equal(calls[4].url, "/api/media-assets/validate-storage");
      assert.equal(calls[5].url, "/api/media-assets/ma_1/validate-integrity");
      assert.equal(calls[6].url, "/api/media-assets/ma_1/usages?channelId=ch_1");
      assert.equal(calls[7].url, "/api/videos?channelId=ch_1");
      assert.equal(calls[8].url, "/api/clips?channelId=ch_1");
      assert.equal(calls[9].url, "/api/clips/cl_1?channelId=ch_1");
      assert.equal(calls[10].url, "/api/clips");
      assert.equal(calls[10].init?.method, "POST");
    },
  );
});

test("media assets API surfaces validation and conflict errors", async () => {
  const baseMeta = { requestId: "req_2", generatedAt: "2026-07-13T03:30:00.000Z" };

  await withFetchStub(
    async (url, init) => {
      if (url === "/api/media-assets" && !init?.method) {
        return jsonResponse(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid payload",
              details: {},
            },
            meta: baseMeta,
          },
          400,
        );
      }

      if (url === "/api/media-assets?channelId=ch_1") {
        return jsonResponse(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid payload",
              details: {},
            },
            meta: baseMeta,
          },
          400,
        );
      }

      if (url === "/api/media-assets/ma_1/validate-integrity" && init?.method === "POST") {
        return jsonResponse(
          {
            error: {
              code: "CONFLICT",
              message: "Integrity mismatch",
              details: {},
            },
            meta: baseMeta,
          },
          409,
        );
      }

      throw new Error(`Unexpected request: ${url}`);
    },
    async () => {
      await assert.rejects(
        getMediaAssets({ channelId: "ch_1" }),
        (error) =>
          error instanceof ApiRequestError &&
          error.status === 400 &&
          error.code === "VALIDATION_ERROR",
      );

      await assert.rejects(
        validateMediaAssetIntegrity("ma_1", {
          channelId: "ch_1",
          checksum: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          sizeBytes: 1024,
        }),
        (error) =>
          error instanceof ApiRequestError && error.status === 409 && error.code === "CONFLICT",
      );

      assert.equal(
        describeMediaAssetsApiError(
          new ApiRequestError({
            kind: "unexpected_envelope",
            url: "/api/media-assets",
            status: 404,
            code: "NOT_FOUND",
            message: "Media asset not found",
          }),
        ),
        "Ativo de midia nao encontrado.",
      );
      assert.equal(
        describeMediaAssetsApiError(
          new ApiRequestError({
            kind: "unexpected_envelope",
            url: "/api/media-assets/ma_1/validate-integrity",
            status: 409,
            code: "CONFLICT",
            message: "Integrity mismatch",
          }),
          "integrity",
        ),
        "O ativo de midia entrou em conflito.",
      );
    },
  );
});
