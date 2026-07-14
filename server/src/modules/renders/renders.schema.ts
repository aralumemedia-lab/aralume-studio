import { z } from "zod";

import type { RenderProfile, RenderStatus, RenderType } from "./renders.types.js";
import { channelIdSchema, idSchema, textSchema } from "../media-assets/media-assets.schema.js";

export const renderTypeValues = ["controlled_video"] as const satisfies readonly RenderType[];
export const renderProfileValues = [
  "controlled_demo_short_v1",
] as const satisfies readonly RenderProfile[];
export const renderStatusValues = [
  "queued",
  "running",
  "completed",
  "failed",
  "blocked",
] as const satisfies readonly RenderStatus[];

export const renderTypeSchema = z.enum(renderTypeValues);
export const renderProfileSchema = z.enum(renderProfileValues);
export const renderStatusSchema = z.enum(renderStatusValues);

export const renderJobIdParamsSchema = z.object({ id: idSchema }).strict();

export const renderJobListQuerySchema = z
  .object({
    channelId: channelIdSchema,
    status: renderStatusSchema.optional(),
    renderType: renderTypeSchema.optional(),
    contentId: idSchema.optional(),
    workflowRunId: idSchema.optional(),
    idempotencyKey: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const createRenderJobSchema = z
  .object({
    channelId: channelIdSchema,
    inputAssetIds: z.array(idSchema).min(1).max(12),
    renderType: renderTypeSchema,
    renderProfile: renderProfileSchema,
    idempotencyKey: z.string().trim().min(1).max(200),
    contentId: idSchema.optional(),
    workflowRunId: idSchema.optional(),
    requestedBy: textSchema.optional(),
  })
  .strict()
  .refine((value) => new Set(value.inputAssetIds).size === value.inputAssetIds.length, {
    message: "Input asset ids must be unique",
    path: ["inputAssetIds"],
  });

export function formatValidationIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    code: issue.code,
    message: issue.message,
  }));
}
