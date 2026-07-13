export type ID = string;
export type ISODate = string;

export type ContentStatus =
  | "idea"
  | "research"
  | "script"
  | "visual_plan"
  | "narration"
  | "editing"
  | "clips"
  | "quality_check"
  | "compliance_check"
  | "waiting_approval"
  | "approved"
  | "scheduled"
  | "published"
  | "failed"
  | "blocked";

export type WorkflowStatus =
  | "queued"
  | "running"
  | "waiting"
  | "waiting_approval"
  | "completed"
  | "failed"
  | "blocked"
  | "retrying";

export type RiskLevel = "ok" | "attention" | "warning" | "critical" | "blocked";
export type ConfidenceLevel = "low" | "medium" | "high";
export type SourceType = "article" | "paper" | "video" | "book" | "official" | "other";
export type InformationType = "fact" | "opinion" | "hypothesis" | "fiction";

export type ContentIdea = {
  id: ID;
  channelId: ID;
  title: string;
  summary: string;
  niche: string;
  source: string;
  opportunityScore: number;
  originalityScore: number;
  visualPotentialScore: number;
  clipPotentialScore: number;
  riskLevel: RiskLevel;
  status: ContentStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ProductionItem = {
  id: ID;
  channelId: ID;
  contentId: ID;
  title: string;
  status: ContentStatus;
  workflowRunId: ID;
  currentAgentId?: ID;
  currentAgentName?: string;
  progressPercent: number;
  costActualCents: number;
  riskLevel: RiskLevel;
  nextAction: string;
  lastActivityAt: ISODate;
};

export type ResearchSession = {
  id: ID;
  channelId: ID;
  contentId: ID;
  title: string;
  status: WorkflowStatus;
  sourceCount: number;
  claimCount: number;
  confidenceScore: number;
  riskLevel: RiskLevel;
  summary?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ResearchSource = {
  id: ID;
  channelId: ID;
  researchSessionId: ID;
  title: string;
  url?: string;
  publisher?: string;
  accessedAt: ISODate;
  sourceType: SourceType;
  confidenceLevel: ConfidenceLevel;
  freshnessRisk: RiskLevel;
  usageNotes: string;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ClaimEvidence = {
  id: ID;
  channelId: ID;
  researchSessionId: ID;
  sourceId: ID;
  claim: string;
  evidenceSummary: string;
  informationType: InformationType;
  confidenceLevel: ConfidenceLevel;
  riskLevel: RiskLevel;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type Script = {
  id: ID;
  channelId: ID;
  contentId: ID;
  title: string;
  status: ContentStatus;
  currentVersionId: ID;
  estimatedDurationSeconds: number;
  hook: string;
  promise: string;
  cta: string;
  riskLevel: RiskLevel;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ScriptVersion = {
  id: ID;
  channelId: ID;
  scriptId: ID;
  versionNumber: number;
  title: string;
  narrationText: string;
  sceneCount: number;
  estimatedDurationSeconds: number;
  changeSummary: string;
  createdAt: ISODate;
};

export type VisualPlan = {
  id: ID;
  channelId: ID;
  contentId: ID;
  scriptVersionId: ID;
  title: string;
  status: ContentStatus;
  sceneCount: number;
  estimatedDurationSeconds: number;
  visualStyle: string;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ScenePlan = {
  id: ID;
  channelId: ID;
  visualPlanId: ID;
  order: number;
  title: string;
  narrationExcerpt: string;
  durationSeconds: number;
  visualDescription: string;
  assetRequirements: string[];
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ContentIdeaFilters = {
  channelId?: ID;
  status?: ContentStatus;
};

export type ProductionItemFilters = {
  channelId?: ID;
  status?: ContentStatus;
  contentId?: ID;
};

export type ResearchSessionFilters = {
  channelId?: ID;
  status?: WorkflowStatus;
  contentId?: ID;
};

export type ScriptFilters = {
  channelId?: ID;
  status?: ContentStatus;
  contentId?: ID;
};

export type VisualPlanFilters = {
  channelId?: ID;
  status?: ContentStatus;
  contentId?: ID;
  scriptVersionId?: ID;
};

export type EditorialSeed = {
  contentIdeas: ContentIdea[];
  productionItems: ProductionItem[];
  researchSessions: ResearchSession[];
  researchSources: ResearchSource[];
  claimEvidence: ClaimEvidence[];
  scripts: Script[];
  scriptVersions: ScriptVersion[];
  visualPlans: VisualPlan[];
  scenePlans: ScenePlan[];
};

export type ContentIdeaCreateInput = {
  channelId: ID;
  title: string;
  summary: string;
  niche: string;
  source: string;
  opportunityScore: number;
  originalityScore: number;
  visualPotentialScore: number;
  clipPotentialScore: number;
  riskLevel: RiskLevel;
  status: ContentStatus;
};

export type ContentIdeaPatchInput = Partial<Omit<ContentIdeaCreateInput, "channelId">>;

export type ResearchSessionCreateInput = {
  channelId: ID;
  contentId: ID;
  title: string;
  status: WorkflowStatus;
  sourceCount: number;
  claimCount: number;
  confidenceScore: number;
  riskLevel: RiskLevel;
  summary?: string;
};

export type ResearchSourceCreateInput = {
  title: string;
  url?: string;
  publisher?: string;
  accessedAt: ISODate;
  sourceType: SourceType;
  confidenceLevel: ConfidenceLevel;
  freshnessRisk: RiskLevel;
  usageNotes: string;
};

export type ClaimEvidenceCreateInput = {
  sourceId: ID;
  claim: string;
  evidenceSummary: string;
  informationType: InformationType;
  confidenceLevel: ConfidenceLevel;
  riskLevel: RiskLevel;
};

export type ScriptCreateInput = {
  channelId: ID;
  contentId: ID;
  title: string;
  status: ContentStatus;
  estimatedDurationSeconds: number;
  hook: string;
  promise: string;
  cta: string;
  riskLevel: RiskLevel;
  initialVersion: {
    title?: string;
    narrationText: string;
    sceneCount: number;
    estimatedDurationSeconds?: number;
    changeSummary: string;
  };
};

export type ScriptPatchInput = Partial<
  Pick<
    Script,
    "title" | "status" | "estimatedDurationSeconds" | "hook" | "promise" | "cta" | "riskLevel"
  >
>;

export type ScriptVersionCreateInput = {
  title?: string;
  narrationText: string;
  sceneCount: number;
  estimatedDurationSeconds?: number;
  changeSummary: string;
  versionNumber?: number;
};

export type VisualPlanCreateInput = {
  channelId: ID;
  contentId: ID;
  scriptVersionId: ID;
  title: string;
  status: ContentStatus;
  sceneCount: number;
  estimatedDurationSeconds: number;
  visualStyle: string;
};

export type VisualPlanPatchInput = Partial<
  Pick<VisualPlan, "title" | "status" | "sceneCount" | "estimatedDurationSeconds" | "visualStyle">
>;

export type ScenePlanCreateInput = {
  order: number;
  title: string;
  narrationExcerpt: string;
  durationSeconds: number;
  visualDescription: string;
  assetRequirements?: string[];
};

export type EditorialRepository = {
  listContentIdeas(filters?: ContentIdeaFilters): ContentIdea[];
  getContentIdea(id: ID): ContentIdea | undefined;
  upsertContentIdea(idea: ContentIdea): void;
  listProductionItems(filters?: ProductionItemFilters): ProductionItem[];
  getProductionItem(id: ID): ProductionItem | undefined;
  upsertProductionItem(item: ProductionItem): void;
  listResearchSessions(filters?: ResearchSessionFilters): ResearchSession[];
  getResearchSession(id: ID): ResearchSession | undefined;
  upsertResearchSession(session: ResearchSession): void;
  listResearchSources(filters?: { channelId?: ID; researchSessionId?: ID }): ResearchSource[];
  getResearchSource(id: ID): ResearchSource | undefined;
  upsertResearchSource(source: ResearchSource): void;
  listClaimEvidence(filters?: {
    channelId?: ID;
    researchSessionId?: ID;
    sourceId?: ID;
  }): ClaimEvidence[];
  getClaimEvidence(id: ID): ClaimEvidence | undefined;
  upsertClaimEvidence(claim: ClaimEvidence): void;
  listScripts(filters?: ScriptFilters): Script[];
  getScript(id: ID): Script | undefined;
  upsertScript(script: Script): void;
  listScriptVersions(filters?: { channelId?: ID; scriptId?: ID }): ScriptVersion[];
  getScriptVersion(id: ID): ScriptVersion | undefined;
  upsertScriptVersion(version: ScriptVersion): void;
  listVisualPlans(filters?: VisualPlanFilters): VisualPlan[];
  getVisualPlan(id: ID): VisualPlan | undefined;
  upsertVisualPlan(plan: VisualPlan): void;
  listScenePlans(filters?: { channelId?: ID; visualPlanId?: ID }): ScenePlan[];
  getScenePlan(id: ID): ScenePlan | undefined;
  upsertScenePlan(scene: ScenePlan): void;
};
