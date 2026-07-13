import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Building2, Mic2, Palette, Plus, Radio, Search, Wallet, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import {
  getChannelSettings,
  updateChannel,
  describeChannelsApiError,
} from "@/services/channels-api";
import { getPublicationJobs, getProductionItems } from "@/services/api-client";
import {
  Card,
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  SectionHeader,
} from "@/components/ui/data-card";
import {
  ChannelStatusBadge,
  ContentStatusBadge,
  CostBadge,
  PublicationStatusBadge,
  RiskBadge,
  StatusBadge,
} from "@/components/status/badges";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrencyCents, formatDateTime, formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Channel } from "@/contracts/types";

export const Route = createFileRoute("/channels")({
  head: () => ({
    meta: [
      { title: "Canais — Aralume" },
      {
        name: "description",
        content:
          "Gestão multicanal da operação editorial com lista real de canais, seleção e configurações.",
      },
      { property: "og:title", content: "Canais — Aralume" },
      { property: "og:description", content: "Gestão multicanal da operação editorial." },
    ],
  }),
  component: ChannelsPage,
});

const TABS = [
  "Visão geral",
  "Perfil editorial",
  "Identidade visual",
  "Voz e narração",
  "Regras editoriais",
  "Plataformas",
  "Orçamento",
  "Histórico",
] as const;

type ChannelTab = (typeof TABS)[number];

