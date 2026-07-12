import type {
  AgentStatus,
  ApprovalStatus,
  ChannelStatus,
  ComplianceStatus,
  ContentStatus,
  CostStatus,
  PublicationStatus,
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
  "narration" | "image" | "video" | "thumbnail" | "music" | "subtitle" | "brand_asset";

export type MediaAssetBase = {
  id: ID;
  channelId: ID;
  contentId?: ID;
  type: MediaAssetType;
  title: string;
  status: "available" | "processing" | "failed" | "blocked";
  origin: "generated" | "uploaded" | "licensed" | "demo";
  licenseStatus: "verified" | "pending" | "unknown" | "blocked";
  providerName?: string;
  modelName?: string;
  prompt?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  costActualCents: number;
  riskLevel: RiskLevel;
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
  type: "image" | "video" | "thumbnail" | "brand_asset";
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
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type DerivedClip = {
  id: ID;
  channelId: ID;
  parentVideoId: ID;
  title: string;
  hook: string;
  description: string;
  durationSeconds: number;
  targetPlatform: "youtube_shorts" | "tiktok" | "instagram_reels" | "linkedin" | "other";
  status: ContentStatus;
  riskLevel: RiskLevel;
  clipPotentialScore: number;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type QualityCheck = {
  id: ID;
  channelId: ID;
  contentId: ID;
  videoAssetId?: ID;
  status: "passed" | "warning" | "failed" | "not_checked";
  resolutionOk: boolean;
  audioOk: boolean;
  subtitlesOk: boolean;
  durationOk: boolean;
  renderOk: boolean;
  findings: string[];
  createdAt: ISODate;
};

export type ComplianceCheck = {
  id: ID;
  channelId: ID;
  contentId: ID;
  status: ComplianceStatus;
  riskLevel: RiskLevel;
  findings: {
    id: ID;
    severity: RiskLevel;
    title: string;
    description: string;
    blocking: boolean;
  }[];
  requiresHumanReview: boolean;
  createdAt: ISODate;
};

export type HumanApproval = {
  id: ID;
  channelId: ID;
  contentId: ID;
  title: string;
  approvalType:
    "idea" | "script" | "visual_plan" | "video" | "clip" | "publication" | "risk_exception";
  status: ApprovalStatus;
  riskLevel: RiskLevel;
  recommendation: "approve" | "reject" | "request_changes" | "block";
  summary: string;
  costActualCents: number;
  createdAt: ISODate;
  decidedAt?: ISODate;
  decidedBy?: string;
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
  providerName: string;
  costType: "llm" | "tts" | "image" | "video" | "render" | "storage" | "publication" | "other";
  description: string;
  amountCents: number;
  createdAt: ISODate;
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
