import assert from "node:assert/strict";
import test from "node:test";

import { ApiRequestError } from "./http-client";
import {
  describeCockpitsApiError,
  getAgentDefinitions,
  getAgentOfficeSnapshot,
  getDashboardSummary,
  getWorkflowRuns,
} from "./cockpits-api";

test("cockpit API client uses real channel-scoped endpoints", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (url: string | URL) => {
    calls.push(String(url));
    return new Response(
      JSON.stringify({
        data: [],
        meta: { requestId: "req_cockpit", generatedAt: "2026-07-18T12:00:00.000Z" },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;
  try {
    await getDashboardSummary("ch_historia");
    await getAgentDefinitions("ch_historia");
    await getAgentOfficeSnapshot("ch_historia");
    await getWorkflowRuns("ch_historia");
    assert.deepEqual(calls, [
      "/api/dashboard/summary?channelId=ch_historia",
      "/api/agents?channelId=ch_historia",
      "/api/agent-office/snapshot?channelId=ch_historia",
      "/api/workflows?channelId=ch_historia",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("cockpit API client sanitizes transport errors", () => {
  assert.equal(
    describeCockpitsApiError(
      new ApiRequestError({ kind: "network", url: "/api/dashboard/summary", message: "network" }),
    ),
    "Backend indisponivel. Tente novamente.",
  );
  assert.equal(
    describeCockpitsApiError(
      new ApiRequestError({
        kind: "unexpected_envelope",
        status: 404,
        url: "/api/workflows/wf_1",
        message: "missing",
      }),
    ),
    "Canal ou workflow nao encontrado.",
  );
});
