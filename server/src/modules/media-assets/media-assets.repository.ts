import type {
  DerivedClip,
  DerivedClipFilters,
  MediaAssetBase,
  MediaAssetFilters,
  MediaAssetsRepository,
  MediaAssetsSeed,
  ID,
  VideoAsset,
  VideoAssetFilters,
} from "./media-assets.types.js";
import { readJsonFile, resolveStateFilePath, writeJsonFile } from "../shared/persistent-state.js";

const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryMediaAssetsRepository implements MediaAssetsRepository {
  private readonly mediaAssets = new Map<ID, MediaAssetBase>();
  private readonly videoAssets = new Map<ID, VideoAsset>();
  private readonly derivedClips = new Map<ID, DerivedClip>();
  private readonly storageFilePath?: string;

  constructor(seed?: Partial<MediaAssetsSeed>, storageRoot?: string) {
    this.storageFilePath = resolveStateFilePath(storageRoot, "media-assets.json");
    const persisted = readJsonFile<MediaAssetsSeed>(this.storageFilePath);

    if (persisted) {
      this.replaceAll(persisted, false);
      return;
    }

    if (seed) {
      this.replaceAll(seed, false);
      this.persist();
    }
  }

  replaceAll(seed: Partial<MediaAssetsSeed>, shouldPersist = true): void {
    this.mediaAssets.clear();
    this.videoAssets.clear();
    this.derivedClips.clear();

    seed.mediaAssets?.forEach((asset) => this.mediaAssets.set(asset.id, clone(asset)));
    seed.videoAssets?.forEach((asset) => this.videoAssets.set(asset.id, clone(asset)));
    seed.derivedClips?.forEach((asset) => this.derivedClips.set(asset.id, clone(asset)));
    if (shouldPersist) {
      this.persist();
    }
  }

  listMediaAssets(filters: Partial<MediaAssetFilters> = {}): MediaAssetBase[] {
    return this.filterItems(Array.from(this.mediaAssets.values()), filters).sort((left, right) => {
      const dateDiff = right.updatedAt.localeCompare(left.updatedAt);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return left.id.localeCompare(right.id);
    });
  }

  getMediaAsset(id: ID): MediaAssetBase | undefined {
    return this.cloneFromMap(this.mediaAssets, id);
  }

  upsertMediaAsset(asset: MediaAssetBase): void {
    this.mediaAssets.set(asset.id, clone(asset));
    this.persist();
  }

  listVideoAssets(filters: Partial<VideoAssetFilters> = {}): VideoAsset[] {
    return this.filterItems(Array.from(this.videoAssets.values()), filters).sort((left, right) => {
      const dateDiff = right.updatedAt.localeCompare(left.updatedAt);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return left.id.localeCompare(right.id);
    });
  }

  getVideoAsset(id: ID): VideoAsset | undefined {
    return this.cloneFromMap(this.videoAssets, id);
  }

  upsertVideoAsset(asset: VideoAsset): void {
    this.videoAssets.set(asset.id, clone(asset));
    this.persist();
  }

  listDerivedClips(filters: Partial<DerivedClipFilters> = {}): DerivedClip[] {
    return this.filterItems(Array.from(this.derivedClips.values()), filters).sort((left, right) => {
      const dateDiff = right.updatedAt.localeCompare(left.updatedAt);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return left.id.localeCompare(right.id);
    });
  }

  getDerivedClip(id: ID): DerivedClip | undefined {
    return this.cloneFromMap(this.derivedClips, id);
  }

  upsertDerivedClip(asset: DerivedClip): void {
    this.derivedClips.set(asset.id, clone(asset));
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

          if (key === "search") {
            const term = String(value).trim().toLowerCase();
            if (!term) {
              return true;
            }

            return Object.values(item).some((entry) =>
              typeof entry === "string" ? entry.toLowerCase().includes(term) : false,
            );
          }

          return item[key] === value;
        }),
      )
      .map((item) => clone(item));
  }

  private persist(): void {
    writeJsonFile(this.storageFilePath, {
      mediaAssets: Array.from(this.mediaAssets.values()),
      videoAssets: Array.from(this.videoAssets.values()),
      derivedClips: Array.from(this.derivedClips.values()),
    });
  }
}

export function createMediaAssetsRepository(
  seed?: Partial<MediaAssetsSeed>,
  options?: { storageRoot?: string },
): MediaAssetsRepository {
  return new InMemoryMediaAssetsRepository(seed, options?.storageRoot);
}
