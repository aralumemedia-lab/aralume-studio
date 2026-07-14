import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";

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
import { formatCurrencyCents, formatDateTime, formatPercent, formatNumber } from "@/lib/format";
import { describeCostsApiError, getCostEntries, getCostSummary } from "@/services/costs-api";
import type { CostBreakdownItem, CostChannelSummary, CostEntry } from "@/contracts/types";

type BreakdownRow = CostBreakdownItem & { id: string };

export const Route = createFileRoute("/costs")({
  head: () => ({
    meta: [
      { title: "Custos - Aralume" },
      { name: "description", content: "Custos operacionais, budget e status por canal." },
    ],
  }),
  component: CostsPage,
});

function CostsPage() {
  const { activeChannelId, activeChannel } = useChannelContext();
  const summaryQ = useQuery({
    queryKey: ["costs-summary", activeChannelId],
    queryFn: () => getCostSummary(activeChannelId),
  });
  const entriesQ = useQuery({
    queryKey: ["costs-entries", activeChannelId],
    queryFn: () => getCostEntries(activeChannelId),
  });

  const summary = summaryQ.data?.data;
  const entries = entriesQ.data?.data ?? [];
  const error = summaryQ.error ?? entriesQ.error;

  if (summaryQ.isLoading || entriesQ.isLoading) {
    return (
      <div>
        <PageHeader
          eyebrow="Governanca"
          title="Custos"
          description={buildDescription(activeChannel?.name)}
        />
        <div className="p-6">
          <LoadingState label="Carregando custos e budget" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          eyebrow="Governanca"
          title="Custos"
          description={buildDescription(activeChannel?.name)}
        />
        <div className="p-6">
          <ErrorState message={describeCostsApiError(error)} />
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div>
        <PageHeader
          eyebrow="Governanca"
          title="Custos"
          description={buildDescription(activeChannel?.name)}
        />
        <div className="p-6">
          <EmptyState
            title="Sem dados de custo"
            description="Nao ha custos para o recorte atual."
            icon={<Wallet size={18} />}
          />
        </div>
      </div>
    );
  }

  const budgetTone = toneFromStatus(summary.status);
  const statusLabel = labelFromStatus(summary.status);
  const channelRows = toChannelRows(summary.byChannel);
  const stageRows = toBreakdownRows(summary.byStage);
  const providerRows = toBreakdownRows(summary.byProvider);
  const contentRows = toBreakdownRows(summary.byContent);
  const periodRows = toBreakdownRows(summary.byPeriod);

  const channelColumns: Column<BreakdownRow>[] = [
    {
      key: "label",
      header: "Canal",
      render: (row) => <span className="font-medium">{row.label}</span>,
    },
    {
      key: "amount",
      header: "Custo",
      render: (row) => <span className="tabular-nums">{formatCurrencyCents(row.amountCents)}</span>,
      className: "text-right",
      headerClassName: "text-right",
    },
    {
      key: "share",
      header: "Uso",
      render: (row) => (
        <span className="tabular-nums">{formatPercent(row.sharePercent / 100, 1)}</span>
      ),
      className: "text-right",
      headerClassName: "text-right",
    },
  ];

  const stageColumns: Column<BreakdownRow>[] = [
    {
      key: "label",
      header: "Etapa",
      render: (row) => <span className="font-medium">{row.label}</span>,
    },
    {
      key: "amount",
      header: "Custo",
      render: (row) => <span className="tabular-nums">{formatCurrencyCents(row.amountCents)}</span>,
      className: "text-right",
      headerClassName: "text-right",
    },
    {
      key: "count",
      header: "Qtd",
      render: (row) => <span className="tabular-nums">{formatNumber(row.count)}</span>,
      className: "text-right",
      headerClassName: "text-right",
    },
  ];

  const providerColumns: Column<BreakdownRow>[] = [
    {
      key: "label",
      header: "Fornecedor",
      render: (row) => <span className="font-medium">{row.label}</span>,
    },
    {
      key: "amount",
      header: "Custo",
      render: (row) => <span className="tabular-nums">{formatCurrencyCents(row.amountCents)}</span>,
      className: "text-right",
      headerClassName: "text-right",
    },
    {
      key: "count",
      header: "Qtd",
      render: (row) => <span className="tabular-nums">{formatNumber(row.count)}</span>,
      className: "text-right",
      headerClassName: "text-right",
    },
  ];

  const contentColumns: Column<BreakdownRow>[] = [
    {
      key: "label",
      header: "Conteudo",
      render: (row) => <span className="font-medium">{row.label}</span>,
    },
    {
      key: "amount",
      header: "Custo",
      render: (row) => <span className="tabular-nums">{formatCurrencyCents(row.amountCents)}</span>,
      className: "text-right",
      headerClassName: "text-right",
    },
    {
      key: "share",
      header: "Share",
      render: (row) => (
        <span className="tabular-nums">{formatPercent(row.sharePercent / 100, 1)}</span>
      ),
      className: "text-right",
      headerClassName: "text-right",
    },
  ];

  const periodColumns: Column<BreakdownRow>[] = [
    {
      key: "label",
      header: "Periodo",
      render: (row) => <span className="font-medium">{row.label}</span>,
    },
    {
      key: "amount",
      header: "Custo",
      render: (row) => <span className="tabular-nums">{formatCurrencyCents(row.amountCents)}</span>,
      className: "text-right",
      headerClassName: "text-right",
    },
    {
      key: "count",
      header: "Qtd",
      render: (row) => <span className="tabular-nums">{formatNumber(row.count)}</span>,
      className: "text-right",
      headerClassName: "text-right",
    },
  ];

  const entryColumns: Column<CostEntry>[] = [
    {
      key: "channel",
      header: "Canal",
      render: (row) => <span className="font-medium">{row.channelId}</span>,
    },
    {
      key: "stage",
      header: "Etapa",
      render: (row) => <StatusBadge tone="info">{row.stage}</StatusBadge>,
    },
    {
      key: "provider",
      header: "Fornecedor",
      render: (row) => <span className="text-muted-foreground">{row.providerName}</span>,
    },
    {
      key: "amount",
      header: "Valor",
      render: (row) => <span className="tabular-nums">{formatCurrencyCents(row.amountCents)}</span>,
      className: "text-right",
      headerClassName: "text-right",
    },
    {
      key: "createdAt",
      header: "Criado em",
      render: (row) => (
        <span className="text-muted-foreground">{formatDateTime(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Governanca"
        title="Custos"
        description={buildDescription(activeChannel?.name)}
      />

      <div className="p-6 space-y-6">
        {summary.status === "exceeded" && (
          <Card className="border-critical-soft bg-critical-soft/35">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 text-critical" size={16} />
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-critical">Budget excedido</div>
                <div className="text-xs text-critical/90">
                  O consumo atual ultrapassou o limite definido para o recorte exibido.
                </div>
              </div>
            </div>
          </Card>
        )}

        {summary.status === "attention" && (
          <Card className="border-attention-soft bg-attention-soft/35">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 text-attention" size={16} />
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-attention">Budget em atencao</div>
                <div className="text-xs text-attention/90">
                  O consumo esta acima do patamar seguro e merece acompanhamento.
                </div>
              </div>
            </div>
          </Card>
        )}

        {summary.status === "not_configured" && (
          <Card className="border-border bg-surface-muted/40">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-muted-foreground" size={16} />
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-foreground">
                  Budget nao configurado
                </div>
                <div className="text-xs text-muted-foreground">
                  O recorte atual ainda nao tem limite monetario configurado.
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <KpiCard
            icon={<Wallet size={14} />}
            label="Custo do periodo"
            value={formatCurrencyCents(summary.totalCostCents)}
            hint="Total consolidado"
            tone={budgetTone}
          />
          <KpiCard
            label="Budget"
            value={
              summary.budgetConfigured
                ? formatCurrencyCents(summary.budgetCents)
                : "Nao configurado"
            }
            hint="Limite operacional"
          />
          <KpiCard
            label="Consumo"
            value={formatCurrencyCents(summary.consumedCents)}
            hint={`${formatPercent(summary.consumptionPercent / 100, 1)} do budget`}
          />
          <KpiCard
            label="Saldo"
            value={summary.budgetConfigured ? formatCurrencyCents(summary.remainingCents) : "N/A"}
            hint="Disponivel para novas operacoes"
          />
          <KpiCard
            label="Status"
            value={<CostBadge status={summary.status} />}
            hint={`Canal: ${summary.channelId ?? "todos"}`}
          />
        </div>

        <Card>
          <SectionHeader
            eyebrow="Resumo operacional"
            title="Policy e consumo"
            description="Budget, modo operacional e status do recorte atual."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-surface-muted/40 p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    Modo efetivo
                  </span>
                  <StatusBadge tone={modeTone(summary.policy.mode)}>
                    {summary.policy.mode}
                  </StatusBadge>
                </div>
                <PolicyLine label="Escopo" value={summary.policy.scope} />
                <PolicyLine
                  label="Budget configurado"
                  value={summary.policy.budgetConfigured ? "Sim" : "Nao"}
                />
                <PolicyLine
                  label="IA real"
                  value={summary.policy.allowRealAi ? "Permitida" : "Bloqueada"}
                />
                <PolicyLine
                  label="Publicacao real"
                  value={summary.policy.allowExternalPublication ? "Permitida" : "Bloqueada"}
                />
                <PolicyLine
                  label="Revisao humana"
                  value={summary.policy.requireHumanApproval ? "Obrigatoria" : "Opcional"}
                />
              </div>
              <ProgressBar
                value={summary.consumptionPercent}
                tone={toneFromStatus(summary.status)}
                className="h-2"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{statusLabel}</span>
                <span>{formatPercent(summary.consumptionPercent / 100, 1)} consumido</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MiniStat label="Entradas" value={formatNumber(summary.entryCount)} />
              <MiniStat label="Canal" value={summary.channelId ?? "Todos"} />
              <MiniStat
                label="Periodo"
                value={
                  summary.periodStart === summary.periodEnd ? "Mes atual" : "Intervalo selecionado"
                }
              />
              <MiniStat label="Fonte" value={summary.policy.id} />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card padded={false}>
            <div className="p-4 pb-2">
              <SectionHeader
                title="Custo por canal"
                description="Consolidacao por canal com budget e status."
              />
            </div>
            <CompactTable
              rows={channelRows}
              columns={channelColumns}
              className="border-0 rounded-none"
              empty="Sem canais com custo para o recorte atual."
            />
          </Card>

          <Card padded={false}>
            <div className="p-4 pb-2">
              <SectionHeader
                title="Detalhe por etapa"
                description="Agrupamento operacional por etapa."
              />
            </div>
            <CompactTable
              rows={stageRows}
              columns={stageColumns}
              className="border-0 rounded-none"
              empty="Sem etapas registradas."
            />
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card padded={false}>
            <div className="p-4 pb-2">
              <SectionHeader title="Fornecedor" description="Principais provedores de custo." />
            </div>
            <CompactTable
              rows={providerRows}
              columns={providerColumns}
              className="border-0 rounded-none"
              empty="Sem fornecedores registrados."
            />
          </Card>

          <Card padded={false}>
            <div className="p-4 pb-2">
              <SectionHeader
                title="Conteudo e periodo"
                description="Vinculos de conteudo e buckets periodicos."
              />
            </div>
            <div className="space-y-4 px-4 pb-4">
              <CompactTable
                rows={contentRows}
                columns={contentColumns}
                className="border-border/70 rounded-md"
                empty="Sem vinculo com conteudo."
              />
              <CompactTable
                rows={periodRows}
                columns={periodColumns}
                className="border-border/70 rounded-md"
                empty="Sem buckets periodicos."
              />
            </div>
          </Card>
        </div>

        <Card padded={false}>
          <div className="p-4 pb-2">
            <SectionHeader
              title="Entradas de custo"
              description="Registro detalhado, sempre em centavos e com canal isolado."
            />
          </div>
          {entries.length === 0 ? (
            <EmptyState
              title="Sem custos"
              description="Nao existem entradas para o recorte atual."
              icon={<Wallet size={18} />}
            />
          ) : (
            <CompactTable
              rows={entries}
              columns={entryColumns}
              className="border-0 rounded-none"
              empty="Sem custos para exibir."
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function buildDescription(channelName?: string): string {
  return channelName
    ? `Custos operacionais do canal ${channelName}.`
    : "Custos operacionais consolidados por canal, etapa, fornecedor e periodo.";
}

function PolicyLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
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

function toneFromStatus(status: "healthy" | "attention" | "exceeded" | "not_configured") {
  if (status === "healthy") {
    return "ok" as const;
  }

  if (status === "attention") {
    return "attention" as const;
  }

  if (status === "exceeded") {
    return "critical" as const;
  }

  return "info" as const;
}

function labelFromStatus(status: "healthy" | "attention" | "exceeded" | "not_configured") {
  if (status === "healthy") return "Budget saudável";
  if (status === "attention") return "Budget em atencao";
  if (status === "exceeded") return "Budget excedido";
  return "Budget nao configurado";
}

function modeTone(mode: string) {
  if (mode === "demo") {
    return "critical" as const;
  }

  if (mode === "paused") {
    return "warning" as const;
  }

  if (mode === "restricted_production") {
    return "attention" as const;
  }

  if (mode === "local_test") {
    return "info" as const;
  }

  return "ok" as const;
}

function toBreakdownRows(items: CostBreakdownItem[]): BreakdownRow[] {
  return items.map((item) => ({
    ...item,
    id: item.key,
  }));
}

function toChannelRows(items: CostChannelSummary[]): BreakdownRow[] {
  return items.map((item) => ({
    id: item.channelId,
    key: item.channelId,
    label: item.channelName,
    amountCents: item.consumedCents,
    count: item.entryCount,
    sharePercent: item.consumptionPercent,
  }));
}
