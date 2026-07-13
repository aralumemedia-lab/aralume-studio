import { randomUUID } from "node:crypto";

import { AppError } from "../../http/errors.js";
import type { ChannelsRepository } from "../channels/channel.types.js";
import type {
  ClaimEvidence,
  ContentIdea,
  EditorialRepository,
  ProductionItem,
  ResearchSession,
  ResearchSource,
  Script,
  ScriptVersion,
  VisualPlan,
} from "../editorial/editorial.types.js";
import {
  approvalCreateSchema,
  approvalDecisionSchema,
  approvalStatusSchema,
  channelIdSchema,
  complianceCheckCreateSchema,
  complianceStatusSchema,
  governanceEntityTypeSchema,
  idSchema,
  qualityCheckCreateSchema,
  qualityCheckStatusSchema,
  riskLevelSchema,
} from "./governance.schema.js";
import type {
  ApprovalDecision,
  ApprovalDecisionInput,
  ApprovalFilters,
  ApprovalStatus,
  ComplianceCheck,
  ComplianceCheckCreateInput,
  ComplianceCheckFilters,
  ComplianceStatus,
  GovernanceEntityType,
  GovernanceRepository,
  GovernanceTargetSnapshot,
  HumanApproval,
  QualityCheck,
  QualityCheckCreateInput,
  QualityCheckFilters,
  QualityCheckItem,
  QualityCheckResult,
  QualityCheckStatus,
  RiskLevel,
  ApprovalCreateInput,
} from "./governance.types.js";

export type GovernanceClock = () => Date;
export type GovernanceIdFactory = () => string;

export type CreateGovernanceServiceOptions = {
  clock?: GovernanceClock;
  idFactory?: GovernanceIdFactory;
};

export type GovernanceService = {
  listApprovals(filters?: ApprovalFilters): HumanApproval[];
  getApproval(id: string): HumanApproval;
  createApproval(input: ApprovalCreateInput): HumanApproval;
  approveApproval(id: string, input: ApprovalDecisionInput): HumanApproval;
  rejectApproval(id: string, input: ApprovalDecisionInput): HumanApproval;
  requestApprovalChanges(id: string, input: ApprovalDecisionInput): HumanApproval;
  getApprovalHistory(id: string): ApprovalDecision[];
  listQualityChecks(filters?: QualityCheckFilters): QualityCheck[];
  getQualityCheck(id: string): QualityCheck;
  createQualityCheck(input: QualityCheckCreateInput): QualityCheck;
  listComplianceChecks(filters?: ComplianceCheckFilters): ComplianceCheck[];
  getComplianceCheck(id: string): ComplianceCheck;
  createComplianceCheck(input: ComplianceCheckCreateInput): ComplianceCheck;
};

type ResolvedTarget = {
  targetSnapshot: GovernanceTargetSnapshot;
  relatedTitle: string;
  relatedSummary: string;
  relatedStatus: string;
  relatedRiskLevel: RiskLevel;
};

type EvaluatedQuality = {
  status: QualityCheckStatus;
  score: number;
  checks: QualityCheckItem[];
  findings: QualityCheckItem[];
  blockingFindings: QualityCheckItem[];
  summary: string;
};

type EvaluatedCompliance = {
  status: ComplianceStatus;
  riskLevel: RiskLevel;
  findings: Array<{
    code: string;
    name: string;
    severity: RiskLevel;
    message: string;
    blocking: boolean;
    metadata: Record<string, unknown>;
  }>;
  blockingFindings: Array<{
    code: string;
    name: string;
    severity: RiskLevel;
    message: string;
    blocking: boolean;
    metadata: Record<string, unknown>;
  }>;
  requiresHumanReview: boolean;
};

const qualityPenalty: Record<QualityCheckItem["severity"], number> = {
  ok: 0,
  attention: 10,
  warning: 15,
  critical: 25,
  blocked: 40,
};

const riskOrder: Record<RiskLevel, number> = {
  ok: 0,
  attention: 1,
  warning: 2,
  critical: 3,
  blocked: 4,
};

