import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ShieldCheck, AlertTriangle, Ban, CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { CostBadge, StatusBadge } from "@/components/status/badges";
import {
  Card,
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  SectionHeader,
} from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrencyCents, formatPercent, formatNumber } from "@/lib/format";
import { describeOperationalModesApiError, getOperationalModes } from "@/services/costs-api";
import type {
  OperationalModeDecision,
  OperationalModePolicy,
  OperationalModeSnapshot,
} from "@/contracts/types";

type ActionRow = OperationalModeDecision & { id: string };

export const Route = createFileRoute("/administration")({
  head: () => ({
    meta: [
      { title: "Administracao - Aralume" },
      {
        name: "description",
        content: "Policy global, policy do canal e bloqueios operacionais do modo demo.",
      },
    ],
  }),
  component: AdministrationPage,
});

function AdministrationPage() {
  const { activeChannelId, activeChannel } = useChannelContext();
  const modesQ = useQuery({
    queryKey: ["operational-modes", activeChannelId],
    queryFn: () => getOperationalModes(activeChannelId),
  });

  const snapshot = modesQ.data?.data;

  if (modesQ.isLoading) {
    return (
      <div>
        <PageHeader
          eyebrow="Plataforma"
          title="Administracao"
          description={buildDescription(activeChannel?.name)}
        />
        <div className="p-6">
          <LoadingState label="Carregando policy operacional" />
        </div>
      </div>
    );
  }

  if (modesQ.error) {
    return (
      <div>
        <PageHeader
          eyebrow="Plataforma"
          title="Administracao"
          description={buildDescription(activeChannel?.name)}
        />
        <div className="p-6">
          <ErrorState message={describeOperationalModesApiError(modesQ.error)} />
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div>
        <PageHeader
          eyebrow="Plataforma"
          title="Administracao"
          description={buildDescription(activeChannel?.name)}
        />
        <div className="p-6">
          <EmptyState
            title="Sem policy operacional"
            description="Nao foi possivel recuperar a policy do recorte atual."
            icon={<ShieldCheck size={18} />}
          />
        </div>
      </div>
    );
  }

  const allowedRows = snapshot.allowedActions.map((decision) => ({ ...decision, id: decision.id }));
  const blockedRows = snapshot.blockedActions.map((decision) => ({ ...decision, id: decision.id }));
  const decisionColumns = decisionColumnsFactory();

  return (
    <div>
      <PageHeader
        eyebrow="Plataforma"
        title="Administracao"
        description={buildDescription(activeChannel?.name)}
      />

      <div className="p-6 space-y-6">
        {snapshot.effectivePolicy.mode === "demo" && (
          <Card className="border-critical-soft bg-critical-soft/35">
            <div className="flex items-start gap-3">
              <Ban className="mt-0.5 text-critical" size={16} />
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-critical">Modo demo ativo</div>
                <div className="text-xs text-critical/90">
                  IA real e publicacao real ficam bloqueadas por dominio, nao apenas pela UI.
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <KpiCard
            icon={<ShieldCheck size={14} />}
            label="Budget"
            value={
              snapshot.budgetConfigured
                ? formatCurrencyCents(snapshot.budgetCents)
                : "Nao configurado"
            }
            hint="Limite efetivo"
          />
          <KpiCard
            label="Consumo"
            value={formatCurrencyCents(snapshot.consumedCents)}
            hint={`${formatPercent(snapshot.consumptionPercent / 100, 1)} usado`}
          />
          <KpiCard
            label="Saldo"
            value={snapshot.budgetConfigured ? formatCurrencyCents(snapshot.remainingCents) : "N/A"}
            hint="Disponivel no recorte"
          />
          <KpiCard
            label="Status"
            value={<CostBadge status={snapshot.status} />}
            hint="Budget e consumo"
          />
          <KpiCard
            label="Decisoes"
            value={formatNumber(snapshot.allowedActions.length + snapshot.blockedActions.length)}
            hint="Avaliadas pelo dominio"
          />
        </div>

        <Card>
          <SectionHeader
            eyebrow="Policy"
            title="Global, canal e efetiva"
            description="A policy do canal nunca pode liberar o que a global bloqueia."
          />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <PolicyCard title="Global" policy={snapshot.globalPolicy} tone="info" />
            <PolicyCard
              title={snapshot.channelPolicy ? "Canal" : "Canal herdado"}
              policy={snapshot.channelPolicy ?? snapshot.effectivePolicy}
              tone={snapshot.channelPolicy ? "attention" : "muted"}
            />
            <PolicyCard title="Efetiva" policy={snapshot.effectivePolicy} tone="ok" />
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <SectionHeader
              eyebrow="Capacidades"
              title="Permitido e bloqueado"
              description="A decisao centralizada permite verificar o impacto do modo demo e das budgets."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CapabilityList
                title="Permitidas"
                icon={<CheckCircle2 size={15} />}
                rows={allowedRows}
                columns={decisionColumns}
              />
              <CapabilityList
                title="Bloqueadas"
                icon={<AlertTriangle size={15} />}
                rows={blockedRows}
                columns={decisionColumns}
              />
            </div>
          </Card>

          <Card>
            <SectionHeader
              eyebrow="Impacto"
              title="Modo demo e bloqueios"
              description="IA real e publicacao real sao bloqueadas pelo dominio nesta sprint."
            />
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-surface-muted/35 p-3">
                <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  Modo atual
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge tone={modeTone(snapshot.effectivePolicy.mode)} dot>
                    {snapshot.effectivePolicy.mode}
                  </StatusBadge>
                  <span className="text-xs text-muted-foreground">
                    {snapshot.effectivePolicy.mode === "demo"
                      ? "Operacoes reais bloqueadas."
                      : "Operacoes reais condicionadas pela policy efetiva."}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MiniStat label="Bloqueios" value={formatNumber(snapshot.blockedActions.length)} />
                <MiniStat label="Permitidas" value={formatNumber(snapshot.allowedActions.length)} />
              </div>

              <ProgressBar
                value={snapshot.consumptionPercent}
                tone={toneFromStatus(snapshot.status)}
                className="h-2"
              />
            </div>
          </Card>
        </div>

        <Card padded={false}>
          <div className="p-4 pb-2">
            <SectionHeader
              title="Decisoes permitidas"
              description="Amostra deterministica das acoes que o dominio liberou para o recorte."
            />
          </div>
          {allowedRows.length === 0 ? (
            <EmptyState
              title="Nenhuma acao permitida"
              description="O recorte atual nao possui acoes permitidas."
              icon={<CheckCircle2 size={18} />}
            />
          ) : (
            <CompactTable
              rows={allowedRows}
              columns={decisionColumns}
              className="border-0 rounded-none"
              empty="Sem decisoes permitidas."
            />
          )}
        </Card>

        <Card padded={false}>
          <div className="p-4 pb-2">
            <SectionHeader
              title="Decisoes bloqueadas"
              description="Cada bloqueio traz origem, motivo legivel e codigo deterministico."
            />
          </div>
          {blockedRows.length === 0 ? (
            <EmptyState
              title="Nenhuma acao bloqueada"
              description="O recorte atual nao possui bloqueios."
              icon={<AlertTriangle size={18} />}
            />
          ) : (
            <CompactTable
              rows={blockedRows}
              columns={decisionColumns}
              className="border-0 rounded-none"
              empty="Sem decisoes bloqueadas."
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function decisionColumnsFactory(): Column<ActionRow>[] {
  return [
    {
      key: "action",
      header: "Acao",
      render: (row) => <span className="font-mono text-[11.5px]">{row.action}</span>,
    },
    {
      key: "result",
      header: "Resultado",
      render: (row) => (
        <StatusBadge tone={row.allowed ? "ok" : "critical"} dot>
          {row.allowed ? "Permitida" : "Bloqueada"}
        </StatusBadge>
      ),
    },
    {
      key: "source",
      header: "Origem",
      render: (row) => <span className="text-muted-foreground">{row.policySource}</span>,
    },
    {
      key: "reason",
      header: "Motivo",
      render: (row) => <span className="text-muted-foreground">{row.reason}</span>,
    },
    {
      key: "code",
      header: "Codigo",
      render: (row) => <span className="font-mono text-[11px]">{row.decisionCode}</span>,
    },
  ];
}

function CapabilityList({
  title,
  icon,
  rows,
  columns,
}: {
  title: string;
  icon: ReactNode;
  rows: ActionRow[];
  columns: Column<ActionRow>[];
}) {
  return (
    <div className="rounded-md border border-border bg-surface-muted/25">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        {icon}
        {title}
      </div>
      <CompactTable
        rows={rows}
        columns={columns}
        className="border-0 rounded-none"
        empty="Sem itens."
      />
    </div>
  );
}

function PolicyCard({
  title,
  policy,
  tone,
}: {
  title: string;
  policy: OperationalModePolicy;
  tone: "info" | "attention" | "muted" | "ok";
}) {
  return (
    <div className="rounded-md border border-border bg-surface-muted/30 p-3 space-y-2 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{title}</div>
        <StatusBadge tone={tone === "muted" ? "muted" : tone} dot>
          {policy.mode}
        </StatusBadge>
      </div>
      <PolicyLine label="Scope" value={policy.scope} />
      <PolicyLine
        label="Budget"
        value={
          policy.budgetConfigured
            ? formatCurrencyCents(policy.monthlyBudgetLimitCents)
            : "Nao configurado"
        }
      />
      <PolicyLine label="IA real" value={policy.allowRealAi ? "Permitida" : "Bloqueada"} />
      <PolicyLine
        label="Publicacao"
        value={policy.allowExternalPublication ? "Permitida" : "Bloqueada"}
      />
      <PolicyLine
        label="Aprovacao humana"
        value={policy.requireHumanApproval ? "Obrigatoria" : "Opcional"}
      />
    </div>
  );
}

function PolicyLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-muted/30 p-3">
      <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-foreground break-words">{value}</div>
    </div>
  );
}

function buildDescription(channelName?: string): string {
  return channelName
    ? `Policy efetiva e bloqueios operacionais do canal ${channelName}.`
    : "Policy efetiva, bloqueios operacionais e budget da plataforma.";
}

function modeTone(mode: string) {
  if (mode === "demo") return "critical" as const;
  if (mode === "paused") return "warning" as const;
  if (mode === "restricted_production") return "attention" as const;
  if (mode === "local_test") return "info" as const;
  return "ok" as const;
}

function toneFromStatus(status: OperationalModeSnapshot["status"]) {
  if (status === "healthy") return "ok" as const;
  if (status === "attention") return "attention" as const;
  if (status === "exceeded") return "critical" as const;
  return "info" as const;
}
