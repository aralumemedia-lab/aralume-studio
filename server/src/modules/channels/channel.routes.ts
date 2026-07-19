import { Router, type Response } from "express";
import { z } from "zod";

import { AppError } from "../../http/errors.js";
import { createListSuccessResponse, createSuccessResponse } from "../../http/response.js";
import {
  channelIdParamsSchema,
  createChannelBodySchema,
  formatValidationIssues,
  updateChannelBodySchema,
  updateChannelProfileBodySchema,
} from "./channel.schema.js";
import type { ChannelsService } from "./channel.service.js";

export function createChannelsRouter(service: ChannelsService): Router {
  const router = Router();

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

  router.get("/:id", (req, res) => {
    const params = parseParams(channelIdParamsSchema, req.params);
    const channel = service.getChannel(params.id);
    res.json(
      createSuccessResponse(channel, {
        requestId: getRequestId(res),
      }),
    );
  });

  router.patch("/:id", (req, res) => {
    const params = parseParams(channelIdParamsSchema, req.params);
    const body = parseBody(updateChannelBodySchema, req.body);
    const updated = service.updateChannel(params.id, body);
    res.json(
      createSuccessResponse(updated, {
        requestId: getRequestId(res),
      }),
    );
  });

  router.get("/:id/profile", (req, res) => {
    const params = parseParams(channelIdParamsSchema, req.params);
    const profile = service.getChannelProfile(params.id);
    res.json(
      createSuccessResponse(profile, {
        requestId: getRequestId(res),
      }),
    );
  });

  router.patch("/:id/profile", (req, res) => {
    const params = parseParams(channelIdParamsSchema, req.params);
    const body = parseBody(updateChannelProfileBodySchema, req.body);
    const updated = service.updateChannelProfile(params.id, body, getRequestId(res));
    res.json(
      createSuccessResponse(updated, {
        requestId: getRequestId(res),
      }),
    );
  });

  router.get("/:id/settings", (req, res) => {
    const params = parseParams(channelIdParamsSchema, req.params);
    const settings = service.getChannelSettings(params.id);
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
