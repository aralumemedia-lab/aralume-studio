import type {
  PublicationJob,
  PublicationJobFilters,
  PublicationSeed,
  PublicationTarget,
  PublicationTargetFilters,
} from "./publications.types.js";
import { readJsonFile, resolveStateFilePath, writeJsonFile } from "../shared/persistent-state.js";
import type { ID } from "../audit/audit.types.js";

const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryPublicationsRepository {
  private readonly targets = new Map<ID, PublicationTarget>();
  private readonly jobs = new Map<ID, PublicationJob>();
  private readonly storageFilePath?: string;

  constructor(seed?: Partial<PublicationSeed>, storageRoot?: string) {
    this.storageFilePath = resolveStateFilePath(storageRoot, "publication-state.json");
    const persisted = readJsonFile<PublicationSeed>(this.storageFilePath);

    if (persisted) {
      this.replaceAll(persisted, false);
      return;
    }

    if (seed) {
      this.replaceAll(seed, false);
      this.persist();
    }
  }

  replaceAll(seed: Partial<PublicationSeed>, shouldPersist = true): void {
    this.targets.clear();
    this.jobs.clear();

    seed.publicationTargets?.forEach((target) => this.targets.set(target.id, clone(target)));
    seed.publicationJobs?.forEach((job) => this.jobs.set(job.id, clone(job)));

    if (shouldPersist) {
      this.persist();
    }
  }

  listPublicationTargets(filters: PublicationTargetFilters = {}): PublicationTarget[] {
    return Array.from(this.targets.values())
      .filter((target) =>
        Object.entries(filters).every(([key, value]) => {
          if (value === undefined) {
            return true;
          }

          return (target as Record<string, unknown>)[key] === value;
        }),
      )
      .sort((left, right) => {
        const platformDiff = left.platform.localeCompare(right.platform);
        if (platformDiff !== 0) {
          return platformDiff;
        }

        return left.accountName.localeCompare(right.accountName);
      })
      .map((target) => clone(target));
  }

  getPublicationTarget(id: ID): PublicationTarget | undefined {
    const found = this.targets.get(id);
    return found ? clone(found) : undefined;
  }

  upsertPublicationTarget(target: PublicationTarget): void {
    this.targets.set(target.id, clone(target));
    this.persist();
  }

  listPublicationJobs(filters: PublicationJobFilters = {}): PublicationJob[] {
    return Array.from(this.jobs.values())
      .filter((job) =>
        Object.entries(filters).every(([key, value]) => {
          if (value === undefined) {
            return true;
          }

          return (job as Record<string, unknown>)[key] === value;
        }),
      )
      .sort((left, right) => {
        const dateDiff = right.updatedAt.localeCompare(left.updatedAt);
        if (dateDiff !== 0) {
          return dateDiff;
        }

        return left.id.localeCompare(right.id);
      })
      .map((job) => clone(job));
  }

  getPublicationJob(id: ID): PublicationJob | undefined {
    const found = this.jobs.get(id);
    return found ? clone(found) : undefined;
  }

  findPublicationJobByIdempotencyKey(
    channelId: ID,
    idempotencyKey: string,
  ): PublicationJob | undefined {
    return this.listPublicationJobs({ channelId, idempotencyKey })[0];
  }

  upsertPublicationJob(job: PublicationJob): void {
    this.jobs.set(job.id, clone(job));
    this.persist();
  }

  private persist(): void {
    writeJsonFile(this.storageFilePath, {
      publicationTargets: Array.from(this.targets.values()),
      publicationJobs: Array.from(this.jobs.values()),
    });
  }
}

export function createPublicationsRepository(
  seed?: Partial<PublicationSeed>,
  options?: { storageRoot?: string },
): InMemoryPublicationsRepository {
  return new InMemoryPublicationsRepository(seed, options?.storageRoot);
}
