import { randomUUID } from "node:crypto";

import { AppError } from "../../http/errors.js";
import type { AuditActorContext } from "../audit/audit.types.js";
import type { ChannelsRepository } from "../channels/channel.types.js";
import {
  buildCostChannelSummary,
  buildCostSummary,
  calculateCostStatus,
  calculatePercent,
  evaluateOperationalAction as evaluateOperationalActionDomain,
  resolveEffectivePolicy,
  resolvePolicySource,
  sumEntries,
  toBreakdownItems,
} from "./costs.domain.js";
import type {
  CostBreakdown,
  CostBreakdownItem,
  CostEntry,
  CostSummary,
  CostSummaryFilters,
  CostsRepository,
  CostsService,
  CreateCostEntryInput,
  CreateCostsServiceOptions,
  CostStatus,
  OperationalAction,
  OperationalActionEvaluationInput,
  OperationalModeDecision,
  OperationalModePolicy,
  OperationalModePolicyUpdateInput,
  OperationalModeSnapshot,
  CostsDependencies,
} from "./costs.types.js";

const standardOperationalActions: OperationalAction[] = [
  "real_ai_generation",
  "real_tts_generation",
  "real_image_generation",
  "real_video_generation",
  "real_publication",
  "external_call",
  "paid_provider_call",
  "simulation_only",
];

