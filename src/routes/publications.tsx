import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Layers3, PlayCircle, ShieldAlert, ShieldCheck, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import {
  ApprovalStatusBadge,
  ComplianceStatusBadge,
  ContentStatusBadge,
  PublicationStatusBadge,
  RiskBadge,
  StatusBadge,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  ApprovalStatus,
  ComplianceStatus,
  ContentIdea,
  DerivedClip,
  PublicationJob,
  PublicationStatus,
  PublicationTarget,
  VideoAsset,
} from "@/contracts/types";
import {
  createPublicationJob,
  createPublicationTarget,
  describePublicationsApiError,
  getAuditLogs,
  getApprovals,
  getComplianceChecks,
  getContentIdeas,
  getDerivedClips,
  getPublicationJobs,
  getPublicationTargets,
  getVideoAssets,
  reschedulePublicationJob,
  getYouTubeChannels,
  getYouTubeConnection,
  getYouTubeOAuthStart,
  getYouTubeReadiness,
  getYouTubeUploadResult,
  revokeYouTube,
  selectYouTubeChannel,
  uploadYouTubePublication,
} from "@/services/api-client";

const operatorName = "Ana Ribeiro";

const jobStatusOptions: Array<{ value: JobStatusFilter; label: string }> = [
  { value: "all", label: "Todos os jobs" },
  { value: "draft", label: "Rascunho" },
  { value: "scheduled", label: "Agendado" },
  { value: "published", label: "Publicado" },
  { value: "failed", label: "Falhou" },
];

