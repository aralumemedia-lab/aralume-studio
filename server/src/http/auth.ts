import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Request, RequestHandler } from "express";
import { z } from "zod";

import { AppError } from "./errors.js";
import type { RuntimeEnv } from "../env.js";
import type { AuditRepository } from "../modules/audit/audit.types.js";

export const authRoleValues = ["owner", "editor", "operator", "reviewer", "viewer"] as const;

export type AuthRole = (typeof authRoleValues)[number];

export type AuthPermission =
  | "channels.read"
  | "channels.write"
  | "editorial.read"
  | "editorial.write"
  | "media.read"
  | "media.write"
  | "governance.read"
  | "governance.write"
  | "publication.read"
  | "publication.write"
  | "operations.read"
  | "operations.write"
  | "audit.read";

export type AuthPrincipal = {
  sub: string;
  role: AuthRole;
  channelIds: string[];
  exp?: number;
};

type AuthTokenPayload = AuthPrincipal;

type AuthOptions = {
  env: RuntimeEnv;
  auditRepository: AuditRepository;
  allowTestBypass?: boolean;
};

const tokenPayloadSchema = z
  .object({
    sub: z.string().trim().min(1).max(160),
    role: z.enum(authRoleValues),
    channelIds: z.array(z.string().trim().min(1).max(160)).min(1).max(200),
    exp: z.number().int().positive().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (new Set(value.channelIds).size !== value.channelIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["channelIds"],
        message: "Channel scope must be unique",
      });
    }

    if (value.channelIds.includes("*") && value.role !== "owner") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["channelIds"],
        message: "Wildcard channel scope requires owner role",
      });
    }
  });

const permissionMatrix: Record<AuthRole, readonly AuthPermission[]> = {
  owner: [
    "channels.read",
    "channels.write",
    "editorial.read",
    "editorial.write",
    "media.read",
    "media.write",
    "governance.read",
    "governance.write",
    "publication.read",
    "publication.write",
    "operations.read",
    "operations.write",
    "audit.read",
  ],
  editor: [
    "channels.read",
    "editorial.read",
    "editorial.write",
    "media.read",
    "media.write",
    "operations.read",
  ],
  operator: ["channels.read", "editorial.read", "media.read", "media.write", "operations.read"],
  reviewer: [
    "channels.read",
    "editorial.read",
    "media.read",
    "governance.read",
    "governance.write",
    "publication.read",
    "publication.write",
    "operations.read",
    "audit.read",
  ],
  viewer: ["channels.read", "editorial.read", "media.read", "operations.read"],
};

export function issueAuthToken(principal: AuthPrincipal, secret: string): string {
  const parsed = tokenPayloadSchema.parse(principal);
  const payload = encodeBase64Url(JSON.stringify(parsed));
  return `${payload}.${sign(payload, secret)}`;
}

export function createAuthenticationMiddleware(options: AuthOptions): RequestHandler {
  const testBypass = options.allowTestBypass === true && options.env.ARALUME_ENV !== "production";
  const secret = options.env.ARALUME_AUTH_SIGNING_SECRET;

  return (req, res, next) => {
    try {
      const principal = testBypass
        ? testPrincipal()
        : parseBearerPrincipal(req.header("authorization"), secret);
      req.auth = principal;
      applyTrustedActor(req, principal);
      next();
    } catch (error) {
      recordAuthDecision(options.auditRepository, req, res, undefined, "failed", "authentication");
      next(error);
    }
  };
}

export function createAuthorizationMiddleware(auditRepository: AuditRepository): RequestHandler {
  return (req, res, next) => {
    try {
      const principal = req.auth as AuthPrincipal | undefined;
      if (!principal) {
        throw unauthorized();
      }

      applyTrustedActor(req, principal);

      const permission = permissionForRequest(req);
      if (!permissionMatrix[principal.role].includes(permission)) {
        throw forbidden();
      }

      const requestedChannel = extractRequestedChannel(req);
      if (!requestedChannel && requiresChannelContext(req) && !principal.channelIds.includes("*")) {
        throw forbidden();
      }

      if (requestedChannel && !hasChannelAccess(principal, requestedChannel)) {
        throw forbidden();
      }

      if (hasConflictingChannelContext(req)) {
        throw forbidden();
      }

      if (isMutatingRequest(req)) {
        recordAuthDecision(auditRepository, req, res, principal, "success", permission);
      }
      next();
    } catch (error) {
      const principal = req.auth;
      recordAuthDecision(
        auditRepository,
        req,
        res,
        principal,
        "failed",
        error instanceof AppError && error.code === "FORBIDDEN" ? "authorization" : "channel_scope",
      );
      next(error);
    }
  };
}

export function hasPermission(role: AuthRole, permission: AuthPermission): boolean {
  return permissionMatrix[role].includes(permission);
}

