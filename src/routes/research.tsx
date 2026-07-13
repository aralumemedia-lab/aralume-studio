import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { RiskBadge, WorkflowStatusBadge } from "@/components/status/badges";
import { Card, EmptyState, ErrorState, LoadingState } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { formatRelative } from "@/lib/format";
import type { ResearchSession } from "@/contracts/types";
import { describeResearchApiError, getResearchSessions } from "@/services/api-client";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Pesquisas - Aralume" },
      { name: "description", content: "Sessoes de pesquisa e fontes validadas." },
    ],
  }),
  component: function ResearchPage() {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({
      queryKey: ["research", activeChannelId],
      queryFn: () => getResearchSessions({ channelId: activeChannelId }),
    });
    const rows = q.data?.data ?? [];
    const isLoading = q.isPending && rows.length === 0;
    const hasError = !!q.error && rows.length === 0;
    const cols: Column<ResearchSession>[] = [
      {
        key: "title",
        header: "Sessao",
        render: (r) => <span className="font-medium truncate">{r.title}</span>,
      },
      {
        key: "sources",
        header: "Fontes",
        render: (r) => <span className="tabular-nums">{r.sourceCount}</span>,
      },
      {
        key: "claims",
        header: "Claims",
        render: (r) => <span className="tabular-nums">{r.claimCount}</span>,
      },
      {
        key: "conf",
        header: "Confianca",
        render: (r) => <span className="tabular-nums">{r.confidenceScore}%</span>,
      },
      { key: "risk", header: "Risco", render: (r) => <RiskBadge level={r.riskLevel} /> },
      { key: "status", header: "Status", render: (r) => <WorkflowStatusBadge status={r.status} /> },
      {
        key: "at",
        header: "Atualizado",
        render: (r) => <span className="text-muted-foreground">{formatRelative(r.updatedAt)}</span>,
      },
    ];

    return (
      <div>
        <PageHeader
          eyebrow="Editorial"
          title="Pesquisas e fontes"
          description="Sessoes de pesquisa com fontes, claims e nivel de confianca."
        />
        <div className="p-4">
          <Card padded={false}>
            {isLoading ? (
              <LoadingState label="Carregando pesquisas" />
            ) : hasError ? (
              <div className="p-4">
                <ErrorState message={describeResearchApiError(q.error)} />
                <button
                  onClick={() => void q.refetch()}
                  className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                >
                  Tentar novamente
                </button>
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                title="Sem pesquisas no canal selecionado"
                description="Crie uma sessao de pesquisa via API ou troque para Todos os canais."
              />
            ) : (
              <CompactTable
                rows={rows}
                columns={cols}
                className="border-0 rounded-none"
                empty="Sem pesquisas no canal ativo."
              />
            )}
          </Card>
        </div>
      </div>
    );
  },
});
