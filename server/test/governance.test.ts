import assert from "node:assert/strict";
import { once } from "node:events";
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
import type {
  ClaimEvidence,
  ResearchSession,
  VisualPlan,
} from "../src/modules/editorial/editorial.types.js";
import { createGovernanceRepository } from "../src/modules/governance/governance.repository.js";
import { createGovernanceService } from "../src/modules/governance/governance.service.js";
import { governanceDemoSeed } from "../src/modules/governance/governance.seed.js";

function createHarness(seed?: typeof governanceDemoSeed) {
  const channelsRepository = createChannelsRepository(channelDemoSeed);
  const editorialRepository = createEditorialRepository(editorialDemoSeed);
  const governanceRepository = createGovernanceRepository(seed);
  const auditRepository = createAuditRepository();
  const auditService = createAuditService(auditRepository);
  let tick = 0;
  let id = 0;

  const service = createGovernanceService(
    governanceRepository,
    editorialRepository,
    channelsRepository,
    {
      clock: () => new Date(Date.parse("2026-07-13T03:30:00.000Z") + tick++ * 1000),
      idFactory: () => String(++id).padStart(4, "0"),
      auditService,
    },
  );

  return {
    channelsRepository,
    editorialRepository,
    governanceRepository,
    auditRepository,
    service,
  };
}

