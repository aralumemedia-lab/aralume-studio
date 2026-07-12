import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context";
import { getPublicationJobs } from "@/services/api-client";
import { Card } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { PublicationStatusBadge } from "@/components/status/badges";
import { formatDateTime, formatRelative } from "@/lib/format";
import type { PublicationJob } from "@/contracts/types";

export const Route = createFileRoute("/publications")({
  head: () => ({
    meta: [
      { title: "Publicações — Aralume" },
      { name: "description", content: "Fila de publicação multiplataforma." },
    ],
  }),
  component: function PublicationsPage() {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({
      queryKey: ["pubs-page", activeChannelId],
      queryFn: () => getPublicationJobs(activeChannelId),
    });
    const rows = q.data?.data ?? [];
    const cols: Column<PublicationJob>[] = [
      {
        key: "title",
        header: "Título",
        render: (r) => <span className="font-medium truncate">{r.title}</span>,
      },
      {
        key: "plat",
        header: "Plataforma",
        render: (r) => (
          <span className="uppercase text-[11px] text-muted-foreground">{r.platform}</span>
        ),
      },
      {
        key: "sched",
        header: "Agendado",
        render: (r) => (
          <span className="text-muted-foreground">
            {r.scheduledAt ? formatDateTime(r.scheduledAt) : "—"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (r) => <PublicationStatusBadge status={r.status} />,
      },
      {
        key: "at",
        header: "Atualizado",
        render: (r) => <span className="text-muted-foreground">{formatRelative(r.updatedAt)}</span>,
      },
    ];
    return (
      <div>
        <PageHeader
          eyebrow="Governança"
          title="Publicações"
          description="Rascunhos, agendamentos e publicações por plataforma. Nenhuma publicação real é executada nesta etapa."
        />
        <div className="p-4">
          <Card padded={false}>
            <CompactTable
              rows={rows}
              columns={cols}
              className="border-0 rounded-none"
              empty="Sem publicações no canal ativo."
            />
          </Card>
        </div>
      </div>
    );
  },
});
