import { randomUUID } from "node:crypto";

import { AppError } from "../../http/errors.js";
import type { ChannelsRepository } from "../channels/channel.types.js";
import {
  claimEvidenceCreateSchema,
  contentIdeaCreateSchema,
  contentIdeaPatchSchema,
  idSchema,
  researchSessionCreateSchema,
  researchSourceCreateSchema,
  scriptCreateSchema,
  scriptPatchSchema,
  scriptVersionCreateSchema,
  scenePlanCreateSchema,
  visualPlanCreateSchema,
  visualPlanPatchSchema,
} from "./editorial.schema.js";
import type {
  ClaimEvidence,
  ClaimEvidenceCreateInput,
  ContentIdea,
  ContentIdeaCreateInput,
  ContentIdeaFilters,
  ContentIdeaPatchInput,
  ContentStatus,
  EditorialRepository,
  ID,
  ProductionItem,
  ProductionItemFilters,
  ResearchSession,
  ResearchSessionCreateInput,
  ResearchSessionFilters,
  ResearchSource,
  ResearchSourceCreateInput,
  RiskLevel,
  ScenePlan,
  ScenePlanCreateInput,
  Script,
  ScriptCreateInput,
  ScriptFilters,
  ScriptPatchInput,
  ScriptVersion,
  ScriptVersionCreateInput,
  VisualPlan,
  VisualPlanCreateInput,
  VisualPlanFilters,
  VisualPlanPatchInput,
} from "./editorial.types.js";

export type EditorialClock = () => Date;
export type EditorialIdFactory = () => string;

export type CreateEditorialServiceOptions = {
  clock?: EditorialClock;
  idFactory?: EditorialIdFactory;
};

export type EditorialService = {
  listContentIdeas(filters?: ContentIdeaFilters): ContentIdea[];
  getContentIdea(id: ID): ContentIdea;
  createContentIdea(input: ContentIdeaCreateInput): ContentIdea;
  updateContentIdea(id: ID, input: ContentIdeaPatchInput): ContentIdea;
  listProductionItems(filters?: ProductionItemFilters): ProductionItem[];
  getProductionItem(id: ID): ProductionItem;
  listResearchSessions(filters?: ResearchSessionFilters): ResearchSession[];
  getResearchSession(id: ID): ResearchSession;
  createResearchSession(input: ResearchSessionCreateInput): ResearchSession;
  listResearchSources(filters?: { channelId?: ID; researchSessionId?: ID }): ResearchSource[];
  getResearchSource(id: ID): ResearchSource;
  createResearchSource(researchSessionId: ID, input: ResearchSourceCreateInput): ResearchSource;
  listClaimEvidence(filters?: {
    channelId?: ID;
    researchSessionId?: ID;
    sourceId?: ID;
  }): ClaimEvidence[];
  getClaimEvidence(id: ID): ClaimEvidence;
  createClaimEvidence(researchSessionId: ID, input: ClaimEvidenceCreateInput): ClaimEvidence;
  listScripts(filters?: ScriptFilters): Script[];
  getScript(id: ID): Script;
  createScript(input: ScriptCreateInput): Script;
  updateScript(id: ID, input: ScriptPatchInput): Script;
  listScriptVersions(filters?: { channelId?: ID; scriptId?: ID }): ScriptVersion[];
  getScriptVersion(id: ID): ScriptVersion;
  createScriptVersion(scriptId: ID, input: ScriptVersionCreateInput): ScriptVersion;
  listVisualPlans(filters?: VisualPlanFilters): VisualPlan[];
  getVisualPlan(id: ID): VisualPlan;
  createVisualPlan(input: VisualPlanCreateInput): VisualPlan;
  updateVisualPlan(id: ID, input: VisualPlanPatchInput): VisualPlan;
  listScenePlans(filters?: { channelId?: ID; visualPlanId?: ID }): ScenePlan[];
  getScenePlan(id: ID): ScenePlan;
  createScenePlan(visualPlanId: ID, input: ScenePlanCreateInput): ScenePlan;
};

