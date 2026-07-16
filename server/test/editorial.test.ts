import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import type { Server } from "node:http";

import { createApp } from "../src/app.js";
import { AppError } from "../src/http/errors.js";
import { createChannelsRepository } from "../src/modules/channels/channel.repository.js";
import { createChannelsService } from "../src/modules/channels/channel.service.js";
import { createEditorialRepository } from "../src/modules/editorial/editorial.repository.js";
import { createEditorialService } from "../src/modules/editorial/editorial.service.js";

type Harness = {
  channelsRepository: ReturnType<typeof createChannelsRepository>;
  channelsService: ReturnType<typeof createChannelsService>;
  editorialRepository: ReturnType<typeof createEditorialRepository>;
  editorialService: ReturnType<typeof createEditorialService>;
};

function createHarness(): Harness {
  const channelsRepository = createChannelsRepository([]);
  let channelTick = 0;
  let editorialTick = 0;
  let channelId = 0;
  let editorialId = 0;

  const channelsService = createChannelsService(channelsRepository, {
    clock: () => new Date(Date.parse("2026-07-13T03:30:00.000Z") + channelTick++ * 1000),
    idFactory: () => String(++channelId).padStart(4, "0"),
  });

  const editorialRepository = createEditorialRepository();
  const editorialService = createEditorialService(editorialRepository, channelsRepository, {
    clock: () => new Date(Date.parse("2026-07-13T03:30:00.000Z") + editorialTick++ * 1000),
    idFactory: () => String(++editorialId).padStart(4, "0"),
  });

  return { channelsRepository, channelsService, editorialRepository, editorialService };
}

async function startServer(harness: Harness) {
  const app = createApp({
    env: {
      ARALUME_ENV: "test",
      ARALUME_LOG_LEVEL: "info",
    },
    logger: {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
    channelsRepository: harness.channelsRepository,
    editorialRepository: harness.editorialRepository,
  });

  const server = app.listen(0);
  await once(server, "listening");

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected TCP address");
  }

  return {
    baseUrl: `http://127.0.0.1:${(address as AddressInfo).port}`,
    server,
  };
}

async function stopServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

