import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, RefreshCw, Save, Search, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import { ChannelStatusBadge, RiskBadge, StatusBadge } from "@/components/status/badges";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
} from "@/components/ui/data-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatRelative, formatDateTime } from "@/lib/format";
import type { ChannelEditorialProfile } from "@/contracts/types";
import {
  describeChannelsApiError,
  getAuditLogs,
  getChannelProfile,
  updateChannelProfile,
} from "@/services/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/channels")({
  head: () => ({
    meta: [
      { title: "Canais - Aralume" },
      {
        name: "description",
        content: "Gestao multicanal da operacao editorial com perfil, pauta e auditoria reais.",
      },
    ],
  }),
  component: ChannelsPage,
});

type ProfileFormState = {
  editorialTone: string;
  language: string;
  audience: string;
  allowedFormats: string;
  factualContentRequiresSources: boolean;
  minimumSources: string;
  allowFictionalNarratives: boolean;
  allowThirdPartyAssets: boolean;
  requiresHumanApprovalBeforePublication: boolean;
  highRiskAutoBlock: boolean;
  prohibitedClaims: string;
  complianceNotes: string;
};

const emptyProfileForm = (): ProfileFormState => ({
  editorialTone: "",
  language: "",
  audience: "",
  allowedFormats: "",
  factualContentRequiresSources: true,
  minimumSources: "3",
  allowFictionalNarratives: false,
  allowThirdPartyAssets: true,
  requiresHumanApprovalBeforePublication: true,
  highRiskAutoBlock: true,
  prohibitedClaims: "",
  complianceNotes: "",
});