export function createEditorialService(
  repository: EditorialRepository,
  channelsRepository: ChannelsRepository,
  options: CreateEditorialServiceOptions = {},
): EditorialService {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? (() => randomUUID());

  return {
    listContentIdeas(filters = {}) {
      const channelId = validateChannelFilter(channelsRepository, filters.channelId);
      return repository.listContentIdeas({ ...filters, channelId });
    },

    getContentIdea(id) {
      return getRequiredContentIdea(repository, id);
    },

    createContentIdea(input) {
      const parsed = contentIdeaCreateSchema.parse(input);
      assertChannelExists(channelsRepository, parsed.channelId);

      const now = toIso(clock());
      const idea: ContentIdea = {
        id: `idea_${idFactory()}`,
        ...parsed,
        createdAt: now,
        updatedAt: now,
      };

      repository.upsertContentIdea(idea);
      repository.upsertProductionItem(buildProductionItemForIdea(idea, undefined, now));

      return idea;
    },

    updateContentIdea(id, input) {
      const existing = getRequiredContentIdea(repository, id);
      const parsed = contentIdeaPatchSchema.parse(input);
      const now = toIso(clock());
      const next: ContentIdea = {
        ...existing,
        ...parsed,
        updatedAt: now,
      };

      repository.upsertContentIdea(next);
      repository.upsertProductionItem(
        buildProductionItemForIdea(
          next,
          repository.getProductionItem(idToProductionItemId(id)),
          now,
        ),
      );

      return next;
    },

    listProductionItems(filters = {}) {
      const channelId = validateChannelFilter(channelsRepository, filters.channelId);
      return repository.listProductionItems({ ...filters, channelId });
    },

    getProductionItem(id) {
      const found = repository.getProductionItem(id);
      if (!found) {
        throw notFound("Production item not found", { id });
      }

      return found;
    },

    listResearchSessions(filters = {}) {
      const channelId = validateChannelFilter(channelsRepository, filters.channelId);
      return repository.listResearchSessions({ ...filters, channelId });
    },

    getResearchSession(id) {
      return getRequiredResearchSession(repository, id);
    },

    createResearchSession(input) {
      const parsed = researchSessionCreateSchema.parse(input);
      assertChannelExists(channelsRepository, parsed.channelId);
      const contentIdea = getRequiredContentIdea(repository, parsed.contentId);
      assertSameChannel(contentIdea.channelId, parsed.channelId, "Content idea");

      const now = toIso(clock());
      const session: ResearchSession = {
        id: `rs_${idFactory()}`,
        ...parsed,
        createdAt: now,
        updatedAt: now,
      };

      repository.upsertResearchSession(session);
      advanceIdeaStage(repository, contentIdea, "research", now);
      return session;
    },

    listResearchSources(filters = {}) {
      const channelId = validateChannelFilter(channelsRepository, filters.channelId);
      return repository.listResearchSources({ ...filters, channelId });
    },

    getResearchSource(id) {
      const found = repository.getResearchSource(id);
      if (!found) {
        throw notFound("Research source not found", { id });
      }

      return found;
    },

    createResearchSource(researchSessionId, input) {
      const session = getRequiredResearchSession(repository, researchSessionId);
      const parsed = researchSourceCreateSchema.parse(input);
      const now = toIso(clock());

      const source: ResearchSource = {
        id: `src_${idFactory()}`,
        channelId: session.channelId,
        researchSessionId: session.id,
        ...parsed,
        createdAt: now,
        updatedAt: now,
      };

      repository.upsertResearchSource(source);
      repository.upsertResearchSession({
        ...session,
        sourceCount: session.sourceCount + 1,
        updatedAt: now,
      });

      return source;
    },

    listClaimEvidence(filters = {}) {
      const channelId = validateChannelFilter(channelsRepository, filters.channelId);
      return repository.listClaimEvidence({ ...filters, channelId });
    },

    getClaimEvidence(id) {
      const found = repository.getClaimEvidence(id);
      if (!found) {
        throw notFound("Claim evidence not found", { id });
      }

      return found;
    },

    createClaimEvidence(researchSessionId, input) {
      const session = getRequiredResearchSession(repository, researchSessionId);
      const parsed = claimEvidenceCreateSchema.parse(input);
      const source = getRequiredResearchSource(repository, parsed.sourceId);

      assertSameChannel(session.channelId, source.channelId, "Research source");
      if (source.researchSessionId !== session.id) {
        throw conflict("Research source belongs to a different session", {
          researchSessionId: session.id,
          sourceId: source.id,
        });
      }

      const now = toIso(clock());
      const claim: ClaimEvidence = {
        id: `ce_${idFactory()}`,
        channelId: session.channelId,
        researchSessionId: session.id,
        ...parsed,
        createdAt: now,
        updatedAt: now,
      };

      repository.upsertClaimEvidence(claim);
      repository.upsertResearchSession({
        ...session,
        claimCount: session.claimCount + 1,
        updatedAt: now,
      });

      return claim;
    },

    listScripts(filters = {}) {
      const channelId = validateChannelFilter(channelsRepository, filters.channelId);
      return repository.listScripts({ ...filters, channelId });
    },

    getScript(id) {
      return getRequiredScript(repository, id);
    },

    createScript(input) {
      const parsed = scriptCreateSchema.parse(input);
      assertChannelExists(channelsRepository, parsed.channelId);
      const contentIdea = getRequiredContentIdea(repository, parsed.contentId);
      assertSameChannel(contentIdea.channelId, parsed.channelId, "Content idea");

      const now = toIso(clock());
      const scriptId = `sc_${idFactory()}`;
      const initialVersionId = `scv_${idFactory()}`;
      const initialVersion: ScriptVersion = {
        id: initialVersionId,
        channelId: parsed.channelId,
        scriptId,
        versionNumber: 1,
        title: parsed.initialVersion.title ?? parsed.title,
        narrationText: parsed.initialVersion.narrationText,
        sceneCount: parsed.initialVersion.sceneCount,
        estimatedDurationSeconds:
          parsed.initialVersion.estimatedDurationSeconds ?? parsed.estimatedDurationSeconds,
        changeSummary: parsed.initialVersion.changeSummary,
        createdAt: now,
      };

      const script: Script = {
        id: scriptId,
        channelId: parsed.channelId,
        contentId: parsed.contentId,
        title: parsed.title,
        status: parsed.status,
        currentVersionId: initialVersionId,
        estimatedDurationSeconds: parsed.estimatedDurationSeconds,
        hook: parsed.hook,
        promise: parsed.promise,
        cta: parsed.cta,
        riskLevel: parsed.riskLevel,
        createdAt: now,
        updatedAt: now,
      };

      repository.upsertScript(script);
      repository.upsertScriptVersion(initialVersion);
      advanceIdeaStage(repository, contentIdea, "script", now);

      return script;
    },

    updateScript(id, input) {
      const existing = getRequiredScript(repository, id);
      const parsed = scriptPatchSchema.parse(input);
      const now = toIso(clock());

      const next: Script = {
        ...existing,
        ...parsed,
        updatedAt: now,
      };

      repository.upsertScript(next);
      const contentIdea = getRequiredContentIdea(repository, next.contentId);
      advanceIdeaStage(
        repository,
        contentIdea,
        next.status === "blocked" ? "blocked" : next.status,
        now,
      );
      return next;
    },

    listScriptVersions(filters = {}) {
      const channelId = validateChannelFilter(channelsRepository, filters.channelId);
      return repository.listScriptVersions({ ...filters, channelId });
    },

    getScriptVersion(id) {
      const found = repository.getScriptVersion(id);
      if (!found) {
        throw notFound("Script version not found", { id });
      }

      return found;
    },

    createScriptVersion(scriptId, input) {
      const script = getRequiredScript(repository, scriptId);
      const contentIdea = getRequiredContentIdea(repository, script.contentId);
      const parsed = scriptVersionCreateSchema.parse(input);
      const existingVersions = repository.listScriptVersions({ scriptId });
      const nextVersionNumber = existingVersions.length + 1;

      if (parsed.versionNumber !== undefined && parsed.versionNumber !== nextVersionNumber) {
        throw conflict("Script version already exists", {
          scriptId,
          requestedVersionNumber: parsed.versionNumber,
          nextVersionNumber,
        });
      }

      const now = toIso(clock());
      const version: ScriptVersion = {
        id: `scv_${idFactory()}`,
        channelId: script.channelId,
        scriptId: script.id,
        versionNumber: parsed.versionNumber ?? nextVersionNumber,
        title: parsed.title ?? script.title,
        narrationText: parsed.narrationText,
        sceneCount: parsed.sceneCount,
        estimatedDurationSeconds:
          parsed.estimatedDurationSeconds ?? script.estimatedDurationSeconds,
        changeSummary: parsed.changeSummary,
        createdAt: now,
      };

      repository.upsertScriptVersion(version);
      repository.upsertScript({
        ...script,
        currentVersionId: version.id,
        title: parsed.title ?? script.title,
        estimatedDurationSeconds: version.estimatedDurationSeconds,
        updatedAt: now,
      });
      advanceIdeaStage(repository, contentIdea, "script", now);

      return version;
    },

    listVisualPlans(filters = {}) {
      const channelId = validateChannelFilter(channelsRepository, filters.channelId);
      return repository.listVisualPlans({ ...filters, channelId });
    },

    getVisualPlan(id) {
      const found = repository.getVisualPlan(id);
      if (!found) {
        throw notFound("Visual plan not found", { id });
      }

      return found;
    },

    createVisualPlan(input) {
      const parsed = visualPlanCreateSchema.parse(input);
      assertChannelExists(channelsRepository, parsed.channelId);

      const scriptVersion = getRequiredScriptVersion(repository, parsed.scriptVersionId);
      const script = getRequiredScript(repository, scriptVersion.scriptId);
      assertSameChannel(script.channelId, parsed.channelId, "Script");
      assertSameChannel(scriptVersion.channelId, parsed.channelId, "Script version");

      const contentIdea = getRequiredContentIdea(repository, parsed.contentId);
      assertSameChannel(contentIdea.channelId, parsed.channelId, "Content idea");
      if (script.contentId !== parsed.contentId) {
        throw conflict("Visual plan belongs to a different content item", {
          scriptId: script.id,
          contentId: parsed.contentId,
        });
      }

      const now = toIso(clock());
      const plan: VisualPlan = {
        id: `vp_${idFactory()}`,
        ...parsed,
        createdAt: now,
        updatedAt: now,
      };

      repository.upsertVisualPlan(plan);
      advanceIdeaStage(repository, contentIdea, "visual_plan", now);
      return plan;
    },

    updateVisualPlan(id, input) {
      const existing = getRequiredVisualPlan(repository, id);
      const parsed = visualPlanPatchSchema.parse(input);
      const now = toIso(clock());

      const next: VisualPlan = {
        ...existing,
        ...parsed,
        updatedAt: now,
      };

      repository.upsertVisualPlan(next);
      const contentIdea = getRequiredContentIdea(repository, next.contentId);
      advanceIdeaStage(
        repository,
        contentIdea,
        next.status === "blocked" ? "blocked" : next.status,
        now,
      );
      return next;
    },

    listScenePlans(filters = {}) {
      const channelId = validateChannelFilter(channelsRepository, filters.channelId);
      return repository.listScenePlans({ ...filters, channelId });
    },

    getScenePlan(id) {
      const found = repository.getScenePlan(id);
      if (!found) {
        throw notFound("Scene plan not found", { id });
      }

      return found;
    },

    createScenePlan(visualPlanId, input) {
      const plan = getRequiredVisualPlan(repository, visualPlanId);
      const parsed = scenePlanCreateSchema.parse(input);
      if (parsed.order !== Math.trunc(parsed.order) || parsed.order <= 0) {
        throw validation("Scene order must be a positive integer", { order: parsed.order });
      }

      const duplicateOrder = repository
        .listScenePlans({ visualPlanId: plan.id })
        .some((scene) => scene.order === parsed.order);
      if (duplicateOrder) {
        throw conflict("Scene order already exists", {
          visualPlanId: plan.id,
          order: parsed.order,
        });
      }

      const now = toIso(clock());
      const scene: ScenePlan = {
        id: `scn_${idFactory()}`,
        channelId: plan.channelId,
        visualPlanId: plan.id,
        ...parsed,
        assetRequirements: parsed.assetRequirements ?? [],
        createdAt: now,
        updatedAt: now,
      };

      repository.upsertScenePlan(scene);
      repository.upsertVisualPlan({
        ...plan,
        sceneCount: Math.max(plan.sceneCount, parsed.order),
        updatedAt: now,
      });
      return scene;
    },
  };
}