test("editorial service creates linked content and preserves version history", () => {
  const { channelsService, editorialService, editorialRepository } = createHarness();

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

  const idea = editorialService.createContentIdea({
    channelId: channelA.id,
    title: "Pauta principal",
    summary: "Resumo da pauta",
    niche: "Historia",
    source: "Seed manual",
    opportunityScore: 84,
    originalityScore: 72,
    visualPotentialScore: 90,
    clipPotentialScore: 68,
    riskLevel: "ok",
    status: "idea",
  });

  assert.equal(idea.id, "idea_0001");
  assert.equal(editorialService.getProductionItem(`pi_${idea.id}`).status, "idea");
  assert.equal(editorialService.listContentIdeas({ channelId: channelA.id }).length, 1);
  assert.equal(editorialService.listContentIdeas({ channelId: channelB.id }).length, 0);

  const session = editorialService.createResearchSession({
    channelId: channelA.id,
    contentId: idea.id,
    title: "Sessao de pesquisa",
    status: "running",
    sourceCount: 0,
    claimCount: 0,
    confidenceScore: 80,
    riskLevel: "ok",
    summary: "Objetivo inicial",
  });

  assert.equal(session.id, "rs_0002");
  assert.equal(editorialService.getContentIdea(idea.id).status, "research");

  const source = editorialService.createResearchSource(session.id, {
    title: "Fonte 1",
    url: "https://example.com/fonte-1",
    publisher: "Example",
    accessedAt: "2026-07-13T03:30:00.000Z",
    sourceType: "article",
    confidenceLevel: "high",
    freshnessRisk: "ok",
    usageNotes: "Nota estruturada",
  });

  assert.equal(source.channelId, channelA.id);
  assert.equal(editorialService.getResearchSession(session.id).sourceCount, 1);

  const claim = editorialService.createClaimEvidence(session.id, {
    sourceId: source.id,
    claim: "Claim validado",
    evidenceSummary: "Resumo curto e estruturado",
    informationType: "fact",
    confidenceLevel: "high",
    riskLevel: "ok",
  });

  assert.equal(claim.researchSessionId, session.id);
  assert.equal(editorialService.getResearchSession(session.id).claimCount, 1);

  const script = editorialService.createScript({
    channelId: channelA.id,
    contentId: idea.id,
    title: "Roteiro principal",
    status: "script",
    estimatedDurationSeconds: 720,
    hook: "Gancho principal",
    promise: "Promessa principal",
    cta: "CTA principal",
    riskLevel: "ok",
    initialVersion: {
      narrationText: "Versao inicial do roteiro",
      sceneCount: 4,
      changeSummary: "Primeira versao",
    },
  });

  assert.equal(script.currentVersionId.startsWith("scv_"), true);
  assert.equal(editorialService.getContentIdea(idea.id).status, "script");
  assert.equal(editorialService.listScriptVersions({ scriptId: script.id }).length, 1);

  const versionTwo = editorialService.createScriptVersion(script.id, {
    versionNumber: 2,
    narrationText: "Versao 2 do roteiro",
    sceneCount: 5,
    changeSummary: "Ajustes narrativos",
  });

  assert.equal(versionTwo.versionNumber, 2);
  assert.equal(editorialService.getScript(script.id).currentVersionId, versionTwo.id);
  assert.equal(editorialService.listScriptVersions({ scriptId: script.id }).length, 2);
  assert.equal(editorialRepository.listScriptVersions({ scriptId: script.id })[0].versionNumber, 1);

  const visualPlan = editorialService.createVisualPlan({
    channelId: channelA.id,
    contentId: idea.id,
    scriptVersionId: versionTwo.id,
    title: "Plano visual",
    status: "visual_plan",
    sceneCount: 5,
    estimatedDurationSeconds: 720,
    visualStyle: "Cinematografico",
  });

  assert.equal(visualPlan.channelId, channelA.id);
  assert.equal(editorialService.getContentIdea(idea.id).status, "visual_plan");

  const sceneOne = editorialService.createScenePlan(visualPlan.id, {
    order: 1,
    title: "Cena 1",
    narrationExcerpt: "Inicio",
    durationSeconds: 40,
    visualDescription: "Visual 1",
    assetRequirements: ["asset-a"],
  });
  assert.equal(sceneOne.visualPlanId, visualPlan.id);
  assert.equal(editorialService.listScenePlans({ visualPlanId: visualPlan.id }).length, 1);
  assert.equal(editorialService.listScenePlans({ channelId: channelB.id }).length, 0);

  assert.throws(
    () =>
      editorialService.createScenePlan(visualPlan.id, {
        order: 2,
        title: "Cena invalida",
        narrationExcerpt: "Invalida",
        durationSeconds: 0,
        visualDescription: "Visual invalido",
        assetRequirements: [],
      }),
    (error) => error instanceof Error && error.name === "ZodError",
  );

  assert.throws(
    () =>
      editorialService.createScenePlan(visualPlan.id, {
        order: 1,
        title: "Cena duplicada",
        narrationExcerpt: "Duplicada",
        durationSeconds: 30,
        visualDescription: "Visual 2",
        assetRequirements: [],
      }),
    (error) => error instanceof AppError && error.code === "CONFLICT",
  );
});

