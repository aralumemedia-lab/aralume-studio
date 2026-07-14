export type ChannelStatus = "active" | "paused" | "draft" | "archived" | "blocked" | "warning";

export type WorkflowStatus =
  | "queued"
  | "running"
  | "waiting"
  | "waiting_approval"
  | "completed"
  | "failed"
  | "blocked"
  | "retrying";

export type AgentStatus =
  "idle" | "running" | "waiting_input" | "waiting_approval" | "blocked" | "failed" | "completed";

export type RiskLevel = "ok" | "attention" | "warning" | "critical" | "blocked";

export type CostStatus = "healthy" | "attention" | "exceeded" | "not_configured";

export type PublicationStatus =
  | "not_connected"
  | "authenticated"
  | "token_expired"
  | "draft"
  | "scheduled"
  | "published"
  | "failed";

export type ComplianceStatus =
  "approved" | "attention" | "rejected" | "blocked" | "needs_human_review";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested" | "blocked";

export type QualityCheckStatus = "pending" | "passed" | "attention" | "blocked";

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

export type MediaAssetStatus =
  | "available"
  | "processing"
  | "failed"
  | "pending"
  | "blocked"
  | "invalid"
  | "corrupted"
  | "missing"
  | "replaced"
  | "archived";

export type MediaAssetOrigin =
  | "internal"
  | "generated"
  | "uploaded"
  | "licensed"
  | "demo"
  | "channel_provided"
  | "public_domain"
  | "external_authorized"
  | "unknown"
  | "prohibited";

export type MediaAssetLicenseStatus =
  | "known"
  | "verified"
  | "not_applicable"
  | "pending"
  | "unknown"
  | "confirmed"
  | "unconfirmed"
  | "restricted"
  | "attribution_required"
  | "blocked";
