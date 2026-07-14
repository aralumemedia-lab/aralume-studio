import type { Channel } from "../channels/channel.types.js";
import type {
  CostBreakdownItem,
  CostChannelSummary,
  CostEntry,
  CostStatus,
  CostSummary,
  OperationalAction,
  OperationalMode,
  OperationalModeDecision,
  OperationalModePolicy,
} from "./costs.types.js";

const modeStrictness: Record<OperationalMode, number> = {
  supervised_production: 0,
  restricted_production: 1,
  local_test: 2,
  demo: 3,
  paused: 4,
};

const realActions: ReadonlySet<OperationalAction> = new Set([
  "real_ai_generation",
  "real_tts_generation",
  "real_image_generation",
  "real_video_generation",
  "real_publication",
  "external_call",
  "paid_provider_call",
]);

const costSensitiveActions: ReadonlySet<OperationalAction> = new Set([
  "real_ai_generation",
  "real_tts_generation",
  "real_image_generation",
  "real_video_generation",
  "real_publication",
  "paid_provider_call",
]);

export type PolicyDecisionSource = "global" | "channel" | "fallback" | "budget";

export type EffectivePolicyResolution = {
  effectivePolicy?: OperationalModePolicy;
  policySource: Exclude<PolicyDecisionSource, "budget">;
  globalPolicyId: string;
  effectivePolicyId: string;
  channelPolicyId?: string;
};

export function calculateCostStatus(
  budgetConfigured: boolean,
  budgetCents: number,
  consumedCents: number,
): CostStatus {
  if (!budgetConfigured) {
    return "not_configured";
  }

  if (budgetCents <= 0) {
    return consumedCents > 0 ? "exceeded" : "healthy";
  }

  if (consumedCents >= budgetCents) {
    return "exceeded";
  }

  return consumedCents * 100 >= budgetCents * 80 ? "attention" : "healthy";
}

export function calculatePercent(consumedCents: number, budgetCents: number): number {
  if (budgetCents <= 0) {
    return 0;
  }

  return Number(((consumedCents / budgetCents) * 100).toFixed(2));
}

export function sumEntries(entries: CostEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.amountCents, 0);
}

export function toBreakdownItems(
  rows: Array<{
    key: string;
    label: string;
    amountCents: number;
    count: number;
  }>,
): CostBreakdownItem[] {
  const total = rows.reduce((sum, row) => sum + row.amountCents, 0);

  return rows.map((row) => ({
    key: row.key,
    label: row.label,
    amountCents: row.amountCents,
    count: row.count,
    sharePercent: total > 0 ? Number(((row.amountCents / total) * 100).toFixed(2)) : 0,
  }));
}

export function buildCostChannelSummary(
  channel: Channel,
  entries: CostEntry[],
  policy: OperationalModePolicy | undefined,
): CostChannelSummary {
  const consumedCents = sumEntries(entries);
  const budgetConfigured = policy?.budgetConfigured ?? false;
  const budgetCents = policy?.monthlyBudgetLimitCents ?? 0;
  const remainingCents = budgetConfigured ? Math.max(0, budgetCents - consumedCents) : 0;

  return {
    channelId: channel.id,
    channelName: channel.name,
    budgetConfigured,
    budgetCents,
    consumedCents,
    remainingCents,
    consumptionPercent: calculatePercent(consumedCents, budgetCents),
    status: calculateCostStatus(budgetConfigured, budgetCents, consumedCents),
    entryCount: entries.length,
  };
}

export function buildCostSummary(input: {
  channelId?: string;
  periodStart: string;
  periodEnd: string;
  policy: OperationalModePolicy;
  entries: CostEntry[];
  byChannel: CostChannelSummary[];
  byStage: CostBreakdownItem[];
  byProvider: CostBreakdownItem[];
  byContent: CostBreakdownItem[];
  byPeriod: CostBreakdownItem[];
}): CostSummary {
  const consumedCents = sumEntries(input.entries);
  const budgetConfigured = input.policy.budgetConfigured;
  const budgetCents = input.policy.monthlyBudgetLimitCents;

  return {
    channelId: input.channelId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    budgetConfigured,
    budgetCents,
    consumedCents,
    remainingCents: budgetConfigured ? Math.max(0, budgetCents - consumedCents) : 0,
    consumptionPercent: calculatePercent(consumedCents, budgetCents),
    status: calculateCostStatus(budgetConfigured, budgetCents, consumedCents),
    totalCostCents: consumedCents,
    entryCount: input.entries.length,
    policy: input.policy,
    byChannel: input.byChannel,
    byStage: input.byStage,
    byProvider: input.byProvider,
    byContent: input.byContent,
    byPeriod: input.byPeriod,
  };
}

