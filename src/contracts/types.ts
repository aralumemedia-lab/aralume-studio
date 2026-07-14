import type {
  AgentStatus,
  ApprovalStatus,
  ChannelStatus,
  ComplianceStatus,
  ContentStatus,
  CostStatus,
  MediaAssetLicenseStatus,
  MediaAssetOrigin,
  MediaAssetStatus,
  PublicationStatus,
  QualityCheckStatus,
  RiskLevel,
  WorkflowStatus,
} from "./status";

export type {
  AgentStatus,
  ApprovalStatus,
  ChannelStatus,
  ComplianceStatus,
  ContentStatus,
  CostStatus,
  MediaAssetLicenseStatus,
  MediaAssetOrigin,
  MediaAssetStatus,
  PublicationStatus,
  QualityCheckStatus,
  RiskLevel,
  WorkflowStatus,
} from "./status";

export type ID = string;
export type ISODate = string;

export type Channel = {
  id: ID;
  name: string;
  slug: string;
  description: string;
  status: ChannelStatus;
  niche: string;
  audience: string;
  language: string;
  region: string;
  timezone: string;
  editorialTone: string;
  publishingFrequency: string;
  monthlyBudgetCents: number;
  monthlyCostUsedCents: number;
  costStatus: CostStatus;
  riskLevel: RiskLevel;
  healthScore: number;
  activeWorkflowsCount: number;
  pendingApprovalsCount: number;
  connectedPlatformsCount: number;
  lastActivityAt: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ChannelSettings = {
  id: ID;
  channelId: ID;
  averageVideoDurationSeconds: number;
  allowedFormats: string[];
  allowedSubniches: string[];
  blockedThemes: string[];
  preferredSources: string[];
  visualIdentity: {
    primaryColor: string;
    secondaryColor: string;
    typography: string;
    subtitleStyle: string;
    openingStyle: string;
    thumbnailStyle: string;
  };
  narration: {
    voiceName: string;
    voiceProvider: string;
    speed: number;
    tone: string;
    pronunciationNotes: string[];
  };
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type EditorialRules = {
  id: ID;
  channelId: ID;
  factualContentRequiresSources: boolean;
  minimumSources: number;
  allowFictionalNarratives: boolean;
  allowThirdPartyAssets: boolean;
  requiresHumanApprovalBeforePublication: boolean;
  highRiskAutoBlock: boolean;
  prohibitedClaims: string[];
  complianceNotes: string[];
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type AgentPhase =
  | "intelligence"
  | "research"
  | "creation"
  | "production"
  | "validation"
  | "distribution"
  | "analysis";

export type AgentDefinition = {
  id: ID;
  name: string;
  slug: string;
  phase: AgentPhase;
  description: string;
  iconKey: string;
  defaultStatus: AgentStatus;
  order: number;
  isRequired: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type WorkflowRun = {
  id: ID;
  channelId: ID;
  contentId: ID;
  workflowType:
    | "content_idea"
    | "research"
    | "script"
    | "visual_plan"
    | "media_production"
    | "approval"
    | "publication_preparation"
    | "metrics_analysis";
  title: string;
  status: WorkflowStatus;
  currentStepId?: ID;
  currentAgentId?: ID;
  progressPercent: number;
  riskLevel: RiskLevel;
  costEstimateCents: number;
  costActualCents: number;
  startedAt: ISODate;
  finishedAt?: ISODate;
  failedAt?: ISODate;
  lastActivityAt: ISODate;
  blockedReason?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type RenderType = "controlled_video" | "controlled_clip";
export type RenderProfile = "controlled_demo_short_v1" | "controlled_demo_clip_segment_v1";
export type RenderStatus = WorkflowStatus;

export type RenderLogEntry = {
  timestamp: ISODate;
  level: "info" | "warn" | "error";
  message: string;
  code?: string;
  metadata?: Record<string, unknown>;
};

export type RenderJob = {
  id: ID;
  channelId: ID;
  renderType: RenderType;
  status: RenderStatus;
  inputAssetIds: ID[];
  outputAssetId?: ID;
  parentVideoId?: ID;
  startSeconds?: number;
  endSeconds?: number;
  targetPlatform?: DerivedClip["targetPlatform"];
  renderProfile: RenderProfile;
  idempotencyKey: string;
  outputStoragePath?: string;
  createdAt: ISODate;
  startedAt?: ISODate;
  completedAt?: ISODate;
  durationSeconds?: number;
  attemptCount: number;
  errorCode?: string;
  errorMessage?: string;
  logSummary?: string;
  logEntries?: RenderLogEntry[];
  technicalMetadata?: Record<string, unknown>;
  contentId?: ID;
  workflowRunId?: ID;
  updatedAt: ISODate;
};

export type WorkflowStep = {
  id: ID;
  workflowRunId: ID;
  channelId: ID;
  agentId: ID;
  name: string;
  order: number;
  status: WorkflowStatus;
  inputSummary: string;
  outputSummary?: string;
  startedAt?: ISODate;
  finishedAt?: ISODate;
  costActualCents: number;
  errorMessage?: string;
};

export type AgentRun = {
  id: ID;
  channelId: ID;
  workflowRunId: ID;
  workflowStepId: ID;
  agentId: ID;
  agentName: string;
  status: AgentStatus;
  currentTask: string;
  inputSummary: string;
  outputSummary?: string;
  progressPercent: number;
  riskLevel: RiskLevel;
  costEstimateCents: number;
  costActualCents: number;
  durationSeconds?: number;
  modelName?: string;
  providerName?: string;
  startedAt: ISODate;
  finishedAt?: ISODate;
  lastActivityAt: ISODate;
  errorMessage?: string;
};

export type AgentHandoff = {
  id: ID;
  channelId: ID;
  workflowRunId: ID;
  fromAgentId: ID;
  toAgentId: ID;
  artifactType:
    | "briefing"
    | "research"
    | "editorial_review"
    | "script"
    | "visual_plan"
    | "narration"
    | "media_assets"
    | "video"
    | "clips"
    | "quality_report"
    | "compliance_report"
    | "approval_package"
    | "publication_package"
    | "metrics_report";
  status: "pending" | "delivered" | "blocked" | "failed";
  title: string;
  summary: string;
  createdAt: ISODate;
  deliveredAt?: ISODate;
};

export type ContentIdea = {
  id: ID;
  channelId: ID;
  title: string;
  summary: string;
  niche: string;
  source: string;
  opportunityScore: number;
  originalityScore: number;
  visualPotentialScore: number;
  clipPotentialScore: number;
  riskLevel: RiskLevel;
  status: ContentStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ResearchSession = {
  id: ID;
  channelId: ID;
  contentId: ID;
  title: string;
  status: WorkflowStatus;
  sourceCount: number;
  claimCount: number;
  confidenceScore: number;
  riskLevel: RiskLevel;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type GovernanceEntityType =
  | "content_idea"
  | "production_item"
  | "research_session"
  | "script"
  | "visual_plan";

export type GovernanceTargetSnapshot = {
  entityType: GovernanceEntityType;
  entityId: ID;
  channelId: ID;
  title: string;
  summary: string;
  status: string;
  riskLevel: RiskLevel;
};

export type QualityCheckResult = "pass" | "attention" | "blocked";

export type QualityCheckItem = {
  code: string;
  name: string;
  result: QualityCheckResult;
  severity: RiskLevel;
  message: string;
  blocking: boolean;
  metadata: Record<string, unknown>;
};

export type ComplianceFinding = {
  code: string;
  name: string;
  severity: RiskLevel;
  message: string;
  blocking: boolean;
  metadata: Record<string, unknown>;
};

export type ResearchSource = {
  id: ID;
  channelId: ID;
  researchSessionId: ID;
  title: string;
  url?: string;
  publisher?: string;
  accessedAt: ISODate;
  sourceType: "article" | "paper" | "video" | "book" | "official" | "other";
  confidenceLevel: "low" | "medium" | "high";
  freshnessRisk: RiskLevel;
  usageNotes: string;
};

export type ClaimEvidence = {
  id: ID;
  channelId: ID;
  researchSessionId: ID;
  sourceId: ID;
  claim: string;
  evidenceSummary: string;
  informationType: "fact" | "opinion" | "hypothesis" | "fiction";
  confidenceLevel: "low" | "medium" | "high";
  riskLevel: RiskLevel;
};

export type Script = {
  id: ID;
  channelId: ID;
  contentId: ID;
  title: string;
  status: ContentStatus;
  currentVersionId: ID;
  estimatedDurationSeconds: number;
  hook: string;
  promise: string;
  cta: string;
  riskLevel: RiskLevel;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ScriptVersion = {
  id: ID;
  channelId: ID;
  scriptId: ID;
  versionNumber: number;
  title: string;
  narrationText: string;
  sceneCount: number;
  estimatedDurationSeconds: number;
  changeSummary: string;
  createdAt: ISODate;
};

export type VisualPlan = {
  id: ID;
  channelId: ID;
  contentId: ID;
  scriptVersionId: ID;
  title: string;
  status: ContentStatus;
  sceneCount: number;
  estimatedDurationSeconds: number;
  visualStyle: string;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ScenePlan = {
  id: ID;
  channelId: ID;
  visualPlanId: ID;
  order: number;
  title: string;
  narrationExcerpt: string;
  durationSeconds: number;
  visualDescription: string;
  assetRequirements: string[];
};

export type MediaAssetType =
  | "narration"
  | "audio"
  | "image"
  | "video"
  | "intermediate_video"
  | "thumbnail"
  | "soundtrack"
  | "sound_effect"
  | "subtitle"
  | "caption"
  | "auxiliary"
  | "brand_asset"
  | "music"
  | "other";

export type MediaAssetCategory = "audio" | "video" | "visual" | "text" | "auxiliary" | "brand" | "other";

export type MediaAssetIntegrityState = {
  checksumAlgorithm: "sha256";
  checksum: string;
  sizeBytes: number;
  lastValidatedAt?: ISODate;
  observedChecksum?: string;
  observedSizeBytes?: number;
  checksumMatches?: boolean;
  sizeMatches?: boolean;
};

export type MediaAssetBase = {
  id: ID;
  channelId: ID;
  type: MediaAssetType;
  category?: MediaAssetCategory;
  name?: string;
  title: string;
  description?: string;
  mimeType?: string;
  extension?: string;
  sizeBytes?: number;
  checksumAlgorithm?: "sha256";
  checksum?: string;
  internalUri?: string;
  storagePath?: string;
  origin: MediaAssetOrigin;
  provenance?: string;
  licenseStatus: MediaAssetLicenseStatus;
  licenseName?: string;
  status: MediaAssetStatus;
  riskLevel: RiskLevel;
  costActualCents: number;
  contentId?: ID;
  workflowRunId?: ID;
  scriptId?: ID;
  scenePlanId?: ID;
  stepId?: ID;
  providerName?: string;
  modelName?: string;
  prompt?: string;
  thumbnailUri?: string;
  technicalMetadata?: Record<string, unknown>;
  usageSummary?: string;
  sourceAssetId?: ID;
  notes?: string;
  integrity?: MediaAssetIntegrityState;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type NarrationAsset = MediaAssetBase & {
  type: "narration";
  voiceName: string;
  durationSeconds: number;
  language: string;
};

export type VisualAsset = MediaAssetBase & {
  type: "image" | "video" | "thumbnail" | "brand_asset" | "intermediate_video";
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export type VideoAsset = {
  id: ID;
  channelId: ID;
  contentId: ID;
  title: string;
  status: ContentStatus;
  durationSeconds: number;
  format: "horizontal" | "vertical" | "square";
  resolution: string;
  thumbnailUrl?: string;
  renderStatus: "not_started" | "rendering" | "rendered" | "failed";
  qualityStatus: "not_checked" | "passed" | "warning" | "failed";
  complianceStatus: ComplianceStatus;
  costActualCents: number;
  type?: "video";
  origin?: MediaAssetOrigin;
  licenseStatus?: MediaAssetLicenseStatus;
  internalUri?: string;
  storagePath?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksumAlgorithm?: "sha256";
  checksum?: string;
  providerName?: string;
  modelName?: string;
  prompt?: string;
  technicalMetadata?: Record<string, unknown>;
  riskLevel?: RiskLevel;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type DerivedClip = {
  id: ID;
  channelId: ID;
  parentVideoId: ID;
  renderJobId: ID;
  title: string;
  hook: string;
  description: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  targetPlatform: "youtube_shorts" | "tiktok" | "instagram_reels" | "linkedin" | "other";
  status: WorkflowStatus;
  format: "horizontal" | "vertical" | "square";
  resolution: string;
  aspectRatio: string;
  riskLevel: RiskLevel;
  clipPotentialScore: number;
  type?: "clip" | "video";
  origin?: MediaAssetOrigin;
  licenseStatus?: MediaAssetLicenseStatus;
  internalUri?: string;
  storagePath?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksumAlgorithm?: "sha256";
  checksum?: string;
  costActualCents?: number;
  errorCode?: string;
  errorMessage?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type MediaAssetUsage = {
  id: ID;
  channelId: ID;
  assetId: ID;
  usageType: "content" | "workflow_run" | "script" | "scene" | "video" | "clip";
  referenceId: ID;
  referenceLabel: string;
  summary: string;
  createdAt: ISODate;
};

export type MediaAssetFilters = {
  channelId: ID;
  type?: MediaAssetType;
  category?: MediaAssetCategory;
  status?: MediaAssetStatus;
  riskLevel?: RiskLevel;
  origin?: MediaAssetOrigin;
  licenseStatus?: MediaAssetLicenseStatus;
  search?: string;
  contentId?: ID;
};

export type VideoAssetFilters = {
  channelId: ID;
  status?: VideoAsset["status"];
  renderStatus?: VideoAsset["renderStatus"];
  qualityStatus?: VideoAsset["qualityStatus"];
  complianceStatus?: VideoAsset["complianceStatus"];
  search?: string;
};

export type DerivedClipFilters = {
  channelId: ID;
  status?: DerivedClip["status"];
  targetPlatform?: DerivedClip["targetPlatform"];
  parentVideoId?: ID;
  renderJobId?: ID;
  search?: string;
};

export type QualityCheck = {
  id: ID;
  channelId: ID;
  entityType: GovernanceEntityType;
  entityId: ID;
  status: QualityCheckStatus;
  score: number;
  checks: QualityCheckItem[];
  findings: QualityCheckItem[];
  blockingFindings: QualityCheckItem[];
  checkedAt: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
  targetSnapshot: GovernanceTargetSnapshot;
  summary?: string;
};

export type ComplianceCheck = {
  id: ID;
  channelId: ID;
  entityType: GovernanceEntityType;
  entityId: ID;
  status: ComplianceStatus;
  riskLevel: RiskLevel;
  findings: ComplianceFinding[];
  blockingFindings: ComplianceFinding[];
  checkedAt: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
  targetSnapshot: GovernanceTargetSnapshot;
  requiresHumanReview: boolean;
};

export type HumanApproval = {
  id: ID;
  channelId: ID;
  entityType: GovernanceEntityType;
  entityId: ID;
  title: string;
  status: ApprovalStatus;
  riskLevel: RiskLevel;
  summary: string;
  requestedAt: ISODate;
  requestedBy: string;
  decidedAt?: ISODate;
  decidedBy?: string;
  decisionReason?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
  targetSnapshot: GovernanceTargetSnapshot;
  qualityCheckId?: ID;
  complianceCheckId?: ID;
  latestDecisionId?: ID;
};

export type ApprovalDecision = {
  id: ID;
  approvalId: ID;
  previousStatus: ApprovalStatus;
  nextStatus: ApprovalStatus;
  decision: "approve" | "reject" | "request_changes" | "block";
  justification: string;
  actor: string;
  decidedAt: ISODate;
  createdAt: ISODate;
};

export type PublicationTarget = {
  id: ID;
  channelId: ID;
  platform: "youtube" | "tiktok" | "instagram" | "linkedin" | "other";
  accountName: string;
  status: PublicationStatus;
  lastConnectedAt?: ISODate;
  tokenExpiresAt?: ISODate;
};

export type PublicationJob = {
  id: ID;
  channelId: ID;
  contentId: ID;
  platform: PublicationTarget["platform"];
  title: string;
  description: string;
  scheduledAt?: ISODate;
  status: PublicationStatus;
  approvalId?: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type PerformanceMetric = {
  id: ID;
  channelId: ID;
  contentId?: ID;
  platform?: string;
  periodStart: ISODate;
  periodEnd: ISODate;
  views: number;
  reach: number;
  averageWatchSeconds: number;
  completionRate: number;
  shares: number;
  saves: number;
  comments: number;
  followersGained: number;
  revenueCents: number;
};

export type CostEntry = {
  id: ID;
  channelId: ID;
  contentId?: ID;
  workflowRunId?: ID;
  agentRunId?: ID;
  stage:
    | "research"
    | "editorial"
    | "script"
    | "visual_plan"
    | "narration"
    | "production"
    | "clips"
    | "render"
    | "publication"
    | "infrastructure"
    | "other";
  providerName: string;
  costType: "llm" | "tts" | "image" | "video" | "render" | "storage" | "publication" | "other";
  description: string;
  amountCents: number;
  currency: "BRL";
  createdAt: ISODate;
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

export type AuditLog = {
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
};

export type OperationalModePolicy = {
  id: ID;
  scope: "global" | "channel";
  channelId?: ID;
  mode: "demo" | "local_test" | "supervised_production" | "restricted_production" | "paused";
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

export type DashboardSummary = {
  activeChannels: number;
  activeWorkflows: number;
  pendingApprovals: number;
  scheduledPublications: number;
  monthlyCostCents: number;
  recentFailures: number;
  criticalAlerts: number;
  runningAgents: number;
  productionByStatus: {
    status: ContentStatus;
    count: number;
  }[];
  costByChannel: {
    channelId: ID;
    channelName: string;
    amountCents: number;
  }[];
};

export type AgentOfficeSnapshot = {
  channelId?: ID;
  generatedAt: ISODate;
  agents: AgentRun[];
  handoffs: AgentHandoff[];
  workflows: WorkflowRun[];
  blockedItems: {
    id: ID;
    channelId: ID;
    title: string;
    reason: string;
    riskLevel: RiskLevel;
    createdAt: ISODate;
  }[];
};

export type ProductionItem = {
  id: ID;
  channelId: ID;
  contentId: ID;
  title: string;
  status: ContentStatus;
  workflowRunId: ID;
  currentAgentId?: ID;
  currentAgentName?: string;
  progressPercent: number;
  costActualCents: number;
  riskLevel: RiskLevel;
  nextAction: string;
  lastActivityAt: ISODate;
};
