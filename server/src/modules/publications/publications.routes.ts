import { Router, type Response } from "express";
import { z } from "zod";

import { AppError } from "../../http/errors.js";
import { createListSuccessResponse, createSuccessResponse } from "../../http/response.js";
import type { PublicationsService } from "./publications.service.js";
import {
  formatValidationIssues,
  publicationJobCreateSchema,
  publicationJobIdParamsSchema,
  publicationJobListQuerySchema,
  publicationJobRescheduleSchema,
  publicationTargetCreateSchema,
  publicationTargetListQuerySchema,
} from "./publications.schema.js";

export function createPublicationsRouter(service: PublicationsService): Router {
  const router = Router();

  router.get("/publication-targets", (req, res) => {
    const query = parseQuery(publicationTargetListQuerySchema, req.query);
    const items = service.listPublicationTargets(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.post("/publication-targets", (req, res) => {
    const body = parseBody(publicationTargetCreateSchema, req.body);
    const created = service.createPublicationTarget(body);
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
  });

  router.get("/publications", (req, res) => {
    const query = parseQuery(publicationJobListQuerySchema, req.query);
    const items = service.listPublicationJobs(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.post("/publications", (req, res) => {
    const body = parseBody(publicationJobCreateSchema, req.body);
    const created = service.createPublicationJob(body);
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
  });

  router.post("/publications/:publicationJobId/reschedule", (req, res) => {
    const params = parseParams(publicationJobIdParamsSchema, req.params);
    const body = parseBody(publicationJobRescheduleSchema, req.body);
    const updated = service.reschedulePublicationJob(params.publicationJobId, body);
    res.json(createSuccessResponse(updated, { requestId: getRequestId(res) }));
  });

  return router;
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw validationError(parsed.error.issues);
  }

  return parsed.data;
}

function parseParams<T>(schema: z.ZodType<T>, params: unknown): T {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw validationError(parsed.error.issues);
  }

  return parsed.data;
}

function parseQuery<T extends z.ZodTypeAny>(schema: T, query: unknown): z.infer<T> {
  const parsed = schema.safeParse(normalizeQuery(query));
  if (!parsed.success) {
    throw validationError(parsed.error.issues);
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

function validationError(issues: z.ZodIssue[]) {
  return new AppError({
    code: "VALIDATION_ERROR",
    status: 400,
    message: "Invalid publication payload",
    details: {
      issues: formatValidationIssues(issues),
    },
  });
}

function getRequestId(res: Response): string {
  return typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown";
}
