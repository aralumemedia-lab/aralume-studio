import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Building2,
  Globe2,
  Mic2,
  Palette,
  Plus,
  Radio,
  Search,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { getChannels, getChannelSettings, getPublicationJobs, getProductionItems } from "@/services/api-client";
import { useChannelContext } from "@/components/aralume/channel-context";
import { Card, EmptyState, KpiCard, SectionHeader } from "@/components/ui/data-card";
import {
  ChannelStatusBadge,
  ContentStatusBadge,
  CostBadge,
  PublicationStatusBadge,
  RiskBadge,
} from "@/components/status/badges";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrencyCents, formatDateTime, formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Channel } from "@/contracts/types";
import { toast } from "sonner";

export const Route = createFileRoute("/channels")({
  head: () => ({
    meta: [
      { title: "Canais — Aralume" },
      { name: "description", content: "Gestão multicanal da operação editorial: perfil, orçamento, plataformas e conformidade." },
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

function ChannelsPage() {
  const channelsQ = useQuery({ queryKey: ["channels"], queryFn: getChannels });
  const channels = channelsQ.data?.data ?? [];
  const { setActiveChannelId } = useChannelContext();
  const [selectedId, setSelectedId] = useState<string | undefined>(channels[0]?.id);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Visão geral");
  const [search, setSearch] = useState("");
  const selected = channels.find((c) => c.id === selectedId) ?? channels[0];

  return (
    <div>
      <PageHeader
        eyebrow="Operação"
        title="Canais"
        description="Cada canal é uma linha editorial autônoma com identidade, orçamento e regras próprias."
        actions={
          <button
            onClick={() => toast("Novo canal — ação mockada")}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95"
          >
            <Plus size={14} /> Novo canal
          </button>
        }
      />
      <div className="grid grid-cols-12 gap-4 p-4">
        {/* Coluna esquerda */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <Card padded={false}>
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar canal..." className="h-8 w-full rounded-sm border border-border bg-surface pl-7 pr-2 text-[12px] outline-none focus:border-ring" />
              </div>
            </div>
            <ul className="divide-y divide-border">
              {channels
                .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()))
                .map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => { setSelectedId(c.id); setActiveChannelId(c.id); }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 hover:bg-accent/40 transition-colors",
                        selected?.id === c.id && "bg-accent/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[12.5px] font-medium truncate">{c.name}</div>
                          <div className="text-[10.5px] text-muted-foreground mt-0.5 truncate">{c.niche}</div>
                        </div>
                        <ChannelStatusBadge status={c.status} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10.5px] text-muted-foreground">
                        <span>{formatCurrencyCents(c.monthlyCostUsedCents)} / {formatCurrencyCents(c.monthlyBudgetCents)}</span>
                        <span>{formatRelative(c.lastActivityAt)}</span>
                      </div>
                      <div className="mt-1"><ProgressBar tone={c.costStatus === "exceeded" ? "critical" : c.costStatus === "attention" ? "warning" : "ok"} value={c.monthlyBudgetCents ? (c.monthlyCostUsedCents / c.monthlyBudgetCents) * 100 : 0} /></div>
                    </button>
                  </li>
                ))}
            </ul>
          </Card>
        </div>

        {/* Coluna central */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          {selected ? (
            <>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Radio size={14} className="text-primary" />
                      <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">Canal</span>
                    </div>
                    <h2 className="text-lg font-semibold tracking-tight">{selected.name}</h2>
                    <p className="text-[12px] text-muted-foreground mt-1 max-w-2xl">{selected.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <ChannelStatusBadge status={selected.status} />
                    <RiskBadge level={selected.riskLevel} />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11.5px]">
                  <MetaRow label="Nicho" value={selected.niche} />
                  <MetaRow label="Público" value={selected.audience} />
                  <MetaRow label="Idioma" value={selected.language} />
                  <MetaRow label="Região" value={selected.region} />
                  <MetaRow label="Timezone" value={selected.timezone} />
                  <MetaRow label="Tom editorial" value={selected.editorialTone} />
                  <MetaRow label="Frequência" value={selected.publishingFrequency} />
                  <MetaRow label="Health score" value={`${selected.healthScore}%`} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <ActionButton onClick={() => toast("Editar canal — mockado")}>Editar</ActionButton>
                  {selected.status === "active" ? (
                    <ActionButton onClick={() => toast("Canal pausado — mockado")} variant="ghost">Pausar</ActionButton>
                  ) : (
                    <ActionButton onClick={() => toast("Canal ativado — mockado")} variant="ghost">Ativar</ActionButton>
                  )}
                  <ActionButton onClick={() => toast("Configurar plataforma — mockado")} variant="ghost">Configurar plataforma</ActionButton>
                  <ActionButton onClick={() => toast("Histórico — mockado")} variant="ghost">Ver histórico</ActionButton>
                </div>
              </Card>

              <div className="flex items-center gap-1 border-b border-border">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "px-3 h-8 text-[12px] border-b-2 -mb-px transition-colors",
                      tab === t ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <ChannelTabContent tab={tab} channel={selected} />
            </>
          ) : (
            <EmptyState title="Selecione um canal" />
          )}
        </div>

        {/* Coluna direita */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          {selected && <ChannelSidebar channel={selected} />}
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

function ActionButton({ children, onClick, variant = "solid" }: { children: React.ReactNode; onClick: () => void; variant?: "solid" | "ghost" }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-7 px-2.5 rounded-sm text-[11.5px] font-medium",
        variant === "solid"
          ? "bg-primary text-primary-foreground hover:opacity-95"
          : "border border-border bg-surface hover:bg-accent/50",
      )}
    >
      {children}
    </button>
  );
}

function ChannelTabContent({ tab, channel }: { tab: string; channel: Channel }) {
  const settingsQ = useQuery({ queryKey: ["cs", channel.id], queryFn: () => getChannelSettings(channel.id) });
  const s = settingsQ.data?.data;

  if (tab === "Visão geral") {
    return (
      <Card>
        <SectionHeader title="Prontidão operacional" description="Diagnóstico rápido para operar em produção supervisionada." />
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px]">
          <ReadinessItem ok={channel.status === "active" || channel.status === "warning"} label="Canal ativado" />
          <ReadinessItem ok={channel.connectedPlatformsCount > 0} label="Plataformas conectadas" />
          <ReadinessItem ok={channel.monthlyBudgetCents > 0} label="Orçamento definido" />
          <ReadinessItem ok={!!s?.narration.voiceName} label="Voz de narração configurada" />
          <ReadinessItem ok={!!s?.visualIdentity.primaryColor} label="Identidade visual definida" />
          <ReadinessItem ok={channel.healthScore >= 60} label="Health score aceitável" />
        </ul>
      </Card>
    );
  }
  if (tab === "Identidade visual" && s) {
    return (
      <Card>
        <SectionHeader title="Identidade visual" description="Padrões visuais aplicados automaticamente pelos agentes." action={<Palette size={14} className="text-muted-foreground" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
          <MetaRow label="Cor primária" value={s.visualIdentity.primaryColor} />
          <MetaRow label="Cor secundária" value={s.visualIdentity.secondaryColor} />
          <MetaRow label="Tipografia" value={s.visualIdentity.typography} />
          <MetaRow label="Estilo de abertura" value={s.visualIdentity.openingStyle} />
          <MetaRow label="Legendas" value={s.visualIdentity.subtitleStyle} />
          <MetaRow label="Thumbnails" value={s.visualIdentity.thumbnailStyle} />
        </div>
      </Card>
    );
  }
  if (tab === "Voz e narração" && s) {
    return (
      <Card>
        <SectionHeader title="Voz e narração" description="Configuração de voz aplicada pelo agente Narração." action={<Mic2 size={14} className="text-muted-foreground" />} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
          <MetaRow label="Voz" value={s.narration.voiceName} />
          <MetaRow label="Provedor" value={s.narration.voiceProvider} />
          <MetaRow label="Velocidade" value={s.narration.speed.toString()} />
          <MetaRow label="Tom" value={s.narration.tone} />
        </div>
        <div className="mt-3 text-[11.5px] text-muted-foreground">
          Notas de pronúncia: {s.narration.pronunciationNotes.join(" · ")}
        </div>
      </Card>
    );
  }
  if (tab === "Perfil editorial" && s) {
    return (
      <Card>
        <SectionHeader title="Perfil editorial" description="Nichos permitidos, temas bloqueados e fontes preferidas." action={<Building2 size={14} className="text-muted-foreground" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground mb-1">Sub-nichos permitidos</div>
            <div className="flex flex-wrap gap-1.5">{s.allowedSubniches.map((x) => <Chip key={x}>{x}</Chip>)}</div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground mb-1">Temas bloqueados</div>
            <div className="flex flex-wrap gap-1.5">{s.blockedThemes.map((x) => <Chip key={x} tone="critical">{x}</Chip>)}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground mb-1">Fontes preferidas</div>
            <div className="flex flex-wrap gap-1.5">{s.preferredSources.map((x) => <Chip key={x} tone="info">{x}</Chip>)}</div>
          </div>
        </div>
      </Card>
    );
  }
  if (tab === "Orçamento") {
    const usedPct = channel.monthlyBudgetCents ? (channel.monthlyCostUsedCents / channel.monthlyBudgetCents) * 100 : 0;
    return (
      <Card>
        <SectionHeader title="Orçamento" description="Consumo mensal e política de custo." action={<Wallet size={14} className="text-muted-foreground" />} />
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="Orçado" value={formatCurrencyCents(channel.monthlyBudgetCents)} />
          <KpiCard label="Consumido" value={formatCurrencyCents(channel.monthlyCostUsedCents)} tone={channel.costStatus === "attention" ? "attention" : channel.costStatus === "exceeded" ? "critical" : undefined} />
          <KpiCard label="% consumido" value={`${usedPct.toFixed(0)}%`} />
        </div>
        <div className="mt-3"><ProgressBar value={usedPct} tone={usedPct > 90 ? "critical" : usedPct > 70 ? "warning" : "ok"} /></div>
      </Card>
    );
  }
  return (
    <Card>
      <EmptyState title={`${tab} — em construção`} description="Este bloco será conectado ao backend real na próxima etapa." />
    </Card>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "info" | "critical" }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-sm border px-1.5 h-5 text-[11px]",
      tone === "info" && "bg-info-soft text-info border-transparent",
      tone === "critical" && "bg-critical-soft text-critical border-transparent",
      !tone && "bg-secondary text-secondary-foreground border-border",
    )}>{children}</span>
  );
}

function ReadinessItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center justify-between rounded-sm border border-border bg-surface-muted px-2.5 h-8">
      <span>{label}</span>
      <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-ok" : "bg-warning")} />
    </li>
  );
}

function ChannelSidebar({ channel }: { channel: Channel }) {
  const pubsQ = useQuery({ queryKey: ["ch-pubs", channel.id], queryFn: () => getPublicationJobs(channel.id) });
  const prodQ = useQuery({ queryKey: ["ch-prod", channel.id], queryFn: () => getProductionItems(channel.id) });
  const pubs = pubsQ.data?.data ?? [];
  const prod = prodQ.data?.data ?? [];
  return (
    <>
      <Card>
        <SectionHeader title="Saúde do canal" />
        <div className="grid grid-cols-2 gap-2">
          <KpiCard label="Workflows" value={formatNumber(channel.activeWorkflowsCount)} />
          <KpiCard label="Aprovações" value={formatNumber(channel.pendingApprovalsCount)} tone={channel.pendingApprovalsCount > 3 ? "attention" : undefined} />
          <KpiCard label="Plataformas" value={formatNumber(channel.connectedPlatformsCount)} />
          <KpiCard label="Health" value={`${channel.healthScore}%`} tone={channel.healthScore < 60 ? "warning" : "ok"} />
        </div>
      </Card>
      <Card>
        <SectionHeader title="Orçamento" action={<CostBadge status={channel.costStatus} />} />
        <div className="text-[12px] flex items-center justify-between">
          <span className="text-muted-foreground">{formatCurrencyCents(channel.monthlyCostUsedCents)}</span>
          <span className="text-muted-foreground">/ {formatCurrencyCents(channel.monthlyBudgetCents)}</span>
        </div>
        <div className="mt-2"><ProgressBar value={channel.monthlyBudgetCents ? (channel.monthlyCostUsedCents / channel.monthlyBudgetCents) * 100 : 0} tone={channel.costStatus === "exceeded" ? "critical" : channel.costStatus === "attention" ? "warning" : "ok"} /></div>
      </Card>
      <Card>
        <SectionHeader title="Plataformas" action={<Globe2 size={14} className="text-muted-foreground" />} />
        <ul className="space-y-1.5 text-[12px]">
          {pubs.slice(0, 4).map((p) => (
            <li key={p.id} className="flex items-center justify-between">
              <span className="truncate">{p.platform.toUpperCase()}</span>
              <PublicationStatusBadge status={p.status} />
            </li>
          ))}
          {pubs.length === 0 && <EmptyState title="Sem publicações" />}
        </ul>
      </Card>
      <Card>
        <SectionHeader title="Produção atual" />
        <ul className="space-y-1.5 text-[12px]">
          {prod.slice(0, 4).map((p) => (
            <li key={p.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{p.title}</span>
                <ContentStatusBadge status={p.status} />
              </div>
              <div className="text-[10.5px] text-muted-foreground mt-0.5">{p.currentAgentName ?? "—"} · {formatDateTime(p.lastActivityAt)}</div>
            </li>
          ))}
          {prod.length === 0 && <EmptyState title="Sem produção ativa" />}
        </ul>
      </Card>
    </>
  );
}
