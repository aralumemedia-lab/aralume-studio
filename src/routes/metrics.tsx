import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context";
import { getPerformanceMetrics } from "@/services/api-client";
import { Card, KpiCard } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { formatCurrencyCents, formatDuration, formatNumber, formatPercent } from "@/lib/format";
import type { PerformanceMetric } from "@/contracts/types";

export const Route = createFileRoute("/metrics")({
  head: () => ({
    meta: [
      { title: "Métricas — Aralume" },
      { name: "description", content: "Desempenho editorial por canal, plataforma e conteúdo." },
    ],
  }),
  component: function MetricsPage() {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({
      queryKey: ["me-page", activeChannelId],
      queryFn: () => getPerformanceMetrics(activeChannelId),
    });
    const rows = q.data?.data ?? [];
    const totalViews = rows.reduce((s, r) => s + r.views, 0);
    const totalReach = rows.reduce((s, r) => s + r.reach, 0);
    const totalRev = rows.reduce((s, r) => s + r.revenueCents, 0);
    const avgRet = rows.length ? rows.reduce((s, r) => s + r.completionRate, 0) / rows.length : 0;

    const cols: Column<PerformanceMetric>[] = [
      {
        key: "plat",
        header: "Plataforma",
        render: (r) => <span className="uppercase text-[11px]">{r.platform}</span>,
      },
      {
        key: "views",
        header: "Views",
        render: (r) => <span className="tabular-nums">{formatNumber(r.views)}</span>,
      },
      {
        key: "reach",
        header: "Alcance",
        render: (r) => <span className="tabular-nums">{formatNumber(r.reach)}</span>,
      },
      {
        key: "watch",
        header: "Watch time",
        render: (r) => (
          <span className="tabular-nums">{formatDuration(r.averageWatchSeconds)}</span>
        ),
      },
      {
        key: "ret",
        header: "Retenção",
        render: (r) => <span className="tabular-nums">{formatPercent(r.completionRate)}</span>,
      },
      {
        key: "shares",
        header: "Shares",
        render: (r) => <span className="tabular-nums">{formatNumber(r.shares)}</span>,
      },
      {
        key: "saves",
        header: "Saves",
        render: (r) => <span className="tabular-nums">{formatNumber(r.saves)}</span>,
      },
      {
        key: "com",
        header: "Coments.",
        render: (r) => <span className="tabular-nums">{formatNumber(r.comments)}</span>,
      },
      {
        key: "fol",
        header: "Seguidores",
        render: (r) => <span className="tabular-nums">{formatNumber(r.followersGained)}</span>,
      },
      {
        key: "rev",
        header: "Receita",
        render: (r) => <span className="tabular-nums">{formatCurrencyCents(r.revenueCents)}</span>,
      },
    ];
    return (
      <div>
        <PageHeader
          eyebrow="Governança"
          title="Métricas"
          description="Desempenho consolidado por canal, plataforma e conteúdo."
        />
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Views" value={formatNumber(totalViews)} />
            <KpiCard label="Alcance" value={formatNumber(totalReach)} />
            <KpiCard label="Retenção média" value={formatPercent(avgRet)} />
            <KpiCard label="Receita" value={formatCurrencyCents(totalRev)} />
          </div>
          <Card padded={false}>
            <CompactTable
              rows={rows}
              columns={cols}
              className="border-0 rounded-none"
              empty="Sem métricas no canal ativo."
            />
          </Card>
        </div>
      </div>
    );
  },
});
