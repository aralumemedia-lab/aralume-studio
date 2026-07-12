import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { getVideoAssets } from "@/services/api-client";
import { Card } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { ComplianceStatusBadge, ContentStatusBadge, StatusBadge } from "@/components/status/badges";
import { formatCurrencyCents, formatDuration, formatRelative } from "@/lib/format";
import type { VideoAsset } from "@/contracts/types";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Vídeos — Aralume" },
      { name: "description", content: "Vídeos principais em produção, renderização e publicação." },
    ],
  }),
  component: function VideosPage() {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({
      queryKey: ["vd", activeChannelId],
      queryFn: () => getVideoAssets(activeChannelId),
    });
    const rows = q.data?.data ?? [];
    const cols: Column<VideoAsset>[] = [
      {
        key: "title",
        header: "Vídeo",
        render: (r) => <span className="font-medium truncate">{r.title}</span>,
      },
      {
        key: "fmt",
        header: "Formato",
        render: (r) => (
          <span className="text-muted-foreground">
            {r.format} · {r.resolution}
          </span>
        ),
      },
      {
        key: "dur",
        header: "Duração",
        render: (r) => <span className="tabular-nums">{formatDuration(r.durationSeconds)}</span>,
      },
      {
        key: "render",
        header: "Render",
        render: (r) => (
          <StatusBadge
            tone={
              r.renderStatus === "rendered"
                ? "ok"
                : r.renderStatus === "failed"
                  ? "critical"
                  : r.renderStatus === "rendering"
                    ? "info"
                    : "muted"
            }
          >
            {r.renderStatus}
          </StatusBadge>
        ),
      },
      {
        key: "qc",
        header: "Qualidade",
        render: (r) => (
          <StatusBadge
            tone={
              r.qualityStatus === "passed"
                ? "ok"
                : r.qualityStatus === "failed"
                  ? "critical"
                  : r.qualityStatus === "warning"
                    ? "warning"
                    : "muted"
            }
          >
            {r.qualityStatus}
          </StatusBadge>
        ),
      },
      {
        key: "comp",
        header: "Conformidade",
        render: (r) => <ComplianceStatusBadge status={r.complianceStatus} />,
      },
      { key: "status", header: "Status", render: (r) => <ContentStatusBadge status={r.status} /> },
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
        header: "Atualizado",
        render: (r) => <span className="text-muted-foreground">{formatRelative(r.updatedAt)}</span>,
      },
    ];
    return (
      <div>
        <PageHeader
          eyebrow="Editorial"
          title="Vídeos"
          description="Vídeos principais com status de render, qualidade e conformidade."
        />
        <div className="p-4">
          <Card padded={false}>
            <CompactTable
              rows={rows}
              columns={cols}
              className="border-0 rounded-none"
              empty="Sem vídeos no canal ativo."
            />
          </Card>
        </div>
      </div>
    );
  },
});
