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
import { createChannelsRepository } from "../src/modules/channels/channel.repository.js";
import { channelDemoSeed } from "../src/modules/channels/channel.seed.js";
import { createEditorialRepository } from "../src/modules/editorial/editorial.repository.js";
import { editorialDemoSeed } from "../src/modules/editorial/editorial.seed.js";
import { createGovernanceRepository } from "../src/modules/governance/governance.repository.js";
import { governanceDemoSeed } from "../src/modules/governance/governance.seed.js";
import { createMediaAssetsRepository } from "../src/modules/media-assets/media-assets.repository.js";
import { mediaAssetsDemoSeed } from "../src/modules/media-assets/media-assets.seed.js";
import { createPublicationsRepository } from "../src/modules/publications/publications.repository.js";
import { publicationDemoSeed } from "../src/modules/publications/publications.seed.js";
import { createPublicationsService } from "../src/modules/publications/publications.service.js";

function createHarness() {
  const storageRoot = mkdtempSync(path.join(os.tmpdir(), "aralume-publications-"));
  const channelsRepository = createChannelsRepository(channelDemoSeed);
  const editorialRepository = createEditorialRepository(editorialDemoSeed);
  const mediaAssetsRepository = createMediaAssetsRepository(mediaAssetsDemoSeed, {
    storageRoot,
  });
  const governanceRepository = createGovernanceRepository(governanceDemoSeed);
  const auditRepository = createAuditRepository(undefined, { storageRoot });
  const publicationsRepository = createPublicationsRepository(publicationDemoSeed, {
    storageRoot,
  });
  let tick = 0;
  let nextId = 1;

  const service = createPublicationsService(
    publicationsRepository,
    {
      channelsRepository,
      editorialRepository,
      mediaAssetsRepository,
      governanceRepository,
      auditRepository,
    },
    {
      clock: () => new Date(Date.parse("2026-07-13T03:30:00.000Z") + tick++ * 1000),
      idFactory: () => String(nextId++).padStart(4, "0"),
    },
  );

  return {
    storageRoot,
    channelsRepository,
    editorialRepository,
    mediaAssetsRepository,
    governanceRepository,
    auditRepository,
    publicationsRepository,
    service,
    cleanup() {
      rmSync(storageRoot, { recursive: true, force: true });
    },
  };
}

