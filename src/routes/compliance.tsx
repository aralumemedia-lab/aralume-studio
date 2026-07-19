import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { GovernanceCheckActions } from "@/components/governance/governance-check-actions";
import { ComplianceStatusBadge, RiskBadge, StatusBadge } from "@/components/status/badges";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
} from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { formatDateTime, formatRelative } from "@/lib/format";
import type { ComplianceCheck, GovernanceEntityType } from "@/contracts/types";
import {
  describeComplianceApiError,
  getComplianceChecks,
  getContentIdea,
  getProductionItem,
  getResearchSession,
  getScript,
  getVisualPlan,
} from "@/services/api-client";
import { describeEditorialApiError } from "@/services/editorial-api";
import { describeResearchApiError } from "@/services/research-api";
import { describeScriptsApiError } from "@/services/scripts-api";
import { describeVisualPlanApiError } from "@/services/visual-plans-api";

const entityTypeLabel: Record<GovernanceEntityType, string> = {
  content_idea: "Ideia editorial",
  production_item: "Item de producao",
  research_session: "Sessao de pesquisa",
  script: "Roteiro",
  visual_plan: "Plano visual",
};

const complianceStatusOptions: Array<{ value: ComplianceCheck["status"] | "all"; label: string }> =
  [
    { value: "all", label: "Todos os status" },
    { value: "approved", label: "Aprovado" },
    { value: "attention", label: "Atencao" },
    { value: "rejected", label: "Rejeitado" },
    { value: "blocked", label: "Bloqueado" },
    { value: "needs_human_review", label: "Revisao humana" },
  ];

