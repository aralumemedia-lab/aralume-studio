import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import test from "node:test";

import { createApp } from "../src/app.js";
import { AppError } from "../src/http/errors.js";
import { createAuditRepository } from "../src/modules/audit/audit.repository.js";
import { createAuditService } from "../src/modules/audit/audit.service.js";
import { createChannelsRepository } from "../src/modules/channels/channel.repository.js";
import { channelDemoSeed } from "../src/modules/channels/channel.seed.js";
import { createEditorialRepository } from "../src/modules/editorial/editorial.repository.js";
import { editorialDemoSeed } from "../src/modules/editorial/editorial.seed.js";
import { createMetricsRepository } from "../src/modules/metrics/metrics.repository.js";
import { createMetricsService } from "../src/modules/metrics/metrics.service.js";
import type { PerformanceMetric } from "../src/modules/metrics/metrics.types.js";

const baseInput = {
  channelId: "ch_historia",
  contentId: "idea_06",
  platform: "youtube",
  periodStart: "2026-07-01T00:00:00.000Z",
  periodEnd: "2026-07-12T00:00:00.000Z",
  views: 1000,
  reach: 1200,
  averageWatchSeconds: 200,
  completionRate: 0.5,
  shares: 20,
  saves: 30,
  comments: 10,
  followersGained: 15,
  origin: "manual" as const,
  capturedAt: "2026-07-12T18:00:00.000Z",
  idempotencyKey: "manual:ch_historia:001",
};

function createHarness(seed: PerformanceMetric[] = []) {
  const storageRoot = mkdtempSync(path.join(os.tmpdir(), "aralume-metrics-"));
  const channelsRepository = createChannelsRepository(channelDemoSeed);
  const editorialRepository = createEditorialRepository(editorialDemoSeed);
  const auditRepository = createAuditRepository(undefined, { storageRoot });
  const metricsRepository = createMetricsRepository({ metrics: seed }, { storageRoot });
  const service = createMetricsService(
    metricsRepository,
    {
      channelsRepository,
      editorialRepository,
      auditService: createAuditService(auditRepository),
    },
    { clock: () => new Date("2026-07-12T19:00:00.000Z"), idFactory: () => "0001" },
  );
  return {
    storageRoot,
    metricsRepository,
    auditRepository,
    service,
    cleanup: () => rmSync(storageRoot, { recursive: true, force: true }),
  };
}

function expectAppError(error: unknown, status: number, code: string): asserts error is AppError {
  assert.ok(error instanceof AppError);
  assert.equal(error.status, status);
  assert.equal(error.code, code);
}

test("metrics registration validates content ownership and is idempotent", () => {
  const harness = createHarness();
  try {
    const created = harness.service.createMetric(baseInput, "req_metric_1");
    assert.equal(created.replay, false);
    assert.equal(created.metric.channelId, "ch_historia");
    assert.equal(harness.service.createMetric(baseInput, "req_metric_2").replay, true);
    assert.throws(
      () => harness.service.createMetric({ ...baseInput, views: 999 }, "req_metric_3"),
      (error) => {
        expectAppError(error, 409, "CONFLICT");
        return true;
      },
    );
    assert.throws(
      () =>
        harness.service.createMetric(
          { ...baseInput, contentId: "idea_03", idempotencyKey: "manual:cross" },
          "req_metric_4",
        ),
      (error) => {
        expectAppError(error, 409, "CONFLICT");
        return true;
      },
    );
    const actions = harness.auditRepository
      .listAuditLogs({ channelId: "ch_historia" })
      .map((entry) => entry.action);
    assert.ok(actions.includes("metrics.registered"));
    assert.ok(actions.includes("metrics.idempotent_replay"));
    assert.ok(actions.includes("metrics.rejected"));
  } finally {
    harness.cleanup();
  }
});