export function createGovernanceService(
  repository: GovernanceRepository,
  editorialRepository: EditorialRepository,
  channelsRepository: ChannelsRepository,
  options: CreateGovernanceServiceOptions = {},
): GovernanceService {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? (() => randomUUID());

  return {
    listApprovals(filters = {}) {
      const normalized = normalizeApprovalFilters(filters);
      validateOptionalChannel(channelsRepository, normalized.channelId);
      return repository.listApprovals(normalized);
    },

    getApproval(id) {
      return getRequiredApproval(repository, id);
    },

    createApproval(input) {
      const parsed = approvalCreateSchema.parse(input);
      validateChannelExists(channelsRepository, parsed.channelId);
      const target = resolveTarget(
        editorialRepository,
        parsed.channelId,
        parsed.entityType,
        parsed.entityId,
      );
      const qualityCheck = ensureCurrentQualityCheck(
        repository,
        editorialRepository,
        idFactory,
        clock,
        target,
      );
      const complianceCheck = ensureCurrentComplianceCheck(
        repository,
        editorialRepository,
        idFactory,
        clock,
        target,
      );
      const now = toIso(clock());
      const initialStatus = isApprovalBlocked(qualityCheck, complianceCheck)
        ? "blocked"
        : "pending";
      const approval: HumanApproval = {
        id: `ap_${idFactory()}`,
        channelId: parsed.channelId,
        entityType: parsed.entityType,
        entityId: parsed.entityId,
        title: parsed.title ?? target.relatedTitle,
        status: initialStatus,
        riskLevel: deriveApprovalRisk(target.relatedRiskLevel, qualityCheck, complianceCheck),
        summary: parsed.summary ?? buildApprovalSummary(target, qualityCheck, complianceCheck),
        requestedAt: now,
        requestedBy: parsed.requestedBy,
        createdAt: now,
        updatedAt: now,
        targetSnapshot: target.targetSnapshot,
        qualityCheckId: qualityCheck.id,
        complianceCheckId: complianceCheck.id,
      };

      repository.upsertApproval(approval);
      return approval;
    },

    approveApproval(id, input) {
      return decideApproval(
        repository,
        editorialRepository,
        channelsRepository,
        clock,
        idFactory,
        id,
        {
          ...approvalDecisionSchema.parse(input),
          decision: "approve",
        },
      );
    },

    rejectApproval(id, input) {
      return decideApproval(
        repository,
        editorialRepository,
        channelsRepository,
        clock,
        idFactory,
        id,
        {
          ...approvalDecisionSchema.parse(input),
          decision: "reject",
        },
      );
    },

    requestApprovalChanges(id, input) {
      return decideApproval(
        repository,
        editorialRepository,
        channelsRepository,
        clock,
        idFactory,
        id,
        {
          ...approvalDecisionSchema.parse(input),
          decision: "request_changes",
        },
      );
    },

    getApprovalHistory(id) {
      getRequiredApproval(repository, id);
      return repository.listApprovalDecisions(id);
    },

    listQualityChecks(filters = {}) {
      const normalized = normalizeQualityFilters(filters);
      validateOptionalChannel(channelsRepository, normalized.channelId);
      return repository.listQualityChecks(normalized);
    },

    getQualityCheck(id) {
      return getRequiredQualityCheck(repository, id);
    },

    createQualityCheck(input) {
      const parsed = qualityCheckCreateSchema.parse(input);
      validateChannelExists(channelsRepository, parsed.channelId);
      const target = resolveTarget(
        editorialRepository,
        parsed.channelId,
        parsed.entityType,
        parsed.entityId,
      );
      const now = toIso(clock());
      const evaluated = evaluateQuality(editorialRepository, target);
      const check: QualityCheck = {
        id: `qc_${idFactory()}`,
        channelId: parsed.channelId,
        entityType: parsed.entityType,
        entityId: parsed.entityId,
        status: evaluated.status,
        score: evaluated.score,
        checks: evaluated.checks,
        findings: evaluated.findings,
        blockingFindings: evaluated.blockingFindings,
        checkedAt: now,
        createdAt: now,
        updatedAt: now,
        targetSnapshot: target.targetSnapshot,
        summary: evaluated.summary,
      };

      repository.upsertQualityCheck(check);
      return check;
    },

    listComplianceChecks(filters = {}) {
      const normalized = normalizeComplianceFilters(filters);
      validateOptionalChannel(channelsRepository, normalized.channelId);
      return repository.listComplianceChecks(normalized);
    },

    getComplianceCheck(id) {
      return getRequiredComplianceCheck(repository, id);
    },

    createComplianceCheck(input) {
      const parsed = complianceCheckCreateSchema.parse(input);
      validateChannelExists(channelsRepository, parsed.channelId);
      const target = resolveTarget(
        editorialRepository,
        parsed.channelId,
        parsed.entityType,
        parsed.entityId,
      );
      const now = toIso(clock());
      const evaluated = evaluateCompliance(editorialRepository, target);
      const check: ComplianceCheck = {
        id: `cc_${idFactory()}`,
        channelId: parsed.channelId,
        entityType: parsed.entityType,
        entityId: parsed.entityId,
        status: evaluated.status,
        riskLevel: evaluated.riskLevel,
        findings: evaluated.findings,
        blockingFindings: evaluated.blockingFindings,
        checkedAt: now,
        createdAt: now,
        updatedAt: now,
        targetSnapshot: target.targetSnapshot,
        requiresHumanReview: evaluated.requiresHumanReview,
      };

      repository.upsertComplianceCheck(check);
      return check;
    },
  };
}

function decideApproval(
  repository: GovernanceRepository,
  editorialRepository: EditorialRepository,
  channelsRepository: ChannelsRepository,
  clock: GovernanceClock,
  idFactory: GovernanceIdFactory,
  approvalId: string,
  input: ApprovalDecisionInput & {
    decision: "approve" | "reject" | "request_changes";
  },
): HumanApproval {
  const approval = getRequiredApproval(repository, approvalId);
  validateChannelExists(channelsRepository, approval.channelId);
  const target = resolveTarget(
    editorialRepository,
    approval.channelId,
    approval.entityType,
    approval.entityId,
  );
  const qualityCheck = ensureCurrentQualityCheck(
    repository,
    editorialRepository,
    idFactory,
    clock,
    target,
  );
  const complianceCheck = ensureCurrentComplianceCheck(
    repository,
    editorialRepository,
    idFactory,
    clock,
    target,
  );
  const now = toIso(clock());

  assertTransitionAllowed(approval, input.decision, qualityCheck, complianceCheck);

  const nextStatus = decisionToStatus(input.decision);
  const latestDecisionId = `ad_${idFactory()}`;
  const updated: HumanApproval = {
    ...approval,
    status: nextStatus,
    riskLevel: deriveApprovalRisk(target.relatedRiskLevel, qualityCheck, complianceCheck),
    decidedAt: now,
    decidedBy: input.decidedBy,
    decisionReason: input.decisionReason,
    updatedAt: now,
    targetSnapshot: target.targetSnapshot,
    qualityCheckId: qualityCheck.id,
    complianceCheckId: complianceCheck.id,
    latestDecisionId,
  };

  repository.upsertApproval(updated);
  repository.appendApprovalDecision({
    id: latestDecisionId,
    approvalId: approval.id,
    previousStatus: approval.status,
    nextStatus,
    decision: input.decision,
    justification: input.decisionReason,
    actor: input.decidedBy,
    decidedAt: now,
    createdAt: now,
  });

  return updated;
}

