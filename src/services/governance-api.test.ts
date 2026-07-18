import assert from "node:assert/strict";
import test from "node:test";

import {
  approveApproval,
  createApproval,
  describeApprovalsApiError,
  getApprovalHistory,
  getApprovals,
  rejectApproval,
  requestApprovalChanges,
} from "./approvals-api";
import {
  createComplianceCheck,
  describeComplianceApiError,
  getComplianceChecks,
} from "./compliance-api";
import { createQualityCheck, describeQualityApiError, getQualityChecks } from "./quality-api";
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

function readBody(init?: RequestInit): Record<string, unknown> {
  return JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
}

test("governance frontend clients call the expected endpoints and parse envelopes", async () => {
  const baseMeta = { requestId: "req_1", generatedAt: "2026-07-13T03:30:00.000Z" };

  await withFetchStub(
    async (url, init) => {
      if (
        url ===
        "/api/approvals?channelId=ch_historia&status=pending&riskLevel=attention&entityType=script&entityId=sc_01"
      ) {
        return jsonResponse({
          data: [
            {
              id: "ap_1",
              channelId: "ch_historia",
              entityType: "script",
              entityId: "sc_01",
              title: "Aprovar roteiro",
              status: "pending",
              riskLevel: "ok",
              summary: "Roteiro pronto.",
              requestedAt: "2026-07-13T03:30:00.000Z",
              requestedBy: "Ana Ribeiro",
              createdAt: "2026-07-13T03:30:00.000Z",
              updatedAt: "2026-07-13T03:30:00.000Z",
              targetSnapshot: {
                entityType: "script",
                entityId: "sc_01",
                channelId: "ch_historia",
                title: "Script",
                summary: "Resumo",
                status: "script",
                riskLevel: "ok",
              },
            },
          ],
          meta: { ...baseMeta, total: 1, page: 1, pageSize: 1 },
        });
      }

      if (url === "/api/approvals" && init?.method === "POST") {
        assert.deepEqual(readBody(init), {
          channelId: "ch_historia",
          entityType: "script",
          entityId: "sc_01",
          requestedBy: "Ana Ribeiro",
          title: "Aprovar roteiro",
          summary: "Resumo",
        });

        return jsonResponse({
          data: {
            id: "ap_2",
            channelId: "ch_historia",
            entityType: "script",
            entityId: "sc_01",
            title: "Aprovar roteiro",
            status: "pending",
            riskLevel: "ok",
            summary: "Resumo",
            requestedAt: "2026-07-13T03:30:00.000Z",
            requestedBy: "Ana Ribeiro",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
            targetSnapshot: {
              entityType: "script",
              entityId: "sc_01",
              channelId: "ch_historia",
              title: "Script",
              summary: "Resumo",
              status: "script",
              riskLevel: "ok",
            },
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/approvals/ap_2/approve" && init?.method === "POST") {
        assert.deepEqual(readBody(init), {
          decidedBy: "Ana Ribeiro",
          decisionReason: "Aprovado.",
        });

        return jsonResponse({
          data: {
            id: "ap_2",
            channelId: "ch_historia",
            entityType: "script",
            entityId: "sc_01",
            title: "Aprovar roteiro",
            status: "approved",
            riskLevel: "ok",
            summary: "Resumo",
            requestedAt: "2026-07-13T03:30:00.000Z",
            requestedBy: "Ana Ribeiro",
            decidedAt: "2026-07-13T03:31:00.000Z",
            decidedBy: "Ana Ribeiro",
            decisionReason: "Aprovado.",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:31:00.000Z",
            targetSnapshot: {
              entityType: "script",
              entityId: "sc_01",
              channelId: "ch_historia",
              title: "Script",
              summary: "Resumo",
              status: "script",
              riskLevel: "ok",
            },
            qualityCheckId: "qc_1",
            complianceCheckId: "cc_1",
            latestDecisionId: "ad_1",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/approvals/ap_2/reject" && init?.method === "POST") {
        assert.deepEqual(readBody(init), {
          decidedBy: "Ana Ribeiro",
          decisionReason: "Nao aprovado.",
        });
        return jsonResponse({
          data: {
            id: "ap_2",
            channelId: "ch_historia",
            entityType: "script",
            entityId: "sc_01",
            title: "Aprovar roteiro",
            status: "rejected",
            riskLevel: "ok",
            summary: "Resumo",
            requestedAt: "2026-07-13T03:30:00.000Z",
            requestedBy: "Ana Ribeiro",
            decidedAt: "2026-07-13T03:31:00.000Z",
            decidedBy: "Ana Ribeiro",
            decisionReason: "Nao aprovado.",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:31:00.000Z",
            targetSnapshot: {
              entityType: "script",
              entityId: "sc_01",
              channelId: "ch_historia",
              title: "Script",
              summary: "Resumo",
              status: "script",
              riskLevel: "ok",
            },
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/approvals/ap_2/request-changes" && init?.method === "POST") {
        assert.deepEqual(readBody(init), {
          decidedBy: "Ana Ribeiro",
          decisionReason: "Ajustes pendentes.",
        });

        return jsonResponse({
          data: {
            id: "ap_2",
            channelId: "ch_historia",
            entityType: "script",
            entityId: "sc_01",
            title: "Aprovar roteiro",
            status: "changes_requested",
            riskLevel: "ok",
            summary: "Resumo",
            requestedAt: "2026-07-13T03:30:00.000Z",
            requestedBy: "Ana Ribeiro",
            decidedAt: "2026-07-13T03:31:00.000Z",
            decidedBy: "Ana Ribeiro",
            decisionReason: "Ajustes pendentes.",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:31:00.000Z",
            targetSnapshot: {
              entityType: "script",
              entityId: "sc_01",
              channelId: "ch_historia",
              title: "Script",
              summary: "Resumo",
              status: "script",
              riskLevel: "ok",
            },
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/approvals/ap_2/history") {
        return jsonResponse({
          data: [
            {
              id: "ad_1",
              approvalId: "ap_2",
              previousStatus: "pending",
              nextStatus: "approved",
              decision: "approve",
              justification: "Aprovado.",
              actor: "Ana Ribeiro",
              decidedAt: "2026-07-13T03:31:00.000Z",
              createdAt: "2026-07-13T03:31:00.000Z",
            },
          ],
          meta: baseMeta,
        });
      }

      if (
        url ===
        "/api/quality-checks?channelId=ch_historia&status=passed&riskLevel=blocked&entityType=visual_plan&entityId=vp_01"
      ) {
        return jsonResponse({
          data: [
            {
              id: "qc_1",
              channelId: "ch_historia",
              entityType: "visual_plan",
              entityId: "vp_01",
              status: "blocked",
              score: 60,
              checks: [],
              findings: [],
              blockingFindings: [],
              checkedAt: "2026-07-13T03:30:00.000Z",
              createdAt: "2026-07-13T03:30:00.000Z",
              updatedAt: "2026-07-13T03:30:00.000Z",
              targetSnapshot: {
                entityType: "visual_plan",
                entityId: "vp_01",
                channelId: "ch_historia",
                title: "Plano visual",
                summary: "Resumo",
                status: "visual_plan",
                riskLevel: "blocked",
              },
              summary: "Plano visual verificado.",
            },
          ],
          meta: { ...baseMeta, total: 1, page: 1, pageSize: 1 },
        });
      }

      if (url === "/api/quality-checks" && init?.method === "POST") {
        assert.deepEqual(readBody(init), {
          channelId: "ch_historia",
          entityType: "script",
          entityId: "sc_01",
        });

        return jsonResponse({
          data: {
            id: "qc_2",
            channelId: "ch_historia",
            entityType: "script",
            entityId: "sc_01",
            status: "passed",
            score: 96,
            checks: [],
            findings: [],
            blockingFindings: [],
            checkedAt: "2026-07-13T03:30:00.000Z",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
            targetSnapshot: {
              entityType: "script",
              entityId: "sc_01",
              channelId: "ch_historia",
              title: "Script",
              summary: "Resumo",
              status: "script",
              riskLevel: "ok",
            },
            summary: "Script verificado.",
          },
          meta: baseMeta,
        });
      }

      if (
        url ===
        "/api/compliance-checks?channelId=ch_historia&status=blocked&riskLevel=blocked&entityType=research_session&entityId=rs_01"
      ) {
        return jsonResponse({
          data: [
            {
              id: "cc_1",
              channelId: "ch_historia",
              entityType: "research_session",
              entityId: "rs_01",
              status: "blocked",
              riskLevel: "blocked",
              findings: [],
              blockingFindings: [],
              checkedAt: "2026-07-13T03:30:00.000Z",
              createdAt: "2026-07-13T03:30:00.000Z",
              updatedAt: "2026-07-13T03:30:00.000Z",
              targetSnapshot: {
                entityType: "research_session",
                entityId: "rs_01",
                channelId: "ch_historia",
                title: "Pesquisa",
                summary: "Resumo",
                status: "running",
                riskLevel: "blocked",
              },
              requiresHumanReview: true,
            },
          ],
          meta: { ...baseMeta, total: 1, page: 1, pageSize: 1 },
        });
      }

      if (url === "/api/compliance-checks" && init?.method === "POST") {
        assert.deepEqual(readBody(init), {
          channelId: "ch_historia",
          entityType: "research_session",
          entityId: "rs_01",
        });

        return jsonResponse({
          data: {
            id: "cc_2",
            channelId: "ch_historia",
            entityType: "research_session",
            entityId: "rs_01",
            status: "needs_human_review",
            riskLevel: "attention",
            findings: [],
            blockingFindings: [],
            checkedAt: "2026-07-13T03:30:00.000Z",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
            targetSnapshot: {
              entityType: "research_session",
              entityId: "rs_01",
              channelId: "ch_historia",
              title: "Pesquisa",
              summary: "Resumo",
              status: "running",
              riskLevel: "attention",
            },
            requiresHumanReview: true,
          },
          meta: baseMeta,
        });
      }

      throw new Error(`Unexpected request: ${url}`);
    },
    async (calls) => {
      const approvals = await getApprovals({
        channelId: "ch_historia",
        status: "pending",
        riskLevel: "attention",
        entityType: "script",
        entityId: "sc_01",
      });
      assert.equal(approvals.data.length, 1);

      const created = await createApproval({
        channelId: "ch_historia",
        entityType: "script",
        entityId: "sc_01",
        requestedBy: "Ana Ribeiro",
        title: "Aprovar roteiro",
        summary: "Resumo",
      });
      assert.equal(created.data.id, "ap_2");

      const approved = await approveApproval("ap_2", {
        decidedBy: "Ana Ribeiro",
        decisionReason: "Aprovado.",
      });
      assert.equal(approved.data.status, "approved");

      const rejected = await rejectApproval("ap_2", {
        decidedBy: "Ana Ribeiro",
        decisionReason: "Nao aprovado.",
      });
      assert.equal(rejected.data.status, "rejected");

      const changesRequested = await requestApprovalChanges("ap_2", {
        decidedBy: "Ana Ribeiro",
        decisionReason: "Ajustes pendentes.",
      });
      assert.equal(changesRequested.data.status, "changes_requested");

      const history = await getApprovalHistory("ap_2");
      assert.equal(history.data[0].approvalId, "ap_2");

      const qualityChecks = await getQualityChecks({
        channelId: "ch_historia",
        status: "passed",
        riskLevel: "blocked",
        entityType: "visual_plan",
        entityId: "vp_01",
      });
      assert.equal(qualityChecks.data[0].entityId, "vp_01");

      const qualityCreated = await createQualityCheck({
        channelId: "ch_historia",
        entityType: "script",
        entityId: "sc_01",
      });
      assert.equal(qualityCreated.data.id, "qc_2");

      const complianceChecks = await getComplianceChecks({
        channelId: "ch_historia",
        status: "blocked",
        riskLevel: "blocked",
        entityType: "research_session",
        entityId: "rs_01",
      });
      assert.equal(complianceChecks.data[0].entityId, "rs_01");

      const complianceCreated = await createComplianceCheck({
        channelId: "ch_historia",
        entityType: "research_session",
        entityId: "rs_01",
      });
      assert.equal(complianceCreated.data.id, "cc_2");

      assert.equal(calls.length, 10);
      assert.equal(
        calls[0].url,
        "/api/approvals?channelId=ch_historia&status=pending&riskLevel=attention&entityType=script&entityId=sc_01",
      );
      assert.equal(calls[0].init?.method, undefined);
      assert.equal(calls[1].url, "/api/approvals");
      assert.equal(calls[1].init?.method, "POST");
      assert.equal(calls[2].url, "/api/approvals/ap_2/approve");
      assert.equal(calls[3].url, "/api/approvals/ap_2/reject");
      assert.equal(calls[4].url, "/api/approvals/ap_2/request-changes");
      assert.equal(calls[5].url, "/api/approvals/ap_2/history");
      assert.equal(
        calls[6].url,
        "/api/quality-checks?channelId=ch_historia&status=passed&riskLevel=blocked&entityType=visual_plan&entityId=vp_01",
      );
      assert.equal(calls[7].url, "/api/quality-checks");
      assert.equal(
        calls[8].url,
        "/api/compliance-checks?channelId=ch_historia&status=blocked&riskLevel=blocked&entityType=research_session&entityId=rs_01",
      );
      assert.equal(calls[9].url, "/api/compliance-checks");
    },
  );
});

test("governance API clients surface transport errors and timeout semantics", async () => {
  await withFetchStub(
    async (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      }),
    async () => {
      await assert.rejects(
        () => requestApiEnvelope("/approvals", {}, { timeoutMs: 1 }),
        (error) => {
          assert.ok(error instanceof ApiRequestError);
          assert.equal(error.kind, "timeout");
          return true;
        },
      );

      assert.equal(
        describeApprovalsApiError(
          new ApiRequestError({
            kind: "timeout",
            url: "/api/approvals",
            message: "timeout",
          }),
        ),
        "A requisicao de aprovacoes expirou. Tente novamente.",
      );

      assert.equal(
        describeComplianceApiError(
          new ApiRequestError({
            kind: "unexpected_envelope",
            url: "/api/compliance-checks",
            message: "blocked",
            status: 409,
            code: "COMPLIANCE_BLOCKED",
          }),
        ),
        "A conformidade bloqueou o item.",
      );

      assert.equal(
        describeQualityApiError(
          new ApiRequestError({
            kind: "unexpected_envelope",
            url: "/api/quality-checks",
            message: "missing",
            status: 404,
          }),
        ),
        "Verificacao de qualidade nao encontrada.",
      );
    },
  );
});

test("governance detail clients preserve the active channel scope", async () => {
  const baseMeta = { requestId: "req_scope", generatedAt: "2026-07-13T03:30:00.000Z" };

  await withFetchStub(
    async (url) => {
      assert.equal(url, "/api/approvals/ap_2/history?channelId=ch_historia");
      return jsonResponse({ data: [], meta: baseMeta });
    },
    async () => {
      const history = await getApprovalHistory("ap_2", "ch_historia");
      assert.deepEqual(history.data, []);
    },
  );
});
