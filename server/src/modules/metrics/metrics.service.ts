import { randomUUID } from "node:crypto";

import { AppError } from "../../http/errors.js";
import type { AuditService } from "../audit/audit.service.js";
import type { AuditLog } from "../audit/audit.types.js";
import type { ChannelsRepository } from "../channels/channel.types.js";
import type { EditorialRepository } from "../editorial/editorial.types.js";
import { createMetricBodySchema } from "./metrics.schema.js";
import type {
  CreateMetricInput,
  EditorialRecommendation,
  MetricFilters,
  MetricsRepository,
  MetricsSummary,
  PerformanceMetric,
} from "./metrics.types.js";

export type MetricsClock = () => Date;
export type MetricsIdFactory = () => string;

export type MetricsService = {
  listMetrics(filters: MetricFilters, requestId?: string): PerformanceMetric[];
  getMetric(id: string, channelId: string, requestId?: string): PerformanceMetric;
  createMetric(
    input: CreateMetricInput,
    requestId?: string,
  ): { metric: PerformanceMetric; replay: boolean };
  summarize(
    filters: Pick<MetricFilters, "channelId" | "from" | "to">,
    requestId?: string,
  ): MetricsSummary;
};

export function createMetricsService(
  repository: MetricsRepository,
  dependencies: {
    channelsRepository: ChannelsRepository;
    editorialRepository: EditorialRepository;
    auditService: AuditService;
  },
  options: { clock?: MetricsClock; idFactory?: MetricsIdFactory } = {},
): MetricsService {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? (() => randomUUID());

  return {
    listMetrics(filters, requestId) {
      validateChannel(dependencies.channelsRepository, filters.channelId);
      validatePeriod(filters.from, filters.to);
      const { page: _page, pageSize: _pageSize, ...repositoryFilters } = filters;
      const items = repository.listMetrics(repositoryFilters);
      recordAudit(dependencies.auditService, {
        channelId: filters.channelId,
        action: "metrics.queried",
        entityType: "metrics",
        entityId: filters.channelId,
        message: "Metricas consultadas.",
        status: "success",
        requestId,
        metadata: { count: items.length, from: filters.from, to: filters.to },
      });
      return items;
    },

    getMetric(id, channelId, requestId) {
      validateChannel(dependencies.channelsRepository, channelId);
      const metric = repository.getMetric(id);
      if (!metric) throw notFound("Metric not found", { id });
      if (metric.channelId !== channelId) throw notFound("Metric not found", { id });
      recordAudit(dependencies.auditService, {
        channelId,
        action: "metrics.queried",
        entityType: "performance_metric",
        entityId: id,
        message: "Metrica consultada.",
        status: "success",
        requestId,
      });
      return metric;
    },

    createMetric(input, requestId) {
      const parsed = createMetricBodySchema.parse(input);
      validateChannel(dependencies.channelsRepository, parsed.channelId);
      validatePeriod(parsed.periodStart, parsed.periodEnd);
      const content = dependencies.editorialRepository.getContentIdea(parsed.contentId);
      if (!content) throw notFound("Content not found", { contentId: parsed.contentId });
      if (content.channelId !== parsed.channelId) {
        throw conflict("Content belongs to a different channel", {
          contentId: parsed.contentId,
          channelId: parsed.channelId,
        });
      }

      const existing = repository.findByIdempotency(parsed.channelId, parsed.idempotencyKey);
      const normalized = { ...parsed, validationStatus: parsed.validationStatus ?? "validated" };
      if (existing) {
        if (!samePayload(existing, normalized)) {
          recordAudit(dependencies.auditService, {
            channelId: parsed.channelId,
            action: "metrics.rejected",
            entityType: "performance_metric",
            entityId: existing.id,
            message: "Replay com payload divergente.",
            status: "failed",
            requestId,
            metadata: { reason: "idempotency_conflict" },
          });
          throw conflict("Metric idempotency key already exists with a different payload", {
            channelId: parsed.channelId,
            idempotencyKey: parsed.idempotencyKey,
          });
        }
        recordAudit(dependencies.auditService, {
          channelId: parsed.channelId,
          action: "metrics.idempotent_replay",
          entityType: "performance_metric",
          entityId: existing.id,
          message: "Replay idempotente de metrica.",
          status: "success",
          requestId,
        });
        return { metric: existing, replay: true };
      }

      const now = clock().toISOString();
      const metric: PerformanceMetric = {
        ...normalized,
        id: `me_${idFactory()}`,
        createdAt: now,
        updatedAt: now,
      };
      repository.insertMetric(metric);
      recordAudit(dependencies.auditService, {
        channelId: metric.channelId,
        action: "metrics.registered",
        entityType: "performance_metric",
        entityId: metric.id,
        message: "Metrica registrada.",
        status: "success",
        requestId,
        metadata: {
          origin: metric.origin,
          contentId: metric.contentId,
          platform: metric.platform,
          periodStart: metric.periodStart,
          periodEnd: metric.periodEnd,
        },
      });
      return { metric, replay: false };
    },

    summarize(filters, requestId) {
      validateChannel(dependencies.channelsRepository, filters.channelId);
      validatePeriod(filters.from, filters.to);
      const items = repository.listMetrics(filters);
      const summary = buildSummary(items, filters.channelId, clock().toISOString(), filters);
      recordAudit(dependencies.auditService, {
        channelId: filters.channelId,
        action: summary.recommendation
          ? "metrics.recommendation_generated"
          : "metrics.insufficient_data",
        entityType: "metrics_analysis",
        entityId: filters.channelId,
        message: summary.recommendation
          ? "Recomendacao editorial gerada."
          : "Dados insuficientes para recomendacao.",
        status: summary.recommendation ? "success" : "warning",
        requestId,
        metadata: {
          status: summary.status,
          sampleCount: summary.sampleCount,
          originCount: summary.origins.length,
          periodStart: summary.periodStart,
          periodEnd: summary.periodEnd,
        },
      });
      return summary;
    },
  };
}

