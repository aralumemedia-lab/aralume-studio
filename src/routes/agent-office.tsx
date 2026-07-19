import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Bot, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import {
  describeCockpitsApiError,
  getAgentDefinitions,
  getAgentOfficeSnapshot,
} from "@/services/api-client";
import {
  Card,
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  SectionHeader,
} from "@/components/ui/data-card";
import { AgentStatusBadge, RiskBadge, WorkflowStatusBadge } from "@/components/status/badges";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import {
  formatCurrencyCents,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatRelative,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  AgentDefinition,
  AgentHandoff,
  AgentPhase,
  AgentRun,
  WorkflowRun,
} from "@/contracts/types";

export const Route = createFileRoute("/agent-office")({
  head: () => ({
    meta: [
      { title: "Escritório de Agentes — Aralume" },
      {
        name: "description",
        content:
          "Cockpit operacional dos agentes editoriais da Aralume: execução, handoffs, bloqueios e custos.",
      },
      { property: "og:title", content: "Escritório de Agentes — Aralume" },
      { property: "og:description", content: "Cockpit operacional multiagentes." },
    ],
  }),
  component: AgentOfficePage,
});

const PHASES: { key: AgentPhase; label: string }[] = [
  { key: "intelligence", label: "Inteligência" },
  { key: "research", label: "Pesquisa" },
  { key: "creation", label: "Criação" },
  { key: "production", label: "Produção" },
  { key: "validation", label: "Validação" },
  { key: "distribution", label: "Distribuição" },
  { key: "analysis", label: "Análise" },
];

