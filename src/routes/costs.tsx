import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { getCostEntries, getChannels } from "@/services/api-client";
import { Card, KpiCard, SectionHeader } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrencyCents, formatDateTime } from "@/lib/format";
import type { CostEntry } from "@/contracts/types";

export const Route = createFileRoute("/costs")({
  head: () => ({
    meta: [
      { title: "Custos — Aralume" },
      { name: "description", content: "Custos operacionais por canal, etapa e fornecedor." },
    ],
  }),
  component: function CostsPage() {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({
      queryKey: ["co", activeChannelId],
      queryFn: () => getCostEntries(activeChannelId),
    });
    const chQ = useQuery({ queryKey: ["ch"], queryFn: getChannels });
    const rows = q.data?.data ?? [];
    const total = rows.reduce((s, r) => s + r.amountCents, 0);
    const byType = new Map<string, number>();
    rows.forEach((r) => byType.set(r.costType, (byType.get(r.costType) ?? 0) + r.amountCents));
    const maxType = Math.max(1, ...Array.from(byType.values()));

    const cols: Column<CostEntry>[] = [
      {
        key: "prov",
        header: "Fornecedor",
        render: (r) => <span className="font-medium">{r.providerName}</span>,
      },
      {
        key: "type",
        header: "Tipo",
        render: (r) => <span className="text-muted-foreground">{r.costType}</span>,
      },
      {
        key: "desc",
        header: "Descrição",
        render: (r) => <span className="text-muted-foreground truncate">{r.description}</span>,
      },
      {
        key: "amt",
        header: "Valor",
        render: (r) => <span className="tabular-nums">{formatCurrencyCents(r.amountCents)}</span>,
      },
      {
        key: "at",
        header: "Data",
        render: (r) => <span className="text-muted-foreground">{formatDateTime(r.createdAt)}</span>,
      },
    ];
    return (
      <div>
        <PageHeader
          eyebrow="Governança"
          title="Custos"
          description="Custos por canal, etapa e fornecedor mockado. Suporta orçamentos e alertas."
        />
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <KpiCard label="Total do período" value={formatCurrencyCents(total)} />
            <Card>
              <SectionHeader title="Por tipo" />
              <ul className="space-y-2 text-[12px]">
                {Array.from(byType.entries()).map(([type, amount]) => (
                  <li key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span>{type}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatCurrencyCents(amount)}
                      </span>
                    </div>
                    <ProgressBar value={(amount / maxType) * 100} tone="info" />
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <SectionHeader title="Orçamentos por canal" />
              <ul className="space-y-2 text-[12px]">
                {(chQ.data?.data ?? []).map((c) => {
                  const pct = c.monthlyBudgetCents
                    ? (c.monthlyCostUsedCents / c.monthlyBudgetCents) * 100
                    : 0;
                  return (
                    <li key={c.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="truncate">{c.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatCurrencyCents(c.monthlyCostUsedCents)} /{" "}
                          {formatCurrencyCents(c.monthlyBudgetCents)}
                        </span>
                      </div>
                      <ProgressBar
                        value={pct}
                        tone={pct > 90 ? "critical" : pct > 70 ? "warning" : "ok"}
                      />
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
          <Card padded={false}>
            <CompactTable
              rows={rows}
              columns={cols}
              className="border-0 rounded-none"
              empty="Sem custos no canal ativo."
            />
          </Card>
        </div>
      </div>
    );
  },
});