function buildSummary(
  items: PerformanceMetric[],
  channelId: string,
  generatedAt: string,
  filters: Pick<MetricFilters, "from" | "to">,
): MetricsSummary {
  const periodStart =
    filters.from ??
    items.reduce<string | undefined>(
      (min, item) => (min && min < item.periodStart ? min : item.periodStart),
      undefined,
    );
  const periodEnd =
    filters.to ??
    items.reduce<string | undefined>(
      (max, item) => (max && max > item.periodEnd ? max : item.periodEnd),
      undefined,
    );
  const missingData = new Set<string>();
  const totals = {
    views: sum(items, "views"),
    reach: sum(items, "reach"),
    averageWatchSeconds: average(items, "averageWatchSeconds"),
    completionRate: weightedCompletion(items),
    shares: sum(items, "shares"),
    saves: sum(items, "saves"),
    comments: sum(items, "comments"),
    followersGained: sum(items, "followersGained"),
  };
  for (const item of items) {
    for (const field of [
      "views",
      "reach",
      "averageWatchSeconds",
      "completionRate",
      "shares",
      "saves",
      "comments",
      "followersGained",
    ] as const) {
      if (item[field] === undefined) missingData.add(field);
    }
  }
  const byContent = Array.from(new Set(items.map((item) => item.contentId))).map((contentId) => {
    const contentItems = items.filter((item) => item.contentId === contentId);
    return {
      contentId,
      platforms: Array.from(new Set(contentItems.map((item) => item.platform))).sort(),
      sampleCount: contentItems.length,
      views: sum(contentItems, "views"),
      completionRate: weightedCompletion(contentItems),
      shares: sum(contentItems, "shares"),
      followersGained: sum(contentItems, "followersGained"),
    };
  });
  const recommendation = buildRecommendation(items, channelId, periodStart, periodEnd, generatedAt);
  const status =
    items.length === 0 || !recommendation
      ? "insufficient_data"
      : missingData.size
        ? "partial"
        : "ready";
  return {
    channelId,
    periodStart,
    periodEnd,
    status,
    sampleCount: items.length,
    contentCount: byContent.length,
    platforms: Array.from(new Set(items.map((item) => item.platform))).sort(),
    origins: Array.from(new Set(items.map((item) => item.origin))).sort(),
    totals,
    byContent,
    recommendation,
    missingData: Array.from(missingData).sort(),
    lastCapturedAt: items.reduce<string | undefined>(
      (latest, item) => (latest && latest > item.capturedAt ? latest : item.capturedAt),
      undefined,
    ),
  };
}

