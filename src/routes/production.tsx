import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, LayoutGrid, Plus, RefreshCw, Save, Shapes, SquareStack } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { ContentStatusBadge, RiskBadge, StatusBadge } from "@/components/status/badges";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
} from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrencyCents, formatRelative } from "@/lib/format";
import type { ProductionItem, ScenePlan, Script, VisualPlan } from "@/contracts/types";
import {
  createScenePlan,
  createVisualPlan,
  describeEditorialApiError,
  describeVisualPlanApiError,
  getContentIdeas,
  getProductionItems,
  getScenePlans,
  getScriptVersions,
  getScripts,
  getVisualPlans,
} from "@/services/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/production")({
  head: () => ({
    meta: [
      { title: "Producao - Aralume" },
      { name: "description", content: "Planejamento visual editorial com cenas e historico real." },
    ],
  }),
  component: function ProductionPage() {
    const { activeChannelId, activeChannel } = useChannelContext();
    const queryClient = useQueryClient();
    const [selectedScriptId, setSelectedScriptId] = useState<string | undefined>(undefined);
    const [selectedVisualPlanId, setSelectedVisualPlanId] = useState<string | undefined>(undefined);
    const [planForm, setPlanForm] = useState<VisualPlanFormState>(emptyPlanForm());
    const [sceneForm, setSceneForm] = useState<SceneFormState>(emptySceneForm());

    const productionItemsQuery = useQuery({
      queryKey: ["production-items", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () => getProductionItems({ channelId: activeChannelId }),
    });

    const ideasQuery = useQuery({
      queryKey: ["content-ideas", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () => getContentIdeas({ channelId: activeChannelId }),
    });

    const scriptsQuery = useQuery({
      queryKey: ["scripts", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () => getScripts({ channelId: activeChannelId }),
    });

    const visualPlansQuery = useQuery({
      queryKey: ["visual-plans", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () => getVisualPlans({ channelId: activeChannelId }),
    });

    const productionItems = useMemo(
      () => [...(productionItemsQuery.data?.data ?? [])],
      [productionItemsQuery.data],
    );
    const ideas = useMemo(() => ideasQuery.data?.data ?? [], [ideasQuery.data]);
    const scripts = useMemo(
      () =>
        [...(scriptsQuery.data?.data ?? [])].sort((left, right) => sortNewestFirst(left, right)),
      [scriptsQuery.data],
    );
    const visualPlans = useMemo(
      () =>
        [...(visualPlansQuery.data?.data ?? [])].sort((left, right) =>
          sortNewestFirst(left, right),
        ),
      [visualPlansQuery.data],
    );

    useEffect(() => {
      if (!activeChannelId) {
        return;
      }

      const storedScriptId = readStoredScriptId(activeChannelId);
      const storedVisualPlanId = readStoredVisualPlanId(activeChannelId);
      setSelectedScriptId(storedScriptId);
      setSelectedVisualPlanId(storedVisualPlanId);
      setPlanForm(emptyPlanForm());
      setSceneForm(emptySceneForm());
    }, [activeChannelId]);

    useEffect(() => {
      if (!activeChannelId) {
        return;
      }

      if (selectedScriptId && scripts.some((script) => script.id === selectedScriptId)) {
        return;
      }

      if (scripts.length === 0) {
        setSelectedScriptId(undefined);
        return;
      }

      const nextSelected = scripts[0].id;
      setSelectedScriptId(nextSelected);
      writeStoredScriptId(activeChannelId, nextSelected);
    }, [activeChannelId, scripts, selectedScriptId]);

    useEffect(() => {
      if (!activeChannelId) {
        return;
      }

      if (selectedVisualPlanId && visualPlans.some((plan) => plan.id === selectedVisualPlanId)) {
        return;
      }

      if (visualPlans.length === 0) {
        setSelectedVisualPlanId(undefined);
        return;
      }

      const nextSelected = visualPlans[0].id;
      setSelectedVisualPlanId(nextSelected);
      writeStoredVisualPlanId(activeChannelId, nextSelected);
    }, [activeChannelId, visualPlans, selectedVisualPlanId]);

    const selectedScript = scripts.find((script) => script.id === selectedScriptId) ?? undefined;
    const selectedIdea = ideas.find((idea) => idea.id === selectedScript?.contentId);

    const scriptVersionsQuery = useQuery({
      queryKey: ["script-versions", activeChannelId, selectedScriptId],
      enabled: Boolean(activeChannelId && selectedScriptId),
      queryFn: () => getScriptVersions(selectedScriptId as string),
    });

    const scriptVersions = useMemo(
      () =>
        [...(scriptVersionsQuery.data?.data ?? [])].sort(
          (left, right) => left.versionNumber - right.versionNumber,
        ),
      [scriptVersionsQuery.data],
    );
    const currentScriptVersion =
      scriptVersions.find((version) => version.id === selectedScript?.currentVersionId) ??
      scriptVersions.at(-1);

    useEffect(() => {
      if (!activeChannelId) {
        return;
      }

      if (!selectedScript) {
        setPlanForm(emptyPlanForm());
        return;
      }

      setPlanForm((current) => ({
        ...current,
        title: current.title || `${selectedScript.title} - Plano visual`,
        status: current.status || "visual_plan",
        sceneCount: current.sceneCount || String(currentScriptVersion?.sceneCount ?? 4),
        estimatedDurationSeconds:
          current.estimatedDurationSeconds ||
          String(
            currentScriptVersion?.estimatedDurationSeconds ??
              selectedScript.estimatedDurationSeconds,
          ),
      }));
    }, [
      activeChannelId,
      currentScriptVersion?.estimatedDurationSeconds,
      currentScriptVersion?.sceneCount,
      selectedScript,
    ]);

    const selectedVisualPlan = visualPlans.find((plan) => plan.id === selectedVisualPlanId);

    const scenePlansQuery = useQuery({
      queryKey: ["scene-plans", activeChannelId, selectedVisualPlanId],
      enabled: Boolean(activeChannelId && selectedVisualPlanId),
      queryFn: () => getScenePlans(selectedVisualPlanId as string, activeChannelId as string),
    });

    const scenePlans = useMemo(
      () => [...(scenePlansQuery.data?.data ?? [])].sort((left, right) => left.order - right.order),
      [scenePlansQuery.data],
    );

    useEffect(() => {
      if (!selectedVisualPlan) {
        setSceneForm(emptySceneForm());
        return;
      }

      const nextOrder = scenePlans.length + 1;
      setSceneForm((current) => ({
        ...current,
        order: current.order || String(nextOrder),
      }));
    }, [scenePlans, selectedVisualPlan]);

    const createPlanMutation = useMutation({
      mutationFn: async () => {
        if (!activeChannelId) {
          throw new Error("Nenhum canal ativo selecionado.");
        }

        if (!selectedScript || !currentScriptVersion) {
          throw new Error("Selecione um roteiro com uma versao corrente antes de criar o plano.");
        }

        return createVisualPlan({
          channelId: activeChannelId,
          contentId: selectedScript.contentId,
          scriptVersionId: currentScriptVersion.id,
          title: planForm.title.trim(),
          status: planForm.status,
          sceneCount: Number.parseInt(planForm.sceneCount, 10) || 0,
          estimatedDurationSeconds: Number.parseInt(planForm.estimatedDurationSeconds, 10) || 0,
          visualStyle: planForm.visualStyle.trim(),
        });
      },
      onSuccess: async (response) => {
        if (!activeChannelId) {
          return;
        }

        setSelectedVisualPlanId(response.data.id);
        writeStoredVisualPlanId(activeChannelId, response.data.id);
        setPlanForm(emptyPlanForm());
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["visual-plans", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["scene-plans", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["content-ideas", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["production-items", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["channel-audit", activeChannelId] }),
        ]);
        toast.success("Plano visual criado com sucesso.");
      },
      onError: (error) => {
        toast.error(describeVisualPlanApiError(error));
      },
    });

    const createSceneMutation = useMutation({
      mutationFn: async () => {
        if (!selectedVisualPlan) {
          throw new Error("Selecione um plano visual antes de adicionar cenas.");
        }

        return createScenePlan(selectedVisualPlan.id, {
          channelId: activeChannelId,
          order: Number.parseInt(sceneForm.order, 10) || 0,
          title: sceneForm.title.trim(),
          narrationExcerpt: sceneForm.narrationExcerpt.trim(),
          durationSeconds: Number.parseInt(sceneForm.durationSeconds, 10) || 0,
          visualDescription: sceneForm.visualDescription.trim(),
          assetRequirements: splitList(sceneForm.assetRequirements),
        });
      },
      onSuccess: async () => {
        if (!activeChannelId || !selectedVisualPlan) {
          return;
        }

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["scene-plans", activeChannelId, selectedVisualPlan.id],
          }),
          queryClient.invalidateQueries({ queryKey: ["visual-plans", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["production-items", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["channel-audit", activeChannelId] }),
        ]);
        setSceneForm((current) => ({
          ...current,
          order: String(scenePlans.length + 2),
          title: "",
          narrationExcerpt: "",
          durationSeconds: "30",
          visualDescription: "",
          assetRequirements: "",
        }));
        toast.success("Cena criada com sucesso.");
      },
      onError: (error) => {
        toast.error(describeEditorialApiError(error, "production"));
      },
    });

    const showProductionLoading = productionItemsQuery.isPending && productionItems.length === 0;
    const showProductionError = !!productionItemsQuery.error && productionItems.length === 0;
    const showProductionEmpty =
      !productionItemsQuery.isPending &&
      !productionItemsQuery.error &&
      productionItems.length === 0;

    const showScriptsError = !!scriptsQuery.error && scripts.length === 0;
    const showIdeasError = !!ideasQuery.error && ideas.length === 0;
    const showVisualPlansError = !!visualPlansQuery.error && visualPlans.length === 0;
    const showIdeasEmpty = !ideasQuery.isPending && !ideasQuery.error && ideas.length === 0;

    const productionColumns: Column<ProductionItem>[] = [
      {
        key: "title",
        header: "Conteudo",
        render: (row) => <span className="font-medium truncate">{row.title}</span>,
      },
      {
        key: "status",
        header: "Etapa",
        render: (row) => <ContentStatusBadge status={row.status} />,
      },
      {
        key: "agent",
        header: "Agente atual",
        render: (row) => (
          <span className="text-muted-foreground">{row.currentAgentName ?? "—"}</span>
        ),
      },
      {
        key: "prog",
        header: "Progresso",
        width: "170px",
        render: (row) => (
          <div className="flex items-center gap-2">
            <ProgressBar
              value={row.progressPercent}
              tone={row.riskLevel === "critical" ? "critical" : "info"}
            />
            <span className="tabular-nums text-[11px] w-8 text-right">{row.progressPercent}%</span>
          </div>
        ),
      },
      {
        key: "next",
        header: "Proxima acao",
        render: (row) => <span className="text-muted-foreground truncate">{row.nextAction}</span>,
      },
      { key: "risk", header: "Risco", render: (row) => <RiskBadge level={row.riskLevel} /> },
      {
        key: "cost",
        header: "Custo",
        render: (row) => (
          <span className="tabular-nums text-muted-foreground">
            {formatCurrencyCents(row.costActualCents)}
          </span>
        ),
      },
      {
        key: "at",
        header: "Ultima atividade",
        render: (row) => (
          <span className="text-muted-foreground">{formatRelative(row.lastActivityAt)}</span>
        ),
      },
    ];

    const visualPlanColumns: Column<VisualPlan>[] = [
      {
        key: "title",
        header: "Plano",
        render: (row) => (
          <button
            type="button"
            onClick={() => {
              if (!activeChannelId) {
                return;
              }

              setSelectedVisualPlanId(row.id);
              writeStoredVisualPlanId(activeChannelId, row.id);
            }}
            className="flex min-w-0 flex-col text-left"
          >
            <span className="font-medium truncate">{row.title}</span>
            <span className="text-[11px] text-muted-foreground truncate">{row.visualStyle}</span>
          </button>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <ContentStatusBadge status={row.status} />,
      },
      {
        key: "sceneCount",
        header: "Cenas",
        render: (row) => <span className="tabular-nums">{row.sceneCount}</span>,
      },
      {
        key: "version",
        header: "Versao",
        render: (row) => <span className="font-mono text-[11px]">{row.scriptVersionId}</span>,
      },
      {
        key: "updated",
        header: "Atualizado",
        render: (row) => (
          <span className="text-muted-foreground">{formatRelative(row.updatedAt)}</span>
        ),
      },
    ];

    const sceneColumns: Column<ScenePlan>[] = [
      {
        key: "order",
        header: "Ordem",
        render: (row) => <span className="font-medium tabular-nums">{row.order}</span>,
      },
      {
        key: "title",
        header: "Cena",
        render: (row) => (
          <div className="min-w-0">
            <div className="font-medium truncate">{row.title}</div>
            <div className="text-[11px] text-muted-foreground truncate">{row.narrationExcerpt}</div>
          </div>
        ),
      },
      {
        key: "duration",
        header: "Duracao",
        render: (row) => <span className="tabular-nums">{row.durationSeconds}s</span>,
      },
      {
        key: "visual",
        header: "Visual",
        render: (row) => (
          <span className="text-muted-foreground truncate">{row.visualDescription}</span>
        ),
      },
      {
        key: "assets",
        header: "Ativos",
        render: (row) => (
          <span className="text-muted-foreground truncate">
            {row.assetRequirements.join(", ") || "—"}
          </span>
        ),
      },
      {
        key: "createdAt",
        header: "Criada",
        render: (row) => (
          <span className="text-muted-foreground">{formatRelative(row.createdAt)}</span>
        ),
      },
    ];

    if (!activeChannelId) {
      return (
        <div>
          <PageHeader
            eyebrow="Operacao"
            title="Producao"
            description="Selecione um canal para operar planejamento visual e cenas."
          />
          <div className="p-4">
            <EmptyState
              title="Nenhum canal ativo"
              description="O planejamento visual exige contexto explicito de canal."
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Operacao"
          title="Producao"
          description="Fila de producao editorial e planejamento visual com cenas ordenadas e auditaveis."
          actions={
            <a
              href="/scripts"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
            >
              Ir para roteiros <ArrowRight size={14} />
            </a>
          }
        />

        <div className="px-4 space-y-4">
          <Card padded={false}>
            <div className="p-4 pb-2">
              <SectionHeader
                eyebrow="Fila"
                title="Itens em producao"
                description="Mantemos a visao operacional existente enquanto o planejamento visual ganha superficie real."
                action={<StatusBadge tone="info">{productionItems.length} item(ns)</StatusBadge>}
              />
            </div>
            {showProductionLoading ? (
              <div className="px-4 pb-4">
                <LoadingState label="Carregando producao" />
              </div>
            ) : showProductionError ? (
              <div className="px-4 pb-4">
                <ErrorState
                  message={describeEditorialApiError(productionItemsQuery.error, "production")}
                />
                <button
                  onClick={() => void productionItemsQuery.refetch()}
                  className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                >
                  <RefreshCw size={14} /> Tentar novamente
                </button>
              </div>
            ) : showProductionEmpty ? (
              <EmptyState
                title="Nada em producao no canal selecionado"
                description="Crie ideias, pesquisas ou roteiros para preencher a fila."
              />
            ) : (
              <CompactTable
                rows={productionItems}
                columns={productionColumns}
                className="border-0 rounded-none"
                empty="Nada em producao no canal ativo."
              />
            )}
          </Card>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 xl:col-span-7 space-y-4">
              <Card>
                <SectionHeader
                  eyebrow="Base"
                  title={activeChannel?.name ?? activeChannelId}
                  description="O plano visual usa o roteiro corrente da pauta do canal ativo."
                  action={<StatusBadge tone="ok">{scripts.length} roteiro(s)</StatusBadge>}
                />
                <div className="grid gap-2 md:grid-cols-2 text-[12px]">
                  <Meta label="Pauta atual" value={selectedIdea?.title ?? "Selecione um roteiro"} />
                  <Meta
                    label="Roteiro atual"
                    value={
                      selectedScript?.title ?? selectedScriptId ?? "Nenhum roteiro selecionado"
                    }
                  />
                </div>
                {showScriptsError ? (
                  <div className="mt-3">
                    <ErrorState
                      message={describeEditorialApiError(scriptsQuery.error, "production")}
                    />
                  </div>
                ) : null}
              </Card>

              <Card>
                <SectionHeader
                  eyebrow="Criar"
                  title="Novo plano visual"
                  description="A superficie fica em /production e liga pauta, roteiro corrente e plano visual."
                  action={<Shapes size={14} className="text-muted-foreground" />}
                />
                {showIdeasEmpty ? (
                  <EmptyState
                    title="Nenhuma pauta disponivel"
                    description="Crie uma pauta em /ideas antes de criar o plano visual."
                  />
                ) : showIdeasError ? (
                  <ErrorState message={describeEditorialApiError(ideasQuery.error, "production")} />
                ) : !selectedScript || !currentScriptVersion ? (
                  <EmptyState
                    title="Selecione um roteiro"
                    description="O plano visual precisa de um roteiro com versao corrente para continuar."
                  />
                ) : (
                  <form
                    className="space-y-3"
                    data-testid="production-plan-form"
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault();
                      void createPlanMutation.mutateAsync();
                    }}
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <Meta
                        label="Pauta vinculada"
                        value={selectedIdea?.title ?? selectedScript.contentId}
                      />
                      <Meta
                        label="Versao corrente"
                        value={currentScriptVersion?.id ?? selectedScript.currentVersionId}
                      />
                    </div>
                    <Field label="Titulo do plano">
                      <Input
                        value={planForm.title}
                        onChange={(event) =>
                          setPlanForm((current) => ({ ...current, title: event.target.value }))
                        }
                        placeholder="Plano visual do roteiro"
                        required
                      />
                    </Field>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Field label="Status">
                        <select
                          value={planForm.status}
                          onChange={(event) =>
                            setPlanForm((current) => ({
                              ...current,
                              status: event.target.value as VisualPlan["status"],
                            }))
                          }
                          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                        >
                          <option value="visual_plan">Plano visual</option>
                          <option value="script">Roteiro</option>
                          <option value="research">Pesquisa</option>
                          <option value="idea">Pauta</option>
                          <option value="narration">Narração</option>
                          <option value="editing">Edição</option>
                          <option value="clips">Cortes</option>
                          <option value="quality_check">Qualidade</option>
                          <option value="compliance_check">Conformidade</option>
                          <option value="waiting_approval">Aguardando aprovação</option>
                          <option value="approved">Aprovado</option>
                          <option value="scheduled">Agendado</option>
                          <option value="published">Publicado</option>
                          <option value="failed">Falhou</option>
                          <option value="blocked">Bloqueado</option>
                        </select>
                      </Field>
                      <Field label="Cenas">
                        <Input
                          type="number"
                          min={1}
                          value={planForm.sceneCount}
                          onChange={(event) =>
                            setPlanForm((current) => ({
                              ...current,
                              sceneCount: event.target.value,
                            }))
                          }
                          required
                        />
                      </Field>
                      <Field label="Duracao estimada">
                        <Input
                          type="number"
                          min={1}
                          value={planForm.estimatedDurationSeconds}
                          onChange={(event) =>
                            setPlanForm((current) => ({
                              ...current,
                              estimatedDurationSeconds: event.target.value,
                            }))
                          }
                          required
                        />
                      </Field>
                    </div>
                    <Field label="Estilo visual">
                      <Textarea
                        value={planForm.visualStyle}
                        onChange={(event) =>
                          setPlanForm((current) => ({
                            ...current,
                            visualStyle: event.target.value,
                          }))
                        }
                        rows={4}
                        placeholder="Cinematografico, documental, grafico..."
                        required
                      />
                    </Field>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="submit"
                        disabled={createPlanMutation.isPending}
                        data-testid="create-plan-submit"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95 disabled:opacity-70"
                      >
                        <Save size={14} />
                        {createPlanMutation.isPending ? "Criando..." : "Criar plano visual"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanForm(emptyPlanForm())}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                      >
                        Limpar
                      </button>
                    </div>
                    {createPlanMutation.error ? (
                      <ErrorState message={describeVisualPlanApiError(createPlanMutation.error)} />
                    ) : null}
                  </form>
                )}
              </Card>

              <Card padded={false}>
                <div className="p-4 pb-2">
                  <SectionHeader
                    eyebrow="Planos"
                    title="Historico visual"
                    description="A selecao de um plano reaparece apos reload no mesmo processo."
                    action={<LayoutGrid size={14} className="text-muted-foreground" />}
                  />
                </div>
                {visualPlansQuery.isPending && visualPlans.length === 0 ? (
                  <div className="px-4 pb-4">
                    <LoadingState label="Carregando planos visuais" />
                  </div>
                ) : showVisualPlansError ? (
                  <div className="px-4 pb-4">
                    <ErrorState message={describeVisualPlanApiError(visualPlansQuery.error)} />
                  </div>
                ) : visualPlans.length === 0 ? (
                  <EmptyState
                    title="Sem planos visuais"
                    description="Crie o primeiro plano visual a partir do roteiro corrente."
                  />
                ) : (
                  <CompactTable
                    rows={visualPlans}
                    columns={visualPlanColumns}
                    className="border-0 rounded-none"
                    empty="Sem planos visuais."
                  />
                )}
              </Card>
            </div>

            <div className="col-span-12 xl:col-span-5 space-y-4">
              <Card>
                <SectionHeader
                  eyebrow="Selecionado"
                  title={selectedVisualPlan ? selectedVisualPlan.title : "Nenhum plano selecionado"}
                  description="O plano visual e as cenas permanecem consultaveis apos reload."
                  action={
                    selectedVisualPlan ? (
                      <ContentStatusBadge status={selectedVisualPlan.status} />
                    ) : null
                  }
                />
                {selectedVisualPlan ? (
                  <div className="space-y-3">
                    <div className="grid gap-2 md:grid-cols-2 text-[12px]">
                      <Meta
                        label="Pauta"
                        value={selectedIdea?.title ?? selectedVisualPlan.contentId}
                      />
                      <Meta label="Roteiro" value={selectedVisualPlan.scriptVersionId} />
                      <Meta label="Cenas" value={String(selectedVisualPlan.sceneCount)} />
                      <Meta
                        label="Atualizado"
                        value={formatRelative(selectedVisualPlan.updatedAt)}
                      />
                    </div>
                    <div className="rounded-md border border-border bg-surface-muted px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                        Estilo visual
                      </div>
                      <div className="mt-1 text-[12px] text-foreground break-words">
                        {selectedVisualPlan.visualStyle}
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="Selecione um plano"
                    description="Clique em um plano da lista para recuperar suas cenas."
                  />
                )}
              </Card>

              <Card>
                <SectionHeader
                  eyebrow="Cenas"
                  title="Adicionar cena"
                  description="Cenas com ordem explicitamente declarada e rejeicao de duplicidade."
                  action={<SquareStack size={14} className="text-muted-foreground" />}
                />
                {selectedVisualPlan ? (
                  <form
                    className="space-y-3"
                    data-testid="production-scene-form"
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault();
                      void createSceneMutation.mutateAsync();
                    }}
                  >
                    <Field label="Ordem">
                      <Input
                        type="number"
                        min={1}
                        value={sceneForm.order}
                        onChange={(event) =>
                          setSceneForm((current) => ({ ...current, order: event.target.value }))
                        }
                        required
                      />
                    </Field>
                    <Field label="Titulo">
                      <Input
                        value={sceneForm.title}
                        onChange={(event) =>
                          setSceneForm((current) => ({ ...current, title: event.target.value }))
                        }
                        placeholder="Cena 1"
                        required
                      />
                    </Field>
                    <Field label="Trecho de narracao">
                      <Textarea
                        value={sceneForm.narrationExcerpt}
                        onChange={(event) =>
                          setSceneForm((current) => ({
                            ...current,
                            narrationExcerpt: event.target.value,
                          }))
                        }
                        rows={4}
                        required
                      />
                    </Field>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Duracao (segundos)">
                        <Input
                          type="number"
                          min={1}
                          value={sceneForm.durationSeconds}
                          onChange={(event) =>
                            setSceneForm((current) => ({
                              ...current,
                              durationSeconds: event.target.value,
                            }))
                          }
                          required
                        />
                      </Field>
                      <Field label="Ativos requeridos">
                        <Input
                          value={sceneForm.assetRequirements}
                          onChange={(event) =>
                            setSceneForm((current) => ({
                              ...current,
                              assetRequirements: event.target.value,
                            }))
                          }
                          placeholder="asset-a, asset-b"
                        />
                      </Field>
                    </div>
                    <Field label="Descricao visual">
                      <Textarea
                        value={sceneForm.visualDescription}
                        onChange={(event) =>
                          setSceneForm((current) => ({
                            ...current,
                            visualDescription: event.target.value,
                          }))
                        }
                        rows={4}
                        required
                      />
                    </Field>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="submit"
                        disabled={createSceneMutation.isPending}
                        data-testid="create-scene-submit"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95 disabled:opacity-70"
                      >
                        <Plus size={14} />
                        {createSceneMutation.isPending ? "Salvando..." : "Adicionar cena"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSceneForm(emptySceneForm())}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                      >
                        Limpar
                      </button>
                    </div>
                    {createSceneMutation.error ? (
                      <ErrorState
                        message={describeEditorialApiError(createSceneMutation.error, "production")}
                      />
                    ) : null}
                  </form>
                ) : (
                  <EmptyState
                    title="Selecione um plano"
                    description="A adicao de cenas fica disponivel depois de selecionar um plano visual."
                  />
                )}
              </Card>

              <Card padded={false}>
                <div className="p-4 pb-2">
                  <SectionHeader
                    eyebrow="Cenas"
                    title="Historico de cenas"
                    description="A listagem vem da API real e pode ser recarregada apos reload."
                  />
                </div>
                {!selectedVisualPlan ? (
                  <div className="px-4 pb-4">
                    <EmptyState
                      title="Selecione um plano"
                      description="As cenas do plano selecionado aparecerao aqui."
                    />
                  </div>
                ) : scenePlansQuery.isPending ? (
                  <div className="px-4 pb-4">
                    <LoadingState label="Carregando cenas" />
                  </div>
                ) : scenePlansQuery.error ? (
                  <div className="px-4 pb-4">
                    <ErrorState
                      message={describeEditorialApiError(scenePlansQuery.error, "production")}
                    />
                  </div>
                ) : scenePlans.length === 0 ? (
                  <EmptyState
                    title="Sem cenas"
                    description="Crie ao menos uma cena para provar o planejamento visual."
                  />
                ) : (
                  <CompactTable
                    rows={scenePlans}
                    columns={sceneColumns}
                    className="border-0 rounded-none"
                    empty="Sem cenas registradas."
                  />
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  },
});

type VisualPlanFormState = {
  title: string;
  status: VisualPlan["status"];
  sceneCount: string;
  estimatedDurationSeconds: string;
  visualStyle: string;
};

type SceneFormState = {
  order: string;
  title: string;
  narrationExcerpt: string;
  durationSeconds: string;
  visualDescription: string;
  assetRequirements: string;
};

function emptyPlanForm(): VisualPlanFormState {
  return {
    title: "",
    status: "visual_plan",
    sceneCount: "4",
    estimatedDurationSeconds: "600",
    visualStyle: "",
  };
}

function emptySceneForm(): SceneFormState {
  return {
    order: "1",
    title: "",
    narrationExcerpt: "",
    durationSeconds: "30",
    visualDescription: "",
    assetRequirements: "",
  };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-muted px-3 py-2 min-w-0">
      <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[12px] text-foreground truncate">{value}</div>
    </div>
  );
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sortNewestFirst(left: Script | VisualPlan, right: Script | VisualPlan): number {
  return right.updatedAt.localeCompare(left.updatedAt);
}

function readStoredScriptId(channelId: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage.getItem(storageScriptKey(channelId)) ?? undefined;
}

function writeStoredScriptId(channelId: string, scriptId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageScriptKey(channelId), scriptId);
}

function readStoredVisualPlanId(channelId: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage.getItem(storageVisualPlanKey(channelId)) ?? undefined;
}

function writeStoredVisualPlanId(channelId: string, visualPlanId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageVisualPlanKey(channelId), visualPlanId);
}

function storageScriptKey(channelId: string): string {
  return `aralume:scripts:selected:${channelId}`;
}

function storageVisualPlanKey(channelId: string): string {
  return `aralume:production:selected:${channelId}`;
}
