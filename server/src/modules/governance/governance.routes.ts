import { Router, type Response } from "express";
import { z } from "zod";

import { AppError } from "../../http/errors.js";
import { getTrustedAuditActor } from "../../http/auth.js";
import { createListSuccessResponse, createSuccessResponse } from "../../http/response.js";
import {
  approvalCreateSchema,
  approvalIdParamsSchema,
  approvalDecisionSchema,
  approvalListQuerySchema,
  complianceCheckCreateSchema,
  complianceCheckIdParamsSchema,
  complianceCheckListQuerySchema,
  formatValidationIssues,
  governanceDetailQuerySchema,
  qualityCheckCreateSchema,
  qualityCheckIdParamsSchema,
  qualityCheckListQuerySchema,
} from "./governance.schema.js";
import type { GovernanceService } from "./governance.service.js";

export function createGovernanceRouter(service: GovernanceService): Router {
  const router = Router();

  router.get("/approvals", (req, res) => {
    const query = parseQuery(approvalListQuerySchema, req.query);
    const items = service.listApprovals(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.post("/approvals", (req, res) => {
    const body = parseBody(approvalCreateSchema, req.body);
    const created = service.createApproval(body, getRequestId(res), getTrustedAuditActor(req));
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
  });

  router.get("/approvals/:id", (req, res) => {
    const params = parseParams(approvalIdParamsSchema, req.params);
    const query = parseQuery(governanceDetailQuerySchema, req.query);
    const found = service.getApproval(params.id, query.channelId);
    res.json(createSuccessResponse(found, { requestId: getRequestId(res) }));
  });

  router.post("/approvals/:id/approve", (req, res) => {
    const params = parseParams(approvalIdParamsSchema, req.params);
    const body = parseBody(approvalDecisionSchema, req.body);
    const updated = service.approveApproval(
      params.id,
      body,
      getRequestId(res),
      getTrustedAuditActor(req),
    );
    res.json(createSuccessResponse(updated, { requestId: getRequestId(res) }));
  });

  router.post("/approvals/:id/reject", (req, res) => {
    const params = parseParams(approvalIdParamsSchema, req.params);
    const body = parseBody(approvalDecisionSchema, req.body);
    const updated = service.rejectApproval(
      params.id,
      body,
      getRequestId(res),
      getTrustedAuditActor(req),
    );
    res.json(createSuccessResponse(updated, { requestId: getRequestId(res) }));
  });

  router.post("/approvals/:id/request-changes", (req, res) => {
    const params = parseParams(approvalIdParamsSchema, req.params);
    const body = parseBody(approvalDecisionSchema, req.body);
    const updated = service.requestApprovalChanges(
      params.id,
      body,
      getRequestId(res),
      getTrustedAuditActor(req),
    );
    res.json(createSuccessResponse(updated, { requestId: getRequestId(res) }));
  });

  router.get("/approvals/:id/history", (req, res) => {
    const params = parseParams(approvalIdParamsSchema, req.params);
    const query = parseQuery(governanceDetailQuerySchema, req.query);
    const history = service.getApprovalHistory(params.id, query.channelId);
    res.json(createListSuccessResponse(history, { requestId: getRequestId(res) }));
  });

  router.get("/quality-checks", (req, res) => {
    const query = parseQuery(qualityCheckListQuerySchema, req.query);
    const items = service.listQualityChecks(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.post("/quality-checks", (req, res) => {
    const body = parseBody(qualityCheckCreateSchema, req.body);
    const created = service.createQualityCheck(body, getRequestId(res), getTrustedAuditActor(req));
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
  });

  router.get("/quality-checks/:id", (req, res) => {
    const params = parseParams(qualityCheckIdParamsSchema, req.params);
    const query = parseQuery(governanceDetailQuerySchema, req.query);
    const found = service.getQualityCheck(params.id, query.channelId);
    res.json(createSuccessResponse(found, { requestId: getRequestId(res) }));
  });

  router.get("/compliance-checks", (req, res) => {
    const query = parseQuery(complianceCheckListQuerySchema, req.query);
    const items = service.listComplianceChecks(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  router.post("/compliance-checks", (req, res) => {
    const body = parseBody(complianceCheckCreateSchema, req.body);
    const created = service.createComplianceCheck(
      body,
      getRequestId(res),
      getTrustedAuditActor(req),
    );
    res.status(201).json(createSuccessResponse(created, { requestId: getRequestId(res) }));
  });

  router.get("/compliance-checks/:id", (req, res) => {
    const params = parseParams(complianceCheckIdParamsSchema, req.params);
    const query = parseQuery(governanceDetailQuerySchema, req.query);
    const found = service.getComplianceCheck(params.id, query.channelId);
    res.json(createSuccessResponse(found, { requestId: getRequestId(res) }));
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
    output[key] = Array.isArray(value) ? value[0] : value;
  }

  return output;
}

function validationError(issues: z.ZodIssue[]) {
  return new AppError({
    code: "VALIDATION_ERROR",
    status: 400,
    message: "Invalid governance payload",
    details: {
      issues: formatValidationIssues(issues),
    },
  });
}

function getRequestId(res: Response): string {
  return typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown";
}
