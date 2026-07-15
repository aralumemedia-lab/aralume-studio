import assert from "node:assert/strict";
import test from "node:test";

import { ApiRequestError } from "./http-client";
import {
  createPublicationJob,
  createPublicationTarget,
  describePublicationsApiError,
  getPublicationJobs,
  getPublicationTargets,
  reschedulePublicationJob,
} from "./publications-api";

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

function readBody(init?: RequestInit): Record<string, unknown> {
  return JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
}

test("publication API clients call the expected endpoints and preserve payloads", async () => {
  const baseMeta = { requestId: "req_1", generatedAt: "2026-07-13T03:30:00.000Z" };

  await withFetchStub(
    async (url, init) => {
      if (
        url === "/api/publication-targets?channelId=ch_historia" ||
        url === "/api/publications?channelId=ch_historia"
      ) {
        return jsonResponse({
          data:
            url === "/api/publication-targets?channelId=ch_historia"
              ? [
                  {
                    id: "pt_1",
                    channelId: "ch_historia",
                    platform: "youtube",
                    accountName: "Aralume Historia",
                    status: "authenticated",
                    lastConnectedAt: "2026-07-13T03:30:00.000Z",
                    tokenExpiresAt: "2026-08-13T03:30:00.000Z",
                    sourceContentId: "idea_06",
                    sourceVideoAssetId: "vd_historia_01",
                    latestPublicationJobId: "pj_1",
                    latestApprovalId: "ap_1",
                    latestComplianceCheckId: "cc_1",
                    readinessStatus: "ready",
                    readinessReason: "Target is ready for assisted publication.",
                    readinessReasons: ["Target is ready for assisted publication."],
                    createdAt: "2026-07-13T03:30:00.000Z",
                    updatedAt: "2026-07-13T03:30:00.000Z",
                  },
                ]
              : [
                  {
                    id: "pj_1",
                    channelId: "ch_historia",
                    publicationTargetId: "pt_1",
                    contentId: "idea_06",
                    sourceVideoAssetId: "vd_historia_01",
                    platform: "youtube",
                    title: "A logistica do Imperio Romano",
                    description: "Pacote assistido.",
                    idempotencyKey: "publication:ch_historia:vd_historia_01:youtube:001",
                    scheduledAt: "2026-07-15T13:00:00.000Z",
                    status: "scheduled",
                    approvalId: "ap_1",
                    complianceCheckId: "cc_1",
                    createdAt: "2026-07-13T03:30:00.000Z",
                    updatedAt: "2026-07-13T03:30:00.000Z",
                  },
                ],
          meta: { ...baseMeta, total: 1, page: 1, pageSize: 1 },
        });
      }

      if (
        url ===
        "/api/publication-targets?channelId=ch_historia&platform=youtube&status=authenticated&readinessStatus=ready"
      ) {
        return jsonResponse({
          data: [
            {
              id: "pt_1",
              channelId: "ch_historia",
              platform: "youtube",
              accountName: "Aralume Historia",
              status: "authenticated",
              lastConnectedAt: "2026-07-13T03:30:00.000Z",
              tokenExpiresAt: "2026-08-13T03:30:00.000Z",
              sourceContentId: "idea_06",
              sourceVideoAssetId: "vd_historia_01",
              latestPublicationJobId: "pj_1",
              latestApprovalId: "ap_1",
              latestComplianceCheckId: "cc_1",
              readinessStatus: "ready",
              readinessReason: "Target is ready for assisted publication.",
              readinessReasons: ["Target is ready for assisted publication."],
              createdAt: "2026-07-13T03:30:00.000Z",
              updatedAt: "2026-07-13T03:30:00.000Z",
            },
          ],
          meta: { ...baseMeta, total: 1, page: 1, pageSize: 1 },
        });
      }

      if (url === "/api/publication-targets" && init?.method === "POST") {
        assert.deepEqual(readBody(init), {
          id: "pt_2",
          channelId: "ch_historia",
          platform: "linkedin",
          accountName: "Aralume Historia LinkedIn",
          status: "authenticated",
          lastConnectedAt: "2026-07-13T03:30:00.000Z",
          tokenExpiresAt: "2026-08-13T03:30:00.000Z",
          sourceContentId: "idea_06",
          sourceVideoAssetId: "vd_historia_01",
          requestedBy: "Ana Ribeiro",
        });

        return jsonResponse({
          data: {
            id: "pt_2",
            channelId: "ch_historia",
            platform: "linkedin",
            accountName: "Aralume Historia LinkedIn",
            status: "authenticated",
            lastConnectedAt: "2026-07-13T03:30:00.000Z",
            tokenExpiresAt: "2026-08-13T03:30:00.000Z",
            sourceContentId: "idea_06",
            sourceVideoAssetId: "vd_historia_01",
            latestPublicationJobId: undefined,
            latestApprovalId: undefined,
            latestComplianceCheckId: undefined,
            readinessStatus: "ready",
            readinessReason: "Target is ready for assisted publication.",
            readinessReasons: ["Target is ready for assisted publication."],
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (
        url ===
        "/api/publications?channelId=ch_historia&platform=youtube&status=scheduled&publicationTargetId=pt_1&contentId=idea_06&sourceVideoAssetId=vd_historia_01&idempotencyKey=publication%3Ach_historia%3Avd_historia_01%3Ayoutube%3A001"
      ) {
        return jsonResponse({
          data: [
            {
              id: "pj_1",
              channelId: "ch_historia",
              publicationTargetId: "pt_1",
              contentId: "idea_06",
              sourceVideoAssetId: "vd_historia_01",
              platform: "youtube",
              title: "A logistica do Imperio Romano",
              description: "Pacote assistido.",
              idempotencyKey: "publication:ch_historia:vd_historia_01:youtube:001",
              scheduledAt: "2026-07-15T13:00:00.000Z",
              status: "scheduled",
              approvalId: "ap_1",
              complianceCheckId: "cc_1",
              createdAt: "2026-07-13T03:30:00.000Z",
              updatedAt: "2026-07-13T03:30:00.000Z",
            },
          ],
          meta: { ...baseMeta, total: 1, page: 1, pageSize: 1 },
        });
      }

      if (url === "/api/publications" && init?.method === "POST") {
        assert.deepEqual(readBody(init), {
          channelId: "ch_historia",
          publicationTargetId: "pt_1",
          contentId: "idea_06",
          sourceVideoAssetId: "vd_historia_01",
          title: "A logistica do Imperio Romano",
          description: "Pacote assistido.",
          idempotencyKey: "publication:ch_historia:vd_historia_01:youtube:001",
          scheduledAt: "2026-07-15T13:00:00.000Z",
          requestedBy: "Ana Ribeiro",
        });

        return jsonResponse({
          data: {
            id: "pj_1",
            channelId: "ch_historia",
            publicationTargetId: "pt_1",
            contentId: "idea_06",
            sourceVideoAssetId: "vd_historia_01",
            platform: "youtube",
            title: "A logistica do Imperio Romano",
            description: "Pacote assistido.",
            idempotencyKey: "publication:ch_historia:vd_historia_01:youtube:001",
            scheduledAt: "2026-07-15T13:00:00.000Z",
            status: "scheduled",
            approvalId: "ap_1",
            complianceCheckId: "cc_1",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/publications/pj_1/reschedule" && init?.method === "POST") {
        assert.deepEqual(readBody(init), {
          channelId: "ch_historia",
          scheduledAt: null,
          requestedBy: "Ana Ribeiro",
        });

        return jsonResponse({
          data: {
            id: "pj_1",
            channelId: "ch_historia",
            publicationTargetId: "pt_1",
            contentId: "idea_06",
            sourceVideoAssetId: "vd_historia_01",
            platform: "youtube",
            title: "A logistica do Imperio Romano",
            description: "Pacote assistido.",
            idempotencyKey: "publication:ch_historia:vd_historia_01:youtube:001",
            status: "draft",
            approvalId: "ap_1",
            complianceCheckId: "cc_1",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:01.000Z",
          },
          meta: baseMeta,
        });
      }

      throw new Error(`Unexpected request: ${url}`);
    },
    async (calls) => {
      const stringTargets = await getPublicationTargets("ch_historia");
      assert.equal(stringTargets.data[0].id, "pt_1");

      const stringJobs = await getPublicationJobs("ch_historia");
      assert.equal(stringJobs.data[0].id, "pj_1");

      const targets = await getPublicationTargets({
        channelId: "ch_historia",
        platform: "youtube",
        status: "authenticated",
        readinessStatus: "ready",
      });
      assert.equal(targets.data[0].id, "pt_1");

      const createdTarget = await createPublicationTarget({
        id: "pt_2",
        channelId: "ch_historia",
        platform: "linkedin",
        accountName: "Aralume Historia LinkedIn",
        status: "authenticated",
        lastConnectedAt: "2026-07-13T03:30:00.000Z",
        tokenExpiresAt: "2026-08-13T03:30:00.000Z",
        sourceContentId: "idea_06",
        sourceVideoAssetId: "vd_historia_01",
        requestedBy: "Ana Ribeiro",
      });
      assert.equal(createdTarget.data.id, "pt_2");

      const jobs = await getPublicationJobs({
        channelId: "ch_historia",
        platform: "youtube",
        status: "scheduled",
        publicationTargetId: "pt_1",
        contentId: "idea_06",
        sourceVideoAssetId: "vd_historia_01",
        idempotencyKey: "publication:ch_historia:vd_historia_01:youtube:001",
      });
      assert.equal(jobs.data.length, 1);

      const createdJob = await createPublicationJob({
        channelId: "ch_historia",
        publicationTargetId: "pt_1",
        contentId: "idea_06",
        sourceVideoAssetId: "vd_historia_01",
        title: "A logistica do Imperio Romano",
        description: "Pacote assistido.",
        idempotencyKey: "publication:ch_historia:vd_historia_01:youtube:001",
        scheduledAt: "2026-07-15T13:00:00.000Z",
        requestedBy: "Ana Ribeiro",
      });
      assert.equal(createdJob.data.status, "scheduled");

      const rescheduledJob = await reschedulePublicationJob("pj_1", {
        channelId: "ch_historia",
        scheduledAt: null,
        requestedBy: "Ana Ribeiro",
      });
      assert.equal(rescheduledJob.data.status, "draft");

      assert.equal(calls.length, 7);
      assert.equal(calls[0].url, "/api/publication-targets?channelId=ch_historia");
      assert.equal(calls[1].url, "/api/publications?channelId=ch_historia");
      assert.equal(
        calls[2].url,
        "/api/publication-targets?channelId=ch_historia&platform=youtube&status=authenticated&readinessStatus=ready",
      );
      assert.equal(calls[3].url, "/api/publication-targets");
      assert.equal(calls[3].init?.method, "POST");
      assert.equal(
        calls[4].url,
        "/api/publications?channelId=ch_historia&platform=youtube&status=scheduled&publicationTargetId=pt_1&contentId=idea_06&sourceVideoAssetId=vd_historia_01&idempotencyKey=publication%3Ach_historia%3Avd_historia_01%3Ayoutube%3A001",
      );
      assert.equal(calls[5].url, "/api/publications");
      assert.equal(calls[5].init?.method, "POST");
      assert.equal(calls[6].url, "/api/publications/pj_1/reschedule");
      assert.equal(calls[6].init?.method, "POST");
    },
  );
});

test("publication API clients surface transport and domain errors", () => {
  assert.equal(
    describePublicationsApiError(
      new ApiRequestError({
        kind: "network",
        url: "/api/publications",
        message: "network",
      }),
    ),
    "Backend indisponivel. Tente novamente.",
  );

  assert.equal(
    describePublicationsApiError(
      new ApiRequestError({
        kind: "timeout",
        url: "/api/publications",
        message: "timeout",
      }),
    ),
    "A requisicao de publicacoes expirou. Tente novamente.",
  );

  assert.equal(
    describePublicationsApiError(
      new ApiRequestError({
        kind: "unexpected_envelope",
        url: "/api/publications",
        message: "blocked",
        status: 409,
        code: "COMPLIANCE_BLOCKED",
      }),
    ),
    "A publicacao foi bloqueada por conformidade.",
  );

  assert.equal(
    describePublicationsApiError(
      new ApiRequestError({
        kind: "unexpected_envelope",
        url: "/api/publications",
        message: "blocked",
        status: 409,
        code: "OPERATION_BLOCKED",
      }),
    ),
    "A publicacao foi bloqueada por aprovacao, readiness ou eligibility.",
  );
});
