import type {
  RenderJob,
  RenderJobFilters,
  RenderJobsRepository,
  RenderJobsSeed,
} from "./renders.types.js";
import type { ID } from "../channels/channel.types.js";

const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryRenderJobsRepository implements RenderJobsRepository {
  private readonly renderJobs = new Map<ID, RenderJob>();

  constructor(seed?: Partial<RenderJobsSeed>) {
    if (seed) {
      this.replaceAll(seed);
    }
  }

  replaceAll(seed: Partial<RenderJobsSeed>): void {
    this.renderJobs.clear();
    seed.renderJobs?.forEach((job) => this.renderJobs.set(job.id, clone(job)));
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
}

export function createRenderJobsRepository(seed?: Partial<RenderJobsSeed>): RenderJobsRepository {
  return new InMemoryRenderJobsRepository(seed);
}
