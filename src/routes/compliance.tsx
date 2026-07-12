import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context";
import { getComplianceChecks } from "@/services/api-client";
import { Card, EmptyState, SectionHeader } from "@/components/ui/data-card";
import { ComplianceStatusBadge, RiskBadge, StatusBadge } from "@/components/status/badges";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/compliance")({
  head: () => ({ meta: [{ title: "Conformidade — Aralume" }, { name: "description", content: "Alertas, bloqueios e riscos editoriais detectados." }] }),
  component: () => {
    const { activeChannelId } = useChannelContext();
    const q = useQuery({ queryKey: ["cc", activeChannelId], queryFn: () => getComplianceChecks(activeChannelId) });
    const rows = q.data?.data ?? [];
    return (
      <div>
        <PageHeader eyebrow="Governança" title="Conformidade" description="Alertas, bloqueios e riscos identificados pelo agente de Conformidade." />
        <div className="p-4 space-y-3">
          {rows.map((c) => (
            <Card key={c.id}>
              <SectionHeader
                title={`Conteúdo ${c.contentId}`}
                description={`Requer revisão humana: ${c.requiresHumanReview ? "sim" : "não"}`}
                action={<div className="flex items-center gap-1.5"><ComplianceStatusBadge status={c.status} /><RiskBadge level={c.riskLevel} /></div>}
              />
              <ul className="divide-y divide-border rounded-sm border border-border">
                {c.findings.map((f) => (
                  <li key={f.id} className="px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-medium">{f.title}</div>
                        <div className="text-[11.5px] text-muted-foreground">{f.description}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RiskBadge level={f.severity} />
                        {f.blocking && <StatusBadge tone="critical">Bloqueante</StatusBadge>}
                      </div>
                    </div>
                  </li>
                ))}
                {c.findings.length === 0 && <li className="p-3 text-[12px] text-muted-foreground">Sem findings.</li>}
              </ul>
              <div className="mt-2 text-[10.5px] text-muted-foreground">Avaliado em {formatDateTime(c.createdAt)}</div>
            </Card>
          ))}
          {rows.length === 0 && <Card><EmptyState title="Nenhuma verificação no canal ativo" /></Card>}
        </div>
      </div>
    );
  },
});