export function resolveEffectivePolicy(
  globalPolicy: OperationalModePolicy | undefined,
  channelPolicy: OperationalModePolicy | undefined,
  scope: "global" | "channel",
): OperationalModePolicy | undefined {
  if (!globalPolicy && !channelPolicy) {
    return undefined;
  }

  if (!globalPolicy) {
    return clonePolicy(channelPolicy, scope);
  }

  if (!channelPolicy) {
    return clonePolicy(globalPolicy, scope);
  }

  const chosenMode =
    modeStrictness[channelPolicy.mode] >= modeStrictness[globalPolicy.mode]
      ? channelPolicy.mode
      : globalPolicy.mode;
  const budgetConfigured = globalPolicy.budgetConfigured || channelPolicy.budgetConfigured;
  const dailyBudgetLimitCents = mergeLimit(
    globalPolicy.budgetConfigured,
    globalPolicy.dailyBudgetLimitCents,
    channelPolicy.budgetConfigured,
    channelPolicy.dailyBudgetLimitCents,
  );
  const monthlyBudgetLimitCents = mergeLimit(
    globalPolicy.budgetConfigured,
    globalPolicy.monthlyBudgetLimitCents,
    channelPolicy.budgetConfigured,
    channelPolicy.monthlyBudgetLimitCents,
  );

  return {
    ...globalPolicy,
    ...channelPolicy,
    id:
      scope === "channel"
        ? `op_effective_${channelPolicy.channelId ?? "global"}`
        : "op_effective_global",
    scope,
    channelId: scope === "channel" ? channelPolicy.channelId : undefined,
    mode: chosenMode,
    allowRealAi: globalPolicy.allowRealAi && channelPolicy.allowRealAi,
    allowRealTts: globalPolicy.allowRealTts && channelPolicy.allowRealTts,
    allowRealImageGeneration:
      globalPolicy.allowRealImageGeneration && channelPolicy.allowRealImageGeneration,
    allowRealVideoGeneration:
      globalPolicy.allowRealVideoGeneration && channelPolicy.allowRealVideoGeneration,
    allowExternalPublication:
      globalPolicy.allowExternalPublication && channelPolicy.allowExternalPublication,
    requireHumanApproval: globalPolicy.requireHumanApproval || channelPolicy.requireHumanApproval,
    budgetConfigured,
    dailyBudgetLimitCents,
    monthlyBudgetLimitCents,
    createdAt:
      channelPolicy.updatedAt > globalPolicy.updatedAt
        ? channelPolicy.createdAt
        : globalPolicy.createdAt,
    updatedAt:
      channelPolicy.updatedAt > globalPolicy.updatedAt
        ? channelPolicy.updatedAt
        : globalPolicy.updatedAt,
  };
}

export function resolvePolicySource(input: {
  globalPolicy: OperationalModePolicy | undefined;
  channelPolicy: OperationalModePolicy | undefined;
  effectivePolicy: OperationalModePolicy | undefined;
}): Exclude<PolicyDecisionSource, "budget"> {
  if (!input.globalPolicy && !input.channelPolicy) {
    return "fallback";
  }

  if (!input.globalPolicy) {
    return "channel";
  }

  if (!input.channelPolicy) {
    return "global";
  }

  if (!input.effectivePolicy) {
    return "fallback";
  }

  const channelStricter =
    modeStrictness[input.channelPolicy.mode] > modeStrictness[input.globalPolicy.mode];
  if (channelStricter) {
    return "channel";
  }

  const channelDeniesMore =
    (!input.channelPolicy.allowRealAi && input.globalPolicy.allowRealAi) ||
    (!input.channelPolicy.allowRealTts && input.globalPolicy.allowRealTts) ||
    (!input.channelPolicy.allowRealImageGeneration &&
      input.globalPolicy.allowRealImageGeneration) ||
    (!input.channelPolicy.allowRealVideoGeneration &&
      input.globalPolicy.allowRealVideoGeneration) ||
    (!input.channelPolicy.allowExternalPublication &&
      input.globalPolicy.allowExternalPublication) ||
    (input.channelPolicy.requireHumanApproval && !input.globalPolicy.requireHumanApproval) ||
    (input.channelPolicy.budgetConfigured && !input.globalPolicy.budgetConfigured);

  return channelDeniesMore ? "channel" : "global";
}

