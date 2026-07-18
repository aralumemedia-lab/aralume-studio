import { randomUUID } from "node:crypto";

import type { AuditFilters, AuditLog, AuditRepository } from "./audit.types.js";

export type AuditClock = () => Date;
export type AuditIdFactory = () => string;

export type CreateAuditServiceOptions = {
  clock?: AuditClock;
  idFactory?: AuditIdFactory;
};

export type AuditService = {
  listAuditLogs(filters?: AuditFilters): AuditLog[];
  recordAuditLog(
    log: Omit<AuditLog, "id" | "createdAt"> & { createdAt?: string; id?: string },
  ): AuditLog;
};

export function createAuditService(
  repository: AuditRepository,
  options: CreateAuditServiceOptions = {},
): AuditService {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? (() => randomUUID());

  return {
    listAuditLogs(filters = {}) {
      return repository.listAuditLogs(filters);
    },

    recordAuditLog(log) {
      const now = log.createdAt ?? clock().toISOString();
      const entry: AuditLog = {
        id: log.id ?? `au_${idFactory()}`,
        channelId: log.channelId,
        requestId: log.requestId,
        actorType: log.actorType,
        actorName: log.actorName,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        status: log.status,
        message: log.message,
        metadata: log.metadata,
        createdAt: now,
      };

      repository.appendAuditLog(entry);
      return entry;
    },
  };
}
