import { randomUUID } from "node:crypto";

import { AppError } from "../../http/errors.js";
import type { AuditService } from "../audit/audit.service.js";
import { channelStatusSchema, timezoneSchema, slugSchema } from "./channel.schema.js";
import type {
  Channel,
  ChannelBundle,
  ChannelSettings,
  ChannelsRepository,
  CreateChannelInput,
  ID,
  EditorialRules,
  UpdateChannelInput,
  RiskLevel,
  CostStatus,
} from "./channel.types.js";

export type ChannelsClock = () => Date;
export type ChannelIdFactory = () => string;

export type CreateChannelsServiceOptions = {
  clock?: ChannelsClock;
  idFactory?: ChannelIdFactory;
  auditService?: AuditService;
};

export type ChannelProfileUpdateInput = {
  requestedBy?: string;
  editorialTone?: string;
  language?: string;
  audience?: string;
  allowedFormats?: string[];
  editorialRules?: Partial<EditorialRules>;
};

export type ChannelsService = {
  listChannels(): Channel[];
  createChannel(input: CreateChannelInput): Channel;
  getChannel(id: ID): Channel;
  getChannelProfile(id: ID): ChannelBundle;
  updateChannel(id: ID, input: UpdateChannelInput): Channel;
  getChannelSettings(id: ID): ChannelSettings;
  updateChannelProfile(id: ID, input: ChannelProfileUpdateInput, requestId?: string): ChannelBundle;
};

export function createChannelsService(
  repository: ChannelsRepository,
  options: CreateChannelsServiceOptions = {},
): ChannelsService {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? (() => randomUUID());
  const auditService = options.auditService;

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

    getChannelProfile(id) {
      const bundle = repository.getChannelBundle(id);
      if (!bundle) {
        throw new AppError({
          code: "NOT_FOUND",
          status: 404,
          message: "Channel profile not found",
          details: { id },
        });
      }

      return {
        ...bundle,
        editorialRules:
          bundle.editorialRules ?? buildDefaultEditorialRules(id, bundle.channel.createdAt),
      };
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
        editorialRules:
          repository.getChannelBundle(id)?.editorialRules ?? buildDefaultEditorialRules(id, now),
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

    updateChannelProfile(id, input, requestId) {
      const existingBundle = getChannelBundleOrThrow(repository, id);
      const parsed = normalizeProfileInput(input);
      const now = toIso(clock());
      const requestedBy = parsed.requestedBy?.trim() || "Aralume Studio";
      const nextChannel: Channel = {
        ...existingBundle.channel,
        editorialTone:
          parsed.editorialTone !== undefined
            ? parsed.editorialTone.trim()
            : existingBundle.channel.editorialTone,
        language:
          parsed.language !== undefined ? parsed.language.trim() : existingBundle.channel.language,
        audience:
          parsed.audience !== undefined ? parsed.audience.trim() : existingBundle.channel.audience,
        updatedAt: now,
        lastActivityAt: now,
      };
      const nextSettings: ChannelSettings = {
        ...(existingBundle.settings ?? buildDefaultSettings(id, now)),
        allowedFormats: parsed.allowedFormats ?? existingBundle.settings.allowedFormats,
        updatedAt: now,
      };
      const nextEditorialRules: EditorialRules = {
        ...(existingBundle.editorialRules ?? buildDefaultEditorialRules(id, now)),
        ...(parsed.editorialRules ?? {}),
        prohibitedClaims:
          parsed.editorialRules?.prohibitedClaims ??
          existingBundle.editorialRules?.prohibitedClaims ??
          [],
        complianceNotes:
          parsed.editorialRules?.complianceNotes ??
          existingBundle.editorialRules?.complianceNotes ??
          [],
        updatedAt: now,
      };

      const nextBundle: ChannelBundle = {
        channel: nextChannel,
        settings: nextSettings,
        editorialRules: nextEditorialRules,
      };
      repository.upsertChannel(nextBundle);
      auditService?.recordAuditLog({
        channelId: id,
        requestId,
        actorType: "user",
        actorName: requestedBy,
        action: "channel.profile.updated",
        entityType: "ChannelEditorialProfile",
        entityId: id,
        status: "success",
        message: "Channel editorial profile updated.",
        metadata: {
          editorialTone: nextChannel.editorialTone,
          language: nextChannel.language,
          audience: nextChannel.audience,
          allowedFormats: nextSettings.allowedFormats,
          requestedBy,
        },
      });

      return {
        ...nextBundle,
        editorialRules: nextEditorialRules,
      };
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
    editorialRules: buildDefaultEditorialRules(id, now),
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

function buildDefaultEditorialRules(id: ID, now: string): EditorialRules {
  return {
    id: `er_${id}`,
    channelId: id,
    factualContentRequiresSources: true,
    minimumSources: 3,
    allowFictionalNarratives: false,
    allowThirdPartyAssets: true,
    requiresHumanApprovalBeforePublication: true,
    highRiskAutoBlock: true,
    prohibitedClaims: [],
    complianceNotes: [],
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

function normalizeProfileInput(input: ChannelProfileUpdateInput): ChannelProfileUpdateInput {
  const output: ChannelProfileUpdateInput = {};

  if (input.requestedBy !== undefined) {
    output.requestedBy = input.requestedBy.trim();
  }

  if (input.editorialTone !== undefined) {
    output.editorialTone = input.editorialTone.trim();
  }

  if (input.language !== undefined) {
    output.language = input.language.trim();
  }

  if (input.audience !== undefined) {
    output.audience = input.audience.trim();
  }

  if (input.allowedFormats !== undefined) {
    output.allowedFormats = input.allowedFormats.map((value) => value.trim()).filter(Boolean);
  }

  if (input.editorialRules !== undefined) {
    output.editorialRules = {
      ...input.editorialRules,
    };

    if (input.editorialRules.prohibitedClaims !== undefined) {
      output.editorialRules.prohibitedClaims = input.editorialRules.prohibitedClaims
        .map((value) => value.trim())
        .filter(Boolean);
    }

    if (input.editorialRules.complianceNotes !== undefined) {
      output.editorialRules.complianceNotes = input.editorialRules.complianceNotes
        .map((value) => value.trim())
        .filter(Boolean);
    }
  }

  return output;
}

function getChannelBundleOrThrow(repository: ChannelsRepository, id: ID): ChannelBundle {
  const found = repository.getChannelBundle(id);
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
