export type ID = string;
export type ISODate = string;

export type GovernanceEntityType =
  | "content_idea"
  | "production_item"
  | "research_session"
  | "script"
  | "visual_plan";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested" | "blocked";
export type QualityCheckStatus = "pending" | "passed" | "attention" | "blocked";
export type ComplianceStatus =
  | "approved"
  | "attention"
  | "rejected"
  | "blocked"
  | "needs_human_review";
export type RiskLevel = "ok" | "attention" | "warning" | "critical" | "blocked";

export type GovernanceTargetSnapshot = {
  entityType: GovernanceEntityType;
  entityId: ID;
  channelId: ID;
  title: string;
  summary: string;
  status: string;
  riskLevel: RiskLevel;
};

export type QualityCheckResult = "pass" | "attention" | "blocked";

export type QualityCheckItem = {
  code: string;
  name: string;
  result: QualityCheckResult;
  severity: RiskLevel;
  message: string;
  blocking: boolean;
  metadata: Record<string, unknown>;
};

export type ComplianceFinding = {
  code: string;
  name: string;
  severity: RiskLevel;
  message: string;
  blocking: boolean;
  metadata: Record<string, unknown>;
};

export type HumanApproval = {
  id: ID;
  channelId: ID;
  entityType: GovernanceEntityType;
  entityId: ID;
  title: string;
  status: ApprovalStatus;
  riskLevel: RiskLevel;
  summary: string;
  requestedAt: ISODate;
  requestedBy: string;
  decidedAt?: ISODate;
  decidedBy?: string;
  decisionReason?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
  targetSnapshot: GovernanceTargetSnapshot;
  qualityCheckId?: ID;
  complianceCheckId?: ID;
  latestDecisionId?: ID;
};

export type ApprovalDecision = {
  id: ID;
  approvalId: ID;
  previousStatus: ApprovalStatus;
  nextStatus: ApprovalStatus;
  decision: "approve" | "reject" | "request_changes" | "block";
  justification: string;
  actor: string;
  decidedAt: ISODate;
  createdAt: ISODate;
};

export type QualityCheck = {
  id: ID;
  channelId: ID;
  entityType: GovernanceEntityType;
  entityId: ID;
  status: QualityCheckStatus;
  score: number;
  checks: QualityCheckItem[];
  findings: QualityCheckItem[];
  blockingFindings: QualityCheckItem[];
  checkedAt: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
  targetSnapshot: GovernanceTargetSnapshot;
  summary?: string;
};

export type ComplianceCheck = {
  id: ID;
  channelId: ID;
  entityType: GovernanceEntityType;
  entityId: ID;
  status: ComplianceStatus;
  riskLevel: RiskLevel;
  findings: ComplianceFinding[];
  blockingFindings: ComplianceFinding[];
  checkedAt: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
  targetSnapshot: GovernanceTargetSnapshot;
  requiresHumanReview: boolean;
};

export type GovernanceSeed = {
  approvals: HumanApproval[];
  approvalDecisions: ApprovalDecision[];
  qualityChecks: QualityCheck[];
  complianceChecks: ComplianceCheck[];
};

export type ApprovalFilters = {
  channelId?: ID;
  status?: ApprovalStatus;
  riskLevel?: RiskLevel;
  entityType?: GovernanceEntityType;
  entityId?: ID;
};

export type QualityCheckFilters = {
  channelId?: ID;
  status?: QualityCheckStatus;
  riskLevel?: RiskLevel;
  entityType?: GovernanceEntityType;
  entityId?: ID;
};

export type ComplianceCheckFilters = {
  channelId?: ID;
  status?: ComplianceStatus;
  riskLevel?: RiskLevel;
  entityType?: GovernanceEntityType;
  entityId?: ID;
};

export type ApprovalCreateInput = {
  channelId: ID;
  entityType: GovernanceEntityType;
  entityId: ID;
  requestedBy: string;
  title?: string;
  summary?: string;
};

export type ApprovalDecisionInput = {
  channelId: ID;
  decidedBy: string;
  decisionReason: string;
};

export type QualityCheckCreateInput = {
  channelId: ID;
  entityType: GovernanceEntityType;
  entityId: ID;
  requestedBy?: string;
};

export type ComplianceCheckCreateInput = {
  channelId: ID;
  entityType: GovernanceEntityType;
  entityId: ID;
  requestedBy?: string;
};

export type GovernanceRepository = {
  replaceAll(seed: Partial<GovernanceSeed>): void;
  listApprovals(filters?: ApprovalFilters): HumanApproval[];
  getApproval(id: ID): HumanApproval | undefined;
  upsertApproval(approval: HumanApproval): void;
  listApprovalDecisions(approvalId: ID): ApprovalDecision[];
  appendApprovalDecision(decision: ApprovalDecision): void;
  listQualityChecks(filters?: QualityCheckFilters): QualityCheck[];
  getQualityCheck(id: ID): QualityCheck | undefined;
  upsertQualityCheck(check: QualityCheck): void;
  listComplianceChecks(filters?: ComplianceCheckFilters): ComplianceCheck[];
  getComplianceCheck(id: ID): ComplianceCheck | undefined;
  upsertComplianceCheck(check: ComplianceCheck): void;
};