function assertTransitionAllowed(
  approval: HumanApproval,
  decision: "approve" | "reject" | "request_changes",
  qualityCheck: QualityCheck,
  complianceCheck: ComplianceCheck,
): void {
  if (approval.status === "approved" || approval.status === "rejected") {
    throw conflict("Approval already reached a final state", {
      approvalId: approval.id,
      status: approval.status,
    });
  }

  if (decision === "approve") {
    if (qualityCheck.status === "blocked" || qualityCheck.blockingFindings.length > 0) {
      throw operationBlocked("Quality gate blocked approval", {
        approvalId: approval.id,
        qualityCheckId: qualityCheck.id,
      });
    }

    if (complianceCheck.status === "blocked" || complianceCheck.status === "rejected") {
      throw complianceBlocked("Compliance gate blocked approval", {
        approvalId: approval.id,
        complianceCheckId: complianceCheck.id,
      });
    }

    if (complianceCheck.blockingFindings.length > 0) {
      throw complianceBlocked("Compliance findings block approval", {
        approvalId: approval.id,
        complianceCheckId: complianceCheck.id,
      });
    }
  }

  if (decision === "request_changes" && approval.status === "changes_requested") {
    throw conflict("Approval already requested changes", { approvalId: approval.id });
  }
}

function decisionToStatus(decision: "approve" | "reject" | "request_changes"): ApprovalStatus {
  switch (decision) {
    case "approve":
      return "approved";
    case "reject":
      return "rejected";
    case "request_changes":
      return "changes_requested";
  }
}

function ensureCurrentQualityCheck(
  repository: GovernanceRepository,
  editorialRepository: EditorialRepository,
  idFactory: GovernanceIdFactory,
  clock: GovernanceClock,
  target: ResolvedTarget,
): QualityCheck {
  const existing = repository
    .listQualityChecks({
      channelId: target.targetSnapshot.channelId,
      entityType: target.targetSnapshot.entityType,
      entityId: target.targetSnapshot.entityId,
    })
    .at(0);

  if (existing) {
    return existing;
  }

  const created = buildQualityCheck(editorialRepository, target, idFactory, clock);
  repository.upsertQualityCheck(created);
  return created;
}

function ensureCurrentComplianceCheck(
  repository: GovernanceRepository,
  editorialRepository: EditorialRepository,
  idFactory: GovernanceIdFactory,
  clock: GovernanceClock,
  target: ResolvedTarget,
): ComplianceCheck {
  const existing = repository
    .listComplianceChecks({
      channelId: target.targetSnapshot.channelId,
      entityType: target.targetSnapshot.entityType,
      entityId: target.targetSnapshot.entityId,
    })
    .at(0);

  if (existing) {
    return existing;
  }

  const created = buildComplianceCheck(editorialRepository, target, idFactory, clock);
  repository.upsertComplianceCheck(created);
  return created;
}

function buildQualityCheck(
  editorialRepository: EditorialRepository,
  target: ResolvedTarget,
  idFactory: GovernanceIdFactory,
  clock: GovernanceClock,
): QualityCheck {
  const evaluated = evaluateQuality(editorialRepository, target);
  const now = toIso(clock());
  return {
    id: `qc_${idFactory()}`,
    channelId: target.targetSnapshot.channelId,
    entityType: target.targetSnapshot.entityType,
    entityId: target.targetSnapshot.entityId,
    status: evaluated.status,
    score: evaluated.score,
    checks: evaluated.checks,
    findings: evaluated.findings,
    blockingFindings: evaluated.blockingFindings,
    checkedAt: now,
    createdAt: now,
    updatedAt: now,
    targetSnapshot: target.targetSnapshot,
    summary: evaluated.summary,
  };
}

function buildComplianceCheck(
  editorialRepository: EditorialRepository,
  target: ResolvedTarget,
  idFactory: GovernanceIdFactory,
  clock: GovernanceClock,
): ComplianceCheck {
  const evaluated = evaluateCompliance(editorialRepository, target);
  const now = toIso(clock());
  return {
    id: `cc_${idFactory()}`,
    channelId: target.targetSnapshot.channelId,
    entityType: target.targetSnapshot.entityType,
    entityId: target.targetSnapshot.entityId,
    status: evaluated.status,
    riskLevel: evaluated.riskLevel,
    findings: evaluated.findings,
    blockingFindings: evaluated.blockingFindings,
    checkedAt: now,
    createdAt: now,
    updatedAt: now,
    targetSnapshot: target.targetSnapshot,
    requiresHumanReview: evaluated.requiresHumanReview,
  };
}

