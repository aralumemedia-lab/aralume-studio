import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, FileText, History, RefreshCw, Save } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDuration, formatRelative } from "@/lib/format";
import type { Script, ScriptVersion } from "@/contracts/types";
import {
  createScript,
  createScriptVersion,
  describeScriptsApiError,
  getContentIdeas,
  getScriptVersions,
  getScripts,
} from "@/services/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/scripts")({
  validateSearch: (search: Record<string, unknown>) => ({
    scriptId: typeof search.scriptId === "string" ? search.scriptId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Roteiros - Aralume" },
      { name: "description", content: "Roteiros versionados do pipeline editorial." },
    ],
  }),
  component: function ScriptsPage() {
    const { activeChannelId, activeChannel } = useChannelContext();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedScriptId, setSelectedScriptId] = useState<string | undefined>(undefined);
    const [scriptForm, setScriptForm] = useState<ScriptFormState>(emptyScriptForm());
    const [versionForm, setVersionForm] = useState<ScriptVersionFormState>(emptyVersionForm());

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

    const ideas = useMemo(() => ideasQuery.data?.data ?? [], [ideasQuery.data]);
    const scripts = useMemo(
      () =>
        [...(scriptsQuery.data?.data ?? [])].sort((left, right) => sortNewestFirst(left, right)),
      [scriptsQuery.data],
    );

    useEffect(() => {
      if (!activeChannelId) {
        return;
      }

      const stored = readStoredScriptId(activeChannelId);
      setSelectedScriptId(stored);
      setScriptForm(emptyScriptForm());
      setVersionForm(emptyVersionForm());
    }, [activeChannelId]);

    useEffect(() => {
      if (ideas.length === 0) {
        return;
      }

      setScriptForm((current) =>
        current.contentId && ideas.some((idea) => idea.id === current.contentId)
          ? current
          : { ...current, contentId: ideas[0].id },
      );
    }, [ideas]);

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

    const selectedScript = scripts.find((item) => item.id === selectedScriptId) ?? undefined;

    const versionsQuery = useQuery({
      queryKey: ["script-versions", activeChannelId, selectedScriptId],
      enabled: Boolean(activeChannelId && selectedScriptId),
      queryFn: () => getScriptVersions(selectedScriptId as string),
    });

    const versions = useMemo(
      () =>
        [...(versionsQuery.data?.data ?? [])].sort(
          (left, right) => left.versionNumber - right.versionNumber,
        ),
      [versionsQuery.data],
    );

    useEffect(() => {
      if (!selectedScript) {
        setVersionForm(emptyVersionForm());
        return;
      }

      const nextNumber = versions.length > 0 ? versions[versions.length - 1].versionNumber + 1 : 2;
      setVersionForm((current) => ({
        ...current,
        versionNumber: current.versionNumber || String(nextNumber),
        title: current.title || selectedScript.title,
        estimatedDurationSeconds:
          current.estimatedDurationSeconds || String(selectedScript.estimatedDurationSeconds),
      }));
    }, [selectedScript, versions]);

    const selectedIdea = ideas.find((idea) => idea.id === selectedScript?.contentId);
    const isLoading = scriptsQuery.isPending && scripts.length === 0;
    const hasError = !!scriptsQuery.error && scripts.length === 0;
    const hasIdeas = !ideasQuery.isPending && !ideasQuery.error && ideas.length > 0;

    const createScriptMutation = useMutation({
      mutationFn: async () => {
        if (!activeChannelId) {
          throw new Error("Nenhum canal ativo selecionado.");
        }

        if (!scriptForm.contentId) {
          throw new Error("Selecione uma pauta antes de criar o roteiro.");
        }

        return createScript({
          channelId: activeChannelId,
          contentId: scriptForm.contentId,
          title: scriptForm.title.trim(),
          status: scriptForm.status,
          estimatedDurationSeconds: Number.parseInt(scriptForm.estimatedDurationSeconds, 10) || 0,
          hook: scriptForm.hook.trim(),
          promise: scriptForm.promise.trim(),
          cta: scriptForm.cta.trim(),
          riskLevel: scriptForm.riskLevel,
          initialVersion: {
            title: scriptForm.initialVersionTitle.trim() || undefined,
            narrationText: scriptForm.initialVersionNarrationText.trim(),
            sceneCount: Number.parseInt(scriptForm.initialVersionSceneCount, 10) || 0,
            estimatedDurationSeconds:
              Number.parseInt(scriptForm.initialVersionEstimatedDurationSeconds, 10) || undefined,
            changeSummary: scriptForm.initialVersionChangeSummary.trim(),
          },
        });
      },
      onSuccess: async (response) => {
        if (!activeChannelId) {
          return;
        }

        setSelectedScriptId(response.data.id);
        writeStoredScriptId(activeChannelId, response.data.id);
        setScriptForm(emptyScriptForm());
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["scripts", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["script-versions", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["content-ideas", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["production-items", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["channel-audit", activeChannelId] }),
        ]);
        toast.success("Roteiro criado com sucesso.");
      },
      onError: (error) => {
        toast.error(describeScriptsApiError(error));
      },
    });

    const createVersionMutation = useMutation({
      mutationFn: async () => {
        if (!selectedScript) {
          throw new Error("Selecione um roteiro antes de criar uma nova versao.");
        }

        return createScriptVersion(selectedScript.id, {
          versionNumber:
            versionForm.versionNumber.trim() === ""
              ? undefined
              : Number.parseInt(versionForm.versionNumber, 10) || undefined,
          title: versionForm.title.trim() || undefined,
          narrationText: versionForm.narrationText.trim(),
          sceneCount: Number.parseInt(versionForm.sceneCount, 10) || 0,
          estimatedDurationSeconds:
            Number.parseInt(versionForm.estimatedDurationSeconds, 10) || undefined,
          changeSummary: versionForm.changeSummary.trim(),
        });
      },
      onSuccess: async (response) => {
        if (!activeChannelId || !selectedScript) {
          return;
        }

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["scripts", activeChannelId] }),
          queryClient.invalidateQueries({
            queryKey: ["script-versions", activeChannelId, selectedScript.id],
          }),
          queryClient.invalidateQueries({ queryKey: ["content-ideas", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["production-items", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["channel-audit", activeChannelId] }),
        ]);
        setVersionForm((current) => ({
          ...current,
          versionNumber: String(response.data.versionNumber + 1),
          changeSummary: "",
        }));
        toast.success("Nova versao criada com sucesso.");
      },
      onError: (error) => {
        toast.error(describeScriptsApiError(error));
      },
    });

    const cols: Column<Script>[] = [
      {
        key: "title",
        header: "Roteiro",
        render: (row) => (
          <button
            type="button"
            onClick={() => {
              if (!activeChannelId) {
                return;
              }

              setSelectedScriptId(row.id);
              writeStoredScriptId(activeChannelId, row.id);
            }}
            className="flex min-w-0 flex-col text-left"
          >
            <span className="font-medium truncate">{row.title}</span>
            <span className="text-[11px] text-muted-foreground truncate">{row.hook}</span>
          </button>
        ),
      },
      {
        key: "version",
        header: "Versao atual",
        render: (row) => (
          <span className="font-mono text-[11px]">
            {row.currentVersionId === selectedScript?.currentVersionId
              ? "Atual"
              : row.currentVersionId}
          </span>
        ),
      },
      {
        key: "dur",
        header: "Duracao",
        render: (row) => (
          <span className="tabular-nums">{formatDuration(row.estimatedDurationSeconds)}</span>
        ),
      },
      { key: "risk", header: "Risco", render: (row) => <RiskBadge level={row.riskLevel} /> },
      {
        key: "status",
        header: "Status",
        render: (row) => <ContentStatusBadge status={row.status} />,
      },
      {
        key: "updated",
        header: "Atualizado",
        render: (row) => (
          <span className="text-muted-foreground">{formatRelative(row.updatedAt)}</span>
        ),
      },
    ];

    const versionCols: Column<ScriptVersion>[] = [
      {
        key: "version",
        header: "Versao",
        render: (row) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">v{row.versionNumber}</span>
            {selectedScript?.currentVersionId === row.id ? (
              <StatusBadge tone="ok" dot>
                Atual
              </StatusBadge>
            ) : null}
          </div>
        ),
      },
      {
        key: "title",
        header: "Titulo",
        render: (row) => <span className="truncate">{row.title}</span>,
      },
      {
        key: "sceneCount",
        header: "Cenas",
        render: (row) => <span className="tabular-nums">{row.sceneCount}</span>,
      },
      {
        key: "duration",
        header: "Duracao",
        render: (row) => (
          <span className="tabular-nums">{formatDuration(row.estimatedDurationSeconds)}</span>
        ),
      },
      {
        key: "summary",
        header: "Mudanca",
        render: (row) => (
          <span className="text-muted-foreground truncate">{row.changeSummary}</span>
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
            eyebrow="Editorial"
            title="Roteiros"
            description="Selecione um canal para operar roteiros versionados e auditaveis."
          />
          <div className="p-4">
            <EmptyState
              title="Nenhum canal ativo"
              description="O fluxo de roteiros exige contexto explicito de canal."
            />
          </div>
        </div>
      );
    }

    return (
      <div>
        <PageHeader
          eyebrow="Editorial"
          title="Roteiros"
          description="Crie um roteiro, versiona-o sem perder a versao anterior e recupere o historico apos reload."
          actions={
            <a
              href="/production"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
            >
              Ir para producao <ArrowRight size={14} />
            </a>
          }
        />

        <div className="grid grid-cols-12 gap-4 p-4">
          <div className="col-span-12 xl:col-span-7 space-y-4">
            <Card>
              <SectionHeader
                eyebrow="Canal"
                title={activeChannel?.name ?? activeChannelId}
                description="A lista e o historico sao sempre filtrados pelo canal ativo."
                action={<StatusBadge tone="info">{scripts.length} roteiro(s)</StatusBadge>}
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar roteiro, gancho, promessa ou status..."
              />
            </Card>

            <Card padded={false}>
              {isLoading ? (
                <LoadingState label="Carregando roteiros" />
              ) : hasError ? (
                <div className="p-4">
                  <ErrorState message={describeScriptsApiError(scriptsQuery.error)} />
                  <button
                    onClick={() => void scriptsQuery.refetch()}
                    className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                  >
                    <RefreshCw size={14} /> Tentar novamente
                  </button>
                </div>
              ) : scripts.length === 0 ? (
                <EmptyState
                  title="Sem roteiros no canal selecionado"
                  description="Crie o primeiro roteiro no formulario lateral."
                />
              ) : (
                <CompactTable
                  rows={filterScripts(scripts, search)}
                  columns={cols}
                  className="border-0 rounded-none"
                  empty="Sem roteiros no canal ativo."
                />
              )}
            </Card>

            <Card padded={false}>
              <div className="p-4 pb-2">
                <SectionHeader
                  eyebrow="Historico"
                  title="Versoes do roteiro"
                  description="Versao 1 permanece imutavel depois da criacao da versao 2."
                  action={<History size={14} className="text-muted-foreground" />}
                />
              </div>
              {!selectedScript ? (
                <div className="px-4 pb-4">
                  <EmptyState
                    title="Selecione um roteiro"
                    description="O historico de versoes aparece quando um roteiro real esta selecionado."
                  />
                </div>
              ) : versionsQuery.isPending ? (
                <div className="px-4 pb-4">
                  <LoadingState label="Carregando versoes" />
                </div>
              ) : versionsQuery.error ? (
                <div className="px-4 pb-4">
                  <ErrorState message={describeScriptsApiError(versionsQuery.error)} />
                </div>
              ) : versions.length === 0 ? (
                <div className="px-4 pb-4">
                  <EmptyState
                    title="Historico vazio"
                    description="A primeira versao aparece junto com a criacao do roteiro."
                  />
                </div>
              ) : (
                <CompactTable
                  rows={versions}
                  columns={versionCols}
                  className="border-0 rounded-none"
                  empty="Sem versoes registradas."
                />
              )}
            </Card>
          </div>

          <div className="col-span-12 xl:col-span-5 space-y-4">
            <Card>
              <SectionHeader
                eyebrow="Criar"
                title="Novo roteiro"
                description="A acao principal chama a API real e grava a versao inicial automaticamente."
                action={<FileText size={14} className="text-muted-foreground" />}
              />

              {hasIdeas ? (
                <form
                  className="space-y-3"
                  data-testid="scripts-create-form"
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    void createScriptMutation.mutateAsync();
                  }}
                >
                  <Field label="Pauta vinculada">
                    <select
                      value={scriptForm.contentId}
                      onChange={(event) =>
                        setScriptForm((current) => ({ ...current, contentId: event.target.value }))
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
                  <Field label="Titulo">
                    <Input
                      value={scriptForm.title}
                      onChange={(event) =>
                        setScriptForm((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder="Titulo do roteiro"
                      required
                    />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Status">
                      <select
                        value={scriptForm.status}
                        onChange={(event) =>
                          setScriptForm((current) => ({
                            ...current,
                            status: event.target.value as Script["status"],
                          }))
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                      >
                        <option value="idea">Pauta</option>
                        <option value="research">Pesquisa</option>
                        <option value="script">Roteiro</option>
                        <option value="visual_plan">Plano visual</option>
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
                    <Field label="Risco">
                      <select
                        value={scriptForm.riskLevel}
                        onChange={(event) =>
                          setScriptForm((current) => ({
                            ...current,
                            riskLevel: event.target.value as Script["riskLevel"],
                          }))
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                      >
                        <option value="ok">OK</option>
                        <option value="attention">Atenção</option>
                        <option value="warning">Alerta</option>
                        <option value="critical">Crítico</option>
                        <option value="blocked">Bloqueado</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="Estimativa de duracao (segundos)">
                    <Input
                      type="number"
                      min={1}
                      value={scriptForm.estimatedDurationSeconds}
                      onChange={(event) =>
                        setScriptForm((current) => ({
                          ...current,
                          estimatedDurationSeconds: event.target.value,
                        }))
                      }
                      required
                    />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="Gancho">
                      <Textarea
                        value={scriptForm.hook}
                        onChange={(event) =>
                          setScriptForm((current) => ({ ...current, hook: event.target.value }))
                        }
                        rows={4}
                        required
                      />
                    </Field>
                    <Field label="Promessa">
                      <Textarea
                        value={scriptForm.promise}
                        onChange={(event) =>
                          setScriptForm((current) => ({ ...current, promise: event.target.value }))
                        }
                        rows={4}
                        required
                      />
                    </Field>
                    <Field label="CTA">
                      <Textarea
                        value={scriptForm.cta}
                        onChange={(event) =>
                          setScriptForm((current) => ({ ...current, cta: event.target.value }))
                        }
                        rows={4}
                        required
                      />
                    </Field>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="Titulo da versao inicial">
                      <Input
                        value={scriptForm.initialVersionTitle}
                        onChange={(event) =>
                          setScriptForm((current) => ({
                            ...current,
                            initialVersionTitle: event.target.value,
                          }))
                        }
                        placeholder="Opcional"
                      />
                    </Field>
                    <Field label="Cenas iniciais">
                      <Input
                        type="number"
                        min={1}
                        value={scriptForm.initialVersionSceneCount}
                        onChange={(event) =>
                          setScriptForm((current) => ({
                            ...current,
                            initialVersionSceneCount: event.target.value,
                          }))
                        }
                        required
                      />
                    </Field>
                    <Field label="Duracao da versao inicial">
                      <Input
                        type="number"
                        min={1}
                        value={scriptForm.initialVersionEstimatedDurationSeconds}
                        onChange={(event) =>
                          setScriptForm((current) => ({
                            ...current,
                            initialVersionEstimatedDurationSeconds: event.target.value,
                          }))
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Narracao inicial">
                    <Textarea
                      value={scriptForm.initialVersionNarrationText}
                      onChange={(event) =>
                        setScriptForm((current) => ({
                          ...current,
                          initialVersionNarrationText: event.target.value,
                        }))
                      }
                      rows={5}
                      required
                    />
                  </Field>
                  <Field label="Resumo da mudanca inicial">
                    <Textarea
                      value={scriptForm.initialVersionChangeSummary}
                      onChange={(event) =>
                        setScriptForm((current) => ({
                          ...current,
                          initialVersionChangeSummary: event.target.value,
                        }))
                      }
                      rows={3}
                      required
                    />
                  </Field>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="submit"
                      disabled={createScriptMutation.isPending}
                      data-testid="create-script-submit"
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95 disabled:opacity-70"
                    >
                      <Save size={14} />
                      {createScriptMutation.isPending ? "Criando..." : "Criar roteiro"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setScriptForm(emptyScriptForm())}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                    >
                      Limpar
                    </button>
                  </div>
                  {createScriptMutation.error ? (
                    <ErrorState message={describeScriptsApiError(createScriptMutation.error)} />
                  ) : null}
                </form>
              ) : (
                <EmptyState
                  title="Nenhuma pauta disponivel"
                  description="Crie uma pauta em /ideas antes de iniciar um roteiro."
                />
              )}
            </Card>

            <Card>
              <SectionHeader
                eyebrow="Selecionado"
                title={selectedScript ? selectedScript.title : "Nenhum roteiro selecionado"}
                description="A selecao fica no navegador e reaparece apos reload enquanto o backend continuar vivo."
                action={
                  selectedScript ? <ContentStatusBadge status={selectedScript.status} /> : null
                }
              />
              {selectedScript ? (
                <div className="space-y-3">
                  <div className="grid gap-2 md:grid-cols-2 text-[12px]">
                    <Meta label="Pauta" value={selectedIdea?.title ?? selectedScript.contentId} />
                    <Meta label="Versao atual" value={selectedScript.currentVersionId} />
                    <Meta
                      label="Duracao"
                      value={formatDuration(selectedScript.estimatedDurationSeconds)}
                    />
                    <Meta label="Atualizado" value={formatRelative(selectedScript.updatedAt)} />
                  </div>
                  <div className="rounded-md border border-border bg-surface-muted px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                      Gancho
                    </div>
                    <div className="mt-1 text-[12px] text-foreground break-words">
                      {selectedScript.hook}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Selecione um roteiro"
                  description="Clique em um item da lista para ver o historico de versoes e o estado atual."
                />
              )}
            </Card>

            <Card>
              <SectionHeader
                eyebrow="Versao"
                title="Nova versao"
                description="A versao anterior permanece imutavel e o numero duplicado vira conflito sanitizado."
                action={<StatusBadge tone="info">{versions.length} versao(oes)</StatusBadge>}
              />

              {selectedScript ? (
                <form
                  className="space-y-3"
                  data-testid="scripts-version-form"
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    void createVersionMutation.mutateAsync();
                  }}
                >
                  <Field label="Numero da versao">
                    <Input
                      type="number"
                      min={1}
                      value={versionForm.versionNumber}
                      onChange={(event) =>
                        setVersionForm((current) => ({
                          ...current,
                          versionNumber: event.target.value,
                        }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Titulo">
                    <Input
                      value={versionForm.title}
                      onChange={(event) =>
                        setVersionForm((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder="Opcional"
                    />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Cenas">
                      <Input
                        type="number"
                        min={1}
                        value={versionForm.sceneCount}
                        onChange={(event) =>
                          setVersionForm((current) => ({
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
                        value={versionForm.estimatedDurationSeconds}
                        onChange={(event) =>
                          setVersionForm((current) => ({
                            ...current,
                            estimatedDurationSeconds: event.target.value,
                          }))
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Narracao">
                    <Textarea
                      value={versionForm.narrationText}
                      onChange={(event) =>
                        setVersionForm((current) => ({
                          ...current,
                          narrationText: event.target.value,
                        }))
                      }
                      rows={5}
                      required
                    />
                  </Field>
                  <Field label="Resumo da mudanca">
                    <Textarea
                      value={versionForm.changeSummary}
                      onChange={(event) =>
                        setVersionForm((current) => ({
                          ...current,
                          changeSummary: event.target.value,
                        }))
                      }
                      rows={3}
                      required
                    />
                  </Field>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="submit"
                      disabled={createVersionMutation.isPending}
                      data-testid="create-version-submit"
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95 disabled:opacity-70"
                    >
                      <Save size={14} />
                      {createVersionMutation.isPending ? "Salvando..." : "Criar versao"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setVersionForm(emptyVersionForm())}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                    >
                      Limpar
                    </button>
                  </div>
                  {createVersionMutation.error ? (
                    <ErrorState message={describeScriptsApiError(createVersionMutation.error)} />
                  ) : null}
                </form>
              ) : (
                <EmptyState
                  title="Selecione um roteiro"
                  description="A criacao de novas versoes fica disponivel depois de selecionar um roteiro."
                />
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  },
});

type ScriptFormState = {
  contentId: string;
  title: string;
  status: Script["status"];
  estimatedDurationSeconds: string;
  hook: string;
  promise: string;
  cta: string;
  riskLevel: Script["riskLevel"];
  initialVersionTitle: string;
  initialVersionNarrationText: string;
  initialVersionSceneCount: string;
  initialVersionEstimatedDurationSeconds: string;
  initialVersionChangeSummary: string;
};

type ScriptVersionFormState = {
  versionNumber: string;
  title: string;
  narrationText: string;
  sceneCount: string;
  estimatedDurationSeconds: string;
  changeSummary: string;
};

function emptyScriptForm(): ScriptFormState {
  return {
    contentId: "",
    title: "",
    status: "script",
    estimatedDurationSeconds: "600",
    hook: "",
    promise: "",
    cta: "",
    riskLevel: "ok",
    initialVersionTitle: "",
    initialVersionNarrationText: "",
    initialVersionSceneCount: "4",
    initialVersionEstimatedDurationSeconds: "",
    initialVersionChangeSummary: "",
  };
}

function emptyVersionForm(): ScriptVersionFormState {
  return {
    versionNumber: "2",
    title: "",
    narrationText: "",
    sceneCount: "4",
    estimatedDurationSeconds: "",
    changeSummary: "",
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

function filterScripts(rows: Script[], search: string): Script[] {
  const normalized = search.trim().toLowerCase();
  if (!normalized) {
    return rows;
  }

  return rows.filter((row) =>
    [row.title, row.hook, row.promise, row.cta, row.status, row.riskLevel, row.currentVersionId]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}

function sortNewestFirst(left: Script, right: Script): number {
  return right.updatedAt.localeCompare(left.updatedAt);
}

function readStoredScriptId(channelId: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage.getItem(storageKey(channelId)) ?? undefined;
}

function writeStoredScriptId(channelId: string, scriptId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey(channelId), scriptId);
}

function storageKey(channelId: string): string {
  return `aralume:scripts:selected:${channelId}`;
}
