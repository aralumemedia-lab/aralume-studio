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

export function requestLoggerMiddleware(
  logLevel: RuntimeEnv["ARALUME_LOG_LEVEL"],
  logger: Pick<Console, "info" | "warn" | "error"> = console,
): RequestHandler {
  return (req, res, next) => {
    const startedAt = Date.now();

    res.once("finish", () => {
      const durationMs = Date.now() - startedAt;
      const requestId = typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown";
      const line = `[${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`;

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
          path: req.originalUrl,
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
