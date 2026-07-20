import { Router, type Response } from "express";
import { z } from "zod";

import { AppError } from "../../http/errors.js";
import { createAuthorizationMiddleware } from "../../http/auth.js";
import { createListSuccessResponse, createSuccessResponse } from "../../http/response.js";
import {
  channelIdParamsSchema,
  createChannelBodySchema,
  formatValidationIssues,
  updateChannelBodySchema,
  updateChannelProfileBodySchema,
} from "./channel.schema.js";
import type { ChannelsService } from "./channel.service.js";
import type { AuditRepository } from "../audit/audit.types.js";

export function createChannelsRouter(
  service: ChannelsService,
  auditRepository: AuditRepository,
): Router {
  const router = Router();

  router.use("/:channelId", createAuthorizationMiddleware(auditRepository));

  router.get("/", (req, res) => {
    const principal = req.auth;
    const channels = service
      .listChannels()
      .filter(
        (channel) =>
          principal?.channelIds.includes("*") || principal?.channelIds.includes(channel.id),
      );
    res.json(
      createListSuccessResponse(channels, {
        requestId: getRequestId(res),
      }),
    );
  });

  router.post("/", (req, res) => {
    const body = parseBody(createChannelBodySchema, req.body);
    const created = service.createChannel(body);
    res.status(201).json(
      createSuccessResponse(created, {
        requestId: getRequestId(res),
      }),
    );
  });

  router.get("/:channelId", (req, res) => {
    const params = parseParams(channelIdParamsSchema, req.params);
    const channel = service.getChannel(params.channelId);
    res.json(
      createSuccessResponse(channel, {
        requestId: getRequestId(res),
      }),
    );
  });

  router.patch("/:channelId", (req, res) => {
    const params = parseParams(channelIdParamsSchema, req.params);
    const body = parseBody(updateChannelBodySchema, req.body);
    const updated = service.updateChannel(params.channelId, body);
    res.json(
      createSuccessResponse(updated, {
        requestId: getRequestId(res),
      }),
    );
  });

  router.get("/:channelId/profile", (req, res) => {
    const params = parseParams(channelIdParamsSchema, req.params);
    const profile = service.getChannelProfile(params.channelId);
    res.json(
      createSuccessResponse(profile, {
        requestId: getRequestId(res),
      }),
    );
  });

  router.patch("/:channelId/profile", (req, res) => {
    const params = parseParams(channelIdParamsSchema, req.params);
    const body = parseBody(updateChannelProfileBodySchema, req.body);
    const updated = service.updateChannelProfile(params.channelId, body, getRequestId(res));
    res.json(
      createSuccessResponse(updated, {
        requestId: getRequestId(res),
      }),
    );
  });

  router.get("/:channelId/settings", (req, res) => {
    const params = parseParams(channelIdParamsSchema, req.params);
    const settings = service.getChannelSettings(params.channelId);
    res.json(
      createSuccessResponse(settings, {
        requestId: getRequestId(res),
      }),
    );
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

function validationError(issues: z.ZodIssue[]) {
  return new AppError({
    code: "VALIDATION_ERROR",
    status: 400,
    message: "Invalid channel payload",
    details: {
      issues: formatValidationIssues(issues),
    },
  });
}

function getRequestId(res: Response): string {
  return typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown";
}
