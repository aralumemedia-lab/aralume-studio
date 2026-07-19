import type { AuditRepository } from "../audit/audit.types.js";
import type { ChannelsRepository } from "../channels/channel.types.js";
import type { CostsRepository } from "../costs/costs.types.js";
import type {
  EditorialRepository,
  ContentStatus,
  RiskLevel,
} from "../editorial/editorial.types.js";
import type { GovernanceRepository } from "../governance/governance.types.js";
import type { InMemoryPublicationsRepository } from "../publications/publications.repository.js";

export type AgentPhase =
  | "intelligence"
  | "research"
  | "creation"
  | "production"
  | "validation"
  | "distribution"
  | "analysis";
export type WorkflowStatus =
  | "queued"
  | "running"
  | "waiting"
  | "waiting_approval"
  | "completed"
  | "failed"
  | "blocked"
  | "retrying";
export type AgentStatus =
  | "idle"
  | "running"
  | "waiting_input"
  | "waiting_approval"
  | "blocked"
  | "failed"
  | "completed";

export type AgentDefinition = {
  id: string;
  name: string;
  slug: string;
  phase: AgentPhase;
  description: string;
  iconKey: string;
  defaultStatus: AgentStatus;
  order: number;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowRun = {
  id: string;
  channelId: string;
  contentId: string;
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
  currentStepId?: string;
  currentAgentId?: string;
  progressPercent: number;
  riskLevel: RiskLevel;
  costEstimateCents: number;
  costActualCents: number;
  startedAt: string;
  lastActivityAt: string;
  blockedReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type AgentRun = {
  id: string;
  channelId: string;
  workflowRunId: string;
  workflowStepId: string;
  agentId: string;
  agentName: string;
  status: AgentStatus;
  currentTask: string;
  inputSummary: string;
  outputSummary?: string;
  progressPercent: number;
  riskLevel: RiskLevel;
  costEstimateCents: number;
  costActualCents: number;
  startedAt: string;
  lastActivityAt: string;
  errorMessage?: string;
};

export type AgentHandoff = {
  id: string;
  channelId: string;
  workflowRunId: string;
  fromAgentId: string;
  toAgentId: string;
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
  createdAt: string;
  deliveredAt?: string;
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
  productionByStatus: { status: ContentStatus; count: number }[];
  costByChannel: { channelId: string; channelName: string; amountCents: number }[];
};

export type AgentOfficeSnapshot = {
  channelId?: string;
  generatedAt: string;
  agents: AgentRun[];
  handoffs: AgentHandoff[];
  workflows: WorkflowRun[];
  blockedItems: {
    id: string;
    channelId: string;
    title: string;
    reason: string;
    riskLevel: RiskLevel;
    createdAt: string;
  }[];
};

export type CockpitsDependencies = {
  channelsRepository: ChannelsRepository;
  editorialRepository: EditorialRepository;
  costsRepository: CostsRepository;
  governanceRepository: GovernanceRepository;
  publicationsRepository: InMemoryPublicationsRepository;
  auditRepository: AuditRepository;
};

export type CockpitsService = {
  getDashboardSummary(channelId?: string): DashboardSummary;
  getAgentDefinitions(channelId?: string): AgentDefinition[];
  getAgentOfficeSnapshot(channelId?: string): AgentOfficeSnapshot;
  getWorkflowRuns(channelId?: string): WorkflowRun[];
  getWorkflowRun(id: string, channelId: string): WorkflowRun;
};