function evaluateQuality(
  editorialRepository: EditorialRepository,
  target: ResolvedTarget,
): EvaluatedQuality {
  const checks: QualityCheckItem[] = [];

  switch (target.targetSnapshot.entityType) {
    case "content_idea": {
      const idea = getRequiredContentIdea(editorialRepository, target.targetSnapshot.entityId);
      checks.push(
        qualityCheck("title_present", "Titulo presente", idea.title.trim().length > 0, {
          severity: "blocked",
          message: "A pauta precisa de um titulo.",
        }),
        qualityCheck("summary_present", "Resumo presente", idea.summary.trim().length > 0, {
          severity: "blocked",
          message: "A pauta precisa de um resumo.",
        }),
        qualityCheck("source_present", "Fonte presente", idea.source.trim().length > 0, {
          severity: "blocked",
          message: "A pauta precisa de uma origem rastreavel.",
        }),
        qualityCheck(
          "score_bounds",
          "Scores validos",
          [
            idea.opportunityScore,
            (idea as ContentIdea).originalityScore,
            (idea as ContentIdea).visualPotentialScore,
            (idea as ContentIdea).clipPotentialScore,
          ].every((score) => Number.isInteger(score) && score >= 0 && score <= 100),
          {
            severity: "blocked",
            message: "Os scores editoriais devem ficar entre 0 e 100.",
          },
        ),
      );

      if (target.relatedRiskLevel === "attention" || idea.opportunityScore < 60) {
        checks.push(
          qualityCheck("opportunity_score", "Oportunidade", idea.opportunityScore >= 60, {
            severity: "attention",
            message: "A oportunidade editorial pede revisao.",
          }),
        );
      }

      return finalizeQualityChecks(checks, `${idea.title} pronto para triagem editorial.`);
    }

    case "production_item": {
      const item = getRequiredProductionItem(editorialRepository, target.targetSnapshot.entityId);
      checks.push(
        qualityCheck("title_present", "Titulo presente", item.title.trim().length > 0, {
          severity: "blocked",
          message: "O item de producao precisa de titulo.",
        }),
        qualityCheck(
          "next_action_present",
          "Proxima acao presente",
          item.nextAction.trim().length > 0,
          {
            severity: "blocked",
            message: "O item de producao precisa de proxima acao.",
          },
        ),
        qualityCheck(
          "progress_valid",
          "Progresso valido",
          item.progressPercent >= 0 && item.progressPercent <= 100,
          {
            severity: "blocked",
            message: "O progresso precisa ficar entre 0 e 100.",
          },
        ),
      );

      if (item.progressPercent < 80) {
        checks.push(
          qualityCheck("progress_maturity", "Maturidade do fluxo", item.progressPercent >= 80, {
            severity: "attention",
            message: "O item ainda esta abaixo do nivel desejado de conclusao.",
          }),
        );
      }

      if (target.relatedRiskLevel === "blocked") {
        checks.push(
          qualityCheck("risk_blocked", "Risco bloqueador", false, {
            severity: "blocked",
            message: "O item esta marcado como bloqueado.",
          }),
        );
      }

      return finalizeQualityChecks(checks, `${item.title} verificado na fila de producao.`);
    }

    case "research_session": {
      const session = getRequiredResearchSession(
        editorialRepository,
        target.targetSnapshot.entityId,
      );
      const sources = editorialRepository.listResearchSources({
        channelId: session.channelId,
        researchSessionId: session.id,
      });
      const claims = editorialRepository.listClaimEvidence({
        channelId: session.channelId,
        researchSessionId: session.id,
      });

      checks.push(
        qualityCheck("source_count", "Fontes registradas", sources.length > 0, {
          severity: "blocked",
          message: "A sessao de pesquisa precisa de ao menos uma fonte.",
        }),
        qualityCheck("claim_count", "Claims registradas", claims.length >= 0, {
          severity: "ok",
          message: "Claims contabilizadas.",
        }),
        qualityCheck(
          "summary_if_completed",
          "Resumo em sessao concluida",
          session.status !== "completed" || session.summary !== undefined,
          {
            severity: "blocked",
            message: "Sessoes concluidas precisam de resumo.",
          },
        ),
      );

      if (sources.some((source) => source.url === undefined || source.url.trim().length === 0)) {
        checks.push(
          qualityCheck("source_url_coverage", "Cobertura de URL", false, {
            severity: "attention",
            message: "Algumas fontes ainda nao possuem URL.",
          }),
        );
      }

      if (claims.length > sources.length * 2 && sources.length > 0) {
        checks.push(
          qualityCheck("claim_density", "Densidade de claims", false, {
            severity: "attention",
            message: "O volume de claims pede revisao humana.",
          }),
        );
      }

      return finalizeQualityChecks(checks, `${session.title} validado para o pipeline.`);
    }

    case "script": {
      const script = getRequiredScript(editorialRepository, target.targetSnapshot.entityId);
      const versions = editorialRepository.listScriptVersions({
        channelId: script.channelId,
        scriptId: script.id,
      });
      const currentVersion = versions.find((version) => version.id === script.currentVersionId);

      checks.push(
        qualityCheck("title_present", "Titulo presente", script.title.trim().length > 0, {
          severity: "blocked",
          message: "O roteiro precisa de titulo.",
        }),
        qualityCheck("hook_present", "Hook presente", script.hook.trim().length > 0, {
          severity: "blocked",
          message: "O roteiro precisa de hook.",
        }),
        qualityCheck("promise_present", "Promessa presente", script.promise.trim().length > 0, {
          severity: "blocked",
          message: "O roteiro precisa de promessa.",
        }),
        qualityCheck("cta_present", "CTA presente", script.cta.trim().length > 0, {
          severity: "blocked",
          message: "O roteiro precisa de CTA.",
        }),
        qualityCheck(
          "current_version_present",
          "Versao atual presente",
          currentVersion !== undefined,
          {
            severity: "blocked",
            message: "O roteiro precisa de uma versao atual valida.",
          },
        ),
        qualityCheck("duration_present", "Duracao valida", script.estimatedDurationSeconds > 0, {
          severity: "blocked",
          message: "A duracao estimada precisa ser positiva.",
        }),
      );

      if (currentVersion && currentVersion.sceneCount <= 0) {
        checks.push(
          qualityCheck("scene_count", "Cenas presentes", false, {
            severity: "blocked",
            message: "A versao atual precisa ter ao menos uma cena.",
          }),
        );
      }

      return finalizeQualityChecks(checks, `${script.title} pronto para aprovacao editorial.`);
    }

    case "visual_plan": {
      const visualPlan = getRequiredVisualPlan(editorialRepository, target.targetSnapshot.entityId);
      const scenes = editorialRepository.listScenePlans({
        channelId: visualPlan.channelId,
        visualPlanId: visualPlan.id,
      });

      checks.push(
        qualityCheck("title_present", "Titulo presente", visualPlan.title.trim().length > 0, {
          severity: "blocked",
          message: "O plano visual precisa de titulo.",
        }),
        qualityCheck(
          "style_present",
          "Estilo visual presente",
          visualPlan.visualStyle.trim().length > 0,
          {
            severity: "blocked",
            message: "O plano visual precisa de estilo visual.",
          },
        ),
        qualityCheck("scene_count_positive", "Numero de cenas valido", visualPlan.sceneCount > 0, {
          severity: "blocked",
          message: "O plano visual precisa de cena planejada.",
        }),
        qualityCheck(
          "scene_coverage",
          "Cobertura de cenas",
          scenes.length === visualPlan.sceneCount,
          {
            severity: scenes.length === 0 ? "blocked" : "attention",
            message: "A quantidade de cenas planejadas nao confere com o plano.",
          },
        ),
      );

      return finalizeQualityChecks(
        checks,
        `${visualPlan.title} verificado pelo gate de qualidade.`,
      );
    }
  }
}

