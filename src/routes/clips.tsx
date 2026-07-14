import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { Card, EmptyState, ErrorState, LoadingState } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { ContentStatusBadge, RiskBadge } from "@/components/status/badges";
import { formatDuration, formatRelative } from "@/lib/format";
import type { DerivedClip } from "@/contracts/types";
import { describeMediaAssetsApiError, getDerivedClips } from "@/services/api-client";

export const Route = createFileRoute("/clips")({
  head: () => ({
    meta: [
      { title: "Cortes - Aralume" },
      {
        name: "description",
        content: "Cortes verticais e ganchos derivados dos videos principais.",
      },
    ],
  }),
  component: function ClipsPage() {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({
      queryKey: ["clips", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () => getDerivedClips(activeChannelId as string),
    });

    if (!activeChannelId) {
      return (
        <div>
          <PageHeader eyebrow="Editorial" title="Cortes" description="Selecione um canal." />
          <div className="p-4">
            <EmptyState
              title="Nenhum canal ativo"
              description="Selecione um canal para listar cortes."
            />
          </div>
        </div>
      );
    }

    const rows = q.data?.data ?? [];
    const cols: Column<DerivedClip>[] = [
      {
        key: "title",
        header: "Corte",
        render: (r) => <span className="font-medium truncate">{r.title}</span>,
      },
      {
        key: "hook",
        header: "Gancho",
        render: (r) => <span className="text-muted-foreground truncate">{r.hook}</span>,
      },
      {
        key: "plat",
        header: "Plataforma",
        render: (r) => <span className="text-muted-foreground">{r.targetPlatform}</span>,
      },
      {
        key: "dur",
        header: "Duracao",
        render: (r) => <span className="tabular-nums">{formatDuration(r.durationSeconds)}</span>,
      },
      {
        key: "pot",
        header: "Potencial",
        render: (r) => <span className="tabular-nums">{r.clipPotentialScore}</span>,
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
          title="Cortes"
          description="Cortes verticais derivados dos videos principais por plataforma."
        />
        <div className="p-4">
          <Card padded={false}>
            {q.isLoading ? (
              <LoadingState label="Carregando cortes" />
            ) : q.isError ? (
              <ErrorState message={describeMediaAssetsApiError(q.error, "clips")} />
            ) : rows.length === 0 ? (
              <EmptyState title="Sem cortes no canal ativo." />
            ) : (
              <CompactTable
                rows={rows}
                columns={cols}
                className="border-0 rounded-none"
                empty="Sem cortes no canal ativo."
              />
            )}
          </Card>
        </div>
      </div>
    );
  },
});
