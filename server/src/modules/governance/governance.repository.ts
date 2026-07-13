import type {
  ApprovalDecision,
  ApprovalFilters,
  ComplianceCheck,
  ComplianceCheckFilters,
  GovernanceRepository,
  GovernanceSeed,
  HumanApproval,
  ID,
  QualityCheck,
  QualityCheckFilters,
} from "./governance.types.js";

const clone = <T>(value: T): T => structuredClone(value);

const approvalStatusOrder: Record<HumanApproval["status"], number> = {
  pending: 0,
  blocked: 1,
  changes_requested: 2,
  rejected: 3,
  approved: 4,
};

export class InMemoryGovernanceRepository implements GovernanceRepository {
  private readonly approvals = new Map<ID, HumanApproval>();
  private readonly approvalDecisions = new Map<ID, ApprovalDecision[]>();
  private readonly qualityChecks = new Map<ID, QualityCheck>();
  private readonly complianceChecks = new Map<ID, ComplianceCheck>();

  constructor(seed?: Partial<GovernanceSeed>) {
    if (seed) {
      this.replaceAll(seed);
    }
  }

  replaceAll(seed: Partial<GovernanceSeed>): void {
    this.approvals.clear();
    this.approvalDecisions.clear();
    this.qualityChecks.clear();
    this.complianceChecks.clear();

    seed.approvals?.forEach((item) => this.approvals.set(item.id, clone(item)));
    seed.approvalDecisions?.forEach((item) => this.appendApprovalDecision(item));
    seed.qualityChecks?.forEach((item) => this.qualityChecks.set(item.id, clone(item)));
    seed.complianceChecks?.forEach((item) => this.complianceChecks.set(item.id, clone(item)));
  }

  listApprovals(filters: ApprovalFilters = {}): HumanApproval[] {
    return this.filterItems(Array.from(this.approvals.values()), filters).sort((left, right) => {
      const statusDiff = approvalStatusOrder[left.status] - approvalStatusOrder[right.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      const dateDiff = right.requestedAt.localeCompare(left.requestedAt);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return left.id.localeCompare(right.id);
    });
  }

  getApproval(id: ID): HumanApproval | undefined {
    return this.cloneFromMap(this.approvals, id);
  }

  upsertApproval(approval: HumanApproval): void {
    this.approvals.set(approval.id, clone(approval));
  }

  listApprovalDecisions(approvalId: ID): ApprovalDecision[] {
    return this.cloneDecisionList(this.approvalDecisions.get(approvalId) ?? []);
  }

  appendApprovalDecision(decision: ApprovalDecision): void {
    const current = this.approvalDecisions.get(decision.approvalId) ?? [];
    current.push(clone(decision));
    current.sort((left, right) => {
      const dateDiff = left.decidedAt.localeCompare(right.decidedAt);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return left.id.localeCompare(right.id);
    });
    this.approvalDecisions.set(decision.approvalId, current);
  }

  listQualityChecks(filters: QualityCheckFilters = {}): QualityCheck[] {
    return this.filterItems(Array.from(this.qualityChecks.values()), filters).sort(
      (left, right) => {
        const dateDiff = right.checkedAt.localeCompare(left.checkedAt);
        if (dateDiff !== 0) {
          return dateDiff;
        }

        return left.id.localeCompare(right.id);
      },
    );
  }

  getQualityCheck(id: ID): QualityCheck | undefined {
    return this.cloneFromMap(this.qualityChecks, id);
  }

  upsertQualityCheck(check: QualityCheck): void {
    this.qualityChecks.set(check.id, clone(check));
  }

  listComplianceChecks(filters: ComplianceCheckFilters = {}): ComplianceCheck[] {
    return this.filterItems(Array.from(this.complianceChecks.values()), filters).sort(
      (left, right) => {
        const dateDiff = right.checkedAt.localeCompare(left.checkedAt);
        if (dateDiff !== 0) {
          return dateDiff;
        }

        return left.id.localeCompare(right.id);
      },
    );
  }

  getComplianceCheck(id: ID): ComplianceCheck | undefined {
    return this.cloneFromMap(this.complianceChecks, id);
  }

  upsertComplianceCheck(check: ComplianceCheck): void {
    this.complianceChecks.set(check.id, clone(check));
  }

  private cloneFromMap<T>(map: Map<ID, T>, id: ID): T | undefined {
    const found = map.get(id);
    return found ? clone(found) : undefined;
  }

  private cloneDecisionList(decisions: ApprovalDecision[]): ApprovalDecision[] {
    return decisions.map((decision) => clone(decision));
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

export function createGovernanceRepository(seed?: Partial<GovernanceSeed>): GovernanceRepository {
  return new InMemoryGovernanceRepository(seed);
}