function parseBearerPrincipal(
  value: string | undefined,
  secret: string | undefined,
): AuthPrincipal {
  if (!secret || !value?.startsWith("Bearer ")) {
    throw unauthorized();
  }

  const token = value.slice("Bearer ".length).trim();
  const separator = token.lastIndexOf(".");
  if (separator <= 0 || separator === token.length - 1 || token.length > 4096) {
    throw unauthorized();
  }

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(payload, secret);
  const receivedBytes = Buffer.from(signature, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  if (
    receivedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(receivedBytes, expectedBytes)
  ) {
    throw unauthorized();
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw unauthorized();
  }

  const parsed = tokenPayloadSchema.safeParse(decoded);
  if (!parsed.success || (parsed.data.exp !== undefined && parsed.data.exp <= nowInSeconds())) {
    throw unauthorized();
  }

  return parsed.data;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("base64url");
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function testPrincipal(): AuthPrincipal {
  return {
    sub: "test-harness",
    role: "owner",
    channelIds: ["*"],
  };
}

function applyTrustedActor(req: Request, principal: AuthPrincipal): void {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "requestedBy")) {
    req.body = { ...(req.body as Record<string, unknown>), requestedBy: principal.sub };
  }
}

function permissionForRequest(req: Request): AuthPermission {
  const path = req.path;
  const write = isMutatingRequest(req);

  if (path === "/channels" || path.startsWith("/channels/")) {
    return write ? "channels.write" : "channels.read";
  }
  if (
    path.startsWith("/content-ideas") ||
    path.startsWith("/production-items") ||
    path.startsWith("/research-sessions") ||
    path.startsWith("/scripts") ||
    path.startsWith("/visual-plans")
  ) {
    return write ? "editorial.write" : "editorial.read";
  }
  if (path.startsWith("/media-assets") || path.startsWith("/videos") || path.startsWith("/clips")) {
    return write ? "media.write" : "media.read";
  }
  if (path.startsWith("/renders")) {
    return write ? "media.write" : "media.read";
  }
  if (path.startsWith("/audit-logs")) {
    return "audit.read";
  }
  if (
    path.startsWith("/governance") ||
    path.startsWith("/quality") ||
    path.startsWith("/compliance") ||
    path.startsWith("/approvals")
  ) {
    return write ? "governance.write" : "governance.read";
  }
  if (path.startsWith("/publications") || path.startsWith("/integrations/youtube")) {
    return write ? "publication.write" : "publication.read";
  }
  return write ? "operations.write" : "operations.read";
}

function extractRequestedChannel(req: Request): string | undefined {
  const queryChannel = readContextValue(req.query);
  const bodyChannel = readContextValue(req.body);
  const paramChannel = readContextValue(req.params);
  if (queryChannel) {
    return queryChannel;
  }
  if (bodyChannel) {
    return bodyChannel;
  }
  if (req.path.startsWith("/channels/") && paramChannel) {
    return paramChannel;
  }
  return undefined;
}

function requiresChannelContext(req: Request): boolean {
  if (req.path === "/channels" && (req.method === "GET" || req.method === "POST")) {
    return false;
  }

  return true;
}

function hasConflictingChannelContext(req: Request): boolean {
  const values = [readContextValue(req.query), readContextValue(req.body)].filter(
    (value): value is string => Boolean(value),
  );
  return new Set(values).size > 1;
}

function readContextValue(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const candidate = (value as Record<string, unknown>).channelId;
  if (Array.isArray(candidate)) {
    return typeof candidate[0] === "string" ? candidate[0].trim() : undefined;
  }
  return typeof candidate === "string" ? candidate.trim() : undefined;
}

function hasChannelAccess(principal: AuthPrincipal, channelId: string): boolean {
  return principal.channelIds.includes("*") || principal.channelIds.includes(channelId);
}

function isMutatingRequest(req: Request): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(req.method.toUpperCase());
}

function recordAuthDecision(
  repository: AuditRepository,
  req: Request,
  res: { locals: Record<string, unknown> },
  principal: AuthPrincipal | undefined,
  status: "success" | "failed",
  reason: string,
): void {
  repository.appendAuditLog({
    id: `au_auth_${randomUUID()}`,
    requestId: typeof res.locals.requestId === "string" ? res.locals.requestId : undefined,
    channelId: extractRequestedChannel(req),
    actorType: principal ? "user" : "system",
    actorName: principal?.sub ?? "anonymous",
    action: status === "success" ? "auth.request_authorized" : "auth.request_rejected",
    entityType: "HttpRequest",
    entityId: `${req.method}:${req.path}`,
    status,
    message: status === "success" ? "Authorized request." : "Request rejected by security policy.",
    metadata: {
      role: principal?.role,
      decision: reason,
    },
    createdAt: new Date().toISOString(),
  });
}

function unauthorized(): AppError {
  return new AppError({
    code: "UNAUTHORIZED",
    status: 401,
    message: "Authentication is required.",
  });
}

function forbidden(): AppError {
  return new AppError({
    code: "FORBIDDEN",
    status: 403,
    message: "You are not allowed to access this resource.",
  });
}

function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