function AgentOfficePage() {
  const { activeChannelId, activeChannel } = useChannelContext();
  const snapQ = useQuery({
    queryKey: ["office", activeChannelId],
    queryFn: () => getAgentOfficeSnapshot(activeChannelId),
  });
  const defsQ = useQuery({
    queryKey: ["agents", activeChannelId],
    queryFn: () => getAgentDefinitions(activeChannelId),
  });
  const [selectedAgentRunId, setSelectedAgentRunId] = useState<string | null>(null);

  const snap = snapQ.data?.data;
  const defs = defsQ.data?.data ?? [];
  const agents = snap?.agents ?? [];
  const handoffs = snap?.handoffs ?? [];
  const workflows = snap?.workflows ?? [];
  const blocked = snap?.blockedItems ?? [];

  const selectedAgentRun = agents.find((a) => a.id === selectedAgentRunId) ?? agents[0];

  const runningCount = agents.filter((a) => a.status === "running").length;
  const blockedCount = agents.filter((a) => a.status === "blocked").length;
  const failedCount = agents.filter((a) => a.status === "failed").length;
  const totalCost = agents.reduce((s, a) => s + a.costActualCents, 0);
  const avgDur =
    agents.filter((a) => a.durationSeconds).reduce((s, a) => s + (a.durationSeconds ?? 0), 0) /
    Math.max(1, agents.filter((a) => a.durationSeconds).length);

  return (
    <div>
      <PageHeader
        eyebrow="Operação · Multiagentes"
        title="Escritório de Agentes"
        description={`Cockpit em tempo quase real da fábrica editorial. ${activeChannel ? `Contexto: ${activeChannel.name}.` : "Contexto: todos os canais."}`}
      />

      <div className="px-4 pt-4">
        {snapQ.isLoading || defsQ.isLoading ? (
          <LoadingState label="Carregando escritorio de agentes" />
        ) : snapQ.error || defsQ.error ? (
          <ErrorState
            message={describeCockpitsApiError(snapQ.error ?? defsQ.error)}
            onRetry={() => {
              void snapQ.refetch();
              void defsQ.refetch();
            }}
          />
        ) : null}
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          <KpiCard
            label="Agentes ativos"
            value={formatNumber(agents.length)}
            icon={<Bot size={14} />}
          />
          <KpiCard label="Executando" value={formatNumber(runningCount)} tone="info" />
          <KpiCard
            label="Bloqueados"
            value={formatNumber(blockedCount)}
            tone={blockedCount > 0 ? "critical" : undefined}
          />
          <KpiCard
            label="Handoffs ativos"
            value={formatNumber(
              handoffs.filter((h) => h.status === "pending" || h.status === "delivered").length,
            )}
          />
          <KpiCard
            label="Itens na fila"
            value={formatNumber(
              agents.filter((a) => a.status === "idle" || a.status === "waiting_input").length,
            )}
          />
          <KpiCard
            label="Falhas"
            value={formatNumber(failedCount)}
            tone={failedCount > 0 ? "warning" : undefined}
          />
          <KpiCard label="Custo acumulado" value={formatCurrencyCents(totalCost)} />
          <KpiCard label="Tempo médio" value={formatDuration(avgDur)} />
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 xl:col-span-9 space-y-4">
            <Card padded={false}>
              <div className="p-4 pb-2">
                <SectionHeader
                  title="Board de agentes por fase"
                  description="Cada coluna representa uma fase do pipeline editorial. Os cards mostram execução em curso."
                />
              </div>
              <div className="overflow-x-auto scrollbar-thin px-4 pb-4">
                <div
                  className="grid gap-3 min-w-[1200px]"
                  style={{ gridTemplateColumns: `repeat(${PHASES.length}, minmax(180px, 1fr))` }}
                >
                  {PHASES.map((p) => (
                    <PhaseColumn
                      key={p.key}
                      phase={p}
                      defs={defs.filter((d) => d.phase === p.key)}
                      agents={agents}
                      onSelect={setSelectedAgentRunId}
                      selectedId={selectedAgentRun?.id}
                    />
                  ))}
                </div>
              </div>
            </Card>

            <Card padded={false}>
              <div className="p-4 pb-2">
                <SectionHeader
                  title="Handoffs recentes"
                  description="Entregas de artefatos entre agentes."
                />
              </div>
              <CompactTable<AgentHandoff>
                columns={handoffColumns(defs)}
                rows={handoffs}
                empty="Sem handoffs no canal ativo."
                className="border-0 rounded-none"
              />
            </Card>

            <Card padded={false}>
              <div className="p-4 pb-2">
                <SectionHeader
                  title="Workflows em execução"
                  description="Timeline consolidada de execução."
                />
              </div>
              <CompactTable<WorkflowRun>
                columns={workflowCols}
                rows={workflows}
                empty="Nenhum workflow em execução."
                className="border-0 rounded-none"
              />
            </Card>
          </div>

          <div className="col-span-12 xl:col-span-3 space-y-4">
            <Card>
              <SectionHeader
                title="Detalhe do agente"
                description="Selecione um card do board para inspecionar."
              />
              {selectedAgentRun ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                      Agente
                    </div>
                    <div className="text-sm font-semibold">{selectedAgentRun.agentName}</div>
                    <div className="text-[11.5px] text-muted-foreground">
                      {selectedAgentRun.currentTask}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <AgentStatusBadge status={selectedAgentRun.status} />
                      <RiskBadge level={selectedAgentRun.riskLevel} />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-[11.5px]">
                    <Row label="Entrada" value={selectedAgentRun.inputSummary} />
                    <Row label="Saída" value={selectedAgentRun.outputSummary ?? "—"} />
                    <Row label="Modelo" value={selectedAgentRun.modelName ?? "—"} />
                    <Row label="Provedor" value={selectedAgentRun.providerName ?? "—"} />
                    <Row
                      label="Custo estimado"
                      value={formatCurrencyCents(selectedAgentRun.costEstimateCents)}
                    />
                    <Row
                      label="Custo atual"
                      value={formatCurrencyCents(selectedAgentRun.costActualCents)}
                    />
                    <Row
                      label="Duração"
                      value={
                        selectedAgentRun.durationSeconds
                          ? formatDuration(selectedAgentRun.durationSeconds)
                          : "—"
                      }
                    />
                    <Row label="Iniciado" value={formatDateTime(selectedAgentRun.startedAt)} />
                    <Row
                      label="Última atividade"
                      value={formatRelative(selectedAgentRun.lastActivityAt)}
                    />
                  </div>
                  <div>
                    <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground mb-1">
                      Progresso
                    </div>
                    <ProgressBar
                      value={selectedAgentRun.progressPercent}
                      tone={selectedAgentRun.status === "blocked" ? "critical" : "info"}
                    />
                  </div>
                  {selectedAgentRun.errorMessage && (
                    <div className="rounded-sm border border-critical-soft bg-critical-soft/40 px-2.5 py-2 text-[11.5px] text-critical">
                      {selectedAgentRun.errorMessage}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState title="Nenhum agente selecionado" />
              )}
            </Card>

            <Card padded={false}>
              <div className="p-4 pb-2">
                <SectionHeader
                  title="Bloqueios"
                  description="Itens travados aguardando decisão ou correção."
                  action={<ShieldAlert size={14} className="text-warning" />}
                />
              </div>
              <div className="divide-y divide-border">
                {blocked.map((b) => (
                  <div key={b.id} className="px-4 py-2.5">
                    <div className="text-[12px] font-medium truncate">{b.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{b.reason}</div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <RiskBadge level={b.riskLevel} />
                      <span className="text-[10.5px] text-muted-foreground">
                        {formatRelative(b.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
                {blocked.length === 0 && (
                  <div className="p-4">
                    <EmptyState title="Nenhum bloqueio ativo" />
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right text-foreground/90 truncate max-w-[65%]">{value}</span>
    </div>
  );
}

function PhaseColumn({
  phase,
  defs,
  agents,
  onSelect,
  selectedId,
}: {
  phase: { key: AgentPhase; label: string };
  defs: AgentDefinition[];
  agents: AgentRun[];
  onSelect: (id: string) => void;
  selectedId?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-muted">
      <div className="px-2.5 py-2 border-b border-border flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
          {phase.label}
        </span>
        <span className="text-[10.5px] text-muted-foreground tabular-nums">{defs.length}</span>
      </div>
      <div className="p-2 space-y-2">
        {defs.map((def) => {
          const run = agents.find((a) => a.agentId === def.id);
          return (
            <button
              key={def.id}
              onClick={() => run && onSelect(run.id)}
              disabled={!run}
              className={cn(
                "w-full text-left rounded-sm border bg-surface px-2.5 py-2 transition-colors",
                run
                  ? "border-border hover:border-primary/50 hover:bg-accent/30"
                  : "border-dashed border-border/70 opacity-60",
                selectedId === run?.id && "border-primary/60 bg-accent/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[12px] font-medium truncate">{def.name}</div>
                  <div className="text-[10.5px] text-muted-foreground truncate">
                    {def.description}
                  </div>
                </div>
              </div>
              {run ? (
                <>
                  <div className="mt-2 text-[10.5px] text-muted-foreground truncate">
                    {run.currentTask}
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar
                      value={run.progressPercent}
                      tone={
                        run.status === "blocked"
                          ? "critical"
                          : run.status === "failed"
                            ? "critical"
                            : run.status === "waiting_input" || run.status === "waiting_approval"
                              ? "attention"
                              : "info"
                      }
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <AgentStatusBadge status={run.status} />
                    <span className="text-[10.5px] tabular-nums text-muted-foreground">
                      {formatCurrencyCents(run.costActualCents)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="mt-2 text-[10.5px] text-muted-foreground">Ocioso</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const handoffColumns = (defs: AgentDefinition[]): Column<AgentHandoff>[] => {
  const nameOf = (id: string) => defs.find((d) => d.id === id)?.name ?? id;
  return [
    {
      key: "flow",
      header: "Fluxo",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-[12px]">
          <span className="font-medium">{nameOf(r.fromAgentId)}</span>
          <ArrowRight size={12} className="text-muted-foreground" />
          <span className="font-medium">{nameOf(r.toAgentId)}</span>
        </span>
      ),
    },
    {
      key: "artifact",
      header: "Artefato",
      render: (r) => <span className="text-muted-foreground">{r.artifactType}</span>,
    },
    { key: "title", header: "Título", render: (r) => <span className="truncate">{r.title}</span> },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span
          className={cn(
            "text-[11px] uppercase tracking-wide",
            r.status === "delivered"
              ? "text-ok"
              : r.status === "blocked"
                ? "text-critical"
                : "text-attention",
          )}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "at",
      header: "Criado",
      render: (r) => <span className="text-muted-foreground">{formatRelative(r.createdAt)}</span>,
    },
  ];
};

const workflowCols: Column<WorkflowRun>[] = [
  {
    key: "title",
    header: "Workflow",
    render: (r) => <span className="font-medium truncate">{r.title}</span>,
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
    header: "Atividade",
    render: (r) => (
      <span className="text-muted-foreground">{formatRelative(r.lastActivityAt)}</span>
    ),
  },
];