function evaluateCompliance(
  editorialRepository: EditorialRepository,
  target: ResolvedTarget,
): EvaluatedCompliance {
  const findings: EvaluatedCompliance["findings"] = [];

  switch (target.targetSnapshot.entityType) {
    case "content_idea": {
      const idea = getRequiredContentIdea(editorialRepository, target.targetSnapshot.entityId);
      if (idea.source.trim().length === 0) {
        findings.push(
          complianceFinding(
            "source_missing",
            "Fonte ausente",
            "blocked",
            "A pauta precisa de origem rastreavel.",
            true,
            {
              title: idea.title,
            },
          ),
        );
      }

      if (idea.riskLevel === "blocked" || idea.riskLevel === "critical") {
        findings.push(
          complianceFinding(
            "risk_blocked",
            "Risco bloqueador",
            "blocked",
            "A pauta esta em nivel critico.",
            true,
            {
              riskLevel: idea.riskLevel,
            },
          ),
        );
      }

      if (idea.riskLevel === "attention" || idea.opportunityScore < 60) {
        findings.push(
          complianceFinding(
            "needs_review",
            "Revisao humana",
            "attention",
            "A pauta pede revisao humana antes do avancar.",
            false,
            { opportunityScore: idea.opportunityScore },
          ),
        );
      }

      return finalizeComplianceFindings(
        findings,
        target,
        false,
        `${idea.title} liberado para governanca.`,
      );
    }

    case "production_item": {
      const item = getRequiredProductionItem(editorialRepository, target.targetSnapshot.entityId);
      if (item.status === "blocked" || item.riskLevel === "blocked") {
        findings.push(
          complianceFinding(
            "production_blocked",
            "Item bloqueado",
            "blocked",
            "O item de producao esta bloqueado.",
            true,
            {
              status: item.status,
            },
          ),
        );
      }

      if (item.riskLevel === "warning" || item.riskLevel === "attention") {
        findings.push(
          complianceFinding(
            "production_attention",
            "Atenção operacional",
            "attention",
            "O item de producao ainda pede atencao.",
            false,
            {
              progressPercent: item.progressPercent,
            },
          ),
        );
      }

      return finalizeComplianceFindings(
        findings,
        target,
        false,
        `${item.title} analisado pela conformidade.`,
      );
    }

    case "research_session": {
      const session = getRequiredResearchSession(
        editorialRepository,
        target.targetSnapshot.entityId,
      );
      const sources = editorialRepository.listResearchSources({
        channelId: session.channelId,
        researchSessionId: session.id,
      });
      const claims = editorialRepository.listClaimEvidence({
        channelId: session.channelId,
        researchSessionId: session.id,
      });

      if (sources.length === 0) {
        findings.push(
          complianceFinding(
            "sources_missing",
            "Fontes ausentes",
            "blocked",
            "A pesquisa nao pode seguir sem fontes.",
            true,
            {},
          ),
        );
      }

      if (claims.some((claim) => !sources.some((source) => source.id === claim.sourceId))) {
        findings.push(
          complianceFinding(
            "claim_source_mismatch",
            "Claim sem relacao com fonte",
            "blocked",
            "Existe claim sem fonte valida vinculada.",
            true,
            {},
          ),
        );
      }

      if (sources.some((source) => source.url === undefined || source.url.trim().length === 0)) {
        findings.push(
          complianceFinding(
            "source_url_missing",
            "URL ausente",
            "attention",
            "Algumas fontes nao trazem URL explicita.",
            false,
            { sourceIds: sources.filter((source) => !source.url).map((source) => source.id) },
          ),
        );
      }

      const requiresReview = findings.some(
        (finding) => finding.severity !== "ok" && !finding.blocking,
      );

      return finalizeComplianceFindings(
        findings,
        target,
        requiresReview,
        `${session.title} verificado pela conformidade.`,
      );
    }

    case "script": {
      const script = getRequiredScript(editorialRepository, target.targetSnapshot.entityId);
      const versions = editorialRepository.listScriptVersions({
        channelId: script.channelId,
        scriptId: script.id,
      });
      const currentVersion = versions.find((version) => version.id === script.currentVersionId);

      if (!currentVersion) {
        findings.push(
          complianceFinding(
            "version_missing",
            "Versao atual ausente",
            "blocked",
            "O roteiro nao possui versao atual valida.",
            true,
            {},
          ),
        );
      }

      if (!script.cta.trim()) {
        findings.push(
          complianceFinding(
            "cta_missing",
            "CTA ausente",
            "blocked",
            "O roteiro precisa de CTA.",
            true,
            {},
          ),
        );
      }

      if (script.riskLevel === "attention") {
        findings.push(
          complianceFinding(
            "needs_review",
            "Revisao humana",
            "attention",
            "O roteiro pede revisao humana.",
            false,
            {
              riskLevel: script.riskLevel,
            },
          ),
        );
      }

      return finalizeComplianceFindings(
        findings,
        target,
        findings.some((finding) => !finding.blocking),
        `${script.title} verificado pela conformidade.`,
      );
    }

    case "visual_plan": {
      const visualPlan = getRequiredVisualPlan(editorialRepository, target.targetSnapshot.entityId);
      const scenes = editorialRepository.listScenePlans({
        channelId: visualPlan.channelId,
        visualPlanId: visualPlan.id,
      });

      if (scenes.length !== visualPlan.sceneCount) {
        findings.push(
          complianceFinding(
            "scene_mismatch",
            "Cenas inconsistentes",
            "blocked",
            "O plano visual nao confere com o numero de cenas registradas.",
            true,
            { sceneCount: visualPlan.sceneCount, actualScenes: scenes.length },
          ),
        );
      }

      if (scenes.length === 0) {
        findings.push(
          complianceFinding(
            "scene_absence",
            "Ausencia de cenas",
            "blocked",
            "Nao ha cenas para o plano visual.",
            true,
            {},
          ),
        );
      }

      const requiresReview = findings.some(
        (finding) => finding.severity === "attention" || finding.severity === "warning",
      );

      return finalizeComplianceFindings(
        findings,
        target,
        requiresReview,
        `${visualPlan.title} verificado pela conformidade.`,
      );
    }
  }
}

