import { randomUUID } from "node:crypto";

import { AppError } from "../../http/errors.js";
import { channelStatusSchema, timezoneSchema, slugSchema } from "./channel.schema.js";
import type {
  Channel,
  ChannelBundle,
  ChannelSettings,
  ChannelsRepository,
  CreateChannelInput,
  ID,
  UpdateChannelInput,
  RiskLevel,
  CostStatus,
} from "./channel.types.js";

export type ChannelsClock = () => Date;
export type ChannelIdFactory = () => string;

export type CreateChannelsServiceOptions = {
  clock?: ChannelsClock;
  idFactory?: ChannelIdFactory;
};

export type ChannelsService = {
  listChannels(): Channel[];
  createChannel(input: CreateChannelInput): Channel;
  getChannel(id: ID): Channel;
  updateChannel(id: ID, input: UpdateChannelInput): Channel;
  getChannelSettings(id: ID): ChannelSettings;
};

export function createChannelsService(
  repository: ChannelsRepository,
  options: CreateChannelsServiceOptions = {},
): ChannelsService {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? (() => randomUUID());

  return {
    listChannels() {
      return repository.listChannels();
    },

    createChannel(input) {
      const parsedInput = normalizeCreateInput(input);
      assertSlugAvailable(repository, parsedInput.slug);

      const now = toIso(clock());
      const id = `ch_${idFactory()}`;
      const bundle = buildChannelBundle(id, parsedInput, now);
      repository.upsertChannel(bundle);

      return bundle.channel;
    },

    getChannel(id) {
      const found = repository.getChannel(id);
      if (!found) {
        throw new AppError({
          code: "NOT_FOUND",
          status: 404,
          message: "Channel not found",
          details: { id },
        });
      }

      return found;
    },

    updateChannel(id, input) {
      const existing = getChannelOrThrow(repository, id);
      const parsedInput = normalizeUpdateInput(input);

      if (parsedInput.slug !== undefined) {
        assertSlugAvailable(repository, parsedInput.slug, id);
      }

      const now = toIso(clock());
      const nextStatus = parsedInput.status ?? existing.status;
      const nextChannel: Channel = {
        ...existing,
        ...parsedInput,
        slug: parsedInput.slug ?? existing.slug,
        status: nextStatus,
        costStatus: costStatusFromStatus(nextStatus),
        riskLevel: parsedInput.status
          ? riskLevelFromStatus(parsedInput.status)
          : existing.riskLevel,
        updatedAt: now,
        lastActivityAt: now,
      };

      repository.upsertChannel({
        channel: nextChannel,
        settings: repository.getChannelSettings(id) ?? buildDefaultSettings(id, now),
      });

      return nextChannel;
    },

    getChannelSettings(id) {
      const settings = repository.getChannelSettings(id);
      if (!settings) {
        throw new AppError({
          code: "NOT_FOUND",
          status: 404,
          message: "Channel settings not found",
          details: { id },
        });
      }

      return settings;
    },
  };
}

function normalizeCreateInput(input: CreateChannelInput): CreateChannelInput {
  const slug = slugSchema.parse(input.slug);
  const timezone = timezoneSchema.parse(input.timezone);
  const status = channelStatusSchema.parse(input.status);

  return {
    name: input.name.trim(),
    slug,
    status,
    timezone,
    language: input.language.trim(),
  };
}

function normalizeUpdateInput(input: UpdateChannelInput): UpdateChannelInput {
  const output: UpdateChannelInput = {};

  if (input.name !== undefined) {
    output.name = input.name.trim();
  }

  if (input.slug !== undefined) {
    output.slug = slugSchema.parse(input.slug);
  }

  if (input.status !== undefined) {
    output.status = channelStatusSchema.parse(input.status);
  }

  if (input.timezone !== undefined) {
    output.timezone = timezoneSchema.parse(input.timezone);
  }

  if (input.language !== undefined) {
    output.language = input.language.trim();
  }

  return output;
}

function assertSlugAvailable(repository: ChannelsRepository, slug: string, excludeId?: ID): void {
  const existing = repository.getChannelBySlug(slug, excludeId);
  if (existing) {
    throw new AppError({
      code: "CONFLICT",
      status: 409,
      message: "Channel slug already exists",
      details: { slug },
    });
  }
}

function getChannelOrThrow(repository: ChannelsRepository, id: ID): Channel {
  const found = repository.getChannel(id);
  if (!found) {
    throw new AppError({
      code: "NOT_FOUND",
      status: 404,
      message: "Channel not found",
      details: { id },
    });
  }

  return found;
}

function buildChannelBundle(id: ID, input: CreateChannelInput, now: string): ChannelBundle {
  return {
    channel: {
      id,
      name: input.name,
      slug: input.slug,
      description: "",
      status: input.status,
      niche: "",
      audience: "",
      language: input.language,
      region: "",
      timezone: input.timezone,
      editorialTone: "",
      publishingFrequency: "A configurar",
      monthlyBudgetCents: 0,
      monthlyCostUsedCents: 0,
      costStatus: costStatusFromStatus(input.status),
      riskLevel: riskLevelFromStatus(input.status),
      healthScore: 0,
      activeWorkflowsCount: 0,
      pendingApprovalsCount: 0,
      connectedPlatformsCount: 0,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    },
    settings: buildDefaultSettings(id, now),
  };
}

function buildDefaultSettings(id: ID, now: string): ChannelSettings {
  return {
    id: `cs_${id}`,
    channelId: id,
    averageVideoDurationSeconds: 600,
    allowedFormats: ["horizontal", "vertical", "square"],
    allowedSubniches: [],
    blockedThemes: [],
    preferredSources: [],
    visualIdentity: {
      primaryColor: "#1B3A5C",
      secondaryColor: "#E8D9B4",
      typography: "Inter",
      subtitleStyle: "A configurar",
      openingStyle: "A configurar",
      thumbnailStyle: "A configurar",
    },
    narration: {
      voiceName: "A configurar",
      voiceProvider: "A configurar",
      speed: 1,
      tone: "A configurar",
      pronunciationNotes: [],
    },
    createdAt: now,
    updatedAt: now,
  };
}

function costStatusFromStatus(status: Channel["status"]): CostStatus {
  if (status === "blocked" || status === "archived" || status === "draft" || status === "paused") {
    return "not_configured";
  }

  if (status === "warning") {
    return "attention";
  }

  return "healthy";
}

function riskLevelFromStatus(status: Channel["status"]): RiskLevel {
  if (status === "blocked") {
    return "blocked";
  }

  if (status === "warning") {
    return "warning";
  }

  if (status === "draft" || status === "paused") {
    return "attention";
  }

  return "ok";
}

function toIso(date: Date): string {
  return date.toISOString();
}
