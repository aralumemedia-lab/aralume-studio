import assert from "node:assert/strict";
import test from "node:test";

import {
  createChannel,
  describeChannelsApiError,
  getChannelSettings,
  getChannels,
  updateChannel,
} from "./channels-api";
import { ApiRequestError, requestApiEnvelope } from "./http-client";

type FetchCall = {
  url: string;
  init?: RequestInit;
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function getHeaderValue(headers: HeadersInit | undefined, key: string): string | undefined {
  if (!headers) {
    return undefined;
  }

  if (headers instanceof Headers) {
    return headers.get(key) ?? undefined;
  }

  if (Array.isArray(headers)) {
    const entry = headers.find(([name]) => name.toLowerCase() === key.toLowerCase());
    return entry?.[1];
  }

  const record = headers as Record<string, string | undefined>;
  return record[key] ?? record[key.toLowerCase()];
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

test("channels API calls real endpoints with typed envelopes", async () => {
  const baseMeta = { requestId: "req_1", generatedAt: "2026-07-13T03:30:00.000Z" };

  await withFetchStub(
    async (url, init) => {
      if (url === "/api/channels" && !init?.method) {
        return jsonResponse({
          data: [
            {
              id: "ch_1",
              name: "Canal Operacional",
              slug: "canal-operacional",
              description: "",
              status: "active",
              niche: "",
              audience: "",
              language: "pt-BR",
              region: "",
              timezone: "America/Sao_Paulo",
              editorialTone: "",
              publishingFrequency: "Diario",
              monthlyBudgetCents: 0,
              monthlyCostUsedCents: 0,
              costStatus: "healthy",
              riskLevel: "ok",
              healthScore: 92,
              activeWorkflowsCount: 0,
              pendingApprovalsCount: 0,
              connectedPlatformsCount: 0,
              lastActivityAt: "2026-07-13T03:30:00.000Z",
              createdAt: "2026-07-13T03:30:00.000Z",
              updatedAt: "2026-07-13T03:30:00.000Z",
            },
          ],
          meta: { ...baseMeta, total: 1, page: 1, pageSize: 1 },
        });
      }

      if (url === "/api/channels" && init?.method === "POST") {
        return jsonResponse({
          data: {
            id: "ch_2",
            name: "Canal Operacional",
            slug: "canal-operacional",
            description: "",
            status: "draft",
            niche: "",
            audience: "",
            language: "pt-BR",
            region: "",
            timezone: "America/Sao_Paulo",
            editorialTone: "",
            publishingFrequency: "A configurar",
            monthlyBudgetCents: 0,
            monthlyCostUsedCents: 0,
            costStatus: "not_configured",
            riskLevel: "attention",
            healthScore: 0,
            activeWorkflowsCount: 0,
            pendingApprovalsCount: 0,
            connectedPlatformsCount: 0,
            lastActivityAt: "2026-07-13T03:30:00.000Z",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/channels/ch_1" && init?.method === "PATCH") {
        return jsonResponse({
          data: {
            id: "ch_1",
            name: "Canal Operacional",
            slug: "canal-operacional",
            description: "",
            status: "paused",
            niche: "",
            audience: "",
            language: "pt-BR",
            region: "",
            timezone: "America/Sao_Paulo",
            editorialTone: "",
            publishingFrequency: "Diario",
            monthlyBudgetCents: 0,
            monthlyCostUsedCents: 0,
            costStatus: "not_configured",
            riskLevel: "attention",
            healthScore: 92,
            activeWorkflowsCount: 0,
            pendingApprovalsCount: 0,
            connectedPlatformsCount: 0,
            lastActivityAt: "2026-07-13T03:30:01.000Z",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:01.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/channels/ch_1/settings") {
        return jsonResponse({
          data: {
            id: "cs_ch_1",
            channelId: "ch_1",
            averageVideoDurationSeconds: 600,
            allowedFormats: ["horizontal"],
            allowedSubniches: [],
            blockedThemes: [],
            preferredSources: [],
            visualIdentity: {
              primaryColor: "#1B3A5C",
              secondaryColor: "#E8D9B4",
              typography: "Inter",
              subtitleStyle: "A configurar",
              openingStyle: "A configurar",
              thumbnailStyle: "A configurar",
            },
            narration: {
              voiceName: "A configurar",
              voiceProvider: "A configurar",
              speed: 1,
              tone: "A configurar",
              pronunciationNotes: [],
            },
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      throw new Error(`Unexpected request: ${url}`);
    },
    async (calls) => {
      const list = await getChannels();
      const created = await createChannel({
        name: "Canal Operacional",
        slug: "Canal-Operacional",
        status: "draft",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
      });
      const updated = await updateChannel("ch_1", { status: "paused" });
      const settings = await getChannelSettings("ch_1");

      assert.equal(list.data.length, 1);
      assert.equal(created.data.slug, "canal-operacional");
      assert.equal(updated.data.status, "paused");
      assert.equal(settings.data.channelId, "ch_1");

      assert.equal(calls.length, 4);
      assert.equal(calls[0].url, "/api/channels");
      assert.equal(calls[0].init?.method, undefined);
      assert.equal(calls[1].url, "/api/channels");
      assert.equal(calls[1].init?.method, "POST");
      assert.equal(getHeaderValue(calls[1].init?.headers, "content-type"), "application/json");
      assert.equal(JSON.parse(String(calls[1].init?.body ?? "{}")).slug, "Canal-Operacional");
      assert.equal(calls[2].url, "/api/channels/ch_1");
      assert.equal(calls[2].init?.method, "PATCH");
      assert.equal(getHeaderValue(calls[2].init?.headers, "content-type"), "application/json");
      assert.equal(JSON.parse(String(calls[2].init?.body ?? "{}")).status, "paused");
      assert.equal(calls[3].url, "/api/channels/ch_1/settings");
    },
  );
});

test("channels API surfaces validation, conflict and not found errors", async () => {
  const baseMeta = { requestId: "req_2", generatedAt: "2026-07-13T03:30:00.000Z" };

  await withFetchStub(
    async (url, init) => {
      if (url === "/api/channels" && !init?.method) {
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

      if (url === "/api/channels/ch_1" && init?.method === "PATCH") {
        return jsonResponse(
          {
            error: {
              code: "CONFLICT",
              message: "Channel slug already exists",
              details: { slug: "slug-repetido" },
            },
            meta: { requestId: "req_3", generatedAt: "2026-07-13T03:30:00.000Z" },
          },
          409,
        );
      }

      if (url === "/api/channels/missing/settings") {
        return jsonResponse(
          {
            error: {
              code: "NOT_FOUND",
              message: "Channel settings not found",
              details: { id: "missing" },
            },
            meta: { requestId: "req_4", generatedAt: "2026-07-13T03:30:00.000Z" },
          },
          404,
        );
      }

      throw new Error(`Unexpected request: ${url}`);
    },
    async () => {
      await assert.rejects(
        getChannels(),
        (error) =>
          error instanceof ApiRequestError &&
          error.status === 400 &&
          error.code === "VALIDATION_ERROR",
      );

      await assert.rejects(
        updateChannel("ch_1", { slug: "slug-repetido" }),
        (error) =>
          error instanceof ApiRequestError && error.status === 409 && error.code === "CONFLICT",
      );

      await assert.rejects(
        getChannelSettings("missing"),
        (error) =>
          error instanceof ApiRequestError && error.status === 404 && error.code === "NOT_FOUND",
      );

      assert.equal(
        describeChannelsApiError(
          new ApiRequestError({
            kind: "unexpected_envelope",
            url: "/api/channels",
            status: 404,
            code: "NOT_FOUND",
            message: "Channel not found",
          }),
        ),
        "Canal nao encontrado.",
      );

      assert.equal(
        describeChannelsApiError(
          new ApiRequestError({
            kind: "unexpected_envelope",
            url: "/api/channels/ch_1/settings",
            status: 404,
            code: "NOT_FOUND",
            message: "Channel settings not found",
          }),
          "settings",
        ),
        "Configuracoes do canal nao encontradas.",
      );
    },
  );
});

test("requestApiEnvelope maps network, timeout and unexpected envelope failures", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (async () => {
      throw new Error("network down");
    }) as typeof fetch;

    await assert.rejects(
      requestApiEnvelope("/channels"),
      (error) => error instanceof ApiRequestError && error.kind === "network",
    );

    globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const abortError = new Error("Aborted");
          abortError.name = "AbortError";
          reject(abortError);
        });
      });
    }) as typeof fetch;

    await assert.rejects(
      requestApiEnvelope("/channels", {}, { timeoutMs: 1 }),
      (error) => error instanceof ApiRequestError && error.kind === "timeout",
    );

    globalThis.fetch = (async () => jsonResponse({ data: [] })) as typeof fetch;

    await assert.rejects(
      requestApiEnvelope("/channels"),
      (error) => error instanceof ApiRequestError && error.kind === "unexpected_envelope",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
