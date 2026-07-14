import type { AuditFilters, AuditLog, AuditRepository, AuditSeed, ID } from "./audit.types.js";
import { readJsonFile, resolveStateFilePath, writeJsonFile } from "../shared/persistent-state.js";

const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryAuditRepository implements AuditRepository {
  private readonly logs = new Map<ID, AuditLog>();
  private readonly storageFilePath?: string;

  constructor(seed?: Partial<AuditSeed>, storageRoot?: string) {
    this.storageFilePath = resolveStateFilePath(storageRoot, "audit-logs.json");
    const persisted = readJsonFile<AuditSeed>(this.storageFilePath);

    if (persisted) {
      this.replaceAll(persisted, false);
      return;
    }

    if (seed) {
      this.replaceAll(seed, false);
      this.persist();
    }
  }

  replaceAll(seed: Partial<AuditSeed>, shouldPersist = true): void {
    this.logs.clear();
    seed.logs?.forEach((log) => this.logs.set(log.id, clone(log)));
    if (shouldPersist) {
      this.persist();
    }
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
    this.persist();
  }

  private persist(): void {
    writeJsonFile(this.storageFilePath, {
      logs: Array.from(this.logs.values()),
    });
  }
}

export function createAuditRepository(
  seed?: Partial<AuditSeed>,
  options?: { storageRoot?: string },
): AuditRepository {
  return new InMemoryAuditRepository(seed, options?.storageRoot);
}
