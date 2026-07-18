import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Film, PlayCircle, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { ContentStatusBadge, StatusBadge, WorkflowStatusBadge } from "@/components/status/badges";
import {
  Card,
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  SectionHeader,
} from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrencyCents, formatDateTime, formatDuration, formatRelative } from "@/lib/format";
import type { DerivedClip, VideoAsset } from "@/contracts/types";
import {
  createDerivedClip,
  describeMediaAssetsApiError,
  getDerivedClips,
  getVideoAssets,
} from "@/services/api-client";

type ClipFormState = {
  parentVideoId: string;
  startSeconds: string;
  endSeconds: string;
  targetPlatform: DerivedClip["targetPlatform"];
  title: string;
  hook: string;
  description: string;
  idempotencyKey: string;
};

const targetPlatformLabels: Record<DerivedClip["targetPlatform"], string> = {
  youtube_shorts: "YouTube Shorts",
  tiktok: "TikTok",
  instagram_reels: "Instagram Reels",
  linkedin: "LinkedIn",
  other: "Outro",
};

export const Route = createFileRoute("/clips")({
  head: () => ({
    meta: [
      { title: "Cortes - Aralume" },
      {
        name: "description",
        content: "Cortes derivados persistentes, auditaveis e vinculados ao video principal.",
      },
    ],
  }),
  component: function ClipsPage() {
    const { activeChannelId, activeChannel } = useChannelContext();
    const queryClient = useQueryClient();
    const [selectedParentVideoId, setSelectedParentVideoId] = useState<string | undefined>(() =>
      readRequestedParentVideoId(),
    );
    const [selectedClipId, setSelectedClipId] = useState<string | undefined>();
    const [formState, setFormState] = useState<ClipFormState>(() => ({
      parentVideoId: "",
      startSeconds: "0",
      endSeconds: "30",
      targetPlatform: "youtube_shorts",
      title: "",
      hook: "",
      description: "",
      idempotencyKey: buildClipIdempotencyKey(activeChannelId),
    }));

    useEffect(() => {
      setFormState((current) => ({
        ...current,
        idempotencyKey: buildClipIdempotencyKey(activeChannelId),
      }));
      setSelectedParentVideoId(readRequestedParentVideoId());
      setSelectedClipId(undefined);
    }, [activeChannelId]);

    const videoAssetsQuery = useQuery({
      queryKey: ["clips-videos", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () => getVideoAssets(activeChannelId as string),
    });

    const eligibleParentVideos = useMemo(
      () => (videoAssetsQuery.data?.data ?? []).filter(isConcludedVideo),
      [videoAssetsQuery.data],
    );

    useEffect(() => {
      if (!eligibleParentVideos.length) {
        setSelectedParentVideoId(undefined);
        return;
      }

      const nextParentVideo =
        selectedParentVideoId &&
        eligibleParentVideos.some((video) => video.id === selectedParentVideoId)
          ? eligibleParentVideos.find((video) => video.id === selectedParentVideoId)
          : eligibleParentVideos[0];

      if (!nextParentVideo) {
        return;
      }

      if (nextParentVideo.id !== selectedParentVideoId) {
        setSelectedParentVideoId(nextParentVideo.id);
      }

      setFormState((current) =>
        current.parentVideoId === nextParentVideo.id
          ? current
          : {
              ...current,
              parentVideoId: nextParentVideo.id,
              startSeconds: "0",
              endSeconds: String(Math.min(30, nextParentVideo.durationSeconds)),
            },
      );
    }, [eligibleParentVideos, selectedParentVideoId]);

    const selectedParentVideo =
      eligibleParentVideos.find((video) => video.id === selectedParentVideoId) ??
      eligibleParentVideos[0];

    const clipsQuery = useQuery({
      queryKey: ["clips", activeChannelId, selectedParentVideo?.id],
      enabled: Boolean(activeChannelId),
      queryFn: () =>
        getDerivedClips({
          channelId: activeChannelId as string,
          parentVideoId: selectedParentVideo?.id,
        }),
    });

    const clips = useMemo(() => clipsQuery.data?.data ?? [], [clipsQuery.data]);

    useEffect(() => {
      if (!clips.length) {
        setSelectedClipId(undefined);
        return;
      }

      if (!selectedClipId || !clips.some((clip) => clip.id === selectedClipId)) {
        setSelectedClipId(clips[0].id);
      }
    }, [clips, selectedClipId]);

    const selectedClip = clips.find((clip) => clip.id === selectedClipId) ?? clips[0];
    const selectedClipFileUrl = selectedClip
      ? `/api/clips/${selectedClip.id}/file?channelId=${encodeURIComponent(activeChannelId ?? "")}`
      : undefined;

    const createMutation = useMutation({
      mutationFn: createDerivedClip,
      onSuccess: async (response) => {
        setSelectedClipId(response.data.id);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["clips", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["clips-videos", activeChannelId] }),
        ]);
      },
    });

    if (!activeChannelId) {
      return (
        <div>
          <PageHeader eyebrow="Editorial" title="Cortes" description="Selecione um canal." />
          <div className="p-4">
            <EmptyState
              title="Nenhum canal ativo"
              description="Selecione um canal para listar e criar cortes derivados."
            />
          </div>
        </div>
      );
    }

    const parsedStart = Number(formState.startSeconds);
    const parsedEnd = Number(formState.endSeconds);
    const selectedParentDuration = selectedParentVideo?.durationSeconds ?? 0;
    const formError = validateClipForm(parsedStart, parsedEnd, selectedParentDuration);
    const canCreate =
      Boolean(selectedParentVideo) &&
      !formError &&
      !createMutation.isPending &&
      Boolean(formState.idempotencyKey.trim());

    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Editorial"
          title="Cortes"
          description="Cortes derivados controlados, vinculados ao video principal e persistidos no registry."
        />

        <div className="px-4 pb-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Cortes"
              value={clips.length}
              hint="Registry do canal"
              icon={<Film size={14} />}
            />
            <KpiCard
              label="Na fila"
              value={countByStatus(clips, "queued")}
              hint="Aguardando execucao"
              tone="info"
            />
            <KpiCard
              label="Executando"
              value={countByStatus(clips, "running")}
              hint="Processamento real"
              tone="attention"
            />
            <KpiCard
              label="Concluidos"
              value={countByStatus(clips, "completed")}
              hint="Ativos disponiveis"
              tone="ok"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
            <div className="space-y-4">
              <Card>
                <SectionHeader
                  eyebrow="Criacao"
                  title="Gerar corte"
                  description="Selecione um video principal concluido, defina o intervalo e envie a requisicao com idempotencia."
                  action={
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setFormState((current) => ({
                          ...current,
                          idempotencyKey: buildClipIdempotencyKey(activeChannelId),
                        }))
                      }
                    >
                      <RefreshCw size={14} />
                      Nova chave
                    </Button>
                  }
                />

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                  <div className="space-y-4">
                    <div className="rounded-md border border-border bg-surface-muted/20 p-3">
                      <div className="grid gap-3">
                        <div>
                          <Label className="text-[11px] uppercase tracking-[0.08em]">
                            Video principal concluido
                          </Label>
                          <Select
                            value={formState.parentVideoId}
                            onValueChange={(value) => {
                              const video = eligibleParentVideos.find((item) => item.id === value);
                              setFormState((current) => ({
                                ...current,
                                parentVideoId: value,
                                startSeconds: "0",
                                endSeconds: String(Math.min(30, video?.durationSeconds ?? 30)),
                              }));
                              setSelectedParentVideoId(value);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Selecione um video concluido" />
                            </SelectTrigger>
                            <SelectContent>
                              {eligibleParentVideos.map((video) => (
                                <SelectItem key={video.id} value={video.id}>
                                  {video.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedParentVideo ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                                Origem
                              </div>
                              <div className="mt-1 rounded-sm border border-border bg-background px-3 py-2 text-xs">
                                {selectedParentVideo.title}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                                Duracao
                              </div>
                              <div className="mt-1 rounded-sm border border-border bg-background px-3 py-2 text-xs">
                                {formatDuration(selectedParentVideo.durationSeconds)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <EmptyState
                            title="Nenhum video principal concluido"
                            description="O canal precisa de um video concluido para criar cortes derivados."
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-[11px] uppercase tracking-[0.08em]">
                          Inicio (s)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.1"
                          value={formState.startSeconds}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              startSeconds: event.target.value,
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] uppercase tracking-[0.08em]">Fim (s)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.1"
                          value={formState.endSeconds}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              endSeconds: event.target.value,
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-[11px] uppercase tracking-[0.08em]">Plataforma</Label>
                      <Select
                        value={formState.targetPlatform}
                        onValueChange={(value) =>
                          setFormState((current) => ({
                            ...current,
                            targetPlatform: value as DerivedClip["targetPlatform"],
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Plataforma sugerida" />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(targetPlatformLabels) as Array<
                              DerivedClip["targetPlatform"]
                            >
                          ).map((value) => (
                            <SelectItem key={value} value={value}>
                              {targetPlatformLabels[value]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-[11px] uppercase tracking-[0.08em]">
                          Idempotencia
                        </Label>
                        <Input
                          value={formState.idempotencyKey}
                          aria-label="Chave de idempotencia"
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              idempotencyKey: event.target.value,
                            }))
                          }
                          className="mt-1 font-mono text-[11px]"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] uppercase tracking-[0.08em]">Canal</Label>
                        <div className="mt-1 rounded-sm border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                          {activeChannel?.name ?? activeChannelId}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-[11px] uppercase tracking-[0.08em]">Titulo</Label>
                      <Input
                        value={formState.title}
                        onChange={(event) =>
                          setFormState((current) => ({ ...current, title: event.target.value }))
                        }
                        className="mt-1"
                        placeholder="Opcional"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] uppercase tracking-[0.08em]">Gancho</Label>
                      <Input
                        value={formState.hook}
                        onChange={(event) =>
                          setFormState((current) => ({ ...current, hook: event.target.value }))
                        }
                        className="mt-1"
                        placeholder="Opcional"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] uppercase tracking-[0.08em]">
                        Resumo editorial
                      </Label>
                      <Textarea
                        value={formState.description}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        className="mt-1 min-h-[88px]"
                        placeholder="Opcional"
                      />
                    </div>

                    <div className="rounded-md border border-border bg-surface-muted/20 p-3 text-[12px] text-muted-foreground">
                      <div className="font-medium text-foreground">Validaçao do intervalo</div>
                      <div className="mt-1">{formError || "Intervalo valido para envio"}</div>
                    </div>

                    {createMutation.error && (
                      <ErrorState
                        message={describeMediaAssetsApiError(createMutation.error, "clips")}
                      />
                    )}

                    <Button
                      type="button"
                      className="w-full justify-center"
                      disabled={!canCreate}
                      onClick={() => {
                        if (!selectedParentVideo) {
                          return;
                        }

                        createMutation.mutate({
                          channelId: activeChannelId,
                          parentVideoId: selectedParentVideo.id,
                          startSeconds: parsedStart,
                          endSeconds: parsedEnd,
                          idempotencyKey: formState.idempotencyKey.trim(),
                          targetPlatform: formState.targetPlatform,
                          title: formState.title.trim() || undefined,
                          hook: formState.hook.trim() || undefined,
                          description: formState.description.trim() || undefined,
                        });
                      }}
                    >
                      <PlayCircle size={14} />
                      {createMutation.isPending ? "Gerando..." : "Gerar corte"}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Card className="bg-surface-muted/20">
                      <SectionHeader
                        eyebrow="Resumo"
                        title="Intervalo e destino"
                        description="A API recebe apenas IDs e parametros de negocio."
                      />
                      <dl className="grid gap-3 text-[12px]">
                        <DetailRow label="Inicio" value={formatIntervalValue(parsedStart)} mono />
                        <DetailRow label="Fim" value={formatIntervalValue(parsedEnd)} mono />
                        <DetailRow
                          label="Duracao"
                          value={
                            Number.isFinite(parsedStart) &&
                            Number.isFinite(parsedEnd) &&
                            parsedEnd > parsedStart
                              ? formatDuration(Math.max(0, Math.round(parsedEnd - parsedStart)))
                              : "—"
                          }
                        />
                        <DetailRow
                          label="Plataforma"
                          value={targetPlatformLabels[formState.targetPlatform]}
                        />
                        <DetailRow
                          label="Idempotencia"
                          value={formState.idempotencyKey || "—"}
                          mono
                        />
                      </dl>
                    </Card>

                    <Card className="bg-surface-muted/20">
                      <SectionHeader
                        eyebrow="Video"
                        title="Video concluido selecionado"
                        description="Somente videos conclusos ficam disponiveis para derivar cortes."
                      />
                      {selectedParentVideo ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <ContentStatusBadge status={selectedParentVideo.status} />
                            <StatusBadge tone="ok">{selectedParentVideo.renderStatus}</StatusBadge>
                            <StatusBadge tone="info">{selectedParentVideo.format}</StatusBadge>
                          </div>
                          <dl className="grid gap-2 text-[12px]">
                            <DetailRow label="Video ID" value={selectedParentVideo.id} mono />
                            <DetailRow label="Titulo" value={selectedParentVideo.title} />
                            <DetailRow
                              label="Duracao"
                              value={formatDuration(selectedParentVideo.durationSeconds)}
                            />
                            <DetailRow label="Resolucao" value={selectedParentVideo.resolution} />
                            <DetailRow
                              label="Canal"
                              value={activeChannel?.name ?? activeChannelId}
                            />
                            <DetailRow
                              label="Criado em"
                              value={formatDateTime(selectedParentVideo.createdAt)}
                            />
                          </dl>
                          <Button asChild variant="secondary" className="w-full">
                            <Link to="/videos">Abrir videos</Link>
                          </Button>
                        </div>
                      ) : (
                        <EmptyState
                          title="Sem video concluido"
                          description="A lista de videos concluidos esta vazia para este canal."
                        />
                      )}
                    </Card>
                  </div>
                </div>
              </Card>

              <Card padded={false}>
                <div className="p-4 pb-2">
                  <SectionHeader
                    eyebrow="Registry"
                    title="Cortes derivados"
                    description="Estados reais persistidos no backend e vinculados ao video principal."
                  />
                </div>

                {clipsQuery.isLoading ? (
                  <div className="px-4 pb-4">
                    <LoadingState label="Carregando cortes" />
                  </div>
                ) : clipsQuery.isError ? (
                  <div className="px-4 pb-4">
                    <ErrorState message={describeMediaAssetsApiError(clipsQuery.error, "clips")} />
                  </div>
                ) : clips.length === 0 ? (
                  <div className="px-4 pb-4">
                    <EmptyState
                      title="Nenhum corte encontrado"
                      description="Ainda nao existem cortes derivados registrados para este filtro."
                    />
                  </div>
                ) : (
                  <CompactTable
                    rows={clips}
                    columns={clipColumns()}
                    onRowClick={(row) => setSelectedClipId(row.id)}
                    className="border-0 rounded-none"
                    empty="Sem cortes registrados."
                  />
                )}
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <SectionHeader
                  eyebrow="Detalhes"
                  title={selectedClip?.title ?? "Nenhum corte selecionado"}
                  description="Preview do ativo, origem e estado operacional."
                />

                {!selectedClip ? (
                  <EmptyState
                    title="Selecione um corte"
                    description="Clique em uma linha da tabela para ver o corte completo."
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <WorkflowStatusBadge status={selectedClip.status} />
                      <StatusBadge tone="info">
                        {targetPlatformLabels[selectedClip.targetPlatform]}
                      </StatusBadge>
                      <StatusBadge tone="muted">{selectedClip.format}</StatusBadge>
                    </div>

                    {selectedClip.status === "completed" ? (
                      <div className="overflow-hidden rounded-md border border-border bg-black/90">
                        <video
                          key={selectedClip.id}
                          className="h-auto w-full max-h-[360px]"
                          controls
                          src={selectedClipFileUrl}
                        />
                      </div>
                    ) : (
                      <EmptyState
                        title="Preview indisponivel"
                        description="O arquivo so fica acessivel quando o corte termina com sucesso."
                      />
                    )}

                    <div className="flex flex-wrap gap-2">
                      {selectedClip.status === "completed" ? (
                        <Button asChild variant="secondary">
                          <a href={selectedClipFileUrl} target="_blank" rel="noreferrer">
                            Abrir arquivo
                          </a>
                        </Button>
                      ) : (
                        <StatusBadge tone="muted">Arquivo indisponivel ate a conclusao</StatusBadge>
                      )}
                      <Button
                        variant="secondary"
                        onClick={() =>
                          void queryClient.invalidateQueries({
                            queryKey: ["clips", activeChannelId, selectedParentVideo?.id],
                          })
                        }
                      >
                        Recarregar
                      </Button>
                    </div>

                    <dl className="grid gap-3 text-[12px]">
                      <DetailRow label="Corte ID" value={selectedClip.id} mono />
                      <DetailRow label="Video principal" value={selectedClip.parentVideoId} mono />
                      <DetailRow label="Job ID" value={selectedClip.renderJobId} mono />
                      <DetailRow label="Titulo" value={selectedClip.title} />
                      <DetailRow label="Gancho" value={selectedClip.hook} />
                      <DetailRow label="Resumo" value={selectedClip.description} />
                      <DetailRow label="Inicio" value={formatDuration(selectedClip.startSeconds)} />
                      <DetailRow label="Fim" value={formatDuration(selectedClip.endSeconds)} />
                      <DetailRow
                        label="Duracao"
                        value={formatDuration(selectedClip.durationSeconds)}
                      />
                      <DetailRow label="Formato" value={selectedClip.format} />
                      <DetailRow label="Resolucao" value={selectedClip.resolution} />
                      <DetailRow label="Aspect ratio" value={selectedClip.aspectRatio} />
                      <DetailRow
                        label="Potencial"
                        value={String(selectedClip.clipPotentialScore)}
                      />
                      <DetailRow
                        label="Custo"
                        value={
                          selectedClip.costActualCents !== undefined
                            ? formatCurrencyCents(selectedClip.costActualCents)
                            : "—"
                        }
                      />
                      <DetailRow label="Criado em" value={formatDateTime(selectedClip.createdAt)} />
                      <DetailRow
                        label="Atualizado em"
                        value={formatDateTime(selectedClip.updatedAt)}
                      />
                      <DetailRow label="Erro" value={selectedClip.errorMessage ?? "—"} />
                    </dl>
                  </div>
                )}
              </Card>

              <Card padded={false}>
                <div className="p-4 pb-2">
                  <SectionHeader
                    eyebrow="Videos"
                    title="Principais concluidos"
                    description="Fonte disponivel para novos cortes derivados."
                  />
                </div>
                {videoAssetsQuery.isLoading ? (
                  <div className="px-4 pb-4">
                    <LoadingState label="Carregando videos principais" />
                  </div>
                ) : videoAssetsQuery.isError ? (
                  <div className="px-4 pb-4">
                    <ErrorState
                      message={describeMediaAssetsApiError(videoAssetsQuery.error, "videos")}
                    />
                  </div>
                ) : eligibleParentVideos.length === 0 ? (
                  <div className="px-4 pb-4">
                    <EmptyState
                      title="Nenhum video principal concluido"
                      description="O canal selecionado ainda nao possui videos aptos para derivar cortes."
                    />
                  </div>
                ) : (
                  <CompactTable
                    rows={eligibleParentVideos}
                    columns={parentVideoColumns()}
                    onRowClick={(row) => {
                      setSelectedParentVideoId(row.id);
                      setFormState((current) => ({
                        ...current,
                        parentVideoId: row.id,
                        startSeconds: "0",
                        endSeconds: String(Math.min(30, row.durationSeconds)),
                      }));
                    }}
                    className="border-0 rounded-none"
                    empty="Sem videos principais."
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

function parentVideoColumns(): Column<VideoAsset>[] {
  return [
    {
      key: "title",
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
      render: (row) => <StatusBadge tone="ok">{row.renderStatus}</StatusBadge>,
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
      key: "updatedAt",
      header: "Atualizado",
      render: (row) => (
        <span className="text-muted-foreground">{formatRelative(row.updatedAt)}</span>
      ),
    },
  ];
}

function clipColumns(): Column<DerivedClip>[] {
  return [
    {
      key: "title",
      header: "Corte",
      render: (row) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{row.title}</div>
          <div className="truncate text-[11px] text-muted-foreground">{row.parentVideoId}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <WorkflowStatusBadge status={row.status} />,
    },
    {
      key: "start",
      header: "Inicio",
      render: (row) => (
        <span className="tabular-nums text-muted-foreground">
          {formatDuration(row.startSeconds)}
        </span>
      ),
    },
    {
      key: "end",
      header: "Fim",
      render: (row) => (
        <span className="tabular-nums text-muted-foreground">{formatDuration(row.endSeconds)}</span>
      ),
    },
    {
      key: "dur",
      header: "Duracao",
      render: (row) => (
        <span className="tabular-nums text-muted-foreground">
          {formatDuration(row.durationSeconds)}
        </span>
      ),
    },
    {
      key: "platform",
      header: "Plataforma",
      render: (row) => (
        <StatusBadge tone="info">{targetPlatformLabels[row.targetPlatform]}</StatusBadge>
      ),
    },
    {
      key: "res",
      header: "Resolucao",
      render: (row) => <span className="text-muted-foreground">{row.resolution}</span>,
    },
    {
      key: "cost",
      header: "Custo",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.costActualCents !== undefined ? formatCurrencyCents(row.costActualCents) : "—"}
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

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
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

function buildClipIdempotencyKey(channelId: string | undefined): string {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
  return `clip:${channelId ?? "channel"}:${suffix}`;
}

function isConcludedVideo(video: VideoAsset): boolean {
  return (
    video.renderStatus === "rendered" &&
    (video.status === "editing" ||
      video.status === "approved" ||
      video.status === "published" ||
      video.status === "scheduled")
  );
}

function countByStatus(rows: DerivedClip[], status: DerivedClip["status"]): number {
  return rows.filter((row) => row.status === status).length;
}

function validateClipForm(
  startSeconds: number,
  endSeconds: number,
  maxSeconds: number,
): string | undefined {
  if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) {
    return "Informe numeros validos para o intervalo.";
  }

  if (startSeconds < 0) {
    return "O inicio nao pode ser negativo.";
  }

  if (endSeconds <= startSeconds) {
    return "O fim precisa ser maior que o inicio.";
  }

  if (maxSeconds > 0 && endSeconds > maxSeconds) {
    return "O fim nao pode ultrapassar a duracao real do video principal.";
  }

  return undefined;
}

function formatIntervalValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return `${value.toFixed(2)}s`;
}

function readRequestedParentVideoId(): string | undefined {
  if (typeof globalThis.location === "undefined") {
    return undefined;
  }

  const value = new URLSearchParams(globalThis.location.search).get("parentVideoId")?.trim();
  return value || undefined;
}
