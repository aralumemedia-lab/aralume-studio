import assert from "node:assert/strict";
import test from "node:test";

import {
  createCostEntry,
  evaluateOperationalAction,
  getCostBreakdown,
  getCostEntries,
  getCostSummary,
  getOperationalModes,
  updateChannelOperationalModePolicy,
  updateGlobalOperationalModePolicy,
} from "./costs-api";
import { ApiRequestError } from "./http-client";

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

test("costs API calls the operational endpoints with typed envelopes", async () => {
  const baseMeta = { requestId: "req_1", generatedAt: "2026-07-13T03:30:00.000Z" };

  await withFetchStub(
    async (url, init) => {
      if (url === "/api/costs?channelId=ch_historia") {
        return jsonResponse({ data: [], meta: { ...baseMeta, total: 0, page: 1, pageSize: 0 } });
      }

      if (url === "/api/costs/summary?channelId=ch_historia") {
        return jsonResponse({
          data: {
            channelId: "ch_historia",
            periodStart: "2026-07-01T00:00:00.000Z",
            periodEnd: "2026-07-13T03:30:00.000Z",
            budgetConfigured: true,
            budgetCents: 20000,
            consumedCents: 13100,
            remainingCents: 6900,
            consumptionPercent: 65.5,
            status: "healthy",
            totalCostCents: 13100,
            entryCount: 4,
            policy: {
              id: "op_ch_historia",
              scope: "channel",
              channelId: "ch_historia",
              mode: "demo",
              allowRealAi: false,
              allowRealTts: false,
              allowRealImageGeneration: false,
              allowRealVideoGeneration: false,
              allowExternalPublication: false,
              requireHumanApproval: true,
              budgetConfigured: true,
              dailyBudgetLimitCents: 7000,
              monthlyBudgetLimitCents: 20000,
              createdAt: "2026-07-13T03:30:00.000Z",
              updatedAt: "2026-07-13T03:30:00.000Z",
            },
            byChannel: [],
            byStage: [],
            byProvider: [],
            byContent: [],
            byPeriod: [],
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/costs/breakdown?channelId=ch_historia") {
        return jsonResponse({
          data: {
            channelId: "ch_historia",
            periodStart: "2026-07-01T00:00:00.000Z",
            periodEnd: "2026-07-13T03:30:00.000Z",
            byChannel: [],
            byStage: [],
            byProvider: [],
            byContent: [],
            byPeriod: [],
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/operational-modes?channelId=ch_historia") {
        return jsonResponse({
          data: {
            channelId: "ch_historia",
            globalPolicy: {
              id: "op_global",
              scope: "global",
              mode: "demo",
              allowRealAi: false,
              allowRealTts: false,
              allowRealImageGeneration: false,
              allowRealVideoGeneration: false,
              allowExternalPublication: false,
              requireHumanApproval: true,
              budgetConfigured: false,
              dailyBudgetLimitCents: 0,
              monthlyBudgetLimitCents: 0,
              createdAt: "2026-07-13T03:30:00.000Z",
              updatedAt: "2026-07-13T03:30:00.000Z",
            },
            effectivePolicy: {
              id: "op_effective_ch_historia",
              scope: "channel",
              channelId: "ch_historia",
              mode: "demo",
              allowRealAi: false,
              allowRealTts: false,
              allowRealImageGeneration: false,
              allowRealVideoGeneration: false,
              allowExternalPublication: false,
              requireHumanApproval: true,
              budgetConfigured: true,
              dailyBudgetLimitCents: 7000,
              monthlyBudgetLimitCents: 20000,
              createdAt: "2026-07-13T03:30:00.000Z",
              updatedAt: "2026-07-13T03:30:00.000Z",
            },
            budgetConfigured: true,
            budgetCents: 20000,
            consumedCents: 13100,
            remainingCents: 6900,
            consumptionPercent: 65.5,
            status: "healthy",
            allowedActions: [],
            blockedActions: [],
            evaluatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/operational-modes/global" && init?.method === "PATCH") {
        return jsonResponse({
          data: {
            id: "op_global",
            scope: "global",
            mode: "demo",
            allowRealAi: false,
            allowRealTts: false,
            allowRealImageGeneration: false,
            allowRealVideoGeneration: false,
            allowExternalPublication: false,
            requireHumanApproval: true,
            budgetConfigured: false,
            dailyBudgetLimitCents: 0,
            monthlyBudgetLimitCents: 0,
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/operational-modes/channels/ch_historia" && init?.method === "PATCH") {
        return jsonResponse({
          data: {
            id: "op_ch_historia",
            scope: "channel",
            channelId: "ch_historia",
            mode: "demo",
            allowRealAi: false,
            allowRealTts: false,
            allowRealImageGeneration: false,
            allowRealVideoGeneration: false,
            allowExternalPublication: false,
            requireHumanApproval: true,
            budgetConfigured: true,
            dailyBudgetLimitCents: 7000,
            monthlyBudgetLimitCents: 20000,
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/operational-modes/evaluate" && init?.method === "POST") {
        return jsonResponse(
          {
            error: {
              code: "OPERATION_BLOCKED",
              message: "demo mode blocks real operations",
              details: {
                decision: {
                  decisionCode: "DEMO_PUBLICATION_BLOCKED",
                },
              },
            },
            meta: baseMeta,
          },
          409,
        );
      }

      if (url === "/api/costs" && init?.method === "POST") {
        return jsonResponse({
          data: {
            id: "co_1000",
            channelId: "ch_historia",
            contentId: "idea_02",
            workflowRunId: "wf_02",
            stage: "publication",
            providerName: "Aralume Publisher",
            costType: "publication",
            description: "Publicacao simulada",
            amountCents: 1200,
            currency: "BRL",
            createdAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      throw new Error(`Unexpected request: ${url}`);
    },
    async (calls) => {
      const list = await getCostEntries("ch_historia");
      const summary = await getCostSummary("ch_historia");
      const breakdown = await getCostBreakdown("ch_historia");
      const modes = await getOperationalModes("ch_historia");
      const created = await createCostEntry({
        channelId: "ch_historia",
        contentId: "idea_02",
        workflowRunId: "wf_02",
        stage: "publication",
        providerName: "Aralume Publisher",
        costType: "publication",
        description: "Publicacao simulada",
        amountCents: 1200,
      });
      const updatedGlobal = await updateGlobalOperationalModePolicy({ budgetConfigured: false });
      const updatedChannel = await updateChannelOperationalModePolicy("ch_historia", {
        budgetConfigured: true,
      });

      await assert.rejects(
        evaluateOperationalAction({
          channelId: "ch_historia",
          action: "real_publication",
        }),
        (error) =>
          error instanceof ApiRequestError &&
          error.status === 409 &&
          error.code === "OPERATION_BLOCKED",
      );

      assert.equal(list.data.length, 0);
      assert.equal(summary.data.status, "healthy");
      assert.equal(summary.data.channelId, "ch_historia");
      assert.equal(breakdown.data.channelId, "ch_historia");
      assert.equal(modes.data.status, "healthy");
      assert.equal(created.data.currency, "BRL");
      assert.equal(updatedGlobal.data.scope, "global");
      assert.equal(updatedChannel.data.scope, "channel");

      assert.equal(calls[0].url, "/api/costs?channelId=ch_historia");
      assert.equal(calls[1].url, "/api/costs/summary?channelId=ch_historia");
      assert.equal(calls[2].url, "/api/costs/breakdown?channelId=ch_historia");
      assert.equal(calls[3].url, "/api/operational-modes?channelId=ch_historia");
      assert.equal(calls[4].url, "/api/costs");
      assert.equal(calls[5].url, "/api/operational-modes/global");
      assert.equal(calls[6].url, "/api/operational-modes/channels/ch_historia");
      assert.equal(calls[7].url, "/api/operational-modes/evaluate");
    },
  );
});