const riskOptions: Array<{ value: ComplianceCheck["riskLevel"] | "all"; label: string }> = [
  { value: "all", label: "Todos os riscos" },
  { value: "ok", label: "OK" },
  { value: "attention", label: "Atencao" },
  { value: "warning", label: "Alerta" },
  { value: "critical", label: "Critico" },
  { value: "blocked", label: "Bloqueado" },
];

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Conformidade - Aralume" },
      {
        name: "description",
        content: "Alertas, bloqueios e revisao humana do pipeline editorial.",
      },
    ],
  }),
  component: function CompliancePage() {
    const { channels, activeChannelId } = useChannelContext();
    const [channelFilter, setChannelFilter] = useState<string | undefined>(activeChannelId);
    const [statusFilter, setStatusFilter] = useState<ComplianceCheck["status"] | "all">("all");
    const [riskFilter, setRiskFilter] = useState<ComplianceCheck["riskLevel"] | "all">("all");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
      setChannelFilter(activeChannelId);
    }, [activeChannelId]);

    const query = useQuery({
      queryKey: ["compliance", channelFilter, statusFilter, riskFilter],
      queryFn: () =>
        getComplianceChecks({
          channelId: channelFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
          riskLevel: riskFilter === "all" ? undefined : riskFilter,
        }),
    });

    const rows = useMemo(() => query.data?.data ?? [], [query.data]);
    const isLoading = query.isPending && rows.length === 0;
    const hasError = !!query.error && rows.length === 0;

    useEffect(() => {
      if (rows.length === 0) {
        setSelectedId(null);
        return;
      }

      if (!selectedId || !rows.some((row) => row.id === selectedId)) {
        setSelectedId(rows[0].id);
      }
    }, [rows, selectedId]);

    const selected = rows.find((row) => row.id === selectedId) ?? rows[0];

    const entityQuery = useQuery({
      queryKey: ["compliance-entity", selected?.entityType, selected?.entityId],
      queryFn: () => fetchGovernanceTarget(selected!, activeChannelId),
      enabled: !!selected,
    });

    const columns: Column<ComplianceCheck>[] = [
      {
        key: "title",
        header: "Conformidade",
        render: (row) => (
          <div className="min-w-0">
            <div className="font-medium truncate">{row.targetSnapshot.title}</div>
            <div className="text-[10.5px] text-muted-foreground truncate">
              {entityTypeLabel[row.entityType]} · {row.targetSnapshot.summary}
            </div>
          </div>
        ),
      },
      {
        key: "entity",
        header: "Entidade",
        render: (row) => <StatusBadge tone="muted">{entityTypeLabel[row.entityType]}</StatusBadge>,
      },
      {
        key: "risk",
        header: "Risco",
        render: (row) => <RiskBadge level={row.riskLevel} />,
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <ComplianceStatusBadge status={row.status} />,
      },
      {
        key: "review",
        header: "Revisao",
        render: (row) =>
          row.requiresHumanReview ? (
            <StatusBadge tone="warning">Revisao humana</StatusBadge>
          ) : (
            <StatusBadge tone="ok">Nao requerida</StatusBadge>
          ),
      },
      {
        key: "checked",
        header: "Verificado",
        render: (row) => (
          <span className="text-muted-foreground">{formatRelative(row.checkedAt)}</span>
        ),
      },
    ];

    return (
      <div>
        <PageHeader
          eyebrow="Governanca"
          title="Conformidade"
          description="Leituras deterministicas de risco, bloqueio e revisao humana sobre o pipeline editorial."
        />
        <div className="p-4 space-y-4">
          <GovernanceCheckActions channelId={activeChannelId} />
          <Card>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              <label className="space-y-1">
                <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                  Canal
                </div>
                <select
                  value={channelFilter ?? ""}
                  onChange={(event) => {
                    setChannelFilter(event.target.value || undefined);
                    setSelectedId(null);
                  }}
                  className="h-8 w-full rounded-sm border border-border bg-surface px-2 text-[12px] outline-none"
                >
                  <option value="">Todos os canais</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                  Status
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as ComplianceCheck["status"] | "all");
                    setSelectedId(null);
                  }}
                  className="h-8 w-full rounded-sm border border-border bg-surface px-2 text-[12px] outline-none"
                >
                  {complianceStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                  Risco
                </div>
                <select
                  value={riskFilter}
                  onChange={(event) => {
                    setRiskFilter(event.target.value as ComplianceCheck["riskLevel"] | "all");
                    setSelectedId(null);
                  }}
                  className="h-8 w-full rounded-sm border border-border bg-surface px-2 text-[12px] outline-none"
                >
                  {riskOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <button
                  onClick={() => void query.refetch()}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                >
                  Atualizar
                </button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 min-w-0 xl:col-span-7">
              <Card padded={false}>
                {isLoading ? (
                  <LoadingState label="Carregando conformidade" />
                ) : hasError ? (
                  <div className="p-4">
                    <ErrorState message={describeComplianceApiError(query.error)} />
                    <button
                      onClick={() => void query.refetch()}
                      className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : rows.length === 0 ? (
                  <EmptyState
                    title="Nenhuma verificacao encontrada"
                    description="Ajuste os filtros de canal, status ou risco."
                  />
                ) : (
                  <CompactTable
                    rows={rows}
                    columns={columns}
                    onRowClick={(row) => setSelectedId(row.id)}
                    empty="Nenhuma verificacao no filtro atual."
                  />
                )}
              </Card>
            </div>

            <div className="col-span-12 min-w-0 xl:col-span-5 space-y-4">
              {selected ? (
                <>
                  <Card>
                    <SectionHeader
                      eyebrow="Detalhe"
                      title={selected.targetSnapshot.title}
                      description={entityTypeLabel[selected.entityType]}
                      action={
                        <div className="flex items-center gap-1.5">
                          <ComplianceStatusBadge status={selected.status} />
                          <RiskBadge level={selected.riskLevel} />
                        </div>
                      }
                    />
                    <dl className="grid grid-cols-2 gap-3 text-[12px]">
                      <DetailPair label="Canal" value={channelName(channels, selected.channelId)} />
                      <DetailPair
                        label="Verificado em"
                        value={formatDateTime(selected.checkedAt)}
                      />
                      <DetailPair
                        label="Revisao humana"
                        value={selected.requiresHumanReview ? "Obrigatoria" : "Nao obrigatoria"}
                      />
                      <DetailPair label="ID" value={selected.entityId} mono />
                    </dl>
                    <div className="mt-3 rounded-md border border-border bg-surface-muted p-3 text-[12px] text-muted-foreground">
                      {selected.targetSnapshot.summary}
                    </div>
                  </Card>

                  <Card>
                    <SectionHeader
                      title="Conteudo relacionado"
                      description="Resumo do artefato governado pela conformidade."
                    />
                    {entityQuery.isPending ? (
                      <LoadingState label="Carregando conteudo relacionado" />
                    ) : entityQuery.error ? (
                      <ErrorState
                        message={describeEntityError(selected.entityType, entityQuery.error)}
                      />
                    ) : (
                      renderEntityDetail(
                        selected.entityType,
                        entityQuery.data?.data,
                        selected.targetSnapshot.riskLevel,
                      )
                    )}
                  </Card>

                  <Card>
                    <SectionHeader
                      title="Findings"
                      description="Sinais deterministas encontrados na leitura."
                    />
                    {selected.findings.length > 0 ? (
                      <div className="space-y-2">
                        {selected.findings.map((finding) => (
                          <div
                            key={finding.code}
                            className="rounded-md border border-border p-3 text-[12px]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium">{finding.name}</div>
                              <div className="flex items-center gap-1.5">
                                <RiskBadge level={finding.severity} />
                                {finding.blocking && (
                                  <StatusBadge tone="critical">Bloqueante</StatusBadge>
                                )}
                              </div>
                            </div>
                            <div className="mt-1 text-muted-foreground">{finding.message}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="Sem findings"
                        description="Nenhuma divergencia foi encontrada."
                      />
                    )}
                  </Card>
                </>
              ) : (
                <Card>
                  <EmptyState
                    title="Selecione um item"
                    description="A fila esta vazia para os filtros atuais."
                  />
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
});

function DetailPair({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md border border-border p-2">
      <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className={mono ? "mt-1 font-mono text-[11px]" : "mt-1 text-[12px]"}>{value}</div>
    </div>
  );
}

function channelName(channels: Array<{ id: string; name: string }>, channelId: string): string {
  return channels.find((channel) => channel.id === channelId)?.name ?? channelId;
}

function renderEntityDetail(
  entityType: GovernanceEntityType,
  payload: unknown,
  fallbackRiskLevel?: string,
) {
  if (!payload || typeof payload !== "object") {
    return (
      <EmptyState title="Sem detalhes" description="Nao foi possivel ler o item relacionado." />
    );
  }

  switch (entityType) {
    case "content_idea":
      return (
        <dl className="grid grid-cols-2 gap-2 text-[12px]">
          <DetailPair label="Nicho" value={(payload as { niche: string }).niche} />
          <DetailPair label="Fonte" value={(payload as { source: string }).source} />
          <DetailPair
            label="Oportunidade"
            value={String((payload as { opportunityScore: number }).opportunityScore)}
          />
          <DetailPair label="Risco" value={(payload as { riskLevel: string }).riskLevel} />
        </dl>
      );
    case "production_item":
      return (
        <dl className="grid grid-cols-2 gap-2 text-[12px]">
          <DetailPair
            label="Progresso"
            value={`${(payload as { progressPercent: number }).progressPercent}%`}
          />
          <DetailPair
            label="Agente"
            value={(payload as { currentAgentName?: string }).currentAgentName ?? "—"}
          />
          <DetailPair label="Proxima acao" value={(payload as { nextAction: string }).nextAction} />
          <DetailPair label="Risco" value={(payload as { riskLevel: string }).riskLevel} />
        </dl>
      );
    case "research_session":
      return (
        <dl className="grid grid-cols-2 gap-2 text-[12px]">
          <DetailPair
            label="Fontes"
            value={String((payload as { sourceCount: number }).sourceCount)}
          />
          <DetailPair
            label="Claims"
            value={String((payload as { claimCount: number }).claimCount)}
          />
          <DetailPair
            label="Confianca"
            value={`${(payload as { confidenceScore: number }).confidenceScore}%`}
          />
          <DetailPair label="Risco" value={(payload as { riskLevel: string }).riskLevel} />
        </dl>
      );
    case "script":
      return (
        <dl className="grid grid-cols-2 gap-2 text-[12px]">
          <DetailPair
            label="Duracao"
            value={`${(payload as { estimatedDurationSeconds: number }).estimatedDurationSeconds}s`}
          />
          <DetailPair
            label="Versao atual"
            value={(payload as { currentVersionId: string }).currentVersionId}
            mono
          />
          <DetailPair label="CTA" value={(payload as { cta: string }).cta} />
          <DetailPair label="Risco" value={(payload as { riskLevel: string }).riskLevel} />
        </dl>
      );
    case "visual_plan":
      return (
        <dl className="grid grid-cols-2 gap-2 text-[12px]">
          <DetailPair
            label="Cenas"
            value={String((payload as { sceneCount: number }).sceneCount)}
          />
          <DetailPair
            label="Duracao"
            value={`${(payload as { estimatedDurationSeconds: number }).estimatedDurationSeconds}s`}
          />
          <DetailPair label="Estilo" value={(payload as { visualStyle: string }).visualStyle} />
          <DetailPair
            label="Risco"
            value={(payload as { riskLevel?: string }).riskLevel ?? fallbackRiskLevel ?? "—"}
          />
        </dl>
      );
  }
}

function describeEntityError(entityType: GovernanceEntityType, error: unknown): string {
  switch (entityType) {
    case "content_idea":
      return describeEditorialApiError(error, "ideas");
    case "production_item":
      return describeEditorialApiError(error, "production");
    case "research_session":
      return describeResearchApiError(error);
    case "script":
      return describeScriptsApiError(error);
    case "visual_plan":
      return describeVisualPlanApiError(error);
  }
}

async function fetchGovernanceTarget(check: ComplianceCheck, channelId?: string) {
  switch (check.entityType) {
    case "content_idea":
      return getContentIdea(check.entityId);
    case "production_item":
      return getProductionItem(check.entityId);
    case "research_session":
      return getResearchSession(check.entityId);
    case "script":
      return channelId ? getScript(check.entityId, channelId) : undefined;
    case "visual_plan":
      return channelId ? getVisualPlan(check.entityId, channelId) : undefined;
  }
}
