import type { AuditFilters, AuditLog, AuditRepository, AuditSeed, ID } from "./audit.types.js";

const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryAuditRepository implements AuditRepository {
  private readonly logs = new Map<ID, AuditLog>();

  constructor(seed?: Partial<AuditSeed>) {
    if (seed) {
      this.replaceAll(seed);
    }
  }

  replaceAll(seed: Partial<AuditSeed>): void {
    this.logs.clear();
    seed.logs?.forEach((log) => this.logs.set(log.id, clone(log)));
  }

  listAuditLogs(filters: AuditFilters = {}): AuditLog[] {
    return Array.from(this.logs.values())
      .filter((log) =>
        Object.entries(filters).every(([key, value]) => {
          if (value === undefined) {
            return true;
          }

          if (key === "from") {
            return log.createdAt >= String(value);
          }

          if (key === "to") {
            return log.createdAt <= String(value);
          }

          return (log as Record<string, unknown>)[key] === value;
        }),
      )
      .sort((left, right) => {
        const dateDiff = right.createdAt.localeCompare(left.createdAt);
        if (dateDiff !== 0) {
          return dateDiff;
        }

        return left.id.localeCompare(right.id);
      })
      .map((log) => clone(log));
  }

  appendAuditLog(log: AuditLog): void {
    this.logs.set(log.id, clone(log));
  }
}

export function createAuditRepository(seed?: Partial<AuditSeed>): AuditRepository {
  return new InMemoryAuditRepository(seed);
}
