import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Film, Layers3, PlayCircle, RefreshCw, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import {
  ContentStatusBadge,
  MediaAssetOriginBadge,
  StatusBadge,
  WorkflowStatusBadge,
} from "@/components/status/badges";
import {
  Card,
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  SectionHeader,
} from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import {
  formatBytes,
  formatChecksum,
  formatCurrencyCents,
  formatDateTime,
  formatDuration,
  formatRelative,
} from "@/lib/format";
import type { MediaAssetBase, RenderJob, VideoAsset } from "@/contracts/types";
import {
  createRenderJob,
  describeMediaAssetsApiError,
  describeRendersApiError,
  getMediaAssets,
  getRenderJobs,
  getVideoAssets,
} from "@/services/api-client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RenderFormState = {
  idempotencyKey: string;
  selectedInputAssetIds: string[];
};

const allowedOrigins = new Set([
  "internal",
  "generated",
  "uploaded",
  "licensed",
  "channel_provided",
  "public_domain",
  "external_authorized",
]);

const allowedLicenseStatuses = new Set([
  "known",
  "verified",
  "not_applicable",
  "confirmed",
  "restricted",
  "attribution_required",
]);

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Videos - Aralume" },
      {
        name: "description",
        content: "Renderizacao controlada, jobs auditaveis e videos resultantes por canal.",
      },
    ],
  }),
  component: function VideosPage() {
    const { activeChannelId, activeChannel } = useChannelContext();
    const queryClient = useQueryClient();
    const [formState, setFormState] = useState<RenderFormState>(() => ({
      idempotencyKey: buildIdempotencyKey(activeChannelId),
      selectedInputAssetIds: [],
    }));
    const [selectedJobId, setSelectedJobId] = useState<string | undefined>(undefined);

    useEffect(() => {
      setFormState({
        idempotencyKey: buildIdempotencyKey(activeChannelId),
        selectedInputAssetIds: [],
      });
      setSelectedJobId(undefined);
    }, [activeChannelId]);

    const renderJobsQuery = useQuery({
      queryKey: ["render-jobs", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () => getRenderJobs({ channelId: activeChannelId as string }),
    });

    const mediaAssetsQuery = useQuery({
      queryKey: ["render-source-assets", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () =>
        getMediaAssets({
          channelId: activeChannelId as string,
          status: "available",
        }),
    });

    const videoAssetsQuery = useQuery({
      queryKey: ["render-videos", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () => getVideoAssets(activeChannelId as string),
    });

    const eligibleAssets = useMemo(
      () => (mediaAssetsQuery.data?.data ?? []).filter(isRenderableSourceAsset),
      [mediaAssetsQuery.data],
    );
    const selectedInputs = useMemo(
      () => eligibleAssets.filter((asset) => formState.selectedInputAssetIds.includes(asset.id)),
      [eligibleAssets, formState.selectedInputAssetIds],
    );

    const renderJobs = useMemo(() => renderJobsQuery.data?.data ?? [], [renderJobsQuery.data]);
    const videoAssets = useMemo(() => videoAssetsQuery.data?.data ?? [], [videoAssetsQuery.data]);
    const selectedJob =
      renderJobs.find((job) => job.id === selectedJobId) ?? renderJobs[0] ?? undefined;
    const selectedOutputAsset = selectedJob?.outputAssetId
      ? videoAssets.find((asset) => asset.id === selectedJob.outputAssetId)
      : undefined;

    useEffect(() => {
      if (!selectedJob && renderJobs.length > 0) {
        setSelectedJobId(renderJobs[0].id);
      }
    }, [renderJobs, selectedJob]);

    const createRenderMutation = useMutation({
      mutationFn: createRenderJob,
      onSuccess: async (response) => {
        setSelectedJobId(response.data.id);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["render-jobs", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["render-videos", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["render-source-assets", activeChannelId] }),
        ]);
      },
    });

    if (!activeChannelId) {
      return (
        <div>
          <PageHeader
            eyebrow="Editorial"
            title="Videos"
            description="Selecione um canal para listar jobs de render e videos resultantes."
          />
          <div className="p-4">
            <EmptyState
              title="Nenhum canal ativo"
              description="A renderizacao controlada exige um canal explicitamente selecionado."
              icon={<ShieldAlert size={18} />}
            />
          </div>
        </div>
      );
    }

    const counts = countJobs(renderJobs);
    const canCreate = eligibleAssets.length > 0 && formState.selectedInputAssetIds.length > 0;

    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Editorial"
          title="Videos"
          description="Renderizacao controlada, rastreavel e isolada por canal. Os jobs sao criados a partir de ativos registrados e a saida final volta ao registry de videos."
        />

        <div className="px-4 pb-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Jobs"
              value={renderJobs.length}
              hint="Fila e historico do canal"
              icon={<Film size={14} />}
            />
            <KpiCard label="Na fila" value={counts.queued} hint="Aguardando execucao" tone="info" />
            <KpiCard
              label="Executando"
              value={counts.running}
              hint="Processo em andamento"
              tone="attention"
            />
            <KpiCard
              label="Concluidos"
              value={counts.completed}
              hint="Vídeos persistidos"
              tone="ok"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
            <div className="space-y-4">
              <Card>
                <SectionHeader
                  eyebrow="Canal"
                  title={activeChannel?.name ?? activeChannelId}
                  description="Renderizacao controlada com ativos do mesmo canal e armazenamento interno autorizado."
                  action={
                    <StatusBadge tone="info">{eligibleAssets.length} ativos aptos</StatusBadge>
                  }
                />

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="space-y-3">
                    <div className="rounded-md border border-border bg-surface-muted/25 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                            Preset
                          </div>
                          <div className="mt-1 text-sm font-medium text-foreground">
                            controlled_demo_short_v1
                          </div>
                        </div>
                        <StatusBadge tone="ok" dot>
                          Reproduzivel
                        </StatusBadge>
                      </div>

                      <div className="mt-3 space-y-3">
                        <div>
                          <Label
                            htmlFor="idempotencyKey"
                            className="text-[11px] uppercase tracking-[0.08em]"
                          >
                            Chave de idempotencia
                          </Label>
                          <div className="mt-1 flex gap-2">
                            <Input
                              id="idempotencyKey"
                              value={formState.idempotencyKey}
                              onChange={(event) =>
                                setFormState((current) => ({
                                  ...current,
                                  idempotencyKey: event.target.value,
                                }))
                              }
                              placeholder="render:ch_xxx:..."
                              className="font-mono text-[11px]"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setFormState((current) => ({
                                  ...current,
                                  idempotencyKey: buildIdempotencyKey(activeChannelId),
                                }))
                              }
                              className="inline-flex items-center gap-1 rounded-sm border border-border bg-surface px-3 text-[12px] hover:bg-accent/50"
                            >
                              <RefreshCw size={13} />
                              Gerar
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label className="text-[11px] uppercase tracking-[0.08em]">Canal</Label>
                            <div className="mt-1 rounded-sm border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                              {activeChannel?.name ?? activeChannelId}
                            </div>
                          </div>
                          <div>
                            <Label className="text-[11px] uppercase tracking-[0.08em]">
                              Contagem
                            </Label>
                            <div className="mt-1 rounded-sm border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                              {formState.selectedInputAssetIds.length} ativo(s) selecionado(s)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border border-border bg-surface-muted/20">
                      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
                        <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                          Ativos de entrada
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setFormState((current) => ({
                              ...current,
                              selectedInputAssetIds: eligibleAssets
                                .slice(0, 2)
                                .map((asset) => asset.id),
                            }))
                          }
                          className="text-[11px] font-medium text-info hover:underline"
                          disabled={eligibleAssets.length === 0}
                        >
                          Usar primeiros 2
                        </button>
                      </div>
                      {mediaAssetsQuery.isLoading ? (
                        <div className="px-3">
                          <LoadingState label="Carregando ativos de entrada" />
                        </div>
                      ) : mediaAssetsQuery.isError ? (
                        <div className="p-3">
                          <ErrorState
                            message={describeMediaAssetsApiError(mediaAssetsQuery.error)}
                          />
                        </div>
                      ) : eligibleAssets.length === 0 ? (
                        <div className="p-3">
                          <EmptyState
                            title="Nenhum ativo apto"
                            description="O canal nao possui ativos disponiveis e aptos para a renderizacao controlada."
                          />
                        </div>
                      ) : (
                        <div className="max-h-[320px] overflow-y-auto p-2">
                          <div className="grid gap-2">
                            {eligibleAssets.map((asset) => {
                              const checked = formState.selectedInputAssetIds.includes(asset.id);
                              return (
                                <label
                                  key={asset.id}
                                  className="flex items-start gap-3 rounded-sm border border-border bg-surface px-3 py-2 text-xs hover:bg-accent/30"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      setFormState((current) => ({
                                        ...current,
                                        selectedInputAssetIds: toggleAssetSelection(
                                          current.selectedInputAssetIds,
                                          asset.id,
                                        ),
                                      }))
                                    }
                                    className="mt-0.5 h-3.5 w-3.5 rounded border-border text-info focus:ring-info"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="min-w-0 truncate font-medium text-foreground">
                                        {asset.title ?? asset.name ?? asset.id}
                                      </span>
                                      <StatusBadge tone="muted">{asset.type}</StatusBadge>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                      <MediaAssetOriginBadge origin={asset.origin} />
                                      <span className="font-mono">{asset.id}</span>
                                      <span>{asset.storagePath}</span>
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-md border border-border bg-surface-muted/25 p-3">
                      <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                        Acao
                      </div>
                      <div className="mt-1 text-sm text-foreground">
                        Inicia um job real, registra auditoria e persiste o video resultante.
                      </div>
                      <button
                        type="button"
                        disabled={!canCreate || createRenderMutation.isPending}
                        onClick={() => {
                          void createRenderMutation.mutateAsync({
                            channelId: activeChannelId,
                            inputAssetIds: formState.selectedInputAssetIds,
                            renderType: "controlled_video",
                            renderProfile: "controlled_demo_short_v1",
                            idempotencyKey: formState.idempotencyKey.trim(),
                          });
                        }}
                        className="mt-3 inline-flex items-center gap-2 rounded-sm bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <PlayCircle size={14} />
                        {createRenderMutation.isPending
                          ? "Renderizando..."
                          : "Iniciar render controlado"}
                      </button>
                      {!canCreate && (
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          Selecione ao menos um ativo apto para liberar a renderizacao.
                        </div>
                      )}
                    </div>

                    {createRenderMutation.error && (
                      <ErrorState message={describeRendersApiError(createRenderMutation.error)} />
                    )}

                    <Card>
                      <SectionHeader
                        eyebrow="Resumo"
                        title="Entrada selecionada"
                        description="Somente IDs registrados sao enviados ao backend."
                      />
                      {selectedInputs.length === 0 ? (
                        <EmptyState
                          title="Sem ativos selecionados"
                          description="Marque ao menos um ativo apto para criar o job."
                        />
                      ) : (
                        <div className="space-y-2">
                          {selectedInputs.map((asset) => (
                            <div
                              key={asset.id}
                              className="rounded-sm border border-border bg-surface-muted/35 p-3 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-foreground truncate">
                                  {asset.title ?? asset.name ?? asset.id}
                                </span>
                                <StatusBadge tone="info">{asset.status}</StatusBadge>
                              </div>
                              <div className="mt-1 grid gap-1 text-[11px] text-muted-foreground">
                                <span className="font-mono">{asset.id}</span>
                                <span className="truncate">{asset.storagePath}</span>
                                <span>{formatBytes(asset.sizeBytes ?? 0)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </Card>

              <Card padded={false}>
                <div className="p-4 pb-2">
                  <SectionHeader
                    eyebrow="Jobs"
                    title="Fila e historico"
                    description="Estados explicitamente rastreados e auditaveis."
                  />
                </div>
                {renderJobsQuery.isLoading ? (
                  <div className="px-4 pb-4">
                    <LoadingState label="Carregando jobs de renderizacao" />
                  </div>
                ) : renderJobsQuery.isError ? (
                  <div className="px-4 pb-4">
                    <ErrorState message={describeRendersApiError(renderJobsQuery.error)} />
                  </div>
                ) : renderJobs.length === 0 ? (
                  <div className="px-4 pb-4">
                    <EmptyState
                      title="Nenhum job encontrado"
                      description="Ainda nao existem renders controlados para este canal."
                      icon={<Layers3 size={18} />}
                    />
                  </div>
                ) : (
                  <CompactTable
                    rows={renderJobs}
                    columns={renderJobColumns()}
                    onRowClick={(row) => setSelectedJobId(row.id)}
                    className="border-0 rounded-none"
                    empty="Sem jobs de render."
                  />
                )}
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <SectionHeader
                  eyebrow="Detalhes"
                  title={selectedJob?.id ?? "Nenhum job selecionado"}
                  description="Resultado, logs e metadados tecnicos do job."
                />

                {!selectedJob ? (
                  <EmptyState
                    title="Selecione um job"
                    description="Clique em uma linha da fila para ver a execucao completa."
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <WorkflowStatusBadge status={selectedJob.status} />
                      <StatusBadge tone="muted">{selectedJob.renderType}</StatusBadge>
                      <StatusBadge tone="info">{selectedJob.renderProfile}</StatusBadge>
                    </div>

                    <dl className="grid gap-3 text-[12px]">
                      <DetailRow label="Canal" value={activeChannel?.name ?? activeChannelId} />
                      <DetailRow label="Job ID" value={selectedJob.id} mono />
                      <DetailRow
                        label="Chave idempotente"
                        value={selectedJob.idempotencyKey}
                        mono
                      />
                      <DetailRow
                        label="Entrada"
                        value={selectedJob.inputAssetIds.join(", ")}
                        mono
                      />
                      <DetailRow label="Saida" value={selectedJob.outputStoragePath ?? "—"} mono />
                      <DetailRow label="Criado em" value={formatDateTime(selectedJob.createdAt)} />
                      <DetailRow
                        label="Iniciado em"
                        value={selectedJob.startedAt ? formatDateTime(selectedJob.startedAt) : "—"}
                      />
                      <DetailRow
                        label="Concluido em"
                        value={
                          selectedJob.completedAt ? formatDateTime(selectedJob.completedAt) : "—"
                        }
                      />
                      <DetailRow
                        label="Duracao"
                        value={
                          selectedJob.durationSeconds !== undefined
                            ? formatDuration(selectedJob.durationSeconds)
                            : "—"
                        }
                      />
                      <DetailRow label="Tentativas" value={selectedJob.attemptCount.toString()} />
                      <DetailRow label="Erro" value={selectedJob.errorMessage ?? "—"} />
                      <DetailRow label="Resumo" value={selectedJob.logSummary ?? "—"} />
                    </dl>

                    {selectedOutputAsset ? (
                      <Card className="bg-surface-muted/30">
                        <SectionHeader
                          eyebrow="Video"
                          title={selectedOutputAsset.title}
                          description="Ativo de video gerado pelo render controlado."
                        />
                        <div className="space-y-3 text-[12px]">
                          <div className="flex flex-wrap gap-2">
                            <ContentStatusBadge status={selectedOutputAsset.status} />
                            <StatusBadge tone="ok">{selectedOutputAsset.renderStatus}</StatusBadge>
                            <StatusBadge tone="info">
                              {selectedOutputAsset.complianceStatus}
                            </StatusBadge>
                          </div>
                          <dl className="grid gap-2">
                            <DetailRow label="Video ID" value={selectedOutputAsset.id} mono />
                            <DetailRow
                              label="Storage"
                              value={selectedOutputAsset.storagePath ?? "—"}
                              mono
                            />
                            <DetailRow label="Mime" value={selectedOutputAsset.mimeType ?? "—"} />
                            <DetailRow
                              label="Tamanho"
                              value={formatBytes(selectedOutputAsset.sizeBytes ?? 0)}
                            />
                            <DetailRow
                              label="Checksum"
                              value={formatChecksum(selectedOutputAsset.checksum)}
                              mono
                            />
                            <DetailRow
                              label="Custo"
                              value={formatCurrencyCents(selectedOutputAsset.costActualCents)}
                            />
                            <DetailRow
                              label="Criado em"
                              value={formatDateTime(selectedOutputAsset.createdAt)}
                            />
                          </dl>
                        </div>
                      </Card>
                    ) : (
                      <EmptyState
                        title="Nenhum video vinculado"
                        description="Este job ainda nao produziu um ativo final registrado."
                      />
                    )}

                    <Card>
                      <SectionHeader
                        eyebrow="Logs"
                        title="Resumo operacional"
                        description="Saida e erros normalizados da execucao."
                      />
                      <div className="space-y-2">
                        {(selectedJob.logEntries ?? []).length === 0 ? (
                          <EmptyState
                            title="Sem logs"
                            description="A execucao nao registrou logs."
                          />
                        ) : (
                          (selectedJob.logEntries ?? []).map((entry, index) => (
                            <div
                              key={`${entry.timestamp}-${index}`}
                              className="rounded-sm border border-border bg-surface-muted/30 p-3 text-[12px]"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <StatusBadge
                                  tone={
                                    entry.level === "error"
                                      ? "critical"
                                      : entry.level === "warn"
                                        ? "warning"
                                        : "info"
                                  }
                                >
                                  {entry.level}
                                </StatusBadge>
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  {formatRelative(entry.timestamp)}
                                </span>
                              </div>
                              <div className="mt-2 text-foreground">{entry.message}</div>
                              {entry.code && (
                                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                                  {entry.code}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  </div>
                )}
              </Card>

              <Card padded={false}>
                <div className="p-4 pb-2">
                  <SectionHeader
                    eyebrow="Videos"
                    title="Resultados produzidos"
                    description="Ativos finais persistidos no registry do canal."
                  />
                </div>
                {videoAssetsQuery.isLoading ? (
                  <div className="px-4 pb-4">
                    <LoadingState label="Carregando videos resultantes" />
                  </div>
                ) : videoAssetsQuery.isError ? (
                  <div className="px-4 pb-4">
                    <ErrorState
                      message={describeMediaAssetsApiError(videoAssetsQuery.error, "videos")}
                    />
                  </div>
                ) : videoAssets.length === 0 ? (
                  <div className="px-4 pb-4">
                    <EmptyState
                      title="Nenhum video resultante"
                      description="Ainda nao ha saidas de render registradas para este canal."
                    />
                  </div>
                ) : (
                  <CompactTable
                    rows={videoAssets}
                    columns={videoAssetColumns()}
                    className="border-0 rounded-none"
                    empty="Sem videos resultantes."
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

function renderJobColumns(): Column<RenderJob>[] {
  return [
    {
      key: "id",
      header: "Job",
      render: (row) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{row.id}</div>
          <div className="truncate text-[11px] text-muted-foreground">{row.renderProfile}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <WorkflowStatusBadge status={row.status} />,
    },
    {
      key: "inputs",
      header: "Entradas",
      render: (row) => <span className="font-mono text-[11px]">{row.inputAssetIds.length}</span>,
    },
    {
      key: "output",
      header: "Saida",
      render: (row) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {row.outputAssetId ?? "—"}
        </span>
      ),
    },
    {
      key: "duration",
      header: "Duracao",
      render: (row) => (
        <span className="tabular-nums text-muted-foreground">
          {row.durationSeconds !== undefined ? formatDuration(row.durationSeconds) : "—"}
        </span>
      ),
    },
    {
      key: "updatedAt",
      header: "Atualizado",
      render: (row) => (
        <span className="text-muted-foreground">{formatRelative(row.updatedAt)}</span>
      ),
    },
  ];
}

function videoAssetColumns(): Column<VideoAsset>[] {
  return [
    {
      key: "video",
      header: "Video",
      render: (row) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{row.title}</div>
          <div className="truncate text-[11px] text-muted-foreground">{row.contentId}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <ContentStatusBadge status={row.status} />,
    },
    {
      key: "render",
      header: "Render",
      render: (row) => (
        <StatusBadge tone={renderTone(row.renderStatus)}>{row.renderStatus}</StatusBadge>
      ),
    },
    {
      key: "duration",
      header: "Duracao",
      render: (row) => (
        <span className="tabular-nums text-muted-foreground">
          {formatDuration(row.durationSeconds)}
        </span>
      ),
    },
    {
      key: "size",
      header: "Tamanho",
      render: (row) => (
        <span className="text-muted-foreground">{formatBytes(row.sizeBytes ?? 0)}</span>
      ),
    },
    {
      key: "updatedAt",
      header: "Atualizado",
      render: (row) => (
        <span className="text-muted-foreground">{formatRelative(row.updatedAt)}</span>
      ),
    },
  ];
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <dt className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{label}</dt>
      <dd
        className={
          mono ? "min-w-0 font-mono text-[11px] text-foreground" : "min-w-0 text-foreground"
        }
      >
        <span className="break-words">{value}</span>
      </dd>
    </div>
  );
}

function buildIdempotencyKey(channelId: string | undefined): string {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
  return `render:${channelId ?? "channel"}:${suffix}`;
}

function toggleAssetSelection(current: string[], id: string): string[] {
  if (current.includes(id)) {
    return current.filter((value) => value !== id);
  }

  return [...current, id];
}

function isRenderableSourceAsset(asset: MediaAssetBase): boolean {
  return (
    asset.status === "available" &&
    allowedOrigins.has(asset.origin) &&
    allowedLicenseStatuses.has(asset.licenseStatus)
  );
}

function countJobs(rows: RenderJob[]) {
  return rows.reduce(
    (acc, row) => {
      acc[row.status] += 1;
      return acc;
    },
    {
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      blocked: 0,
    },
  );
}

function renderTone(status: VideoAsset["renderStatus"]): "muted" | "info" | "ok" | "critical" {
  if (status === "rendered") return "ok";
  if (status === "rendering") return "info";
  if (status === "failed") return "critical";
  return "muted";
}
