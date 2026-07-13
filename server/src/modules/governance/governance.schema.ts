import { z } from "zod";

import type {
  ApprovalStatus,
  ComplianceStatus,
  GovernanceEntityType,
  QualityCheckStatus,
  RiskLevel,
} from "./governance.types.js";

export const governanceEntityTypeValues = [
  "content_idea",
  "production_item",
  "research_session",
  "script",
  "visual_plan",
] as const satisfies readonly GovernanceEntityType[];

export const approvalStatusValues = [
  "pending",
  "approved",
  "rejected",
  "changes_requested",
  "blocked",
] as const satisfies readonly ApprovalStatus[];

export const qualityCheckStatusValues = [
  "pending",
  "passed",
  "attention",
  "blocked",
] as const satisfies readonly QualityCheckStatus[];

export const complianceStatusValues = [
  "approved",
  "attention",
  "rejected",
  "blocked",
  "needs_human_review",
] as const satisfies readonly ComplianceStatus[];

export const riskLevelValues = [
  "ok",
  "attention",
  "warning",
  "critical",
  "blocked",
] as const satisfies readonly RiskLevel[];

export const governanceEntityTypeSchema = z.enum(governanceEntityTypeValues);
export const approvalStatusSchema = z.enum(approvalStatusValues);
export const qualityCheckStatusSchema = z.enum(qualityCheckStatusValues);
export const complianceStatusSchema = z.enum(complianceStatusValues);
export const riskLevelSchema = z.enum(riskLevelValues);

export const idSchema = z.string().trim().min(1);
export const channelIdSchema = idSchema;
export const actorSchema = z.string().trim().min(1).max(120);
export const reasonSchema = z.string().trim().min(1).max(4000);

export const approvalCreateSchema = z
  .object({
    channelId: channelIdSchema,
    entityType: governanceEntityTypeSchema,
    entityId: idSchema,
    requestedBy: actorSchema,
    title: z.string().trim().min(1).max(200).optional(),
    summary: z.string().trim().min(1).max(4000).optional(),
  })
  .strict();

export const approvalDecisionSchema = z
  .object({
    decidedBy: actorSchema,
    decisionReason: reasonSchema,
  })
  .strict();

export const approvalListQuerySchema = z
  .object({
    channelId: channelIdSchema.optional(),
    status: approvalStatusSchema.optional(),
    riskLevel: riskLevelSchema.optional(),
    entityType: governanceEntityTypeSchema.optional(),
    entityId: idSchema.optional(),
  })
  .strict();

export const approvalIdParamsSchema = z.object({ id: idSchema }).strict();

export const qualityCheckCreateSchema = z
  .object({
    channelId: channelIdSchema,
    entityType: governanceEntityTypeSchema,
    entityId: idSchema,
  })
  .strict();

export const qualityCheckListQuerySchema = z
  .object({
    channelId: channelIdSchema.optional(),
    status: qualityCheckStatusSchema.optional(),
    riskLevel: riskLevelSchema.optional(),
    entityType: governanceEntityTypeSchema.optional(),
    entityId: idSchema.optional(),
  })
  .strict();

export const qualityCheckIdParamsSchema = z.object({ id: idSchema }).strict();

export const complianceCheckCreateSchema = z
  .object({
    channelId: channelIdSchema,
    entityType: governanceEntityTypeSchema,
    entityId: idSchema,
  })
  .strict();

export const complianceCheckListQuerySchema = z
  .object({
    channelId: channelIdSchema.optional(),
    status: complianceStatusSchema.optional(),
    riskLevel: riskLevelSchema.optional(),
    entityType: governanceEntityTypeSchema.optional(),
    entityId: idSchema.optional(),
  })
  .strict();

export const complianceCheckIdParamsSchema = z.object({ id: idSchema }).strict();

export function formatValidationIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    code: issue.code,
    message: issue.message,
  }));
}