export const Route = createFileRoute("/publications")({
  head: () => ({
    meta: [
      { title: "Publicacoes - Aralume" },
      {
        name: "description",
        content:
          "Publicacao assistida por canal com readiness, aprovacao humana, compliance e evidencias.",
      },
    ],
  }),
  component: function PublicationsPage() {
    const { activeChannelId, activeChannel, channels } = useChannelContext();
    const queryClient = useQueryClient();
    const [jobStatusFilter, setJobStatusFilter] = useState<JobStatusFilter>("all");
    const [selectedTargetId, setSelectedTargetId] = useState<string | undefined>(undefined);
    const [selectedSourceId, setSelectedSourceId] = useState<string | undefined>(undefined);
    const [selectedJobId, setSelectedJobId] = useState<string | undefined>(undefined);
    const [isCreatingTarget, setIsCreatingTarget] = useState(false);
    const [targetForm, setTargetForm] = useState<TargetFormState>(createDefaultTargetForm());
    const [jobForm, setJobForm] = useState<JobFormState>(createDefaultJobForm());
    const [youtubeChannelId, setYoutubeChannelId] = useState("");

    useEffect(() => {
      setJobStatusFilter("all");
      setSelectedTargetId(undefined);
      setSelectedSourceId(undefined);
      setSelectedJobId(undefined);
      setIsCreatingTarget(false);
      setTargetForm(createDefaultTargetForm());
      setJobForm(createDefaultJobForm());
    }, [activeChannelId]);

    const targetsQuery = useQuery({
      queryKey: ["publication-targets", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () =>
        getPublicationTargets({
          channelId: activeChannelId as string,
        }),
    });

    const jobsQuery = useQuery({
      queryKey: ["publication-jobs", activeChannelId, jobStatusFilter],
      enabled: Boolean(activeChannelId),
      queryFn: () =>
        getPublicationJobs({
          channelId: activeChannelId as string,
          status: jobStatusFilter === "all" ? undefined : jobStatusFilter,
        }),
    });

    const videosQuery = useQuery({
      queryKey: ["publication-videos", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () => getVideoAssets(activeChannelId as string),
    });

    const clipsQuery = useQuery({
      queryKey: ["publication-clips", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () =>
        getDerivedClips({
          channelId: activeChannelId as string,
        }),
    });

    const ideasQuery = useQuery({
      queryKey: ["publication-content-ideas", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () => getContentIdeas({ channelId: activeChannelId as string }),
    });

    const approvalsQuery = useQuery({
      queryKey: ["publication-approvals", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () =>
        getApprovals({
          channelId: activeChannelId as string,
          entityType: "content_idea",
        }),
    });

    const complianceQuery = useQuery({
      queryKey: ["publication-compliance", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () =>
        getComplianceChecks({
          channelId: activeChannelId as string,
          entityType: "content_idea",
        }),
    });

    const auditQuery = useQuery({
      queryKey: ["publication-audit", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () => getAuditLogs(activeChannelId as string),
    });
    const youtubeConnectionQuery = useQuery({
      queryKey: ["youtube-connection", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () => getYouTubeConnection(activeChannelId as string),
    });
    const youtubeChannelsQuery = useQuery({
      queryKey: ["youtube-channels", activeChannelId],
      enabled: Boolean(activeChannelId) && youtubeConnectionQuery.data?.data.status === "connected",
      queryFn: () => getYouTubeChannels(activeChannelId as string),
    });
    const youtubeReadinessQuery = useQuery({
      queryKey: ["youtube-readiness", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () => getYouTubeReadiness(activeChannelId as string),
    });

    const targets = useMemo(() => targetsQuery.data?.data ?? [], [targetsQuery.data]);
    const jobs = useMemo(() => jobsQuery.data?.data ?? [], [jobsQuery.data]);
    const videos = useMemo(() => videosQuery.data?.data ?? [], [videosQuery.data]);
    const clips = useMemo(() => clipsQuery.data?.data ?? [], [clipsQuery.data]);
    const ideas = useMemo(() => ideasQuery.data?.data ?? [], [ideasQuery.data]);
    const approvals = useMemo(() => approvalsQuery.data?.data ?? [], [approvalsQuery.data]);
    const complianceChecks = useMemo(
      () => complianceQuery.data?.data ?? [],
      [complianceQuery.data],
    );
    const auditLogs = useMemo(() => auditQuery.data?.data ?? [], [auditQuery.data]);

    const contentIdeaById = useMemo(() => new Map(ideas.map((idea) => [idea.id, idea])), [ideas]);
    const latestApprovalByContentId = useMemo(
      () => buildLatestApprovalIndex(approvals),
      [approvals],
    );
    const latestComplianceByContentId = useMemo(
      () => buildLatestComplianceIndex(complianceChecks),
      [complianceChecks],
    );
    const sourceCandidates = useMemo(
      () =>
        buildSourceCandidates({
          videos,
          clips,
          contentIdeaById,
          approvalsByContentId: latestApprovalByContentId,
          complianceByContentId: latestComplianceByContentId,
        }),
      [clips, contentIdeaById, latestApprovalByContentId, latestComplianceByContentId, videos],
    );
    const targetsById = useMemo(
      () => new Map(targets.map((target) => [target.id, target])),
      [targets],
    );
    const jobsById = useMemo(() => new Map(jobs.map((job) => [job.id, job])), [jobs]);

    const selectedTarget = isCreatingTarget
      ? undefined
      : (targetsById.get(selectedTargetId ?? "") ??
        targets.find((target) => target.readinessStatus === "ready") ??
        targets[0]);
    const selectedSource =
      sourceCandidates.find((candidate) => candidate.id === selectedSourceId) ??
      sourceCandidates.find((candidate) => candidate.canProceed) ??
      sourceCandidates[0];
    const selectedJob = jobsById.get(selectedJobId ?? "") ?? jobs[0];

    const youtubeUploadResultQuery = useQuery({
      queryKey: ["youtube-upload-result", activeChannelId, selectedJob?.id],
      enabled:
        Boolean(activeChannelId && selectedJob?.id) &&
        (selectedJob?.status === "published" || selectedJob?.status === "failed"),
      queryFn: () => getYouTubeUploadResult(selectedJob?.id as string, activeChannelId as string),
    });

    useEffect(() => {
      if (isCreatingTarget) {
        return;
      }

      if (selectedTarget?.id && selectedTarget.id !== selectedTargetId) {
        setSelectedTargetId(selectedTarget.id);
        setTargetForm(toTargetForm(selectedTarget));
      }
    }, [isCreatingTarget, selectedTarget, selectedTargetId]);

    useEffect(() => {
      if (selectedSource?.id && selectedSource.id !== selectedSourceId) {
        setSelectedSourceId(selectedSource.id);
        setJobForm((current) => ({
          ...current,
          title: selectedSource.title,
          description: `Pacote assistido para ${selectedSource.title}`,
          idempotencyKey: buildIdempotencyKey(
            activeChannelId,
            selectedTarget?.id,
            selectedSource.id,
          ),
          scheduledAt: selectedJob?.scheduledAt ?? "",
        }));
      }
    }, [
      activeChannelId,
      selectedJob?.scheduledAt,
      selectedSource,
      selectedSourceId,
      selectedTarget?.id,
    ]);

    useEffect(() => {
      if (selectedJob?.id) {
        setSelectedJobId(selectedJob.id);
      }
    }, [selectedJob]);

    const createTargetMutation = useMutation({
      mutationFn: createPublicationTarget,
      onSuccess: async (response) => {
        setIsCreatingTarget(false);
        setSelectedTargetId(response.data.id);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["publication-targets", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["publication-jobs", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["publication-audit", activeChannelId] }),
        ]);
      },
    });

    const createJobMutation = useMutation({
      mutationFn: createPublicationJob,
      onSuccess: async (response) => {
        setSelectedJobId(response.data.id);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["publication-targets", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["publication-jobs", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["publication-audit", activeChannelId] }),
        ]);
      },
    });

    const rescheduleMutation = useMutation({
      mutationFn: ({
        publicationJobId,
        scheduledAt,
      }: {
        publicationJobId: string;
        scheduledAt: string;
      }) =>
        reschedulePublicationJob(publicationJobId, {
          channelId: activeChannelId as string,
          scheduledAt: scheduledAt.trim().length > 0 ? scheduledAt.trim() : null,
          requestedBy: operatorName,
        }),
      onSuccess: async (response) => {
        setSelectedJobId(response.data.id);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["publication-targets", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["publication-jobs", activeChannelId] }),
          queryClient.invalidateQueries({ queryKey: ["publication-audit", activeChannelId] }),
        ]);
      },
    });
    const youtubeConnectMutation = useMutation({
      mutationFn: () => getYouTubeOAuthStart(activeChannelId as string),
      onSuccess: (response) => window.location.assign(response.data.authorizationUrl),
    });
    const youtubeSelectMutation = useMutation({
      mutationFn: (channelId: string) =>
        selectYouTubeChannel({ channelId: activeChannelId as string, youtubeChannelId: channelId }),
      onSuccess: async () => {
        await Promise.all([youtubeConnectionQuery.refetch(), youtubeReadinessQuery.refetch()]);
      },
    });
    const youtubeRevokeMutation = useMutation({
      mutationFn: () => revokeYouTube(activeChannelId as string),
      onSuccess: async () => {
        await Promise.all([youtubeConnectionQuery.refetch(), youtubeReadinessQuery.refetch()]);
      },
    });
    const youtubeUploadMutation = useMutation({
      mutationFn: () => {
        if (!selectedJob) throw new Error("Nenhum job de publicação selecionado.");
        return uploadYouTubePublication(selectedJob.id, {
          channelId: activeChannelId as string,
          requestedBy: operatorName,
        });
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["publication-jobs", activeChannelId] });
      },
    });
    const youtubeUploadResult =
      youtubeUploadMutation.data?.data ?? youtubeUploadResultQuery.data?.data;

    if (!activeChannelId) {
      return (
        <div>
          <PageHeader
            eyebrow="Governanca"
            title="Publicacoes"
            description="Selecione um canal para preparar pacotes de publicacao assistida."
          />
          <div className="p-4">
            <EmptyState
              title="Nenhum canal ativo"
              description="A publicacao assistida exige contexto explicito de canal."
              icon={<ShieldAlert size={18} />}
            />
          </div>
        </div>
      );
    }

    const readyTargetCount = targets.filter((target) => target.readinessStatus === "ready").length;
    const blockedTargetCount = targets.filter(
      (target) => target.readinessStatus === "blocked",
    ).length;
    const canPrepare =
      Boolean(selectedTarget) &&
      Boolean(selectedSource) &&
      selectedTarget?.readinessStatus === "ready" &&
      selectedSource?.canProceed &&
      jobForm.humanConfirmed &&
      jobForm.title.trim().length > 0 &&
      jobForm.description.trim().length > 0 &&
      jobForm.idempotencyKey.trim().length > 0;

    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Governanca"
          title="Publicacoes"
          description="Fluxo assistido para preparar pacotes por canal sem envio externo automatico. A tela mostra alvos, jobs, aprovacao humana, conformidade, bloqueios e evidencias auditaveis."
        />

        <div className="px-4 pb-4 space-y-4">
          <Card className="border-info/30 bg-info-soft/30">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
              <div className="space-y-2">
                <div className="text-[10.5px] uppercase tracking-[0.08em] text-info font-medium">
                  Publicacao assistida
                </div>
                <div className="text-sm text-foreground">
                  O sistema prepara o pacote, registra evidencias e bloqueia aprovacao ou
                  conformidade invalidas. Nenhum envio externo automatico e executado nesta fase.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="info" dot>
                  Sem auto-send externo
                </StatusBadge>
                <StatusBadge tone="ok" dot>
                  Canal {activeChannel?.name ?? activeChannelId}
                </StatusBadge>
              </div>
            </div>
          </Card>

          <Card className="border-primary/25">
            <SectionHeader
              eyebrow="Integração aprovada"
              title="YouTube autorizado"
              description="OAuth 2.0 Google com upload e leitura limitada à descoberta dos canais. Tokens permanecem no backend."
            />
            {youtubeConnectionQuery.isLoading || youtubeReadinessQuery.isLoading ? (
              <LoadingState label="Consultando conexão YouTube..." />
            ) : youtubeConnectionQuery.isError || youtubeReadinessQuery.isError ? (
              <ErrorState
                message="Não foi possível consultar o YouTube. Tente novamente quando o backend estiver disponível."
                onRetry={() => {
                  void youtubeConnectionQuery.refetch();
                  void youtubeReadinessQuery.refetch();
                }}
              />
            ) : (
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      tone={
                        youtubeConnectionQuery.data?.data.status === "connected" ? "ok" : "critical"
                      }
                      dot
                    >
                      {youtubeConnectionQuery.data?.data.status ?? "desconectado"}
                    </StatusBadge>
                    <StatusBadge
                      tone={youtubeReadinessQuery.data?.data.status === "ready" ? "ok" : "critical"}
                    >{`readiness: ${youtubeReadinessQuery.data?.data.status ?? "blocked"}`}</StatusBadge>
                  </div>
                  {youtubeConnectionQuery.data?.data.reauthorizationRequired && (
                    <p className="text-xs text-warning" role="status">
                      Reconexão necessária: a autorização atual não possui os dois escopos
                      aprovados.
                    </p>
                  )}
                  {youtubeConnectionQuery.data?.data.grantedScopes.length ? (
                    <p className="text-xs text-muted-foreground">
                      Escopos válidos: {youtubeConnectionQuery.data.data.grantedScopes.join(", ")}
                    </p>
                  ) : null}
                  <div className="text-muted-foreground">
                    {youtubeConnectionQuery.data?.data.youtubeChannelTitle ??
                      "Nenhum canal YouTube selecionado."}
                  </div>
                  {youtubeReadinessQuery.data?.data.reasons.map((reason) => (
                    <div key={reason} className="text-xs text-warning">
                      {reason}
                    </div>
                  ))}
                  {youtubeConnectionQuery.data?.data.status === "connected" && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {youtubeChannelsQuery.isLoading && (
                        <p className="text-xs text-muted-foreground" role="status">
                          Listando canais YouTube autorizados...
                        </p>
                      )}
                      {youtubeChannelsQuery.isError && (
                        <p className="text-xs text-destructive" role="alert">
                          Não foi possível listar os canais autorizados. Tente reconectar.
                        </p>
                      )}
                      <select
                        aria-label="Canal YouTube"
                        className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                        value={
                          youtubeChannelId ||
                          youtubeConnectionQuery.data.data.youtubeChannelId ||
                          ""
                        }
                        onChange={(event) => setYoutubeChannelId(event.target.value)}
                      >
                        <option value="">Selecionar canal YouTube</option>
                        {(youtubeChannelsQuery.data?.data ?? []).map((channel) => (
                          <option key={channel.id} value={channel.id}>
                            {channel.title}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        disabled={!youtubeChannelId || youtubeSelectMutation.isPending}
                        onClick={() => youtubeSelectMutation.mutate(youtubeChannelId)}
                      >
                        Selecionar destino
                      </Button>
                      {!youtubeChannelsQuery.isLoading &&
                        !youtubeChannelsQuery.isError &&
                        youtubeChannelsQuery.data?.data.length === 0 && (
                          <p className="w-full text-xs text-warning" role="status">
                            Nenhum canal YouTube foi encontrado para esta conta.
                          </p>
                        )}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button
                    size="sm"
                    disabled={
                      youtubeConnectMutation.isPending ||
                      youtubeConnectionQuery.data?.data.status === "connected"
                    }
                    onClick={() => youtubeConnectMutation.mutate()}
                  >
                    {youtubeConnectionQuery.data?.data.reauthorizationRequired
                      ? "Reconectar YouTube"
                      : "Conectar YouTube"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      youtubeRevokeMutation.isPending ||
                      youtubeConnectionQuery.data?.data.status !== "connected"
                    }
                    onClick={() => youtubeRevokeMutation.mutate()}
                  >
                    Revogar
                  </Button>
                  <Button
                    size="sm"
                    disabled={
                      youtubeUploadMutation.isPending ||
                      !selectedJob?.id ||
                      youtubeReadinessQuery.data?.data.status !== "ready"
                    }
                    onClick={() => youtubeUploadMutation.mutate()}
                  >
                    {youtubeUploadMutation.isPending ? "Enviando..." : "Upload autorizado"}
                  </Button>
                </div>
                <div className="lg:col-span-2" aria-live="polite">
                  {youtubeUploadMutation.isError ? (
                    <p role="alert" className="text-xs text-destructive">
                      O upload foi bloqueado ou falhou. Verifique aprovação, conformidade, readiness
                      e o estado da integração.
                    </p>
                  ) : youtubeUploadResult ? (
                    <p className="text-xs text-muted-foreground">
                      Resultado do upload: {youtubeUploadResult.status}
                      {youtubeUploadResult.youtubeVideoId
                        ? ` · vídeo ${youtubeUploadResult.youtubeVideoId}`
                        : ""}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </Card>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Alvos"
              value={targets.length}
              hint="Credenciais e readiness"
              icon={<ShieldCheck size={14} />}
            />
            <KpiCard
              label="Prontos"
              value={readyTargetCount}
              hint="Podem receber pacote assistido"
              tone="ok"
            />
            <KpiCard
              label="Bloqueados"
              value={blockedTargetCount}
              hint="Readiness nao satisfatorio"
              tone="critical"
            />
            <KpiCard
              label="Jobs"
              value={jobs.length}
              hint="Rascunhos e agendamentos"
              icon={<Clock3 size={14} />}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
            <div className="space-y-4">
              <Card>
                <SectionHeader
                  eyebrow="Alvos"
                  title="Publicacao por plataforma"
                  description="Crie ou atualize alvos sem expor segredo. Readiness e calculado a partir do estado do alvo."
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIsCreatingTarget(true);
                        setSelectedTargetId(undefined);
                        setTargetForm(createDefaultTargetForm());
                      }}
                    >
                      Novo alvo
                    </Button>
                  }
                />

                <div className="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <div className="space-y-3">
                    <div className="rounded-md border border-border bg-surface-muted/25 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                            {isCreatingTarget ? "Novo alvo" : "Editar alvo"}
                          </div>
                          <div className="mt-1 text-sm font-medium text-foreground">
                            {selectedTarget?.accountName ?? "Defina um alvo"}
                          </div>
                        </div>
                        {selectedTarget ? (
                          <PublicationStatusBadge status={selectedTarget.status} />
                        ) : (
                          <StatusBadge tone="muted">Novo</StatusBadge>
                        )}
                      </div>

                      <div className="mt-3 grid gap-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <Field
                            label="Plataforma"
                            value={targetForm.platform}
                            onChange={(value) =>
                              setTargetForm((current) => ({
                                ...current,
                                platform: value as PublicationTarget["platform"],
                              }))
                            }
                            options={["youtube", "tiktok", "instagram", "linkedin", "other"]}
                          />
                          <Field
                            label="Status"
                            value={targetForm.status}
                            onChange={(value) =>
                              setTargetForm((current) => ({
                                ...current,
                                status: value as TargetFormState["status"],
                              }))
                            }
                            options={["not_connected", "authenticated", "token_expired"]}
                          />
                        </div>
                        <Field
                          label="Conta"
                          value={targetForm.accountName}
                          onChange={(value) =>
                            setTargetForm((current) => ({ ...current, accountName: value }))
                          }
                          placeholder="Nome da conta ou canal"
                        />
                        <div className="grid gap-3 md:grid-cols-2">
                          <Field
                            label="Ultima conexao"
                            value={targetForm.lastConnectedAt}
                            onChange={(value) =>
                              setTargetForm((current) => ({ ...current, lastConnectedAt: value }))
                            }
                            placeholder="2026-07-12T16:10:00.000Z"
                          />
                          <Field
                            label="Expira em"
                            value={targetForm.tokenExpiresAt}
                            onChange={(value) =>
                              setTargetForm((current) => ({ ...current, tokenExpiresAt: value }))
                            }
                            placeholder="2026-08-12T16:10:00.000Z"
                          />
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <Field
                            label="Content ID"
                            value={targetForm.sourceContentId}
                            onChange={(value) =>
                              setTargetForm((current) => ({ ...current, sourceContentId: value }))
                            }
                            placeholder="idea_06"
                          />
                          <Field
                            label="Source ID"
                            value={targetForm.sourceVideoAssetId}
                            onChange={(value) =>
                              setTargetForm((current) => ({
                                ...current,
                                sourceVideoAssetId: value,
                              }))
                            }
                            placeholder="vd_historia_01"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          createTargetMutation.mutate({
                            ...targetForm,
                            channelId: activeChannelId,
                            requestedBy: operatorName,
                            id: isCreatingTarget ? undefined : selectedTarget?.id,
                            lastConnectedAt: targetForm.lastConnectedAt || undefined,
                            tokenExpiresAt: targetForm.tokenExpiresAt || undefined,
                            sourceContentId: targetForm.sourceContentId || undefined,
                            sourceVideoAssetId: targetForm.sourceVideoAssetId || undefined,
                          })
                        }
                        disabled={
                          createTargetMutation.isPending ||
                          targetForm.accountName.trim().length === 0
                        }
                      >
                        {createTargetMutation.isPending
                          ? "Salvando..."
                          : isCreatingTarget
                            ? "Criar alvo"
                            : "Atualizar alvo"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setIsCreatingTarget(false);
                          setTargetForm(
                            selectedTarget
                              ? toTargetForm(selectedTarget)
                              : createDefaultTargetForm(),
                          );
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                    {createTargetMutation.error && (
                      <ErrorState
                        message={describePublicationsApiError(createTargetMutation.error)}
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    {targetsQuery.isLoading ? (
                      <LoadingState label="Carregando alvos de publicacao" />
                    ) : targetsQuery.isError ? (
                      <ErrorState message={describePublicationsApiError(targetsQuery.error)} />
                    ) : targets.length === 0 ? (
                      <EmptyState
                        title="Nenhum alvo registrado"
                        description="Crie um alvo para conectar a publicacao assistida ao canal ativo."
                      />
                    ) : (
                      <CompactTable
                        rows={targets}
                        columns={targetColumns()}
                        onRowClick={(row) => {
                          setIsCreatingTarget(false);
                          setSelectedTargetId(row.id);
                          setTargetForm(toTargetForm(row));
                        }}
                        className="border-0 rounded-none"
                        empty="Nenhum alvo no canal."
                      />
                    )}
                  </div>
                </div>
              </Card>

              <Card>
                <SectionHeader
                  eyebrow="Candidatos"
                  title="Videos e cortes elegiveis"
                  description="Selecione um video principal ou um corte. O pacote so avanca quando aprovacao, conformidade e readiness estao validos."
                  action={
                    <StatusBadge tone={canPrepare ? "ok" : "critical"} dot>
                      {canPrepare ? "Pronto" : "Bloqueado"}
                    </StatusBadge>
                  }
                />

                {sourceCandidates.length === 0 ? (
                  <EmptyState
                    title="Sem candidatos"
                    description="Nao ha videos ou cortes registradas no canal ativo."
                  />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {sourceCandidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => setSelectedSourceId(candidate.id)}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors",
                          candidate.id === selectedSourceId
                            ? "border-info bg-info-soft/20"
                            : "border-border bg-surface hover:bg-accent/30",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                              {candidate.title}
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {candidate.kind === "clip" ? "Corte derivado" : "Video principal"} ·{" "}
                              {candidate.contentTitle}
                            </div>
                          </div>
                          <StatusBadge tone={candidate.canProceed ? "ok" : "critical"} dot>
                            {candidate.canProceed ? "Pronto" : "Bloqueado"}
                          </StatusBadge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {candidate.kind === "video" ? (
                            <ContentStatusBadge status={candidate.status as VideoAsset["status"]} />
                          ) : (
                            <StatusBadge tone="muted">{candidate.status}</StatusBadge>
                          )}
                          <ComplianceStatusBadge status={candidate.complianceStatus} />
                          {candidate.approvalStatus ? (
                            <ApprovalStatusBadge status={candidate.approvalStatus} />
                          ) : (
                            <StatusBadge tone="muted">Sem aprovacao</StatusBadge>
                          )}
                          <StatusBadge
                            tone={
                              candidate.readinessStatus === "ready"
                                ? "ok"
                                : candidate.readinessStatus === "warning"
                                  ? "warning"
                                  : "critical"
                            }
                          >
                            {candidate.readinessStatus}
                          </StatusBadge>
                        </div>
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          {candidate.readinessReasons.join(" | ")}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <SectionHeader
                  eyebrow="Jobs"
                  title="Pacotes e agendamentos"
                  description="Lista de rascunhos e agendamentos assistidos. Nenhum envio externo automatico ocorre a partir daqui."
                  action={
                    <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      <span>Status</span>
                      <select
                        value={jobStatusFilter}
                        onChange={(event) =>
                          setJobStatusFilter(event.target.value as JobStatusFilter)
                        }
                        className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none"
                      >
                        {jobStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  }
                />

                {jobsQuery.isLoading ? (
                  <LoadingState label="Carregando jobs de publicacao" />
                ) : jobsQuery.isError ? (
                  <ErrorState message={describePublicationsApiError(jobsQuery.error)} />
                ) : jobs.length === 0 ? (
                  <EmptyState
                    title="Nenhum job encontrado"
                    description="Nao ha pacotes de publicacao para o filtro atual."
                    icon={<Layers3 size={18} />}
                  />
                ) : (
                  <CompactTable
                    rows={jobs}
                    columns={jobColumns(targetsById, contentIdeaById)}
                    onRowClick={(row) => {
                      setSelectedJobId(row.id);
                      setSelectedTargetId(row.publicationTargetId);
                      setSelectedSourceId(row.sourceVideoAssetId);
                    }}
                    className="border-0 rounded-none"
                    empty="Nenhum job de publicacao."
                  />
                )}
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <SectionHeader
                  eyebrow="Pacote"
                  title={selectedSource?.title ?? "Nenhum candidato selecionado"}
                  description="Detalhe do pacote assistido, com aprovacao humana, conformidade e bloqueios objetivos."
                />

                {!selectedTarget || !selectedSource ? (
                  <EmptyState
                    title="Selecione um alvo e um candidato"
                    description="A preparacao depende de um alvo valido e de um video ou corte elegivel."
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <PublicationStatusBadge status={selectedTarget.status as PublicationStatus} />
                      <StatusBadge
                        tone={
                          selectedTarget.readinessStatus === "ready"
                            ? "ok"
                            : selectedTarget.readinessStatus === "warning"
                              ? "warning"
                              : "critical"
                        }
                        dot
                      >
                        {selectedTarget.readinessStatus}
                      </StatusBadge>
                      <StatusBadge tone={selectedSource.canProceed ? "ok" : "critical"} dot>
                        {selectedSource.canProceed ? "Pode seguir" : "Bloqueado"}
                      </StatusBadge>
                    </div>

                    <dl className="grid gap-3 text-[12px]">
                      <DetailRow label="Canal" value={activeChannel?.name ?? activeChannelId} />
                      <DetailRow label="Alvo" value={selectedTarget.accountName} />
                      <DetailRow label="Plataforma" value={selectedTarget.platform.toUpperCase()} />
                      <DetailRow label="Conteudo" value={selectedSource.contentTitle} />
                      <DetailRow label="Asset" value={selectedSource.id} mono />
                      <DetailRow
                        label="Aprovacao"
                        value={selectedSource.approvalStatus ?? "ausente"}
                      />
                      <DetailRow label="Conformidade" value={selectedSource.complianceStatus} />
                      <DetailRow
                        label="Readiness"
                        value={selectedTarget.readinessReason ?? "Sem informação"}
                      />
                    </dl>

                    <div className="rounded-md border border-border bg-surface-muted/25 p-3 text-[12px] text-muted-foreground">
                      {selectedSource.blockReason}
                    </div>

                    <div className="space-y-3 rounded-md border border-border bg-surface p-3">
                      <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                        Ação assistida
                      </div>
                      <div className="grid gap-3">
                        <div>
                          <Label
                            htmlFor="publication-title"
                            className="text-[10.5px] uppercase tracking-[0.08em]"
                          >
                            Titulo
                          </Label>
                          <Input
                            id="publication-title"
                            value={jobForm.title}
                            onChange={(event) =>
                              setJobForm((current) => ({ ...current, title: event.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="publication-description"
                            className="text-[10.5px] uppercase tracking-[0.08em]"
                          >
                            Descricao
                          </Label>
                          <textarea
                            id="publication-description"
                            value={jobForm.description}
                            onChange={(event) =>
                              setJobForm((current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                            rows={4}
                            className="min-h-[92px] w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                          />
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <Label
                              htmlFor="publication-scheduled-at"
                              className="text-[10.5px] uppercase tracking-[0.08em]"
                            >
                              Agendamento
                            </Label>
                            <Input
                              id="publication-scheduled-at"
                              value={jobForm.scheduledAt}
                              onChange={(event) =>
                                setJobForm((current) => ({
                                  ...current,
                                  scheduledAt: event.target.value,
                                }))
                              }
                              placeholder="2026-07-15T13:00:00.000Z"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="publication-idempotency"
                              className="text-[10.5px] uppercase tracking-[0.08em]"
                            >
                              Idempotencia
                            </Label>
                            <div className="mt-1 flex gap-2">
                              <Input
                                id="publication-idempotency"
                                value={jobForm.idempotencyKey}
                                onChange={(event) =>
                                  setJobForm((current) => ({
                                    ...current,
                                    idempotencyKey: event.target.value,
                                  }))
                                }
                                className="font-mono text-[11px]"
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                  setJobForm((current) => ({
                                    ...current,
                                    idempotencyKey: buildIdempotencyKey(
                                      activeChannelId,
                                      selectedTarget?.id,
                                      selectedSource?.id,
                                    ),
                                  }))
                                }
                              >
                                Gerar
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label
                              htmlFor="publication-privacy"
                              className="text-[10.5px] uppercase tracking-[0.08em]"
                            >
                              Privacidade
                            </Label>
                            <select
                              id="publication-privacy"
                              value={jobForm.privacyStatus}
                              onChange={(event) =>
                                setJobForm((current) => ({
                                  ...current,
                                  privacyStatus: event.target
                                    .value as JobFormState["privacyStatus"],
                                }))
                              }
                              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                            >
                              <option value="private">Privado</option>
                              <option value="unlisted">Nao listado</option>
                              <option value="public">Publico</option>
                            </select>
                          </div>
                          <div>
                            <Label
                              htmlFor="publication-category"
                              className="text-[10.5px] uppercase tracking-[0.08em]"
                            >
                              Categoria permitida
                            </Label>
                            <Input
                              id="publication-category"
                              value={jobForm.categoryId}
                              onChange={(event) =>
                                setJobForm((current) => ({
                                  ...current,
                                  categoryId: event.target.value,
                                }))
                              }
                              placeholder="Opcional"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="publication-tags"
                              className="text-[10.5px] uppercase tracking-[0.08em]"
                            >
                              Tags permitidas
                            </Label>
                            <Input
                              id="publication-tags"
                              value={jobForm.tags}
                              onChange={(event) =>
                                setJobForm((current) => ({ ...current, tags: event.target.value }))
                              }
                              placeholder="historia, editorial"
                            />
                          </div>
                        </div>

                        <label className="flex items-start gap-2 rounded-md border border-info/30 bg-info-soft/30 p-3 text-xs text-foreground">
                          <input
                            type="checkbox"
                            checked={jobForm.humanConfirmed}
                            onChange={(event) =>
                              setJobForm((current) => ({
                                ...current,
                                humanConfirmed: event.target.checked,
                              }))
                            }
                            className="mt-0.5 h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <span>
                            Confirmo humanamente que este pacote está pronto para revisão/publicação
                            assistida. Esta confirmação não envia o conteúdo a nenhum provedor
                            externo.
                          </span>
                        </label>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() =>
                              createJobMutation.mutate({
                                channelId: activeChannelId,
                                publicationTargetId: selectedTarget.id,
                                contentId: selectedSource.contentId,
                                sourceVideoAssetId: selectedSource.id,
                                title: jobForm.title.trim(),
                                description: jobForm.description.trim(),
                                idempotencyKey: jobForm.idempotencyKey.trim(),
                                privacyStatus: jobForm.privacyStatus,
                                metadata: {
                                  tags: jobForm.tags
                                    .split(",")
                                    .map((tag) => tag.trim())
                                    .filter(Boolean),
                                  ...(jobForm.categoryId.trim()
                                    ? { categoryId: jobForm.categoryId.trim() }
                                    : {}),
                                },
                                humanConfirmed: true,
                                scheduledAt:
                                  jobForm.scheduledAt.trim().length > 0
                                    ? jobForm.scheduledAt.trim()
                                    : undefined,
                                requestedBy: operatorName,
                              })
                            }
                            disabled={!canPrepare || createJobMutation.isPending}
                          >
                            <PlayCircle size={14} />
                            {createJobMutation.isPending
                              ? "Preparando..."
                              : selectedJob
                                ? "Preparar novamente"
                                : "Preparar pacote"}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() =>
                              rescheduleMutation.mutate({
                                publicationJobId: selectedJob?.id ?? "",
                                scheduledAt: jobForm.scheduledAt,
                              })
                            }
                            disabled={!selectedJob || rescheduleMutation.isPending}
                          >
                            <RefreshCw size={14} />
                            Reagendar
                          </Button>
                        </div>
                      </div>

                      {createJobMutation.error && (
                        <ErrorState
                          message={describePublicationsApiError(createJobMutation.error)}
                        />
                      )}
                      {rescheduleMutation.error && (
                        <ErrorState
                          message={describePublicationsApiError(rescheduleMutation.error)}
                        />
                      )}
                      {!canPrepare && (
                        <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                          O pacote fica bloqueado quando o alvo nao esta pronto, a aprovacao nao e
                          aprovada, a conformidade nao e aprovada ou o asset nao esta elegivel.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              <Card>
                <SectionHeader
                  eyebrow="Detalhes"
                  title={selectedJob?.title ?? "Nenhum job selecionado"}
                  description="Status, timestamps e referencias do job de publicacao assistida."
                />

                {!selectedJob ? (
                  <EmptyState
                    title="Selecione um job"
                    description="Clique em uma linha da tabela para ver o pacote salvo e seus metadados."
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <PublicationStatusBadge status={selectedJob.status as PublicationStatus} />
                      <StatusBadge tone="info">{selectedJob.platform}</StatusBadge>
                    </div>
                    <dl className="grid gap-3 text-[12px]">
                      <DetailRow label="Job ID" value={selectedJob.id} mono />
                      <DetailRow label="Target ID" value={selectedJob.publicationTargetId} mono />
                      <DetailRow label="Content ID" value={selectedJob.contentId} mono />
                      <DetailRow label="Source ID" value={selectedJob.sourceVideoAssetId} mono />
                      <DetailRow label="Idempotencia" value={selectedJob.idempotencyKey} mono />
                      <DetailRow
                        label="Confirmacao humana"
                        value={selectedJob.humanConfirmed ? "Confirmada" : "Ausente"}
                      />
                      <DetailRow
                        label="Privacidade"
                        value={selectedJob.privacyStatus ?? "private"}
                      />
                      <DetailRow
                        label="Metadados"
                        value={selectedJob.metadata?.tags?.join(", ") || "Sem tags"}
                      />
                      <DetailRow
                        label="Agendado"
                        value={
                          selectedJob.scheduledAt
                            ? formatDateTime(selectedJob.scheduledAt)
                            : "Sem agendamento"
                        }
                      />
                      <DetailRow label="Criado em" value={formatDateTime(selectedJob.createdAt)} />
                      <DetailRow
                        label="Atualizado em"
                        value={formatDateTime(selectedJob.updatedAt)}
                      />
                      <DetailRow
                        label="Aprovacao"
                        value={selectedJob.approvalId ?? "ausente"}
                        mono
                      />
                      <DetailRow
                        label="Conformidade"
                        value={selectedJob.complianceCheckId ?? "ausente"}
                        mono
                      />
                    </dl>
                    <div className="rounded-md border border-border bg-surface-muted/25 p-3 text-[12px] text-muted-foreground">
                      {selectedJob.description}
                    </div>
                  </div>
                )}
              </Card>

              <Card>
                <SectionHeader
                  eyebrow="Evidencias"
                  title="Auditoria rastreavel"
                  description="Eventos recentes do canal relacionados a alvos e jobs de publicacao."
                />

                {auditQuery.isLoading ? (
                  <LoadingState label="Carregando auditoria de publicacao" />
                ) : auditQuery.isError ? (
                  <ErrorState message="Nao foi possivel carregar a auditoria do canal." />
                ) : publicationAuditEntries(auditLogs).length === 0 ? (
                  <EmptyState
                    title="Sem evidencias"
                    description="Ainda nao ha eventos de publicacao registrados neste canal."
                  />
                ) : (
                  <div className="space-y-2">
                    {publicationAuditEntries(auditLogs).map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-md border border-border bg-surface p-3 text-[12px]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <StatusBadge
                            tone={
                              entry.status === "failed"
                                ? "critical"
                                : entry.status === "warning"
                                  ? "warning"
                                  : "ok"
                            }
                          >
                            {entry.action}
                          </StatusBadge>
                          <span className="font-mono text-[10.5px] text-muted-foreground">
                            {formatRelative(entry.createdAt)}
                          </span>
                        </div>
                        <div className="mt-2 text-foreground">{entry.message}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {entry.entityType} · {entry.entityId}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <SectionHeader
                  eyebrow="Canal"
                  title="Resumo operacional"
                  description="Contexto do canal ativo e isolamento dos dados."
                />
                <dl className="grid gap-2 text-[12px]">
                  <DetailRow label="Canal" value={activeChannel?.name ?? activeChannelId} />
                  <DetailRow label="ID do canal" value={activeChannelId} mono />
                  <DetailRow label="Alvos" value={targets.length.toString()} />
                  <DetailRow label="Jobs" value={jobs.length.toString()} />
                  <DetailRow
                    label="Fontes"
                    value={`${videos.length} videos / ${clips.length} cortes`}
                  />
                  <DetailRow
                    label="Dependencias"
                    value="Aprovacao humana, conformidade, video pronto e readiness do alvo"
                  />
                </dl>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  },
});

type JobStatusFilter = "all" | "draft" | "scheduled" | "published" | "failed";

type TargetFormState = {
  platform: PublicationTarget["platform"];
  accountName: string;
  status: Extract<PublicationStatus, "not_connected" | "authenticated" | "token_expired">;
  lastConnectedAt: string;
  tokenExpiresAt: string;
  sourceContentId: string;
  sourceVideoAssetId: string;
};

type JobFormState = {
  title: string;
  description: string;
  privacyStatus: "public" | "unlisted" | "private";
  categoryId: string;
  tags: string;
  humanConfirmed: boolean;
  scheduledAt: string;
  idempotencyKey: string;
};

type PublicationSourceCandidate = {
  id: string;
  kind: "video" | "clip";
  title: string;
  channelId: string;
  contentId: string;
  contentTitle: string;
  status: string;
  renderStatus: string;
  complianceStatus: ComplianceStatus;
  approvalStatus?: ApprovalStatus;
  canProceed: boolean;
  readinessStatus: "ready" | "warning" | "blocked";
  readinessReasons: string[];
  blockReason: string;
};

function targetColumns(): Column<PublicationTarget>[] {
  return [
    {
      key: "account",
      header: "Conta",
      render: (row) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{row.accountName}</div>
          <div className="truncate text-[11px] text-muted-foreground">
            {row.platform.toUpperCase()}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <PublicationStatusBadge status={row.status as PublicationStatus} />,
    },
    {
      key: "readiness",
      header: "Readiness",
      render: (row) => (
        <StatusBadge
          tone={
            row.readinessStatus === "ready"
              ? "ok"
              : row.readinessStatus === "warning"
                ? "warning"
                : "critical"
          }
          dot
        >
          {row.readinessStatus}
        </StatusBadge>
      ),
    },
    {
      key: "updated",
      header: "Atualizado",
      render: (row) => (
        <span className="text-muted-foreground">{formatRelative(row.updatedAt ?? "")}</span>
      ),
    },
  ];
}

function jobColumns(
  targetsById: Map<string, PublicationTarget>,
  contentIdeaById: Map<string, ContentIdea>,
): Column<PublicationJob>[] {
  return [
    {
      key: "job",
      header: "Job",
      render: (row) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{row.title}</div>
          <div className="truncate text-[11px] text-muted-foreground">
            {contentIdeaById.get(row.contentId)?.title ?? row.contentId}
          </div>
        </div>
      ),
    },
    {
      key: "target",
      header: "Alvo",
      render: (row) => (
        <span className="text-muted-foreground">
          {targetsById.get(row.publicationTargetId)?.accountName ?? row.publicationTargetId}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <PublicationStatusBadge status={row.status as PublicationStatus} />,
    },
    {
      key: "scheduled",
      header: "Agendado",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.scheduledAt ? formatDateTime(row.scheduledAt) : "Sem agendamento"}
        </span>
      ),
    },
    {
      key: "updated",
      header: "Atualizado",
      render: (row) => (
        <span className="text-muted-foreground">{formatRelative(row.updatedAt)}</span>
      ),
    },
  ];
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options?: string[];
}) {
  return (
    <label className="space-y-1">
      <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      {options ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function createDefaultTargetForm(): TargetFormState {
  return {
    platform: "youtube",
    accountName: "",
    status: "authenticated",
    lastConnectedAt: "",
    tokenExpiresAt: "",
    sourceContentId: "",
    sourceVideoAssetId: "",
  };
}

function createDefaultJobForm(): JobFormState {
  return {
    title: "",
    description: "",
    privacyStatus: "private",
    categoryId: "",
    tags: "",
    humanConfirmed: false,
    scheduledAt: "",
    idempotencyKey: "",
  };
}

function toTargetForm(target: PublicationTarget): TargetFormState {
  return {
    platform: target.platform,
    accountName: target.accountName,
    status: target.status as TargetFormState["status"],
    lastConnectedAt: target.lastConnectedAt ?? "",
    tokenExpiresAt: target.tokenExpiresAt ?? "",
    sourceContentId: target.sourceContentId ?? "",
    sourceVideoAssetId: target.sourceVideoAssetId ?? "",
  };
}

function buildIdempotencyKey(
  channelId: string | undefined,
  targetId: string | undefined,
  sourceId: string | undefined,
): string {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
  return `publication:${channelId ?? "channel"}:${targetId ?? "target"}:${sourceId ?? "source"}:${suffix}`;
}

function buildLatestApprovalIndex(
  approvals: Array<
    { id: string; entityId: string; updatedAt: string } & { status: ApprovalStatus }
  >,
) {
  return approvals
    .slice()
    .sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) || right.id.localeCompare(left.id),
    )
    .reduce((map, approval) => {
      if (!map.has(approval.entityId)) {
        map.set(approval.entityId, approval);
      }
      return map;
    }, new Map<string, (typeof approvals)[number]>());
}

function buildLatestComplianceIndex(
  checks: Array<{ id: string; entityId: string; updatedAt: string; status: ComplianceStatus }>,
) {
  return checks
    .slice()
    .sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) || right.id.localeCompare(left.id),
    )
    .reduce((map, check) => {
      if (!map.has(check.entityId)) {
        map.set(check.entityId, check);
      }
      return map;
    }, new Map<string, (typeof checks)[number]>());
}

function buildSourceCandidates(input: {
  videos: VideoAsset[];
  clips: DerivedClip[];
  contentIdeaById: Map<string, ContentIdea>;
  approvalsByContentId: Map<string, { status: ApprovalStatus } | undefined>;
  complianceByContentId: Map<string, { status: ComplianceStatus } | undefined>;
}): PublicationSourceCandidate[] {
  const candidates: PublicationSourceCandidate[] = [];

  for (const video of input.videos) {
    const content = input.contentIdeaById.get(video.contentId);
    const approval = input.approvalsByContentId.get(video.contentId);
    const compliance = input.complianceByContentId.get(video.contentId);
    const canProceed =
      Boolean(content) &&
      approval?.status === "approved" &&
      compliance?.status === "approved" &&
      video.renderStatus === "rendered" &&
      ["approved", "published", "scheduled"].includes(video.status);

    candidates.push({
      id: video.id,
      kind: "video",
      title: video.title,
      channelId: video.channelId,
      contentId: video.contentId,
      contentTitle: content?.title ?? video.contentId,
      status: video.status,
      renderStatus: video.renderStatus,
      complianceStatus: video.complianceStatus,
      approvalStatus: approval?.status,
      canProceed,
      readinessStatus: canProceed
        ? "ready"
        : approval?.status === "rejected" || compliance?.status === "blocked"
          ? "blocked"
          : "warning",
      readinessReasons: buildSourceReasons(video, approval?.status, compliance?.status),
      blockReason: buildSourceBlockReason(video, approval?.status, compliance?.status),
    });
  }

  for (const clip of input.clips) {
    const parent = input.videos.find((video) => video.id === clip.parentVideoId);
    const content = parent ? input.contentIdeaById.get(parent.contentId) : undefined;
    const approval = parent ? input.approvalsByContentId.get(parent.contentId) : undefined;
    const compliance = parent ? input.complianceByContentId.get(parent.contentId) : undefined;
    const canProceed =
      Boolean(content) &&
      approval?.status === "approved" &&
      compliance?.status === "approved" &&
      clip.status === "completed" &&
      Boolean(parent) &&
      parent?.renderStatus === "rendered" &&
      ["approved", "published", "scheduled"].includes(parent?.status ?? "");

    candidates.push({
      id: clip.id,
      kind: "clip",
      title: clip.title,
      channelId: clip.channelId,
      contentId: parent?.contentId ?? clip.parentVideoId,
      contentTitle: content?.title ?? clip.parentVideoId,
      status: clip.status,
      renderStatus: clip.status,
      complianceStatus: parent?.complianceStatus ?? "needs_human_review",
      approvalStatus: approval?.status,
      canProceed,
      readinessStatus: canProceed
        ? "ready"
        : approval?.status === "rejected" || compliance?.status === "blocked"
          ? "blocked"
          : "warning",
      readinessReasons: buildClipReasons(clip, parent, approval?.status, compliance?.status),
      blockReason: buildClipBlockReason(clip, parent, approval?.status, compliance?.status),
    });
  }

  return candidates.sort((left, right) => {
    const readyDiff = Number(right.canProceed) - Number(left.canProceed);
    if (readyDiff !== 0) {
      return readyDiff;
    }

    return left.title.localeCompare(right.title);
  });
}

function buildSourceReasons(
  video: VideoAsset,
  approvalStatus?: ApprovalStatus,
  complianceStatus?: ComplianceStatus,
): string[] {
  const reasons: string[] = [];
  if (video.renderStatus === "rendered") {
    reasons.push("Render concluido");
  } else {
    reasons.push("Render ainda nao concluido");
  }

  if (approvalStatus === "approved") {
    reasons.push("Aprovacao aprovada");
  } else if (approvalStatus) {
    reasons.push(`Aprovacao ${approvalStatus}`);
  } else {
    reasons.push("Aprovacao ausente");
  }

  if (complianceStatus === "approved") {
    reasons.push("Conformidade aprovada");
  } else if (complianceStatus) {
    reasons.push(`Conformidade ${complianceStatus}`);
  } else {
    reasons.push("Conformidade ausente");
  }

  return reasons;
}

function buildSourceBlockReason(
  video: VideoAsset,
  approvalStatus?: ApprovalStatus,
  complianceStatus?: ComplianceStatus,
): string {
  if (approvalStatus && approvalStatus !== "approved") {
    return `Bloqueado por aprovacao humana (${approvalStatus}).`;
  }

  if (!approvalStatus) {
    return "Bloqueado por falta de aprovacao humana.";
  }

  if (complianceStatus && complianceStatus !== "approved" && complianceStatus !== "attention") {
    return `Bloqueado por conformidade (${complianceStatus}).`;
  }

  if (!complianceStatus) {
    return "Bloqueado por falta de verificacao de conformidade.";
  }

  if (video.renderStatus !== "rendered") {
    return "Bloqueado porque o video ainda nao esta renderizado.";
  }

  if (!["approved", "published", "scheduled"].includes(video.status)) {
    return `Bloqueado porque o video esta ${video.status}.`;
  }

  return "Disponivel para pacote assistido.";
}

function buildClipReasons(
  clip: DerivedClip,
  parent?: VideoAsset,
  approvalStatus?: ApprovalStatus,
  complianceStatus?: ComplianceStatus,
): string[] {
  const reasons: string[] = [];
  reasons.push(clip.status === "completed" ? "Corte concluido" : `Corte ${clip.status}`);
  if (parent) {
    reasons.push(
      parent.renderStatus === "rendered" ? "Video base renderizado" : "Video base pendente",
    );
  }
  reasons.push(
    approvalStatus === "approved"
      ? "Aprovacao aprovada"
      : `Aprovacao ${approvalStatus ?? "ausente"}`,
  );
  reasons.push(
    complianceStatus === "approved"
      ? "Conformidade aprovada"
      : `Conformidade ${complianceStatus ?? "ausente"}`,
  );
  return reasons;
}

function buildClipBlockReason(
  clip: DerivedClip,
  parent?: VideoAsset,
  approvalStatus?: ApprovalStatus,
  complianceStatus?: ComplianceStatus,
): string {
  if (approvalStatus && approvalStatus !== "approved") {
    return `Bloqueado por aprovacao humana (${approvalStatus}).`;
  }

  if (!approvalStatus) {
    return "Bloqueado por falta de aprovacao humana.";
  }

  if (complianceStatus && complianceStatus !== "approved" && complianceStatus !== "attention") {
    return `Bloqueado por conformidade (${complianceStatus}).`;
  }

  if (!complianceStatus) {
    return "Bloqueado por falta de verificacao de conformidade.";
  }

  if (clip.status !== "completed") {
    return "Bloqueado porque o corte ainda nao foi concluido.";
  }

  if (parent && parent.renderStatus !== "rendered") {
    return "Bloqueado porque o video base ainda nao foi renderizado.";
  }

  return "Disponivel para pacote assistido.";
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start">
      <dt className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">{label}</dt>
      <dd className={cn("text-foreground", mono ? "font-mono text-[11px] break-all" : "")}>
        {value}
      </dd>
    </div>
  );
}

function publicationAuditEntries(
  entries: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    status: "success" | "warning" | "failed";
    message: string;
    createdAt: string;
  }>,
) {
  return entries
    .filter(
      (entry) =>
        entry.action.startsWith("publication") ||
        entry.entityType === "PublicationJob" ||
        entry.entityType === "PublicationTarget",
    )
    .sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id),
    )
    .slice(0, 8);
}
