import { z } from "zod";

import type {
  ContentStatus,
  ConfidenceLevel,
  InformationType,
  RiskLevel,
  SourceType,
  WorkflowStatus,
} from "./editorial.types.js";

export const contentStatusValues = [
  "idea",
  "research",
  "script",
  "visual_plan",
  "narration",
  "editing",
  "clips",
  "quality_check",
  "compliance_check",
  "waiting_approval",
  "approved",
  "scheduled",
  "published",
  "failed",
  "blocked",
] as const satisfies readonly ContentStatus[];

export const workflowStatusValues = [
  "queued",
  "running",
  "waiting",
  "waiting_approval",
  "completed",
  "failed",
  "blocked",
  "retrying",
] as const satisfies readonly WorkflowStatus[];

export const riskLevelValues = [
  "ok",
  "attention",
  "warning",
  "critical",
  "blocked",
] as const satisfies readonly RiskLevel[];
export const confidenceLevelValues = [
  "low",
  "medium",
  "high",
] as const satisfies readonly ConfidenceLevel[];
export const sourceTypeValues = [
  "article",
  "paper",
  "video",
  "book",
  "official",
  "other",
] as const satisfies readonly SourceType[];
export const informationTypeValues = [
  "fact",
  "opinion",
  "hypothesis",
  "fiction",
] as const satisfies readonly InformationType[];

export const contentStatusSchema = z.enum(contentStatusValues);
export const workflowStatusSchema = z.enum(workflowStatusValues);
export const riskLevelSchema = z.enum(riskLevelValues);
export const confidenceLevelSchema = z.enum(confidenceLevelValues);
export const sourceTypeSchema = z.enum(sourceTypeValues);
export const informationTypeSchema = z.enum(informationTypeValues);

export const idSchema = z.string().trim().min(1);
export const channelIdSchema = idSchema;
export const isoDateSchema = z.string().trim().min(1);
export const positiveIntSchema = z.number().int().nonnegative();
export const durationSecondsSchema = z.number().int().positive();

const researchUrlSchema = z.string().trim().min(1).url().optional();