export function ChannelsPage() {
  const queryClient = useQueryClient();
  const {
    channels,
    activeChannel,
    setActiveChannelId,
    loading: channelsLoading,
    error: channelsError,
    refreshChannels,
  } = useChannelContext();
  const [search, setSearch] = useState("");
  const [formState, setFormState] = useState<ProfileFormState>(emptyProfileForm());

  const visibleChannels = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return channels;
    }

    return channels.filter((channel) =>
      [channel.name, channel.slug, channel.niche, channel.description, channel.audience]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [channels, search]);

  const profileQuery = useQuery({
    queryKey: ["channel-profile", activeChannel?.id],
    enabled: Boolean(activeChannel?.id),
    queryFn: () => getChannelProfile(activeChannel?.id as string),
  });

  useEffect(() => {
    if (!profileQuery.data?.data) {
      setFormState(emptyProfileForm());
      return;
    }

    setFormState(profileProfileToForm(profileQuery.data.data));
  }, [profileQuery.data]);

  const auditQuery = useQuery({
    queryKey: ["channel-audit", activeChannel?.id],
    enabled: Boolean(activeChannel?.id),
    queryFn: () => getAuditLogs(activeChannel?.id),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeChannel?.id) {
        throw new Error("Nenhum canal ativo selecionado.");
      }

      return updateChannelProfile(activeChannel.id, formToProfileUpdate(formState));
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["channels"] }),
        queryClient.invalidateQueries({ queryKey: ["channel-profile", activeChannel?.id] }),
        queryClient.invalidateQueries({ queryKey: ["channel-audit", activeChannel?.id] }),
      ]);
      toast.success("Perfil editorial atualizado com sucesso.");
    },
    onError: (error) => {
      toast.error(describeChannelsApiError(error, "profile"));
    },
  });

  const showChannelsLoading = channelsLoading && channels.length === 0;
  const showChannelsError = !!channelsError && channels.length === 0;
  const showChannelsEmpty = !channelsLoading && !channelsError && channels.length === 0;
  const profile = profileQuery.data?.data;
  const auditLogs = auditQuery.data?.data ?? [];

  if (showChannelsLoading) {
    return (
      <div>
        <PageHeader
          eyebrow="Operacao"
          title="Canais"
          description="Cada canal e uma linha editorial autonoma com identidade, orcamento e regras proprias."
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
          eyebrow="Operacao"
          title="Canais"
          description="Cada canal e uma linha editorial autonoma com identidade, orcamento e regras proprias."
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
        eyebrow="Operacao"
        title="Canais"
        description="Perfil editorial real, auditable e scoped por canal ativo."
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
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar canal..."
                  className="h-8 pl-7"
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
                      <span>{channel.language || "Idioma nao definido"}</span>
                      <span>{formatRelative(channel.lastActivityAt)}</span>
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
                      <Building2 size={14} className="text-primary" />
                      <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                        Perfil editorial
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold tracking-tight">{activeChannel.name}</h2>
                    <p className="text-[12px] text-muted-foreground mt-1 max-w-2xl">
                      {activeChannel.description || "Canal sem descricao cadastrada."}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <ChannelStatusBadge status={activeChannel.status} />
                    <RiskBadge level={activeChannel.riskLevel} />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11.5px]">
                  <MetaRow label="Nicho" value={activeChannel.niche || "â€”"} />
                  <MetaRow label="Publico" value={activeChannel.audience || "â€”"} />
                  <MetaRow label="Idioma" value={activeChannel.language || "â€”"} />
                  <MetaRow label="Tom" value={activeChannel.editorialTone || "â€”"} />
                </div>
              </Card>

              {profileQuery.isPending && !profile ? (
                <Card>
                  <LoadingState label="Carregando perfil editorial" />
                </Card>
              ) : profileQuery.error ? (
                <Card>
                  <ErrorState message={describeChannelsApiError(profileQuery.error, "profile")} />
                  <button
                    onClick={() => void profileQuery.refetch()}
                    className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                  >
                    <RefreshCw size={14} /> Recarregar perfil
                  </button>
                </Card>
              ) : profile ? (
                <Card>
                  <SectionHeader
                    eyebrow="Edicao"
                    title="Atualizar perfil editorial"
                    description="Tom, idioma, formato, publico e regras editoriais sao salvos na API real."
                    action={
                      <StatusBadge tone="info" dot>
                        Reloadable
                      </StatusBadge>
                    }
                  />

                  <form
                    className="space-y-4"
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault();
                      void saveMutation.mutateAsync();
                    }}
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Tom editorial">
                        <Input
                          value={formState.editorialTone}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              editorialTone: event.target.value,
                            }))
                          }
                          placeholder="Serio, provocativo, didatico..."
                        />
                      </Field>
                      <Field label="Idioma">
                        <Input
                          value={formState.language}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              language: event.target.value,
                            }))
                          }
                          placeholder="pt-BR"
                        />
                      </Field>
                      <Field label="Publico">
                        <Input
                          value={formState.audience}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              audience: event.target.value,
                            }))
                          }
                          placeholder="Adultos 25-55..."
                        />
                      </Field>
                      <Field label="Formato(s)">
                        <Input
                          value={formState.allowedFormats}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              allowedFormats: event.target.value,
                            }))
                          }
                          placeholder="horizontal, vertical"
                        />
                      </Field>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <ToggleField
                        label="Conteudo factual exige fontes"
                        checked={formState.factualContentRequiresSources}
                        onChange={(checked) =>
                          setFormState((current) => ({
                            ...current,
                            factualContentRequiresSources: checked,
                          }))
                        }
                      />
                      <Field label="Minimo de fontes">
                        <Input
                          type="number"
                          min={0}
                          max={20}
                          value={formState.minimumSources}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              minimumSources: event.target.value,
                            }))
                          }
                        />
                      </Field>
                      <ToggleField
                        label="Permite narrativas ficticias"
                        checked={formState.allowFictionalNarratives}
                        onChange={(checked) =>
                          setFormState((current) => ({
                            ...current,
                            allowFictionalNarratives: checked,
                          }))
                        }
                      />
                      <ToggleField
                        label="Permite ativos de terceiros"
                        checked={formState.allowThirdPartyAssets}
                        onChange={(checked) =>
                          setFormState((current) => ({
                            ...current,
                            allowThirdPartyAssets: checked,
                          }))
                        }
                      />
                      <ToggleField
                        label="Exige aprovacao humana"
                        checked={formState.requiresHumanApprovalBeforePublication}
                        onChange={(checked) =>
                          setFormState((current) => ({
                            ...current,
                            requiresHumanApprovalBeforePublication: checked,
                          }))
                        }
                      />
                      <ToggleField
                        label="Bloqueio automatico de risco alto"
                        checked={formState.highRiskAutoBlock}
                        onChange={(checked) =>
                          setFormState((current) => ({
                            ...current,
                            highRiskAutoBlock: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Claims proibidos">
                        <Textarea
                          value={formState.prohibitedClaims}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              prohibitedClaims: event.target.value,
                            }))
                          }
                          placeholder="Uma claim por linha ou separado por virgula"
                          rows={4}
                        />
                      </Field>
                      <Field label="Notas de compliance">
                        <Textarea
                          value={formState.complianceNotes}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              complianceNotes: event.target.value,
                            }))
                          }
                          placeholder="Notas internas para o time editorial"
                          rows={4}
                        />
                      </Field>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="submit"
                        disabled={saveMutation.isPending}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95 disabled:opacity-70"
                      >
                        <Save size={14} />
                        {saveMutation.isPending ? "Salvando..." : "Salvar perfil"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormState(profileProfileToForm(profileQuery.data?.data ?? profile))
                        }
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                      >
                        Reverter
                      </button>
                    </div>
                  </form>
                </Card>
              ) : (
                <Card>
                  <EmptyState
                    title="Perfil editorial indisponivel"
                    description="Selecione outro canal ou tente recarregar o perfil."
                  />
                </Card>
              )}
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
                  description="Use a lista lateral ou o seletor global para trabalhar com um canal especifico."
                />
              )}
            </Card>
          )}
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-3">
          {activeChannel ? (
            <Card>
              <SectionHeader
                eyebrow="Auditoria"
                title="Ultimas mutacoes"
                description="Os eventos visiveis abaixo pertencem ao canal ativo."
                action={<ShieldCheck size={14} className="text-muted-foreground" />}
              />
              {auditQuery.isPending ? (
                <LoadingState label="Carregando auditoria" />
              ) : auditQuery.error ? (
                <ErrorState message="Nao foi possivel carregar a auditoria do canal." />
              ) : auditLogs.length === 0 ? (
                <EmptyState
                  title="Sem eventos recentes"
                  description="As mutacoes desta tela aparecerao aqui apos salvar o perfil."
                />
              ) : (
                <ul className="space-y-2">
                  {auditLogs.slice(0, 5).map((log) => (
                    <li
                      key={log.id}
                      className="rounded-md border border-border bg-surface-muted p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11.5px] font-medium truncate">{log.action}</div>
                          <div className="text-[10.5px] text-muted-foreground truncate">
                            {log.entityType} Â· {log.entityId}
                          </div>
                        </div>
                        <StatusBadge tone={log.status === "failed" ? "critical" : "ok"} dot>
                          {log.status}
                        </StatusBadge>
                      </div>
                      <div className="mt-1 text-[10.5px] text-muted-foreground">
                        {log.actorName}
                        {log.requestId ? ` Â· ${log.requestId}` : ""}
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function profileProfileToForm(profile: ChannelEditorialProfile): ProfileFormState {
  return {
    editorialTone: profile.channel.editorialTone ?? "",
    language: profile.channel.language ?? "",
    audience: profile.channel.audience ?? "",
    allowedFormats: profile.settings.allowedFormats.join(", "),
    factualContentRequiresSources: profile.editorialRules.factualContentRequiresSources,
    minimumSources: String(profile.editorialRules.minimumSources),
    allowFictionalNarratives: profile.editorialRules.allowFictionalNarratives,
    allowThirdPartyAssets: profile.editorialRules.allowThirdPartyAssets,
    requiresHumanApprovalBeforePublication:
      profile.editorialRules.requiresHumanApprovalBeforePublication,
    highRiskAutoBlock: profile.editorialRules.highRiskAutoBlock,
    prohibitedClaims: profile.editorialRules.prohibitedClaims.join("\n"),
    complianceNotes: profile.editorialRules.complianceNotes.join("\n"),
  };
}

function formToProfileUpdate(form: ProfileFormState) {
  return {
    editorialTone: form.editorialTone.trim(),
    language: form.language.trim(),
    audience: form.audience.trim(),
    allowedFormats: splitList(form.allowedFormats),
    editorialRules: {
      factualContentRequiresSources: form.factualContentRequiresSources,
      minimumSources: Number.parseInt(form.minimumSources, 10) || 0,
      allowFictionalNarratives: form.allowFictionalNarratives,
      allowThirdPartyAssets: form.allowThirdPartyAssets,
      requiresHumanApprovalBeforePublication: form.requiresHumanApprovalBeforePublication,
      highRiskAutoBlock: form.highRiskAutoBlock,
      prohibitedClaims: splitList(form.prohibitedClaims),
      complianceNotes: splitList(form.complianceNotes),
    },
  };
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
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

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-3 py-2">
      <span className="text-[12px] text-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-primary"
      />
    </label>
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

function LoadingCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <LoadingState label="Carregando" />
    </Card>
  );
}