function validateChannelFilter(
  channelsRepository: ChannelsRepository,
  channelId?: ID,
): ID | undefined {
  if (!channelId) {
    return undefined;
  }

  assertChannelExists(channelsRepository, channelId);
  return channelId;
}

function assertChannelExists(channelsRepository: ChannelsRepository, channelId: ID): void {
  if (!idSchema.safeParse(channelId).success) {
    throw validation("Invalid channel id", { channelId });
  }

  const channel = channelsRepository.getChannel(channelId);
  if (!channel) {
    throw notFound("Channel not found", { channelId });
  }
}

function assertSameChannel(expected: ID, actual: ID, label: string): void {
  if (expected !== actual) {
    throw conflict(`${label} belongs to a different channel`, {
      expectedChannelId: expected,
      channelId: actual,
    });
  }
}

function advanceIdeaStage(
  repository: EditorialRepository,
  idea: ContentIdea,
  status: ContentStatus,
  nowIso: string,
): void {
  const nextIdea: ContentIdea = {
    ...idea,
    status,
    updatedAt: nowIso,
  };
  repository.upsertContentIdea(nextIdea);
  repository.upsertProductionItem(
    buildProductionItemForIdea(
      nextIdea,
      repository.getProductionItem(idToProductionItemId(idea.id)),
      nowIso,
    ),
  );
}

