import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import test from "node:test";

import { createApp } from "../src/app.js";
import { createAuditRepository } from "../src/modules/audit/audit.repository.js";
import { createChannelsRepository } from "../src/modules/channels/channel.repository.js";
import { createChannelsService } from "../src/modules/channels/channel.service.js";
import { createEditorialRepository } from "../src/modules/editorial/editorial.repository.js";

type JsonData = {
  id?: string;
  currentVersionId?: string;
  action?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  length: number;
  some(predicate: (value: JsonData) => boolean): boolean;
  [key: string]: unknown;
};

type Json = {
  data: JsonData;
  meta: { requestId: string };
  error: { code: string; details: Record<string, unknown> };
};

async function startHarness() {
  const channelsRepository = createChannelsRepository([]);
  const channelsService = createChannelsService(channelsRepository, {
    idFactory: (() => {
      let id = 0;
      return () => String(++id).padStart(4, "0");
    })(),
  });
  const editorialRepository = createEditorialRepository();
  const auditRepository = createAuditRepository();
  const app = createApp({
    authTestBypass: true,
    env: { ARALUME_ENV: "test", ARALUME_LOG_LEVEL: "error" },
    logger: { info: () => undefined, warn: () => undefined, error: () => undefined },
    channelsRepository,
    editorialRepository,
    auditRepository,
  });
  const server = app.listen(0);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    server,
    channelsService,
    auditRepository,
  };
}

