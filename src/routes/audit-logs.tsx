import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context";
import { getAuditLogs } from "@/services/api-client";
import { Card } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { StatusBadge } from "@/components/status/badges";
import { formatDateTime } from "@/lib/format";
import type { AuditLog } from "@/contracts/types";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({ meta: [{ title: "Logs e Auditoria — Aralume" }, { name: "description", content: "Trilha de auditoria de agentes, sistema e usuários." }] }),
  component: () => {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({ queryKey: ["au", activeChannelId], queryFn: () => getAuditLogs(activeChannelId) });
    const rows = q.data?.data ?? [];
    const cols: Column<AuditLog>[] = [
      { key: "at", header: "Quando", render: (r) => <span className="text-muted-foreground">{formatDateTime(r.createdAt)}</span> },
      { key: "actor", header: "Ator", render: (r) => <span><span className="text-muted-foreground">{r.actorType}·</span> {r.actorName}</span> },
      { key: "action", header: "Ação", render: (r) => <span className="font-mono text-[11.5px]">{r.action}</span> },
      { key: "entity", header: "Entidade", render: (r) => <span className="text-muted-foreground">{r.entityType} <span className="opacity-60">#{r.entityId}</span></span> },
      { key: "msg", header: "Mensagem", render: (r) => <span className="truncate">{r.message}</span> },
      { key: "status", header: "Status", render: (r) => <StatusBadge tone={r.status === "success" ? "ok" : r.status === "warning" ? "warning" : "critical"} dot>{r.status}</StatusBadge> },
    ];
    return (
      <div>
        <PageHeader eyebrow="Plataforma" title="Logs e Auditoria" description="Trilha imutável de eventos operacionais para rastreabilidade e conformidade." />
        <div className="p-4"><Card padded={false}><CompactTable rows={rows} columns={cols} className="border-0 rounded-none" empty="Sem eventos no canal ativo." /></Card></div>
      </div>
    );
  },
});
