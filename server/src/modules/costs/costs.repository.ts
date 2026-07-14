import type {
  CostEntry,
  CostEntryFilters,
  CostSeed,
  CostsRepository,
  ID,
  OperationalModePolicy,
} from "./costs.types.js";
import { readJsonFile, resolveStateFilePath, writeJsonFile } from "../shared/persistent-state.js";

const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryCostsRepository implements CostsRepository {
  private readonly costEntries = new Map<ID, CostEntry>();
  private readonly operationalModePolicies = new Map<string, OperationalModePolicy>();
  private readonly storageFilePath?: string;

  constructor(seed?: Partial<CostSeed>, storageRoot?: string) {
    this.storageFilePath = resolveStateFilePath(storageRoot, "costs.json");
    const persisted = readJsonFile<CostSeed>(this.storageFilePath);

    if (persisted) {
      this.replaceAll(persisted, false);
      return;
    }

    if (seed) {
      this.replaceAll(seed, false);
      this.persist();
    }
  }

  replaceAll(seed: Partial<CostSeed>, shouldPersist = true): void {
    this.costEntries.clear();
    this.operationalModePolicies.clear();

    seed.costEntries?.forEach((entry) => this.costEntries.set(entry.id, clone(entry)));
    seed.operationalModePolicies?.forEach((policy) =>
      this.operationalModePolicies.set(policyKey(policy.scope, policy.channelId), clone(policy)),
    );
    if (shouldPersist) {
      this.persist();
    }
  }

  listCostEntries(filters: CostEntryFilters = {}): CostEntry[] {
    return Array.from(this.costEntries.values())
      .filter((entry) =>
        Object.entries(filters).every(([key, value]) => {
          if (value === undefined) {
            return true;
          }

          if (key === "from") {
            return entry.createdAt >= String(value);
          }

          if (key === "to") {
            return entry.createdAt <= String(value);
          }

          return (entry as Record<string, unknown>)[key] === value;
        }),
      )
      .sort((left, right) => {
        const dateDiff = right.createdAt.localeCompare(left.createdAt);
        if (dateDiff !== 0) {
          return dateDiff;
        }

        return left.id.localeCompare(right.id);
      })
      .map((entry) => clone(entry));
  }

  getCostEntry(id: ID): CostEntry | undefined {
    const found = this.costEntries.get(id);
    return found ? clone(found) : undefined;
  }

  upsertCostEntry(entry: CostEntry): void {
    this.costEntries.set(entry.id, clone(entry));
    this.persist();
  }

  listOperationalModePolicies(): OperationalModePolicy[] {
    return Array.from(this.operationalModePolicies.values())
      .sort((left, right) => {
        if (left.scope !== right.scope) {
          return left.scope === "global" ? -1 : 1;
        }

        const channelDiff = (left.channelId ?? "").localeCompare(right.channelId ?? "");
        if (channelDiff !== 0) {
          return channelDiff;
        }

        return left.id.localeCompare(right.id);
      })
      .map((policy) => clone(policy));
  }

  getGlobalOperationalModePolicy(): OperationalModePolicy | undefined {
    return this.clonePolicy(this.operationalModePolicies.get(policyKey("global")));
  }

  getChannelOperationalModePolicy(channelId: ID): OperationalModePolicy | undefined {
    return this.clonePolicy(this.operationalModePolicies.get(policyKey("channel", channelId)));
  }

  upsertOperationalModePolicy(policy: OperationalModePolicy): void {
    this.operationalModePolicies.set(policyKey(policy.scope, policy.channelId), clone(policy));
    this.persist();
  }

  private clonePolicy(
    policy: OperationalModePolicy | undefined,
  ): OperationalModePolicy | undefined {
    return policy ? clone(policy) : undefined;
  }

  private persist(): void {
    writeJsonFile(this.storageFilePath, {
      costEntries: Array.from(this.costEntries.values()),
      operationalModePolicies: Array.from(this.operationalModePolicies.values()),
    });
  }
}

export function createCostsRepository(
  seed?: Partial<CostSeed>,
  options?: { storageRoot?: string },
): CostsRepository {
  return new InMemoryCostsRepository(seed, options?.storageRoot);
}

function policyKey(scope: "global" | "channel", channelId?: ID): string {
  return scope === "global" ? "global" : `channel:${channelId ?? "missing"}`;
}
