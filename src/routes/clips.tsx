import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { getDerivedClips } from "@/services/api-client";
import { Card } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { ContentStatusBadge, RiskBadge } from "@/components/status/badges";
import { formatDuration, formatRelative } from "@/lib/format";
import type { DerivedClip } from "@/contracts/types";

export const Route = createFileRoute("/clips")({
  head: () => ({
    meta: [
      { title: "Cortes — Aralume" },
      {
        name: "description",
        content: "Cortes verticais e ganchos derivados dos vídeos principais.",
      },
    ],
  }),
  component: function ClipsPage() {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({
      queryKey: ["cl", activeChannelId],
      queryFn: () => getDerivedClips(activeChannelId),
    });
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
        header: "Duração",
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
          description="Cortes verticais derivados dos vídeos principais por plataforma."
        />
        <div className="p-4">
          <Card padded={false}>
            <CompactTable
              rows={rows}
              columns={cols}
              className="border-0 rounded-none"
              empty="Sem cortes no canal ativo."
            />
          </Card>
        </div>
      </div>
    );
  },
});