function buildProductionItemForIdea(
  idea: ContentIdea,
  existing: ProductionItem | undefined,
  nowIso: string,
): ProductionItem {
  const snapshot = productionSnapshotByStatus(idea.status);
  return {
    id: existing?.id ?? idToProductionItemId(idea.id),
    channelId: idea.channelId,
    contentId: idea.id,
    title: idea.title,
    status: idea.status,
    workflowRunId: existing?.workflowRunId ?? `wf_${idea.id}`,
    currentAgentId: snapshot.currentAgentId ?? existing?.currentAgentId,
    currentAgentName: snapshot.currentAgentName ?? existing?.currentAgentName,
    progressPercent: snapshot.progressPercent,
    costActualCents: existing?.costActualCents ?? 0,
    riskLevel: idea.riskLevel,
    nextAction: snapshot.nextAction,
    lastActivityAt: nowIso,
  };
}

function productionSnapshotByStatus(status: ContentStatus): {
  currentAgentId?: ID;
  currentAgentName?: string;
  progressPercent: number;
  nextAction: string;
} {
  switch (status) {
    case "research":
      return {
        currentAgentId: "agent_research",
        currentAgentName: "Pesquisador",
        progressPercent: 25,
        nextAction: "Registrar fontes",
      };
    case "script":
      return {
        currentAgentId: "agent_script",
        currentAgentName: "Roteirista",
        progressPercent: 55,
        nextAction: "Criar plano visual",
      };
    case "visual_plan":
      return {
        currentAgentId: "agent_visual",
        currentAgentName: "Direcao Visual",
        progressPercent: 75,
        nextAction: "Detalhar cenas",
      };
    case "waiting_approval":
      return {
        currentAgentId: "agent_editorial",
        currentAgentName: "Editorial",
        progressPercent: 90,
        nextAction: "Aguardar aprovacao",
      };
    case "approved":
      return {
        currentAgentId: "agent_publisher",
        currentAgentName: "Publicador",
        progressPercent: 100,
        nextAction: "Agendar publicacao",
      };
    case "blocked":
      return {
        currentAgentId: "agent_compliance",
        currentAgentName: "Conformidade",
        progressPercent: 40,
        nextAction: "Resolver bloqueio",
      };
    case "scheduled":
      return {
        currentAgentId: "agent_publisher",
        currentAgentName: "Publicador",
        progressPercent: 95,
        nextAction: "Aguardar janela",
      };
    case "published":
      return {
        currentAgentId: "agent_publisher",
        currentAgentName: "Publicador",
        progressPercent: 100,
        nextAction: "Coletar metricas",
      };
    default:
      return {
        currentAgentId: "agent_niche",
        currentAgentName: "Inteligencia de Nicho",
        progressPercent: 5,
        nextAction: "Iniciar pesquisa",
      };
  }
}