export function evaluateOperationalAction(
  effectivePolicy: OperationalModePolicy | undefined,
  action: OperationalAction,
  input: {
    channelId: string;
    globalPolicyId: string;
    effectivePolicyId: string;
    channelPolicyId?: string;
    costEntryId?: string;
    plannedCostCents?: number;
    actor?: string;
    evaluatedAt: string;
    policySource: Exclude<PolicyDecisionSource, "budget">;
    budgetConfigured: boolean;
    budgetCents: number;
    consumedCents: number;
  },
): OperationalModeDecision {
  if (!effectivePolicy) {
    return buildDecision(false, "FALLBACK_DEMO", "fallback", action, input, "fallback demo policy");
  }

  if (action === "simulation_only") {
    return buildDecision(
      true,
      "SIMULATION_ALLOWED",
      input.policySource,
      action,
      input,
      "simulation allowed",
    );
  }

  if (effectivePolicy.mode === "demo" && realActions.has(action)) {
    return buildDecision(
      false,
      action === "real_publication" ? "DEMO_PUBLICATION_BLOCKED" : "DEMO_AI_BLOCKED",
      input.policySource,
      action,
      input,
      "demo mode blocks real operations",
    );
  }

  if (effectivePolicy.mode === "local_test" && realActions.has(action)) {
    return buildDecision(
      false,
      "LOCAL_TEST_BLOCKED",
      input.policySource,
      action,
      input,
      "local test mode blocks real operations",
    );
  }

  if (effectivePolicy.mode === "paused" && realActions.has(action)) {
    return buildDecision(
      false,
      "PAUSED_BLOCKED",
      input.policySource,
      action,
      input,
      "paused mode blocks real operations",
    );
  }

  if (action === "paid_provider_call" && !input.budgetConfigured) {
    return buildDecision(
      false,
      "BUDGET_NOT_CONFIGURED",
      "budget",
      action,
      input,
      "budget not configured",
    );
  }

  if (costSensitiveActions.has(action)) {
    const plannedCostCents = input.plannedCostCents ?? 0;
    const projected = input.consumedCents + plannedCostCents;

    if (!input.budgetConfigured) {
      return buildDecision(
        false,
        "BUDGET_NOT_CONFIGURED",
        "budget",
        action,
        input,
        "budget not configured",
      );
    }

    if (input.budgetCents <= 0) {
      return buildDecision(false, "BUDGET_EXCEEDED", "budget", action, input, "budget exceeded");
    }

    if (projected > input.budgetCents) {
      return buildDecision(false, "BUDGET_EXCEEDED", "budget", action, input, "budget exceeded");
    }

    if (projected >= input.budgetCents && input.budgetCents > 0) {
      return buildDecision(
        false,
        "BUDGET_LIMIT_REACHED",
        "budget",
        action,
        input,
        "budget limit reached",
      );
    }
  }

  if (action === "real_publication" && !effectivePolicy.allowExternalPublication) {
    return buildDecision(
      false,
      "PUBLICATION_BLOCKED",
      input.policySource,
      action,
      input,
      "real publication blocked",
    );
  }

  if (action === "real_ai_generation" && !effectivePolicy.allowRealAi) {
    return buildDecision(false, "AI_BLOCKED", input.policySource, action, input, "real AI blocked");
  }

  if (action === "real_tts_generation" && !effectivePolicy.allowRealTts) {
    return buildDecision(
      false,
      "TTS_BLOCKED",
      input.policySource,
      action,
      input,
      "real TTS blocked",
    );
  }

  if (action === "real_image_generation" && !effectivePolicy.allowRealImageGeneration) {
    return buildDecision(
      false,
      "IMAGE_BLOCKED",
      input.policySource,
      action,
      input,
      "real image generation blocked",
    );
  }

  if (action === "real_video_generation" && !effectivePolicy.allowRealVideoGeneration) {
    return buildDecision(
      false,
      "VIDEO_BLOCKED",
      input.policySource,
      action,
      input,
      "real video generation blocked",
    );
  }

  return buildDecision(true, "ALLOWED", input.policySource, action, input, "operation allowed");
}

function buildDecision(
  allowed: boolean,
  decisionCode: string,
  policySource: PolicyDecisionSource,
  action: OperationalAction,
  input: {
    channelId: string;
    globalPolicyId: string;
    effectivePolicyId: string;
    channelPolicyId?: string;
    costEntryId?: string;
    plannedCostCents?: number;
    actor?: string;
    evaluatedAt: string;
  },
  reason: string,
): OperationalModeDecision {
  return {
    id: `od_${input.evaluatedAt.replace(/[-:.TZ]/g, "")}_${action}`,
    channelId: input.channelId,
    action,
    allowed,
    decisionCode,
    reason,
    policySource,
    globalPolicyId: input.globalPolicyId,
    effectivePolicyId: input.effectivePolicyId,
    evaluatedAt: input.evaluatedAt,
    channelPolicyId: input.channelPolicyId,
    costEntryId: input.costEntryId,
    plannedCostCents: input.plannedCostCents,
    actor: input.actor,
  };
}

function clonePolicy(
  policy: OperationalModePolicy | undefined,
  scope: "global" | "channel",
): OperationalModePolicy | undefined {
  if (!policy) {
    return undefined;
  }

  return {
    ...policy,
    scope,
    channelId: scope === "channel" ? policy.channelId : undefined,
  };
}

function mergeLimit(
  globalConfigured: boolean,
  globalLimit: number,
  channelConfigured: boolean,
  channelLimit: number,
): number {
  if (globalConfigured && channelConfigured) {
    return Math.min(globalLimit, channelLimit);
  }

  if (channelConfigured) {
    return channelLimit;
  }

  if (globalConfigured) {
    return globalLimit;
  }

  return 0;
}
