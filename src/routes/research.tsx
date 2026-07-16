import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Plus, RefreshCw, Save, Search, Link2, Quote } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { RiskBadge, WorkflowStatusBadge } from "@/components/status/badges";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
} from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ClaimEvidence, ResearchSession, ResearchSource } from "@/contracts/types";
import {
  createClaimEvidence,
  createResearchSession,
  createResearchSource,
  describeResearchApiError,
  getClaimEvidenceList,
  getContentIdeas,
  getResearchSessions,
  getResearchSources,
} from "@/services/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Pesquisas - Aralume" },
      {
        name: "description",
        content: "Sessoes de pesquisa, fontes e claims operaveis pelo frontend.",
      },
    ],
  }),
  component: ResearchPage,
});

type SessionFormState = {
  contentId: string;
  title: string;
  summary: string;
  status: ResearchSession["status"];
  confidenceScore: string;
  riskLevel: ResearchSession["riskLevel"];
};

type SourceFormState = {
  title: string;
  url: string;
  publisher: string;
  accessedAt: string;
  sourceType: ResearchSource["sourceType"];
  confidenceLevel: ResearchSource["confidenceLevel"];
  freshnessRisk: ResearchSource["freshnessRisk"];
  usageNotes: string;
};

type ClaimFormState = {
  sourceId: string;
  claim: string;
  evidenceSummary: string;
  informationType: ClaimEvidence["informationType"];
  confidenceLevel: ClaimEvidence["confidenceLevel"];
  riskLevel: ClaimEvidence["riskLevel"];
};

const emptySessionForm = (): SessionFormState => ({
  contentId: "",
  title: "",
  summary: "",
  status: "queued",
  confidenceScore: "100",
  riskLevel: "ok",
});

const emptySourceForm = (): SourceFormState => ({
  title: "",
  url: "",
  publisher: "",
  accessedAt: todayInputValue(),
  sourceType: "article",
  confidenceLevel: "medium",
  freshnessRisk: "ok",
  usageNotes: "",
});

const emptyClaimForm = (): ClaimFormState => ({
  sourceId: "",
  claim: "",
  evidenceSummary: "",
  informationType: "fact",
  confidenceLevel: "medium",
  riskLevel: "ok",
});

