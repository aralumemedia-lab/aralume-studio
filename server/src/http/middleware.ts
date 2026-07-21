import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import { randomUUID } from "node:crypto";

import { AppError, toAppError } from "./errors.js";
import { createErrorResponse } from "./response.js";
import type { RuntimeEnv } from "../env.js";
import type { OperationalRuntime } from "../operational.js";
import { createOperationalLogEntry, formatOperationalLogEntry } from "../operational.js";

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

export function jsonParserMiddleware(limit: string | number = "1mb"): RequestHandler {
  return express.json({ limit });
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
  runtime?: OperationalRuntime,
): RequestHandler {
  return (req, res, next) => {
    const startedAt = Date.now();
    const sanitizedPath = getSanitizedPath(req.path);
    runtime?.beginRequest();
    let settled = false;

    const finalize = () => {
      if (settled) {
        return;
      }
      settled = true;
      const durationMs = Date.now() - startedAt;
      const requestId = typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown";
      const line = formatOperationalLogEntry(
        createOperationalLogEntry(req, res, durationMs, runtime ?? fallbackRuntime),
      );
      runtime?.recordRequest({
        statusCode: res.statusCode,
        durationMs,
        requestId,
        actorId:
          typeof res.locals.auditActor?.actorId === "string"
            ? res.locals.auditActor.actorId
            : undefined,
        channelId:
          typeof res.locals.auditChannelId === "string" ? res.locals.auditChannelId : undefined,
        route: sanitizedPath,
        method: req.method,
        errorCode: typeof res.locals.errorCode === "string" ? res.locals.errorCode : undefined,
      });

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
    };

    res.once("finish", finalize);
    res.once("close", finalize);

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
  res.locals.errorCode = appError.code;

  res.status(appError.status).json(
    createErrorResponse(appError.code, appError.message, appError.details, {
      requestId,
    }),
  );
};

const fallbackRuntime: OperationalRuntime = {
  environment: "development",
  state: {
    phase: "starting",
    startedAt: new Date().toISOString(),
  },
  policy: {
    requireHttps: false,
    trustedProxyHops: 0,
    allowedHosts: [],
    allowedOrigins: [],
    maxBodyBytes: 1_048_576,
    requestTimeoutMs: 30_000,
    shutdownTimeoutMs: 10_000,
    rateLimitPerMinute: Number.POSITIVE_INFINITY,
  },
  build: {
    version: "0.1.0",
    buildId: "development",
    source: "version",
  },
  beginRequest() {},
  setListening() {},
  beginShutdown() {},
  completeShutdown() {},
  recordRequest() {},
  recordDependencyFailure() {},
  recordIngressRejection() {},
  snapshotHealth: () => ({
    ok: true,
    service: "aralume-api",
    environment: "development",
    version: "0.1.0",
    build: fallbackRuntime.build,
    phase: "starting",
    startedAt: new Date().toISOString(),
    liveness: fallbackRuntime.snapshotLive(),
    readiness: fallbackRuntime.snapshotReady(),
    topology: {
      requireHttps: false,
      trustedProxyHops: 0,
      allowedHosts: [],
      allowedOrigins: [],
      maxBodyBytes: 1_048_576,
      requestTimeoutMs: 30_000,
      shutdownTimeoutMs: 10_000,
      rateLimitPerMinute: Number.POSITIVE_INFINITY,
    },
    metrics: fallbackRuntime.snapshotMetrics(),
  }),
  snapshotLive: () => ({
    ok: true,
    status: "alive",
    service: "aralume-api",
    environment: "development",
    version: "0.1.0",
    build: fallbackRuntime.build,
    startedAt: new Date().toISOString(),
  }),
  snapshotReady: () => ({
    ok: true,
    status: "starting",
    service: "aralume-api",
    environment: "development",
    version: "0.1.0",
    build: fallbackRuntime.build,
    checks: [],
  }),
  snapshotMetrics: () => ({
    totalRequests: 0,
    activeRequests: 0,
    statusByClass: { "1xx": 0, "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
    errorsByCode: {},
    requestLatencyMs: {
      count: 0,
      minMs: 0,
      maxMs: 0,
      averageMs: 0,
    },
    readinessByState: { starting: 1, ready: 0, shutting_down: 0, stopped: 0 },
    shutdownSignals: {},
    dependencyFailures: {},
    ingressRejections: {},
  }),
  isReady: () => true,
};