function finalizeQualityChecks(checks: QualityCheckItem[], summary: string): EvaluatedQuality {
  const findings = checks.filter((check) => check.result !== "pass");
  const blockingFindings = findings.filter((check) => check.blocking);
  const status: QualityCheckStatus =
    blockingFindings.length > 0 ? "blocked" : findings.length > 0 ? "attention" : "passed";
  const penalty = checks.reduce((sum, check) => sum + qualityPenalty[check.severity], 0);
  return {
    status,
    score: Math.max(0, 100 - penalty),
    checks,
    findings,
    blockingFindings,
    summary,
  };
}

function finalizeComplianceFindings(
  findings: EvaluatedCompliance["findings"],
  target: ResolvedTarget,
  requiresHumanReview: boolean,
  summary: string,
): EvaluatedCompliance {
  const blockingFindings = findings.filter((finding) => finding.blocking);
  const hasAttention = findings.some(
    (finding) => finding.severity === "attention" || finding.severity === "warning",
  );
  const status: ComplianceStatus =
    blockingFindings.length > 0
      ? "blocked"
      : requiresHumanReview
        ? "needs_human_review"
        : hasAttention
          ? "attention"
          : "approved";
  const riskLevel = deriveRiskFromFindings(findings, target.relatedRiskLevel);

  return {
    status,
    riskLevel,
    findings,
    blockingFindings,
    requiresHumanReview,
  };
}

function deriveRiskFromFindings(
  findings: Array<{ severity: RiskLevel }>,
  fallback: RiskLevel,
): RiskLevel {
  return findings.reduce((current, finding) => {
    return riskOrder[finding.severity] > riskOrder[current] ? finding.severity : current;
  }, fallback);
}

