import { z } from "zod";

import type { AuditActorType, AuditStatus } from "./audit.types.js";

export const auditActorTypeValues = [
  "user",
  "agent",
  "system",
] as const satisfies readonly AuditActorType[];
export const auditStatusValues = [
  "success",
  "warning",
  "failed",
] as const satisfies readonly AuditStatus[];

export const auditActorTypeSchema = z.enum(auditActorTypeValues);
export const auditStatusSchema = z.enum(auditStatusValues);

export const auditLogListQuerySchema = z
  .object({
    channelId: z.string().trim().min(1).optional(),
    actorType: auditActorTypeSchema.optional(),
    status: auditStatusSchema.optional(),
    action: z.string().trim().min(1).optional(),
    entityType: z.string().trim().min(1).optional(),
    entityId: z.string().trim().min(1).optional(),
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional(),
  })
  .strict();

export function formatValidationIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    code: issue.code,
    message: issue.message,
  }));
}
