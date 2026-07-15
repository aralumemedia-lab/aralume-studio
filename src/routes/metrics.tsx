import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Database, ShieldAlert, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import {
  Card,
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  SectionHeader,
} from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { formatDateTime, formatDuration, formatNumber, formatPercent } from "@/lib/format";
import {
  describeMetricsApiError,
  getMetricsSummary,
  getPerformanceMetrics,
} from "@/services/metrics-api";
import type { MetricsSummary, PerformanceMetric } from "@/contracts/types";

export const Route = createFileRoute("/metrics")({
  head: () => ({
    meta: [
      { title: "Metricas - Aralume" },
      { name: "description", content: "Desempenho editorial, tendencias e aprendizado por canal." },
    ],
  }),
  component: MetricsPage,
});

function MetricsPage() {
  const { activeChannelId, activeChannel } = useChannelContext();
  const channelId = activeChannelId ?? "";
  const metricsQ = useQuery({
    queryKey: ["metrics", channelId],
    queryFn: () => getPerformanceMetrics(channelId),
  });
  const summaryQ = useQuery({
    queryKey: ["metrics-summary", channelId],
    queryFn: () => getMetricsSummary({ channelId }),
  });
  const rows = metricsQ.data?.data ?? [];
  const summary = summaryQ.data?.data;
  const error = metricsQ.error ?? summaryQ.error;

  if (metricsQ.isLoading || summaryQ.isLoading)
    return (
      <MetricsFrame channelName={activeChannel?.name}>
        <LoadingState label="Carregando metricas e recomendacoes" />
      </MetricsFrame>
    );
  if (error)
    return (
      <MetricsFrame channelName={activeChannel?.name}>
        <ErrorState
          message={describeMetricsApiError(error)}
          onRetry={() => {
            void metricsQ.refetch();
            void summaryQ.refetch();
          }}
        />
      </MetricsFrame>
    );
  if (!summary || rows.length === 0)
    return (
      <MetricsFrame channelName={activeChannel?.name}>
        <EmptyState
          title="Sem metricas no canal ativo"
          description="Registre ou importe um snapshot controlado para iniciar o aprendizado editorial."
          icon={<Database size={20} />}
        />
      </MetricsFrame>
    );

  return (
    <div>
      <PageHeader
        eyebrow="Governanca"
        title="Metricas"
        description={`Leitura operacional de ${activeChannel?.name ?? "canal ativo"}.`}
      />
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Canal:{" "}
            <strong className="text-foreground">{activeChannel?.name ?? activeChannelId}</strong>
          </span>
          <span>
            Periodo:{" "}
            {summary.periodStart && summary.periodEnd
              ? `${formatDateTime(summary.periodStart)} - ${formatDateTime(summary.periodEnd)}`
              : "Sem periodo"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Database size={13} /> Origem: {summary.origins.map(originLabel).join(", ")}
          </span>
          <span>
            Atualizado: {summary.lastCapturedAt ? formatDateTime(summary.lastCapturedAt) : "-"}
          </span>
        </div>

        {summary.status === "partial" && (
          <div className="rounded-md border border-attention/30 bg-attention/10 px-3 py-2 text-xs text-attention">
            Dados parciais:{" "}
            {summary.missingData.join(", ") || "algumas metricas nao foram informadas"}.
          </div>
        )}
        {summary.status === "insufficient_data" && (
          <div className="rounded-md border border-attention/30 bg-attention/10 px-3 py-2 text-xs text-attention">
            Dados insuficientes para recomendar:{" "}
            {summary.missingData.length
              ? summary.missingData.join(", ")
              : "sao necessarias pelo menos duas amostras comparaveis"}
            .
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard
            label="Views"
            value={formatNumber(summary.totals.views ?? 0)}
            icon={<BarChart3 size={15} />}
          />
          <KpiCard label="Alcance" value={formatNumber(summary.totals.reach ?? 0)} />
          <KpiCard
            label="Retencao media"
            value={formatPercent(summary.totals.completionRate ?? 0)}
          />
          <KpiCard label="Seguidores" value={formatNumber(summary.totals.followersGained ?? 0)} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
          <Card padded={false}>
            <div className="p-4 pb-0">
              <SectionHeader
                title="Desempenho por conteudo"
                description={`${summary.sampleCount} snapshots em ${summary.contentCount} conteudo(s).`}
              />
            </div>
            <MetricsTable rows={rows} />
          </Card>
          <RecommendationCard summary={summary} />
        </div>
      </div>
    </div>
  );
}

function MetricsFrame({ channelName, children }: { channelName?: string; children: ReactNode }) {
  return (
    <div>
      <PageHeader
        eyebrow="Governanca"
        title="Metricas"
        description={`Leitura operacional de ${channelName ?? "canal ativo"}.`}
      />
      <div className="p-6">{children}</div>
    </div>
  );
}

function MetricsTable({ rows }: { rows: PerformanceMetric[] }) {
  const columns: Column<PerformanceMetric>[] = [
    {
      key: "content",
      header: "Conteudo",
      render: (row) => <span className="font-medium">{row.contentId}</span>,
    },
    {
      key: "platform",
      header: "Plataforma",
      render: (row) => <span className="uppercase text-[11px]">{row.platform}</span>,
    },
    {
      key: "views",
      header: "Views",
      render: (row) => <span className="tabular-nums">{formatNumber(row.views)}</span>,
    },
    {
      key: "watch",
      header: "Watch time",
      render: (row) => (
        <span className="tabular-nums">{formatDuration(row.averageWatchSeconds)}</span>
      ),
    },
    {
      key: "retention",
      header: "Retencao",
      render: (row) => <span className="tabular-nums">{formatPercent(row.completionRate)}</span>,
    },
    {
      key: "followers",
      header: "Seguidores",
      render: (row) => <span className="tabular-nums">{formatNumber(row.followersGained)}</span>,
    },
    {
      key: "origin",
      header: "Origem",
      render: (row) => (
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
          {originLabel(row.origin)}
        </span>
      ),
    },
  ];
  return (
    <CompactTable
      rows={rows}
      columns={columns}
      className="border-0 rounded-none"
      empty="Sem metricas no recorte."
    />
  );
}

function RecommendationCard({ summary }: { summary: MetricsSummary }) {
  const recommendation = summary.recommendation;
  return (
    <Card>
      <SectionHeader
        title="Aprendizado editorial"
        description="Regra deterministica metrics-learning-v1"
        action={<Sparkles size={15} className="text-info" />}
      />
      {recommendation ? (
        <div className="space-y-3 text-xs">
          <div className="rounded-md border border-info/30 bg-info/10 p-3">
            <div className="font-semibold text-info">Recomendacao disponivel</div>
            <p className="mt-1 text-foreground">{recommendation.suggestedAction}</p>
          </div>
          <div>
            <div className="font-medium">Racional</div>
            <p className="mt-1 text-muted-foreground">{recommendation.rationale}</p>
          </div>
          <div className="flex items-center justify-between">
            <span>Confianca</span>
            <strong>{recommendation.confidence}</strong>
          </div>
          <div>
            <div className="font-medium">Evidencias ({recommendation.evidence.length})</div>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              {recommendation.evidence.map((evidence) => (
                <li key={evidence.metricId}>
                  #{evidence.metricId} - {evidence.platform} - {formatPercent(evidence.value)}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2 text-[10px] text-muted-foreground">
            <ShieldAlert size={13} /> Revisao humana obrigatoria; nao e causalidade.
          </div>
          <div className="text-[10px] text-muted-foreground">
            Gerada em {formatDateTime(recommendation.generatedAt)} · {recommendation.ruleVersion}
          </div>
        </div>
      ) : (
        <EmptyState
          title="Recomendacao indisponivel"
          description="Aumente o numero de amostras comparaveis no periodo selecionado."
        />
      )}
    </Card>
  );
}

function originLabel(origin: PerformanceMetric["origin"]): string {
  return { manual: "Manual", imported: "Importado", demo: "Demo", fixture: "Fixture" }[origin];
}