export function createCostsService(
  repository: CostsRepository,
  dependencies: CostsDependencies,
  options: CreateCostsServiceOptions = {},
): CostsService {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? (() => randomUUID());

  return {
    listCostEntries(filters = {}) {
      validateChannelIfPresent(dependencies.channelsRepository, filters.channelId);
      return repository.listCostEntries(filters);
    },

    getCostEntry(id) {
      const entry = repository.getCostEntry(id);
      if (!entry) {
        throw notFound("Cost entry not found", { id });
      }

      return entry;
    },

    createCostEntry(input) {
      validateChannelExists(dependencies.channelsRepository, input.channelId);
      assertNonNegativeInteger(input.amountCents, "amountCents");
      assertValidString(input.providerName, "providerName");
      assertValidString(input.description, "description");

      const now = clock().toISOString();
      const entry: CostEntry = {
        id: `co_${idFactory()}`,
        channelId: input.channelId,
        contentId: input.contentId,
        workflowRunId: input.workflowRunId,
        agentRunId: input.agentRunId,
        stage: input.stage,
        providerName: input.providerName.trim(),
        costType: input.costType,
        description: input.description.trim(),
        amountCents: input.amountCents,
        currency: "BRL",
        createdAt: now,
      };

      repository.upsertCostEntry(entry);
      recordAuditLog(dependencies.auditRepository, {
        id: `au_${idFactory()}`,
        channelId: entry.channelId,
        actorType: "system",
        actorName: "Aralume Core",
        action: "cost.entry_created",
        entityType: "CostEntry",
        entityId: entry.id,
        status: "success",
        message: "Custo operacional registrado.",
        metadata: {
          amountCents: entry.amountCents,
          stage: entry.stage,
          costType: entry.costType,
          providerName: entry.providerName,
          contentId: entry.contentId,
        },
        createdAt: now,
      });

      return entry;
    },

    getCostSummary(filters = {}) {
      const entries = resolveCostEntries(repository, dependencies.channelsRepository, filters);
      const period = resolvePeriod(entries, clock);
      const policyContext = resolvePolicyContext(
        repository,
        dependencies.channelsRepository,
        filters.channelId,
        period.now,
      );
      const channelSummaries = buildChannelSummaries(
        dependencies.channelsRepository,
        repository,
        policyContext.globalPolicy,
        filters.channelId,
      );
      const breakdown = buildBreakdown(entries);

      return buildCostSummary({
        channelId: filters.channelId,
        periodStart: period.start,
        periodEnd: period.end,
        policy: policyContext.effectivePolicy,
        entries,
        byChannel: channelSummaries,
        byStage: breakdown.byStage,
        byProvider: breakdown.byProvider,
        byContent: breakdown.byContent,
        byPeriod: breakdown.byPeriod,
      });
    },

    getCostBreakdown(filters = {}) {
      const entries = resolveCostEntries(repository, dependencies.channelsRepository, filters);
      const period = resolvePeriod(entries, clock);
      const breakdown = buildBreakdown(entries);

      return {
        channelId: filters.channelId,
        periodStart: period.start,
        periodEnd: period.end,
        byChannel: buildChannelBreakdown(
          dependencies.channelsRepository,
          filters.channelId,
          entries,
        ),
        byStage: breakdown.byStage,
        byProvider: breakdown.byProvider,
        byContent: breakdown.byContent,
        byPeriod: breakdown.byPeriod,
      };
    },

    getOperationalModeSnapshot(channelId) {
      validateChannelIfPresent(dependencies.channelsRepository, channelId);
      const resolvedChannelId = channelId ?? "global";
      const period = resolvePeriod(
        resolveCostEntries(repository, dependencies.channelsRepository, { channelId }),
        clock,
      );
      const policyContext = resolvePolicyContext(
        repository,
        dependencies.channelsRepository,
        channelId,
        period.now,
      );
      const summary = buildChannelCostSnapshot(
        dependencies.channelsRepository,
        repository,
        channelId,
        policyContext.globalPolicy,
      );
      const allowedActions: OperationalModeDecision[] = [];
      const blockedActions: OperationalModeDecision[] = [];

      for (const action of standardOperationalActions) {
        const decision = evaluateDecision(
          policyContext,
          resolvedChannelId,
          action,
          undefined,
          period.now,
          summary.consumedCents,
          summary.budgetCents,
        );

        if (decision.allowed) {
          allowedActions.push(decision);
        } else {
          blockedActions.push(decision);
        }
      }

      return {
        channelId,
        globalPolicy: policyContext.globalPolicy,
        channelPolicy: policyContext.channelPolicy,
        effectivePolicy: policyContext.effectivePolicy,
        budgetConfigured: summary.budgetConfigured,
        budgetCents: summary.budgetCents,
        consumedCents: summary.consumedCents,
        remainingCents: summary.remainingCents,
        consumptionPercent: summary.consumptionPercent,
        status: summary.status,
        allowedActions,
        blockedActions,
        evaluatedAt: period.now,
      };
    },

    updateGlobalOperationalModePolicy(input, actor, requestId) {
      const now = clock().toISOString();
      const previous = repository.getGlobalOperationalModePolicy();
      const next = buildUpdatedPolicy(previous, input, "global", undefined, now, idFactory);
      repository.upsertOperationalModePolicy(next);
      recordPolicyAuditEvents(
        dependencies.auditRepository,
        previous,
        next,
        actor,
        requestId,
        now,
        idFactory,
      );
      return next;
    },

    updateChannelOperationalModePolicy(channelId, input, actor, requestId) {
      validateChannelExists(dependencies.channelsRepository, channelId);
      const now = clock().toISOString();
      const previous = repository.getChannelOperationalModePolicy(channelId);
      const next = buildUpdatedPolicy(previous, input, "channel", channelId, now, idFactory);
      repository.upsertOperationalModePolicy(next);
      recordPolicyAuditEvents(
        dependencies.auditRepository,
        previous,
        next,
        actor,
        requestId,
        now,
        idFactory,
      );
      return next;
    },

    evaluateOperationalAction(input, actor, requestId) {
      validateChannelExists(dependencies.channelsRepository, input.channelId);
      const now = clock().toISOString();
      const policyContext = resolvePolicyContext(
        repository,
        dependencies.channelsRepository,
        input.channelId,
        now,
      );
      const summary = buildChannelCostSnapshot(
        dependencies.channelsRepository,
        repository,
        input.channelId,
        policyContext.globalPolicy,
      );
      const decision = evaluateDecision(
        policyContext,
        input.channelId,
        input.action,
        input,
        now,
        summary.consumedCents,
        summary.budgetCents,
      );

      recordDecisionAudit(
        dependencies.auditRepository,
        decision,
        actor,
        requestId,
        now,
        summary,
        idFactory,
      );
      return decision;
    },
  };
}

