import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { GovernanceCheckActions } from "@/components/governance/governance-check-actions";
import {
  ApprovalStatusBadge,
  ComplianceStatusBadge,
  QualityCheckStatusBadge,
  RiskBadge,
  StatusBadge,
} from "@/components/status/badges";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
} from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  ApprovalStatus,
  ComplianceCheck,
  GovernanceEntityType,
  HumanApproval,
  QualityCheck,
} from "@/contracts/types";
import {
  approveApproval,
  createApproval,
  describeApprovalsApiError,
  getApprovalHistory,
  getApprovals,
  getComplianceChecks,
  getContentIdea,
  getProductionItem,
  getQualityChecks,
  getResearchSession,
  getScript,
  getVisualPlan,
  rejectApproval,
  requestApprovalChanges,
} from "@/services/api-client";
import { describeEditorialApiError } from "@/services/editorial-api";
import { describeResearchApiError } from "@/services/research-api";
import { describeScriptsApiError } from "@/services/scripts-api";
import { describeVisualPlanApiError } from "@/services/visual-plans-api";

const operatorName = "Ana Ribeiro";

const entityTypeLabel: Record<GovernanceEntityType, string> = {
  content_idea: "Ideia editorial",
  production_item: "Item de producao",
  research_session: "Sessao de pesquisa",
  script: "Roteiro",
  visual_plan: "Plano visual",
};

const approvalStatusOptions: Array<{ value: ApprovalStatus | "all"; label: string }> = [
  { value: "all", label: "Todos os status" },
  { value: "pending", label: "Pendente" },
  { value: "blocked", label: "Bloqueado" },
  { value: "changes_requested", label: "Alteracoes solicitadas" },
  { value: "rejected", label: "Rejeitado" },
  { value: "approved", label: "Aprovado" },
];

