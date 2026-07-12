import type {
  AgentDefinition,
  AgentOfficeSnapshot,
  AuditLog,
  Channel,
  ChannelSettings,
  ComplianceCheck,
  ContentIdea,
  CostEntry,
  DashboardSummary,
  DerivedClip,
  HumanApproval,
  ID,
  MediaAssetBase,
  PerformanceMetric,
  ProductionItem,
  PublicationJob,
  ResearchSession,
  Script,
  VideoAsset,
  WorkflowRun,
} from "@/contracts/types";
import type { ApiListSuccess, ApiSuccess, ApiMeta } from "@/contracts/api-contracts";

import { mockChannels, mockChannelSettings } from "@/mocks/mock-channels";
import { mockAgentDefinitions } from "@/mocks/mock-agents";
import {
  mockAgentHandoffs,
  mockAgentRuns,
  mockContentIdeas,
  mockDerivedClips,
  mockMediaAssets,
  mockProductionItems,
  mockResearchSessions,
  mockScripts,
  mockVideoAssets,
  mockWorkflowRuns,
} from "@/mocks/mock-content";
import { mockApprovals } from "@/mocks/mock-approvals";
import { mockCostEntries } from "@/mocks/mock-costs";
import { mockComplianceChecks, mockMetrics, mockPublicationJobs } from "@/mocks/mock-metrics";
import { mockAuditLogs } from "@/mocks/mock-audit";

let requestCounter = 0;
const meta = (extra?: Partial<ApiMeta>): ApiMeta => ({
  requestId: `req_${(++requestCounter).toString(36)}_${Date.now().toString(36)}`,
  generatedAt: new Date().toISOString(),
  ...extra,
});

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

const wrap = async <T,>(data: T): Promise<ApiSuccess<T>> => {
  await delay();
  return { data, meta: meta() };
};

const wrapList = async <T,>(data: T[]): Promise<ApiListSuccess<T>> => {
  await delay();
  return { data, meta: meta({ total: data.length, page: 1, pageSize: data.length }) };
};

const filterByChannel = <T extends { channelId?: ID }>(items: T[], channelId?: ID): T[] =>
  channelId ? items.filter((i) => i.channelId === channelId) : items;

export async function getChannels(): Promise<ApiListSuccess<Channel>> {
  return wrapList(mockChannels);
}

export async function getChannelById(channelId: ID): Promise<ApiSuccess<Channel>> {
  const found = mockChannels.find((c) => c.id === channelId);
  if (!found) throw new Error("Channel not found");
  return wrap(found);
}

export async function getChannelSettings(channelId: ID): Promise<ApiSuccess<ChannelSettings>> {
  const found = mockChannelSettings.find((c) => c.channelId === channelId);
  if (!found) throw new Error("Channel settings not found");
  return wrap(found);
}

export async function getAgentDefinitions(): Promise<ApiListSuccess<AgentDefinition>> {
  return wrapList(mockAgentDefinitions);
}

export async function getDashboardSummary(channelId?: ID): Promise<ApiSuccess<DashboardSummary>> {
  const channels = channelId ? mockChannels.filter((c) => c.id === channelId) : mockChannels;
  const workflows = filterByChannel(mockWorkflowRuns, channelId);
  const approvals = filterByChannel(mockApprovals, channelId).filter((a) => a.status === "pending");
  const publications = filterByChannel(mockPublicationJobs, channelId);
  const costs = filterByChannel(mockCostEntries, channelId);
  const agents = filterByChannel(mockAgentRuns, channelId);
  const audits = filterByChannel(mockAuditLogs, channelId);

  const production = filterByChannel(mockContentIdeas, channelId);
  const byStatus = new Map<string, number>();
  production.forEach((p) => byStatus.set(p.status, (byStatus.get(p.status) ?? 0) + 1));

  const costByChannel = mockChannels
    .filter((c) => !channelId || c.id === channelId)
    .map((c) => ({
      channelId: c.id,
      channelName: c.name,
      amountCents: mockCostEntries
        .filter((e) => e.channelId === c.id)
        .reduce((sum, e) => sum + e.amountCents, 0),
    }));

  const summary: DashboardSummary = {
    activeChannels: channels.filter((c) => c.status === "active" || c.status === "warning").length,
    activeWorkflows: workflows.filter((w) => ["running", "queued", "waiting_approval", "retrying"].includes(w.status)).length,
    pendingApprovals: approvals.length,
    scheduledPublications: publications.filter((p) => p.status === "scheduled").length,
    monthlyCostCents: costs.reduce((s, c) => s + c.amountCents, 0),
    recentFailures: audits.filter((a) => a.status === "failed").length + workflows.filter((w) => w.status === "failed").length,
    criticalAlerts: workflows.filter((w) => w.riskLevel === "critical" || w.riskLevel === "blocked").length,
    runningAgents: agents.filter((a) => a.status === "running").length,
    productionByStatus: Array.from(byStatus.entries()).map(([status, count]) => ({ status: status as ContentIdea["status"], count })),
    costByChannel,
  };
  return wrap(summary);
}

