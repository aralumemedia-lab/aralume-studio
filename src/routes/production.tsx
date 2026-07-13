import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { ContentStatusBadge, RiskBadge } from "@/components/status/badges";
import { Card, EmptyState, ErrorState, LoadingState } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrencyCents, formatRelative } from "@/lib/format";
import type { ProductionItem } from "@/contracts/types";
import { describeEditorialApiError, getProductionItems } from "@/services/api-client";

export const Route = createFileRoute("/production")({
  head: () => ({
    meta: [
      { title: "Producao - Aralume" },
      { name: "description", content: "Fila de producao editorial multiagentes." },
    ],
  }),
  component: function ProductionPage() {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({
      queryKey: ["production", activeChannelId],
      queryFn: () => getProductionItems({ channelId: activeChannelId }),
    });
    const rows = q.data?.data ?? [];
    const isLoading = q.isPending && rows.length === 0;
    const hasError = !!q.error && rows.length === 0;
    const cols: Column<ProductionItem>[] = [
      {
        key: "title",
        header: "Conteudo",
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
        width: "170px",
        render: (r) => (
          <div className="flex items-center gap-2">
            <ProgressBar
              value={r.progressPercent}
              tone={r.riskLevel === "critical" ? "critical" : "info"}
            />
            <span className="tabular-nums text-[11px] w-8 text-right">{r.progressPercent}%</span>
          </div>
        ),
      },
      {
        key: "next",
        header: "Proxima acao",
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
      {
        key: "at",
        header: "Ultima atividade",
        render: (r) => (
          <span className="text-muted-foreground">{formatRelative(r.lastActivityAt)}</span>
        ),
      },
    ];

    return (
      <div>
        <PageHeader
          eyebrow="Operacao"
          title="Producao"
          description="Todos os conteudos em andamento, com etapa, agente responsavel e proxima acao."
        />
        <div className="p-4">
          <Card padded={false}>
            {isLoading ? (
              <LoadingState label="Carregando producao" />
            ) : hasError ? (
              <div className="p-4">
                <ErrorState message={describeEditorialApiError(q.error, "production")} />
                <button
                  onClick={() => void q.refetch()}
                  className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                >
                  Tentar novamente
                </button>
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                title="Nada em producao no canal selecionado"
                description="Crie ideias, pesquisas ou roteiros via API editorial."
              />
            ) : (
              <CompactTable
                rows={rows}
                columns={cols}
                className="border-0 rounded-none"
                empty="Nada em producao no canal ativo."
              />
            )}
          </Card>
        </div>
      </div>
    );
  },
});
