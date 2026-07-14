import { z } from "zod";

import type { RenderProfile, RenderStatus, RenderType } from "./renders.types.js";
import { channelIdSchema, idSchema, textSchema } from "../media-assets/media-assets.schema.js";

export const renderTypeValues = [
  "controlled_video",
  "controlled_clip",
] as const satisfies readonly RenderType[];
export const renderProfileValues = [
  "controlled_demo_short_v1",
  "controlled_demo_clip_segment_v1",
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
    parentVideoId: idSchema.optional(),
  })
  .strict();

export const createRenderJobSchema = z
  .object({
    channelId: channelIdSchema,
    inputAssetIds: z.array(idSchema).max(12),
    renderType: renderTypeSchema,
    renderProfile: renderProfileSchema,
    idempotencyKey: z.string().trim().min(1).max(200),
    parentVideoId: idSchema.optional(),
    startSeconds: z.number().finite().min(0).optional(),
    endSeconds: z.number().finite().positive().optional(),
    targetPlatform: z
      .enum(["youtube_shorts", "tiktok", "instagram_reels", "linkedin", "other"])
      .optional(),
    title: textSchema.optional(),
    hook: textSchema.optional(),
    description: textSchema.optional(),
    contentId: idSchema.optional(),
    workflowRunId: idSchema.optional(),
    requestedBy: textSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (new Set(value.inputAssetIds).size !== value.inputAssetIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Input asset ids must be unique",
        path: ["inputAssetIds"],
      });
    }

    if (value.renderType === "controlled_video") {
      if (value.inputAssetIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Controlled video renders require at least one input asset",
          path: ["inputAssetIds"],
        });
      }
      return;
    }

    if (!value.parentVideoId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Controlled clip renders require a parent video id",
        path: ["parentVideoId"],
      });
    }

    if (value.inputAssetIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Controlled clip renders do not accept media input assets",
        path: ["inputAssetIds"],
      });
    }

    if (value.startSeconds === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Controlled clip renders require a start second",
        path: ["startSeconds"],
      });
    }

    if (value.endSeconds === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Controlled clip renders require an end second",
        path: ["endSeconds"],
      });
    }
  });

export function formatValidationIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    code: issue.code,
    message: issue.message,
  }));
}
