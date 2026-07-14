import { z } from "zod";

import type {
  MediaAssetCategory,
  MediaAssetLicenseStatus,
  MediaAssetOrigin,
  MediaAssetStatus,
  MediaAssetType,
} from "./media-assets.types.js";

export const mediaAssetTypeValues = [
  "narration",
  "audio",
  "image",
  "video",
  "intermediate_video",
  "thumbnail",
  "soundtrack",
  "sound_effect",
  "subtitle",
  "caption",
  "auxiliary",
  "brand_asset",
  "music",
  "other",
] as const satisfies readonly MediaAssetType[];

export const mediaAssetCategoryValues = [
  "audio",
  "video",
  "visual",
  "text",
  "auxiliary",
  "brand",
  "other",
] as const satisfies readonly MediaAssetCategory[];

export const mediaAssetStatusValues = [
  "available",
  "processing",
  "failed",
  "pending",
  "blocked",
  "invalid",
  "corrupted",
  "missing",
  "replaced",
  "archived",
] as const satisfies readonly MediaAssetStatus[];

export const mediaAssetOriginValues = [
  "internal",
  "generated",
  "uploaded",
  "licensed",
  "demo",
  "channel_provided",
  "public_domain",
  "external_authorized",
  "unknown",
  "prohibited",
] as const satisfies readonly MediaAssetOrigin[];

export const mediaAssetLicenseStatusValues = [
  "known",
  "verified",
  "not_applicable",
  "pending",
  "unknown",
  "confirmed",
  "unconfirmed",
  "restricted",
  "attribution_required",
  "blocked",
] as const satisfies readonly MediaAssetLicenseStatus[];

export const mediaAssetRiskLevelValues = [
  "ok",
  "attention",
  "warning",
  "critical",
  "blocked",
] as const;

export const videoFormatValues = ["horizontal", "vertical", "square"] as const;
export const videoRenderStatusValues = ["not_started", "rendering", "rendered", "failed"] as const;
export const videoQualityStatusValues = ["not_checked", "passed", "warning", "failed"] as const;
export const clipPlatformValues = [
  "youtube_shorts",
  "tiktok",
  "instagram_reels",
  "linkedin",
  "other",
] as const;

export const mediaAssetTypeSchema = z.enum(mediaAssetTypeValues);
export const mediaAssetCategorySchema = z.enum(mediaAssetCategoryValues);
export const mediaAssetStatusSchema = z.enum(mediaAssetStatusValues);
export const mediaAssetOriginSchema = z.enum(mediaAssetOriginValues);
export const mediaAssetLicenseStatusSchema = z.enum(mediaAssetLicenseStatusValues);
export const riskLevelSchema = z.enum(mediaAssetRiskLevelValues);
export const videoFormatSchema = z.enum(videoFormatValues);
export const videoRenderStatusSchema = z.enum(videoRenderStatusValues);
export const videoQualityStatusSchema = z.enum(videoQualityStatusValues);
export const clipPlatformSchema = z.enum(clipPlatformValues);

export const idSchema = z.string().trim().min(1).max(160);
export const channelIdSchema = idSchema;
export const textSchema = z.string().trim().min(1).max(4000);
export const nameSchema = z.string().trim().min(1).max(240);
export const providerSchema = z.string().trim().min(1).max(200);
export const modelSchema = z.string().trim().min(1).max(200);
export const mimeTypeSchema = z.string().trim().min(1).max(200);
export const extensionSchema = z.string().trim().min(1).max(20);
export const sizeBytesSchema = z.number().int().nonnegative();
export const checksumSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{64}$/, "Checksum must be sha256 hex")
  .transform((value) => value.toLowerCase());

export const relativeStoragePathSchema = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .refine((value) => isSafeRelativeStoragePath(value), {
    message: "Storage path must stay within the authorized root",
  });

export const internalUriSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .refine((value) => /^aralume:\/\/media-assets\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(value), {
    message: "Invalid internal URI",
  });

export const mediaAssetCreateSchema = z
  .object({
    channelId: channelIdSchema,
    type: mediaAssetTypeSchema,
    category: mediaAssetCategorySchema,
    name: nameSchema,
    title: z.string().trim().min(1).max(240).optional(),
    description: textSchema,
    mimeType: mimeTypeSchema,
    extension: extensionSchema,
    sizeBytes: sizeBytesSchema,
    checksum: checksumSchema,
    storagePath: relativeStoragePathSchema,
    origin: mediaAssetOriginSchema,
    provenance: textSchema,
    licenseStatus: mediaAssetLicenseStatusSchema,
    licenseName: z.string().trim().min(1).max(240).optional(),
    status: mediaAssetStatusSchema,
    riskLevel: riskLevelSchema,
    costActualCents: sizeBytesSchema,
    contentId: idSchema.optional(),
    workflowRunId: idSchema.optional(),
    scriptId: idSchema.optional(),
    scenePlanId: idSchema.optional(),
    stepId: idSchema.optional(),
    providerName: providerSchema.optional(),
    modelName: modelSchema.optional(),
    prompt: textSchema.optional(),
    thumbnailUri: z.string().trim().min(1).max(320).optional(),
    technicalMetadata: z.record(z.unknown()).optional(),
    usageSummary: textSchema.optional(),
    sourceAssetId: idSchema.optional(),
    notes: textSchema.optional(),
  })
  .strict();

