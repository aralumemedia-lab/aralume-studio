import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, RefreshCw, Save, Search } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { ContentStatusBadge, RiskBadge } from "@/components/status/badges";
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
import type { ContentIdea } from "@/contracts/types";
import {
  createContentIdea,
  describeEditorialApiError,
  getContentIdeas,
  updateContentIdea,
} from "@/services/api-client";
import { formatRelative } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/ideas")({
  head: () => ({
    meta: [
      { title: "Pautas - Aralume" },
      { name: "description", content: "Oportunidades editoriais operaveis pelo frontend." },
    ],
  }),
  component: IdeasPage,
});

type IdeaFormState = {
  title: string;
  summary: string;
  niche: string;
  source: string;
  opportunityScore: string;
  originalityScore: string;
  visualPotentialScore: string;
  clipPotentialScore: string;
  riskLevel: ContentIdea["riskLevel"];
  status: ContentIdea["status"];
};

const emptyIdeaForm = (): IdeaFormState => ({
  title: "",
  summary: "",
  niche: "",
  source: "",
  opportunityScore: "80",
  originalityScore: "70",
  visualPotentialScore: "75",
  clipPotentialScore: "60",
  riskLevel: "ok",
  status: "idea",
});

function IdeasPage() {
  const { activeChannelId, activeChannel } = useChannelContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | undefined>(undefined);
  const [formState, setFormState] = useState<IdeaFormState>(emptyIdeaForm());

  const ideasQuery = useQuery({
    queryKey: ["ideas", activeChannelId],
    enabled: Boolean(activeChannelId),
    queryFn: () => getContentIdeas({ channelId: activeChannelId }),
  });

  const rows = useMemo(() => ideasQuery.data?.data ?? [], [ideasQuery.data]);

  const visibleRows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return rows;
    }

    return rows.filter((row) =>
      [row.title, row.summary, row.niche, row.source, row.status, row.riskLevel]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [rows, search]);

  const selectedIdea = rows.find((item) => item.id === selectedIdeaId) ?? undefined;

  useEffect(() => {
    if (selectedIdea) {
      setFormState(ideaToForm(selectedIdea));
      return;
    }

    setFormState(emptyIdeaForm());
  }, [selectedIdea]);

  useEffect(() => {
    setSelectedIdeaId(undefined);
    setFormState(emptyIdeaForm());
  }, [activeChannelId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeChannelId) {
        throw new Error("Nenhum canal ativo selecionado.");
      }

      const payload = formToIdeaPayload(formState, activeChannelId);
      return selectedIdea
        ? updateContentIdea(selectedIdea.id, omitChannelId(payload))
        : createContentIdea(payload);
    },
    onSuccess: async (response) => {
      setSelectedIdeaId(response.data.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ideas", activeChannelId] }),
        queryClient.invalidateQueries({ queryKey: ["production-items", activeChannelId] }),
        queryClient.invalidateQueries({ queryKey: ["channel-audit", activeChannelId] }),
      ]);
      toast.success(selectedIdea ? "Pauta atualizada com sucesso." : "Pauta criada com sucesso.");
    },
    onError: (error) => {
      toast.error(describeEditorialApiError(error, "ideas"));
    },
  });

  const showLoading = ideasQuery.isPending && rows.length === 0;
  const showError = !!ideasQuery.error && rows.length === 0;
  const showEmpty = !ideasQuery.isPending && !ideasQuery.error && rows.length === 0;

  const cols: Column<ContentIdea>[] = [
    {
      key: "title",
      header: "Pauta",
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedIdeaId(row.id)}
          className="flex min-w-0 flex-col text-left"
        >
          <span className="font-medium truncate">{row.title}</span>
          <span className="text-[11px] text-muted-foreground truncate">{row.summary}</span>
        </button>
      ),
    },
    {
      key: "niche",
      header: "Nicho",
      render: (row) => <span className="text-muted-foreground">{row.niche}</span>,
    },
    {
      key: "source",
      header: "Fonte",
      render: (row) => <span className="text-muted-foreground truncate">{row.source}</span>,
    },
    {
      key: "risk",
      header: "Risco",
      render: (row) => <RiskBadge level={row.riskLevel} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <ContentStatusBadge status={row.status} />,
    },
    {
      key: "at",
      header: "Criado",
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
          title="Pautas"
          description="Selecione um canal para operar pautas reais, canal-scoped."
        />
        <div className="p-4">
          <EmptyState
            title="Nenhum canal ativo"
            description="O fluxo de pautas exige contexto explicito de canal para criar ou consultar registros."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Editorial"
        title="Pautas"
        description="Oportunidades editoriais criadas e editadas pelo frontend real."
        actions={
          <button
            onClick={() => {
              setSelectedIdeaId(undefined);
              setFormState(emptyIdeaForm());
            }}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95"
          >
            <Plus size={14} /> Nova pauta
          </button>
        }
      />

      <div className="grid grid-cols-12 gap-4 p-4">
        <div className="col-span-12 xl:col-span-7 space-y-4">
          <Card>
            <SectionHeader
              eyebrow="Canal"
              title={activeChannel?.name ?? activeChannelId}
              description="A lista e a edicao sao filtradas pelo canal ativo."
              action={<Search size={14} className="text-muted-foreground" />}
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar pauta, nicho, fonte, status..."
            />
          </Card>

          <Card padded={false}>
            {showLoading ? (
              <LoadingState label="Carregando pautas" />
            ) : showError ? (
              <div className="p-4">
                <ErrorState message={describeEditorialApiError(ideasQuery.error, "ideas")} />
                <button
                  onClick={() => void ideasQuery.refetch()}
                  className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                >
                  <RefreshCw size={14} /> Tentar novamente
                </button>
              </div>
            ) : showEmpty ? (
              <EmptyState
                title="Sem pautas no canal selecionado"
                description="Crie a primeira pauta usando o formulario lateral."
              />
            ) : (
              <CompactTable
                rows={visibleRows}
                columns={cols}
                className="border-0 rounded-none"
                empty="Sem pautas no canal ativo."
                onRowClick={(row) => setSelectedIdeaId(row.id)}
              />
            )}
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-5 space-y-4">
          <Card>
            <SectionHeader
              eyebrow={selectedIdea ? "Editar" : "Criar"}
              title={selectedIdea ? selectedIdea.title : "Nova pauta"}
              description="A mesma tela suporta criacao e edicao de pauta com reload."
              action={
                <Link
                  to="/research"
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                >
                  Ir para pesquisa <ArrowRight size={14} />
                </Link>
              }
            />

            <form
              className="space-y-3"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                void saveMutation.mutateAsync();
              }}
            >
              <Field label="Titulo">
                <Input
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Titulo da pauta"
                />
              </Field>
              <Field label="Resumo">
                <Textarea
                  value={formState.summary}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, summary: event.target.value }))
                  }
                  rows={4}
                  placeholder="Resumo operacional da pauta"
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nicho">
                  <Input
                    value={formState.niche}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, niche: event.target.value }))
                    }
                    placeholder="Historia, ciencia..."
                  />
                </Field>
                <Field label="Fonte">
                  <Input
                    value={formState.source}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, source: event.target.value }))
                    }
                    placeholder="Britannica, USP..."
                  />
                </Field>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Oportunidade">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formState.opportunityScore}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        opportunityScore: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Originalidade">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formState.originalityScore}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        originalityScore: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Potencial visual">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formState.visualPotentialScore}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        visualPotentialScore: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Potencial de cortes">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formState.clipPotentialScore}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        clipPotentialScore: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Risco">
                  <select
                    value={formState.riskLevel}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        riskLevel: event.target.value as ContentIdea["riskLevel"],
                      }))
                    }
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                  >
                    <option value="ok">OK</option>
                    <option value="attention">Atencao</option>
                    <option value="warning">Alerta</option>
                    <option value="critical">Critico</option>
                    <option value="blocked">Bloqueado</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    value={formState.status}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        status: event.target.value as ContentIdea["status"],
                      }))
                    }
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                  >
                    <option value="idea">Pauta</option>
                    <option value="research">Pesquisa</option>
                    <option value="script">Roteiro</option>
                    <option value="visual_plan">Plano visual</option>
                    <option value="narration">Narracao</option>
                    <option value="editing">Edicao</option>
                    <option value="clips">Cortes</option>
                    <option value="quality_check">Qualidade</option>
                    <option value="compliance_check">Conformidade</option>
                    <option value="waiting_approval">Aguardando aprovacao</option>
                    <option value="approved">Aprovado</option>
                    <option value="scheduled">Agendado</option>
                    <option value="published">Publicado</option>
                    <option value="failed">Falhou</option>
                    <option value="blocked">Bloqueado</option>
                  </select>
                </Field>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95 disabled:opacity-70"
                >
                  <Save size={14} />
                  {saveMutation.isPending
                    ? selectedIdea
                      ? "Salvando..."
                      : "Criando..."
                    : selectedIdea
                      ? "Salvar alteracoes"
                      : "Criar pauta"}
                </button>
                {selectedIdea ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIdeaId(undefined);
                      setFormState(emptyIdeaForm());
                    }}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                  >
                    Nova pauta
                  </button>
                ) : null}
              </div>
            </form>
          </Card>

          {selectedIdea ? (
            <Card>
              <SectionHeader
                eyebrow="Selecionada"
                title={selectedIdea.title}
                description="A selecao da lista alimenta a pesquisa sem perder o canal ativo."
                action={<ContentStatusBadge status={selectedIdea.status} />}
              />
              <div className="grid gap-2 text-[12px] md:grid-cols-2">
                <Meta label="Nicho" value={selectedIdea.niche} />
                <Meta label="Fonte" value={selectedIdea.source} />
                <Meta label="Risco" value={selectedIdea.riskLevel} />
                <Meta label="Criada" value={formatRelative(selectedIdea.createdAt)} />
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ideaToForm(idea: ContentIdea): IdeaFormState {
  return {
    title: idea.title,
    summary: idea.summary,
    niche: idea.niche,
    source: idea.source,
    opportunityScore: String(idea.opportunityScore),
    originalityScore: String(idea.originalityScore),
    visualPotentialScore: String(idea.visualPotentialScore),
    clipPotentialScore: String(idea.clipPotentialScore),
    riskLevel: idea.riskLevel,
    status: idea.status,
  };
}

function formToIdeaPayload(form: IdeaFormState, channelId: string) {
  return {
    channelId,
    title: form.title.trim(),
    summary: form.summary.trim(),
    niche: form.niche.trim(),
    source: form.source.trim(),
    opportunityScore: Number.parseInt(form.opportunityScore, 10) || 0,
    originalityScore: Number.parseInt(form.originalityScore, 10) || 0,
    visualPotentialScore: Number.parseInt(form.visualPotentialScore, 10) || 0,
    clipPotentialScore: Number.parseInt(form.clipPotentialScore, 10) || 0,
    riskLevel: form.riskLevel,
    status: form.status,
  };
}

function omitChannelId<T extends { channelId: string }>({ channelId: _channelId, ...patch }: T) {
  return patch;
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
    <div className="rounded-md border border-border bg-surface-muted px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[12px] text-foreground truncate">{value}</div>
    </div>
  );
}
