import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context";
import { getScripts } from "@/services/api-client";
import { Card } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { ContentStatusBadge, RiskBadge } from "@/components/status/badges";
import { formatDuration, formatRelative } from "@/lib/format";
import type { Script } from "@/contracts/types";

export const Route = createFileRoute("/scripts")({
  head: () => ({ meta: [{ title: "Roteiros — Aralume" }, { name: "description", content: "Roteiros e versões do pipeline editorial." }] }),
  component: () => {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({ queryKey: ["scripts", activeChannelId], queryFn: () => getScripts(activeChannelId) });
    const rows = q.data?.data ?? [];
    const cols: Column<Script>[] = [
      { key: "title", header: "Roteiro", render: (r) => <span className="font-medium truncate">{r.title}</span> },
      { key: "hook", header: "Gancho", render: (r) => <span className="text-muted-foreground truncate">{r.hook}</span> },
      { key: "dur", header: "Duração", render: (r) => <span className="tabular-nums">{formatDuration(r.estimatedDurationSeconds)}</span> },
      { key: "risk", header: "Risco", render: (r) => <RiskBadge level={r.riskLevel} /> },
      { key: "status", header: "Status", render: (r) => <ContentStatusBadge status={r.status} /> },
      { key: "at", header: "Atualizado", render: (r) => <span className="text-muted-foreground">{formatRelative(r.updatedAt)}</span> },
    ];
    return (
      <div>
        <PageHeader eyebrow="Editorial" title="Roteiros" description="Roteiros com hook, promessa, CTA e histórico de versões." />
        <div className="p-4"><Card padded={false}><CompactTable rows={rows} columns={cols} className="border-0 rounded-none" empty="Sem roteiros no canal ativo." /></Card></div>
      </div>
    );
  },
});