const riskOptions: Array<{ value: HumanApproval["riskLevel"] | "all"; label: string }> = [
  { value: "all", label: "Todos os riscos" },
  { value: "ok", label: "OK" },
  { value: "attention", label: "Atencao" },
  { value: "warning", label: "Alerta" },
  { value: "critical", label: "Critico" },
  { value: "blocked", label: "Bloqueado" },
];

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Aprovacoes - Aralume" },
      {
        name: "description",
        content: "Fila de aprovacoes com qualidade, conformidade e historico.",
      },
    ],
  }),
  component: function ApprovalsPage() {
    const { channels, activeChannelId } = useChannelContext();
    const queryClient = useQueryClient();
    const [channelFilter, setChannelFilter] = useState<string | undefined>(activeChannelId);
    const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">("all");
    const [riskFilter, setRiskFilter] = useState<HumanApproval["riskLevel"] | "all">("all");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [decisionReason, setDecisionReason] = useState("");
    const [newEntityType, setNewEntityType] = useState<GovernanceEntityType>("script");
    const [newEntityId, setNewEntityId] = useState("");
    const [newApprovalTitle, setNewApprovalTitle] = useState("");
    const [newApprovalSummary, setNewApprovalSummary] = useState("");

    useEffect(() => {
      setChannelFilter(activeChannelId);
    }, [activeChannelId]);

    const approvalsQuery = useQuery({
      queryKey: ["approvals", channelFilter, statusFilter, riskFilter],
      queryFn: () =>
        getApprovals({
          channelId: channelFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
          riskLevel: riskFilter === "all" ? undefined : riskFilter,
        }),
    });

    const qualityChecksQuery = useQuery({
      queryKey: ["approvals-quality", channelFilter],
      queryFn: () => getQualityChecks({ channelId: channelFilter }),
    });

    const complianceChecksQuery = useQuery({
      queryKey: ["approvals-compliance", channelFilter],
      queryFn: () => getComplianceChecks({ channelId: channelFilter }),
    });

    const rows = useMemo(() => approvalsQuery.data?.data ?? [], [approvalsQuery.data]);
    const isLoading = approvalsQuery.isPending && rows.length === 0;
    const hasError = !!approvalsQuery.error && rows.length === 0;

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

    useEffect(() => {
      setDecisionReason("");
    }, [selected?.id]);

    const selectedQualityChecks = filterChecksForEntity(
      qualityChecksQuery.data?.data ?? [],
      selected?.channelId,
      selected?.entityType,
      selected?.entityId,
    );
    const selectedComplianceChecks = filterChecksForEntity(
      complianceChecksQuery.data?.data ?? [],
      selected?.channelId,
      selected?.entityType,
      selected?.entityId,
    );
    const latestQualityCheck = selectedQualityChecks[0];
    const latestComplianceCheck = selectedComplianceChecks[0];

    const entityQuery = useQuery({
      queryKey: ["approval-entity", selected?.entityType, selected?.entityId],
      queryFn: () => fetchGovernanceTarget(selected!, activeChannelId),
      enabled: !!selected,
    });

    const historyQuery = useQuery({
      queryKey: ["approval-history", selected?.id],
      queryFn: () => getApprovalHistory(selected!.id, selected!.channelId),
      enabled: !!selected,
    });

    const decisionMutation = useMutation({
      mutationFn: async (decision: "approve" | "reject" | "request_changes") => {
        if (!selected) {
          throw new Error("Selecione uma aprovacao.");
        }

        const input = {
          channelId: selected.channelId,
          decidedBy: operatorName,
          decisionReason: decisionReason.trim(),
        };

        switch (decision) {
          case "approve":
            return approveApproval(selected.id, input);
          case "reject":
            return rejectApproval(selected.id, input);
          case "request_changes":
            return requestApprovalChanges(selected.id, input);
        }
      },
      onSuccess: async () => {
        toast.success("Decisao registrada.");
        setDecisionReason("");
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["approvals"] }),
          queryClient.invalidateQueries({ queryKey: ["approval-history"] }),
          queryClient.invalidateQueries({ queryKey: ["approvals-quality"] }),
          queryClient.invalidateQueries({ queryKey: ["approvals-compliance"] }),
        ]);
      },
      onError: (error) => {
        toast.error(describeApprovalsApiError(error));
      },
    });

    const createApprovalMutation = useMutation({
      mutationFn: () => {
        if (!activeChannelId || !newEntityId.trim()) {
          throw new Error("Informe o canal ativo e o ID do artefato.");
        }

        return createApproval({
          channelId: activeChannelId,
          entityType: newEntityType,
          entityId: newEntityId.trim(),
          requestedBy: operatorName,
          title: newApprovalTitle.trim() || undefined,
          summary: newApprovalSummary.trim() || undefined,
        });
      },
      onSuccess: async (response) => {
        toast.success(
          response.data.status === "blocked"
            ? "Aprovacao criada com bloqueio de governanca."
            : "Solicitacao de aprovacao criada.",
        );
        setNewEntityId("");
        setNewApprovalTitle("");
        setNewApprovalSummary("");
        setSelectedId(response.data.id);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["approvals"] }),
          queryClient.invalidateQueries({ queryKey: ["approvals-quality"] }),
          queryClient.invalidateQueries({ queryKey: ["approvals-compliance"] }),
        ]);
      },
      onError: (error) => {
        toast.error(describeApprovalsApiError(error));
      },
    });

    const approvalColumns: Column<HumanApproval>[] = [
      {
        key: "title",
        header: "Aprovacao",
        render: (row) => (
          <div className="min-w-0">
            <div className="font-medium truncate">{row.title}</div>
            <div className="text-[10.5px] text-muted-foreground truncate">
              {entityTypeLabel[row.entityType]} · {row.targetSnapshot.title}
            </div>
          </div>
        ),
      },
      {
        key: "quality",
        header: "Qualidade",
        render: (row) => <QualityBadge row={row} checks={qualityChecksQuery.data?.data ?? []} />,
      },
      {
        key: "compliance",
        header: "Conformidade",
        render: (row) => (
          <ComplianceBadge row={row} checks={complianceChecksQuery.data?.data ?? []} />
        ),
      },
      { key: "risk", header: "Risco", render: (row) => <RiskBadge level={row.riskLevel} /> },
      {
        key: "status",
        header: "Status",
        render: (row) => <ApprovalStatusBadge status={row.status} />,
      },
      {
        key: "requested",
        header: "Solicitado",
        render: (row) => (
          <span className="text-muted-foreground">{formatRelative(row.requestedAt)}</span>
        ),
      },
    ];

    const approveDisabledReason = getApproveDisabledReason(
      selected,
      latestQualityCheck,
      latestComplianceCheck,
    );
    const decisionDisabled = decisionMutation.isPending || decisionReason.trim().length === 0;
    const approveDisabled = decisionDisabled || !!approveDisabledReason;
    const finalState =
      selected && (selected.status === "approved" || selected.status === "rejected");

    return (
      <div>
        <PageHeader
          eyebrow="Governanca"
          title="Aprovacoes"
          description="Fila de aprovacao humana com qualidade, conformidade e historico de decisoes."
        />
        <div className="p-4 space-y-4">
          <GovernanceCheckActions channelId={activeChannelId} />
          <Card>
            <SectionHeader
              title="Nova aprovacao"
              description="Crie uma solicitacao real para o artefato selecionado do canal ativo."
            />
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-1">
                  <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                    Tipo de artefato
                  </span>
                  <select
                    aria-label="Tipo de artefato da aprovacao"
                    value={newEntityType}
                    onChange={(event) =>
                      setNewEntityType(event.target.value as GovernanceEntityType)
                    }
                    className="h-8 w-full rounded-sm border border-border bg-surface px-2 text-[12px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  >
                    {Object.entries(entityTypeLabel).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                    ID do artefato
                  </span>
                  <input
                    aria-label="ID do artefato da aprovacao"
                    value={newEntityId}
                    onChange={(event) => setNewEntityId(event.target.value)}
                    placeholder="Ex.: sc_01"
                    className="h-8 w-full rounded-sm border border-border bg-surface px-2 text-[12px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                    Titulo opcional
                  </span>
                  <input
                    aria-label="Titulo da aprovacao"
                    value={newApprovalTitle}
                    onChange={(event) => setNewApprovalTitle(event.target.value)}
                    className="h-8 w-full rounded-sm border border-border bg-surface px-2 text-[12px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                    Resumo opcional
                  </span>
                  <input
                    aria-label="Resumo da aprovacao"
                    value={newApprovalSummary}
                    onChange={(event) => setNewApprovalSummary(event.target.value)}
                    className="h-8 w-full rounded-sm border border-border bg-surface px-2 text-[12px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={
                  !activeChannelId || !newEntityId.trim() || createApprovalMutation.isPending
                }
                onClick={() => createApprovalMutation.mutate()}
                className={decisionButtonClass(
                  "ok",
                  !activeChannelId || !newEntityId.trim() || createApprovalMutation.isPending,
                )}
              >
                {createApprovalMutation.isPending ? "Criando aprovacao..." : "Criar aprovacao"}
              </button>
              {!activeChannelId && (
                <div className="text-[12px] text-warning">
                  Selecione um canal ativo para continuar.
                </div>
              )}
            </div>
          </Card>
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
                    setStatusFilter(event.target.value as ApprovalStatus | "all");
                    setSelectedId(null);
                  }}
                  className="h-8 w-full rounded-sm border border-border bg-surface px-2 text-[12px] outline-none"
                >
                  {approvalStatusOptions.map((option) => (
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
                    setRiskFilter(event.target.value as HumanApproval["riskLevel"] | "all");
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
                  onClick={() => void approvalsQuery.refetch()}
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
                  <LoadingState label="Carregando aprovacoes" />
                ) : hasError ? (
                  <div className="p-4">
                    <ErrorState message={describeApprovalsApiError(approvalsQuery.error)} />
                    <button
                      onClick={() => void approvalsQuery.refetch()}
                      className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : rows.length === 0 ? (
                  <EmptyState
                    title="Nenhuma aprovacao encontrada"
                    description="Ajuste os filtros de canal, status ou risco."
                  />
                ) : (
                  <CompactTable
                    rows={rows}
                    columns={approvalColumns}
                    onRowClick={(row) => setSelectedId(row.id)}
                    empty="Nenhuma aprovacao no filtro atual."
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
                      title={selected.title}
                      description={`${entityTypeLabel[selected.entityType]} · ${selected.targetSnapshot.title}`}
                      action={
                        <div className="flex items-center gap-1.5">
                          <ApprovalStatusBadge status={selected.status} />
                          <RiskBadge level={selected.riskLevel} />
                        </div>
                      }
                    />
                    <dl className="grid grid-cols-2 gap-3 text-[12px]">
                      <DetailPair label="Canal" value={channelName(channels, selected.channelId)} />
                      <DetailPair label="Solicitado por" value={selected.requestedBy} />
                      <DetailPair
                        label="Solicitado em"
                        value={formatDateTime(selected.requestedAt)}
                      />
                      <DetailPair
                        label="Decidido em"
                        value={selected.decidedAt ? formatDateTime(selected.decidedAt) : "Pendente"}
                      />
                    </dl>
                    <div className="mt-3 rounded-md border border-border bg-surface-muted p-3 text-[12px] text-muted-foreground">
                      {selected.summary}
                    </div>
                  </Card>

                  <Card>
                    <SectionHeader
                      title="Conteudo relacionado"
                      description="Fonte editorial vinculada ao item."
                    />
                    {entityQuery.isPending ? (
                      <LoadingState label="Carregando conteudo relacionado" />
                    ) : entityQuery.error ? (
                      <ErrorState
                        message={describeEntityError(selected.entityType, entityQuery.error)}
                      />
                    ) : (
                      <div className="space-y-3 text-[12px]">
                        <dl className="grid grid-cols-2 gap-2">
                          <DetailPair label="Titulo" value={selected.targetSnapshot.title} />
                          <DetailPair label="Status" value={selected.targetSnapshot.status} />
                          <DetailPair label="Risco" value={selected.targetSnapshot.riskLevel} />
                          <DetailPair label="ID" value={selected.entityId} mono />
                        </dl>
                        {renderEntityDetail(
                          selected.entityType,
                          entityQuery.data?.data,
                          selected.targetSnapshot.riskLevel,
                        )}
                      </div>
                    )}
                  </Card>

                  <Card>
                    <SectionHeader
                      title="Qualidade"
                      description="Resultados deterministas de qualidade."
                    />
                    {latestQualityCheck ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <QualityCheckStatusBadge status={latestQualityCheck.status} />
                          <StatusBadge tone="muted">Score {latestQualityCheck.score}</StatusBadge>
                          <span className="text-[10.5px] text-muted-foreground">
                            {formatDateTime(latestQualityCheck.checkedAt)}
                          </span>
                        </div>
                        <CheckList checks={latestQualityCheck.checks} />
                        {latestQualityCheck.summary && (
                          <div className="rounded-md border border-border bg-surface-muted p-3 text-[12px] text-muted-foreground">
                            {latestQualityCheck.summary}
                          </div>
                        )}
                      </div>
                    ) : (
                      <EmptyState
                        title="Sem quality check"
                        description="Nenhum resultado de qualidade encontrado para este item."
                      />
                    )}
                  </Card>

                  <Card>
                    <SectionHeader
                      title="Conformidade"
                      description="Resultados deterministas de conformidade."
                    />
                    {latestComplianceCheck ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <ComplianceStatusBadge status={latestComplianceCheck.status} />
                          <RiskBadge level={latestComplianceCheck.riskLevel} />
                          {latestComplianceCheck.requiresHumanReview && (
                            <StatusBadge tone="warning">Revisao humana</StatusBadge>
                          )}
                          <span className="text-[10.5px] text-muted-foreground">
                            {formatDateTime(latestComplianceCheck.checkedAt)}
                          </span>
                        </div>
                        <FindingList findings={latestComplianceCheck.findings} />
                      </div>
                    ) : (
                      <EmptyState
                        title="Sem compliance check"
                        description="Nenhum resultado de conformidade encontrado para este item."
                      />
                    )}
                  </Card>

                  <Card>
                    <SectionHeader
                      title="Historico de decisoes"
                      description="Registro imutavel das decisoes humanas."
                    />
                    {historyQuery.isPending ? (
                      <LoadingState label="Carregando historico" />
                    ) : historyQuery.error ? (
                      <ErrorState message={describeApprovalsApiError(historyQuery.error)} />
                    ) : (historyQuery.data?.data ?? []).length > 0 ? (
                      <div className="space-y-2">
                        {(historyQuery.data?.data ?? []).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-md border border-border p-3 text-[12px]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium">{item.decision}</div>
                              <div className="text-[10.5px] text-muted-foreground">
                                {formatDateTime(item.decidedAt)}
                              </div>
                            </div>
                            <div className="mt-1 text-muted-foreground">
                              {item.previousStatus} → {item.nextStatus} · {item.actor}
                            </div>
                            <div className="mt-1 text-muted-foreground">{item.justification}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="Sem historico"
                        description="Nenhuma decisao foi registrada ainda."
                      />
                    )}
                  </Card>

                  <Card>
                    <SectionHeader
                      title="Decisao humana"
                      description="A justificativa e obrigatoria para todas as decisoes registradas nesta sprint."
                    />
                    <div className="space-y-3">
                      {approveDisabledReason && (
                        <div className="rounded-md border border-warning/40 bg-warning-soft p-3 text-[12px] text-warning">
                          {approveDisabledReason}
                        </div>
                      )}
                      {finalState && (
                        <div className="rounded-md border border-border bg-surface-muted p-3 text-[12px] text-muted-foreground">
                          Esta aprovacao ja atingiu um estado final. Novas decisoes exigem um
                          registro novo.
                        </div>
                      )}
                      <label className="space-y-1 block">
                        <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                          Justificativa
                        </div>
                        <textarea
                          aria-label="Justificativa da decisao"
                          value={decisionReason}
                          onChange={(event) => setDecisionReason(event.target.value)}
                          rows={4}
                          placeholder="Explique a decisao humana, o ajuste solicitado ou o motivo da rejeicao."
                          className="min-h-[96px] w-full rounded-md border border-border bg-surface px-3 py-2 text-[12px] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                        />
                      </label>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <button
                          disabled={approveDisabled}
                          onClick={() => decisionMutation.mutate("approve")}
                          title={approveDisabledReason ?? undefined}
                          className={decisionButtonClass("ok", approveDisabled)}
                        >
                          Aprovar
                        </button>
                        <button
                          disabled={decisionDisabled || finalState}
                          onClick={() => decisionMutation.mutate("reject")}
                          className={decisionButtonClass(
                            "critical",
                            decisionDisabled || !!finalState,
                          )}
                        >
                          Rejeitar
                        </button>
                        <button
                          disabled={decisionDisabled || finalState}
                          onClick={() => decisionMutation.mutate("request_changes")}
                          className={decisionButtonClass(
                            "warning",
                            decisionDisabled || !!finalState,
                          )}
                        >
                          Solicitar alteracoes
                        </button>
                      </div>
                      <div className="text-[10.5px] text-muted-foreground">
                        Operador: {operatorName}. O backend bloqueia decisoes repetidas e transicoes
                        invalidas.
                      </div>
                    </div>
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

function decisionButtonClass(tone: "ok" | "critical" | "warning", disabled: boolean): string {
  const base =
    "inline-flex items-center justify-center h-8 rounded-sm px-3 text-[12px] font-medium transition-colors";

  if (disabled) {
    return cn(base, "border border-border bg-surface text-muted-foreground opacity-60");
  }

  const tones: Record<"ok" | "critical" | "warning", string> = {
    ok: "bg-ok text-primary-foreground hover:opacity-95",
    critical: "bg-critical text-primary-foreground hover:opacity-95",
    warning: "bg-warning text-primary-foreground hover:opacity-95",
  };

  return cn(base, tones[tone]);
}

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
      <div className={cn("mt-1 text-[12px]", mono && "font-mono text-[11px]")}>{value}</div>
    </div>
  );
}

function CheckList({ checks }: { checks: QualityCheck["checks"] }) {
  return (
    <div className="space-y-2">
      {checks.map((check) => (
        <div key={check.code} className="rounded-md border border-border p-3 text-[12px]">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium">{check.name}</div>
            <div className="flex items-center gap-1.5">
              <StatusBadge
                tone={check.blocking ? "critical" : check.result === "pass" ? "ok" : "warning"}
              >
                {check.result}
              </StatusBadge>
              <RiskBadge level={check.severity} />
            </div>
          </div>
          <div className="mt-1 text-muted-foreground">{check.message}</div>
        </div>
      ))}
      {checks.length === 0 && (
        <EmptyState title="Sem checks" description="Nao ha verificacoes registradas." />
      )}
    </div>
  );
}

function FindingList({ findings }: { findings: ComplianceCheck["findings"] }) {
  return (
    <div className="space-y-2">
      {findings.map((finding) => (
        <div key={finding.code} className="rounded-md border border-border p-3 text-[12px]">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium">{finding.name}</div>
            <div className="flex items-center gap-1.5">
              <RiskBadge level={finding.severity} />
              {finding.blocking && <StatusBadge tone="critical">Bloqueante</StatusBadge>}
            </div>
          </div>
          <div className="mt-1 text-muted-foreground">{finding.message}</div>
        </div>
      ))}
      {findings.length === 0 && (
        <EmptyState title="Sem findings" description="Nenhuma divergencia foi registrada." />
      )}
    </div>
  );
}

function QualityBadge({ row, checks }: { row: HumanApproval; checks: QualityCheck[] }) {
  const latest = latestCheckForEntity(checks, row.channelId, row.entityType, row.entityId);
  return latest ? (
    <QualityCheckStatusBadge status={latest.status} />
  ) : (
    <StatusBadge tone="muted">Sem check</StatusBadge>
  );
}

function ComplianceBadge({ row, checks }: { row: HumanApproval; checks: ComplianceCheck[] }) {
  const latest = latestCheckForEntity(checks, row.channelId, row.entityType, row.entityId);
  return latest ? (
    <ComplianceStatusBadge status={latest.status} />
  ) : (
    <StatusBadge tone="muted">Sem check</StatusBadge>
  );
}

function latestCheckForEntity<
  T extends {
    channelId: string;
    entityType: GovernanceEntityType;
    entityId: string;
    checkedAt: string;
  },
>(
  checks: T[],
  channelId: string,
  entityType: GovernanceEntityType,
  entityId: string,
): T | undefined {
  return checks.find(
    (check) =>
      check.channelId === channelId &&
      check.entityType === entityType &&
      check.entityId === entityId,
  );
}

function filterChecksForEntity<
  T extends {
    channelId: string;
    entityType: GovernanceEntityType;
    entityId: string;
    checkedAt: string;
  },
>(
  checks: T[],
  channelId: string | undefined,
  entityType: GovernanceEntityType | undefined,
  entityId: string | undefined,
): T[] {
  if (!channelId || !entityType || !entityId) {
    return [];
  }

  return checks.filter(
    (check) =>
      check.channelId === channelId &&
      check.entityType === entityType &&
      check.entityId === entityId,
  );
}

function getApproveDisabledReason(
  approval: HumanApproval | undefined,
  qualityCheck: QualityCheck | undefined,
  complianceCheck: ComplianceCheck | undefined,
): string | null {
  if (!approval) {
    return null;
  }

  if (approval.status === "approved") {
    return "Esta aprovacao ja foi concluida.";
  }

  if (approval.status === "rejected") {
    return "Esta aprovacao foi rejeitada e nao pode ser aprovada novamente.";
  }

  if (qualityCheck && qualityCheck.status === "blocked") {
    return "Qualidade bloqueia a aprovacao.";
  }

  if (qualityCheck && qualityCheck.blockingFindings.length > 0) {
    return "Existe finding bloqueador de qualidade.";
  }

  if (complianceCheck && complianceCheck.status === "blocked") {
    return "Conformidade bloqueia a aprovacao.";
  }

  if (complianceCheck && complianceCheck.status === "rejected") {
    return "Conformidade reprovada bloqueia a aprovacao.";
  }

  if (complianceCheck && complianceCheck.blockingFindings.length > 0) {
    return "Existe finding bloqueador de conformidade.";
  }

  return null;
}

async function fetchGovernanceTarget(approval: HumanApproval, channelId?: string) {
  switch (approval.entityType) {
    case "content_idea":
      return getContentIdea(approval.entityId);
    case "production_item":
      return getProductionItem(approval.entityId);
    case "research_session":
      return getResearchSession(approval.entityId);
    case "script":
      return channelId ? getScript(approval.entityId, channelId) : undefined;
    case "visual_plan":
      return channelId ? getVisualPlan(approval.entityId, channelId) : undefined;
  }
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
        <dl className="grid grid-cols-2 gap-2">
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
        <dl className="grid grid-cols-2 gap-2">
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
        <dl className="grid grid-cols-2 gap-2">
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
        <dl className="grid grid-cols-2 gap-2">
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
        <dl className="grid grid-cols-2 gap-2">
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

function channelName(channels: Array<{ id: string; name: string }>, channelId: string): string {
  return channels.find((channel) => channel.id === channelId)?.name ?? channelId;
}
