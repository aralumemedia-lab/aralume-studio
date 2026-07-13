import type {
  Channel,
  ChannelBundle,
  ChannelSettings,
  ChannelsRepository,
  ID,
} from "./channel.types.js";

const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryChannelsRepository implements ChannelsRepository {
  private readonly channels = new Map<ID, ChannelBundle>();

  constructor(initialBundles: ChannelBundle[] = []) {
    this.replaceAll(initialBundles);
  }

  listChannels(): Channel[] {
    return Array.from(this.channels.values(), (bundle) => clone(bundle.channel));
  }

  getChannel(id: ID): Channel | undefined {
    const bundle = this.channels.get(id);
    return bundle ? clone(bundle.channel) : undefined;
  }

  getChannelSettings(id: ID): ChannelSettings | undefined {
    const bundle = this.channels.get(id);
    return bundle ? clone(bundle.settings) : undefined;
  }

  getChannelBySlug(slug: string, excludeId?: ID): Channel | undefined {
    const normalizedSlug = slug.trim().toLowerCase();

    for (const bundle of this.channels.values()) {
      if (bundle.channel.slug !== normalizedSlug) {
        continue;
      }

      if (excludeId && bundle.channel.id === excludeId) {
        continue;
      }

      return clone(bundle.channel);
    }

    return undefined;
  }

  upsertChannel(bundle: ChannelBundle): void {
    this.channels.set(bundle.channel.id, clone(bundle));
  }

  replaceAll(bundles: ChannelBundle[]): void {
    this.channels.clear();
    for (const bundle of bundles) {
      this.channels.set(bundle.channel.id, clone(bundle));
    }
  }
}

export function createChannelsRepository(initialBundles?: ChannelBundle[]): ChannelsRepository {
  return new InMemoryChannelsRepository(initialBundles);
}