test("editorial service rejects cross-channel links and duplicate version numbers", () => {
  const { channelsService, editorialService } = createHarness();

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

  const idea = editorialService.createContentIdea({
    channelId: channelA.id,
    title: "Pauta",
    summary: "Resumo",
    niche: "Historia",
    source: "Seed",
    opportunityScore: 81,
    originalityScore: 70,
    visualPotentialScore: 85,
    clipPotentialScore: 60,
    riskLevel: "ok",
    status: "idea",
  });

  assert.throws(
    () =>
      editorialService.createResearchSession({
        channelId: channelB.id,
        contentId: idea.id,
        title: "Sessao invalida",
        status: "running",
        sourceCount: 0,
        claimCount: 0,
        confidenceScore: 80,
        riskLevel: "ok",
      }),
    (error) => error instanceof AppError && error.code === "CONFLICT",
  );

  const session = editorialService.createResearchSession({
    channelId: channelA.id,
    contentId: idea.id,
    title: "Sessao valida",
    status: "running",
    sourceCount: 0,
    claimCount: 0,
    confidenceScore: 80,
    riskLevel: "ok",
  });
  const source = editorialService.createResearchSource(session.id, {
    title: "Fonte",
    accessedAt: "2026-07-13T03:30:00.000Z",
    sourceType: "article",
    confidenceLevel: "high",
    freshnessRisk: "ok",
    usageNotes: "Notas",
  });

  const ideaB = editorialService.createContentIdea({
    channelId: channelB.id,
    title: "Pauta B",
    summary: "Resumo B",
    niche: "Historia",
    source: "Seed",
    opportunityScore: 71,
    originalityScore: 66,
    visualPotentialScore: 75,
    clipPotentialScore: 55,
    riskLevel: "ok",
    status: "idea",
  });
  const sessionB = editorialService.createResearchSession({
    channelId: channelB.id,
    contentId: ideaB.id,
    title: "Sessao B",
    status: "running",
    sourceCount: 0,
    claimCount: 0,
    confidenceScore: 79,
    riskLevel: "ok",
  });

  const script = editorialService.createScript({
    channelId: channelA.id,
    contentId: idea.id,
    title: "Roteiro",
    status: "script",
    estimatedDurationSeconds: 600,
    hook: "Hook",
    promise: "Promise",
    cta: "CTA",
    riskLevel: "ok",
    initialVersion: {
      narrationText: "Texto inicial",
      sceneCount: 3,
      changeSummary: "Inicial",
    },
  });

  assert.throws(
    () =>
      editorialService.createScriptVersion(script.id, {
        versionNumber: 1,
        narrationText: "Duplicada",
        sceneCount: 3,
        changeSummary: "Duplicada",
      }),
    (error) => error instanceof AppError && error.code === "CONFLICT",
  );

  assert.throws(
    () =>
      editorialService.createClaimEvidence(sessionB.id, {
        sourceId: source.id,
        claim: "Claim invalido",
        evidenceSummary: "Resumo",
        informationType: "fact",
        confidenceLevel: "high",
        riskLevel: "ok",
      }),
    (error) => error instanceof AppError && error.code === "CONFLICT",
  );
});

