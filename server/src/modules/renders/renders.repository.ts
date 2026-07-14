import type {
  RenderJob,
  RenderJobFilters,
  RenderJobsRepository,
  RenderJobsSeed,
} from "./renders.types.js";
import type { ID } from "../channels/channel.types.js";
import { readJsonFile, resolveStateFilePath, writeJsonFile } from "../shared/persistent-state.js";

const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryRenderJobsRepository implements RenderJobsRepository {
  private readonly renderJobs = new Map<ID, RenderJob>();
  private readonly storageFilePath?: string;

  constructor(seed?: Partial<RenderJobsSeed>, storageRoot?: string) {
    this.storageFilePath = resolveStateFilePath(storageRoot, "render-jobs.json");
    const persisted = readJsonFile<RenderJobsSeed>(this.storageFilePath);

    if (persisted) {
      this.replaceAll(persisted, false);
      return;
    }

    if (seed) {
      this.replaceAll(seed, false);
      this.persist();
    }
  }

  replaceAll(seed: Partial<RenderJobsSeed>, shouldPersist = true): void {
    this.renderJobs.clear();
    seed.renderJobs?.forEach((job) => this.renderJobs.set(job.id, clone(job)));
    if (shouldPersist) {
      this.persist();
    }
  }

  listRenderJobs(filters: Partial<RenderJobFilters> = {}): RenderJob[] {
    return this.filterItems(Array.from(this.renderJobs.values()), filters).sort((left, right) => {
      const updatedDiff = right.updatedAt.localeCompare(left.updatedAt);
      if (updatedDiff !== 0) {
        return updatedDiff;
      }

      return left.id.localeCompare(right.id);
    });
  }

  getRenderJob(id: ID): RenderJob | undefined {
    return this.cloneFromMap(this.renderJobs, id);
  }

  findRenderJobByIdempotencyKey(channelId: ID, idempotencyKey: string): RenderJob | undefined {
    const match = Array.from(this.renderJobs.values()).find(
      (job) => job.channelId === channelId && job.idempotencyKey === idempotencyKey,
    );
    return match ? clone(match) : undefined;
  }

  upsertRenderJob(job: RenderJob): void {
    this.renderJobs.set(job.id, clone(job));
    this.persist();
  }

  private cloneFromMap<T>(map: Map<ID, T>, id: ID): T | undefined {
    const found = map.get(id);
    return found ? clone(found) : undefined;
  }

  private filterItems<T extends Record<string, unknown>>(
    items: T[],
    filters: Record<string, unknown>,
  ): T[] {
    return items
      .filter((item) =>
        Object.entries(filters).every(([key, value]) => {
          if (value === undefined) {
            return true;
          }

          return item[key] === value;
        }),
      )
      .map((item) => clone(item));
  }

  private persist(): void {
    writeJsonFile(this.storageFilePath, {
      renderJobs: Array.from(this.renderJobs.values()),
    });
  }
}

export function createRenderJobsRepository(
  seed?: Partial<RenderJobsSeed>,
  options?: { storageRoot?: string },
): RenderJobsRepository {
  return new InMemoryRenderJobsRepository(seed, options?.storageRoot);
}