function ChannelsPage() {
  const queryClient = useQueryClient();
  const {
    channels,
    activeChannel,
    setActiveChannelId,
    loading: channelsLoading,
    error: channelsError,
    refreshChannels,
  } = useChannelContext();
  const [tab, setTab] = useState<ChannelTab>("Visão geral");
  const [search, setSearch] = useState("");

  const visibleChannels = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return channels;
    }

    return channels.filter((channel) =>
      [channel.name, channel.slug, channel.niche, channel.description]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [channels, search]);

  const patchStatusMutation = useMutation({
    mutationFn: async (channel: Channel) => {
      const nextStatus = channel.status === "active" ? "paused" : "active";
      return updateChannel(channel.id, { status: nextStatus });
    },
    onSuccess: async (_result, channel) => {
      await queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast.success(
        channel.status === "active" ? "Canal pausado com sucesso." : "Canal ativado com sucesso.",
      );
    },
    onError: (error) => {
      toast.error(describeChannelsApiError(error));
    },
  });

  const showChannelsLoading = channelsLoading && channels.length === 0;
  const showChannelsError = !!channelsError && channels.length === 0;
  const showChannelsEmpty = !channelsLoading && !channelsError && channels.length === 0;

  if (showChannelsLoading) {
    return (
      <div>
        <PageHeader
          eyebrow="Operação"
          title="Canais"
          description="Cada canal é uma linha editorial autônoma com identidade, orçamento e regras próprias."
        />
        <div className="grid grid-cols-12 gap-4 p-4">
          <LoadingCard />
          <LoadingCard className="col-span-12 lg:col-span-6" />
          <LoadingCard />
        </div>
      </div>
    );
  }

  if (showChannelsError) {
    return (
      <div>
        <PageHeader
          eyebrow="Operação"
          title="Canais"
          description="Cada canal é uma linha editorial autônoma com identidade, orçamento e regras próprias."
        />
        <div className="p-4">
          <Card className="max-w-2xl">
            <ErrorState message={describeChannelsApiError(channelsError)} />
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => void refreshChannels()}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95"
              >
                <RefreshCw size={14} /> Tentar novamente
              </button>
              <button
                onClick={() => void queryClient.invalidateQueries({ queryKey: ["channels"] })}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
              >
                Recarregar cache
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operação"
        title="Canais"
        description="Cada canal é uma linha editorial autônoma com identidade, orçamento e regras próprias."
        actions={
          <button
            onClick={() => toast.info("Criação manual ainda não possui formulário nesta sprint.")}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95"
          >
            <Plus size={14} /> Novo canal
          </button>
        }
      />

      <div className="grid grid-cols-12 gap-4 p-4">
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <Card padded={false}>
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar canal..."
                  className="h-8 w-full rounded-sm border border-border bg-surface pl-7 pr-2 text-[12px] outline-none focus:border-ring"
                />
              </div>
            </div>
            <ul className="divide-y divide-border">
              {visibleChannels.map((channel) => (
                <li key={channel.id}>
                  <button
                    onClick={() => setActiveChannelId(channel.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 hover:bg-accent/40 transition-colors",
                      activeChannel?.id === channel.id && "bg-accent/50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-medium truncate">{channel.name}</div>
                        <div className="text-[10.5px] text-muted-foreground mt-0.5 truncate">
                          {channel.niche || "Sem nicho configurado"}
                        </div>
                      </div>
                      <ChannelStatusBadge status={channel.status} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10.5px] text-muted-foreground">
                      <span>
                        {formatCurrencyCents(channel.monthlyCostUsedCents)} /{" "}
                        {formatCurrencyCents(channel.monthlyBudgetCents)}
                      </span>
                      <span>{formatRelative(channel.lastActivityAt)}</span>
                    </div>
                    <div className="mt-1">
                      <ProgressBar
                        tone={
                          channel.costStatus === "exceeded"
                            ? "critical"
                            : channel.costStatus === "attention"
                              ? "warning"
                              : "ok"
                        }
                        value={
                          channel.monthlyBudgetCents
                            ? (channel.monthlyCostUsedCents / channel.monthlyBudgetCents) * 100
                            : 0
                        }
                      />
                    </div>
                  </button>
                </li>
              ))}
              {visibleChannels.length === 0 && (
                <li className="p-3">
                  <EmptyState
                    title="Nenhum canal encontrado"
                    description="Ajuste a busca ou limpe o filtro para ver todos os canais."
                  />
                </li>
              )}
            </ul>
          </Card>

          {channelsError && channels.length > 0 && (
            <Card>
              <ErrorState message={describeChannelsApiError(channelsError)} />
              <button
                onClick={() => void refreshChannels()}
                className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
              >
                <RefreshCw size={14} /> Recarregar canais
              </button>
            </Card>
          )}
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-4">
          {activeChannel ? (
            <>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Radio size={14} className="text-primary" />
                      <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                        Canal real
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold tracking-tight">{activeChannel.name}</h2>
                    <p className="text-[12px] text-muted-foreground mt-1 max-w-2xl">
                      {activeChannel.description || "Canal sem descrição cadastrada."}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <ChannelStatusBadge status={activeChannel.status} />
                    <RiskBadge level={activeChannel.riskLevel} />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11.5px]">
                  <MetaRow label="Nicho" value={activeChannel.niche || "—"} />
                  <MetaRow label="Público" value={activeChannel.audience || "—"} />
                  <MetaRow label="Idioma" value={activeChannel.language || "—"} />
                  <MetaRow label="Região" value={activeChannel.region || "—"} />
                  <MetaRow label="Timezone" value={activeChannel.timezone} />
                  <MetaRow label="Tom editorial" value={activeChannel.editorialTone || "—"} />
                  <MetaRow label="Frequência" value={activeChannel.publishingFrequency || "—"} />
                  <MetaRow label="Health score" value={`${activeChannel.healthScore}%`} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <ActionButton
                    onClick={() =>
                      toast.info("Edição estrutural ainda não possui formulário nesta sprint.")
                    }
                  >
                    Editar
                  </ActionButton>
                  <ActionButton
                    onClick={() => patchStatusMutation.mutate(activeChannel)}
                    loading={patchStatusMutation.isPending}
                    disabled={patchStatusMutation.isPending}
                    variant="ghost"
                  >
                    {activeChannel.status === "active" ? "Pausar" : "Ativar"}
                  </ActionButton>
                  <ActionButton
                    onClick={() =>
                      toast.info("Configuração de plataformas permanece em modo demo.")
                    }
                    variant="ghost"
                  >
                    Configurar plataforma
                  </ActionButton>
                  <ActionButton
                    onClick={() => toast.info("Histórico editorial permanece demo nesta sprint.")}
                    variant="ghost"
                  >
                    Ver histórico
                  </ActionButton>
                </div>
              </Card>

              <div className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-thin">
                {TABS.map((currentTab) => (
                  <button
                    key={currentTab}
                    onClick={() => setTab(currentTab)}
                    className={cn(
                      "px-3 h-8 text-[12px] border-b-2 -mb-px transition-colors whitespace-nowrap",
                      tab === currentTab
                        ? "border-primary text-foreground font-medium"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {currentTab}
                  </button>
                ))}
              </div>

              <ChannelTabContent tab={tab} channel={activeChannel} />
            </>
          ) : (
            <Card>
              {showChannelsEmpty ? (
                <EmptyState
                  title="Nenhum canal cadastrado"
                  description="A lista agora vem da API real. Crie o primeiro canal no backend ou retorne quando houver dados."
                />
              ) : (
                <EmptyState
                  title="Selecione um canal"
                  description="Use a lista lateral ou o seletor global para trabalhar com um canal específico."
                />
              )}
            </Card>
          )}
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-3">
          {activeChannel ? <ChannelSidebar channel={activeChannel} /> : null}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">{label}</div>
      <div className="text-foreground truncate">{value}</div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  variant = "solid",
  disabled = false,
  loading = false,
}: {
  children: string;
  onClick: () => void;
  variant?: "solid" | "ghost";
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-7 px-2.5 rounded-sm text-[11.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70",
        variant === "solid"
          ? "bg-primary text-primary-foreground hover:opacity-95"
          : "border border-border bg-surface hover:bg-accent/50",
      )}
    >
      {loading ? "Atualizando..." : children}
    </button>
  );
}

