import type {
  Channel,
  ChannelsRepository,
  CostStatus,
  ID,
  ISODate,
} from "../channels/channel.types.js";

export type { Channel, ChannelsRepository, CostStatus, ID, ISODate };

export type CostStage =
  | "research"
  | "editorial"
  | "script"
  | "visual_plan"
  | "narration"
  | "production"
  | "render"
  | "publication"
  | "infrastructure"
  | "other";

export type CostType =
  | "llm"
  | "tts"
  | "image"
  | "video"
  | "render"
  | "storage"
  | "publication"
  | "other";

export type CostEntry = {
  id: ID;
  channelId: ID;
  contentId?: ID;
  workflowRunId?: ID;
  agentRunId?: ID;
  stage: CostStage;
  providerName: string;
  costType: CostType;
  description: string;
  amountCents: number;
  currency: "BRL";
  createdAt: ISODate;
};

export type CostEntryFilters = {
  channelId?: ID;
  contentId?: ID;
  stage?: CostStage;
  costType?: CostType;
  providerName?: string;
  from?: ISODate;
  to?: ISODate;
};

export type OperationalMode =
  | "demo"
  | "local_test"
  | "supervised_production"
  | "restricted_production"
  | "paused";

export type OperationalModePolicy = {
  id: ID;
  scope: "global" | "channel";
  channelId?: ID;
  mode: OperationalMode;
  allowRealAi: boolean;
  allowRealTts: boolean;
  allowRealImageGeneration: boolean;
  allowRealVideoGeneration: boolean;
  allowExternalPublication: boolean;
  requireHumanApproval: boolean;
  budgetConfigured: boolean;
  dailyBudgetLimitCents: number;
  monthlyBudgetLimitCents: number;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type OperationalAction =
  | "real_ai_generation"
  | "real_tts_generation"
  | "real_image_generation"
  | "real_video_generation"
  | "real_publication"
  | "external_call"
  | "paid_provider_call"
  | "simulation_only";

export type OperationalModeDecision = {
  id: ID;
  channelId: ID;
  action: OperationalAction;
  allowed: boolean;
  decisionCode: string;
  reason: string;
  policySource: "global" | "channel" | "fallback" | "budget";
  globalPolicyId: ID;
  effectivePolicyId: ID;
  evaluatedAt: ISODate;
  channelPolicyId?: ID;
  costEntryId?: ID;
  plannedCostCents?: number;
  actor?: string;
};

export type CostBreakdownItem = {
  key: string;
  label: string;
  amountCents: number;
  count: number;
  sharePercent: number;
};

export type CostChannelSummary = {
  channelId: ID;
  channelName: string;
  budgetConfigured: boolean;
  budgetCents: number;
  consumedCents: number;
  remainingCents: number;
  consumptionPercent: number;
  status: CostStatus;
  entryCount: number;
};

export type CostSummary = {
  channelId?: ID;
  periodStart: ISODate;
  periodEnd: ISODate;
  budgetConfigured: boolean;
  budgetCents: number;
  consumedCents: number;
  remainingCents: number;
  consumptionPercent: number;
  status: CostStatus;
  totalCostCents: number;
  entryCount: number;
  policy: OperationalModePolicy;
  byChannel: CostChannelSummary[];
  byStage: CostBreakdownItem[];
  byProvider: CostBreakdownItem[];
  byContent: CostBreakdownItem[];
  byPeriod: CostBreakdownItem[];
};

export type CostBreakdown = {
  channelId?: ID;
  periodStart: ISODate;
  periodEnd: ISODate;
  byChannel: CostBreakdownItem[];
  byStage: CostBreakdownItem[];
  byProvider: CostBreakdownItem[];
  byContent: CostBreakdownItem[];
  byPeriod: CostBreakdownItem[];
};

export type OperationalModeSnapshot = {
  channelId?: ID;
  globalPolicy: OperationalModePolicy;
  channelPolicy?: OperationalModePolicy;
  effectivePolicy: OperationalModePolicy;
  budgetConfigured: boolean;
  budgetCents: number;
  consumedCents: number;
  remainingCents: number;
  consumptionPercent: number;
  status: CostStatus;
  allowedActions: OperationalModeDecision[];
  blockedActions: OperationalModeDecision[];
  evaluatedAt: ISODate;
};

export type CostSeed = {
  costEntries: CostEntry[];
  operationalModePolicies: OperationalModePolicy[];
};

export type CostsRepository = {
  replaceAll(seed: Partial<CostSeed>): void;
  listCostEntries(filters?: CostEntryFilters): CostEntry[];
  getCostEntry(id: ID): CostEntry | undefined;
  upsertCostEntry(entry: CostEntry): void;
  listOperationalModePolicies(): OperationalModePolicy[];
  getGlobalOperationalModePolicy(): OperationalModePolicy | undefined;
  getChannelOperationalModePolicy(channelId: ID): OperationalModePolicy | undefined;
  upsertOperationalModePolicy(policy: OperationalModePolicy): void;
};

export type CostsService = {
  listCostEntries(filters?: CostEntryFilters): CostEntry[];
  getCostEntry(id: ID): CostEntry;
  createCostEntry(input: CreateCostEntryInput): CostEntry;
  getCostSummary(filters?: CostSummaryFilters): CostSummary;
  getCostBreakdown(filters?: CostSummaryFilters): CostBreakdown;
  getOperationalModeSnapshot(channelId?: ID): OperationalModeSnapshot;
  updateGlobalOperationalModePolicy(
    input: OperationalModePolicyUpdateInput,
    actor?: string,
  ): OperationalModePolicy;
  updateChannelOperationalModePolicy(
    channelId: ID,
    input: OperationalModePolicyUpdateInput,
    actor?: string,
  ): OperationalModePolicy;
  evaluateOperationalAction(input: OperationalActionEvaluationInput): OperationalModeDecision;
};

export type CreateCostEntryInput = {
  channelId: ID;
  contentId?: ID;
  workflowRunId?: ID;
  agentRunId?: ID;
  stage: CostStage;
  providerName: string;
  costType: CostType;
  description: string;
  amountCents: number;
};

export type CostSummaryFilters = {
  channelId?: ID;
  from?: ISODate;
  to?: ISODate;
};

export type OperationalModePolicyUpdateInput = Partial<
  Pick<
    OperationalModePolicy,
    | "mode"
    | "allowRealAi"
    | "allowRealTts"
    | "allowRealImageGeneration"
    | "allowRealVideoGeneration"
    | "allowExternalPublication"
    | "requireHumanApproval"
    | "budgetConfigured"
    | "dailyBudgetLimitCents"
    | "monthlyBudgetLimitCents"
  >
>;

export type OperationalActionEvaluationInput = {
  channelId: ID;
  action: OperationalAction;
  actor?: string;
  costEntryId?: ID;
  plannedCostCents?: number;
};

export type CostsClock = () => Date;
export type CostsIdFactory = () => string;

export type CreateCostsServiceOptions = {
  clock?: CostsClock;
  idFactory?: CostsIdFactory;
};

export type CostsDependencies = {
  channelsRepository: ChannelsRepository;
  auditRepository: {
    appendAuditLog(log: {
      id: ID;
      channelId?: ID;
      actorType: "user" | "agent" | "system";
      actorName: string;
      action: string;
      entityType: string;
      entityId: ID;
      status: "success" | "warning" | "failed";
      message: string;
      metadata?: Record<string, unknown>;
      createdAt: ISODate;
    }): void;
  };
};

export type CostsModule = {
  repository: CostsRepository;
  dependencies: CostsDependencies;
};
