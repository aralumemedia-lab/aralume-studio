import { z } from "zod";

import type { MetricOrigin, MetricValidationStatus } from "./metrics.types.js";

export const metricOriginValues = [
  "manual",
  "imported",
  "demo",
  "fixture",
] as const satisfies readonly MetricOrigin[];
export const metricValidationStatusValues = [
  "validated",
  "partial",
] as const satisfies readonly MetricValidationStatus[];
export const metricOriginSchema = z.enum(metricOriginValues);
export const metricValidationStatusSchema = z.enum(metricValidationStatusValues);
export const metricIdSchema = z.string().trim().min(1).max(120);
export const channelIdSchema = z.string().trim().min(1).max(120);
export const isoDateSchema = z.string().datetime({ offset: true });
const nonNegativeInt = z.number().int().nonnegative();
const optionalMetric = nonNegativeInt.optional();

export const createMetricBodySchema = z
  .object({
    channelId: channelIdSchema,
    contentId: z.string().trim().min(1).max(120),
    platform: z.string().trim().min(1).max(40),
    periodStart: isoDateSchema,
    periodEnd: isoDateSchema,
    views: optionalMetric,
    reach: optionalMetric,
    averageWatchSeconds: optionalMetric,
    completionRate: z.number().finite().min(0).max(1).optional(),
    shares: optionalMetric,
    saves: optionalMetric,
    comments: optionalMetric,
    followersGained: optionalMetric,
    origin: metricOriginSchema,
    validationStatus: metricValidationStatusSchema.optional(),
    capturedAt: isoDateSchema,
    idempotencyKey: z.string().trim().min(1).max(160),
  })
  .strict()
  .refine(
    (value) =>
      [
        value.views,
        value.reach,
        value.averageWatchSeconds,
        value.completionRate,
        value.shares,
        value.saves,
        value.comments,
        value.followersGained,
      ].some((metric) => metric !== undefined),
    { message: "At least one metric value is required" },
  );

export const metricListQuerySchema = z
  .object({
    channelId: channelIdSchema,
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    contentId: z.string().trim().min(1).max(120).optional(),
    platform: z.string().trim().min(1).max(40).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(50),
  })
  .strict();

export const metricSummaryQuerySchema = metricListQuerySchema.omit({ page: true, pageSize: true });
export const metricIdParamsSchema = z.object({ id: metricIdSchema }).strict();

export function formatValidationIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    code: issue.code,
    message: issue.message,
  }));
}