function ChannelTabContent({ tab, channel }: { tab: ChannelTab; channel: Channel }) {
  const settingsQ = useQuery({
    queryKey: ["channel-settings", channel.id],
    queryFn: () => getChannelSettings(channel.id),
    enabled: !!channel.id,
  });
  const settings = settingsQ.data?.data;

  if (settingsQ.isPending) {
    return (
      <Card>
        <LoadingState label="Carregando configurações do canal" />
      </Card>
    );
  }

  if (settingsQ.error) {
    return (
      <Card>
        <ErrorState message={describeChannelsApiError(settingsQ.error, "settings")} />
        <button
          onClick={() => void settingsQ.refetch()}
          className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
        >
          <RefreshCw size={14} /> Recarregar configurações
        </button>
      </Card>
    );
  }

  if (tab === "Visão geral") {
    return (
      <Card>
        <SectionHeader
          title="Prontidão operacional"
          description="Diagnóstico rápido para operar em produção supervisionada."
        />
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px]">
          <ReadinessItem
            ok={channel.status === "active" || channel.status === "warning"}
            label="Canal habilitado"
          />
          <ReadinessItem ok={channel.connectedPlatformsCount > 0} label="Plataformas conectadas" />
          <ReadinessItem ok={channel.monthlyBudgetCents > 0} label="Orçamento definido" />
          <ReadinessItem ok={!!settings?.narration.voiceName} label="Voz de narração configurada" />
          <ReadinessItem
            ok={!!settings?.visualIdentity.primaryColor}
            label="Identidade visual definida"
          />
          <ReadinessItem ok={channel.healthScore >= 60} label="Health score aceitável" />
        </ul>
      </Card>
    );
  }

  if (tab === "Identidade visual") {
    return (
      <Card>
        <SectionHeader
          title="Identidade visual"
          description="Padrões visuais definidos na API real de settings."
          action={<Palette size={14} className="text-muted-foreground" />}
        />
        {settings ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
            <MetaRow label="Cor primária" value={settings.visualIdentity.primaryColor} />
            <MetaRow label="Cor secundária" value={settings.visualIdentity.secondaryColor} />
            <MetaRow label="Tipografia" value={settings.visualIdentity.typography} />
            <MetaRow label="Estilo de abertura" value={settings.visualIdentity.openingStyle} />
            <MetaRow label="Legendas" value={settings.visualIdentity.subtitleStyle} />
            <MetaRow label="Thumbnails" value={settings.visualIdentity.thumbnailStyle} />
          </div>
        ) : (
          <EmptyState title="Sem settings visuais" />
        )}
      </Card>
    );
  }

  if (tab === "Voz e narração") {
    return (
      <Card>
        <SectionHeader
          title="Voz e narração"
          description="Configuração de voz aplicada pelo backend de settings."
          action={<Mic2 size={14} className="text-muted-foreground" />}
        />
        {settings ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
              <MetaRow label="Voz" value={settings.narration.voiceName} />
              <MetaRow label="Provedor" value={settings.narration.voiceProvider} />
              <MetaRow label="Velocidade" value={settings.narration.speed.toString()} />
              <MetaRow label="Tom" value={settings.narration.tone} />
            </div>
            <div className="mt-3 text-[11.5px] text-muted-foreground">
              Notas de pronúncia: {settings.narration.pronunciationNotes.join(" · ") || "—"}
            </div>
          </>
        ) : (
          <EmptyState title="Sem settings de narração" />
        )}
      </Card>
    );
  }

  if (tab === "Perfil editorial") {
    return (
      <Card>
        <SectionHeader
          title="Perfil editorial"
          description="Subniches permitidos, temas bloqueados e fontes preferidas."
          action={<Building2 size={14} className="text-muted-foreground" />}
        />
        {settings ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground mb-1">
                Subnichos permitidos
              </div>
              <div className="flex flex-wrap gap-1.5">
                {settings.allowedSubniches.length > 0 ? (
                  settings.allowedSubniches.map((value) => <Chip key={value}>{value}</Chip>)
                ) : (
                  <EmptyChip />
                )}
              </div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground mb-1">
                Temas bloqueados
              </div>
              <div className="flex flex-wrap gap-1.5">
                {settings.blockedThemes.length > 0 ? (
                  settings.blockedThemes.map((value) => (
                    <Chip key={value} tone="critical">
                      {value}
                    </Chip>
                  ))
                ) : (
                  <EmptyChip />
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground mb-1">
                Fontes preferidas
              </div>
              <div className="flex flex-wrap gap-1.5">
                {settings.preferredSources.length > 0 ? (
                  settings.preferredSources.map((value) => (
                    <Chip key={value} tone="info">
                      {value}
                    </Chip>
                  ))
                ) : (
                  <EmptyChip />
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title="Sem settings editoriais" />
        )}
      </Card>
    );
  }

  if (tab === "Orçamento") {
    const usedPct = channel.monthlyBudgetCents
      ? (channel.monthlyCostUsedCents / channel.monthlyBudgetCents) * 100
      : 0;

    return (
      <Card>
        <SectionHeader
          title="Orçamento"
          description="Consumo mensal e política de custo."
          action={<Wallet size={14} className="text-muted-foreground" />}
        />
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="Orçado" value={formatCurrencyCents(channel.monthlyBudgetCents)} />
          <KpiCard
            label="Consumido"
            value={formatCurrencyCents(channel.monthlyCostUsedCents)}
            tone={
              channel.costStatus === "attention"
                ? "attention"
                : channel.costStatus === "exceeded"
                  ? "critical"
                  : undefined
            }
          />
          <KpiCard label="% consumido" value={`${usedPct.toFixed(0)}%`} />
        </div>
        <div className="mt-3">
          <ProgressBar
            value={usedPct}
            tone={usedPct > 90 ? "critical" : usedPct > 70 ? "warning" : "ok"}
          />
        </div>
      </Card>
    );
  }

  if (tab === "Regras editoriais" || tab === "Plataformas" || tab === "Histórico") {
    return (
      <Card>
        <EmptyState
          title={`${tab} — demo`}
          description="Esta área ainda depende de dados locais de demonstração e não possui persistência própria no backend de Canais."
        />
      </Card>
    );
  }

  return (
    <Card>
      <EmptyState
        title={`${tab} — em construção`}
        description="Sem conteúdo aprovado nesta sprint."
      />
    </Card>
  );
}

function Chip({ children, tone }: { children: string; tone?: "info" | "critical" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 h-5 text-[11px]",
        tone === "info" && "bg-info-soft text-info border-transparent",
        tone === "critical" && "bg-critical-soft text-critical border-transparent",
        !tone && "bg-secondary text-secondary-foreground border-border",
      )}
    >
      {children}
    </span>
  );
}

