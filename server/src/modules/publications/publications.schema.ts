import { z } from "zod";

import type {
  PublicationJobStatus,
  PublicationPlatform,
  PublicationTargetReadinessStatus,
  PublicationTargetStatus,
} from "./publications.types.js";

export const publicationPlatformValues = [
  "youtube",
  "tiktok",
  "instagram",
  "linkedin",
  "other",
] as const satisfies readonly PublicationPlatform[];

export const publicationTargetStatusValues = [
  "not_connected",
  "authenticated",
  "token_expired",
] as const satisfies readonly PublicationTargetStatus[];

export const publicationJobStatusValues = [
  "draft",
  "scheduled",
  "published",
  "failed",
] as const satisfies readonly PublicationJobStatus[];

export const publicationTargetReadinessValues = [
  "ready",
  "warning",
  "blocked",
] as const satisfies readonly PublicationTargetReadinessStatus[];

export const publicationPlatformSchema = z.enum(publicationPlatformValues);
export const publicationTargetStatusSchema = z.enum(publicationTargetStatusValues);
export const publicationJobStatusSchema = z.enum(publicationJobStatusValues);
export const publicationTargetReadinessSchema = z.enum(publicationTargetReadinessValues);

export const idSchema = z.string().trim().min(1);
export const channelIdSchema = idSchema;
export const actorSchema = z.string().trim().min(1).max(120);
export const reasonSchema = z.string().trim().min(1).max(4000);
export const isoDateSchema = z.string().trim().min(1);

export const publicationTargetCreateSchema = z
  .object({
    id: idSchema.optional(),
    channelId: channelIdSchema,
    platform: publicationPlatformSchema,
    accountName: z.string().trim().min(1).max(180),
    status: publicationTargetStatusSchema,
    lastConnectedAt: isoDateSchema.optional(),
    tokenExpiresAt: isoDateSchema.optional(),
    sourceContentId: idSchema.optional(),
    sourceVideoAssetId: idSchema.optional(),
    requestedBy: actorSchema.optional(),
  })
  .strict();

export const publicationTargetListQuerySchema = z
  .object({
    channelId: channelIdSchema,
    platform: publicationPlatformSchema.optional(),
    status: publicationTargetStatusSchema.optional(),
    readinessStatus: publicationTargetReadinessSchema.optional(),
  })
  .strict();

export const publicationJobCreateSchema = z
  .object({
    channelId: channelIdSchema,
    publicationTargetId: idSchema,
    contentId: idSchema,
    sourceVideoAssetId: idSchema,
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(4000),
    idempotencyKey: z.string().trim().min(1).max(200),
    scheduledAt: isoDateSchema.optional(),
    requestedBy: actorSchema.optional(),
  })
  .strict();

export const publicationJobRescheduleSchema = z
  .object({
    channelId: channelIdSchema,
    scheduledAt: isoDateSchema.nullable().optional(),
    requestedBy: actorSchema.optional(),
  })
  .strict();

export const publicationJobListQuerySchema = z
  .object({
    channelId: channelIdSchema,
    platform: publicationPlatformSchema.optional(),
    status: publicationJobStatusSchema.optional(),
    publicationTargetId: idSchema.optional(),
    contentId: idSchema.optional(),
    sourceVideoAssetId: idSchema.optional(),
    idempotencyKey: z.string().trim().min(1).optional(),
  })
  .strict();

export const publicationJobIdParamsSchema = z.object({ publicationJobId: idSchema }).strict();
export const publicationTargetIdParamsSchema = z.object({ publicationTargetId: idSchema }).strict();

export function formatValidationIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    code: issue.code,
    message: issue.message,
  }));
}
