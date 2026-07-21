import { constants as fsConstants } from "node:fs";
import { accessSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { AppError } from "./http/errors.js";
import { serviceName, serviceVersion } from "./config.js";
import type { RuntimeEnv } from "./env.js";

type OperationalPhase = "starting" | "ready" | "shutting_down" | "stopped";

type OperationalCheckStatus = "ready" | "not_applicable" | "starting" | "shutting_down" | "failed";

type OperationalCheck = {
  name: string;
  status: OperationalCheckStatus;
  message?: string;
  details?: Record<string, unknown>;
};

type OperationalPolicy = {
  requireHttps: boolean;
  trustedProxyHops: number;
  allowedHosts: string[];
  allowedOrigins: string[];
  maxBodyBytes: number;
  requestTimeoutMs: number;
  shutdownTimeoutMs: number;
  rateLimitPerMinute: number;
};

type OperationalState = {
  phase: OperationalPhase;
  startedAt: string;
  listeningAt?: string;
  shutdownAt?: string;
  listenerHost?: string;
  listenerPort?: number;
  shutdownSignal?: NodeJS.Signals;
};

type RequestLatencyStats = {
  count: number;
  minMs: number;
  maxMs: number;
  totalMs: number;
};

type OperationalMetrics = {
  totalRequests: number;
  activeRequests: number;
  statusByClass: Record<"1xx" | "2xx" | "3xx" | "4xx" | "5xx", number>;
  errorsByCode: Record<string, number>;
  requestLatencyMs: RequestLatencyStats;
  readinessByState: Record<OperationalPhase, number>;
  shutdownSignals: Record<string, number>;
  dependencyFailures: Record<string, number>;
  ingressRejections: Record<string, number>;
  lastRequestAt?: string;
  lastErrorCode?: string;
};

export type OperationalRuntime = {
  environment: RuntimeEnv["ARALUME_ENV"];
  state: OperationalState;
  policy: OperationalPolicy;
  build: {
    version: string;
    buildId: string;
    source: "env" | "git" | "version";
  };
  storageRoot?: string;
  beginRequest(): void;
  setListening(host: string, port: number): void;
  beginShutdown(signal: NodeJS.Signals): void;
  completeShutdown(): void;
  recordRequest(input: {
    statusCode: number;
    durationMs: number;
    requestId?: string;
    actorId?: string;
    channelId?: string;
    route: string;
    method: string;
    errorCode?: string;
  }): void;
  recordDependencyFailure(name: string, message: string): void;
  recordIngressRejection(code: string): void;
  snapshotHealth(): OperationalHealthSnapshot;
  snapshotLive(): OperationalLiveSnapshot;
  snapshotReady(): OperationalReadySnapshot;
  snapshotMetrics(): OperationalMetricsSnapshot;
  isReady(): boolean;
};

export type OperationalHealthSnapshot = {
  ok: boolean;
  service: string;
  environment: RuntimeEnv["ARALUME_ENV"];
  version: string;
  build: OperationalRuntime["build"];
  phase: OperationalPhase;
  startedAt: string;
  listeningAt?: string;
  shutdownAt?: string;
  liveness: OperationalLiveSnapshot;
  readiness: OperationalReadySnapshot;
  topology: OperationalTopologySnapshot;
  metrics: OperationalMetricsSnapshot;
};

export type OperationalLiveSnapshot = {
  ok: boolean;
  status: "alive" | "shutting_down" | "stopped";
  service: string;
  environment: RuntimeEnv["ARALUME_ENV"];
  version: string;
  build: OperationalRuntime["build"];
  startedAt: string;
  listeningAt?: string;
  shutdownAt?: string;
};

export type OperationalReadySnapshot = {
  ok: boolean;
  status: "ready" | "starting" | "shutting_down" | "degraded";
  service: string;
  environment: RuntimeEnv["ARALUME_ENV"];
  version: string;
  build: OperationalRuntime["build"];
  checks: OperationalCheck[];
};

export type OperationalTopologySnapshot = {
  requireHttps: boolean;
  trustedProxyHops: number;
  allowedHosts: string[];
  allowedOrigins: string[];
  maxBodyBytes: number;
  requestTimeoutMs: number;
  shutdownTimeoutMs: number;
  rateLimitPerMinute: number;
};

export type OperationalMetricsSnapshot = {
  totalRequests: number;
  activeRequests: number;
  statusByClass: OperationalMetrics["statusByClass"];
  errorsByCode: Record<string, number>;
  requestLatencyMs: {
    count: number;
    minMs: number;
    maxMs: number;
    averageMs: number;
  };
  readinessByState: OperationalMetrics["readinessByState"];
  shutdownSignals: Record<string, number>;
  dependencyFailures: Record<string, number>;
  ingressRejections: Record<string, number>;
  lastRequestAt?: string;
  lastErrorCode?: string;
};

type RequestLogEntry = {
  timestamp: string;
  level: "info" | "warn" | "error";
  service: string;
  environment: RuntimeEnv["ARALUME_ENV"];
  requestId?: string;
  actorId?: string;
  channelId?: string;
  route: string;
  method: string;
  status: number;
  durationMs: number;
  version: string;
  buildId: string;
  errorCode?: string;
};

type RequestContextLocals = {
  requestId?: string;
  auditActor?: { actorId?: string };
  auditChannelId?: string;
};

const DEFAULT_MAX_BODY_BYTES = 1_048_576;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;
const DEFAULT_RATE_LIMIT_PER_MINUTE = 120;

export function createOperationalRuntime(env: RuntimeEnv): OperationalRuntime {
  const storageRoot = resolveStorageRoot(env);
  if (storageRoot) {
    ensureStorageRoot(storageRoot);
  }

  const policy = createPolicy(env);
  const build = createBuildIdentity(env);
  const state: OperationalState = {
    phase: "starting",
    startedAt: new Date().toISOString(),
  };
  const metrics: OperationalMetrics = {
    totalRequests: 0,
    activeRequests: 0,
    statusByClass: {
      "1xx": 0,
      "2xx": 0,
      "3xx": 0,
      "4xx": 0,
      "5xx": 0,
    },
    errorsByCode: {},
    requestLatencyMs: {
      count: 0,
      minMs: Number.POSITIVE_INFINITY,
      maxMs: 0,
      totalMs: 0,
    },
    readinessByState: {
      starting: 1,
      ready: 0,
      shutting_down: 0,
      stopped: 0,
    },
    shutdownSignals: {},
    dependencyFailures: {},
    ingressRejections: {},
  };

  function snapshotLive(): OperationalLiveSnapshot {
    return {
      ok: state.phase !== "stopped",
      status:
        state.phase === "shutting_down"
          ? "shutting_down"
          : state.phase === "stopped"
            ? "stopped"
            : "alive",
      service: serviceName,
      environment: env.ARALUME_ENV,
      version: serviceVersion,
      build,
      startedAt: state.startedAt,
      listeningAt: state.listeningAt,
      shutdownAt: state.shutdownAt,
    };
  }

  function snapshotReady(): OperationalReadySnapshot {
    const checks = collectReadinessChecks(env, state, policy, storageRoot, build);
    const ok = checks.every(
      (check) => check.status === "ready" || check.status === "not_applicable",
    );
    const status =
      state.phase === "starting"
        ? "starting"
        : state.phase === "shutting_down"
          ? "shutting_down"
          : ok
            ? "ready"
            : "degraded";
    return {
      ok: state.phase === "ready" && ok,
      status,
      service: serviceName,
      environment: env.ARALUME_ENV,
      version: serviceVersion,
      build,
      checks,
    };
  }

  function snapshotMetrics(): OperationalMetricsSnapshot {
    const averageMs =
      metrics.requestLatencyMs.count === 0
        ? 0
        : metrics.requestLatencyMs.totalMs / metrics.requestLatencyMs.count;
    return {
      totalRequests: metrics.totalRequests,
      activeRequests: metrics.activeRequests,
      statusByClass: { ...metrics.statusByClass },
      errorsByCode: { ...metrics.errorsByCode },
      requestLatencyMs: {
        count: metrics.requestLatencyMs.count,
        minMs: metrics.requestLatencyMs.count === 0 ? 0 : metrics.requestLatencyMs.minMs,
        maxMs: metrics.requestLatencyMs.maxMs,
        averageMs,
      },
      readinessByState: { ...metrics.readinessByState },
      shutdownSignals: { ...metrics.shutdownSignals },
      dependencyFailures: { ...metrics.dependencyFailures },
      ingressRejections: { ...metrics.ingressRejections },
      lastRequestAt: metrics.lastRequestAt,
      lastErrorCode: metrics.lastErrorCode,
    };
  }

  function snapshotHealth(): OperationalHealthSnapshot {
    return {
      ok: isReady(),
      service: serviceName,
      environment: env.ARALUME_ENV,
      version: serviceVersion,
      build,
      phase: state.phase,
      startedAt: state.startedAt,
      listeningAt: state.listeningAt,
      shutdownAt: state.shutdownAt,
      liveness: snapshotLive(),
      readiness: snapshotReady(),
      topology: snapshotTopology(policy),
      metrics: snapshotMetrics(),
    };
  }

  function isReady(): boolean {
    return (
      state.phase === "ready" && snapshotReady().checks.every((check) => check.status !== "failed")
    );
  }

  return {
    environment: env.ARALUME_ENV,
    state,
    policy,
    build,
    storageRoot,
    beginRequest() {
      metrics.activeRequests += 1;
    },
    setListening(host, port) {
      state.phase = "ready";
      state.listeningAt = new Date().toISOString();
      state.listenerHost = host;
      state.listenerPort = port;
      bumpPhase(metrics, "starting", "ready");
    },
    beginShutdown(signal) {
      state.phase = "shutting_down";
      state.shutdownAt = state.shutdownAt ?? new Date().toISOString();
      state.shutdownSignal = signal;
      bumpPhase(metrics, "ready", "shutting_down");
      metrics.shutdownSignals[signal] = (metrics.shutdownSignals[signal] ?? 0) + 1;
    },
    completeShutdown() {
      state.phase = "stopped";
      state.shutdownAt = state.shutdownAt ?? new Date().toISOString();
      bumpPhase(metrics, "shutting_down", "stopped");
    },
    recordRequest(input) {
      metrics.totalRequests += 1;
      metrics.activeRequests = Math.max(0, metrics.activeRequests - 1);
      metrics.lastRequestAt = new Date().toISOString();
      const classKey = statusClass(input.statusCode);
      metrics.statusByClass[classKey] += 1;
      if (input.statusCode >= 400) {
        const code = input.errorCode ?? `${input.statusCode}`;
        metrics.errorsByCode[code] = (metrics.errorsByCode[code] ?? 0) + 1;
        metrics.lastErrorCode = code;
      }
      metrics.requestLatencyMs.count += 1;
      metrics.requestLatencyMs.totalMs += input.durationMs;
      metrics.requestLatencyMs.minMs = Math.min(metrics.requestLatencyMs.minMs, input.durationMs);
      metrics.requestLatencyMs.maxMs = Math.max(metrics.requestLatencyMs.maxMs, input.durationMs);
    },
    recordDependencyFailure(name, message) {
      metrics.dependencyFailures[name] = (metrics.dependencyFailures[name] ?? 0) + 1;
      metrics.lastErrorCode = message;
    },
    recordIngressRejection(code) {
      metrics.ingressRejections[code] = (metrics.ingressRejections[code] ?? 0) + 1;
      metrics.lastErrorCode = code;
    },
    snapshotHealth,
    snapshotLive,
    snapshotReady,
    snapshotMetrics,
    isReady,
  };
}

export function createIngressMiddleware(runtime: OperationalRuntime): RequestHandler {
  const rateLimit = createRateLimiter(runtime.policy.rateLimitPerMinute);
  const strictIngress = runtime.environment === "production" || runtime.environment === "staging";

  return (req, _res, next) => {
    if (!strictIngress) {
      next();
      return;
    }

    const hostHeader = req.hostname?.trim().toLowerCase();
    if (
      runtime.policy.allowedHosts.length > 0 &&
      (!hostHeader || !runtime.policy.allowedHosts.includes(hostHeader))
    ) {
      runtime.recordIngressRejection("HOST_NOT_ALLOWED");
      next(
        new AppError({
          code: "FORBIDDEN",
          status: 403,
          message: "Host header is not allowed.",
        }),
      );
      return;
    }

    const origin = req.get("origin");
    if (origin) {
      const normalizedOrigin = normalizeOrigin(origin);
      if (!runtime.policy.allowedOrigins.includes(normalizedOrigin)) {
        runtime.recordIngressRejection("ORIGIN_NOT_ALLOWED");
        next(
          new AppError({
            code: "FORBIDDEN",
            status: 403,
            message: "Origin is not allowed.",
          }),
        );
        return;
      }
    }

    if (runtime.policy.requireHttps && !req.secure) {
      runtime.recordIngressRejection("HTTPS_REQUIRED");
      next(
        new AppError({
          code: "FORBIDDEN",
          status: 403,
          message: "HTTPS is required.",
        }),
      );
      return;
    }

    const rateLimitError = rateLimit(req);
    if (rateLimitError) {
      runtime.recordIngressRejection("RATE_LIMITED");
      next(rateLimitError);
      return;
    }

    next();
  };
}

export function createOperationalLogEntry(
  req: Request,
  res: Response,
  durationMs: number,
  runtime: OperationalRuntime,
): RequestLogEntry {
  const locals = res.locals as RequestContextLocals;
  const actorId = locals.auditActor?.actorId;
  const channelId = locals.auditChannelId;
  return {
    timestamp: new Date().toISOString(),
    level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
    service: serviceName,
    environment: runtime.environment,
    requestId: locals.requestId,
    actorId,
    channelId,
    route: sanitizeRoute(req),
    method: req.method,
    status: res.statusCode,
    durationMs,
    version: serviceVersion,
    buildId: runtime.build.buildId,
  };
}

export function formatOperationalLogEntry(entry: RequestLogEntry): string {
  return JSON.stringify(entry);
}

export function createOperationalHealthHandler(runtime: OperationalRuntime): RequestHandler {
  return (_req, res) => {
    res.json(runtime.snapshotHealth());
  };
}

export function createOperationalLiveHandler(runtime: OperationalRuntime): RequestHandler {
  return (_req, res) => {
    const payload = runtime.snapshotLive();
    res.status(payload.ok ? 200 : 503).json(payload);
  };
}

export function createOperationalReadyHandler(runtime: OperationalRuntime): RequestHandler {
  return (_req, res) => {
    const payload = runtime.snapshotReady();
    res.status(payload.ok ? 200 : 503).json(payload);
  };
}

export function createOperationalMetricsHandler(runtime: OperationalRuntime): RequestHandler {
  return (_req, res) => {
    res.json({
      service: serviceName,
      environment: runtime.environment,
      version: serviceVersion,
      build: runtime.build,
      readiness: runtime.snapshotReady(),
      live: runtime.snapshotLive(),
      metrics: runtime.snapshotMetrics(),
    });
  };
}

function createPolicy(env: RuntimeEnv): OperationalPolicy {
  const requireHttps = env.ARALUME_ENV === "staging" || env.ARALUME_ENV === "production";
  const trustedProxyHops = env.ARALUME_TRUSTED_PROXY_HOPS ?? (requireHttps ? 1 : 0);
  const allowedHosts = parseDelimitedList(
    env.ARALUME_ALLOWED_HOSTS ?? (requireHttps ? "127.0.0.1,localhost" : ""),
  );
  const allowedOrigins = parseDelimitedList(
    env.ARALUME_ALLOWED_ORIGINS ?? (requireHttps ? "https://127.0.0.1,https://localhost" : ""),
  );

  return {
    requireHttps,
    trustedProxyHops,
    allowedHosts,
    allowedOrigins,
    maxBodyBytes: env.ARALUME_MAX_BODY_BYTES ?? DEFAULT_MAX_BODY_BYTES,
    requestTimeoutMs: env.ARALUME_REQUEST_TIMEOUT_MS ?? DEFAULT_REQUEST_TIMEOUT_MS,
    shutdownTimeoutMs: env.ARALUME_SHUTDOWN_TIMEOUT_MS ?? DEFAULT_SHUTDOWN_TIMEOUT_MS,
    rateLimitPerMinute:
      env.ARALUME_ENV === "production" || env.ARALUME_ENV === "staging"
        ? DEFAULT_RATE_LIMIT_PER_MINUTE
        : Number.POSITIVE_INFINITY,
  };
}

function createBuildIdentity(env: RuntimeEnv): OperationalRuntime["build"] {
  const buildId = env.ARALUME_BUILD_ID?.trim();
  if (buildId) {
    return { version: serviceVersion, buildId, source: "env" };
  }

  const gitSha = resolveGitSha();
  if (gitSha) {
    return { version: serviceVersion, buildId: gitSha, source: "git" };
  }

  return { version: serviceVersion, buildId: serviceVersion, source: "version" };
}

function resolveGitSha(): string | undefined {
  try {
    const value = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return value.trim() || undefined;
  } catch {
    return undefined;
  }
}

function resolveStorageRoot(env: RuntimeEnv): string | undefined {
  if (!env.ARALUME_ASSET_STORAGE_ROOT?.trim()) {
    return undefined;
  }

  return path.resolve(env.ARALUME_ASSET_STORAGE_ROOT);
}

function ensureStorageRoot(storageRoot: string): void {
  try {
    mkdirSync(path.join(storageRoot, ".aralume-state"), { recursive: true });
    accessSync(storageRoot, fsConstants.R_OK | fsConstants.W_OK);
  } catch {
    throw new AppError({
      code: "VALIDATION_ERROR",
      status: 503,
      message: "Storage root is unavailable.",
    });
  }
}

function collectReadinessChecks(
  env: RuntimeEnv,
  state: OperationalState,
  policy: OperationalPolicy,
  storageRoot?: string,
  build?: OperationalRuntime["build"],
): OperationalCheck[] {
  const checks: OperationalCheck[] = [
    {
      name: "configuration",
      status: state.phase === "starting" ? "starting" : "ready",
      message: "Environment loaded and operational configuration parsed.",
    },
    {
      name: "shutdown",
      status: state.phase === "shutting_down" ? "shutting_down" : "ready",
      message:
        state.phase === "shutting_down"
          ? "The runtime is withdrawing readiness."
          : "The runtime is available to receive traffic.",
    },
    {
      name: "build",
      status: state.phase === "ready" ? "ready" : "starting",
      message: "Version and build identity are available.",
      details: build,
    },
    {
      name: "storage",
      status: storageRoot ? probeStorage(storageRoot) : "not_applicable",
      message: storageRoot
        ? "Storage root is accessible."
        : "Storage root is not configured in this environment.",
      details: storageRoot ? { storageRoot } : undefined,
    },
    {
      name: "database",
      status: env.DATABASE_URL ? "ready" : "not_applicable",
      message: env.DATABASE_URL
        ? "DATABASE_URL is syntactically configured."
        : "No relational database is configured in the current runtime.",
    },
    {
      name: "migrations",
      status: env.DATABASE_URL ? "not_applicable" : "not_applicable",
      message: "No runtime migration runner is configured for the current product slice.",
    },
    {
      name: "ingress",
      status: policy.requireHttps ? "ready" : "not_applicable",
      message: policy.requireHttps
        ? "HTTPS, proxy trust, host, and origin policies are enforced."
        : "Ingress restrictions are relaxed for local development and test.",
      details: snapshotTopology(policy),
    },
  ];

  return checks;
}

function probeStorage(storageRoot: string): OperationalCheckStatus {
  try {
    accessSync(storageRoot, fsConstants.R_OK | fsConstants.W_OK);
    accessSync(path.join(storageRoot, ".aralume-state"), fsConstants.R_OK | fsConstants.W_OK);
    return "ready";
  } catch {
    return "failed";
  }
}

function snapshotTopology(policy: OperationalPolicy): OperationalTopologySnapshot {
  return {
    requireHttps: policy.requireHttps,
    trustedProxyHops: policy.trustedProxyHops,
    allowedHosts: [...policy.allowedHosts],
    allowedOrigins: [...policy.allowedOrigins],
    maxBodyBytes: policy.maxBodyBytes,
    requestTimeoutMs: policy.requestTimeoutMs,
    shutdownTimeoutMs: policy.shutdownTimeoutMs,
    rateLimitPerMinute: policy.rateLimitPerMinute,
  };
}

function parseDelimitedList(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ];
}