function EmptyChip() {
  return <Chip>—</Chip>;
}

function ReadinessItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center justify-between rounded-sm border border-border bg-surface-muted px-2.5 h-8">
      <span>{label}</span>
      <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-ok" : "bg-warning")} />
    </li>
  );
}

function LoadingCard({ className }: { className?: string }) {
  return (
    <Card className={cn("col-span-12", className)}>
      <LoadingState label="Carregando" />
    </Card>
  );
}

function ChannelSidebar({ channel }: { channel: Channel }) {
  const pubsQ = useQuery({
    queryKey: ["ch-pubs", channel.id],
    queryFn: () => getPublicationJobs(channel.id),
  });
  const prodQ = useQuery({
    queryKey: ["ch-prod", channel.id],
    queryFn: () => getProductionItems({ channelId: channel.id }),
  });
  const pubs = pubsQ.data?.data ?? [];
  const prod = prodQ.data?.data ?? [];

  return (
    <>
      <Card>
        <SectionHeader
          title="Saúde do canal"
          description="Indicadores gerais do canal selecionado."
        />
        <div className="grid grid-cols-2 gap-2">
          <KpiCard label="Workflows" value={formatNumber(channel.activeWorkflowsCount)} />
          <KpiCard
            label="Aprovações"
            value={formatNumber(channel.pendingApprovalsCount)}
            tone={channel.pendingApprovalsCount > 3 ? "attention" : undefined}
          />
          <KpiCard label="Plataformas" value={formatNumber(channel.connectedPlatformsCount)} />
          <KpiCard
            label="Health"
            value={`${channel.healthScore}%`}
            tone={channel.healthScore < 60 ? "warning" : "ok"}
          />
        </div>
      </Card>
      <Card>
        <SectionHeader
          title="Orçamento"
          description="Resumo financeiro do canal."
          action={<CostBadge status={channel.costStatus} />}
        />
        <div className="text-[12px] flex items-center justify-between">
          <span className="text-muted-foreground">
            {formatCurrencyCents(channel.monthlyCostUsedCents)}
          </span>
          <span className="text-muted-foreground">
            / {formatCurrencyCents(channel.monthlyBudgetCents)}
          </span>
        </div>
        <div className="mt-2">
          <ProgressBar
            value={
              channel.monthlyBudgetCents
                ? (channel.monthlyCostUsedCents / channel.monthlyBudgetCents) * 100
                : 0
            }
            tone={
              channel.costStatus === "exceeded"
                ? "critical"
                : channel.costStatus === "attention"
                  ? "warning"
                  : "ok"
            }
          />
        </div>
      </Card>
      <Card>
        <SectionHeader
          title="Plataformas"
          description="Dados de apoio ainda vindos de fixtures locais."
          action={<StatusBadge tone="muted">Demo</StatusBadge>}
        />
        <ul className="space-y-1.5 text-[12px]">
          {pubs.slice(0, 4).map((publication) => (
            <li key={publication.id} className="flex items-center justify-between">
              <span className="truncate">{publication.platform.toUpperCase()}</span>
              <PublicationStatusBadge status={publication.status} />
            </li>
          ))}
          {pubs.length === 0 && <EmptyState title="Sem publicações demo" />}
        </ul>
      </Card>
      <Card>
        <SectionHeader
          title="Produção atual"
          description="Fila editorial real do canal selecionado."
          action={<StatusBadge tone="info">Real</StatusBadge>}
        />
        <ul className="space-y-1.5 text-[12px]">
          {prod.slice(0, 4).map((item) => (
            <li key={item.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{item.title}</span>
                <ContentStatusBadge status={item.status} />
              </div>
              <div className="text-[10.5px] text-muted-foreground mt-0.5">
                {item.currentAgentName ?? "—"} · {formatDateTime(item.lastActivityAt)}
              </div>
            </li>
          ))}
          {prod.length === 0 && <EmptyState title="Sem produção no canal" />}
        </ul>
      </Card>
    </>
  );
}
