import assert from "node:assert/strict";
import test from "node:test";

import { describeAuditApiError, getAuditLogs } from "./audit-api";
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

test("audit API calls the audit endpoint with typed envelopes", async () => {
  const baseMeta = { requestId: "req_1", generatedAt: "2026-07-13T03:30:00.000Z" };

  await withFetchStub(
    async (url) => {
      if (url === "/api/audit-logs?channelId=ch_historia") {
        return jsonResponse({
          data: [
            {
              id: "au_01",
              channelId: "ch_historia",
              actorType: "system",
              actorName: "Aralume Core",
              action: "cost.policy_updated",
              entityType: "OperationalModePolicy",
              entityId: "op_global",
              status: "success",
              message: "Policy atualizada.",
              createdAt: "2026-07-13T03:30:00.000Z",
            },
          ],
          meta: { ...baseMeta, total: 1, page: 1, pageSize: 1 },
        });
      }

      throw new Error(`Unexpected request: ${url}`);
    },
    async (calls) => {
      const list = await getAuditLogs("ch_historia");

      assert.equal(list.data.length, 1);
      assert.equal(list.data[0].channelId, "ch_historia");
      assert.equal(calls[0].url, "/api/audit-logs?channelId=ch_historia");
    },
  );
});

test("audit API surfaces transport and validation errors", async () => {
  const baseMeta = { requestId: "req_2", generatedAt: "2026-07-13T03:30:00.000Z" };

  await withFetchStub(
    async (url) => {
      if (url === "/api/audit-logs?channelId=missing") {
        return jsonResponse(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid audit log query",
              details: {},
            },
            meta: baseMeta,
          },
          400,
        );
      }

      throw new Error(`Unexpected request: ${url}`);
    },
    async () => {
      await assert.rejects(
        getAuditLogs("missing"),
        (error) =>
          error instanceof ApiRequestError &&
          error.status === 400 &&
          error.code === "VALIDATION_ERROR",
      );

      assert.equal(
        describeAuditApiError(
          new ApiRequestError({
            kind: "unexpected_envelope",
            url: "/api/audit-logs",
            status: 404,
            code: "NOT_FOUND",
            message: "Logs de auditoria nao encontrados.",
          }),
        ),
        "Logs de auditoria nao encontrados.",
      );
    },
  );
});
