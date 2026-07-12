import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context";
import { getContentIdeas } from "@/services/api-client";
import { Card } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { ContentStatusBadge, RiskBadge } from "@/components/status/badges";
import { formatRelative } from "@/lib/format";
import type { ContentIdea } from "@/contracts/types";
import { toast } from "sonner";

export const Route = createFileRoute("/ideas")({
  head: () => ({ meta: [{ title: "Pautas — Aralume" }, { name: "description", content: "Oportunidades editoriais detectadas pelos agentes." }] }),
  component: () => {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({ queryKey: ["ideas", activeChannelId], queryFn: () => getContentIdeas(activeChannelId) });
    const rows = q.data?.data ?? [];
    const cols: Column<ContentIdea>[] = [
      { key: "title", header: "Pauta", render: (r) => <span className="font-medium truncate">{r.title}</span> },
      { key: "niche", header: "Nicho", render: (r) => <span className="text-muted-foreground">{r.niche}</span> },
      { key: "source", header: "Fonte", render: (r) => <span className="text-muted-foreground truncate">{r.source}</span> },
      { key: "opp", header: "Oportunidade", render: (r) => <span className="tabular-nums">{r.opportunityScore}</span> },
      { key: "orig", header: "Originalidade", render: (r) => <span className="tabular-nums">{r.originalityScore}</span> },
      { key: "clip", header: "Cortes", render: (r) => <span className="tabular-nums">{r.clipPotentialScore}</span> },
      { key: "risk", header: "Risco", render: (r) => <RiskBadge level={r.riskLevel} /> },
      { key: "status", header: "Status", render: (r) => <ContentStatusBadge status={r.status} /> },
      { key: "at", header: "Criado", render: (r) => <span className="text-muted-foreground">{formatRelative(r.createdAt)}</span> },
      { key: "act", header: "", render: () => (
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); toast("Enviar para pesquisa — mockado"); }} className="h-6 px-2 rounded-sm border border-border bg-surface text-[11px] hover:bg-accent/50">Pesquisar</button>
            <button onClick={(e) => { e.stopPropagation(); toast("Priorizar — mockado"); }} className="h-6 px-2 rounded-sm border border-border bg-surface text-[11px] hover:bg-accent/50">Priorizar</button>
          </div>
        ) },
    ];
    return (
      <div>
        <PageHeader eyebrow="Editorial" title="Pautas" description="Oportunidades editoriais detectadas pelos agentes de inteligência de nicho." />
        <div className="p-4"><Card padded={false}><CompactTable rows={rows} columns={cols} className="border-0 rounded-none" empty="Sem pautas no canal ativo." /></Card></div>
      </div>
    );
  },
});
