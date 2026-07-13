import { Router, type Response } from "express";
import { z } from "zod";

import { AppError } from "../../http/errors.js";
import { createListSuccessResponse, createSuccessResponse } from "../../http/response.js";
import {
  claimEvidenceCreateSchema,
  contentIdeaIdParamsSchema,
  contentIdeaListQuerySchema,
  contentIdeaPatchSchema,
  contentIdeaCreateSchema,
  formatValidationIssues,
  idSchema,
  productionItemListQuerySchema,
  researchSessionCreateSchema,
  researchSessionIdParamsSchema,
  researchSessionListQuerySchema,
  researchSourceCreateSchema,
  scriptCreateSchema,
  scriptIdParamsSchema,
  scriptListQuerySchema,
  scriptPatchSchema,
  scriptVersionCreateSchema,
  visualPlanCreateSchema,
  visualPlanIdParamsSchema,
  visualPlanListQuerySchema,
  visualPlanPatchSchema,
  scenePlanCreateSchema,
} from "./editorial.schema.js";
import type { EditorialService } from "./editorial.service.js";

export function createEditorialRouter(service: EditorialService): Router {
  const router = Router();

  router.get("/content-ideas", (req, res) => {
    const query = parseQuery(contentIdeaListQuerySchema, req.query);
    const items = service.listContentIdeas(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.post("/content-ideas", (req, res) => {
    const body = parseBody(contentIdeaCreateSchema, req.body);
    const created = service.createContentIdea(body);
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
  });

  router.get("/content-ideas/:id", (req, res) => {
    const params = parseParams(contentIdeaIdParamsSchema, req.params);
    const found = service.getContentIdea(params.id);
    res.json(createSuccessResponse(found, { requestId: getRequestId(res) }));
  });

  router.patch("/content-ideas/:id", (req, res) => {
    const params = parseParams(contentIdeaIdParamsSchema, req.params);
    const body = parseBody(contentIdeaPatchSchema, req.body);
    const updated = service.updateContentIdea(params.id, body);
    res.json(createSuccessResponse(updated, { requestId: getRequestId(res) }));
  });

  router.get("/production-items", (req, res) => {
    const query = parseQuery(productionItemListQuerySchema, req.query);
    const items = service.listProductionItems(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.get("/production-items/:id", (req, res) => {
    const params = parseIdParam(req.params);
    const item = service.getProductionItem(params.id);
    res.json(createSuccessResponse(item, { requestId: getRequestId(res) }));
  });

  router.get("/research-sessions", (req, res) => {
    const query = parseQuery(researchSessionListQuerySchema, req.query);
    const items = service.listResearchSessions(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.post("/research-sessions", (req, res) => {
    const body = parseBody(researchSessionCreateSchema, req.body);
    const created = service.createResearchSession(body);
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
  });

  router.get("/research-sessions/:id", (req, res) => {
    const params = parseParams(researchSessionIdParamsSchema, req.params);
    const found = service.getResearchSession(params.id);
    res.json(createSuccessResponse(found, { requestId: getRequestId(res) }));
  });

  router.post("/research-sessions/:id/sources", (req, res) => {
    const params = parseParams(researchSessionIdParamsSchema, req.params);
    const body = parseBody(researchSourceCreateSchema, req.body);
    const created = service.createResearchSource(params.id, body);
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
  });

  router.post("/research-sessions/:id/claims", (req, res) => {
    const params = parseParams(researchSessionIdParamsSchema, req.params);
    const body = parseBody(claimEvidenceCreateSchema, req.body);
    const created = service.createClaimEvidence(params.id, body);
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
  });

  router.get("/scripts", (req, res) => {
    const query = parseQuery(scriptListQuerySchema, req.query);
    const items = service.listScripts(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.post("/scripts", (req, res) => {
    const body = parseBody(scriptCreateSchema, req.body);
    const created = service.createScript(body);
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
  });

  router.get("/scripts/:id", (req, res) => {
    const params = parseParams(scriptIdParamsSchema, req.params);
    const found = service.getScript(params.id);
    res.json(createSuccessResponse(found, { requestId: getRequestId(res) }));
  });

  router.patch("/scripts/:id", (req, res) => {
    const params = parseParams(scriptIdParamsSchema, req.params);
    const body = parseBody(scriptPatchSchema, req.body);
    const updated = service.updateScript(params.id, body);
    res.json(createSuccessResponse(updated, { requestId: getRequestId(res) }));
  });

  router.get("/scripts/:id/versions", (req, res) => {
    const params = parseParams(scriptIdParamsSchema, req.params);
    const versions = service.listScriptVersions({ scriptId: params.id });
    res.json(createListSuccessResponse(versions, { requestId: getRequestId(res) }));
  });

  router.post("/scripts/:id/versions", (req, res) => {
    const params = parseParams(scriptIdParamsSchema, req.params);
    const body = parseBody(scriptVersionCreateSchema, req.body);
    const created = service.createScriptVersion(params.id, body);
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
  });

  router.get("/visual-plans", (req, res) => {
    const query = parseQuery(visualPlanListQuerySchema, req.query);
    const items = service.listVisualPlans(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.post("/visual-plans", (req, res) => {
    const body = parseBody(visualPlanCreateSchema, req.body);
    const created = service.createVisualPlan(body);
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
  });

  router.get("/visual-plans/:id", (req, res) => {
    const params = parseParams(visualPlanIdParamsSchema, req.params);
    const found = service.getVisualPlan(params.id);
    res.json(createSuccessResponse(found, { requestId: getRequestId(res) }));
  });

  router.patch("/visual-plans/:id", (req, res) => {
    const params = parseParams(visualPlanIdParamsSchema, req.params);
    const body = parseBody(visualPlanPatchSchema, req.body);
    const updated = service.updateVisualPlan(params.id, body);
    res.json(createSuccessResponse(updated, { requestId: getRequestId(res) }));
  });

  router.post("/visual-plans/:id/scenes", (req, res) => {
    const params = parseParams(visualPlanIdParamsSchema, req.params);
    const body = parseBody(scenePlanCreateSchema, req.body);
    const created = service.createScenePlan(params.id, body);
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
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
  const normalized = normalizeQuery(query);
  const parsed = schema.safeParse(normalized);
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
    if (Array.isArray(value)) {
      output[key] = value[0];
    } else {
      output[key] = value;
    }
  }

  return output;
}

function parseIdParam(params: unknown): { id: string } {
  const parsed = idSchema.safeParse((params as Record<string, unknown> | undefined)?.id);
  if (!parsed.success) {
    throw validationError(parsed.error.issues);
  }

  return { id: parsed.data };
}

function validationError(issues: z.ZodIssue[]) {
  return new AppError({
    code: "VALIDATION_ERROR",
    status: 400,
    message: "Invalid editorial payload",
    details: {
      issues: formatValidationIssues(issues),
    },
  });
}

function getRequestId(res: Response): string {
  return typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown";
}
