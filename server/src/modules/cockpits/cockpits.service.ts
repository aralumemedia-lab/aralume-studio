import { AppError } from "../../http/errors.js";
import type { ContentStatus, ProductionItem, RiskLevel } from "../editorial/editorial.types.js";
import type {
  AgentDefinition,
  AgentHandoff,
  AgentRun,
  AgentStatus,
  AgentOfficeSnapshot,
  CockpitsDependencies,
  CockpitsService,
  DashboardSummary,
  WorkflowRun,
  WorkflowStatus,
} from "./cockpits.types.js";

const catalog: AgentDefinition[] = [
  definition(
    "agent_orchestrator",
    "Orquestrador",
    "intelligence",
    "Coordena o fluxo editorial.",
    1,
  ),
  definition("agent_research", "Pesquisador", "research", "Consolida fontes e evidencias.", 2),
  definition("agent_script", "Roteirista", "creation", "Desenvolve roteiro e versoes.", 3),
  definition("agent_visual", "Direcao Visual", "production", "Organiza o planejamento visual.", 4),
  definition(
    "agent_editorial",
    "Editor Editorial",
    "validation",
    "Revisa a consistencia editorial.",
    5,
  ),
  definition(
    "agent_publisher",
    "Publicador Assistido",
    "distribution",
    "Prepara a publicacao supervisionada.",
    6,
  ),
];

export function createCockpitsService(dependencies: CockpitsDependencies): CockpitsService {
  return {
    getDashboardSummary(channelId) {
      validateChannel(dependencies, channelId);
      const channels = scopedChannels(dependencies, channelId);
      const production = dependencies.editorialRepository.listProductionItems({ channelId });
      const ideas = dependencies.editorialRepository.listContentIdeas({ channelId });
      const approvals = dependencies.governanceRepository.listApprovals({ channelId });
      const publications = dependencies.publicationsRepository.listPublicationJobs({ channelId });
      const costs = dependencies.costsRepository.listCostEntries({ channelId });
      const audits = dependencies.auditRepository.listAuditLogs({ channelId });
      const productionByStatus = countStatuses(ideas.map((idea) => idea.status));
      const costByChannel = channels.map((channel) => ({
        channelId: channel.id,
        channelName: channel.name,
        amountCents: dependencies.costsRepository
          .listCostEntries({ channelId: channel.id })
          .reduce((sum, entry) => sum + entry.amountCents, 0),
      }));

      return {
        activeChannels: channels.filter((channel) => channel.status !== "archived").length,
        activeWorkflows: production.filter((item) => isActiveStatus(item.status)).length,
        pendingApprovals: approvals.filter((approval) => approval.status === "pending").length,
        scheduledPublications: publications.filter((job) => job.status === "scheduled").length,
        monthlyCostCents: costs.reduce((sum, entry) => sum + entry.amountCents, 0),
        recentFailures: audits.filter((audit) => audit.status === "failed").length,
        criticalAlerts: audits.filter(
          (audit) => audit.status !== "success" && audit.metadata?.severity === "critical",
        ).length,
        runningAgents: production.filter((item) => isRunningStatus(item.status)).length,
        productionByStatus,
        costByChannel,
      };
    },

    getAgentDefinitions(channelId) {
      validateChannel(dependencies, channelId);
      const activeAgentIds = new Set(
        dependencies.editorialRepository
          .listProductionItems({ channelId })
          .map((item) => item.currentAgentId)
          .filter((id): id is string => Boolean(id)),
      );
      return catalog.filter((agent) => activeAgentIds.size === 0 || activeAgentIds.has(agent.id));
    },

    getAgentOfficeSnapshot(channelId) {
      validateChannel(dependencies, channelId);
      const production = dependencies.editorialRepository.listProductionItems({ channelId });
      const workflows = production.map(toWorkflow);
      const agents = production.map(toAgentRun);
      const handoffs = production.map(toHandoff);
      return {
        channelId,
        generatedAt: new Date().toISOString(),
        agents,
        handoffs,
        workflows,
        blockedItems: production
          .filter((item) => item.status === "blocked" || item.riskLevel === "blocked")
          .map((item) => ({
            id: item.id,
            channelId: item.channelId,
            title: item.title,
            reason: item.nextAction,
            riskLevel: item.riskLevel,
            createdAt: item.lastActivityAt,
          })),
      };
    },

    getWorkflowRuns(channelId) {
      validateChannel(dependencies, channelId);
      return dependencies.editorialRepository.listProductionItems({ channelId }).map(toWorkflow);
    },

    getWorkflowRun(id, channelId) {
      validateChannel(dependencies, channelId);
      const item = dependencies.editorialRepository
        .listProductionItems({ channelId })
        .find((production) => production.workflowRunId === id);
      if (!item) {
        throw notFound("Workflow not found", { id });
      }
      return toWorkflow(item);
    },
  };
}

