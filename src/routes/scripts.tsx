import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { ContentStatusBadge, RiskBadge } from "@/components/status/badges";
import { Card, EmptyState, ErrorState, LoadingState } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { formatDuration, formatRelative } from "@/lib/format";
import type { Script } from "@/contracts/types";
import { describeScriptsApiError, getScripts } from "@/services/api-client";

export const Route = createFileRoute("/scripts")({
  head: () => ({
    meta: [
      { title: "Roteiros - Aralume" },
      { name: "description", content: "Roteiros e versoes do pipeline editorial." },
    ],
  }),
  component: function ScriptsPage() {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({
      queryKey: ["scripts", activeChannelId],
      queryFn: () => getScripts({ channelId: activeChannelId }),
    });
    const rows = q.data?.data ?? [];
    const isLoading = q.isPending && rows.length === 0;
    const hasError = !!q.error && rows.length === 0;
    const cols: Column<Script>[] = [
      {
        key: "title",
        header: "Roteiro",
        render: (r) => <span className="font-medium truncate">{r.title}</span>,
      },
      {
        key: "hook",
        header: "Gancho",
        render: (r) => <span className="text-muted-foreground truncate">{r.hook}</span>,
      },
      {
        key: "dur",
        header: "Duracao",
        render: (r) => (
          <span className="tabular-nums">{formatDuration(r.estimatedDurationSeconds)}</span>
        ),
      },
      {
        key: "version",
        header: "Versao atual",
        render: (r) => <span className="font-mono text-[11px]">{r.currentVersionId}</span>,
      },
      { key: "risk", header: "Risco", render: (r) => <RiskBadge level={r.riskLevel} /> },
      { key: "status", header: "Status", render: (r) => <ContentStatusBadge status={r.status} /> },
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
          title="Roteiros"
          description="Roteiros com hook, promessa, CTA e historico de versoes."
        />
        <div className="p-4">
          <Card padded={false}>
            {isLoading ? (
              <LoadingState label="Carregando roteiros" />
            ) : hasError ? (
              <div className="p-4">
                <ErrorState message={describeScriptsApiError(q.error)} />
                <button
                  onClick={() => void q.refetch()}
                  className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                >
                  Tentar novamente
                </button>
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                title="Sem roteiros no canal selecionado"
                description="Crie um roteiro via API editorial ou troque para Todos os canais."
              />
            ) : (
              <CompactTable
                rows={rows}
                columns={cols}
                className="border-0 rounded-none"
                empty="Sem roteiros no canal ativo."
              />
            )}
          </Card>
        </div>
      </div>
    );
  },
});
