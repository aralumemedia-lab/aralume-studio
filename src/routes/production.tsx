import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context";
import { getProductionItems } from "@/services/api-client";
import { Card } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { ContentStatusBadge, RiskBadge } from "@/components/status/badges";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrencyCents, formatRelative } from "@/lib/format";
import type { ProductionItem } from "@/contracts/types";

export const Route = createFileRoute("/production")({
  head: () => ({ meta: [{ title: "Produção — Aralume" }, { name: "description", content: "Fila de produção editorial multiagentes." }] }),
  component: () => {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({ queryKey: ["prod-page", activeChannelId], queryFn: () => getProductionItems(activeChannelId) });
    const rows = q.data?.data ?? [];
    const cols: Column<ProductionItem>[] = [
      { key: "title", header: "Conteúdo", render: (r) => <span className="font-medium truncate">{r.title}</span> },
      { key: "status", header: "Etapa", render: (r) => <ContentStatusBadge status={r.status} /> },
      { key: "agent", header: "Agente atual", render: (r) => <span className="text-muted-foreground">{r.currentAgentName ?? "—"}</span> },
      { key: "prog", header: "Progresso", width: "170px", render: (r) => (
          <div className="flex items-center gap-2"><ProgressBar value={r.progressPercent} tone={r.riskLevel === "critical" ? "critical" : "info"} /><span className="tabular-nums text-[11px] w-8 text-right">{r.progressPercent}%</span></div>
        ) },
      { key: "next", header: "Próxima ação", render: (r) => <span className="text-muted-foreground truncate">{r.nextAction}</span> },
      { key: "risk", header: "Risco", render: (r) => <RiskBadge level={r.riskLevel} /> },
      { key: "cost", header: "Custo", render: (r) => <span className="tabular-nums text-muted-foreground">{formatCurrencyCents(r.costActualCents)}</span> },
      { key: "at", header: "Última atividade", render: (r) => <span className="text-muted-foreground">{formatRelative(r.lastActivityAt)}</span> },
    ];
    return (
      <div>
        <PageHeader eyebrow="Operação" title="Produção" description="Todos os conteúdos em andamento, com etapa, agente responsável e próxima ação." />
        <div className="p-4"><Card padded={false}><CompactTable rows={rows} columns={cols} className="border-0 rounded-none" empty="Nada em produção no canal ativo." /></Card></div>
      </div>
    );
  },
});