function ResearchPage() {
  const { activeChannelId, activeChannel } = useChannelContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(undefined);
  const [selectedSourceId, setSelectedSourceId] = useState<string | undefined>(undefined);
  const [sessionForm, setSessionForm] = useState<SessionFormState>(emptySessionForm());
  const [sourceForm, setSourceForm] = useState<SourceFormState>(emptySourceForm());
  const [claimForm, setClaimForm] = useState<ClaimFormState>(emptyClaimForm());

  const ideasQuery = useQuery({
    queryKey: ["ideas", activeChannelId],
    enabled: Boolean(activeChannelId),
    queryFn: () => getContentIdeas({ channelId: activeChannelId }),
  });

  const sessionsQuery = useQuery({
    queryKey: ["research", activeChannelId],
    enabled: Boolean(activeChannelId),
    queryFn: () => getResearchSessions({ channelId: activeChannelId }),
  });

  const sessions = useMemo(() => sessionsQuery.data?.data ?? [], [sessionsQuery.data]);
  const ideas = useMemo(() => ideasQuery.data?.data ?? [], [ideasQuery.data]);

  const visibleSessions = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return sessions;
    }

    return sessions.filter((session) =>
      [session.title, session.status, session.riskLevel, session.contentId]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [search, sessions]);

  const selectedSession = sessions.find((item) => item.id === selectedSessionId) ?? undefined;
  const selectedIdea = ideas.find((item) => item.id === sessionForm.contentId) ?? undefined;
  const selectedSessionIdea =
    ideas.find((item) => item.id === selectedSession?.contentId) ?? undefined;

  const sourcesQuery = useQuery({
    queryKey: ["research-sources", selectedSession?.id],
    enabled: Boolean(selectedSession?.id),
    queryFn: () => getResearchSources(selectedSession?.id as string),
  });

  const claimsQuery = useQuery({
    queryKey: ["research-claims", selectedSession?.id],
    enabled: Boolean(selectedSession?.id),
    queryFn: () => getClaimEvidenceList(selectedSession?.id as string),
  });

  const sources = useMemo(() => sourcesQuery.data?.data ?? [], [sourcesQuery.data]);
  const claims = useMemo(() => claimsQuery.data?.data ?? [], [claimsQuery.data]);

  useEffect(() => {
    setSelectedSessionId(undefined);
    setSelectedSourceId(undefined);
    setSessionForm(emptySessionForm());
    setSourceForm(emptySourceForm());
    setClaimForm(emptyClaimForm());
  }, [activeChannelId]);

  useEffect(() => {
    if (ideas.length === 0) {
      setSessionForm((current) => ({ ...current, contentId: "" }));
      return;
    }

    setSessionForm((current) =>
      current.contentId && ideas.some((idea) => idea.id === current.contentId)
        ? current
        : { ...current, contentId: ideas[0].id },
    );
  }, [ideas]);

  useEffect(() => {
    setSelectedSourceId(undefined);
    setSourceForm(emptySourceForm());
    setClaimForm(emptyClaimForm());
  }, [selectedSessionId]);

  useEffect(() => {
    if (sources.length === 0) {
      setSelectedSourceId(undefined);
      setClaimForm((current) => ({ ...current, sourceId: "" }));
      return;
    }

    setSelectedSourceId((current) => {
      if (current && sources.some((source) => source.id === current)) {
        return current;
      }

      return sources[0].id;
    });
  }, [sources]);

  useEffect(() => {
    if (!selectedSourceId) {
      return;
    }

    setClaimForm((current) => ({ ...current, sourceId: selectedSourceId }));
  }, [selectedSourceId]);

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!activeChannelId) {
        throw new Error("Nenhum canal ativo selecionado.");
      }

      if (!sessionForm.contentId) {
        throw new Error("Selecione uma pauta antes de criar a sessao de pesquisa.");
      }

      return createResearchSession({
        channelId: activeChannelId,
        contentId: sessionForm.contentId,
        title: sessionForm.title.trim(),
        summary: sessionForm.summary.trim(),
        status: sessionForm.status,
        sourceCount: 0,
        claimCount: 0,
        confidenceScore: Number.parseInt(sessionForm.confidenceScore, 10) || 0,
        riskLevel: sessionForm.riskLevel,
      });
    },
    onSuccess: async (response) => {
      setSelectedSessionId(response.data.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["research", activeChannelId] }),
        queryClient.invalidateQueries({ queryKey: ["ideas", activeChannelId] }),
      ]);
      toast.success("Sessao de pesquisa criada com sucesso.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : describeResearchApiError(error));
    },
  });

  const createSourceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSession?.id) {
        throw new Error("Selecione ou crie uma sessao de pesquisa antes de registrar fontes.");
      }

      return createResearchSource(selectedSession.id, {
        title: sourceForm.title.trim(),
        url: sourceForm.url.trim() || undefined,
        publisher: sourceForm.publisher.trim() || undefined,
        accessedAt: toIsoDate(sourceForm.accessedAt),
        sourceType: sourceForm.sourceType,
        confidenceLevel: sourceForm.confidenceLevel,
        freshnessRisk: sourceForm.freshnessRisk,
        usageNotes: sourceForm.usageNotes.trim(),
      });
    },
    onSuccess: async (response) => {
      setSelectedSourceId(response.data.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["research-sources", selectedSession?.id] }),
        queryClient.invalidateQueries({ queryKey: ["research", activeChannelId] }),
      ]);
      toast.success("Fonte registrada com sucesso.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : describeResearchApiError(error));
    },
  });

  const createClaimMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSession?.id) {
        throw new Error("Selecione ou crie uma sessao de pesquisa antes de registrar claims.");
      }

      if (!claimForm.sourceId) {
        throw new Error("Selecione uma fonte antes de registrar claims.");
      }

      return createClaimEvidence(selectedSession.id, {
        sourceId: claimForm.sourceId,
        claim: claimForm.claim.trim(),
        evidenceSummary: claimForm.evidenceSummary.trim(),
        informationType: claimForm.informationType,
        confidenceLevel: claimForm.confidenceLevel,
        riskLevel: claimForm.riskLevel,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["research-claims", selectedSession?.id] }),
        queryClient.invalidateQueries({ queryKey: ["research", activeChannelId] }),
      ]);
      toast.success("Claim registrado com sucesso.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : describeResearchApiError(error));
    },
  });

  const showSessionsLoading = sessionsQuery.isPending && sessions.length === 0;
  const showSessionsError = !!sessionsQuery.error && sessions.length === 0;
  const showSessionsEmpty =
    !sessionsQuery.isPending && !sessionsQuery.error && sessions.length === 0;
  const showIdeasEmpty = !ideasQuery.isPending && !ideasQuery.error && ideas.length === 0;

  const sessionColumns: Column<ResearchSession>[] = [
    {
      key: "title",
      header: "Sessao",
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedSessionId(row.id)}
          className="flex min-w-0 flex-col text-left"
        >
          <span className="font-medium truncate">{row.title}</span>
          <span className="text-[11px] text-muted-foreground truncate">
            {ideas.find((idea) => idea.id === row.contentId)?.title ?? row.contentId}
          </span>
        </button>
      ),
    },
    {
      key: "sources",
      header: "Fontes",
      render: (row) => <span className="tabular-nums">{row.sourceCount}</span>,
    },
    {
      key: "claims",
      header: "Claims",
      render: (row) => <span className="tabular-nums">{row.claimCount}</span>,
    },
    {
      key: "confidence",
      header: "Confianca",
      render: (row) => <span className="tabular-nums">{row.confidenceScore}%</span>,
    },
    {
      key: "risk",
      header: "Risco",
      render: (row) => <RiskBadge level={row.riskLevel} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <WorkflowStatusBadge status={row.status} />,
    },
    {
      key: "updated",
      header: "Atualizado",
      render: (row) => (
        <span className="text-muted-foreground">{formatRelative(row.updatedAt)}</span>
      ),
    },
  ];

  const sourceColumns: Column<ResearchSource>[] = [
    {
      key: "title",
      header: "Fonte",
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedSourceId(row.id)}
          className="flex min-w-0 flex-col text-left"
        >
          <span className="font-medium truncate">{row.title}</span>
          <span className="text-[11px] text-muted-foreground truncate">
            {row.publisher || row.url || row.sourceType}
          </span>
        </button>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (row) => <span>{row.sourceType}</span>,
    },
    {
      key: "confidence",
      header: "Confianca",
      render: (row) => <span className="tabular-nums">{row.confidenceLevel}</span>,
    },
    {
      key: "risk",
      header: "Risco",
      render: (row) => <RiskBadge level={row.freshnessRisk} />,
    },
    {
      key: "accessed",
      header: "Acesso",
      render: (row) => (
        <span className="text-muted-foreground">{formatRelative(row.accessedAt)}</span>
      ),
    },
  ];

  const claimColumns: Column<ClaimEvidence>[] = [
    {
      key: "claim",
      header: "Claim",
      render: (row) => (
        <div className="min-w-0">
          <div className="font-medium truncate">{row.claim}</div>
          <div className="text-[11px] text-muted-foreground truncate">{row.evidenceSummary}</div>
        </div>
      ),
    },
    {
      key: "source",
      header: "Fonte",
      render: (row) => (
        <span className="truncate">
          {sources.find((source) => source.id === row.sourceId)?.title ?? row.sourceId}
        </span>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (row) => <span>{row.informationType}</span>,
    },
    {
      key: "confidence",
      header: "Confianca",
      render: (row) => <span>{row.confidenceLevel}</span>,
    },
    {
      key: "risk",
      header: "Risco",
      render: (row) => <RiskBadge level={row.riskLevel} />,
    },
  ];

  if (!activeChannelId) {
    return (
      <div>
        <PageHeader
          eyebrow="Editorial"
          title="Pesquisas e fontes"
          description="Selecione um canal para operar pesquisas reais, canais-scoped."
        />
        <div className="p-4">
          <EmptyState
            title="Nenhum canal ativo"
            description="A pesquisa exige contexto explicito de canal para manter isolamento e rastreabilidade."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Editorial"
        title="Pesquisas e fontes"
        description="Sessao, fontes e claims persistidos e consultaveis pelo frontend real."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/ideas"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
            >
              Ir para pautas <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              onClick={() =>
                void Promise.all([
                  sessionsQuery.refetch(),
                  ideasQuery.refetch(),
                  sourcesQuery.refetch(),
                  claimsQuery.refetch(),
                ])
              }
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95"
            >
              <RefreshCw size={14} /> Recarregar
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-4 p-4">
        <div className="col-span-12 xl:col-span-4 space-y-4">
          <Card>
            <SectionHeader
              eyebrow="Canal"
              title={activeChannel?.name ?? activeChannelId}
              description="A pesquisa opera apenas no canal ativo."
              action={<BookOpen size={14} className="text-muted-foreground" />}
            />
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <Meta label="Canal" value={activeChannel?.slug ?? activeChannelId} />
              <Meta label="Idioma" value={activeChannel?.language ?? "n/a"} />
            </div>
          </Card>

          <Card>
            <SectionHeader
              eyebrow="Criar"
              title="Nova sessao de pesquisa"
              description="Vincule uma pauta antes de registrar fontes e claims."
              action={<Plus size={14} className="text-muted-foreground" />}
            />
            {showIdeasEmpty ? (
              <EmptyState
                title="Nenhuma pauta disponivel"
                description="Crie uma pauta em /ideas antes de iniciar a pesquisa."
              />
            ) : (
              <form
                className="space-y-3"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  void createSessionMutation.mutateAsync();
                }}
              >
                <Field label="Pauta vinculada">
                  <select
                    value={sessionForm.contentId}
                    onChange={(event) =>
                      setSessionForm((current) => ({ ...current, contentId: event.target.value }))
                    }
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                    required
                  >
                    {ideas.map((idea) => (
                      <option key={idea.id} value={idea.id}>
                        {idea.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Meta
                  label="Pauta atual"
                  value={selectedIdea?.title ?? "Selecione uma pauta para continuar"}
                />
                <Field label="Titulo da sessao">
                  <Input
                    value={sessionForm.title}
                    onChange={(event) =>
                      setSessionForm((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Pesquisa para pauta X"
                    required
                  />
                </Field>
                <Field label="Resumo">
                  <Textarea
                    value={sessionForm.summary}
                    onChange={(event) =>
                      setSessionForm((current) => ({ ...current, summary: event.target.value }))
                    }
                    placeholder="Objetivo da pesquisa, fontes esperadas e riscos"
                    rows={4}
                    required
                  />
                </Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Status">
                    <select
                      value={sessionForm.status}
                      onChange={(event) =>
                        setSessionForm((current) => ({
                          ...current,
                          status: event.target.value as ResearchSession["status"],
                        }))
                      }
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                    >
                      <option value="queued">Queued</option>
                      <option value="running">Running</option>
                      <option value="waiting">Waiting</option>
                      <option value="waiting_approval">Waiting approval</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="blocked">Blocked</option>
                      <option value="retrying">Retrying</option>
                    </select>
                  </Field>
                  <Field label="Confianca">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={sessionForm.confidenceScore}
                      onChange={(event) =>
                        setSessionForm((current) => ({
                          ...current,
                          confidenceScore: event.target.value,
                        }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Risco">
                    <select
                      value={sessionForm.riskLevel}
                      onChange={(event) =>
                        setSessionForm((current) => ({
                          ...current,
                          riskLevel: event.target.value as ResearchSession["riskLevel"],
                        }))
                      }
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                    >
                      <option value="ok">OK</option>
                      <option value="attention">Attention</option>
                      <option value="warning">Warning</option>
                      <option value="critical">Critical</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </Field>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={
                      createSessionMutation.isPending ||
                      ideasQuery.isPending ||
                      ideas.length === 0 ||
                      !sessionForm.contentId
                    }
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95 disabled:opacity-70"
                  >
                    <Save size={14} />
                    {createSessionMutation.isPending ? "Criando..." : "Criar sessao"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionForm(emptySessionForm())}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                  >
                    Limpar
                  </button>
                </div>
              </form>
            )}
          </Card>

          <Card padded={false}>
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar sessao..."
                  className="h-8 pl-7"
                />
              </div>
            </div>
            {showSessionsLoading ? (
              <LoadingState label="Carregando sessoes" />
            ) : showSessionsError ? (
              <div className="p-4">
                <ErrorState message={describeResearchApiError(sessionsQuery.error)} />
                <button
                  onClick={() => void sessionsQuery.refetch()}
                  className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                >
                  <RefreshCw size={14} /> Tentar novamente
                </button>
              </div>
            ) : showSessionsEmpty ? (
              <EmptyState
                title="Sem sessoes neste canal"
                description="Crie a primeira sessao usando a pauta selecionada."
              />
            ) : (
              <CompactTable
                rows={visibleSessions}
                columns={sessionColumns}
                className="border-0 rounded-none"
                empty="Sem sessoes no canal ativo."
                onRowClick={(row) => setSelectedSessionId(row.id)}
              />
            )}
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-4">
          {selectedSession ? (
            <>
              <Card>
                <SectionHeader
                  eyebrow="Selecionada"
                  title={selectedSession.title}
                  description="A selecao da sessao recupera fontes e claims persistidos."
                  action={<WorkflowStatusBadge status={selectedSession.status} />}
                />
                <div className="grid gap-2 md:grid-cols-2 text-[12px]">
                  <Meta
                    label="Pauta"
                    value={selectedSessionIdea?.title ?? selectedSession.contentId}
                  />
                  <Meta label="Fontes" value={String(selectedSession.sourceCount)} />
                  <Meta label="Claims" value={String(selectedSession.claimCount)} />
                  <Meta label="Atualizada" value={formatRelative(selectedSession.updatedAt)} />
                </div>
              </Card>

              <Card>
                <SectionHeader
                  eyebrow="Fontes"
                  title="Registrar fonte"
                  description="Inclua pelo menos uma fonte vinculada a sessao selecionada."
                  action={<Link2 size={14} className="text-muted-foreground" />}
                />
                {showIdeasEmpty ? (
                  <EmptyState
                    title="Sem pauta vinculada"
                    description="A sessao precisa de uma pauta antes de aceitar fontes."
                  />
                ) : (
                  <form
                    className="space-y-3"
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault();
                      void createSourceMutation.mutateAsync();
                    }}
                  >
                    <Field label="Titulo">
                      <Input
                        value={sourceForm.title}
                        onChange={(event) =>
                          setSourceForm((current) => ({ ...current, title: event.target.value }))
                        }
                        placeholder="Fonte principal"
                        required
                      />
                    </Field>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="URL">
                        <Input
                          type="url"
                          value={sourceForm.url}
                          onChange={(event) =>
                            setSourceForm((current) => ({ ...current, url: event.target.value }))
                          }
                          placeholder="https://..."
                        />
                      </Field>
                      <Field label="Editora / Publisher">
                        <Input
                          value={sourceForm.publisher}
                          onChange={(event) =>
                            setSourceForm((current) => ({
                              ...current,
                              publisher: event.target.value,
                            }))
                          }
                          placeholder="Instituicao ou portal"
                        />
                      </Field>
                      <Field label="Acesso">
                        <Input
                          type="date"
                          value={sourceForm.accessedAt}
                          onChange={(event) =>
                            setSourceForm((current) => ({
                              ...current,
                              accessedAt: event.target.value,
                            }))
                          }
                          required
                        />
                      </Field>
                      <Field label="Tipo">
                        <select
                          value={sourceForm.sourceType}
                          onChange={(event) =>
                            setSourceForm((current) => ({
                              ...current,
                              sourceType: event.target.value as ResearchSource["sourceType"],
                            }))
                          }
                          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                        >
                          <option value="article">Article</option>
                          <option value="paper">Paper</option>
                          <option value="video">Video</option>
                          <option value="book">Book</option>
                          <option value="official">Official</option>
                          <option value="other">Other</option>
                        </select>
                      </Field>
                      <Field label="Confianca">
                        <select
                          value={sourceForm.confidenceLevel}
                          onChange={(event) =>
                            setSourceForm((current) => ({
                              ...current,
                              confidenceLevel: event.target
                                .value as ResearchSource["confidenceLevel"],
                            }))
                          }
                          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </Field>
                      <Field label="Risco de frescor">
                        <select
                          value={sourceForm.freshnessRisk}
                          onChange={(event) =>
                            setSourceForm((current) => ({
                              ...current,
                              freshnessRisk: event.target.value as ResearchSource["freshnessRisk"],
                            }))
                          }
                          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                        >
                          <option value="ok">OK</option>
                          <option value="attention">Attention</option>
                          <option value="warning">Warning</option>
                          <option value="critical">Critical</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </Field>
                    </div>
                    <Field label="Notas de uso">
                      <Textarea
                        value={sourceForm.usageNotes}
                        onChange={(event) =>
                          setSourceForm((current) => ({
                            ...current,
                            usageNotes: event.target.value,
                          }))
                        }
                        placeholder="Como a fonte sustenta a pauta"
                        rows={4}
                        required
                      />
                    </Field>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="submit"
                        disabled={createSourceMutation.isPending}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95 disabled:opacity-70"
                      >
                        <Save size={14} />
                        {createSourceMutation.isPending ? "Salvando..." : "Salvar fonte"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSourceForm(emptySourceForm())}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                      >
                        Limpar
                      </button>
                    </div>
                  </form>
                )}
              </Card>

              <Card padded={false}>
                {sourcesQuery.isPending ? (
                  <LoadingState label="Carregando fontes" />
                ) : sourcesQuery.error ? (
                  <div className="p-4">
                    <ErrorState message={describeResearchApiError(sourcesQuery.error)} />
                    <button
                      onClick={() => void sourcesQuery.refetch()}
                      className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                    >
                      <RefreshCw size={14} /> Recarregar fontes
                    </button>
                  </div>
                ) : sources.length === 0 ? (
                  <EmptyState
                    title="Sem fontes na sessao"
                    description="A fonte criada acima aparecera aqui apos salvar."
                  />
                ) : (
                  <CompactTable
                    rows={sources}
                    columns={sourceColumns}
                    className="border-0 rounded-none"
                    empty="Sem fontes registradas."
                    onRowClick={(row) => {
                      setSelectedSourceId(row.id);
                    }}
                  />
                )}
              </Card>
            </>
          ) : (
            <Card>
              <EmptyState
                title="Selecione uma sessao"
                description="Crie ou selecione uma sessao para recuperar fontes e claims persistidos."
              />
            </Card>
          )}
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-4">
          {selectedSession ? (
            <>
              <Card>
                <SectionHeader
                  eyebrow="Claims"
                  title="Registrar claim"
                  description="Claims precisam apontar para uma fonte da mesma sessao e do mesmo canal."
                  action={<Quote size={14} className="text-muted-foreground" />}
                />
                {sources.length === 0 ? (
                  <EmptyState
                    title="Adicione uma fonte primeiro"
                    description="O formulario de claim so fica util apos existir pelo menos uma fonte."
                  />
                ) : (
                  <form
                    className="space-y-3"
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault();
                      void createClaimMutation.mutateAsync();
                    }}
                  >
                    <Field label="Fonte">
                      <select
                        value={claimForm.sourceId}
                        onChange={(event) =>
                          setClaimForm((current) => ({ ...current, sourceId: event.target.value }))
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                        required
                      >
                        <option value="">Selecione uma fonte</option>
                        {sources.map((source) => (
                          <option key={source.id} value={source.id}>
                            {source.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Claim">
                      <Textarea
                        value={claimForm.claim}
                        onChange={(event) =>
                          setClaimForm((current) => ({ ...current, claim: event.target.value }))
                        }
                        placeholder="Claim testavel e objetiva"
                        rows={4}
                        required
                      />
                    </Field>
                    <Field label="Resumo da evidencia">
                      <Textarea
                        value={claimForm.evidenceSummary}
                        onChange={(event) =>
                          setClaimForm((current) => ({
                            ...current,
                            evidenceSummary: event.target.value,
                          }))
                        }
                        placeholder="Como a fonte sustenta a claim"
                        rows={4}
                        required
                      />
                    </Field>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Tipo de informacao">
                        <select
                          value={claimForm.informationType}
                          onChange={(event) =>
                            setClaimForm((current) => ({
                              ...current,
                              informationType: event.target
                                .value as ClaimEvidence["informationType"],
                            }))
                          }
                          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                        >
                          <option value="fact">Fact</option>
                          <option value="opinion">Opinion</option>
                          <option value="hypothesis">Hypothesis</option>
                          <option value="fiction">Fiction</option>
                        </select>
                      </Field>
                      <Field label="Confianca">
                        <select
                          value={claimForm.confidenceLevel}
                          onChange={(event) =>
                            setClaimForm((current) => ({
                              ...current,
                              confidenceLevel: event.target
                                .value as ClaimEvidence["confidenceLevel"],
                            }))
                          }
                          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </Field>
                      <Field label="Risco">
                        <select
                          value={claimForm.riskLevel}
                          onChange={(event) =>
                            setClaimForm((current) => ({
                              ...current,
                              riskLevel: event.target.value as ClaimEvidence["riskLevel"],
                            }))
                          }
                          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                        >
                          <option value="ok">OK</option>
                          <option value="attention">Attention</option>
                          <option value="warning">Warning</option>
                          <option value="critical">Critical</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </Field>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="submit"
                        disabled={createClaimMutation.isPending || sources.length === 0}
                        className={cn(
                          "inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95 disabled:opacity-70",
                        )}
                      >
                        <Save size={14} />
                        {createClaimMutation.isPending ? "Salvando..." : "Salvar claim"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setClaimForm(emptyClaimForm())}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                      >
                        Limpar
                      </button>
                    </div>
                  </form>
                )}
              </Card>

              <Card padded={false}>
                {claimsQuery.isPending ? (
                  <LoadingState label="Carregando claims" />
                ) : claimsQuery.error ? (
                  <div className="p-4">
                    <ErrorState message={describeResearchApiError(claimsQuery.error)} />
                    <button
                      onClick={() => void claimsQuery.refetch()}
                      className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                    >
                      <RefreshCw size={14} /> Recarregar claims
                    </button>
                  </div>
                ) : claims.length === 0 ? (
                  <EmptyState
                    title="Sem claims na sessao"
                    description="Os claims registrados aparecerao aqui apos salvar."
                  />
                ) : (
                  <CompactTable
                    rows={claims}
                    columns={claimColumns}
                    className="border-0 rounded-none"
                    empty="Sem claims registrados."
                  />
                )}
              </Card>
            </>
          ) : (
            <Card>
              <EmptyState
                title="Selecione uma sessao"
                description="A lista de claims fica disponivel apos selecionar uma sessao existente."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
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

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDate(value: string): string {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}