function qualityCheck(
  code: string,
  name: string,
  passed: boolean,
  options: { severity: RiskLevel; message: string },
): QualityCheckItem {
  return {
    code,
    name,
    result: passed ? "pass" : options.severity === "blocked" ? "blocked" : "attention",
    severity: passed ? "ok" : options.severity,
    message: options.message,
    blocking: options.severity === "blocked" && !passed,
    metadata: { passed },
  };
}

function complianceFinding(
  code: string,
  name: string,
  severity: RiskLevel,
  message: string,
  blocking: boolean,
  metadata: Record<string, unknown>,
): EvaluatedCompliance["findings"][number] {
  return { code, name, severity, message, blocking, metadata };
}

function resolveTarget(
  editorialRepository: EditorialRepository,
  channelId: string,
  entityType: GovernanceEntityType,
  entityId: string,
): ResolvedTarget {
  switch (entityType) {
    case "content_idea": {
      const idea = getRequiredContentIdea(editorialRepository, entityId);
      assertSameChannel(idea.channelId, channelId, "Content idea");
      return {
        targetSnapshot: {
          entityType,
          entityId: idea.id,
          channelId: idea.channelId,
          title: idea.title,
          summary: idea.summary,
          status: idea.status,
          riskLevel: idea.riskLevel,
        },
        relatedTitle: idea.title,
        relatedSummary: idea.summary,
        relatedStatus: idea.status,
        relatedRiskLevel: idea.riskLevel,
      };
    }
    case "production_item": {
      const item = getRequiredProductionItem(editorialRepository, entityId);
      assertSameChannel(item.channelId, channelId, "Production item");
      return {
        targetSnapshot: {
          entityType,
          entityId: item.id,
          channelId: item.channelId,
          title: item.title,
          summary: item.nextAction,
          status: item.status,
          riskLevel: item.riskLevel,
        },
        relatedTitle: item.title,
        relatedSummary: item.nextAction,
        relatedStatus: item.status,
        relatedRiskLevel: item.riskLevel,
      };
    }
    case "research_session": {
      const session = getRequiredResearchSession(editorialRepository, entityId);
      assertSameChannel(session.channelId, channelId, "Research session");
      return {
        targetSnapshot: {
          entityType,
          entityId: session.id,
          channelId: session.channelId,
          title: session.title,
          summary:
            session.summary ?? `${session.sourceCount} fontes e ${session.claimCount} claims`,
          status: session.status,
          riskLevel: session.riskLevel,
        },
        relatedTitle: session.title,
        relatedSummary:
          session.summary ?? `${session.sourceCount} fontes e ${session.claimCount} claims`,
        relatedStatus: session.status,
        relatedRiskLevel: session.riskLevel,
      };
    }
    case "script": {
      const script = getRequiredScript(editorialRepository, entityId);
      assertSameChannel(script.channelId, channelId, "Script");
      return {
        targetSnapshot: {
          entityType,
          entityId: script.id,
          channelId: script.channelId,
          title: script.title,
          summary: script.hook,
          status: script.status,
          riskLevel: script.riskLevel,
        },
        relatedTitle: script.title,
        relatedSummary: script.hook,
        relatedStatus: script.status,
        relatedRiskLevel: script.riskLevel,
      };
    }
    case "visual_plan": {
      const visualPlan = getRequiredVisualPlan(editorialRepository, entityId);
      assertSameChannel(visualPlan.channelId, channelId, "Visual plan");
      return {
        targetSnapshot: {
          entityType,
          entityId: visualPlan.id,
          channelId: visualPlan.channelId,
          title: visualPlan.title,
          summary: visualPlan.visualStyle,
          status: visualPlan.status,
          riskLevel: deriveVisualPlanRisk(editorialRepository, visualPlan),
        },
        relatedTitle: visualPlan.title,
        relatedSummary: visualPlan.visualStyle,
        relatedStatus: visualPlan.status,
        relatedRiskLevel: deriveVisualPlanRisk(editorialRepository, visualPlan),
      };
    }
  }
}

function deriveVisualPlanRisk(
  editorialRepository: EditorialRepository,
  visualPlan: VisualPlan,
): RiskLevel {
  const scenes = editorialRepository.listScenePlans({
    channelId: visualPlan.channelId,
    visualPlanId: visualPlan.id,
  });

  if (scenes.length === 0 || scenes.length !== visualPlan.sceneCount) {
    return "blocked";
  }

  return "ok";
}

function buildApprovalSummary(
  target: ResolvedTarget,
  qualityCheck: QualityCheck,
  complianceCheck: ComplianceCheck,
): string {
  return [
    target.relatedTitle,
    `Qualidade: ${qualityCheck.status}`,
    `Conformidade: ${complianceCheck.status}`,
  ].join(" · ");
}

function deriveApprovalRisk(
  targetRiskLevel: RiskLevel,
  qualityCheck: QualityCheck,
  complianceCheck: ComplianceCheck,
): RiskLevel {
  const candidates: RiskLevel[] = [
    targetRiskLevel,
    qualityCheck.blockingFindings.length > 0
      ? "blocked"
      : qualityCheck.status === "attention"
        ? "attention"
        : "ok",
    complianceCheck.blockingFindings.length > 0
      ? "blocked"
      : complianceCheck.status === "rejected"
        ? "critical"
        : complianceCheck.status === "needs_human_review"
          ? "warning"
          : complianceCheck.status === "attention"
            ? "attention"
            : "ok",
  ];

  return candidates.reduce<RiskLevel>(
    (current, next) => (riskOrder[next] > riskOrder[current] ? next : current),
    "ok",
  );
}