function sanitizeRoute(req: Request): string {
  return `${req.baseUrl || ""}${req.path}`;
}

function statusClass(statusCode: number): keyof OperationalMetrics["statusByClass"] {
  if (statusCode >= 500) {
    return "5xx";
  }
  if (statusCode >= 400) {
    return "4xx";
  }
  if (statusCode >= 300) {
    return "3xx";
  }
  if (statusCode >= 200) {
    return "2xx";
  }
  return "1xx";
}

function bumpPhase(
  metrics: OperationalMetrics,
  from: OperationalPhase,
  to: OperationalPhase,
): void {
  metrics.readinessByState[from] = Math.max(0, metrics.readinessByState[from] - 1);
  metrics.readinessByState[to] += 1;
}

function createRateLimiter(limitPerMinute: number): (req: Request) => AppError | null {
  if (!Number.isFinite(limitPerMinute)) {
    return () => null;
  }

  const buckets = new Map<string, { windowStart: number; count: number }>();
  const windowMs = 60_000;

  return (req) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || now - bucket.windowStart >= windowMs) {
      buckets.set(key, { windowStart: now, count: 1 });
      return null;
    }

    if (bucket.count >= limitPerMinute) {
      return new AppError({
        code: "RATE_LIMITED",
        status: 429,
        message: "Too many requests.",
      });
    }

    bucket.count += 1;
    return null;
  };
}

function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return value.trim();
  }
}
