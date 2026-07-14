import { Router, type Response } from "express";
import { z } from "zod";

import { AppError } from "../../http/errors.js";
import { createListSuccessResponse } from "../../http/response.js";
import { auditLogListQuerySchema, formatValidationIssues } from "./audit.schema.js";
import type { AuditService } from "./audit.service.js";

export function createAuditRouter(service: AuditService): Router {
  const router = Router();

  router.get("/audit-logs", (req, res) => {
    const query = parseQuery(auditLogListQuerySchema, req.query);
    const items = service.listAuditLogs(query);
    res.json(createListSuccessResponse(items, { requestId: getRequestId(res) }));
  });

  return router;
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
    message: "Invalid audit log query",
    details: {
      issues: formatValidationIssues(issues),
    },
  });
}

function getRequestId(res: Response): string {
  return typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown";
}