function resolveCostEntries(
  repository: CostsRepository,
  channelsRepository: ChannelsRepository,
  filters: CostSummaryFilters,
): CostEntry[] {
  validateChannelIfPresent(channelsRepository, filters.channelId);
  return repository.listCostEntries(filters);
}

function resolvePeriod(
  entries: CostEntry[],
  clock: () => Date,
): { start: string; end: string; now: string } {
  if (entries.length === 0) {
    const now = clock().toISOString();
    return { start: now, end: now, now };
  }

  const sorted = [...entries].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  return {
    start: sorted[0].createdAt,
    end: sorted[sorted.length - 1].createdAt,
    now: clock().toISOString(),
  };
}

function resolvePolicyContext(
  repository: CostsRepository,
  channelsRepository: ChannelsRepository,
  channelId: string | undefined,
  now: string,
): {
  globalPolicy: OperationalModePolicy;
  channelPolicy?: OperationalModePolicy;
  effectivePolicy: OperationalModePolicy;
  policySource: "global" | "channel" | "fallback";
} {
  const globalPolicy =
    repository.getGlobalOperationalModePolicy() ?? buildFallbackPolicy("global", undefined, now);
  const repoGlobalPolicy = repository.getGlobalOperationalModePolicy();
  const channelPolicy = channelId
    ? repository.getChannelOperationalModePolicy(channelId)
    : undefined;
  const effectivePolicy =
    resolveEffectivePolicy(globalPolicy, channelPolicy, channelId ? "channel" : "global") ??
    buildFallbackPolicy(channelId ? "channel" : "global", channelId, now);
  const policySource =
    !repoGlobalPolicy && !channelPolicy
      ? "fallback"
      : resolvePolicySource({
          globalPolicy,
          channelPolicy,
          effectivePolicy,
        });

  if (channelId) {
    validateChannelExists(channelsRepository, channelId);
  }

  return {
    globalPolicy,
    channelPolicy,
    effectivePolicy,
    policySource,
  };
}

function buildChannelSummaries(
  channelsRepository: ChannelsRepository,
  repository: CostsRepository,
  globalPolicy: OperationalModePolicy,
  selectedChannelId?: string,
): CostSummary["byChannel"] {
  const channels = selectedChannelId
    ? channelsRepository.listChannels().filter((channel) => channel.id === selectedChannelId)
    : channelsRepository.listChannels();

  return channels.map((channel) => {
    const entries = repository.listCostEntries({ channelId: channel.id });
    const policy = repository.getChannelOperationalModePolicy(channel.id) ?? globalPolicy;
    return buildCostChannelSummary(channel, entries, policy);
  });
}

function buildChannelBreakdown(
  channelsRepository: ChannelsRepository,
  selectedChannelId: string | undefined,
  entries: CostEntry[],
): CostBreakdown["byChannel"] {
  const channels = selectedChannelId
    ? channelsRepository.listChannels().filter((channel) => channel.id === selectedChannelId)
    : channelsRepository.listChannels();

  return toBreakdownItems(
    channels.map((channel) => {
      const channelEntries = entries.filter((entry) => entry.channelId === channel.id);
      const amountCents = sumEntries(channelEntries);
      return {
        key: channel.id,
        label: channel.name,
        amountCents,
        count: channelEntries.length,
      };
    }),
  );
}