function getRequiredContentIdea(repository: EditorialRepository, id: ID): ContentIdea {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    throw validation("Invalid content idea id", { id });
  }

  const found = repository.getContentIdea(id);
  if (!found) {
    throw notFound("Content idea not found", { id });
  }

  return found;
}

function getRequiredResearchSession(repository: EditorialRepository, id: ID): ResearchSession {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    throw validation("Invalid research session id", { id });
  }

  const found = repository.getResearchSession(id);
  if (!found) {
    throw notFound("Research session not found", { id });
  }

  return found;
}

function getRequiredResearchSource(repository: EditorialRepository, id: ID): ResearchSource {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    throw validation("Invalid research source id", { id });
  }

  const found = repository.getResearchSource(id);
  if (!found) {
    throw notFound("Research source not found", { id });
  }

  return found;
}

function getRequiredScript(repository: EditorialRepository, id: ID): Script {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    throw validation("Invalid script id", { id });
  }

  const found = repository.getScript(id);
  if (!found) {
    throw notFound("Script not found", { id });
  }

  return found;
}

function getRequiredScriptVersion(repository: EditorialRepository, id: ID): ScriptVersion {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    throw validation("Invalid script version id", { id });
  }

  const found = repository.getScriptVersion(id);
  if (!found) {
    throw notFound("Script version not found", { id });
  }

  return found;
}

function getRequiredVisualPlan(repository: EditorialRepository, id: ID): VisualPlan {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    throw validation("Invalid visual plan id", { id });
  }

  const found = repository.getVisualPlan(id);
  if (!found) {
    throw notFound("Visual plan not found", { id });
  }

  return found;
}

function idToProductionItemId(contentId: ID): ID {
  return `pi_${contentId}`;
}

function toIso(date: Date): string {
  return date.toISOString();
}

function validation(message: string, details: Record<string, unknown>): AppError {
  return new AppError({
    code: "VALIDATION_ERROR",
    status: 400,
    message,
    details,
  });
}

function notFound(message: string, details: Record<string, unknown>): AppError {
  return new AppError({
    code: "NOT_FOUND",
    status: 404,
    message,
    details,
  });
}

function conflict(message: string, details: Record<string, unknown>): AppError {
  return new AppError({
    code: "CONFLICT",
    status: 409,
    message,
    details,
  });
}
