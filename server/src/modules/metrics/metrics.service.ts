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
  MetricTrend,
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
      const normalizedFilters = normalizeMetricFilters(filters);
      validateChannel(dependencies.channelsRepository, normalizedFilters.channelId);
      validatePeriod(normalizedFilters.from, normalizedFilters.to);
      const { page: _page, pageSize: _pageSize, ...repositoryFilters } = normalizedFilters;
      const items = repository.listMetrics(repositoryFilters);
      recordAudit(dependencies.auditService, {
        channelId: normalizedFilters.channelId,
        action: "metrics.queried",
        entityType: "metrics",
        entityId: normalizedFilters.channelId,
        message: "Metricas consultadas.",
        status: "success",
        requestId,
        metadata: { count: items.length, from: normalizedFilters.from, to: normalizedFilters.to },
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
      const normalized = normalizeMetricInput({
        ...parsed,
        validationStatus: parsed.validationStatus ?? "validated",
      });
      const content = dependencies.editorialRepository.getContentIdea(normalized.contentId);
      if (!content) throw notFound("Content not found", { contentId: parsed.contentId });
      if (content.channelId !== normalized.channelId) {
        throw conflict("Content belongs to a different channel", {
          contentId: normalized.contentId,
          channelId: normalized.channelId,
        });
      }

      const existing = repository.findByIdempotency(
        normalized.channelId,
        normalized.idempotencyKey,
      );
      if (existing) {
        if (!samePayload(existing, normalized)) {
          recordAudit(dependencies.auditService, {
            channelId: normalized.channelId,
            action: "metrics.rejected",
            entityType: "performance_metric",
            entityId: existing.id,
            message: "Replay com payload divergente.",
            status: "failed",
            requestId,
            metadata: { reason: "idempotency_conflict" },
          });
          throw conflict("Metric idempotency key already exists with a different payload", {
            channelId: normalized.channelId,
            idempotencyKey: normalized.idempotencyKey,
          });
        }
        recordAudit(dependencies.auditService, {
          channelId: normalized.channelId,
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
      const normalizedFilters = normalizeMetricFilters(filters);
      validateChannel(dependencies.channelsRepository, normalizedFilters.channelId);
      validatePeriod(normalizedFilters.from, normalizedFilters.to);
      const items = repository.listMetrics(normalizedFilters);
      const allChannelItems = repository.listMetrics({ channelId: normalizedFilters.channelId });
      const summary = buildSummary(
        items,
        allChannelItems,
        normalizedFilters.channelId,
        clock().toISOString(),
        normalizedFilters,
      );
      recordAudit(dependencies.auditService, {
        channelId: normalizedFilters.channelId,
        action: "metrics.analysis_executed",
        entityType: "metrics_analysis",
        entityId: normalizedFilters.channelId,
        message: "Analise de metricas executada.",
        status: "success",
        requestId,
        metadata: {
          status: summary.status,
          sampleCount: summary.sampleCount,
          periodStart: summary.periodStart,
          periodEnd: summary.periodEnd,
          origins: summary.origins,
          platforms: summary.platforms,
          metricTypes: Object.entries(summary.totals)
            .filter(([, value]) => value !== undefined)
            .map(([key]) => key),
        },
      });
      recordAudit(dependencies.auditService, {
        channelId: normalizedFilters.channelId,
        action: summary.recommendation
          ? "metrics.recommendation_generated"
          : "metrics.insufficient_data",
        entityType: "metrics_analysis",
        entityId: normalizedFilters.channelId,
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
          origins: summary.origins,
          platforms: summary.platforms,
          reason: summary.recommendation ? undefined : summary.missingData,
        },
      });
      return summary;
    },
  };
}

function buildSummary(
  items: PerformanceMetric[],
  allChannelItems: PerformanceMetric[],
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
  const trends = buildTrends(items, allChannelItems);
  const recommendation = buildRecommendation(items, allChannelItems, channelId, generatedAt);
  if (
    items.length > 0 &&
    !recommendation &&
    trends.every((trend) => trend.direction === "insufficient_data")
  ) {
    missingData.add("baseline_or_comparable_samples");
  }
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
    trends,
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
  allChannelItems: PerformanceMetric[],
  channelId: string,
  generatedAt: string,
): EditorialRecommendation | undefined {
  const currentPeriodEnd = latestPeriodEnd(items);
  if (!currentPeriodEnd) return undefined;
  const currentItems = items.filter((item) => item.periodEnd === currentPeriodEnd);
  const currentPeriodStart = currentItems.reduce<string | undefined>(
    (min, item) => (min && min < item.periodStart ? min : item.periodStart),
    undefined,
  );
  if (!currentPeriodStart) return undefined;
  const groups = Array.from(new Set(currentItems.map((item) => item.platform)))
    .map((platform) => {
      const current = currentItems.filter(
        (item) => item.platform === platform && item.completionRate !== undefined,
      );
      const baseline = allChannelItems.filter(
        (item) =>
          item.platform === platform &&
          item.periodEnd <= currentPeriodStart &&
          item.completionRate !== undefined,
      );
      return { platform, current, baseline };
    })
    .filter((group) => group.current.length >= 2 && group.baseline.length >= 2)
    .map((group) => ({
      platform: group.platform,
      average: weightedCompletion(group.current),
      baselineAverage: weightedCompletion(group.baseline),
      current: group.current,
      baseline: group.baseline,
    }))
    .filter(
      (group): group is typeof group & { average: number; baselineAverage: number } =>
        group.average !== undefined && group.baselineAverage !== undefined,
    )
    .sort((left, right) => right.average - left.average);
  if (groups.length < 2 || groups[0].average - groups[1].average < 0.1) return undefined;
  const winner = groups[0];
  const runnerUp = groups[1];
  const evidence = [
    ...winner.current.slice(0, 2).map((item) => metricEvidence(item, "Taxa de conclusao corrente")),
    ...runnerUp.current
      .slice(0, 2)
      .map((item) => metricEvidence(item, "Taxa de conclusao corrente")),
    ...winner.baseline.slice(0, 2).map((item) => metricEvidence(item, "Baseline de conclusao")),
    ...runnerUp.baseline.slice(0, 2).map((item) => metricEvidence(item, "Baseline de conclusao")),
  ];
  const winnerDelta = winner.average - winner.baselineAverage;
  const runnerDelta = runnerUp.average - runnerUp.baselineAverage;
  return {
    id: `rec_${channelId}_${currentPeriodEnd.slice(0, 10)}`,
    channelId,
    periodStart: currentPeriodStart,
    periodEnd: currentPeriodEnd,
    status: "available",
    evidence,
    rationale: `No periodo corrente, ${winner.platform} teve completion rate medio de ${formatPercent(winner.average)}, acima de ${formatPercent(runnerUp.average)} em ${runnerUp.platform}. Frente ao baseline anterior, a variacao foi de ${formatSignedPercent(winnerDelta)} em ${winner.platform} e ${formatSignedPercent(runnerDelta)} em ${runnerUp.platform}. Isto e um sinal de desempenho, nao uma relacao causal.`,
    suggestedAction: `Revisar com prioridade o formato ${winner.platform} nos proximos conteudos e comparar novamente apos nova coleta.`,
    confidence: winner.current.length >= 3 && winner.baseline.length >= 3 ? "high" : "medium",
    limitations: [
      "Analise deterministica sem controle de variaveis externas.",
      "Amostras correntes sao comparadas com o baseline anterior da mesma plataforma.",
      "Recomendacao exige revisao humana.",
    ],
    generatedAt,
    ruleVersion: "metrics-learning-v1",
  };
}

function buildTrends(
  items: PerformanceMetric[],
  allChannelItems: PerformanceMetric[],
): MetricTrend[] {
  const currentPeriodEnd = latestPeriodEnd(items);
  if (!currentPeriodEnd) return [];
  const currentItems = items.filter((item) => item.periodEnd === currentPeriodEnd);
  const currentPeriodStart = currentItems.reduce<string | undefined>(
    (min, item) => (min && min < item.periodStart ? min : item.periodStart),
    undefined,
  );
  if (!currentPeriodStart) return [];
  return Array.from(new Set(items.map((item) => item.platform)))
    .sort()
    .map((platform) => {
      const current = currentItems.filter(
        (item) => item.platform === platform && item.completionRate !== undefined,
      );
      const baseline = allChannelItems.filter(
        (item) =>
          item.platform === platform &&
          item.periodEnd <= currentPeriodStart &&
          item.completionRate !== undefined,
      );
      const currentCompletionRate = weightedCompletion(current);
      const baselineCompletionRate = weightedCompletion(baseline);
      const delta =
        currentCompletionRate !== undefined && baselineCompletionRate !== undefined
          ? currentCompletionRate - baselineCompletionRate
          : undefined;
      return {
        platform,
        currentCompletionRate,
        baselineCompletionRate,
        delta,
        direction:
          current.length < 2 || baseline.length < 2 || delta === undefined
            ? "insufficient_data"
            : delta > 0.01
              ? "up"
              : delta < -0.01
                ? "down"
                : "flat",
        currentSampleCount: current.length,
        baselineSampleCount: baseline.length,
      } satisfies MetricTrend;
    });
}

function latestPeriodEnd(items: PerformanceMetric[]): string | undefined {
  return items.reduce<string | undefined>(
    (latest, item) => (latest && latest > item.periodEnd ? latest : item.periodEnd),
    undefined,
  );
}

function metricEvidence(item: PerformanceMetric, label: string) {
  return {
    metricId: item.id,
    contentId: item.contentId,
    platform: item.platform,
    label,
    value: item.completionRate ?? 0,
    unit: "fracao",
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

function formatSignedPercent(value: number): string {
  const percent = Math.round(value * 100);
  return `${percent >= 0 ? "+" : ""}${percent}%`;
}

function normalizeMetricFilters(filters: MetricFilters): MetricFilters {
  return {
    ...filters,
    from: filters.from ? normalizeISODate(filters.from) : undefined,
    to: filters.to ? normalizeISODate(filters.to) : undefined,
  };
}

function normalizeMetricInput(
  input: CreateMetricInput & { validationStatus: PerformanceMetric["validationStatus"] },
): CreateMetricInput & { validationStatus: PerformanceMetric["validationStatus"] } {
  return {
    ...input,
    periodStart: normalizeISODate(input.periodStart),
    periodEnd: normalizeISODate(input.periodEnd),
    capturedAt: normalizeISODate(input.capturedAt),
  };
}

function normalizeISODate(value: string): string {
  return new Date(value).toISOString();
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
