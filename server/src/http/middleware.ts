import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import { randomUUID } from "node:crypto";

import { AppError, toAppError } from "./errors.js";
import { createErrorResponse } from "./response.js";
import type { RuntimeEnv } from "../env.js";

type LogLevel = RuntimeEnv["ARALUME_LOG_LEVEL"];

const levelOrder: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

function shouldLog(messageLevel: LogLevel, threshold: LogLevel): boolean {
  return levelOrder[messageLevel] >= levelOrder[threshold];
}

function getSanitizedPath(path: string): string {
  return path;
}

export function requestContextMiddleware(): RequestHandler {
  return (req, res, next) => {
    const incomingRequestId = req.header("x-request-id")?.trim();
    const requestId =
      incomingRequestId && incomingRequestId.length > 0 ? incomingRequestId : randomUUID();
    res.locals.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  };
}

export function jsonParserMiddleware(): RequestHandler {
  return express.json({ limit: "1mb" });
}

export const MAX_JSON_DEPTH = 32;

export function jsonDepthMiddleware(maxDepth = MAX_JSON_DEPTH): RequestHandler {
  return (req, _res, next) => {
    if (req.body === undefined || req.body === null) {
      next();
      return;
    }

    if (exceedsJsonDepth(req.body, maxDepth)) {
      next(
        new AppError({
          code: "VALIDATION_ERROR",
          status: 413,
          message: "Request JSON exceeds the allowed nesting depth",
        }),
      );
      return;
    }

    next();
  };
}

export function exceedsJsonDepth(value: unknown, maxDepth = MAX_JSON_DEPTH): boolean {
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 1 }];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || current.value === null || typeof current.value !== "object") {
      continue;
    }

    if (current.depth > maxDepth) {
      return true;
    }

    if (Array.isArray(current.value)) {
      for (const item of current.value) {
        stack.push({ value: item, depth: current.depth + 1 });
      }
    } else {
      for (const item of Object.values(current.value)) {
        stack.push({ value: item, depth: current.depth + 1 });
      }
    }
  }

  return false;
}

export function requestLoggerMiddleware(
  logLevel: RuntimeEnv["ARALUME_LOG_LEVEL"],
  logger: Pick<Console, "info" | "warn" | "error"> = console,
): RequestHandler {
  return (req, res, next) => {
    const startedAt = Date.now();
    const sanitizedPath = getSanitizedPath(req.path);

    res.once("finish", () => {
      const durationMs = Date.now() - startedAt;
      const requestId = typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown";
      const line = `[${requestId}] ${req.method} ${sanitizedPath} ${res.statusCode} ${durationMs}ms`;

      if (res.statusCode >= 500) {
        if (shouldLog("error", logLevel)) {
          logger.error(line);
        }
        return;
      }

      if (res.statusCode >= 400) {
        if (shouldLog("warn", logLevel)) {
          logger.warn(line);
        }
        return;
      }

      if (shouldLog("info", logLevel)) {
        logger.info(line);
      }
    });

    next();
  };
}

export function notFoundMiddleware(): RequestHandler {
  return (req, _res, next) => {
    next(
      new AppError({
        code: "NOT_FOUND",
        status: 404,
        message: "Route not found",
        details: {
          method: req.method,
          path: req.path,
        },
      }),
    );
  };
}

export const errorHandlerMiddleware: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const appError = toAppError(error);
  const requestId = typeof res.locals.requestId === "string" ? res.locals.requestId : randomUUID();

  res.status(appError.status).json(
    createErrorResponse(appError.code, appError.message, appError.details, {
      requestId,
    }),
  );
};
