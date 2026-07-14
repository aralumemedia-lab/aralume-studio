import { Router, type Response } from "express";
import { z } from "zod";

import { AppError } from "../../http/errors.js";
import { createListSuccessResponse, createSuccessResponse } from "../../http/response.js";
import {
  createRenderJobSchema,
  formatValidationIssues,
  renderJobIdParamsSchema,
  renderJobListQuerySchema,
} from "./renders.schema.js";
import type { RendersService } from "./renders.types.js";

export function createRendersRouter(service: RendersService): Router {
  const router = Router();

  router.get("/renders", (req, res) => {
    const query = parseQuery(renderJobListQuerySchema, req.query);
    const items = service.listRenderJobs(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.post("/renders", async (req, res, next) => {
    try {
      const body = parseBody(createRenderJobSchema, req.body);
      const created = await service.createRenderJob(body);
      res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/renders/:id", (req, res) => {
    const params = parseParams(renderJobIdParamsSchema, req.params);
    const query = parseChannelQuery(req.query);
    const found = service.getRenderJob(query.channelId, params.id);
    res.json(createSuccessResponse(found, { requestId: getRequestId(res) }));
  });

  return router;
}

function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw validationError("Invalid render payload", parsed.error.issues);
  }

  return parsed.data;
}

function parseParams<T extends z.ZodTypeAny>(schema: T, params: unknown): z.infer<T> {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw validationError("Invalid render params", parsed.error.issues);
  }

  return parsed.data;
}

function parseQuery<T extends z.ZodTypeAny>(schema: T, query: unknown): z.infer<T> {
  const parsed = schema.safeParse(normalizeQuery(query));
  if (!parsed.success) {
    throw validationError("Invalid render query", parsed.error.issues);
  }

  return parsed.data;
}

function parseChannelQuery(query: unknown): { channelId: string } {
  const schema = z.object({ channelId: z.string().trim().min(1) }).strict();
  const parsed = schema.safeParse(normalizeQuery(query));
  if (!parsed.success) {
    throw validationError("Channel context is required", parsed.error.issues);
  }

  return parsed.data;
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
