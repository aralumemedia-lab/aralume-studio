import { cn } from "@/lib/utils";
import type {
  AgentStatus,
  ApprovalStatus,
  ChannelStatus,
  ComplianceStatus,
  ContentStatus,
  CostStatus,
  PublicationStatus,
  RiskLevel,
  WorkflowStatus,
} from "@/contracts/status";

type Tone =
  | "neutral"
  | "info"
  | "ok"
  | "attention"
  | "warning"
  | "critical"
  | "muted";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground border-border",
  info: "bg-info-soft text-info border-transparent",
  ok: "bg-ok-soft text-ok border-transparent",
  attention: "bg-attention-soft text-attention border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
  critical: "bg-critical-soft text-critical border-transparent",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
  dot,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10.5px] font-medium leading-none uppercase tracking-wide",
        toneStyles[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", {
            "bg-current": true,
          })}
        />
      )}
      {children}
    </span>
  );
}

// --------- specific mappers ----------
const channelLabel: Record<ChannelStatus, { label: string; tone: Tone }> = {
  active: { label: "Ativo", tone: "ok" },
  paused: { label: "Pausado", tone: "muted" },
  draft: { label: "Rascunho", tone: "info" },
  archived: { label: "Arquivado", tone: "muted" },
  blocked: { label: "Bloqueado", tone: "critical" },
  warning: { label: "Atenção", tone: "warning" },
};
export function ChannelStatusBadge({ status }: { status: ChannelStatus }) {
  const s = channelLabel[status];
  return <StatusBadge tone={s.tone} dot>{s.label}</StatusBadge>;
}

const workflowLabel: Record<WorkflowStatus, { label: string; tone: Tone }> = {
  queued: { label: "Na fila", tone: "muted" },
  running: { label: "Executando", tone: "info" },
  waiting: { label: "Aguardando", tone: "attention" },
  waiting_approval: { label: "Aguarda aprovação", tone: "attention" },
  completed: { label: "Concluído", tone: "ok" },
  failed: { label: "Falhou", tone: "critical" },
  blocked: { label: "Bloqueado", tone: "critical" },
  retrying: { label: "Retentando", tone: "warning" },
};
export function WorkflowStatusBadge({ status }: { status: WorkflowStatus }) {
  const s = workflowLabel[status];
  return <StatusBadge tone={s.tone} dot>{s.label}</StatusBadge>;
}

const agentLabel: Record<AgentStatus, { label: string; tone: Tone }> = {
  idle: { label: "Ocioso", tone: "muted" },
  running: { label: "Executando", tone: "info" },
  waiting_input: { label: "Aguarda entrada", tone: "attention" },
  waiting_approval: { label: "Aguarda aprovação", tone: "attention" },
  blocked: { label: "Bloqueado", tone: "critical" },
  failed: { label: "Falhou", tone: "critical" },
  completed: { label: "Concluído", tone: "ok" },
};
export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const s = agentLabel[status];
  return <StatusBadge tone={s.tone} dot>{s.label}</StatusBadge>;
}

const riskLabel: Record<RiskLevel, { label: string; tone: Tone }> = {
  ok: { label: "OK", tone: "ok" },
  attention: { label: "Atenção", tone: "attention" },
  warning: { label: "Alerta", tone: "warning" },
  critical: { label: "Crítico", tone: "critical" },
  blocked: { label: "Bloqueado", tone: "critical" },
};
export function RiskBadge({ level }: { level: RiskLevel }) {
  const s = riskLabel[level];
  return <StatusBadge tone={s.tone} dot>{s.label}</StatusBadge>;
}

const costLabel: Record<CostStatus, { label: string; tone: Tone }> = {
  healthy: { label: "Saudável", tone: "ok" },
  attention: { label: "Atenção", tone: "attention" },
  exceeded: { label: "Excedido", tone: "critical" },
  not_configured: { label: "Não configurado", tone: "muted" },
};
export function CostBadge({ status }: { status: CostStatus }) {
  const s = costLabel[status];
  return <StatusBadge tone={s.tone}>{s.label}</StatusBadge>;
}

const pubLabel: Record<PublicationStatus, { label: string; tone: Tone }> = {
  not_connected: { label: "Sem conexão", tone: "muted" },
  authenticated: { label: "Conectado", tone: "ok" },
  token_expired: { label: "Token expirado", tone: "warning" },
  draft: { label: "Rascunho", tone: "info" },
  scheduled: { label: "Agendado", tone: "info" },
  published: { label: "Publicado", tone: "ok" },
  failed: { label: "Falhou", tone: "critical" },
};
export function PublicationStatusBadge({ status }: { status: PublicationStatus }) {
  const s = pubLabel[status];
  return <StatusBadge tone={s.tone} dot>{s.label}</StatusBadge>;
}

const complianceLabel: Record<ComplianceStatus, { label: string; tone: Tone }> = {
  approved: { label: "Aprovado", tone: "ok" },
  attention: { label: "Atenção", tone: "attention" },
  rejected: { label: "Rejeitado", tone: "critical" },
  blocked: { label: "Bloqueado", tone: "critical" },
  needs_human_review: { label: "Revisão humana", tone: "warning" },
};
export function ComplianceStatusBadge({ status }: { status: ComplianceStatus }) {
  const s = complianceLabel[status];
  return <StatusBadge tone={s.tone} dot>{s.label}</StatusBadge>;
}

const approvalLabel: Record<ApprovalStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pendente", tone: "attention" },
  approved: { label: "Aprovado", tone: "ok" },
  rejected: { label: "Rejeitado", tone: "critical" },
  changes_requested: { label: "Ajustes", tone: "warning" },
  blocked: { label: "Bloqueado", tone: "critical" },
};
export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const s = approvalLabel[status];
  return <StatusBadge tone={s.tone} dot>{s.label}</StatusBadge>;
}

const contentLabel: Record<ContentStatus, { label: string; tone: Tone }> = {
  idea: { label: "Pauta", tone: "muted" },
  research: { label: "Pesquisa", tone: "info" },
  script: { label: "Roteiro", tone: "info" },
  visual_plan: { label: "Plano visual", tone: "info" },
  narration: { label: "Narração", tone: "info" },
  editing: { label: "Edição", tone: "info" },
  clips: { label: "Cortes", tone: "info" },
  quality_check: { label: "Qualidade", tone: "attention" },
  compliance_check: { label: "Conformidade", tone: "attention" },
  waiting_approval: { label: "Aguarda aprovação", tone: "attention" },
  approved: { label: "Aprovado", tone: "ok" },
  scheduled: { label: "Agendado", tone: "info" },
  published: { label: "Publicado", tone: "ok" },
  failed: { label: "Falhou", tone: "critical" },
  blocked: { label: "Bloqueado", tone: "critical" },
};
export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  const s = contentLabel[status];
  return <StatusBadge tone={s.tone} dot>{s.label}</StatusBadge>;
}
