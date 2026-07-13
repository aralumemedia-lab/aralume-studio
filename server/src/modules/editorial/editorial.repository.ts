import type {
  ClaimEvidence,
  ContentIdea,
  ContentIdeaFilters,
  EditorialRepository,
  EditorialSeed,
  ID,
  ProductionItem,
  ProductionItemFilters,
  ResearchSession,
  ResearchSessionFilters,
  ResearchSource,
  ScenePlan,
  Script,
  ScriptFilters,
  ScriptVersion,
  VisualPlan,
  VisualPlanFilters,
} from "./editorial.types.js";

const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryEditorialRepository implements EditorialRepository {
  private readonly contentIdeas = new Map<ID, ContentIdea>();
  private readonly productionItems = new Map<ID, ProductionItem>();
  private readonly researchSessions = new Map<ID, ResearchSession>();
  private readonly researchSources = new Map<ID, ResearchSource>();
  private readonly claimEvidence = new Map<ID, ClaimEvidence>();
  private readonly scripts = new Map<ID, Script>();
  private readonly scriptVersions = new Map<ID, ScriptVersion>();
  private readonly visualPlans = new Map<ID, VisualPlan>();
  private readonly scenePlans = new Map<ID, ScenePlan>();

  constructor(seed?: Partial<EditorialSeed>) {
    if (seed) {
      this.replaceAll(seed);
    }
  }

  replaceAll(seed: Partial<EditorialSeed>): void {
    this.contentIdeas.clear();
    this.productionItems.clear();
    this.researchSessions.clear();
    this.researchSources.clear();
    this.claimEvidence.clear();
    this.scripts.clear();
    this.scriptVersions.clear();
    this.visualPlans.clear();
    this.scenePlans.clear();

    seed.contentIdeas?.forEach((item) => this.contentIdeas.set(item.id, clone(item)));
    seed.productionItems?.forEach((item) => this.productionItems.set(item.id, clone(item)));
    seed.researchSessions?.forEach((item) => this.researchSessions.set(item.id, clone(item)));
    seed.researchSources?.forEach((item) => this.researchSources.set(item.id, clone(item)));
    seed.claimEvidence?.forEach((item) => this.claimEvidence.set(item.id, clone(item)));
    seed.scripts?.forEach((item) => this.scripts.set(item.id, clone(item)));
    seed.scriptVersions?.forEach((item) => this.scriptVersions.set(item.id, clone(item)));
    seed.visualPlans?.forEach((item) => this.visualPlans.set(item.id, clone(item)));
    seed.scenePlans?.forEach((item) => this.scenePlans.set(item.id, clone(item)));
  }

  listContentIdeas(filters: ContentIdeaFilters = {}): ContentIdea[] {
    return this.filterItems(Array.from(this.contentIdeas.values()), filters);
  }

  getContentIdea(id: ID): ContentIdea | undefined {
    return this.cloneFromMap(this.contentIdeas, id);
  }

  upsertContentIdea(idea: ContentIdea): void {
    this.contentIdeas.set(idea.id, clone(idea));
  }

  listProductionItems(filters: ProductionItemFilters = {}): ProductionItem[] {
    return this.filterItems(Array.from(this.productionItems.values()), filters);
  }

  getProductionItem(id: ID): ProductionItem | undefined {
    return this.cloneFromMap(this.productionItems, id);
  }

  upsertProductionItem(item: ProductionItem): void {
    this.productionItems.set(item.id, clone(item));
  }

  listResearchSessions(filters: ResearchSessionFilters = {}): ResearchSession[] {
    return this.filterItems(Array.from(this.researchSessions.values()), filters);
  }

  getResearchSession(id: ID): ResearchSession | undefined {
    return this.cloneFromMap(this.researchSessions, id);
  }

  upsertResearchSession(session: ResearchSession): void {
    this.researchSessions.set(session.id, clone(session));
  }

  listResearchSources(filters: { channelId?: ID; researchSessionId?: ID } = {}): ResearchSource[] {
    return this.filterItems(Array.from(this.researchSources.values()), filters);
  }

  getResearchSource(id: ID): ResearchSource | undefined {
    return this.cloneFromMap(this.researchSources, id);
  }

  upsertResearchSource(source: ResearchSource): void {
    this.researchSources.set(source.id, clone(source));
  }

  listClaimEvidence(
    filters: { channelId?: ID; researchSessionId?: ID; sourceId?: ID } = {},
  ): ClaimEvidence[] {
    return this.filterItems(Array.from(this.claimEvidence.values()), filters);
  }

  getClaimEvidence(id: ID): ClaimEvidence | undefined {
    return this.cloneFromMap(this.claimEvidence, id);
  }

  upsertClaimEvidence(claim: ClaimEvidence): void {
    this.claimEvidence.set(claim.id, clone(claim));
  }

  listScripts(filters: ScriptFilters = {}): Script[] {
    return this.filterItems(Array.from(this.scripts.values()), filters);
  }

  getScript(id: ID): Script | undefined {
    return this.cloneFromMap(this.scripts, id);
  }

  upsertScript(script: Script): void {
    this.scripts.set(script.id, clone(script));
  }

  listScriptVersions(filters: { channelId?: ID; scriptId?: ID } = {}): ScriptVersion[] {
    return this.filterItems(Array.from(this.scriptVersions.values()), filters).sort(
      (left, right) => left.versionNumber - right.versionNumber,
    );
  }

  getScriptVersion(id: ID): ScriptVersion | undefined {
    return this.cloneFromMap(this.scriptVersions, id);
  }

  upsertScriptVersion(version: ScriptVersion): void {
    this.scriptVersions.set(version.id, clone(version));
  }

  listVisualPlans(filters: VisualPlanFilters = {}): VisualPlan[] {
    return this.filterItems(Array.from(this.visualPlans.values()), filters);
  }

  getVisualPlan(id: ID): VisualPlan | undefined {
    return this.cloneFromMap(this.visualPlans, id);
  }

  upsertVisualPlan(plan: VisualPlan): void {
    this.visualPlans.set(plan.id, clone(plan));
  }

  listScenePlans(filters: { channelId?: ID; visualPlanId?: ID } = {}): ScenePlan[] {
    return this.filterItems(Array.from(this.scenePlans.values()), filters).sort(
      (left, right) => left.order - right.order,
    );
  }

  getScenePlan(id: ID): ScenePlan | undefined {
    return this.cloneFromMap(this.scenePlans, id);
  }

  upsertScenePlan(scene: ScenePlan): void {
    this.scenePlans.set(scene.id, clone(scene));
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

export function createEditorialRepository(seed?: Partial<EditorialSeed>): EditorialRepository {
  return new InMemoryEditorialRepository(seed);
}
