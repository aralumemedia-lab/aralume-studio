import { Router, type Response } from "express";
import { z } from "zod";

import { AppError } from "../../http/errors.js";
import { createAuthorizationMiddleware, getTrustedAuditActor } from "../../http/auth.js";
import { createListSuccessResponse, createSuccessResponse } from "../../http/response.js";
import type { AuditRepository } from "../audit/audit.types.js";
import {
  channelIdParamsSchema,
  costEntryIdParamsSchema,
  costListQuerySchema,
  costSummaryQuerySchema,
  createCostEntrySchema,
  formatValidationIssues,
  operationalActionEvaluationSchema,
  operationalModeListQuerySchema,
  policyUpdateSchema,
} from "./costs.schema.js";
import type { CostsService } from "./costs.types.js";

export function createCostsRouter(service: CostsService, auditRepository: AuditRepository): Router {
  const router = Router();

  router.use(
    "/operational-modes/channels/:channelId",
    createAuthorizationMiddleware(auditRepository),
  );

  router.get("/costs", (req, res) => {
    const query = parseQuery(costListQuerySchema, req.query);
    const items = service.listCostEntries(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.post("/costs", (req, res) => {
    const body = parseBody(createCostEntrySchema, req.body);
    const created = service.createCostEntry(body);
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
  });

  router.get("/costs/summary", (req, res) => {
    const query = parseQuery(costSummaryQuerySchema, req.query);
    const summary = service.getCostSummary(query);
    res.json(createSuccessResponse(summary, { requestId: getRequestId(res) }));
  });

  router.get("/costs/breakdown", (req, res) => {
    const query = parseQuery(costSummaryQuerySchema, req.query);
    const breakdown = service.getCostBreakdown(query);
    res.json(createSuccessResponse(breakdown, { requestId: getRequestId(res) }));
  });

  router.get("/costs/:id", (req, res) => {
    const params = parseParams(costEntryIdParamsSchema, req.params);
    const entry = service.getCostEntry(params.id);
    res.json(createSuccessResponse(entry, { requestId: getRequestId(res) }));
  });

  router.get("/operational-modes", (req, res) => {
    const query = parseQuery(operationalModeListQuerySchema, req.query);
    const snapshot = service.getOperationalModeSnapshot(query.channelId);
    res.json(createSuccessResponse(snapshot, { requestId: getRequestId(res) }));
  });

  router.patch("/operational-modes/global", (req, res) => {
    const body = parseBody(policyUpdateSchema, req.body);
    const updated = service.updateGlobalOperationalModePolicy(
      body,
      getTrustedAuditActor(req),
      getRequestId(res),
    );
    res.json(createSuccessResponse(updated, { requestId: getRequestId(res) }));
  });

  router.patch("/operational-modes/channels/:channelId", (req, res) => {
    const params = parseParams(channelIdParamsSchema, req.params);
    const body = parseBody(policyUpdateSchema, req.body);
    const updated = service.updateChannelOperationalModePolicy(
      params.channelId,
      body,
      getTrustedAuditActor(req),
      getRequestId(res),
    );
    res.json(createSuccessResponse(updated, { requestId: getRequestId(res) }));
  });

  router.post("/operational-modes/evaluate", (req, res) => {
    const body = parseBody(operationalActionEvaluationSchema, req.body);
    const decision = service.evaluateOperationalAction(
      body,
      getTrustedAuditActor(req),
      getRequestId(res),
    );

    if (!decision.allowed) {
      const errorCode =
        decision.decisionCode === "BUDGET_EXCEEDED" ||
        decision.decisionCode === "BUDGET_LIMIT_REACHED"
          ? "BUDGET_EXCEEDED"
          : "OPERATION_BLOCKED";
      throw new AppError({
        code: errorCode,
        status: 409,
        message: decision.reason,
        details: {
          decision,
        },
      });
    }

    res.json(createSuccessResponse(decision, { requestId: getRequestId(res) }));
  });

  return router;
}

function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw validationError("Invalid costs payload", parsed.error.issues);
  }

  return parsed.data;
}

function parseParams<T extends z.ZodTypeAny>(schema: T, params: unknown): z.infer<T> {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw validationError("Invalid costs params", parsed.error.issues);
  }

  return parsed.data;
}

function parseQuery<T extends z.ZodTypeAny>(schema: T, query: unknown): z.infer<T> {
  const parsed = schema.safeParse(normalizeQuery(query));
  if (!parsed.success) {
    throw validationError("Invalid costs query", parsed.error.issues);
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
