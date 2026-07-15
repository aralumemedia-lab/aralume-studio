import { Router, type Response } from "express";
import { z } from "zod";

import { AppError } from "../../http/errors.js";
import { createListSuccessResponse, createSuccessResponse } from "../../http/response.js";
import {
  createMetricBodySchema,
  formatValidationIssues,
  metricIdParamsSchema,
  metricListQuerySchema,
  metricSummaryQuerySchema,
} from "./metrics.schema.js";
import type { MetricsService } from "./metrics.service.js";

export function createMetricsRouter(service: MetricsService): Router {
  const router = Router();

  router.get("/metrics", (req, res) => {
    const query = parseQuery(metricListQuerySchema, req.query);
    const all = service.listMetrics(query, getRequestId(res));
    const start = (query.page - 1) * query.pageSize;
    res.json(
      createListSuccessResponse(all.slice(start, start + query.pageSize), {
        requestId: getRequestId(res),
        page: query.page,
        pageSize: query.pageSize,
        total: all.length,
      }),
    );
  });

  router.post("/metrics", (req, res) => {
    const body = parseBody(createMetricBodySchema, req.body);
    const result = service.createMetric(body, getRequestId(res));
    res
      .status(result.replay ? 200 : 201)
      .json(createSuccessResponse(result.metric, { requestId: getRequestId(res) }));
  });

  router.get("/metrics/summary", (req, res) => {
    const query = parseQuery(metricSummaryQuerySchema, req.query);
    const summary = service.summarize(query, getRequestId(res));
    res.json(createSuccessResponse(summary, { requestId: getRequestId(res) }));
  });

  router.get("/metrics/:id", (req, res) => {
    const params = parseParams(metricIdParamsSchema, req.params);
    const channelId = parseChannelId(req.query);
    const metric = service.getMetric(params.id, channelId, getRequestId(res));
    res.json(createSuccessResponse(metric, { requestId: getRequestId(res) }));
  });

  return router;
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw validationError(parsed.error.issues, "Invalid metric payload");
  return parsed.data;
}

function parseQuery<T extends z.ZodTypeAny>(schema: T, query: unknown): z.infer<T> {
  const parsed = schema.safeParse(normalizeQuery(query));
  if (!parsed.success) throw validationError(parsed.error.issues, "Invalid metric query");
  return parsed.data;
}

function parseParams<T>(schema: z.ZodType<T>, params: unknown): T {
  const parsed = schema.safeParse(params);
  if (!parsed.success) throw validationError(parsed.error.issues, "Invalid metric id");
  return parsed.data;
}

function parseChannelId(query: unknown): string {
  const parsed = z.object({ channelId: z.string().trim().min(1) }).safeParse(normalizeQuery(query));
  if (!parsed.success) throw validationError(parsed.error.issues, "Metric channelId is required");
  return parsed.data.channelId;
}

function normalizeQuery(query: unknown): Record<string, unknown> {
  if (!query || typeof query !== "object") return {};
  return Object.fromEntries(
    Object.entries(query as Record<string, unknown>).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
}

function validationError(issues: z.ZodIssue[], message: string): AppError {
  return new AppError({
    code: "VALIDATION_ERROR",
    status: 400,
    message,
    details: { issues: formatValidationIssues(issues) },
  });
}

function getRequestId(res: Response): string {
  return typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown";
}
