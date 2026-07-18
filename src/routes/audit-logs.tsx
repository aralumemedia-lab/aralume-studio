import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { StatusBadge } from "@/components/status/badges";
import { Card, EmptyState, ErrorState, LoadingState } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { formatDateTime } from "@/lib/format";
import { describeAuditApiError, getAuditLogs } from "@/services/audit-api";
import type { AuditLog } from "@/contracts/types";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [
      { title: "Logs e Auditoria - Aralume" },
      { name: "description", content: "Trilha de auditoria operacional e de custos." },
    ],
  }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const { activeChannelId, activeChannel } = useChannelContext();
  const logsQ = useQuery({
    queryKey: ["audit-logs", activeChannelId],
    queryFn: () => getAuditLogs(activeChannelId),
  });

  const rows = logsQ.data?.data ?? [];

  if (logsQ.isLoading) {
    return (
      <div>
        <PageHeader
          eyebrow="Plataforma"
          title="Logs e Auditoria"
          description={buildDescription(activeChannel?.name)}
        />
        <div className="p-6">
          <LoadingState label="Carregando auditoria" />
        </div>
      </div>
    );
  }

  if (logsQ.error) {
    return (
      <div>
        <PageHeader
          eyebrow="Plataforma"
          title="Logs e Auditoria"
          description={buildDescription(activeChannel?.name)}
        />
        <div className="p-6">
          <ErrorState message={describeAuditApiError(logsQ.error)} />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div>
        <PageHeader
          eyebrow="Plataforma"
          title="Logs e Auditoria"
          description={buildDescription(activeChannel?.name)}
        />
        <div className="p-6">
          <EmptyState
            title="Sem eventos"
            description="Nao ha logs de auditoria para o recorte atual."
            icon={<ScrollText size={18} />}
          />
        </div>
      </div>
    );
  }

  const columns: Column<AuditLog>[] = [
    {
      key: "createdAt",
      header: "Quando",
      render: (row) => (
        <span className="text-muted-foreground">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: "actor",
      header: "Ator",
      render: (row) => (
        <span>
          <span className="text-muted-foreground">{row.actorType}</span> {row.actorName}
        </span>
      ),
    },
    {
      key: "action",
      header: "Acao",
      render: (row) => <span className="font-mono text-[11.5px]">{row.action}</span>,
    },
    {
      key: "entity",
      header: "Entidade",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.entityType} <span className="opacity-60">#{row.entityId}</span>
        </span>
      ),
    },
    {
      key: "requestId",
      header: "Request ID",
      render: (row) => (
        <span className="font-mono text-[10.5px] text-muted-foreground" title={row.requestId}>
          {row.requestId ?? "Nao informado"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge tone={toneFromStatus(row.status)}>{row.status}</StatusBadge>,
    },
    {
      key: "message",
      header: "Mensagem",
      render: (row) => <span className="text-muted-foreground">{row.message}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Plataforma"
        title="Logs e Auditoria"
        description={buildDescription(activeChannel?.name)}
      />
      <div className="p-6">
        <Card padded={false}>
          <CompactTable
            rows={rows}
            columns={columns}
            className="border-0 rounded-none"
            empty="Sem eventos de auditoria."
          />
        </Card>
      </div>
    </div>
  );
}

function buildDescription(channelName?: string): string {
  return channelName
    ? `Trilha de auditoria operacional do canal ${channelName}.`
    : "Trilha de auditoria operacional consolidada.";
}

function toneFromStatus(status: AuditLog["status"]) {
  if (status === "success") return "ok" as const;
  if (status === "warning") return "warning" as const;
  return "critical" as const;
}