async function startServer(harness: ReturnType<typeof createHarness>) {
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
    governanceRepository: harness.governanceRepository,
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

function expectAppError(error: unknown, status: number, code: string): void {
  assert.ok(error instanceof AppError, "Expected AppError");
  assert.equal(error.status, status);
  assert.equal(error.code, code);
}

function insertBlockedResearchFixture(harness: ReturnType<typeof createHarness>): void {
  const session: ResearchSession = {
    id: "rs_custom",
    channelId: "ch_historia",
    contentId: "idea_01",
    title: "Sessao sem fontes",
    status: "running",
    sourceCount: 0,
    claimCount: 1,
    confidenceScore: 20,
    riskLevel: "attention",
    createdAt: "2026-07-13T03:30:00.000Z",
    updatedAt: "2026-07-13T03:30:00.000Z",
  };

  const claim: ClaimEvidence = {
    id: "ce_custom",
    channelId: "ch_historia",
    researchSessionId: "rs_custom",
    sourceId: "missing_source",
    claim: "Fato sem base documental",
    evidenceSummary: "Nenhuma fonte vinculada.",
    informationType: "fact",
    confidenceLevel: "high",
    riskLevel: "warning",
    createdAt: "2026-07-13T03:30:00.000Z",
    updatedAt: "2026-07-13T03:30:00.000Z",
  };

  harness.editorialRepository.upsertResearchSession(session);
  harness.editorialRepository.upsertClaimEvidence(claim);
}

function insertBlockedVisualPlanFixture(harness: ReturnType<typeof createHarness>): void {
  const plan: VisualPlan = {
    id: "vp_custom_blocked",
    channelId: "ch_historia",
    contentId: "idea_02",
    scriptVersionId: "scv_01_v2",
    title: "Plano visual sem cenas",
    status: "visual_plan",
    sceneCount: 2,
    estimatedDurationSeconds: 720,
    visualStyle: "Composicao cinematografica com falta de cobertura.",
    createdAt: "2026-07-13T03:30:00.000Z",
    updatedAt: "2026-07-13T03:30:00.000Z",
  };

  harness.editorialRepository.upsertVisualPlan(plan);
}

test("governance service enforces approvals, quality and compliance rules", () => {
  const harness = createHarness();

  const approval = harness.service.createApproval({
    channelId: "ch_historia",
    entityType: "script",
    entityId: "sc_01",
    requestedBy: "Ana Ribeiro",
    title: "Aprovar roteiro",
    summary: "Roteiro pronto para publicacao.",
  });

  assert.equal(approval.status, "pending");
  assert.equal(approval.channelId, "ch_historia");
  assert.ok(approval.qualityCheckId);
  assert.ok(approval.complianceCheckId);

  const approved = harness.service.approveApproval(approval.id, {
    decidedBy: "Ana Ribeiro",
    decisionReason: "Roteiro consistente e com CTA pronto.",
  });

  assert.equal(approved.status, "approved");
  assert.equal(approved.decidedBy, "Ana Ribeiro");
  assert.equal(approved.decisionReason, "Roteiro consistente e com CTA pronto.");

  assert.throws(
    () =>
      harness.service.approveApproval(approval.id, {
        decidedBy: "Ana Ribeiro",
        decisionReason: "Tentativa repetida.",
      }),
    (error) => {
      expectAppError(error, 409, "CONFLICT");
      return true;
    },
  );

  const rejectionTarget = harness.service.createApproval({
    channelId: "ch_curiosidades",
    entityType: "content_idea",
    entityId: "idea_03",
    requestedBy: "Bruno Lima",
  });

  const rejected = harness.service.rejectApproval(rejectionTarget.id, {
    decidedBy: "Bruno Lima",
    decisionReason: "A pauta precisa de ajuste editorial antes de seguir.",
  });

  assert.equal(rejected.status, "rejected");

  const changesTarget = harness.service.createApproval({
    channelId: "ch_curiosidades",
    entityType: "production_item",
    entityId: "pi_idea_03",
    requestedBy: "Bruno Lima",
  });

  const changesRequested = harness.service.requestApprovalChanges(changesTarget.id, {
    decidedBy: "Bruno Lima",
    decisionReason: "Adicionar detalhes na proxima acao.",
  });

  assert.equal(changesRequested.status, "changes_requested");

  const blocked = harness.service.createApproval({
    channelId: "ch_historia",
    entityType: "visual_plan",
    entityId: "vp_01",
    requestedBy: "Ana Ribeiro",
  });

  assert.equal(blocked.status, "blocked");

  assert.throws(
    () =>
      harness.service.approveApproval(blocked.id, {
        decidedBy: "Ana Ribeiro",
        decisionReason: "Bloqueio ignorado.",
      }),
    (error) => {
      expectAppError(error, 409, "COMPLIANCE_BLOCKED");
      return true;
    },
  );
});

test("governance service rejects invalid entities, channels and payloads", () => {
  const harness = createHarness();

  assert.throws(
    () =>
      harness.service.createApproval({
        channelId: "ch_historia",
        entityType: "script",
        entityId: "missing_script",
        requestedBy: "Ana Ribeiro",
      }),
    (error) => {
      expectAppError(error, 404, "NOT_FOUND");
      return true;
    },
  );

  assert.throws(
    () =>
      harness.service.createApproval({
        channelId: "ch_historia",
        entityType: "content_idea",
        entityId: "idea_03",
        requestedBy: "Ana Ribeiro",
      }),
    (error) => {
      expectAppError(error, 409, "CONFLICT");
      return true;
    },
  );

  assert.throws(
    () =>
      harness.service.createApproval({
        channelId: "ch_historia",
        entityType: "video_asset" as never,
        entityId: "idea_03",
        requestedBy: "Ana Ribeiro",
      }),
    (error) => error instanceof Error,
  );

  const approval = harness.service.createApproval({
    channelId: "ch_historia",
    entityType: "script",
    entityId: "sc_01",
    requestedBy: "Ana Ribeiro",
  });

  assert.throws(
    () =>
      harness.service.rejectApproval(approval.id, {
        decidedBy: "Ana Ribeiro",
        decisionReason: "   ",
      }),
    (error) => error instanceof Error,
  );
});

test("governance service evaluates quality and compliance deterministically", () => {
  const harness = createHarness();
  insertBlockedResearchFixture(harness);
  insertBlockedVisualPlanFixture(harness);

  const passedQuality = harness.service.createQualityCheck({
    channelId: "ch_historia",
    entityType: "script",
    entityId: "sc_01",
  });
  assert.equal(passedQuality.status, "passed");
  assert.equal(passedQuality.blockingFindings.length, 0);

  const blockedQuality = harness.service.createQualityCheck({
    channelId: "ch_historia",
    entityType: "visual_plan",
    entityId: "vp_custom_blocked",
  });
  assert.equal(blockedQuality.status, "blocked");
  assert.ok(blockedQuality.blockingFindings.length > 0);

  const needsReview = harness.service.createComplianceCheck({
    channelId: "ch_historia",
    entityType: "research_session",
    entityId: "rs_01",
  });
  assert.equal(needsReview.status, "needs_human_review");
  assert.equal(needsReview.requiresHumanReview, true);

  const blockedCompliance = harness.service.createComplianceCheck({
    channelId: "ch_historia",
    entityType: "research_session",
    entityId: "rs_custom",
  });
  assert.equal(blockedCompliance.status, "blocked");
  assert.ok(
    blockedCompliance.blockingFindings.some((finding) => finding.code === "sources_missing"),
  );
  assert.ok(
    blockedCompliance.blockingFindings.some((finding) => finding.code === "claim_source_mismatch"),
  );
});

test("governance repositories keep ordering, cloning and channel isolation deterministic", () => {
  const harness = createHarness(governanceDemoSeed);

  const statuses = harness.service.listApprovals().map((approval) => approval.status);
  assert.deepEqual(statuses.slice(0, 4), ["pending", "blocked", "changes_requested", "rejected"]);
  assert.equal(statuses.filter((status) => status === "approved").length, 3);

  const historiaApprovals = harness.service.listApprovals({ channelId: "ch_historia" });
  assert.ok(historiaApprovals.length > 0);
  assert.ok(historiaApprovals.every((approval) => approval.channelId === "ch_historia"));

  const approval = harness.service.getApproval("ap_02");
  assert.ok(approval);
  approval.summary = "mutado";
  assert.notEqual(harness.service.getApproval("ap_02")?.summary, "mutado");

  const history = harness.service.getApprovalHistory("ap_02");
  history[0].justification = "mutado";
  assert.notEqual(harness.service.getApprovalHistory("ap_02")[0].justification, "mutado");
});

test("governance HTTP routes expose envelopes and domain errors", async () => {
  const harness = createHarness();
  insertBlockedResearchFixture(harness);
  const { baseUrl, server } = await startServer(harness);

  try {
    const createdResponse = await fetch(`${baseUrl}/api/approvals`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": "sprint19-approval-create",
      },
      body: JSON.stringify({
        channelId: "ch_historia",
        entityType: "script",
        entityId: "sc_01",
        requestedBy: "Ana Ribeiro",
        title: "Aprovar roteiro",
      }),
    });

    assert.equal(createdResponse.status, 201);
    const createdPayload = (await createdResponse.json()) as {
      data: { id: string; status: string; qualityCheckId: string; complianceCheckId: string };
      meta: { requestId: string };
    };
    assert.equal(createdPayload.data.status, "pending");
    assert.ok(createdPayload.data.qualityCheckId);
    assert.ok(createdPayload.data.complianceCheckId);
    assert.ok(createdPayload.meta.requestId);

    const approvedResponse = await fetch(
      `${baseUrl}/api/approvals/${createdPayload.data.id}/approve`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": "sprint19-approval-approve",
        },
        body: JSON.stringify({
          decidedBy: "Ana Ribeiro",
          decisionReason: "Roteiro consistente e com CTA pronto.",
        }),
      },
    );

    assert.equal(approvedResponse.status, 200);
    const approvedPayload = (await approvedResponse.json()) as {
      data: { status: string; decidedBy: string };
      meta: { requestId: string };
    };
    assert.equal(approvedPayload.data.status, "approved");
    assert.equal(approvedPayload.data.decidedBy, "Ana Ribeiro");

    const historyResponse = await fetch(
      `${baseUrl}/api/approvals/${createdPayload.data.id}/history?channelId=ch_historia`,
    );
    assert.equal(historyResponse.status, 200);
    const historyPayload = (await historyResponse.json()) as {
      data: Array<{ approvalId: string; decision: string }>;
      meta: { requestId: string };
    };
    assert.equal(historyPayload.data.length, 1);
    assert.equal(historyPayload.data[0].decision, "approve");

    const crossChannelApprovalResponse = await fetch(
      `${baseUrl}/api/approvals/${createdPayload.data.id}?channelId=ch_negocios`,
    );
    assert.equal(crossChannelApprovalResponse.status, 404);
    const crossChannelApprovalPayload = (await crossChannelApprovalResponse.json()) as {
      error: { message: string };
    };
    assert.equal(crossChannelApprovalPayload.error.message, "Governance entity not found");

    const blockedResponse = await fetch(`${baseUrl}/api/approvals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: "ch_historia",
        entityType: "visual_plan",
        entityId: "vp_01",
        requestedBy: "Ana Ribeiro",
      }),
    });

    assert.equal(blockedResponse.status, 201);
    const blockedPayload = (await blockedResponse.json()) as {
      data: { id: string; status: string };
    };
    assert.equal(blockedPayload.data.status, "blocked");

    const blockedDecisionResponse = await fetch(
      `${baseUrl}/api/approvals/${blockedPayload.data.id}/approve`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decidedBy: "Ana Ribeiro",
          decisionReason: "Tentativa bloqueada.",
        }),
      },
    );

    assert.equal(blockedDecisionResponse.status, 409);
    const blockedDecisionPayload = (await blockedDecisionResponse.json()) as {
      error: { code: string; message: string };
    };
    assert.equal(blockedDecisionPayload.error.code, "COMPLIANCE_BLOCKED");

    const qualityListResponse = await fetch(
      `${baseUrl}/api/quality-checks?channelId=ch_historia&entityType=script`,
    );
    assert.equal(qualityListResponse.status, 200);
    const qualityListPayload = (await qualityListResponse.json()) as {
      data: Array<{ status: string; entityType: string }>;
      meta: { requestId: string };
    };
    assert.ok(qualityListPayload.data.some((item) => item.entityType === "script"));

    const complianceResponse = await fetch(`${baseUrl}/api/compliance-checks`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": "sprint19-compliance-create",
      },
      body: JSON.stringify({
        channelId: "ch_historia",
        entityType: "research_session",
        entityId: "rs_custom",
      }),
    });

    assert.equal(complianceResponse.status, 201);
    const compliancePayload = (await complianceResponse.json()) as {
      data: { status: string; blockingFindings: Array<{ code: string }> };
      meta: { requestId: string };
    };
    assert.equal(compliancePayload.data.status, "blocked");
    assert.ok(
      compliancePayload.data.blockingFindings.some((finding) => finding.code === "sources_missing"),
    );

    const crossChannelQualityResponse = await fetch(`${baseUrl}/api/quality-checks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channelId: "ch_negocios",
        entityType: "script",
        entityId: "sc_01",
      }),
    });
    assert.equal(crossChannelQualityResponse.status, 409);

    const auditLogsResponse = await fetch(`${baseUrl}/api/audit-logs?channelId=ch_historia`);
    assert.equal(auditLogsResponse.status, 200);
    const auditLogsPayload = (await auditLogsResponse.json()) as {
      data: Array<{ action: string; requestId?: string; entityId: string }>;
    };
    assert.ok(
      auditLogsPayload.data.some(
        (log) =>
          log.action === "approval.created" &&
          log.entityId === createdPayload.data.id &&
          log.requestId === "sprint19-approval-create",
      ),
    );
    assert.ok(
      auditLogsPayload.data.some(
        (log) =>
          log.action === "approval.approved" &&
          log.entityId === createdPayload.data.id &&
          log.requestId === "sprint19-approval-approve",
      ),
    );
    assert.ok(
      auditLogsPayload.data.some(
        (log) =>
          log.action === "compliance_check.created" &&
          log.requestId === "sprint19-compliance-create",
      ),
    );

    const invalidDecisionResponse = await fetch(
      `${baseUrl}/api/approvals/${createdPayload.data.id}/reject`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decidedBy: "Ana Ribeiro",
          decisionReason: " ",
        }),
      },
    );

    assert.equal(invalidDecisionResponse.status, 400);
    const invalidDecisionPayload = (await invalidDecisionResponse.json()) as {
      error: { code: string };
    };
    assert.equal(invalidDecisionPayload.error.code, "VALIDATION_ERROR");

    const notFoundResponse = await fetch(`${baseUrl}/api/approvals/ap_missing`);
    assert.equal(notFoundResponse.status, 404);
  } finally {
    await stopServer(server);
  }
});