test("metrics summary generates a reproducible recommendation and keeps channels isolated", () => {
  const seed: PerformanceMetric[] = [
    {
      ...baseInput,
      id: "m1",
      idempotencyKey: "seed:1",
      platform: "youtube",
      contentId: "idea_06",
      completionRate: 0.65,
      createdAt: baseInput.capturedAt,
      updatedAt: baseInput.capturedAt,
      validationStatus: "validated",
    },
    {
      ...baseInput,
      id: "m2",
      idempotencyKey: "seed:2",
      platform: "youtube",
      contentId: "idea_02",
      completionRate: 0.62,
      createdAt: baseInput.capturedAt,
      updatedAt: baseInput.capturedAt,
      validationStatus: "validated",
    },
    {
      ...baseInput,
      id: "m3",
      idempotencyKey: "seed:3",
      platform: "tiktok",
      contentId: "idea_06",
      completionRate: 0.3,
      createdAt: baseInput.capturedAt,
      updatedAt: baseInput.capturedAt,
      validationStatus: "validated",
    },
    {
      ...baseInput,
      id: "m4",
      idempotencyKey: "seed:4",
      platform: "tiktok",
      contentId: "idea_02",
      completionRate: 0.25,
      createdAt: baseInput.capturedAt,
      updatedAt: baseInput.capturedAt,
      validationStatus: "validated",
    },
  ];
  const harness = createHarness(seed);
  try {
    const summary = harness.service.summarize({ channelId: "ch_historia" }, "req_summary");
    assert.equal(summary.status, "ready");
    assert.equal(summary.recommendation?.ruleVersion, "metrics-learning-v1");
    assert.equal(summary.recommendation?.channelId, "ch_historia");
    assert.ok(
      summary.recommendation?.evidence.every((evidence) =>
        ["m1", "m2"].includes(evidence.metricId),
      ),
    );
    assert.equal(harness.service.listMetrics({ channelId: "ch_curiosidades" }).length, 0);
    assert.ok(
      harness.auditRepository
        .listAuditLogs({ channelId: "ch_historia" })
        .some((entry) => entry.action === "metrics.recommendation_generated"),
    );
    const restarted = createMetricsRepository(undefined, { storageRoot: harness.storageRoot });
    assert.equal(restarted.listMetrics({ channelId: "ch_historia" }).length, 4);
  } finally {
    harness.cleanup();
  }
});

test("metrics summary returns product-level insufficient data", () => {
  const harness = createHarness([
    {
      ...baseInput,
      id: "only-one",
      idempotencyKey: "seed:only-one",
      createdAt: baseInput.capturedAt,
      updatedAt: baseInput.capturedAt,
      validationStatus: "partial",
      completionRate: undefined,
    },
  ]);
  try {
    const summary = harness.service.summarize({ channelId: "ch_historia" }, "req_insufficient");
    assert.equal(summary.status, "insufficient_data");
    assert.equal(summary.recommendation, undefined);
    assert.ok(summary.missingData.includes("completionRate"));
    assert.ok(
      harness.auditRepository
        .listAuditLogs({ channelId: "ch_historia" })
        .some((entry) => entry.action === "metrics.insufficient_data"),
    );
  } finally {
    harness.cleanup();
  }
});

async function startServer(harness: ReturnType<typeof createHarness>) {
  const app = createApp({
    env: {
      ARALUME_ENV: "test",
      ARALUME_LOG_LEVEL: "info",
      ARALUME_ASSET_STORAGE_ROOT: harness.storageRoot,
    },
    logger: { info: () => undefined, warn: () => undefined, error: () => undefined },
    metricsRepository: harness.metricsRepository,
  });
  const server = app.listen(0);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function stopServer(server: Server) {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

test("metrics HTTP routes require channel scope, expose envelopes and persist registration", async () => {
  const harness = createHarness();
  const { server, baseUrl } = await startServer(harness);
  try {
    const missingChannel = await fetch(`${baseUrl}/api/metrics`);
    assert.equal(missingChannel.status, 400);

    const created = await fetch(`${baseUrl}/api/metrics`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-request-id": "req_http_metric" },
      body: JSON.stringify(baseInput),
    });
    assert.equal(created.status, 201);
    const createdPayload = (await created.json()) as {
      data: PerformanceMetric;
      meta: { requestId: string };
    };
    assert.equal(createdPayload.data.origin, "manual");
    assert.equal(createdPayload.meta.requestId, "req_http_metric");

    const listed = await fetch(`${baseUrl}/api/metrics?channelId=ch_historia&pageSize=10`);
    assert.equal(listed.status, 200);
    const listedPayload = (await listed.json()) as {
      data: PerformanceMetric[];
      meta: { total: number };
    };
    assert.equal(listedPayload.data.length, 1);
    assert.equal(listedPayload.meta.total, 1);

    const cross = await fetch(`${baseUrl}/api/metrics?channelId=ch_curiosidades`);
    assert.equal(cross.status, 200);
    const crossPayload = (await cross.json()) as { data: PerformanceMetric[] };
    assert.equal(crossPayload.data.length, 0);
  } finally {
    await stopServer(server);
    harness.cleanup();
  }
});
