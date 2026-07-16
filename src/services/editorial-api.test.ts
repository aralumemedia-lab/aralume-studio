import assert from "node:assert/strict";
import test from "node:test";

import {
  createContentIdea,
  describeEditorialApiError,
  getContentIdeas,
  getProductionItems,
  updateContentIdea,
} from "./editorial-api";
import {
  createClaimEvidence,
  createResearchSession,
  createResearchSource,
  describeResearchApiError,
  getResearchSession,
  getResearchSessions,
  getResearchSources,
  getClaimEvidenceList,
} from "./research-api";
import {
  createScript,
  createScriptVersion,
  describeScriptsApiError,
  getScript,
  getScriptVersions,
  getScripts,
  updateScript,
} from "./scripts-api";
import {
  createScenePlan,
  createVisualPlan,
  describeVisualPlanApiError,
  getVisualPlan,
  getVisualPlans,
  updateVisualPlan,
} from "./visual-plans-api";
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

test("editorial frontend services hit the expected API endpoints", async () => {
  const baseMeta = { requestId: "req_1", generatedAt: "2026-07-13T03:30:00.000Z" };

  await withFetchStub(
    async (url, init) => {
      if (url === "/api/content-ideas?channelId=ch_1") {
        return jsonResponse({ data: [], meta: { ...baseMeta, total: 0, page: 1, pageSize: 0 } });
      }

      if (url === "/api/content-ideas" && init?.method === "POST") {
        return jsonResponse({
          data: {
            id: "idea_1",
            channelId: "ch_1",
            title: "Ideia",
            summary: "Resumo",
            niche: "Historia",
            source: "Seed",
            opportunityScore: 80,
            originalityScore: 70,
            visualPotentialScore: 75,
            clipPotentialScore: 60,
            riskLevel: "ok",
            status: "idea",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/content-ideas/idea_1" && init?.method === "PATCH") {
        return jsonResponse({
          data: {
            id: "idea_1",
            channelId: "ch_1",
            title: "Ideia editada",
            summary: "Resumo",
            niche: "Historia",
            source: "Seed",
            opportunityScore: 80,
            originalityScore: 70,
            visualPotentialScore: 75,
            clipPotentialScore: 60,
            riskLevel: "ok",
            status: "research",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:01.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/production-items?channelId=ch_1") {
        return jsonResponse({ data: [], meta: { ...baseMeta, total: 0, page: 1, pageSize: 0 } });
      }

      if (url === "/api/research-sessions?channelId=ch_1") {
        return jsonResponse({ data: [], meta: { ...baseMeta, total: 0, page: 1, pageSize: 0 } });
      }

      if (url === "/api/research-sessions" && init?.method === "POST") {
        return jsonResponse({
          data: {
            id: "rs_1",
            channelId: "ch_1",
            contentId: "idea_1",
            title: "Sessao",
            status: "running",
            sourceCount: 0,
            claimCount: 0,
            confidenceScore: 80,
            riskLevel: "ok",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/research-sessions/rs_1") {
        return jsonResponse({
          data: {
            id: "rs_1",
            channelId: "ch_1",
            contentId: "idea_1",
            title: "Sessao",
            status: "running",
            sourceCount: 1,
            claimCount: 1,
            confidenceScore: 80,
            riskLevel: "ok",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/research-sessions/rs_1/sources" && init?.method === "POST") {
        return jsonResponse({
          data: {
            id: "src_1",
            channelId: "ch_1",
            researchSessionId: "rs_1",
            title: "Fonte",
            accessedAt: "2026-07-13T03:30:00.000Z",
            sourceType: "article",
            confidenceLevel: "high",
            freshnessRisk: "ok",
            usageNotes: "Notas",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/research-sessions/rs_1/sources" && !init?.method) {
        return jsonResponse({
          data: [
            {
              id: "src_1",
              channelId: "ch_1",
              researchSessionId: "rs_1",
              title: "Fonte",
              accessedAt: "2026-07-13T03:30:00.000Z",
              sourceType: "article",
              confidenceLevel: "high",
              freshnessRisk: "ok",
              usageNotes: "Notas",
            },
          ],
          meta: { ...baseMeta, total: 1, page: 1, pageSize: 1 },
        });
      }

      if (url === "/api/research-sessions/rs_1/claims" && init?.method === "POST") {
        return jsonResponse({
          data: {
            id: "ce_1",
            channelId: "ch_1",
            researchSessionId: "rs_1",
            sourceId: "src_1",
            claim: "Claim",
            evidenceSummary: "Resumo",
            informationType: "fact",
            confidenceLevel: "high",
            riskLevel: "ok",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/research-sessions/rs_1/claims" && !init?.method) {
        return jsonResponse({
          data: [
            {
              id: "ce_1",
              channelId: "ch_1",
              researchSessionId: "rs_1",
              sourceId: "src_1",
              claim: "Claim",
              evidenceSummary: "Resumo",
              informationType: "fact",
              confidenceLevel: "high",
              riskLevel: "ok",
            },
          ],
          meta: { ...baseMeta, total: 1, page: 1, pageSize: 1 },
        });
      }

      if (url === "/api/scripts?channelId=ch_1") {
        return jsonResponse({ data: [], meta: { ...baseMeta, total: 0, page: 1, pageSize: 0 } });
      }

      if (url === "/api/scripts" && init?.method === "POST") {
        return jsonResponse({
          data: {
            id: "sc_1",
            channelId: "ch_1",
            contentId: "idea_1",
            title: "Roteiro",
            status: "script",
            currentVersionId: "scv_1",
            estimatedDurationSeconds: 600,
            hook: "Hook",
            promise: "Promise",
            cta: "CTA",
            riskLevel: "ok",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/scripts/sc_1") {
        return jsonResponse({
          data: {
            id: "sc_1",
            channelId: "ch_1",
            contentId: "idea_1",
            title: "Roteiro",
            status: "script",
            currentVersionId: "scv_2",
            estimatedDurationSeconds: 620,
            hook: "Hook",
            promise: "Promise",
            cta: "CTA",
            riskLevel: "ok",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/scripts/sc_1/versions" && !init?.method) {
        return jsonResponse({ data: [], meta: { ...baseMeta, total: 0, page: 1, pageSize: 0 } });
      }

      if (url === "/api/scripts/sc_1/versions" && init?.method === "POST") {
        return jsonResponse({
          data: {
            id: "scv_2",
            channelId: "ch_1",
            scriptId: "sc_1",
            versionNumber: 2,
            title: "Roteiro - v2",
            narrationText: "Texto",
            sceneCount: 4,
            estimatedDurationSeconds: 620,
            changeSummary: "Ajuste",
            createdAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/visual-plans?channelId=ch_1") {
        return jsonResponse({ data: [], meta: { ...baseMeta, total: 0, page: 1, pageSize: 0 } });
      }

      if (url === "/api/visual-plans" && init?.method === "POST") {
        return jsonResponse({
          data: {
            id: "vp_1",
            channelId: "ch_1",
            contentId: "idea_1",
            scriptVersionId: "scv_2",
            title: "Plano",
            status: "visual_plan",
            sceneCount: 4,
            estimatedDurationSeconds: 620,
            visualStyle: "Cinematografico",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/visual-plans/vp_1") {
        return jsonResponse({
          data: {
            id: "vp_1",
            channelId: "ch_1",
            contentId: "idea_1",
            scriptVersionId: "scv_2",
            title: "Plano",
            status: "visual_plan",
            sceneCount: 4,
            estimatedDurationSeconds: 620,
            visualStyle: "Cinematografico",
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      if (url === "/api/visual-plans/vp_1/scenes" && init?.method === "POST") {
        return jsonResponse({
          data: {
            id: "scn_1",
            channelId: "ch_1",
            visualPlanId: "vp_1",
            order: 1,
            title: "Cena",
            narrationExcerpt: "Texto",
            durationSeconds: 30,
            visualDescription: "Descricao",
            assetRequirements: ["asset-a"],
            createdAt: "2026-07-13T03:30:00.000Z",
            updatedAt: "2026-07-13T03:30:00.000Z",
          },
          meta: baseMeta,
        });
      }

      throw new Error(`Unexpected request: ${url}`);
    },
    async (calls) => {
      await getContentIdeas({ channelId: "ch_1" });
      await createContentIdea({
        channelId: "ch_1",
        title: "Ideia",
        summary: "Resumo",
        niche: "Historia",
        source: "Seed",
        opportunityScore: 80,
        originalityScore: 70,
        visualPotentialScore: 75,
        clipPotentialScore: 60,
        riskLevel: "ok",
        status: "idea",
      });
      await updateContentIdea("idea_1", { title: "Ideia editada" });
      await getProductionItems({ channelId: "ch_1" });
      await getResearchSessions({ channelId: "ch_1" });
      await createResearchSession({
        channelId: "ch_1",
        contentId: "idea_1",
        title: "Sessao",
        status: "running",
        sourceCount: 0,
        claimCount: 0,
        confidenceScore: 80,
        riskLevel: "ok",
      });
      await getResearchSession("rs_1");
      await createResearchSource("rs_1", {
        title: "Fonte",
        accessedAt: "2026-07-13T03:30:00.000Z",
        sourceType: "article",
        confidenceLevel: "high",
        freshnessRisk: "ok",
        usageNotes: "Notas",
      });
      await getResearchSources("rs_1");
      await createClaimEvidence("rs_1", {
        sourceId: "src_1",
        claim: "Claim",
        evidenceSummary: "Resumo",
        informationType: "fact",
        confidenceLevel: "high",
        riskLevel: "ok",
      });
      await getClaimEvidenceList("rs_1");
      await getScripts({ channelId: "ch_1" });
      await createScript({
        channelId: "ch_1",
        contentId: "idea_1",
        title: "Roteiro",
        status: "script",
        estimatedDurationSeconds: 600,
        hook: "Hook",
        promise: "Promise",
        cta: "CTA",
        riskLevel: "ok",
        initialVersion: {
          narrationText: "Texto",
          sceneCount: 4,
          changeSummary: "Inicial",
        },
      });
      await getScript("sc_1");
      await updateScript("sc_1", { title: "Roteiro editado" });
      await getScriptVersions("sc_1");
      await createScriptVersion("sc_1", {
        versionNumber: 2,
        narrationText: "Texto",
        sceneCount: 4,
        changeSummary: "Ajuste",
      });
      await getVisualPlans({ channelId: "ch_1" });
      await createVisualPlan({
        channelId: "ch_1",
        contentId: "idea_1",
        scriptVersionId: "scv_2",
        title: "Plano",
        status: "visual_plan",
        sceneCount: 4,
        estimatedDurationSeconds: 620,
        visualStyle: "Cinematografico",
      });
      await getVisualPlan("vp_1");
      await updateVisualPlan("vp_1", { title: "Plano editado" });
      await createScenePlan("vp_1", {
        order: 1,
        title: "Cena",
        narrationExcerpt: "Texto",
        durationSeconds: 30,
        visualDescription: "Descricao",
        assetRequirements: ["asset-a"],
      });

      assert.equal(calls[0].url, "/api/content-ideas?channelId=ch_1");
      assert.equal(
        calls.some((call) => call.url === "/api/content-ideas" && call.init?.method === "POST"),
        true,
      );
      assert.equal(
        calls.some((call) => call.url === "/api/research-sessions/rs_1/sources"),
        true,
      );
      assert.equal(
        calls.some(
          (call) => call.url === "/api/research-sessions/rs_1/sources" && !call.init?.method,
        ),
        true,
      );
      assert.equal(
        calls.some(
          (call) => call.url === "/api/research-sessions/rs_1/claims" && !call.init?.method,
        ),
        true,
      );
      assert.equal(
        calls.some(
          (call) => call.url === "/api/scripts/sc_1/versions" && call.init?.method === "POST",
        ),
        true,
      );
      assert.equal(
        calls.some((call) => call.url === "/api/visual-plans/vp_1/scenes"),
        true,
      );

      assert.equal(
        describeEditorialApiError(
          new ApiRequestError({
            kind: "unexpected_envelope",
            url: "/api/content-ideas",
            status: 404,
            code: "NOT_FOUND",
            message: "Ideia nao encontrada",
          }),
          "ideas",
        ),
        "Ideia nao encontrada.",
      );
      assert.equal(
        describeResearchApiError(
          new ApiRequestError({
            kind: "unexpected_envelope",
            url: "/api/research-sessions",
            status: 404,
            code: "NOT_FOUND",
            message: "Pesquisa nao encontrada",
          }),
        ),
        "Pesquisa nao encontrada.",
      );
      assert.equal(
        describeScriptsApiError(
          new ApiRequestError({
            kind: "unexpected_envelope",
            url: "/api/scripts",
            status: 409,
            code: "CONFLICT",
            message: "Conflito",
          }),
        ),
        "O roteiro entrou em conflito.",
      );
      assert.equal(
        describeVisualPlanApiError(
          new ApiRequestError({
            kind: "unexpected_envelope",
            url: "/api/visual-plans",
            status: 400,
            code: "VALIDATION_ERROR",
            message: "Invalid",
          }),
        ),
        "Os dados do plano visual enviados sao invalidos.",
      );
    },
  );
});