async function stopServer(server: Server) {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function request(baseUrl: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
  const body = (await response.json()) as Json;
  return { response, body };
}

function postBody(body: unknown, requestId: string): RequestInit {
  return { method: "POST", body: JSON.stringify(body), headers: { "x-request-id": requestId } };
}

function patchBody(body: unknown, requestId: string): RequestInit {
  return { method: "PATCH", body: JSON.stringify(body), headers: { "x-request-id": requestId } };
}

test("Sprint 22: audit requestId and editorial channel isolation are enforced", async () => {
  const harness = await startHarness();
  const { baseUrl, server, channelsService, auditRepository } = harness;
  try {
    const channelA = channelsService.createChannel({
      name: "Canal A",
      slug: "canal-a",
      status: "active",
      timezone: "America/Sao_Paulo",
      language: "pt-BR",
    });
    const channelB = channelsService.createChannel({
      name: "Canal B",
      slug: "canal-b",
      status: "active",
      timezone: "America/Sao_Paulo",
      language: "pt-BR",
    });

    const idea = await request(
      baseUrl,
      "/api/content-ideas",
      postBody(
        {
          channelId: channelA.id,
          title: "Pauta auditada",
          summary: "Resumo",
          niche: "Historia",
          source: "Fonte",
          opportunityScore: 80,
          originalityScore: 70,
          visualPotentialScore: 75,
          clipPotentialScore: 60,
          riskLevel: "ok",
          status: "idea",
        },
        "req-idea-create",
      ),
    );
    assert.equal(idea.response.status, 201);
    const ideaId = idea.body.data.id as string;
    assert.equal(
      (
        await request(
          baseUrl,
          `/api/content-ideas/${ideaId}?channelId=${channelA.id}`,
          patchBody({ title: "Pauta alterada" }, "req-idea-update"),
        )
      ).response.status,
      200,
    );

    const session = await request(
      baseUrl,
      "/api/research-sessions",
      postBody(
        {
          channelId: channelA.id,
          contentId: ideaId,
          title: "Pesquisa",
          status: "running",
          sourceCount: 0,
          claimCount: 0,
          confidenceScore: 80,
          riskLevel: "ok",
        },
        "req-research-create",
      ),
    );
    const sessionId = session.body.data.id as string;
    const source = await request(
      baseUrl,
      `/api/research-sessions/${sessionId}/sources?channelId=${channelA.id}`,
      postBody(
        {
          title: "Fonte",
          accessedAt: "2026-07-19T00:00:00.000Z",
          sourceType: "article",
          confidenceLevel: "high",
          freshnessRisk: "ok",
          usageNotes: "Notas",
        },
        "req-source-create",
      ),
    );
    const sourceId = source.body.data.id as string;
    assert.equal(
      (
        await request(
          baseUrl,
          `/api/research-sessions/${sessionId}/claims?channelId=${channelA.id}`,
          postBody(
            {
              sourceId,
              claim: "Fato",
              evidenceSummary: "Evidencia",
              informationType: "fact",
              confidenceLevel: "high",
              riskLevel: "ok",
            },
            "req-claim-create",
          ),
        )
      ).response.status,
      201,
    );

    const script = await request(
      baseUrl,
      "/api/scripts",
      postBody(
        {
          channelId: channelA.id,
          contentId: ideaId,
          title: "Roteiro",
          status: "script",
          estimatedDurationSeconds: 600,
          hook: "Hook",
          promise: "Promise",
          cta: "CTA",
          riskLevel: "ok",
          initialVersion: { narrationText: "Texto", sceneCount: 2, changeSummary: "Inicial" },
        },
        "req-script-create",
      ),
    );
    const scriptId = script.body.data.id as string;
    const versionId = script.body.data.currentVersionId as string;
    assert.equal(
      (
        await request(
          baseUrl,
          `/api/scripts/${scriptId}?channelId=${channelA.id}`,
          patchBody({ title: "Roteiro 2" }, "req-script-update"),
        )
      ).response.status,
      200,
    );
    const version = await request(
      baseUrl,
      `/api/scripts/${scriptId}/versions?channelId=${channelA.id}`,
      postBody(
        {
          versionNumber: 2,
          narrationText: "Texto 2",
          sceneCount: 2,
          changeSummary: "Ajuste",
        },
        "req-version-create",
      ),
    );
    assert.equal(version.response.status, 201);
    const versionTwoId = version.body.data.id as string;

    const plan = await request(
      baseUrl,
      "/api/visual-plans",
      postBody(
        {
          channelId: channelA.id,
          contentId: ideaId,
          scriptVersionId: versionTwoId,
          title: "Plano",
          status: "visual_plan",
          sceneCount: 1,
          estimatedDurationSeconds: 600,
          visualStyle: "Cine",
        },
        "req-plan-create",
      ),
    );
    const planId = plan.body.data.id as string;
    assert.equal(
      (
        await request(
          baseUrl,
          `/api/visual-plans/${planId}?channelId=${channelA.id}`,
          patchBody({ title: "Plano 2" }, "req-plan-update"),
        )
      ).response.status,
      200,
    );
    const scene = await request(
      baseUrl,
      `/api/visual-plans/${planId}/scenes?channelId=${channelA.id}`,
      postBody(
        {
          channelId: channelA.id,
          order: 1,
          title: "Cena",
          narrationExcerpt: "Texto",
          durationSeconds: 30,
          visualDescription: "Descricao",
          assetRequirements: [],
        },
        "req-scene-create",
      ),
    );
    assert.equal(scene.response.status, 201);
    const sceneId = scene.body.data.id as string;

    const logs = auditRepository.listAuditLogs({ channelId: channelA.id });
    const expected = new Map<string, string[]>([
      ["content_idea.created", ["req-idea-create"]],
      ["content_idea.updated", ["req-idea-update"]],
      ["research_session.created", ["req-research-create"]],
      ["research_source.created", ["req-source-create"]],
      ["claim_evidence.created", ["req-claim-create"]],
      ["script.created", ["req-script-create"]],
      ["script.updated", ["req-script-update"]],
      ["script_version.created", ["req-script-create", "req-version-create"]],
      ["visual_plan.created", ["req-plan-create"]],
      ["visual_plan.updated", ["req-plan-update"]],
      ["scene_plan.created", ["req-scene-create"]],
    ]);
    for (const [action, requestIds] of expected) {
      const matching = logs.filter((log) => log.action === action);
      assert.equal(matching.length, requestIds.length, action);
      assert.deepEqual(matching.map((log) => log.requestId).sort(), [...requestIds].sort(), action);
      assert.equal(
        matching.every((log) => log.metadata?.requestId === undefined),
        true,
        action,
      );
    }

    for (const path of [
      `/api/scripts/${scriptId}`,
      `/api/scripts/${scriptId}/versions`,
      `/api/scripts/${scriptId}/versions/${versionId}`,
      `/api/visual-plans/${planId}`,
      `/api/visual-plans/${planId}/scenes`,
      `/api/visual-plans/${planId}/scenes/${sceneId}`,
    ]) {
      const missingChannel = await request(baseUrl, path);
      assert.equal(missingChannel.response.status, 400, path);
      assert.equal(missingChannel.body.error.code, "VALIDATION_ERROR", path);
      assert.equal("stack" in missingChannel.body.error, false, path);
    }

    for (const path of [
      `/api/scripts/${scriptId}?channelId=${channelB.id}`,
      `/api/scripts/${scriptId}/versions?channelId=${channelB.id}`,
      `/api/scripts/${scriptId}/versions/${versionId}?channelId=${channelB.id}`,
      `/api/visual-plans/${planId}?channelId=${channelB.id}`,
      `/api/visual-plans/${planId}/scenes?channelId=${channelB.id}`,
      `/api/visual-plans/${planId}/scenes/${sceneId}?channelId=${channelB.id}`,
    ]) {
      const crossChannel = await request(baseUrl, path);
      assert.equal(crossChannel.response.status, 404, path);
      assert.equal(crossChannel.body.error.code, "NOT_FOUND", path);
      assert.equal(crossChannel.body.error.details.expectedChannelId, undefined, path);
      assert.equal(crossChannel.body.error.details.channelId, undefined, path);
      assert.equal("stack" in crossChannel.body.error, false, path);
    }

    assert.equal(
      (await request(baseUrl, `/api/scripts/${scriptId}?channelId=${channelA.id}`)).response.status,
      200,
    );
    assert.equal(
      (await request(baseUrl, `/api/scripts/${scriptId}/versions?channelId=${channelA.id}`))
        .response.status,
      200,
    );
    assert.equal(
      (
        await request(
          baseUrl,
          `/api/scripts/${scriptId}/versions/${versionId}?channelId=${channelA.id}`,
        )
      ).response.status,
      200,
    );
    assert.equal(
      (await request(baseUrl, `/api/visual-plans/${planId}?channelId=${channelA.id}`)).response
        .status,
      200,
    );
    assert.equal(
      (await request(baseUrl, `/api/visual-plans/${planId}/scenes?channelId=${channelA.id}`))
        .response.status,
      200,
    );
    assert.equal(
      (
        await request(
          baseUrl,
          `/api/visual-plans/${planId}/scenes/${sceneId}?channelId=${channelA.id}`,
        )
      ).response.status,
      200,
    );
  } finally {
    await stopServer(server);
  }
});
