import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckSquare,
  Radio,
  Send,
  Wallet,
  Workflow,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context";
import {
  getAuditLogs,
  getDashboardSummary,
  getHumanApprovals,
  getPerformanceMetrics,
  getProductionItems,
  getPublicationJobs,
  getWorkflowRuns,
} from "@/services/api-client";
import { Card, CardHeader, EmptyState, KpiCard, SectionHeader } from "@/components/ui/data-card";
import { formatCurrencyCents, formatDateTime, formatNumber, formatRelative } from "@/lib/format";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import {
  ApprovalStatusBadge,
  ContentStatusBadge,
  RiskBadge,
  WorkflowStatusBadge,
} from "@/components/status/badges";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { HumanApproval, ProductionItem, PublicationJob, WorkflowRun } from "@/contracts/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Aralume" },
      {
        name: "description",
        content: "Visão executiva e operacional da fábrica editorial Aralume.",
      },
      { property: "og:title", content: "Dashboard — Aralume" },
      {
        property: "og:description",
        content: "Visão executiva multicanal com KPIs, aprovações, custos e workflows.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { activeChannelId, activeChannel } = useChannelContext();
  const summaryQ = useQuery({
    queryKey: ["dashboard", activeChannelId],
    queryFn: () => getDashboardSummary(activeChannelId),
  });
  const workflowsQ = useQuery({
    queryKey: ["wfs", activeChannelId],
    queryFn: () => getWorkflowRuns(activeChannelId),
  });
  const prodQ = useQuery({
    queryKey: ["prod", activeChannelId],
    queryFn: () => getProductionItems(activeChannelId),
  });
  const approvalsQ = useQuery({
    queryKey: ["appr", activeChannelId],
    queryFn: () => getHumanApprovals(activeChannelId),
  });
  const pubsQ = useQuery({
    queryKey: ["pubs", activeChannelId],
    queryFn: () => getPublicationJobs(activeChannelId),
  });
  const auditQ = useQuery({
    queryKey: ["audit", activeChannelId],
    queryFn: () => getAuditLogs(activeChannelId),
  });
  const metricsQ = useQuery({
    queryKey: ["me", activeChannelId],
    queryFn: () => getPerformanceMetrics(activeChannelId),
  });

  const s = summaryQ.data?.data;
  const productionRows = prodQ.data?.data ?? [];
  const workflowsRows = (workflowsQ.data?.data ?? []).slice(0, 6);
  const approvalRows = (approvalsQ.data?.data ?? []).filter((a) => a.status === "pending");
  const pubRows = (pubsQ.data?.data ?? []).filter(
    (p) => p.status === "scheduled" || p.status === "draft",
  );
  const audits = auditQ.data?.data ?? [];
  const metrics = metricsQ.data?.data ?? [];
  const criticalAudits = audits.filter((a) => a.status !== "success").slice(0, 5);

  const totalCostCents = s?.monthlyCostCents ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Operação"
        title="Dashboard"
        description={
          activeChannel
            ? `Visão operacional do canal ${activeChannel.name}. Todos os indicadores refletem o contexto do canal selecionado.`
            : "Visão consolidada de todos os canais operados pela plataforma Aralume."
        }
        actions={
          <>
            <span className="text-[11px] text-muted-foreground">
              Atualizado{" "}
              {summaryQ.dataUpdatedAt
                ? formatRelative(new Date(summaryQ.dataUpdatedAt).toISOString())
                : "agora"}
            </span>
          </>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          <KpiCard
            icon={<Radio size={14} />}
            label="Canais ativos"
            value={formatNumber(s?.activeChannels ?? 0)}
            hint="Ativos + em atenção"
          />
          <KpiCard
            icon={<Workflow size={14} />}
            label="Workflows ativos"
            value={formatNumber(s?.activeWorkflows ?? 0)}
            hint="Em execução ou fila"
          />
          <KpiCard
            icon={<Bot size={14} />}
            label="Agentes em execução"
            value={formatNumber(s?.runningAgents ?? 0)}
            tone="info"
            hint="No momento"
          />
          <KpiCard
            icon={<CheckSquare size={14} />}
            label="Aprovações pendentes"
            value={formatNumber(s?.pendingApprovals ?? 0)}
            tone={s && s.pendingApprovals > 3 ? "attention" : undefined}
          />
          <KpiCard
            icon={<Send size={14} />}
            label="Publicações agendadas"
            value={formatNumber(s?.scheduledPublications ?? 0)}
          />
          <KpiCard
            icon={<Wallet size={14} />}
            label="Custo do mês"
            value={formatCurrencyCents(totalCostCents)}
            hint="Consolidado"
          />
          <KpiCard
            icon={<XCircle size={14} />}
            label="Falhas recentes"
            value={formatNumber(s?.recentFailures ?? 0)}
            tone={s && s.recentFailures > 0 ? "warning" : undefined}
          />
          <KpiCard
            icon={<AlertTriangle size={14} />}
            label="Alertas críticos"
            value={formatNumber(s?.criticalAlerts ?? 0)}
            tone={s && s.criticalAlerts > 0 ? "critical" : undefined}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <Card>
              <SectionHeader
                title="Produção por status"
                description="Conteúdos em execução, agrupados pela etapa atual no fluxo editorial."
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(s?.productionByStatus ?? []).map((row) => (
                  <div
                    key={row.status}
                    className="rounded-sm border border-border bg-surface-muted px-2.5 py-2"
                  >
                    <div className="text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                      {row.status}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-lg font-semibold tabular-nums">{row.count}</span>
                      <ContentStatusBadge status={row.status} />
                    </div>
                  </div>
                ))}
                {(!s || s.productionByStatus.length === 0) && (
                  <EmptyState
                    title="Sem produção no canal ativo"
                    description="Selecione outro canal ou crie uma pauta."
                  />
                )}
              </div>
            </Card>

            <Card padded={false}>
              <div className="p-4 pb-3">
                <SectionHeader
                  title="Workflows recentes"
                  description="Últimas execuções por fluxo editorial."
                />
              </div>
              <CompactTable<WorkflowRun>
                columns={workflowColumns}
                rows={workflowsRows}
                empty="Nenhum workflow em execução."
                className="border-0 rounded-none"
              />
            </Card>

            <Card padded={false}>
              <div className="p-4 pb-3">
                <SectionHeader
                  title="Fila de produção"
                  description="Itens em movimento pelo pipeline editorial multiagentes."
                />
              </div>
              <CompactTable<ProductionItem>
                columns={productionColumns}
                rows={productionRows.slice(0, 7)}
                empty="Sem itens na fila."
                className="border-0 rounded-none"
              />
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <SectionHeader
                title="Custo por canal"
                description="Consolidado do período em curso."
              />
              <ul className="space-y-2">
                {(s?.costByChannel ?? []).map((c) => {
                  const max = Math.max(1, ...(s?.costByChannel ?? []).map((x) => x.amountCents));
                  return (
                    <li key={c.channelId}>
                      <div className="flex items-center justify-between text-[11.5px] mb-1">
                        <span className="truncate text-foreground">{c.channelName}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatCurrencyCents(c.amountCents)}
                        </span>
                      </div>
                      <ProgressBar value={(c.amountCents / max) * 100} tone="info" />
                    </li>
                  );
                })}
                {(!s || s.costByChannel.length === 0) && (
                  <EmptyState title="Sem custos no período" />
                )}
              </ul>
            </Card>

            <Card padded={false}>
              <div className="p-4 pb-2">
                <SectionHeader
                  title="Aprovações pendentes"
                  description="Itens que aguardam decisão humana."
                />
              </div>
              <div className="divide-y divide-border">
                {approvalRows.slice(0, 5).map((a: HumanApproval) => (
                  <div key={a.id} className="px-4 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-medium truncate">{a.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {formatRelative(a.createdAt)} · {formatCurrencyCents(a.costActualCents)}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <RiskBadge level={a.riskLevel} />
                        <ApprovalStatusBadge status={a.status} />
                      </div>
                    </div>
                  </div>
                ))}
                {approvalRows.length === 0 && (
                  <div className="p-4">
                    <EmptyState title="Nenhuma aprovação pendente" />
                  </div>
                )}
              </div>
            </Card>

            <Card padded={false}>
              <div className="p-4 pb-2">
                <SectionHeader
                  title="Alertas críticos"
                  description="Eventos operacionais recentes."
                />
              </div>
              <div className="divide-y divide-border">
                {criticalAudits.map((a) => (
                  <div key={a.id} className="px-4 py-2.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        size={13}
                        className={a.status === "failed" ? "text-critical" : "text-warning"}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-medium">{a.message}</div>
                        <div className="text-[10.5px] text-muted-foreground mt-0.5">
                          {a.actorName} · {formatRelative(a.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {criticalAudits.length === 0 && (
                  <div className="p-4">
                    <EmptyState title="Sem alertas críticos" />
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <SectionHeader
                title="Publicações previstas"
                description="Próximos itens agendados/rascunhos."
              />
              <ul className="space-y-2 text-[12px]">
                {pubRows.slice(0, 5).map((p: PublicationJob) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{p.title}</div>
                      <div className="text-[10.5px] text-muted-foreground">
                        {p.platform.toUpperCase()} ·{" "}
                        {p.scheduledAt ? formatDateTime(p.scheduledAt) : "sem agendamento"}
                      </div>
                    </div>
                    <ContentStatusBadge status={p.status === "scheduled" ? "scheduled" : "idea"} />
                  </li>
                ))}
                {pubRows.length === 0 && <EmptyState title="Nada agendado" />}
              </ul>
            </Card>

            <Card>
              <SectionHeader
                title="Desempenho recente"
                description="Últimas leituras por plataforma."
              />
              <ul className="text-[12px] space-y-2">
                {metrics.slice(0, 4).map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{m.platform?.toUpperCase()}</div>
                      <div className="text-[10.5px] text-muted-foreground">
                        Retenção {(m.completionRate * 100).toFixed(0)}% · {formatNumber(m.views)}{" "}
                        views
                      </div>
                    </div>
                    <span className="tabular-nums text-muted-foreground">
                      {formatNumber(m.followersGained)} novos
                    </span>
                  </li>
                ))}
                {metrics.length === 0 && <EmptyState title="Sem métricas no período" />}
              </ul>
            </Card>
          </div>
        </div>

        <Card>
          <SectionHeader
            title="Atividade dos agentes"
            description="Fluxo de execução em tempo quase real da fábrica editorial."
            action={<Activity size={14} className="text-muted-foreground" />}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {audits.slice(0, 6).map((a) => (
              <div
                key={a.id}
                className="rounded-sm border border-border bg-surface-muted px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                    {a.actorType}
                  </span>
                  <span className="text-[10.5px] text-muted-foreground">
                    {formatRelative(a.createdAt)}
                  </span>
                </div>
                <div className="mt-1 text-[12px] font-medium truncate">{a.actorName}</div>
                <div className="text-[11.5px] text-muted-foreground line-clamp-2">{a.message}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const workflowColumns: Column<WorkflowRun>[] = [
  {
    key: "title",
    header: "Workflow",
    render: (r) => <span className="font-medium truncate">{r.title}</span>,
  },
  {
    key: "type",
    header: "Tipo",
    render: (r) => <span className="text-muted-foreground">{r.workflowType}</span>,
  },
  { key: "status", header: "Status", render: (r) => <WorkflowStatusBadge status={r.status} /> },
  {
    key: "prog",
    header: "Progresso",
    width: "160px",
    render: (r) => (
      <div className="flex items-center gap-2">
        <ProgressBar
          value={r.progressPercent}
          tone={r.status === "blocked" || r.status === "failed" ? "critical" : "info"}
        />
        <span className="tabular-nums text-[11px] w-8 text-right">{r.progressPercent}%</span>
      </div>
    ),
  },
  { key: "risk", header: "Risco", render: (r) => <RiskBadge level={r.riskLevel} /> },
  {
    key: "cost",
    header: "Custo",
    render: (r) => (
      <span className="tabular-nums text-muted-foreground">
        {formatCurrencyCents(r.costActualCents)}
      </span>
    ),
  },
  {
    key: "at",
    header: "Última atividade",
    render: (r) => (
      <span className="text-muted-foreground">{formatRelative(r.lastActivityAt)}</span>
    ),
  },
];

const productionColumns: Column<ProductionItem>[] = [
  {
    key: "title",
    header: "Conteúdo",
    render: (r) => <span className="font-medium truncate">{r.title}</span>,
  },
  { key: "status", header: "Etapa", render: (r) => <ContentStatusBadge status={r.status} /> },
  {
    key: "agent",
    header: "Agente atual",
    render: (r) => <span className="text-muted-foreground">{r.currentAgentName ?? "—"}</span>,
  },
  {
    key: "prog",
    header: "Progresso",
    width: "150px",
    render: (r) => (
      <div className="flex items-center gap-2">
        <ProgressBar
          value={r.progressPercent}
          tone={r.riskLevel === "critical" || r.riskLevel === "blocked" ? "critical" : "info"}
        />
        <span className="tabular-nums text-[11px] w-8 text-right">{r.progressPercent}%</span>
      </div>
    ),
  },
  {
    key: "next",
    header: "Próxima ação",
    render: (r) => <span className="text-muted-foreground truncate">{r.nextAction}</span>,
  },
  { key: "risk", header: "Risco", render: (r) => <RiskBadge level={r.riskLevel} /> },
  {
    key: "cost",
    header: "Custo",
    render: (r) => (
      <span className="tabular-nums text-muted-foreground">
        {formatCurrencyCents(r.costActualCents)}
      </span>
    ),
  },
];