function isApprovalBlocked(qualityCheck: QualityCheck, complianceCheck: ComplianceCheck): boolean {
  return (
    qualityCheck.status === "blocked" ||
    qualityCheck.blockingFindings.length > 0 ||
    complianceCheck.status === "blocked" ||
    complianceCheck.status === "rejected" ||
    complianceCheck.blockingFindings.length > 0
  );
}

function validateChannelExists(channelsRepository: ChannelsRepository, channelId: string): void {
  if (!channelIdSchema.safeParse(channelId).success) {
    throw validation("Invalid channel id", { channelId });
  }

  const found = channelsRepository.getChannel(channelId);
  if (!found) {
    throw notFound("Channel not found", { channelId });
  }
}

function validateOptionalChannel(channelsRepository: ChannelsRepository, channelId?: string): void {
  if (!channelId) {
    return;
  }

  validateChannelExists(channelsRepository, channelId);
}

function getRequiredApproval(repository: GovernanceRepository, id: string): HumanApproval {
  if (!idSchema.safeParse(id).success) {
    throw validation("Invalid approval id", { id });
  }

  const found = repository.getApproval(id);
  if (!found) {
    throw notFound("Approval not found", { id });
  }

  return found;
}

function getRequiredQualityCheck(repository: GovernanceRepository, id: string): QualityCheck {
  if (!idSchema.safeParse(id).success) {
    throw validation("Invalid quality check id", { id });
  }

  const found = repository.getQualityCheck(id);
  if (!found) {
    throw notFound("Quality check not found", { id });
  }

  return found;
}

function getRequiredComplianceCheck(repository: GovernanceRepository, id: string): ComplianceCheck {
  if (!idSchema.safeParse(id).success) {
    throw validation("Invalid compliance check id", { id });
  }

  const found = repository.getComplianceCheck(id);
  if (!found) {
    throw notFound("Compliance check not found", { id });
  }

  return found;
}

function getRequiredContentIdea(repository: EditorialRepository, id: string): ContentIdea {
  const found = repository.getContentIdea(id);
  if (!found) {
    throw notFound("Content idea not found", { id });
  }

  return found;
}

function getRequiredProductionItem(repository: EditorialRepository, id: string): ProductionItem {
  const found = repository.getProductionItem(id);
  if (!found) {
    throw notFound("Production item not found", { id });
  }

  return found;
}

function getRequiredResearchSession(repository: EditorialRepository, id: string): ResearchSession {
  const found = repository.getResearchSession(id);
  if (!found) {
    throw notFound("Research session not found", { id });
  }

  return found;
}

function getRequiredScript(repository: EditorialRepository, id: string): Script {
  const found = repository.getScript(id);
  if (!found) {
    throw notFound("Script not found", { id });
  }

  return found;
}

function getRequiredVisualPlan(repository: EditorialRepository, id: string): VisualPlan {
  const found = repository.getVisualPlan(id);
  if (!found) {
    throw notFound("Visual plan not found", { id });
  }

  return found;
}

function assertSameChannel(expected: string, actual: string, label: string): void {
  if (expected !== actual) {
    throw conflict(`${label} belongs to a different channel`, {
      expectedChannelId: expected,
      channelId: actual,
    });
  }
}

function normalizeApprovalFilters(filters: ApprovalFilters): ApprovalFilters {
  return {
    channelId: filters.channelId,
    status: filters.status,
    riskLevel: filters.riskLevel,
    entityType: filters.entityType,
    entityId: filters.entityId,
  };
}

function normalizeQualityFilters(filters: QualityCheckFilters): QualityCheckFilters {
  return {
    channelId: filters.channelId,
    status: filters.status,
    riskLevel: filters.riskLevel,
    entityType: filters.entityType,
    entityId: filters.entityId,
  };
}

function normalizeComplianceFilters(filters: ComplianceCheckFilters): ComplianceCheckFilters {
  return {
    channelId: filters.channelId,
    status: filters.status,
    riskLevel: filters.riskLevel,
    entityType: filters.entityType,
    entityId: filters.entityId,
  };
}

function toIso(date: Date): string {
  return date.toISOString();
}

function validation(message: string, details: Record<string, unknown>): AppError {
  return new AppError({
    code: "VALIDATION_ERROR",
    status: 400,
    message,
    details,
  });
}

function notFound(message: string, details: Record<string, unknown>): AppError {
  return new AppError({
    code: "NOT_FOUND",
    status: 404,
    message,
    details,
  });
}

function conflict(message: string, details: Record<string, unknown>): AppError {
  return new AppError({
    code: "CONFLICT",
    status: 409,
    message,
    details,
  });
}

function operationBlocked(message: string, details: Record<string, unknown>): AppError {
  return new AppError({
    code: "OPERATION_BLOCKED",
    status: 409,
    message,
    details,
  });
}

function complianceBlocked(message: string, details: Record<string, unknown>): AppError {
  return new AppError({
    code: "COMPLIANCE_BLOCKED",
    status: 409,
    message,
    details,
  });
}