export const contentIdeaCreateSchema = z
  .object({
    channelId: channelIdSchema,
    title: z.string().trim().min(1).max(160),
    summary: z.string().trim().min(1).max(4000),
    niche: z.string().trim().min(1).max(120),
    source: z.string().trim().min(1).max(240),
    opportunityScore: positiveIntSchema.max(100),
    originalityScore: positiveIntSchema.max(100),
    visualPotentialScore: positiveIntSchema.max(100),
    clipPotentialScore: positiveIntSchema.max(100),
    riskLevel: riskLevelSchema,
    status: contentStatusSchema,
    requestedBy: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export const contentIdeaPatchSchema = contentIdeaCreateSchema
  .omit({ channelId: true })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const contentIdeaListQuerySchema = z
  .object({
    channelId: channelIdSchema.optional(),
    status: contentStatusSchema.optional(),
  })
  .strict();

export const productionItemListQuerySchema = z
  .object({
    channelId: channelIdSchema.optional(),
    status: contentStatusSchema.optional(),
    contentId: idSchema.optional(),
  })
  .strict();

export const contentIdeaIdParamsSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export const researchSessionCreateSchema = z
  .object({
    channelId: channelIdSchema,
    contentId: idSchema,
    title: z.string().trim().min(1).max(160),
    status: workflowStatusSchema,
    sourceCount: positiveIntSchema,
    claimCount: positiveIntSchema,
    confidenceScore: positiveIntSchema.max(100),
    riskLevel: riskLevelSchema,
    summary: z.string().trim().min(1).max(4000).optional(),
    requestedBy: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export const researchSessionListQuerySchema = z
  .object({
    channelId: channelIdSchema.optional(),
    status: workflowStatusSchema.optional(),
    contentId: idSchema.optional(),
  })
  .strict();

export const researchSessionIdParamsSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export const researchSourceCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(240),
    url: researchUrlSchema,
    publisher: z.string().trim().min(1).max(160).optional(),
    accessedAt: isoDateSchema,
    sourceType: sourceTypeSchema,
    confidenceLevel: confidenceLevelSchema,
    freshnessRisk: riskLevelSchema,
    usageNotes: z.string().trim().min(1).max(4000),
    requestedBy: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export const claimEvidenceCreateSchema = z
  .object({
    sourceId: idSchema,
    claim: z.string().trim().min(1).max(1200),
    evidenceSummary: z.string().trim().min(1).max(4000),
    informationType: informationTypeSchema,
    confidenceLevel: confidenceLevelSchema,
    riskLevel: riskLevelSchema,
    requestedBy: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export const scriptCreateSchema = z
  .object({
    channelId: channelIdSchema,
    contentId: idSchema,
    title: z.string().trim().min(1).max(160),
    status: contentStatusSchema,
    estimatedDurationSeconds: durationSecondsSchema,
    hook: z.string().trim().min(1).max(1000),
    promise: z.string().trim().min(1).max(2000),
    cta: z.string().trim().min(1).max(1000),
    riskLevel: riskLevelSchema,
    initialVersion: z
      .object({
        title: z.string().trim().min(1).max(160).optional(),
        narrationText: z.string().trim().min(1).max(20000),
        sceneCount: positiveIntSchema,
        estimatedDurationSeconds: durationSecondsSchema.optional(),
        changeSummary: z.string().trim().min(1).max(1000),
      })
      .strict(),
  })
  .strict();

export const scriptPatchSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    status: contentStatusSchema.optional(),
    estimatedDurationSeconds: durationSecondsSchema.optional(),
    hook: z.string().trim().min(1).max(1000).optional(),
    promise: z.string().trim().min(1).max(2000).optional(),
    cta: z.string().trim().min(1).max(1000).optional(),
    riskLevel: riskLevelSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const scriptListQuerySchema = z
  .object({
    channelId: channelIdSchema.optional(),
    status: contentStatusSchema.optional(),
    contentId: idSchema.optional(),
  })
  .strict();

export const scriptIdParamsSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export const scriptVersionCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    narrationText: z.string().trim().min(1).max(20000),
    sceneCount: positiveIntSchema,
    estimatedDurationSeconds: durationSecondsSchema.optional(),
    changeSummary: z.string().trim().min(1).max(1000),
    versionNumber: positiveIntSchema.optional(),
  })
  .strict();

export const visualPlanCreateSchema = z
  .object({
    channelId: channelIdSchema,
    contentId: idSchema,
    scriptVersionId: idSchema,
    title: z.string().trim().min(1).max(160),
    status: contentStatusSchema,
    sceneCount: positiveIntSchema,
    estimatedDurationSeconds: durationSecondsSchema,
    visualStyle: z.string().trim().min(1).max(2000),
  })
  .strict();

export const visualPlanPatchSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    status: contentStatusSchema.optional(),
    sceneCount: positiveIntSchema.optional(),
    estimatedDurationSeconds: durationSecondsSchema.optional(),
    visualStyle: z.string().trim().min(1).max(2000).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const visualPlanListQuerySchema = z
  .object({
    channelId: channelIdSchema.optional(),
    status: contentStatusSchema.optional(),
    contentId: idSchema.optional(),
    scriptVersionId: idSchema.optional(),
  })
  .strict();

export const visualPlanIdParamsSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export const scenePlanCreateSchema = z
  .object({
    order: positiveIntSchema,
    title: z.string().trim().min(1).max(160),
    narrationExcerpt: z.string().trim().min(1).max(4000),
    durationSeconds: durationSecondsSchema,
    visualDescription: z.string().trim().min(1).max(4000),
    assetRequirements: z.array(z.string().trim().min(1).max(160)).default([]),
  })
  .strict();

export function formatValidationIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    code: issue.code,
    message: issue.message,
  }));
}
