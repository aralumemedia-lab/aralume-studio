import { existsSync, statSync } from "node:fs";
import { Router, type Response } from "express";
import { z } from "zod";

import { AppError } from "../../http/errors.js";
import { createListSuccessResponse, createSuccessResponse } from "../../http/response.js";
import { resolveAbsoluteStoragePath } from "./media-assets.storage.js";
import {
  derivedClipCreateSchema,
  derivedClipFiltersSchema,
  formatValidationIssues,
  mediaAssetCreateSchema,
  mediaAssetIdParamsSchema,
  mediaAssetIntegrityValidationSchema,
  mediaAssetListQuerySchema,
  mediaAssetPatchSchema,
  mediaAssetStorageValidationSchema,
  mediaAssetUsagesParamsSchema,
  videoAssetFiltersSchema,
  videoAssetImportSchema,
} from "./media-assets.schema.js";
import type { MediaAssetsService } from "./media-assets.types.js";
import type { RendersService } from "../renders/renders.types.js";

export function createMediaAssetsRouter(
  service: MediaAssetsService,
  rendersService: RendersService,
  storageRoot: string | undefined,
): Router {
  const router = Router();

  router.get("/media-assets", (req, res) => {
    const query = parseQuery(mediaAssetListQuerySchema, req.query);
    const items = service.listMediaAssets(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.post("/media-assets", (req, res) => {
    const body = parseBody(mediaAssetCreateSchema, req.body);
    const created = service.createMediaAsset(body);
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
  });

  router.post("/media-assets/validate-storage", (req, res) => {
    const body = parseBody(mediaAssetStorageValidationSchema, req.body);
    const validated = service.validateStorageReference(body);
    res.json(createSuccessResponse(validated, { requestId: getRequestId(res) }));
  });

  router.get("/media-assets/:id/usages", (req, res) => {
    const params = parseParams(mediaAssetUsagesParamsSchema, req.params);
    const query = parseChannelBody(req.query);
    const usages = service.listMediaAssetUsages(query.channelId, params.id);
    res.json(createListSuccessResponse(usages, { requestId: getRequestId(res) }));
  });

  router.post("/media-assets/:id/validate-integrity", (req, res) => {
    const params = parseParams(mediaAssetIdParamsSchema, req.params);
    const body = parseBody(mediaAssetIntegrityValidationSchema, req.body);
    const validated = service.validateAssetIntegrity(body.channelId, params.id, body);
    res.json(createSuccessResponse(validated, { requestId: getRequestId(res) }));
  });

  router.get("/media-assets/:id", (req, res) => {
    const params = parseParams(mediaAssetIdParamsSchema, req.params);
    const query = parseChannelBody(req.query);
    const found = service.getMediaAsset(query.channelId, params.id);
    res.json(createSuccessResponse(found, { requestId: getRequestId(res) }));
  });

  router.patch("/media-assets/:id", (req, res) => {
    const params = parseParams(mediaAssetIdParamsSchema, req.params);
    const body = parseBody(mediaAssetPatchSchema, omitChannelId(req.body));
    const query = parseChannelBody(req.body);
    const updated = service.updateMediaAsset(query.channelId, params.id, body);
    res.json(createSuccessResponse(updated, { requestId: getRequestId(res) }));
  });

  router.get("/videos", (req, res) => {
    const query = parseQuery(videoAssetFiltersSchema, req.query);
    const items = service.listVideoAssets(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.post("/videos/import-from-storage", async (req, res, next) => {
    try {
      const body = parseBody(videoAssetImportSchema, req.body);
      const created = await service.importVideoAssetFromStorage(body);
      res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/clips", (req, res) => {
    const query = parseQuery(derivedClipFiltersSchema, req.query);
    const items = service.listDerivedClips(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.post("/clips", async (req, res, next) => {
    try {
      const body = parseBody(derivedClipCreateSchema, req.body);
      const createdJob = await rendersService.createRenderJob({
        channelId: body.channelId,
        inputAssetIds: [],
        renderType: "controlled_clip",
        renderProfile: "controlled_demo_clip_segment_v1",
        idempotencyKey: body.idempotencyKey,
        parentVideoId: body.parentVideoId,
        startSeconds: body.startSeconds,
        endSeconds: body.endSeconds,
        targetPlatform: body.targetPlatform,
        title: body.title,
        hook: body.hook,
        description: body.description,
        requestedBy: body.requestedBy,
      });

      const clipId = createdJob.outputAssetId;
      if (!clipId) {
        throw new AppError({
          code: "INTERNAL_ERROR",
          status: 500,
          message: "Derived clip output was not registered.",
        });
      }

      const clip = service.getDerivedClip(body.channelId, clipId);
      res.status(201).json(createSuccessResponse(clip, { requestId: getRequestId(res) }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/clips/:id", (req, res) => {
    const params = parseParams(mediaAssetIdParamsSchema, req.params);
    const query = parseChannelBody(req.query);
    const clip = service.getDerivedClip(query.channelId, params.id);
    res.json(createSuccessResponse(clip, { requestId: getRequestId(res) }));
  });

  router.get("/clips/:id/file", (req, res, next) => {
    const params = parseParams(mediaAssetIdParamsSchema, req.params);
    const query = parseChannelBody(req.query);
    const clip = service.getDerivedClip(query.channelId, params.id);

    if (clip.status !== "completed" || !clip.storagePath || !storageRoot?.trim()) {
      throw new AppError({
        code: "NOT_FOUND",
        status: 404,
        message: "Derived clip file not available.",
        details: { channelId: query.channelId, clipId: clip.id },
      });
    }

    const resolved = resolveAbsoluteStoragePath(storageRoot, clip.storagePath);
    if (!existsSync(resolved.absolutePath) || !statSync(resolved.absolutePath).isFile()) {
      throw new AppError({
        code: "NOT_FOUND",
        status: 404,
        message: "Derived clip file not available.",
        details: { channelId: query.channelId, clipId: clip.id },
      });
    }
    res.type(clip.mimeType ?? "video/mp4");
    res.sendFile(resolved.absolutePath, (error) => {
      if (error) {
        next(error);
      }
    });
  });

  return router;
}

function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw validationError("Invalid media payload", parsed.error.issues);
  }

  return parsed.data;
}

function parseParams<T extends z.ZodTypeAny>(schema: T, params: unknown): z.infer<T> {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw validationError("Invalid media params", parsed.error.issues);
  }

  return parsed.data;
}

function parseQuery<T extends z.ZodTypeAny>(schema: T, query: unknown): z.infer<T> {
  const parsed = schema.safeParse(normalizeQuery(query));
  if (!parsed.success) {
    throw validationError("Invalid media query", parsed.error.issues);
  }

  return parsed.data;
}

function parseChannelBody(body: unknown): { channelId: string } {
  const schema = z.object({ channelId: z.string().trim().min(1) }).passthrough();
  const parsed = schema.safeParse(normalizeQuery(body));
  if (!parsed.success) {
    throw validationError("Channel context is required", parsed.error.issues);
  }

  return parsed.data;
}

function omitChannelId(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  const { channelId: _channelId, ...rest } = value as Record<string, unknown>;
  return rest;
}

function normalizeQuery(query: unknown): Record<string, unknown> {
  if (!query || typeof query !== "object") {
    return {};
  }

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
    output[key] = Array.isArray(value) ? value[0] : value;
  }

  return output;
}

function validationError(message: string, issues: z.ZodIssue[]) {
  return new AppError({
    code: "VALIDATION_ERROR",
    status: 400,
    message,
    details: {
      issues: formatValidationIssues(issues),
    },
  });
}

function getRequestId(res: Response): string {
  return typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown";
}