async function startServer(harness: ReturnType<typeof createHarness>) {
  const app = createApp({
    env: {
      ARALUME_ENV: "test",
      ARALUME_LOG_LEVEL: "info",
      ARALUME_ASSET_STORAGE_ROOT: harness.storageRoot,
    },
    logger: {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
    channelsRepository: harness.channelsRepository,
    editorialRepository: harness.editorialRepository,
    mediaAssetsRepository: harness.mediaAssetsRepository,
    governanceRepository: harness.governanceRepository,
    auditRepository: harness.auditRepository,
    publicationsRepository: harness.publicationsRepository,
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

function expectAppError(error: unknown, status: number, code: string): asserts error is AppError {
  assert.ok(error instanceof AppError, "Expected AppError");
  assert.equal(error.status, status);
  assert.equal(error.code, code);
}

test("publication service prepares packages, enforces gates and keeps channel isolation", () => {
  const harness = createHarness();

  try {
    const readyTargets = harness.service.listPublicationTargets({
      channelId: "ch_historia",
      readinessStatus: "ready",
    });
    assert.ok(readyTargets.length > 0);
    assert.ok(readyTargets.every((target) => target.channelId === "ch_historia"));
    assert.ok(
      readyTargets.some(
        (target) =>
          target.id === "pt_historia_youtube" &&
          target.latestPublicationJobId === "pj_historia_01" &&
          target.sourceContentId === "idea_06" &&
          target.sourceVideoAssetId === "vd_historia_01",
      ),
    );

    const createdTarget = harness.service.createPublicationTarget({
      id: "pt_historia_linkedin",
      channelId: "ch_historia",
      platform: "linkedin",
      accountName: "Aralume Historia LinkedIn",
      status: "authenticated",
      lastConnectedAt: "2026-07-13T03:20:00.000Z",
      tokenExpiresAt: "2026-08-13T03:20:00.000Z",
      sourceContentId: "idea_06",
      sourceVideoAssetId: "vd_historia_01",
      requestedBy: "Ana Ribeiro",
    });
    assert.equal(createdTarget.readinessStatus, "ready");
    assert.equal(createdTarget.channelId, "ch_historia");

    const scheduledJob = harness.service.createPublicationJob({
      channelId: "ch_historia",
      publicationTargetId: "pt_historia_youtube",
      contentId: "idea_06",
      sourceVideoAssetId: "vd_historia_01",
      title: "A logistica do Imperio Romano",
      description: "Pacote assistido para revisao humana.",
      idempotencyKey: "publication:ch_historia:vd_historia_01:youtube:002",
      scheduledAt: "2026-07-15T13:00:00.000Z",
      requestedBy: "Ana Ribeiro",
    });

    assert.equal(scheduledJob.status, "scheduled");
    assert.equal(scheduledJob.publicationTargetId, "pt_historia_youtube");
    assert.equal(scheduledJob.sourceVideoAssetId, "vd_historia_01");
    assert.equal(scheduledJob.approvalId, "ap_06");
    assert.equal(scheduledJob.complianceCheckId, "cc_06");

    const afterVideoJob = harness.service.getPublicationTarget("pt_historia_youtube");
    assert.equal(afterVideoJob.latestPublicationJobId, scheduledJob.id);

    const replayedJob = harness.service.createPublicationJob({
      channelId: "ch_historia",
      publicationTargetId: "pt_historia_youtube",
      contentId: "idea_06",
      sourceVideoAssetId: "vd_historia_01",
      title: "A logistica do Imperio Romano",
      description: "Pacote assistido para revisao humana.",
      idempotencyKey: "publication:ch_historia:vd_historia_01:youtube:002",
      scheduledAt: "2026-07-15T13:00:00.000Z",
      requestedBy: "Ana Ribeiro",
    });
    assert.equal(replayedJob.id, scheduledJob.id);

    const clipJob = harness.service.createPublicationJob({
      channelId: "ch_historia",
      publicationTargetId: "pt_historia_youtube",
      contentId: "idea_06",
      sourceVideoAssetId: "cl_historia_01",
      title: "As estradas romanas em 45s",
      description: "Pacote assistido para corte derivado.",
      idempotencyKey: "publication:ch_historia:cl_historia_01:youtube:001",
      requestedBy: "Ana Ribeiro",
    });
    assert.equal(clipJob.status, "draft");
    assert.equal(clipJob.sourceVideoAssetId, "cl_historia_01");
    assert.equal(clipJob.publicationTargetId, "pt_historia_youtube");

    const clipTarget = harness.service.getPublicationTarget("pt_historia_youtube");
    assert.equal(clipTarget.latestPublicationJobId, clipJob.id);

    const rescheduled = harness.service.reschedulePublicationJob(scheduledJob.id, {
      channelId: "ch_historia",
      scheduledAt: "2026-07-16T09:00:00.000Z",
      requestedBy: "Ana Ribeiro",
    });
    assert.equal(rescheduled.status, "scheduled");
    assert.equal(rescheduled.scheduledAt, "2026-07-16T09:00:00.000Z");

    const clearedSchedule = harness.service.reschedulePublicationJob(scheduledJob.id, {
      channelId: "ch_historia",
      scheduledAt: null,
      requestedBy: "Ana Ribeiro",
    });
    assert.equal(clearedSchedule.status, "draft");
    assert.equal(clearedSchedule.scheduledAt, undefined);

    assert.throws(
      () =>
        harness.service.createPublicationJob({
          channelId: "ch_historia",
          publicationTargetId: "pt_historia_youtube",
          contentId: "idea_06",
          sourceVideoAssetId: "cl_historia_01",
          title: "Titulo diferente",
          description: "Conteudo diferente",
          idempotencyKey: "publication:ch_historia:vd_historia_01:youtube:002",
          requestedBy: "Ana Ribeiro",
        }),
      (error) => {
        expectAppError(error, 409, "CONFLICT");
        return true;
      },
    );

    assert.throws(
      () =>
        harness.service.createPublicationJob({
          channelId: "ch_historia",
          publicationTargetId: "pt_historia_tiktok",
          contentId: "idea_06",
          sourceVideoAssetId: "vd_historia_01",
          title: "A logistica do Imperio Romano",
          description: "Pacote bloqueado por readiness.",
          idempotencyKey: "publication:ch_historia:vd_historia_01:tiktok:001",
          requestedBy: "Ana Ribeiro",
        }),
      (error) => {
        expectAppError(error, 409, "OPERATION_BLOCKED");
        return true;
      },
    );

    assert.throws(
      () =>
        harness.service.createPublicationJob({
          channelId: "ch_curiosidades",
          publicationTargetId: "pt_curio_tiktok",
          contentId: "idea_04",
          sourceVideoAssetId: "vd_curio_02",
          title: "Paradoxo de Fermi e o silencio do cosmos",
          description: "Pacote bloqueado por conformidade.",
          idempotencyKey: "publication:ch_curiosidades:vd_curio_02:tiktok:001",
          requestedBy: "Bruno Lima",
        }),
      (error) => {
        expectAppError(error, 409, "COMPLIANCE_BLOCKED");
        return true;
      },
    );

    const auditActions = harness.auditRepository
      .listAuditLogs({ channelId: "ch_historia" })
      .map((entry) => entry.action);
    assert.ok(auditActions.includes("publication_target.created"));
    assert.ok(auditActions.includes("publication.package_prepared"));
    assert.ok(auditActions.includes("publication.job_created"));
    assert.ok(auditActions.includes("publication.job_scheduled"));
    assert.ok(auditActions.includes("publication.job_idempotent_replay"));
    assert.ok(auditActions.includes("publication.job_rescheduled"));
  } finally {
    harness.cleanup();
  }
});

test("publication HTTP routes expose channel-scoped targets, jobs and rescheduling", async () => {
  const harness = createHarness();
  const { baseUrl, server } = await startServer(harness);

  try {
    const targetListResponse = await fetch(
      `${baseUrl}/api/publication-targets?channelId=ch_historia&readinessStatus=ready`,
    );
    assert.equal(targetListResponse.status, 200);
    const targetListPayload = (await targetListResponse.json()) as {
      data: Array<{ id: string; readinessStatus: string; channelId: string }>;
      meta: { requestId: string };
    };
    assert.ok(targetListPayload.meta.requestId);
    assert.ok(targetListPayload.data.every((target) => target.channelId === "ch_historia"));
    assert.ok(targetListPayload.data.every((target) => target.readinessStatus === "ready"));

    const createResponse = await fetch(`${baseUrl}/api/publications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: "ch_historia",
        publicationTargetId: "pt_historia_youtube",
        contentId: "idea_06",
        sourceVideoAssetId: "vd_historia_01",
        title: "A logistica do Imperio Romano",
        description: "Pacote assistido para revisao humana.",
        idempotencyKey: "publication:http:historia:001",
        scheduledAt: "2026-07-15T13:00:00.000Z",
        requestedBy: "Ana Ribeiro",
      }),
    });
    assert.equal(createResponse.status, 201);
    const createPayload = (await createResponse.json()) as {
      data: { id: string; status: string; publicationTargetId: string; sourceVideoAssetId: string };
      meta: { requestId: string };
    };
    assert.equal(createPayload.data.status, "scheduled");
    assert.equal(createPayload.data.publicationTargetId, "pt_historia_youtube");
    assert.equal(createPayload.data.sourceVideoAssetId, "vd_historia_01");

    const listResponse = await fetch(
      `${baseUrl}/api/publications?channelId=ch_historia&publicationTargetId=pt_historia_youtube`,
    );
    assert.equal(listResponse.status, 200);
    const listPayload = (await listResponse.json()) as {
      data: Array<{ channelId: string; publicationTargetId: string }>;
      meta: { requestId: string };
    };
    assert.ok(listPayload.data.every((job) => job.channelId === "ch_historia"));
    assert.ok(listPayload.data.some((job) => job.publicationTargetId === "pt_historia_youtube"));

    const rescheduleResponse = await fetch(
      `${baseUrl}/api/publications/${createPayload.data.id}/reschedule`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channelId: "ch_historia",
          scheduledAt: null,
          requestedBy: "Ana Ribeiro",
        }),
      },
    );
    assert.equal(rescheduleResponse.status, 200);
    const reschedulePayload = (await rescheduleResponse.json()) as {
      data: { id: string; status: string; scheduledAt?: string };
      meta: { requestId: string };
    };
    assert.equal(reschedulePayload.data.id, createPayload.data.id);
    assert.equal(reschedulePayload.data.status, "draft");

    const blockedResponse = await fetch(`${baseUrl}/api/publications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: "ch_historia",
        publicationTargetId: "pt_historia_tiktok",
        contentId: "idea_06",
        sourceVideoAssetId: "vd_historia_01",
        title: "A logistica do Imperio Romano",
        description: "Pacote bloqueado por readiness.",
        idempotencyKey: "publication:http:block:001",
        requestedBy: "Ana Ribeiro",
      }),
    });
    assert.equal(blockedResponse.status, 409);
    const blockedPayload = (await blockedResponse.json()) as {
      error: { code: string; message: string };
      meta: { requestId: string };
    };
    assert.equal(blockedPayload.error.code, "OPERATION_BLOCKED");
  } finally {
    await stopServer(server);
    harness.cleanup();
  }
});
