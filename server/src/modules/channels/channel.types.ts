export type ID = string;
export type ISODate = string;

export type ChannelStatus = "active" | "paused" | "draft" | "archived" | "blocked" | "warning";
export type CostStatus = "healthy" | "attention" | "exceeded" | "not_configured";
export type RiskLevel = "ok" | "attention" | "warning" | "critical" | "blocked";

export type Channel = {
  id: ID;
  name: string;
  slug: string;
  description: string;
  status: ChannelStatus;
  niche: string;
  audience: string;
  language: string;
  region: string;
  timezone: string;
  editorialTone: string;
  publishingFrequency: string;
  monthlyBudgetCents: number;
  monthlyCostUsedCents: number;
  costStatus: CostStatus;
  riskLevel: RiskLevel;
  healthScore: number;
  activeWorkflowsCount: number;
  pendingApprovalsCount: number;
  connectedPlatformsCount: number;
  lastActivityAt: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ChannelSettings = {
  id: ID;
  channelId: ID;
  averageVideoDurationSeconds: number;
  allowedFormats: string[];
  allowedSubniches: string[];
  blockedThemes: string[];
  preferredSources: string[];
  visualIdentity: {
    primaryColor: string;
    secondaryColor: string;
    typography: string;
    subtitleStyle: string;
    openingStyle: string;
    thumbnailStyle: string;
  };
  narration: {
    voiceName: string;
    voiceProvider: string;
    speed: number;
    tone: string;
    pronunciationNotes: string[];
  };
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type EditorialRules = {
  id: ID;
  channelId: ID;
  factualContentRequiresSources: boolean;
  minimumSources: number;
  allowFictionalNarratives: boolean;
  allowThirdPartyAssets: boolean;
  requiresHumanApprovalBeforePublication: boolean;
  highRiskAutoBlock: boolean;
  prohibitedClaims: string[];
  complianceNotes: string[];
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type CreateChannelInput = {
  name: string;
  slug: string;
  status: ChannelStatus;
  timezone: string;
  language: string;
};

export type UpdateChannelInput = Partial<CreateChannelInput>;

export type ChannelBundle = {
  channel: Channel;
  settings: ChannelSettings;
  editorialRules?: EditorialRules;
};

export type ChannelsRepository = {
  listChannels(): Channel[];
  getChannel(id: ID): Channel | undefined;
  getChannelBundle(id: ID): ChannelBundle | undefined;
  getChannelSettings(id: ID): ChannelSettings | undefined;
  getChannelBySlug(slug: string, excludeId?: ID): Channel | undefined;
  upsertChannel(bundle: ChannelBundle): void;
  replaceAll(bundles: ChannelBundle[]): void;
};