function definition(
  id: string,
  name: string,
  phase: AgentDefinition["phase"],
  description: string,
  order: number,
) {
  const timestamp = "2026-07-12T00:00:00.000Z";
  return {
    id,
    name,
    slug: id.replace("agent_", ""),
    phase,
    description,
    iconKey: "bot",
    defaultStatus: "idle" as const,
    order,
    isRequired: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function validateChannel(dependencies: CockpitsDependencies, channelId?: string): void {
  if (channelId && !dependencies.channelsRepository.getChannel(channelId)) {
    throw notFound("Channel not found", { channelId });
  }
}

function scopedChannels(dependencies: CockpitsDependencies, channelId?: string) {
  return dependencies.channelsRepository
    .listChannels()
    .filter((channel) => !channelId || channel.id === channelId);
}

function countStatuses(statuses: ContentStatus[]) {
  const counts = new Map<ContentStatus, number>();
  statuses.forEach((status) => counts.set(status, (counts.get(status) ?? 0) + 1));
  return Array.from(counts.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([status, count]) => ({ status, count }));
}

function isActiveStatus(status: ContentStatus): boolean {
  return !["published", "failed", "blocked"].includes(status);
}

function isRunningStatus(status: ContentStatus): boolean {
  return ["research", "script", "visual_plan", "narration", "editing", "clips"].includes(status);
}

function toWorkflow(item: ProductionItem): WorkflowRun {
  return {
    id: item.workflowRunId,
    channelId: item.channelId,
    contentId: item.contentId,
    workflowType: workflowType(item.status),
    title: item.title,
    status: workflowStatus(item.status),
    currentStepId: `step_${item.id}`,
    currentAgentId: item.currentAgentId,
    progressPercent: item.progressPercent,
    riskLevel: item.riskLevel,
    costEstimateCents: item.costActualCents,
    costActualCents: item.costActualCents,
    startedAt: item.lastActivityAt,
    lastActivityAt: item.lastActivityAt,
    blockedReason: item.status === "blocked" ? item.nextAction : undefined,
    createdAt: item.lastActivityAt,
    updatedAt: item.lastActivityAt,
  };
}

function toAgentRun(item: ProductionItem): AgentRun {
  const workflow = toWorkflow(item);
  return {
    id: `run_${item.id}`,
    channelId: item.channelId,
    workflowRunId: item.workflowRunId,
    workflowStepId: `step_${item.id}`,
    agentId: item.currentAgentId ?? "agent_orchestrator",
    agentName: item.currentAgentName ?? "Orquestrador",
    status: agentStatus(item.status),
    currentTask: item.nextAction,
    inputSummary: item.title,
    outputSummary: item.nextAction,
    progressPercent: item.progressPercent,
    riskLevel: item.riskLevel,
    costEstimateCents: workflow.costEstimateCents,
    costActualCents: item.costActualCents,
    startedAt: item.lastActivityAt,
    lastActivityAt: item.lastActivityAt,
    errorMessage: item.status === "failed" ? item.nextAction : undefined,
  };
}

function toHandoff(item: ProductionItem): AgentHandoff {
  return {
    id: `handoff_${item.id}`,
    channelId: item.channelId,
    workflowRunId: item.workflowRunId,
    fromAgentId: "agent_orchestrator",
    toAgentId: item.currentAgentId ?? "agent_orchestrator",
    artifactType: artifactType(item.status),
    status:
      item.status === "blocked" ? "blocked" : item.status === "failed" ? "failed" : "delivered",
    title: item.title,
    summary: item.nextAction,
    createdAt: item.lastActivityAt,
    deliveredAt: item.lastActivityAt,
  };
}

function workflowType(status: ContentStatus): WorkflowRun["workflowType"] {
  if (status === "research") return "research";
  if (status === "script") return "script";
  if (status === "visual_plan") return "visual_plan";
  if (["approved", "waiting_approval", "quality_check", "compliance_check"].includes(status)) {
    return "approval";
  }
  if (["scheduled", "published"].includes(status)) return "publication_preparation";
  return "media_production";
}

function workflowStatus(status: ContentStatus): WorkflowStatus {
  if (status === "blocked") return "blocked";
  if (status === "failed") return "failed";
  if (["approved", "published", "scheduled"].includes(status)) return "completed";
  if (status === "waiting_approval") return "waiting_approval";
  return "running";
}

function agentStatus(status: ContentStatus): AgentStatus {
  if (status === "blocked") return "blocked";
  if (status === "failed") return "failed";
  if (["approved", "published", "scheduled"].includes(status)) return "completed";
  if (status === "waiting_approval") return "waiting_approval";
  return "running";
}

function artifactType(status: ContentStatus): AgentHandoff["artifactType"] {
  if (status === "research") return "research";
  if (status === "script") return "script";
  if (status === "visual_plan") return "visual_plan";
  if (status === "narration") return "narration";
  if (["editing", "clips"].includes(status)) return "video";
  return "editorial_review";
}

function notFound(message: string, details: Record<string, unknown>): AppError {
  return new AppError({ code: "NOT_FOUND", status: 404, message, details });
}