function buildBreakdown(entries: CostEntry[]): {
  byStage: CostBreakdownItem[];
  byProvider: CostBreakdownItem[];
  byContent: CostBreakdownItem[];
  byPeriod: CostBreakdownItem[];
} {
  const byStageMap = new Map<string, { label: string; amountCents: number; count: number }>();
  const byProviderMap = new Map<string, { label: string; amountCents: number; count: number }>();
  const byContentMap = new Map<string, { label: string; amountCents: number; count: number }>();
  const byPeriodMap = new Map<string, { label: string; amountCents: number; count: number }>();

  for (const entry of entries) {
    addGroupedValue(byStageMap, entry.stage, entry.stage.replaceAll("_", " "), entry.amountCents);
    addGroupedValue(byProviderMap, entry.providerName, entry.providerName, entry.amountCents);
    if (entry.contentId) {
      addGroupedValue(byContentMap, entry.contentId, entry.contentId, entry.amountCents);
    }
    addGroupedValue(
      byPeriodMap,
      entry.createdAt.slice(0, 7),
      entry.createdAt.slice(0, 7),
      entry.amountCents,
    );
  }

  return {
    byStage: toBreakdownItems(mapToRows(byStageMap)),
    byProvider: toBreakdownItems(mapToRows(byProviderMap)),
    byContent: toBreakdownItems(mapToRows(byContentMap)),
    byPeriod: toBreakdownItems(mapToRows(byPeriodMap)),
  };
}

