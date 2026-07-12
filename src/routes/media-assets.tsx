import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context";
import { getMediaAssets } from "@/services/api-client";
import { Card } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { RiskBadge, StatusBadge } from "@/components/status/badges";
import { formatCurrencyCents, formatRelative } from "@/lib/format";
import type { MediaAssetBase } from "@/contracts/types";

export const Route = createFileRoute("/media-assets")({
  head: () => ({
    meta: [
      { title: "Ativos de Mídia — Aralume" },
      { name: "description", content: "Biblioteca de ativos gerados, licenciados e enviados." },
    ],
  }),
  component: function MediaAssetsPage() {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({
      queryKey: ["ma", activeChannelId],
      queryFn: () => getMediaAssets(activeChannelId),
    });
    const rows = q.data?.data ?? [];
    const cols: Column<MediaAssetBase>[] = [
      {
        key: "title",
        header: "Ativo",
        render: (r) => <span className="font-medium truncate">{r.title}</span>,
      },
      {
        key: "type",
        header: "Tipo",
        render: (r) => <span className="text-muted-foreground">{r.type}</span>,
      },
      {
        key: "origin",
        header: "Origem",
        render: (r) => <span className="text-muted-foreground">{r.origin}</span>,
      },
      {
        key: "license",
        header: "Licença",
        render: (r) => (
          <StatusBadge
            tone={
              r.licenseStatus === "verified"
                ? "ok"
                : r.licenseStatus === "blocked"
                  ? "critical"
                  : r.licenseStatus === "pending"
                    ? "attention"
                    : "muted"
            }
          >
            {r.licenseStatus}
          </StatusBadge>
        ),
      },
      {
        key: "provider",
        header: "Provedor",
        render: (r) => <span className="text-muted-foreground">{r.providerName ?? "—"}</span>,
      },
      {
        key: "status",
        header: "Status",
        render: (r) => (
          <StatusBadge
            tone={
              r.status === "available"
                ? "ok"
                : r.status === "blocked" || r.status === "failed"
                  ? "critical"
                  : "attention"
            }
          >
            {r.status}
          </StatusBadge>
        ),
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
        header: "Atualizado",
        render: (r) => <span className="text-muted-foreground">{formatRelative(r.updatedAt)}</span>,
      },
    ];
    return (
      <div>
        <PageHeader
          eyebrow="Editorial"
          title="Ativos de Mídia"
          description="Narrações, imagens, vídeos, thumbnails, trilhas e legendas usados na produção."
        />
        <div className="p-4">
          <Card padded={false}>
            <CompactTable
              rows={rows}
              columns={cols}
              className="border-0 rounded-none"
              empty="Sem ativos no canal ativo."
            />
          </Card>
        </div>
      </div>
    );
  },
});