export async function getAgentOfficeSnapshot(channelId?: ID): Promise<ApiSuccess<AgentOfficeSnapshot>> {
  const agents = filterByChannel(mockAgentRuns, channelId);
  const handoffs = filterByChannel(mockAgentHandoffs, channelId);
  const workflows = filterByChannel(mockWorkflowRuns, channelId);
  const blockedItems = workflows
    .filter((w) => w.status === "blocked")
    .map((w) => ({
      id: w.id,
      channelId: w.channelId,
      title: w.title,
      reason: w.blockedReason ?? "Sem detalhe",
      riskLevel: w.riskLevel,
      createdAt: w.createdAt,
    }));
  return wrap({
    channelId,
    generatedAt: new Date().toISOString(),
    agents,
    handoffs,
    workflows,
    blockedItems,
  });
}

export async function getWorkflowRuns(channelId?: ID) {
  return wrapList(filterByChannel(mockWorkflowRuns, channelId));
}

export async function getProductionItems(channelId?: ID): Promise<ApiListSuccess<ProductionItem>> {
  return wrapList(filterByChannel(mockProductionItems, channelId));
}

export async function getContentIdeas(channelId?: ID): Promise<ApiListSuccess<ContentIdea>> {
  return wrapList(filterByChannel(mockContentIdeas, channelId));
}

export async function getResearchSessions(channelId?: ID): Promise<ApiListSuccess<ResearchSession>> {
  return wrapList(filterByChannel(mockResearchSessions, channelId));
}

export async function getScripts(channelId?: ID): Promise<ApiListSuccess<Script>> {
  return wrapList(filterByChannel(mockScripts, channelId));
}

export async function getMediaAssets(channelId?: ID): Promise<ApiListSuccess<MediaAssetBase>> {
  return wrapList(filterByChannel(mockMediaAssets, channelId));
}

export async function getVideoAssets(channelId?: ID): Promise<ApiListSuccess<VideoAsset>> {
  return wrapList(filterByChannel(mockVideoAssets, channelId));
}

export async function getDerivedClips(channelId?: ID): Promise<ApiListSuccess<DerivedClip>> {
  return wrapList(filterByChannel(mockDerivedClips, channelId));
}

export async function getHumanApprovals(channelId?: ID): Promise<ApiListSuccess<HumanApproval>> {
  return wrapList(filterByChannel(mockApprovals, channelId));
}

export async function getPublicationJobs(channelId?: ID): Promise<ApiListSuccess<PublicationJob>> {
  return wrapList(filterByChannel(mockPublicationJobs, channelId));
}

export async function getPerformanceMetrics(channelId?: ID): Promise<ApiListSuccess<PerformanceMetric>> {
  return wrapList(filterByChannel(mockMetrics, channelId));
}

export async function getCostEntries(channelId?: ID): Promise<ApiListSuccess<CostEntry>> {
  return wrapList(filterByChannel(mockCostEntries, channelId));
}

export async function getComplianceChecks(channelId?: ID): Promise<ApiListSuccess<ComplianceCheck>> {
  return wrapList(filterByChannel(mockComplianceChecks, channelId));
}

export async function getAuditLogs(channelId?: ID): Promise<ApiListSuccess<AuditLog>> {
  return wrapList(filterByChannel(mockAuditLogs, channelId));
}