test("HTTP editorial endpoints validate payloads, filter by channel and reject invalid links", async () => {
  const harness = createHarness();
  const { baseUrl, server } = await startServer(harness);

  try {
    const channelA = await fetch(`${baseUrl}/api/channels`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Canal A",
        slug: "canal-a",
        status: "active",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
      }),
    });
    const channelAJson = (await channelA.json()) as {
      data: { id: string };
      meta: { requestId: string };
    };
    const channelB = await fetch(`${baseUrl}/api/channels`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Canal B",
        slug: "canal-b",
        status: "active",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
      }),
    });
    const channelBJson = (await channelB.json()) as {
      data: { id: string };
    };

    assert.equal(channelA.status, 201);
    assert.equal(channelB.status, 201);

    const invalidIdea = await fetch(`${baseUrl}/api/content-ideas`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    const invalidIdeaJson = (await invalidIdea.json()) as {
      error: { code: string; message: string };
    };
    assert.equal(invalidIdea.status, 400);
    assert.equal(invalidIdeaJson.error.code, "VALIDATION_ERROR");

    const createdIdeaResponse = await fetch(`${baseUrl}/api/content-ideas`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: channelAJson.data.id,
        title: "Pauta HTTP",
        summary: "Resumo HTTP",
        niche: "Historia",
        source: "Seed",
        opportunityScore: 80,
        originalityScore: 70,
        visualPotentialScore: 85,
        clipPotentialScore: 60,
        riskLevel: "ok",
        status: "idea",
      }),
    });
    const createdIdea = (await createdIdeaResponse.json()) as {
      data: { id: string; channelId: string; status: string };
    };
    assert.equal(createdIdeaResponse.status, 201);
    assert.equal(createdIdea.data.channelId, channelAJson.data.id);

    const listAResponse = await fetch(
      `${baseUrl}/api/content-ideas?channelId=${encodeURIComponent(channelAJson.data.id)}`,
    );
    const listA = (await listAResponse.json()) as {
      data: Array<{ id: string }>;
      meta: { total: number };
    };
    assert.equal(listAResponse.status, 200);
    assert.equal(listA.data.length, 1);
    assert.equal(listA.meta.total, 1);

    const listBResponse = await fetch(
      `${baseUrl}/api/content-ideas?channelId=${encodeURIComponent(channelBJson.data.id)}`,
    );
    const listB = (await listBResponse.json()) as {
      data: Array<{ id: string }>;
      meta: { total: number };
    };
    assert.equal(listBResponse.status, 200);
    assert.equal(listB.data.length, 0);
    assert.equal(listB.meta.total, 0);

    const missingIdea = await fetch(`${baseUrl}/api/content-ideas/does-not-exist`);
    const missingIdeaJson = (await missingIdea.json()) as {
      error: { code: string; message: string };
    };
    assert.equal(missingIdea.status, 404);
    assert.equal(missingIdeaJson.error.code, "NOT_FOUND");

    const invalidFilter = await fetch(`${baseUrl}/api/content-ideas?channelId=missing`);
    assert.equal(invalidFilter.status, 404);

    const invalidCrossChannelSession = await fetch(`${baseUrl}/api/research-sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: channelBJson.data.id,
        contentId: createdIdea.data.id,
        title: "Sessao invalida",
        status: "running",
        sourceCount: 0,
        claimCount: 0,
        confidenceScore: 80,
        riskLevel: "ok",
      }),
    });
    const invalidCrossChannelSessionJson = (await invalidCrossChannelSession.json()) as {
      error: { code: string };
    };
    assert.equal(invalidCrossChannelSession.status, 409);
    assert.equal(invalidCrossChannelSessionJson.error.code, "CONFLICT");

    const sessionResponse = await fetch(`${baseUrl}/api/research-sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: channelAJson.data.id,
        contentId: createdIdea.data.id,
        title: "Sessao HTTP",
        status: "running",
        sourceCount: 0,
        claimCount: 0,
        confidenceScore: 82,
        riskLevel: "ok",
      }),
    });
    const sessionJson = (await sessionResponse.json()) as {
      data: { id: string; sourceCount: number; claimCount: number };
    };
    assert.equal(sessionResponse.status, 201);
    assert.equal(sessionJson.data.sourceCount, 0);

    const sourceResponse = await fetch(
      `${baseUrl}/api/research-sessions/${sessionJson.data.id}/sources`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Fonte HTTP",
          accessedAt: "2026-07-13T03:30:00.000Z",
          sourceType: "article",
          confidenceLevel: "high",
          freshnessRisk: "ok",
          usageNotes: "Notas",
        }),
      },
    );
    const sourceJson = (await sourceResponse.json()) as {
      data: { id: string; channelId: string; researchSessionId: string };
    };
    assert.equal(sourceResponse.status, 201);
    assert.equal(sourceJson.data.channelId, channelAJson.data.id);

    const sourcesListResponse = await fetch(
      `${baseUrl}/api/research-sessions/${sessionJson.data.id}/sources`,
    );
    const sourcesList = (await sourcesListResponse.json()) as {
      data: Array<{ id: string; researchSessionId: string }>;
    };
    assert.equal(sourcesListResponse.status, 200);
    assert.equal(sourcesList.data.length, 1);
    assert.equal(sourcesList.data[0].researchSessionId, sessionJson.data.id);

    const claimResponse = await fetch(
      `${baseUrl}/api/research-sessions/${sessionJson.data.id}/claims`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceId: sourceJson.data.id,
          claim: "Claim HTTP",
          evidenceSummary: "Resumo HTTP",
          informationType: "fact",
          confidenceLevel: "high",
          riskLevel: "ok",
        }),
      },
    );
    assert.equal(claimResponse.status, 201);

    const claimsListResponse = await fetch(
      `${baseUrl}/api/research-sessions/${sessionJson.data.id}/claims`,
    );
    const claimsList = (await claimsListResponse.json()) as {
      data: Array<{ id: string; sourceId: string }>;
    };
    assert.equal(claimsListResponse.status, 200);
    assert.equal(claimsList.data.length, 1);
    assert.equal(claimsList.data[0].sourceId, sourceJson.data.id);

    const scriptResponse = await fetch(`${baseUrl}/api/scripts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: channelAJson.data.id,
        contentId: createdIdea.data.id,
        title: "Roteiro HTTP",
        status: "script",
        estimatedDurationSeconds: 600,
        hook: "Hook HTTP",
        promise: "Promise HTTP",
        cta: "CTA HTTP",
        riskLevel: "ok",
        initialVersion: {
          narrationText: "Versao inicial HTTP",
          sceneCount: 3,
          changeSummary: "Inicial",
        },
      }),
    });
    const scriptJson = (await scriptResponse.json()) as {
      data: { id: string; currentVersionId: string };
    };
    assert.equal(scriptResponse.status, 201);

    const duplicateVersionResponse = await fetch(
      `${baseUrl}/api/scripts/${scriptJson.data.id}/versions`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          versionNumber: 1,
          narrationText: "Duplicada",
          sceneCount: 3,
          changeSummary: "Duplicada",
        }),
      },
    );
    assert.equal(duplicateVersionResponse.status, 409);

    const versionResponse = await fetch(`${baseUrl}/api/scripts/${scriptJson.data.id}/versions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        versionNumber: 2,
        narrationText: "Versao 2 HTTP",
        sceneCount: 4,
        changeSummary: "Ajuste",
      }),
    });
    const versionJson = (await versionResponse.json()) as {
      data: { id: string; versionNumber: number };
    };
    assert.equal(versionResponse.status, 201);
    assert.equal(versionJson.data.versionNumber, 2);

    const visualPlanResponse = await fetch(`${baseUrl}/api/visual-plans`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: channelAJson.data.id,
        contentId: createdIdea.data.id,
        scriptVersionId: versionJson.data.id,
        title: "Plano HTTP",
        status: "visual_plan",
        sceneCount: 4,
        estimatedDurationSeconds: 600,
        visualStyle: "Estilo HTTP",
      }),
    });
    const visualPlanJson = (await visualPlanResponse.json()) as {
      data: { id: string };
    };
    assert.equal(visualPlanResponse.status, 201);

    const sceneResponse = await fetch(
      `${baseUrl}/api/visual-plans/${visualPlanJson.data.id}/scenes`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order: 1,
          title: "Cena HTTP",
          narrationExcerpt: "Cena 1",
          durationSeconds: 30,
          visualDescription: "Visual 1",
          assetRequirements: ["asset-1"],
        }),
      },
    );
    assert.equal(sceneResponse.status, 201);

    const sceneListResponse = await fetch(
      `${baseUrl}/api/visual-plans/${visualPlanJson.data.id}/scenes`,
    );
    const sceneList = (await sceneListResponse.json()) as {
      data: Array<{ id: string; visualPlanId: string; order: number }>;
    };
    assert.equal(sceneListResponse.status, 200);
    assert.equal(sceneList.data.length, 1);
    assert.equal(sceneList.data[0].visualPlanId, visualPlanJson.data.id);
    assert.equal(sceneList.data[0].order, 1);

    const duplicateSceneResponse = await fetch(
      `${baseUrl}/api/visual-plans/${visualPlanJson.data.id}/scenes`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order: 1,
          title: "Cena duplicada",
          narrationExcerpt: "Duplicada",
          durationSeconds: 35,
          visualDescription: "Visual 2",
          assetRequirements: [],
        }),
      },
    );
    assert.equal(duplicateSceneResponse.status, 409);

    const productionListResponse = await fetch(
      `${baseUrl}/api/production-items?channelId=${encodeURIComponent(channelAJson.data.id)}`,
    );
    const productionList = (await productionListResponse.json()) as {
      data: Array<{ channelId: string; contentId: string }>;
    };
    assert.equal(productionListResponse.status, 200);
    assert.equal(productionList.data.length >= 1, true);
    assert.equal(productionList.data[0].channelId, channelAJson.data.id);
  } finally {
    await stopServer(server);
  }
});
