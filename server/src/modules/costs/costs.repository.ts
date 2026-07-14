import type {
  CostEntry,
  CostEntryFilters,
  CostSeed,
  CostsRepository,
  ID,
  OperationalModePolicy,
} from "./costs.types.js";

const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryCostsRepository implements CostsRepository {
  private readonly costEntries = new Map<ID, CostEntry>();
  private readonly operationalModePolicies = new Map<string, OperationalModePolicy>();

  constructor(seed?: Partial<CostSeed>) {
    if (seed) {
      this.replaceAll(seed);
    }
  }

  replaceAll(seed: Partial<CostSeed>): void {
    this.costEntries.clear();
    this.operationalModePolicies.clear();

    seed.costEntries?.forEach((entry) => this.costEntries.set(entry.id, clone(entry)));
    seed.operationalModePolicies?.forEach((policy) =>
      this.operationalModePolicies.set(policyKey(policy.scope, policy.channelId), clone(policy)),
    );
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
  }

  private clonePolicy(
    policy: OperationalModePolicy | undefined,
  ): OperationalModePolicy | undefined {
    return policy ? clone(policy) : undefined;
  }
}

export function createCostsRepository(seed?: Partial<CostSeed>): CostsRepository {
  return new InMemoryCostsRepository(seed);
}

function policyKey(scope: "global" | "channel", channelId?: ID): string {
  return scope === "global" ? "global" : `channel:${channelId ?? "missing"}`;
}
