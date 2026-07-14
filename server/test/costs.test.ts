import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import test from "node:test";

import { createApp } from "../src/app.js";
import { createAuditRepository } from "../src/modules/audit/audit.repository.js";
import { auditDemoSeed } from "../src/modules/audit/audit.seed.js";
import { createChannelsRepository } from "../src/modules/channels/channel.repository.js";
import { channelDemoSeed } from "../src/modules/channels/channel.seed.js";
import { createCostsRepository } from "../src/modules/costs/costs.repository.js";
import { costsDemoSeed } from "../src/modules/costs/costs.seed.js";
import { createCostsService } from "../src/modules/costs/costs.service.js";
import { AppError } from "../src/http/errors.js";

function createHarness() {
  const channelsRepository = createChannelsRepository(channelDemoSeed);
  const costsRepository = createCostsRepository(costsDemoSeed);
  const auditRepository = createAuditRepository(auditDemoSeed);
  let tick = 0;
  let nextId = 1;

  const service = createCostsService(
    costsRepository,
    {
      channelsRepository,
      auditRepository,
    },
    {
      clock: () => new Date(Date.parse("2026-07-13T03:30:00.000Z") + tick++ * 1000),
      idFactory: () => String(nextId++).padStart(4, "0"),
    },
  );

  return { channelsRepository, costsRepository, auditRepository, service };
}

