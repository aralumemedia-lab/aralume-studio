import { Router, type Response } from "express";
import { z } from "zod";

import { AppError } from "../../http/errors.js";
import { createListSuccessResponse, createSuccessResponse } from "../../http/response.js";
import type { CockpitsService } from "./cockpits.types.js";

const idSchema = z.string().trim().min(1).max(120);
const optionalChannelQuery = z.object({ channelId: idSchema.optional() });
const requiredChannelQuery = z.object({ channelId: idSchema });

export function createCockpitsRouter(service: CockpitsService): Router {
  const router = Router();

  router.get("/dashboard/summary", (req, res) => {
    const { channelId } = parseQuery(optionalChannelQuery, req.query, "Invalid dashboard query");
    res.json(createSuccessResponse(service.getDashboardSummary(channelId), meta(res)));
  });

  router.get("/agents", (req, res) => {
    const { channelId } = parseQuery(optionalChannelQuery, req.query, "Invalid agents query");
    res.json(createListSuccessResponse(service.getAgentDefinitions(channelId), meta(res)));
  });

  router.get("/agent-office/snapshot", (req, res) => {
    const { channelId } = parseQuery(optionalChannelQuery, req.query, "Invalid agent office query");
    res.json(createSuccessResponse(service.getAgentOfficeSnapshot(channelId), meta(res)));
  });

  router.get("/workflows", (req, res) => {
    const { channelId } = parseQuery(optionalChannelQuery, req.query, "Invalid workflows query");
    res.json(createListSuccessResponse(service.getWorkflowRuns(channelId), meta(res)));
  });

  router.get("/workflows/:id", (req, res) => {
    const id = parseQuery(z.object({ id: idSchema }), req.params, "Invalid workflow id").id;
    const { channelId } = parseQuery(
      requiredChannelQuery,
      req.query,
      "Workflow channelId is required",
    );
    res.json(createSuccessResponse(service.getWorkflowRun(id, channelId), meta(res)));
  });

  return router;
}

function parseQuery<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
  message: string,
): z.infer<T> {
  const normalized =
    value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([key, item]) => [
            key,
            Array.isArray(item) ? item[0] : item,
          ]),
        )
      : {};
  const parsed = schema.safeParse(normalized);
  if (!parsed.success) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      status: 400,
      message,
      details: {
        issues: parsed.error.issues.map(({ path, message: issue }) => ({ path, message: issue })),
      },
    });
  }
  return parsed.data;
}

function meta(res: Response) {
  return { requestId: typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown" };
}
