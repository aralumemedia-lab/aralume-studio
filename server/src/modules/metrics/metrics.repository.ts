import { readJsonFile, resolveStateFilePath, writeJsonFile } from "../shared/persistent-state.js";
import type {
  ID,
  MetricFilters,
  MetricsRepository,
  MetricsSeed,
  PerformanceMetric,
} from "./metrics.types.js";

const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryMetricsRepository implements MetricsRepository {
  private readonly metrics = new Map<ID, PerformanceMetric>();
  private readonly storageFilePath?: string;

  constructor(seed?: Partial<MetricsSeed>, storageRoot?: string) {
    this.storageFilePath = resolveStateFilePath(storageRoot, "metrics.json");
    const persisted = readJsonFile<MetricsSeed>(this.storageFilePath);
    if (persisted) {
      this.replaceAll(persisted, false);
    } else if (seed) {
      this.replaceAll(seed, false);
      this.persist();
    }
  }

  replaceAll(seed: Partial<MetricsSeed>, shouldPersist = true): void {
    this.metrics.clear();
    seed.metrics?.forEach((metric) => this.metrics.set(metric.id, clone(metric)));
    if (shouldPersist) this.persist();
  }

  listMetrics(
    filters: Omit<MetricFilters, "page" | "pageSize"> = { channelId: "" },
  ): PerformanceMetric[] {
    return Array.from(this.metrics.values())
      .filter((metric) =>
        Object.entries(filters).every(([key, value]) => {
          if (value === undefined) return true;
          if (key === "from") return metric.periodEnd >= String(value);
          if (key === "to") return metric.periodStart <= String(value);
          return (metric as Record<string, unknown>)[key] === value;
        }),
      )
      .sort(
        (left, right) =>
          right.capturedAt.localeCompare(left.capturedAt) || left.id.localeCompare(right.id),
      )
      .map(clone);
  }

  getMetric(id: ID): PerformanceMetric | undefined {
    const found = this.metrics.get(id);
    return found ? clone(found) : undefined;
  }

  findByIdempotency(channelId: ID, idempotencyKey: string): PerformanceMetric | undefined {
    const found = Array.from(this.metrics.values()).find(
      (metric) => metric.channelId === channelId && metric.idempotencyKey === idempotencyKey,
    );
    return found ? clone(found) : undefined;
  }

  insertMetric(metric: PerformanceMetric): void {
    this.metrics.set(metric.id, clone(metric));
    this.persist();
  }

  private persist(): void {
    writeJsonFile(this.storageFilePath, { metrics: Array.from(this.metrics.values()) });
  }
}

export function createMetricsRepository(
  seed?: Partial<MetricsSeed>,
  options?: { storageRoot?: string },
): MetricsRepository {
  return new InMemoryMetricsRepository(seed, options?.storageRoot);
}