async function startServer() {
  const harness = createHarness();
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
    costsRepository: harness.costsRepository,
    auditRepository: harness.auditRepository,
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
    harness,
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

test("costs service calculates budgets, breakdowns and operational mode decisions deterministically", () => {
  const harness = createHarness();

  const globalSummary = harness.service.getCostSummary();
  assert.equal(globalSummary.status, "not_configured");
  assert.equal(globalSummary.totalCostCents, globalSummary.consumedCents);
  assert.ok(globalSummary.byChannel.some((row) => row.status === "healthy"));
  assert.ok(globalSummary.byChannel.some((row) => row.status === "attention"));
  assert.ok(globalSummary.byChannel.some((row) => row.status === "exceeded"));

  const historiaSummary = harness.service.getCostSummary({ channelId: "ch_historia" });
  assert.equal(historiaSummary.status, "healthy");
  assert.equal(historiaSummary.channelId, "ch_historia");
  assert.ok(historiaSummary.byStage.length > 0);
  assert.ok(historiaSummary.byProvider.length > 0);
  assert.ok(historiaSummary.byContent.length > 0);
  assert.ok(historiaSummary.byPeriod.length > 0);

  const curiosidadesSummary = harness.service.getCostSummary({ channelId: "ch_curiosidades" });
  assert.equal(curiosidadesSummary.status, "attention");

  const negociosSummary = harness.service.getCostSummary({ channelId: "ch_negocios" });
  assert.equal(negociosSummary.status, "exceeded");
  assert.ok(negociosSummary.remainingCents === 0);

  assert.equal(
    historiaSummary.byStage.reduce((sum, item) => sum + item.amountCents, 0),
    historiaSummary.totalCostCents,
  );

  const snapshot = harness.service.getOperationalModeSnapshot("ch_historia");
  assert.equal(snapshot.effectivePolicy.mode, "demo");
  assert.ok(
    snapshot.blockedActions.some((decision) => decision.decisionCode === "DEMO_AI_BLOCKED"),
  );
  assert.ok(
    snapshot.blockedActions.some(
      (decision) => decision.decisionCode === "DEMO_PUBLICATION_BLOCKED",
    ),
  );
  assert.ok(snapshot.allowedActions.some((decision) => decision.action === "simulation_only"));

  const decisionA = harness.service.evaluateOperationalAction({
    channelId: "ch_historia",
    action: "real_ai_generation",
    actor: "Ana Ribeiro",
  });
  const decisionB = harness.service.evaluateOperationalAction({
    channelId: "ch_historia",
    action: "real_ai_generation",
    actor: "Ana Ribeiro",
  });

  assert.equal(decisionA.allowed, false);
  assert.equal(decisionA.decisionCode, "DEMO_AI_BLOCKED");
  assert.equal(decisionA.reason, decisionB.reason);
  assert.equal(decisionA.policySource, decisionB.policySource);

  assert.throws(
    () =>
      harness.service.createCostEntry({
        channelId: "missing-channel",
        stage: "script",
        providerName: "Aralume AI",
        costType: "llm",
        description: "Invalid cost",
        amountCents: 100,
      }),
    (error) => error instanceof AppError && error.status === 404,
  );

  assert.throws(
    () =>
      harness.service.createCostEntry({
        channelId: "ch_historia",
        stage: "script",
        providerName: "Aralume AI",
        costType: "llm",
        description: "Invalid cost",
        amountCents: -1,
      }),
    (error) => error instanceof AppError && error.status === 400,
  );

  assert.throws(
    () =>
      harness.service.createCostEntry({
        channelId: "ch_historia",
        stage: "script",
        providerName: "Aralume AI",
        costType: "llm",
        description: "Invalid cost",
        amountCents: 12.5,
      } as never),
    (error) => error instanceof AppError && error.status === 400,
  );

  const created = harness.service.createCostEntry({
    channelId: "ch_historia",
    contentId: "idea_02",
    workflowRunId: "wf_02",
    stage: "publication",
    providerName: "Aralume Publisher",
    costType: "publication",
    description: "Publicacao simulada",
    amountCents: 1200,
  });

  assert.equal(created.currency, "BRL");
  assert.equal(created.channelId, "ch_historia");
  assert.equal(harness.service.getCostEntry(created.id).id, created.id);
  assert.equal(
    harness.service
      .listCostEntries({ channelId: "ch_historia" })
      .every((entry) => entry.channelId === "ch_historia"),
    true,
  );
  assert.ok(harness.auditRepository.listAuditLogs({ channelId: "ch_historia" }).length > 0);
});

test("costs HTTP routes expose summaries, reject invalid payloads and keep channels isolated", async () => {
  const { baseUrl, server } = await startServer();

  try {
    const summaryResponse = await fetch(`${baseUrl}/api/costs/summary?channelId=ch_historia`);
    const summaryPayload = (await summaryResponse.json()) as {
      data: {
        status: string;
        channelId: string;
        byStage: Array<{ key: string }>;
        byProvider: Array<{ key: string }>;
      };
      meta: { requestId: string };
    };

    assert.equal(summaryResponse.status, 200);
    assert.equal(summaryPayload.data.status, "healthy");
    assert.equal(summaryPayload.data.channelId, "ch_historia");
    assert.ok(summaryPayload.data.byStage.length > 0);
    assert.ok(summaryPayload.data.byProvider.length > 0);
    assert.ok(summaryPayload.meta.requestId.length > 0);

    const breakdownResponse = await fetch(
      `${baseUrl}/api/costs/breakdown?channelId=ch_curiosidades`,
    );
    assert.equal(breakdownResponse.status, 200);

    const entriesResponse = await fetch(`${baseUrl}/api/costs?channelId=ch_negocios`);
    const entriesPayload = (await entriesResponse.json()) as {
      data: Array<{ channelId: string; amountCents: number }>;
    };
    assert.equal(entriesResponse.status, 200);
    assert.ok(entriesPayload.data.every((entry) => entry.channelId === "ch_negocios"));

    const createResponse = await fetch(`${baseUrl}/api/costs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: "ch_historia",
        stage: "script",
        providerName: "Aralume AI",
        costType: "llm",
        description: "Nova iteracao",
        amountCents: 500,
      }),
    });

    assert.equal(createResponse.status, 201);
    const createdPayload = (await createResponse.json()) as {
      data: { id: string; currency: string; amountCents: number };
      meta: { requestId: string };
    };
    assert.ok(createdPayload.data.id.startsWith("co_"));
    assert.equal(createdPayload.data.currency, "BRL");
    assert.equal(createdPayload.data.amountCents, 500);
    assert.ok(createdPayload.meta.requestId.length > 0);

    const entryResponse = await fetch(`${baseUrl}/api/costs/${createdPayload.data.id}`);
    const entryPayload = (await entryResponse.json()) as {
      data: { id: string; channelId: string; currency: string };
    };
    assert.equal(entryResponse.status, 200);
    assert.equal(entryPayload.data.id, createdPayload.data.id);
    assert.equal(entryPayload.data.channelId, "ch_historia");
    assert.equal(entryPayload.data.currency, "BRL");

    const invalidInteger = await fetch(`${baseUrl}/api/costs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: "ch_historia",
        stage: "script",
        providerName: "Aralume AI",
        costType: "llm",
        description: "Invalid",
        amountCents: 12.5,
      }),
    });
    assert.equal(invalidInteger.status, 400);

    const missingChannel = await fetch(`${baseUrl}/api/costs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: "missing-channel",
        stage: "script",
        providerName: "Aralume AI",
        costType: "llm",
        description: "Invalid",
        amountCents: 100,
      }),
    });
    assert.equal(missingChannel.status, 404);

    const modeResponse = await fetch(`${baseUrl}/api/operational-modes?channelId=ch_historia`);
    const modePayload = (await modeResponse.json()) as {
      data: {
        blockedActions: Array<{ decisionCode: string }>;
        allowedActions: Array<{ decisionCode: string }>;
      };
    };
    assert.equal(modeResponse.status, 200);
    assert.ok(
      modePayload.data.blockedActions.some(
        (item) => item.decisionCode === "DEMO_PUBLICATION_BLOCKED",
      ),
    );

    const blockedDecisionResponse = await fetch(`${baseUrl}/api/operational-modes/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: "ch_historia",
        action: "real_publication",
        actor: "Ana Ribeiro",
      }),
    });
    const blockedDecisionPayload = (await blockedDecisionResponse.json()) as {
      error: { code: string; details: { decision: { decisionCode: string } } };
    };
    assert.equal(blockedDecisionResponse.status, 409);
    assert.equal(blockedDecisionPayload.error.code, "OPERATION_BLOCKED");
    assert.equal(
      blockedDecisionPayload.error.details.decision.decisionCode,
      "DEMO_PUBLICATION_BLOCKED",
    );

    const invalidAction = await fetch(`${baseUrl}/api/operational-modes/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: "ch_historia",
        action: "real_magic",
      }),
    });
    assert.equal(invalidAction.status, 400);

    const auditResponse = await fetch(`${baseUrl}/api/audit-logs?channelId=ch_historia`);
    const auditPayload = (await auditResponse.json()) as {
      data: Array<{ action: string; channelId?: string }>;
    };
    assert.equal(auditResponse.status, 200);
    assert.ok(auditPayload.data.length > 0);
    assert.ok(auditPayload.data.every((item) => item.channelId === "ch_historia"));
  } finally {
    await stopServer(server);
  }
});