export const mediaAssetPatchSchema = z
  .object({
    type: mediaAssetTypeSchema.optional(),
    category: mediaAssetCategorySchema.optional(),
    name: nameSchema.optional(),
    title: z.string().trim().min(1).max(240).optional(),
    description: textSchema.optional(),
    mimeType: mimeTypeSchema.optional(),
    extension: extensionSchema.optional(),
    sizeBytes: sizeBytesSchema.optional(),
    checksum: checksumSchema.optional(),
    storagePath: relativeStoragePathSchema.optional(),
    origin: mediaAssetOriginSchema.optional(),
    provenance: textSchema.optional(),
    licenseStatus: mediaAssetLicenseStatusSchema.optional(),
    licenseName: z.string().trim().min(1).max(240).optional(),
    status: mediaAssetStatusSchema.optional(),
    riskLevel: riskLevelSchema.optional(),
    costActualCents: sizeBytesSchema.optional(),
    contentId: idSchema.optional(),
    workflowRunId: idSchema.optional(),
    scriptId: idSchema.optional(),
    scenePlanId: idSchema.optional(),
    stepId: idSchema.optional(),
    providerName: providerSchema.optional(),
    modelName: modelSchema.optional(),
    prompt: textSchema.optional(),
    thumbnailUri: z.string().trim().min(1).max(320).optional(),
    technicalMetadata: z.record(z.unknown()).optional(),
    usageSummary: textSchema.optional(),
    sourceAssetId: idSchema.optional(),
    notes: textSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const mediaAssetIdParamsSchema = z.object({ id: idSchema }).strict();

export const mediaAssetListQuerySchema = z
  .object({
    channelId: channelIdSchema,
    type: mediaAssetTypeSchema.optional(),
    category: mediaAssetCategorySchema.optional(),
    status: mediaAssetStatusSchema.optional(),
    riskLevel: riskLevelSchema.optional(),
    origin: mediaAssetOriginSchema.optional(),
    licenseStatus: mediaAssetLicenseStatusSchema.optional(),
    search: z.string().trim().min(1).max(200).optional(),
    contentId: idSchema.optional(),
  })
  .strict();

export const mediaAssetStorageValidationSchema = z
  .object({
    channelId: channelIdSchema,
    type: mediaAssetTypeSchema,
    storagePath: relativeStoragePathSchema,
  })
  .strict();

export const mediaAssetIntegrityValidationSchema = z
  .object({
    channelId: channelIdSchema,
    checksum: checksumSchema.optional(),
    sizeBytes: sizeBytesSchema.optional(),
  })
  .strict();

export const videoAssetFiltersSchema = z
  .object({
    channelId: channelIdSchema,
    status: z
      .enum([
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
      ])
      .optional(),
    renderStatus: videoRenderStatusSchema.optional(),
    qualityStatus: videoQualityStatusSchema.optional(),
    complianceStatus: z
      .enum(["approved", "attention", "rejected", "blocked", "needs_human_review"])
      .optional(),
    search: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const derivedClipFiltersSchema = z
  .object({
    channelId: channelIdSchema,
    status: z
      .enum([
        "queued",
        "running",
        "waiting",
        "waiting_approval",
        "completed",
        "failed",
        "blocked",
        "retrying",
      ])
      .optional(),
    targetPlatform: clipPlatformSchema.optional(),
    parentVideoId: idSchema.optional(),
    renderJobId: idSchema.optional(),
    search: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const derivedClipCreateSchema = z
  .object({
    channelId: channelIdSchema,
    parentVideoId: idSchema,
    startSeconds: z.number().finite().min(0),
    endSeconds: z.number().finite().positive(),
    idempotencyKey: z.string().trim().min(1).max(200),
    targetPlatform: clipPlatformSchema.optional(),
    title: textSchema.optional(),
    hook: textSchema.optional(),
    description: textSchema.optional(),
    requestedBy: textSchema.optional(),
  })
  .strict()
  .refine((value) => value.endSeconds > value.startSeconds, {
    message: "Clip end must be greater than start",
    path: ["endSeconds"],
  });

export const mediaAssetUsagesParamsSchema = z.object({ id: idSchema }).strict();

export function formatValidationIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    code: issue.code,
    message: issue.message,
  }));
}

export function isSafeRelativeStoragePath(value: string): boolean {
  if (!value || value.trim().length === 0) {
    return false;
  }

  if (value.includes("\\") && value.includes("/")) {
    // Mixed separators are too ambiguous for a storage contract.
    return false;
  }

  const normalized = value.replaceAll("\\", "/");
  if (normalized.startsWith("/") || normalized.startsWith("//")) {
    return false;
  }

  if (/^[A-Za-z]:/.test(normalized)) {
    return false;
  }

  if (normalized.includes(":")) {
    return false;
  }

  const segments = normalized.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    return false;
  }

  return true;
}
