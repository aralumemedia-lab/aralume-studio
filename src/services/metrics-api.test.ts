import assert from "node:assert/strict";
import test from "node:test";

import { ApiRequestError } from "./http-client";
import { describeMetricsApiError, getMetricsSummary, getPerformanceMetrics } from "./metrics-api";

test("metrics API client calls real list and summary endpoints with channel scope", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (url: string | URL) => {
    calls.push(String(url));
    return new Response(
      JSON.stringify({
        data: String(url).includes("summary")
          ? {
              channelId: "ch_historia",
              status: "insufficient_data",
              sampleCount: 0,
              contentCount: 0,
              platforms: [],
              origins: [],
              totals: {},
              byContent: [],
              missingData: [],
            }
          : [],
        meta: { requestId: "req_metrics", generatedAt: "2026-07-15T12:00:00.000Z" },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;
  try {
    await getPerformanceMetrics("ch_historia");
    await getMetricsSummary({ channelId: "ch_historia", from: "2026-07-01T00:00:00.000Z" });
    assert.equal(calls[0], "/api/metrics?channelId=ch_historia");
    assert.equal(
      calls[1],
      "/api/metrics/summary?channelId=ch_historia&from=2026-07-01T00%3A00%3A00.000Z",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("metrics API client describes transport and conflict errors", () => {
  assert.equal(
    describeMetricsApiError(
      new ApiRequestError({ kind: "network", url: "/api/metrics", message: "network" }),
    ),
    "Backend indisponivel. Tente novamente.",
  );
  assert.equal(
    describeMetricsApiError(
      new ApiRequestError({
        kind: "unexpected_envelope",
        url: "/api/metrics",
        message: "conflict",
        status: 409,
      }),
    ),
    "A metrica entrou em conflito ou foi repetida.",
  );
});
