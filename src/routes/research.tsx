import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context";
import { getResearchSessions } from "@/services/api-client";
import { Card } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { RiskBadge, WorkflowStatusBadge } from "@/components/status/badges";
import { formatRelative } from "@/lib/format";
import type { ResearchSession } from "@/contracts/types";

export const Route = createFileRoute("/research")({
  head: () => ({ meta: [{ title: "Pesquisas — Aralume" }, { name: "description", content: "Sessões de pesquisa e fontes validadas." }] }),
  component: () => {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({ queryKey: ["research", activeChannelId], queryFn: () => getResearchSessions(activeChannelId) });
    const rows = q.data?.data ?? [];
    const cols: Column<ResearchSession>[] = [
      { key: "title", header: "Sessão", render: (r) => <span className="font-medium truncate">{r.title}</span> },
      { key: "sources", header: "Fontes", render: (r) => <span className="tabular-nums">{r.sourceCount}</span> },
      { key: "claims", header: "Claims", render: (r) => <span className="tabular-nums">{r.claimCount}</span> },
      { key: "conf", header: "Confiança", render: (r) => <span className="tabular-nums">{r.confidenceScore}%</span> },
      { key: "risk", header: "Risco", render: (r) => <RiskBadge level={r.riskLevel} /> },
      { key: "status", header: "Status", render: (r) => <WorkflowStatusBadge status={r.status} /> },
      { key: "at", header: "Atualizado", render: (r) => <span className="text-muted-foreground">{formatRelative(r.updatedAt)}</span> },
    ];
    return (
      <div>
        <PageHeader eyebrow="Editorial" title="Pesquisas e fontes" description="Sessões de pesquisa com fontes, claims e nível de confiança." />
        <div className="p-4"><Card padded={false}><CompactTable rows={rows} columns={cols} className="border-0 rounded-none" empty="Sem pesquisas no canal ativo." /></Card></div>
      </div>
    );
  },
});
