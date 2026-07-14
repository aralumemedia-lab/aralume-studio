import assert from "node:assert/strict";
import test from "node:test";

import { ApiRequestError } from "./http-client";
import {
  createRenderJob,
  describeRendersApiError,
  getRenderJob,
  getRenderJobs,
} from "./renders-api";

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

test("renders API calls the expected endpoints and preserves the render contract", async () => {
  const baseMeta = { requestId: "req_render_1", generatedAt: "2026-07-13T03:30:00.000Z" };

  await withFetchStub(
    async (url, init) => {
      if (url === "/api/renders?channelId=ch_historia&status=completed") {
        return jsonResponse({ data: [], meta: { ...baseMeta, total: 0, page: 1, pageSize: 0 } });
      }

      if (url === "/api/renders/rj_1?channelId=ch_historia") {
        return jsonResponse({
          data: {
            id: "rj_1",
            channelId: "ch_historia",
            renderType: "controlled_video",
            status: "completed",
            inputAssetIds: ["ma_hist_narration_01"],
            outputAssetId: "vd_1",
            renderProfile: "controlled_demo_short_v1",
            idempotencyKey: "render:1",
            outputStoragePath: "ch_historia/video/rendered/vd_1.mp4",
            createdAt: "2026-07-13T03:30:00.000Z",
            startedAt: "2026-07-13T03:30:01.000Z",
            completedAt: "2026-07-13T03:30:04.000Z",
            durationSeconds: 3,
            attemptCount: 1,
            logSummary: "Render concluido com sucesso.",
            logEntries: [],
            technicalMetadata: {},
            updatedAt: "2026-07-13T03:30:04.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/renders" && init?.method === "POST") {
        return jsonResponse({
          data: {
            id: "rj_2",
            channelId: "ch_historia",
            renderType: "controlled_video",
            status: "queued",
            inputAssetIds: ["ma_hist_narration_01", "ma_hist_image_01"],
            renderProfile: "controlled_demo_short_v1",
            idempotencyKey: "render:2",
            createdAt: "2026-07-13T03:30:00.000Z",
            attemptCount: 0,
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      throw new Error(`Unexpected request: ${url}`);
    },
    async (calls) => {
      const list = await getRenderJobs({ channelId: "ch_historia", status: "completed" });
      const detail = await getRenderJob("ch_historia", "rj_1");
      const created = await createRenderJob({
        channelId: "ch_historia",
        inputAssetIds: ["ma_hist_narration_01", "ma_hist_image_01"],
        renderType: "controlled_video",
        renderProfile: "controlled_demo_short_v1",
        idempotencyKey: "render:2",
      });

      assert.equal(list.data.length, 0);
      assert.equal(detail.data.status, "completed");
      assert.equal(created.data.status, "queued");

      assert.equal(calls[0].url, "/api/renders?channelId=ch_historia&status=completed");
      assert.equal(calls[1].url, "/api/renders/rj_1?channelId=ch_historia");
      assert.equal(calls[2].url, "/api/renders");
      assert.equal(calls[2].init?.method, "POST");
    },
  );
});

test("renders API surfaces validation, blocked and failure messages", async () => {
  const baseMeta = { requestId: "req_render_2", generatedAt: "2026-07-13T03:30:00.000Z" };

  await withFetchStub(
    async (url, init) => {
      if (url === "/api/renders?channelId=ch_historia") {
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

      if (url === "/api/renders" && init?.method === "POST") {
        return jsonResponse(
          {
            error: {
              code: "OPERATION_BLOCKED",
              message: "blocked by policy",
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
        getRenderJobs({ channelId: "ch_historia" }),
        (error) =>
          error instanceof ApiRequestError &&
          error.status === 400 &&
          error.code === "VALIDATION_ERROR",
      );

      await assert.rejects(
        createRenderJob({
          channelId: "ch_historia",
          inputAssetIds: ["ma_hist_narration_01"],
          renderType: "controlled_video",
          renderProfile: "controlled_demo_short_v1",
          idempotencyKey: "render:block",
        }),
        (error) =>
          error instanceof ApiRequestError &&
          error.status === 409 &&
          error.code === "OPERATION_BLOCKED",
      );

      assert.equal(
        describeRendersApiError(
          new ApiRequestError({
            kind: "unexpected_envelope",
            url: "/api/renders",
            status: 404,
            code: "NOT_FOUND",
            message: "Render job not found",
          }),
        ),
        "Job de renderizacao nao encontrado.",
      );
      assert.equal(
        describeRendersApiError(
          new ApiRequestError({
            kind: "unexpected_envelope",
            url: "/api/renders",
            status: 409,
            code: "OPERATION_BLOCKED",
            message: "blocked",
          }),
        ),
        "A renderizacao foi bloqueada pela policy operacional.",
      );
      assert.equal(
        describeRendersApiError(
          new ApiRequestError({
            kind: "unexpected_envelope",
            url: "/api/renders",
            status: 409,
            code: "BUDGET_EXCEEDED",
            message: "budget exceeded",
          }),
        ),
        "O budget operacional bloqueou a renderizacao.",
      );
    },
  );
});
