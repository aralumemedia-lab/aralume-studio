import { z } from "zod";

import type { CostStage, CostType, OperationalAction, OperationalMode } from "./costs.types.js";

export const costStageValues = [
  "research",
  "editorial",
  "script",
  "visual_plan",
  "narration",
  "production",
  "render",
  "publication",
  "infrastructure",
  "other",
] as const satisfies readonly CostStage[];

export const costTypeValues = [
  "llm",
  "tts",
  "image",
  "video",
  "render",
  "storage",
  "publication",
  "other",
] as const satisfies readonly CostType[];

export const operationalModeValues = [
  "demo",
  "local_test",
  "supervised_production",
  "restricted_production",
  "paused",
] as const satisfies readonly OperationalMode[];

export const operationalActionValues = [
  "real_ai_generation",
  "real_tts_generation",
  "real_image_generation",
  "real_video_generation",
  "real_publication",
  "external_call",
  "paid_provider_call",
  "simulation_only",
] as const satisfies readonly OperationalAction[];

export const costStageSchema = z.enum(costStageValues);
export const costTypeSchema = z.enum(costTypeValues);
export const operationalModeSchema = z.enum(operationalModeValues);
export const operationalActionSchema = z.enum(operationalActionValues);

export const idSchema = z.string().trim().min(1);
export const channelIdSchema = idSchema;
export const providerNameSchema = z.string().trim().min(1).max(200);
export const descriptionSchema = z.string().trim().min(1).max(500);
export const amountCentsSchema = z.number().int().nonnegative();
export const budgetLimitSchema = z.number().int().nonnegative();
export const isoDateSchema = z.string().trim().min(1).datetime({ offset: true });
export const actorSchema = z.string().trim().min(1).max(120);
export const reasonSchema = z.string().trim().min(1).max(4000);

export const createCostEntrySchema = z
  .object({
    channelId: channelIdSchema,
    contentId: idSchema.optional(),
    workflowRunId: idSchema.optional(),
    agentRunId: idSchema.optional(),
    stage: costStageSchema,
    providerName: providerNameSchema,
    costType: costTypeSchema,
    description: descriptionSchema,
    amountCents: amountCentsSchema,
  })
  .strict();

export const costEntryIdParamsSchema = z.object({ id: idSchema }).strict();

export const costListQuerySchema = z
  .object({
    channelId: channelIdSchema.optional(),
    contentId: idSchema.optional(),
    stage: costStageSchema.optional(),
    costType: costTypeSchema.optional(),
    providerName: providerNameSchema.optional(),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .strict();

export const costSummaryQuerySchema = z
  .object({
    channelId: channelIdSchema.optional(),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .strict();

export const policyUpdateSchema = z
  .object({
    mode: operationalModeSchema.optional(),
    allowRealAi: z.boolean().optional(),
    allowRealTts: z.boolean().optional(),
    allowRealImageGeneration: z.boolean().optional(),
    allowRealVideoGeneration: z.boolean().optional(),
    allowExternalPublication: z.boolean().optional(),
    requireHumanApproval: z.boolean().optional(),
    budgetConfigured: z.boolean().optional(),
    dailyBudgetLimitCents: budgetLimitSchema.optional(),
    monthlyBudgetLimitCents: budgetLimitSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const operationalActionEvaluationSchema = z
  .object({
    channelId: channelIdSchema,
    action: operationalActionSchema,
    actor: actorSchema.optional(),
    costEntryId: idSchema.optional(),
    plannedCostCents: amountCentsSchema.optional(),
  })
  .strict();

export const channelIdParamsSchema = z.object({ channelId: channelIdSchema }).strict();

export const operationalModeListQuerySchema = z
  .object({
    channelId: channelIdSchema.optional(),
  })
  .strict();

export function formatValidationIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    code: issue.code,
    message: issue.message,
  }));
}
