import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context";
import { getHumanApprovals } from "@/services/api-client";
import { Card, EmptyState, SectionHeader } from "@/components/ui/data-card";
import { ApprovalStatusBadge, RiskBadge } from "@/components/status/badges";
import { formatCurrencyCents, formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { HumanApproval } from "@/contracts/types";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Aprovações — Aralume" },
      { name: "description", content: "Fila de aprovações humanas com recomendação dos agentes." },
    ],
  }),
  component: function ApprovalsPage() {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({
      queryKey: ["appr-page", activeChannelId],
      queryFn: () => getHumanApprovals(activeChannelId),
    });
    const rows = q.data?.data ?? [];
    const [sel, setSel] = useState<string | null>(null);
    const selected = rows.find((r) => r.id === sel) ?? rows[0];

    const act = (label: string) => toast(`${label} — ação mockada`);

    return (
      <div>
        <PageHeader
          eyebrow="Governança"
          title="Aprovações"
          description="Itens que aguardam decisão humana antes de avançar."
        />
        <div className="grid grid-cols-12 gap-4 p-4">
          <div className="col-span-12 lg:col-span-7">
            <Card padded={false}>
              <ul className="divide-y divide-border">
                {rows.map((a: HumanApproval) => (
                  <li key={a.id}>
                    <button
                      onClick={() => setSel(a.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-accent/40",
                        selected?.id === a.id && "bg-accent/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[12.5px] font-medium truncate">{a.title}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {a.summary}
                          </div>
                          <div className="text-[10.5px] text-muted-foreground mt-1">
                            {a.approvalType} · {formatCurrencyCents(a.costActualCents)} ·{" "}
                            {formatRelative(a.createdAt)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <RiskBadge level={a.riskLevel} />
                          <ApprovalStatusBadge status={a.status} />
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
                {rows.length === 0 && (
                  <li className="p-4">
                    <EmptyState title="Sem aprovações" />
                  </li>
                )}
              </ul>
            </Card>
          </div>
          <div className="col-span-12 lg:col-span-5">
            {selected ? (
              <Card>
                <SectionHeader title="Detalhe da aprovação" description={selected.title} />
                <div className="text-[12px] space-y-1.5">
                  <div>
                    <span className="text-muted-foreground">Tipo: </span>
                    {selected.approvalType}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Recomendação dos agentes: </span>
                    <b>{selected.recommendation}</b>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Custo acumulado: </span>
                    {formatCurrencyCents(selected.costActualCents)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Criada em: </span>
                    {formatDateTime(selected.createdAt)}
                  </div>
                  <p className="text-muted-foreground pt-2">{selected.summary}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => act("Aprovar")}
                    className="h-8 px-3 rounded-sm bg-ok text-[11.5px] font-medium text-primary-foreground hover:opacity-95"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => act("Solicitar ajuste")}
                    className="h-8 px-3 rounded-sm bg-warning text-[11.5px] font-medium text-primary-foreground hover:opacity-95"
                  >
                    Solicitar ajuste
                  </button>
                  <button
                    onClick={() => act("Rejeitar")}
                    className="h-8 px-3 rounded-sm border border-border text-[11.5px] font-medium hover:bg-accent/50"
                  >
                    Rejeitar
                  </button>
                  <button
                    onClick={() => act("Bloquear")}
                    className="h-8 px-3 rounded-sm bg-critical text-[11.5px] font-medium text-primary-foreground hover:opacity-95"
                  >
                    Bloquear
                  </button>
                  <button
                    onClick={() => act("Reprocessar etapa")}
                    className="h-8 px-3 rounded-sm border border-border text-[11.5px] font-medium hover:bg-accent/50"
                  >
                    Reprocessar
                  </button>
                </div>
              </Card>
            ) : (
              <Card>
                <EmptyState title="Selecione um item" />
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  },
});