function buildRecommendation(
  items: PerformanceMetric[],
  channelId: string,
  periodStart: string | undefined,
  periodEnd: string | undefined,
  generatedAt: string,
): EditorialRecommendation | undefined {
  if (!periodStart || !periodEnd) return undefined;
  const groups = Array.from(new Set(items.map((item) => item.platform)))
    .map((platform) =>
      items.filter((item) => item.platform === platform && item.completionRate !== undefined),
    )
    .filter((group) => group.length >= 2)
    .map((group) => ({
      platform: group[0].platform,
      average: group.reduce((total, item) => total + (item.completionRate ?? 0), 0) / group.length,
      group,
    }))
    .sort((left, right) => right.average - left.average);
  if (groups.length < 2 || groups[0].average - groups[1].average < 0.1) return undefined;
  const winner = groups[0];
  const runnerUp = groups[1];
  const evidence = winner.group.slice(0, 2).map((item) => ({
    metricId: item.id,
    contentId: item.contentId,
    platform: item.platform,
    label: "Taxa de conclusao",
    value: item.completionRate ?? 0,
    unit: "fracao",
  }));
  return {
    id: `rec_${channelId}_${periodEnd.slice(0, 10)}`,
    channelId,
    periodStart,
    periodEnd,
    status: "available",
    evidence,
    rationale: `Os snapshots persistidos indicam completion rate medio de ${formatPercent(winner.average)} em ${winner.platform}, acima de ${formatPercent(runnerUp.average)} em ${runnerUp.platform}. Isto e um sinal de desempenho, nao uma relacao causal.`,
    suggestedAction: `Revisar com prioridade o formato ${winner.platform} nos proximos conteudos e comparar novamente apos nova coleta.`,
    confidence: winner.group.length >= 3 ? "high" : "medium",
    limitations: [
      "Analise deterministica sem controle de variaveis externas.",
      "Amostras pertencem ao periodo selecionado.",
      "Recomendacao exige revisao humana.",
    ],
    generatedAt,
    ruleVersion: "metrics-learning-v1",
  };
}

function sum(
  items: PerformanceMetric[],
  field: "views" | "reach" | "shares" | "saves" | "comments" | "followersGained",
): number | undefined {
  const values = items
    .map((item) => item[field])
    .filter((value): value is number => value !== undefined);
  return values.length ? values.reduce((total, value) => total + value, 0) : undefined;
}

function average(items: PerformanceMetric[], field: "averageWatchSeconds"): number | undefined {
  const values = items
    .map((item) => item[field])
    .filter((value): value is number => value !== undefined);
  return values.length
    ? Math.round(values.reduce((total, value) => total + value, 0) / values.length)
    : undefined;
}

function weightedCompletion(items: PerformanceMetric[]): number | undefined {
  const values = items.filter(
    (item) => item.completionRate !== undefined && item.views !== undefined,
  );
  const views = values.reduce((total, item) => total + (item.views ?? 0), 0);
  return views > 0
    ? values.reduce((total, item) => total + (item.completionRate ?? 0) * (item.views ?? 0), 0) /
        views
    : undefined;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function samePayload(
  existing: PerformanceMetric,
  input: CreateMetricInput & { validationStatus: PerformanceMetric["validationStatus"] },
): boolean {
  const keys = [
    "channelId",
    "contentId",
    "platform",
    "periodStart",
    "periodEnd",
    "views",
    "reach",
    "averageWatchSeconds",
    "completionRate",
    "shares",
    "saves",
    "comments",
    "followersGained",
    "origin",
    "validationStatus",
    "capturedAt",
    "idempotencyKey",
  ] as const;
  return keys.every((key) => existing[key] === input[key]);
}

function validateChannel(repository: ChannelsRepository, channelId: string): void {
  if (!repository.getChannel(channelId)) throw notFound("Channel not found", { channelId });
}

function validatePeriod(from?: string, to?: string): void {
  if (from && to && Date.parse(from) >= Date.parse(to))
    throw validation("Metric period is invalid", { from, to });
}

type MetricAuditInput = Omit<AuditLog, "id" | "createdAt" | "actorType" | "actorName"> & {
  actorType?: AuditLog["actorType"];
  actorName?: string;
  requestId?: string;
};

function recordAudit(auditService: AuditService, input: MetricAuditInput): void {
  const { requestId, actorType, actorName, ...audit } = input;
  auditService.recordAuditLog({
    actorType: actorType ?? "system",
    actorName: actorName ?? "metrics-service",
    ...audit,
    metadata: { ...(audit.metadata ?? {}), ...(requestId ? { requestId } : {}) },
  });
}

function notFound(message: string, details: Record<string, unknown>): AppError {
  return new AppError({ code: "NOT_FOUND", status: 404, message, details });
}
function conflict(message: string, details: Record<string, unknown>): AppError {
  return new AppError({ code: "CONFLICT", status: 409, message, details });
}
function validation(message: string, details: Record<string, unknown>): AppError {
  return new AppError({ code: "VALIDATION_ERROR", status: 400, message, details });
}