function mapToRows(map: Map<string, { label: string; amountCents: number; count: number }>) {
  return Array.from(map.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort(
      (left, right) => right.amountCents - left.amountCents || left.key.localeCompare(right.key),
    );
}

function addGroupedValue(
  map: Map<string, { label: string; amountCents: number; count: number }>,
  key: string,
  label: string,
  amountCents: number,
): void {
  const existing = map.get(key);
  if (existing) {
    existing.amountCents += amountCents;
    existing.count += 1;
    return;
  }

  map.set(key, { label, amountCents, count: 1 });
}

function buildChannelCostSnapshot(
  channelsRepository: ChannelsRepository,
  repository: CostsRepository,
  channelId: string | undefined,
  globalPolicy: OperationalModePolicy,
): {
  budgetConfigured: boolean;
  budgetCents: number;
  consumedCents: number;
  remainingCents: number;
  consumptionPercent: number;
  status: CostStatus;
} {
  if (channelId) {
    const channel = channelsRepository.getChannel(channelId);
    if (!channel) {
      throw notFound("Channel not found", { channelId });
    }

    const policy = repository.getChannelOperationalModePolicy(channelId) ?? globalPolicy;
    const entries = repository.listCostEntries({ channelId });
    const consumedCents = sumEntries(entries);
    const budgetConfigured = policy.budgetConfigured;
    const budgetCents = policy.monthlyBudgetLimitCents;
    return {
      budgetConfigured,
      budgetCents,
      consumedCents,
      remainingCents: budgetConfigured ? Math.max(0, budgetCents - consumedCents) : 0,
      consumptionPercent: calculatePercent(consumedCents, budgetCents),
      status: calculateCostStatus(budgetConfigured, budgetCents, consumedCents),
    };
  }

  const entries = repository.listCostEntries();
  const consumedCents = sumEntries(entries);
  const budgetConfigured = globalPolicy.budgetConfigured;
  const budgetCents = globalPolicy.monthlyBudgetLimitCents;
  return {
    budgetConfigured,
    budgetCents,
    consumedCents,
    remainingCents: budgetConfigured ? Math.max(0, budgetCents - consumedCents) : 0,
    consumptionPercent: calculatePercent(consumedCents, budgetCents),
    status: calculateCostStatus(budgetConfigured, budgetCents, consumedCents),
  };
}

function evaluateDecision(
  policyContext: {
    globalPolicy: OperationalModePolicy;
    channelPolicy?: OperationalModePolicy;
    effectivePolicy: OperationalModePolicy;
    policySource: "global" | "channel" | "fallback";
  },
  channelId: string,
  action: OperationalAction,
  input: OperationalActionEvaluationInput | undefined,
  evaluatedAt: string,
  consumedCents: number,
  budgetCents: number,
): OperationalModeDecision {
  const decision = evaluateOperationalActionDomain(policyContext.effectivePolicy, action, {
    channelId,
    globalPolicyId: policyContext.globalPolicy.id,
    effectivePolicyId: policyContext.effectivePolicy.id,
    channelPolicyId: policyContext.channelPolicy?.id,
    costEntryId: input?.costEntryId,
    plannedCostCents: input?.plannedCostCents,
    actor: input?.actor,
    evaluatedAt,
    policySource: policyContext.policySource,
    budgetConfigured: policyContext.effectivePolicy.budgetConfigured,
    budgetCents,
    consumedCents,
  });

  if (!decision.allowed && decision.decisionCode === "BUDGET_NOT_CONFIGURED") {
    decision.policySource = "budget";
  }

  return decision;
}

function recordPolicyAuditEvents(
  auditRepository: CostsDependencies["auditRepository"],
  previous: OperationalModePolicy | undefined,
  next: OperationalModePolicy,
  actor: AuditActorContext | undefined,
  requestId: string | undefined,
  now: string,
  idFactory: () => string,
): void {
  const actorName = actor?.actorName ?? "Aralume Core";
  const actorType = actor ? "user" : "system";
  const changedFields = previous ? diffPolicyFields(previous, next) : Object.keys(next);
  if (changedFields.length === 0) {
    return;
  }

  const baseLog = {
    channelId: next.channelId,
    requestId,
    actorType: actorType as "user" | "system",
    actorName,
    entityType: "OperationalModePolicy",
    entityId: next.id,
    metadata: {
      scope: next.scope,
      actorId: actor?.actorId,
      role: actor?.role,
      channelId: next.channelId,
      changedFields,
      mode: next.mode,
      budgetConfigured: next.budgetConfigured,
      monthlyBudgetLimitCents: next.monthlyBudgetLimitCents,
      dailyBudgetLimitCents: next.dailyBudgetLimitCents,
    },
    createdAt: now,
  };

  recordAuditLog(auditRepository, {
    ...baseLog,
    id: `au_${idFactory()}`,
    action: "cost.policy_updated",
    status: "success",
    message: "Policy operacional atualizada.",
  });

  recordAuditLog(auditRepository, {
    ...baseLog,
    id: `au_${idFactory()}`,
    action: "operational_mode.policy_updated",
    status: "success",
    message: "Modo operacional atualizado.",
  });

  if (
    previous?.budgetConfigured !== next.budgetConfigured ||
    previous?.monthlyBudgetLimitCents !== next.monthlyBudgetLimitCents ||
    previous?.dailyBudgetLimitCents !== next.dailyBudgetLimitCents
  ) {
    recordAuditLog(auditRepository, {
      ...baseLog,
      id: `au_${idFactory()}`,
      action: "cost.budget_updated",
      status: next.budgetConfigured ? "success" : "warning",
      message: "Budget operacional atualizado.",
    });
  }
}

function diffPolicyFields(previous: OperationalModePolicy, next: OperationalModePolicy): string[] {
  const keys = [
    "mode",
    "allowRealAi",
    "allowRealTts",
    "allowRealImageGeneration",
    "allowRealVideoGeneration",
    "allowExternalPublication",
    "requireHumanApproval",
    "budgetConfigured",
    "dailyBudgetLimitCents",
    "monthlyBudgetLimitCents",
  ] as const;

  return keys.filter((key) => previous[key] !== next[key]).map((key) => key);
}

function recordDecisionAudit(
  auditRepository: CostsDependencies["auditRepository"],
  decision: OperationalModeDecision,
  actor: AuditActorContext | undefined,
  requestId: string | undefined,
  now: string,
  snapshot: {
    budgetConfigured: boolean;
    budgetCents: number;
    consumedCents: number;
    remainingCents: number;
  },
  idFactory: () => string,
): void {
  const actorName = actor?.actorName ?? "Aralume Core";
  const actorType = actor ? "user" : "system";
  const action = decision.allowed
    ? "operational_mode.decision_allowed"
    : decision.decisionCode === "BUDGET_LIMIT_REACHED"
      ? "operational_mode.limit_reached"
      : decision.decisionCode === "BUDGET_EXCEEDED"
        ? "operational_mode.budget_exceeded"
        : "operational_mode.decision_blocked";

  recordAuditLog(auditRepository, {
    id: `au_${idFactory()}`,
    channelId: decision.channelId,
    requestId,
    actorType: actorType as "user" | "system",
    actorName,
    action,
    entityType: "OperationalModeDecision",
    entityId: decision.id,
    status: decision.allowed ? "success" : "warning",
    message: decision.reason,
    metadata: {
      actorId: actor?.actorId,
      role: actor?.role,
      action: decision.action,
      decisionCode: decision.decisionCode,
      allowed: decision.allowed,
      policySource: decision.policySource,
      globalPolicyId: decision.globalPolicyId,
      effectivePolicyId: decision.effectivePolicyId,
      channelPolicyId: decision.channelPolicyId,
      plannedCostCents: decision.plannedCostCents,
      budgetConfigured: snapshot.budgetConfigured,
      budgetCents: snapshot.budgetCents,
      consumedCents: snapshot.consumedCents,
      remainingCents: snapshot.remainingCents,
    },
    createdAt: now,
  });
}

function buildUpdatedPolicy(
  existing: OperationalModePolicy | undefined,
  input: OperationalModePolicyUpdateInput,
  scope: "global" | "channel",
  channelId: string | undefined,
  now: string,
  idFactory: () => string,
): OperationalModePolicy {
  const base =
    existing ??
    buildFallbackPolicy(
      scope,
      channelId,
      now,
      scope === "global" ? "op_global" : `op_ch_${channelId ?? idFactory()}`,
    );
  return {
    ...base,
    id: base.id,
    scope,
    channelId: scope === "channel" ? channelId : undefined,
    mode: input.mode ?? base.mode,
    allowRealAi: input.allowRealAi ?? base.allowRealAi,
    allowRealTts: input.allowRealTts ?? base.allowRealTts,
    allowRealImageGeneration: input.allowRealImageGeneration ?? base.allowRealImageGeneration,
    allowRealVideoGeneration: input.allowRealVideoGeneration ?? base.allowRealVideoGeneration,
    allowExternalPublication: input.allowExternalPublication ?? base.allowExternalPublication,
    requireHumanApproval: input.requireHumanApproval ?? base.requireHumanApproval,
    budgetConfigured: input.budgetConfigured ?? base.budgetConfigured,
    dailyBudgetLimitCents: input.dailyBudgetLimitCents ?? base.dailyBudgetLimitCents,
    monthlyBudgetLimitCents: input.monthlyBudgetLimitCents ?? base.monthlyBudgetLimitCents,
    createdAt: base.createdAt,
    updatedAt: now,
  };
}

function buildFallbackPolicy(
  scope: "global" | "channel",
  channelId: string | undefined,
  now: string,
  id = scope === "global" ? "op_global" : `op_ch_${channelId ?? "missing"}`,
): OperationalModePolicy {
  return {
    id,
    scope,
    channelId: scope === "channel" ? channelId : undefined,
    mode: "demo",
    allowRealAi: false,
    allowRealTts: false,
    allowRealImageGeneration: false,
    allowRealVideoGeneration: false,
    allowExternalPublication: false,
    requireHumanApproval: true,
    budgetConfigured: false,
    dailyBudgetLimitCents: 0,
    monthlyBudgetLimitCents: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function recordAuditLog(
  auditRepository: CostsDependencies["auditRepository"],
  log: Parameters<CostsDependencies["auditRepository"]["appendAuditLog"]>[0],
): void {
  auditRepository.appendAuditLog(log);
}

function validateChannelExists(channelsRepository: ChannelsRepository, channelId?: string): void {
  if (!channelId) {
    return;
  }

  if (!channelsRepository.getChannel(channelId)) {
    throw notFound("Channel not found", { channelId });
  }
}

function validateChannelIfPresent(
  channelsRepository: ChannelsRepository,
  channelId: string | undefined,
): void {
  validateChannelExists(channelsRepository, channelId);
}

function assertNonNegativeInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw validation(`Invalid ${field}`, { field, value });
  }
}

function assertValidString(value: string, field: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw validation(`Invalid ${field}`, { field });
  }
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
