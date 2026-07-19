export type ID = string;
export type ISODate = string;

export type AuditActorType = "user" | "agent" | "system";
export type AuditStatus = "success" | "warning" | "failed";

export type AuditActorContext = {
  actorId: string;
  actorName: string;
  role: string;
};

export type AuditLog = {
  id: ID;
  channelId?: ID;
  requestId?: string;
  actorType: AuditActorType;
  actorName: string;
  action: string;
  entityType: string;
  entityId: ID;
  status: AuditStatus;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: ISODate;
};

export type AuditFilters = {
  channelId?: ID;
  actorType?: AuditActorType;
  status?: AuditStatus;
  action?: string;
  entityType?: string;
  entityId?: ID;
  from?: ISODate;
  to?: ISODate;
};

export type AuditSeed = {
  logs: AuditLog[];
};

export type AuditRepository = {
  replaceAll(seed: Partial<AuditSeed>): void;
  listAuditLogs(filters?: AuditFilters): AuditLog[];
  appendAuditLog(log: AuditLog): void;
};
