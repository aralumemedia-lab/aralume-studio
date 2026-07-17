import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Layers3, RefreshCw, Save, Search, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { useChannelContext } from "@/components/aralume/channel-context-state";
import {
  MediaAssetLicenseBadge,
  MediaAssetOriginBadge,
  MediaAssetStatusBadge,
  RiskBadge,
  StatusBadge,
} from "@/components/status/badges";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
} from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatBytes,
  formatChecksum,
  formatCurrencyCents,
  formatDateTime,
  formatRelative,
} from "@/lib/format";
import type {
  MediaAssetBase,
  MediaAssetLicenseStatus,
  MediaAssetOrigin,
  MediaAssetStatus,
  MediaAssetType,
} from "@/contracts/types";
import {
  createMediaAsset,
  describeMediaAssetsApiError,
  getMediaAsset,
  getMediaAssetUsages,
  getMediaAssets,
  updateMediaAsset,
} from "@/services/api-client";

type Filters = {
  search: string;
  type: string;
  status: string;
  riskLevel: string;
  origin: string;
};

type AssetDraft = {
  type: MediaAssetType;
  name: string;
  title: string;
  description: string;
  storagePath: string;
  provenance: string;
  origin: MediaAssetOrigin;
  licenseStatus: MediaAssetLicenseStatus;
  licenseName: string;
  mimeType: string;
  extension: string;
  sizeBytes: string;
  checksum: string;
  providerName: string;
  modelName: string;
  prompt: string;
  usageSummary: string;
  costActualCents: string;
  riskLevel: MediaAssetBase["riskLevel"];
  status: MediaAssetStatus;
};

const emptyFilters: Filters = {
  search: "",
  type: "",
  status: "",
  riskLevel: "",
  origin: "",
};

const supportedTypes: MediaAssetType[] = [
  "narration",
  "image",
  "video",
  "thumbnail",
  "brand_asset",
  "intermediate_video",
];

export const Route = createFileRoute("/media-assets")({
  head: () => ({
    meta: [
      { title: "Ativos de Midia - Aralume" },
      { name: "description", content: "Registry operacional de ativos de midia por canal." },
    ],
  }),
  component: function MediaAssetsPage() {
    const { activeChannelId, activeChannel } = useChannelContext();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<Filters>(emptyFilters);
    const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>(undefined);
    const [draft, setDraft] = useState<AssetDraft>(() => buildDefaultDraft("narration"));

    const listQuery = useQuery({
      queryKey: ["media-assets", activeChannelId],
      enabled: Boolean(activeChannelId),
      queryFn: () =>
        getMediaAssets({
          channelId: activeChannelId as string,
        }),
    });

    const rows = useMemo(() => listQuery.data?.data ?? [], [listQuery.data]);

    const filteredRows = useMemo(() => {
      const search = filters.search.trim().toLowerCase();
      return rows.filter((row) => {
        if (filters.type && row.type !== filters.type) return false;
        if (filters.status && row.status !== filters.status) return false;
        if (filters.riskLevel && row.riskLevel !== filters.riskLevel) return false;
        if (filters.origin && row.origin !== filters.origin) return false;
        if (!search) return true;

        return [
          row.name,
          row.title,
          row.description,
          row.providerName,
          row.modelName,
          row.prompt,
          row.storagePath,
          row.internalUri,
          row.usageSummary,
          row.contentId,
          row.workflowRunId,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      });
    }, [filters.origin, filters.riskLevel, filters.search, filters.status, filters.type, rows]);

    const selectedAsset = useMemo(
      () => filteredRows.find((asset) => asset.id === selectedAssetId),
      [filteredRows, selectedAssetId],
    );
    const detailAsset = useMemo(
      () => selectedAsset ?? filteredRows[0],
      [filteredRows, selectedAsset],
    );

    const detailQuery = useQuery({
      queryKey: ["media-assets", activeChannelId, detailAsset?.id],
      enabled: Boolean(activeChannelId && detailAsset?.id),
      queryFn: () => getMediaAsset(activeChannelId as string, detailAsset?.id as string),
    });

    const usagesQuery = useQuery({
      queryKey: ["media-assets-usages", activeChannelId, detailAsset?.id],
      enabled: Boolean(activeChannelId && detailAsset?.id),
      queryFn: () => getMediaAssetUsages(activeChannelId as string, detailAsset?.id as string),
    });

    const selectedDetail = detailQuery.data?.data ?? detailAsset;
    const usageRows = usagesQuery.data?.data ?? [];
    const counts = useMemo(() => countStatuses(filteredRows), [filteredRows]);

    const saveMutation = useMutation({
      mutationFn: async () => {
        if (!activeChannelId) {
          throw new Error("Nenhum canal ativo selecionado.");
        }

        const payload = buildPayload(draft, activeChannelId);
        if (selectedAsset?.id) {
          return updateMediaAsset(activeChannelId, selectedAsset.id, omitChannelId(payload));
        }

        return createMediaAsset(payload);
      },
      onSuccess: async (response) => {
        setSelectedAssetId(response.data.id);
        setDraft(assetToDraft(response.data));
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["media-assets", activeChannelId] }),
          queryClient.invalidateQueries({
            queryKey: ["media-assets", activeChannelId, response.data.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["media-assets-usages", activeChannelId, response.data.id],
          }),
        ]);
      },
    });

    useEffect(() => {
      if (!activeChannelId) {
        return;
      }

      setSelectedAssetId(undefined);
      setDraft(buildDefaultDraft("narration", activeChannelId));
    }, [activeChannelId]);

    useEffect(() => {
      if (!selectedAsset) {
        return;
      }

      setDraft(assetToDraft(selectedAsset));
    }, [selectedAsset]);

    const columns: Column<MediaAssetBase>[] = [
      {
        key: "asset",
        header: "Ativo",
        render: (row) => (
          <button
            type="button"
            data-testid={`media-assets-select-${row.id}`}
            onClick={() => setSelectedAssetId(row.id)}
            className="flex min-w-0 flex-col text-left"
          >
            <span className="truncate font-medium text-foreground">{row.name ?? row.title}</span>
            <span className="truncate text-[11px] text-muted-foreground">
              {row.description ?? row.title}
            </span>
          </button>
        ),
      },
      {
        key: "type",
        header: "Tipo",
        render: (row) => <span className="text-muted-foreground">{row.type}</span>,
      },
      {
        key: "origin",
        header: "Origem",
        render: (row) => <MediaAssetOriginBadge origin={row.origin} />,
      },
      {
        key: "license",
        header: "Licenca",
        render: (row) => <MediaAssetLicenseBadge status={row.licenseStatus} />,
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <MediaAssetStatusBadge status={row.status as MediaAssetStatus} />,
      },
      {
        key: "risk",
        header: "Risco",
        render: (row) => <RiskBadge level={row.riskLevel} />,
      },
      {
        key: "size",
        header: "Tamanho",
        render: (row) => (
          <span className="tabular-nums text-muted-foreground">
            {formatBytes(row.sizeBytes ?? 0)}
          </span>
        ),
      },
      {
        key: "checksum",
        header: "Checksum",
        render: (row) => (
          <span className="font-mono text-[11px] text-muted-foreground">
            {formatChecksum(row.checksum)}
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

    if (!activeChannelId) {
      return (
        <div>
          <PageHeader
            eyebrow="Editorial"
            title="Ativos de Midia"
            description="Selecione um canal para consultar o registry operacional de midia."
          />
          <div className="p-4">
            <EmptyState
              title="Nenhum canal ativo"
              description="O registry de midia exige contexto explicito de canal para listar ou vincular ativos."
              icon={<ShieldAlert size={18} />}
            />
          </div>
        </div>
      );
    }

    const showListLoading = listQuery.isLoading && rows.length === 0;
    const showListError = listQuery.isError && rows.length === 0;
    const showListEmpty = !listQuery.isLoading && !listQuery.isError && filteredRows.length === 0;

    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Editorial"
          title="Ativos de Midia"
          description="Registry operacional para narracao e ativos visuais com persistencia, auditoria e isolamento por canal."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/ideas"
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
              >
                Ir para pautas <ArrowRight size={14} />
              </Link>
              <Link
                to="/research"
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
              >
                Ir para pesquisa <ArrowRight size={14} />
              </Link>
              <button
                type="button"
                onClick={() => void listQuery.refetch()}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95"
              >
                <RefreshCw size={14} /> Recarregar
              </button>
            </div>
          }
        />

        <div className="px-4 pb-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
            <div className="space-y-4">
              <Card>
                <SectionHeader
                  eyebrow="Canal"
                  title={activeChannel?.name ?? activeChannelId}
                  description="Os filtros e mutacoes permanecem canal-scoped."
                  action={
                    <StatusBadge tone="info" dot>
                      {filteredRows.length} itens
                    </StatusBadge>
                  }
                />

                <div
                  data-testid="media-assets-channel-summary"
                  className="mb-3 rounded-md border border-border bg-surface-muted/35 px-3 py-2 text-[12px] text-muted-foreground"
                >
                  <span className="font-medium text-foreground">Contexto ativo:</span>{" "}
                  {activeChannel?.name ?? activeChannelId} · persistencia process-local via backend
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <FilterField
                    label="Busca"
                    icon={<Search size={14} />}
                    value={filters.search}
                    onChange={(value) => setFilters((current) => ({ ...current, search: value }))}
                    placeholder="nome, URI, checksum..."
                  />
                  <SelectField
                    label="Tipo"
                    value={filters.type}
                    onChange={(value) => setFilters((current) => ({ ...current, type: value }))}
                    options={supportedTypes}
                  />
                  <SelectField
                    label="Status"
                    value={filters.status}
                    onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
                    options={[
                      "available",
                      "processing",
                      "failed",
                      "pending",
                      "blocked",
                      "invalid",
                      "corrupted",
                      "missing",
                      "replaced",
                      "archived",
                    ]}
                  />
                  <SelectField
                    label="Risco"
                    value={filters.riskLevel}
                    onChange={(value) =>
                      setFilters((current) => ({ ...current, riskLevel: value }))
                    }
                    options={["ok", "attention", "warning", "critical", "blocked"]}
                  />
                  <SelectField
                    label="Origem"
                    value={filters.origin}
                    onChange={(value) => setFilters((current) => ({ ...current, origin: value }))}
                    options={[
                      "internal",
                      "generated",
                      "uploaded",
                      "licensed",
                      "channel_provided",
                      "public_domain",
                      "external_authorized",
                      "unknown",
                      "prohibited",
                      "demo",
                    ]}
                  />
                </div>
              </Card>

              <Card>
                <SectionHeader
                  eyebrow={selectedAsset ? "Editar" : "Criar"}
                  title={selectedAsset ? (selectedAsset.title ?? selectedAsset.name) : "Novo ativo"}
                  description="Use a mesma superficie para narracao ou ativo visual. O registro real persiste no backend e volta apos reload."
                  action={
                    <div className="flex items-center gap-2">
                      <StatusBadge tone="info">{draft.type}</StatusBadge>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssetId(undefined);
                          setDraft(buildDefaultDraft(draft.type, activeChannelId));
                        }}
                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                      >
                        Novo ativo
                      </button>
                    </div>
                  }
                />

                <form
                  data-testid="media-assets-form"
                  className="space-y-4"
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    saveMutation.mutate();
                  }}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Tipo">
                      <select
                        value={draft.type}
                        onChange={(event) =>
                          setDraft((current) => {
                            const nextType = event.target.value as MediaAssetType;
                            return {
                              ...current,
                              type: nextType,
                              ...typeDefaults(nextType, activeChannelId),
                            };
                          })
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                      >
                        {supportedTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Nome">
                      <Input
                        value={draft.name}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, name: event.target.value }))
                        }
                        placeholder="Nome operacional"
                      />
                    </Field>
                    <Field label="Titulo">
                      <Input
                        value={draft.title}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, title: event.target.value }))
                        }
                        placeholder="Titulo exibido"
                      />
                    </Field>
                    <Field label="Descricao">
                      <Textarea
                        value={draft.description}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, description: event.target.value }))
                        }
                        rows={3}
                        placeholder="Descricao operacional"
                      />
                    </Field>
                    <Field label="Proveniencia">
                      <Textarea
                        value={draft.provenance}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, provenance: event.target.value }))
                        }
                        rows={3}
                        placeholder="Origem, contexto e rastreabilidade"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Storage path">
                      <Input
                        value={draft.storagePath}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, storagePath: event.target.value }))
                        }
                        placeholder={`${activeChannelId}/...`}
                        className="font-mono text-[11px]"
                      />
                    </Field>
                    <Field label="Mime type">
                      <Input
                        value={draft.mimeType}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, mimeType: event.target.value }))
                        }
                        placeholder="audio/wav"
                      />
                    </Field>
                    <Field label="Extensao">
                      <Input
                        value={draft.extension}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, extension: event.target.value }))
                        }
                        placeholder="wav"
                      />
                    </Field>
                    <Field label="Tamanho (bytes)">
                      <Input
                        type="number"
                        min={0}
                        value={draft.sizeBytes}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, sizeBytes: event.target.value }))
                        }
                        placeholder="1024"
                      />
                    </Field>
                    <Field label="Checksum">
                      <Input
                        value={draft.checksum}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, checksum: event.target.value }))
                        }
                        placeholder="64 hex chars"
                        className="font-mono text-[11px]"
                      />
                    </Field>
                    <Field label="Custo">
                      <Input
                        type="number"
                        min={0}
                        value={draft.costActualCents}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            costActualCents: event.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Origem">
                      <select
                        value={draft.origin}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            origin: event.target.value as MediaAssetOrigin,
                          }))
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                      >
                        {[
                          "generated",
                          "internal",
                          "uploaded",
                          "licensed",
                          "channel_provided",
                          "public_domain",
                          "external_authorized",
                          "unknown",
                          "prohibited",
                        ].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Licenca">
                      <select
                        value={draft.licenseStatus}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            licenseStatus: event.target.value as MediaAssetLicenseStatus,
                          }))
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                      >
                        {[
                          "confirmed",
                          "known",
                          "verified",
                          "not_applicable",
                          "pending",
                          "unknown",
                          "unconfirmed",
                          "restricted",
                          "attribution_required",
                          "blocked",
                        ].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Nome da licenca">
                      <Input
                        value={draft.licenseName}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, licenseName: event.target.value }))
                        }
                        placeholder="Opcional"
                      />
                    </Field>
                    <Field label="Risco">
                      <select
                        value={draft.riskLevel}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            riskLevel: event.target.value as MediaAssetBase["riskLevel"],
                          }))
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                      >
                        {["ok", "attention", "warning", "critical", "blocked"].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Status">
                      <select
                        value={draft.status}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            status: event.target.value as MediaAssetStatus,
                          }))
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                      >
                        {[
                          "available",
                          "processing",
                          "failed",
                          "pending",
                          "blocked",
                          "invalid",
                          "corrupted",
                          "missing",
                          "replaced",
                          "archived",
                        ].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Fornecedor">
                      <Input
                        value={draft.providerName}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, providerName: event.target.value }))
                        }
                        placeholder="Opcional"
                      />
                    </Field>
                    <Field label="Modelo">
                      <Input
                        value={draft.modelName}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, modelName: event.target.value }))
                        }
                        placeholder="Opcional"
                      />
                    </Field>
                    <Field label="Prompt / direcao">
                      <Textarea
                        value={draft.prompt}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, prompt: event.target.value }))
                        }
                        rows={3}
                        placeholder="Opcional"
                      />
                    </Field>
                    <Field label="Resumo de uso">
                      <Textarea
                        value={draft.usageSummary}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, usageSummary: event.target.value }))
                        }
                        rows={3}
                        placeholder="Opcional"
                      />
                    </Field>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      tone={
                        saveMutation.isPending
                          ? "info"
                          : saveMutation.isSuccess
                            ? "ok"
                            : saveMutation.isError
                              ? "critical"
                              : "muted"
                      }
                      dot
                      data-testid="media-assets-save-state"
                    >
                      {saveMutation.isPending
                        ? "Salvando"
                        : saveMutation.isSuccess
                          ? "Salvo"
                          : saveMutation.isError
                            ? "Falha"
                            : "Pronto"}
                    </StatusBadge>
                    <button
                      type="submit"
                      data-testid="media-assets-submit"
                      disabled={saveMutation.isPending}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95 disabled:opacity-70"
                    >
                      <Save size={14} />
                      {saveMutation.isPending
                        ? selectedAsset
                          ? "Salvando..."
                          : "Criando..."
                        : selectedAsset
                          ? "Atualizar ativo"
                          : "Criar ativo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssetId(undefined);
                        setDraft(buildDefaultDraft(draft.type, activeChannelId));
                      }}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border bg-surface text-[12px] font-medium hover:bg-accent/50"
                    >
                      Novo ativo
                    </button>
                  </div>

                  <div className="rounded-md border border-border bg-surface-muted/35 px-3 py-2 text-[12px] text-muted-foreground">
                    <div className="font-medium text-foreground">
                      {selectedAsset ? "Editando ativo existente" : "Criando novo ativo"}
                    </div>
                    <div className="mt-1">
                      O backend valida storage, provenance, channelId, integridade e auditoria.
                    </div>
                  </div>

                  {saveMutation.error ? (
                    <ErrorState message={describeMediaAssetsApiError(saveMutation.error)} />
                  ) : null}
                </form>
              </Card>

              <div className="grid gap-3 md:grid-cols-4">
                <SummaryCard label="Disponiveis" value={counts.available} tone="ok" />
                <SummaryCard
                  label="Pendentes/Bloqueados"
                  value={counts.blockedLike}
                  tone="critical"
                />
                <SummaryCard label="Risco alto" value={counts.highRisk} tone="warning" />
                <SummaryCard
                  label="Licenca pendente"
                  value={counts.pendingLicense}
                  tone="attention"
                />
              </div>

              <Card padded={false}>
                {showListLoading ? (
                  <LoadingState label="Carregando ativos de midia" />
                ) : showListError ? (
                  <ErrorState message={describeMediaAssetsApiError(listQuery.error)} />
                ) : showListEmpty ? (
                  <EmptyState
                    title="Nenhum ativo encontrado"
                    description="Ajuste os filtros ou verifique se o canal possui ativos registrados."
                    icon={<Layers3 size={18} />}
                  />
                ) : (
                  <CompactTable
                    rows={filteredRows}
                    columns={columns}
                    onRowClick={(row) => setSelectedAssetId(row.id)}
                    empty="Sem ativos para exibir."
                    className="border-0 rounded-none"
                  />
                )}
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <SectionHeader
                  eyebrow="Detalhes"
                  title={
                    selectedDetail?.name ?? selectedDetail?.title ?? "Nenhum ativo selecionado"
                  }
                  description="Resumo do asset, integridade e proveniencia."
                />

                {!selectedDetail ? (
                  <EmptyState
                    title="Selecione um ativo"
                    description="Clique em uma linha da tabela para ver os detalhes completos."
                  />
                ) : detailQuery.isLoading ? (
                  <LoadingState label="Carregando detalhes" />
                ) : detailQuery.isError ? (
                  <ErrorState message={describeMediaAssetsApiError(detailQuery.error)} />
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <MediaAssetStatusBadge status={selectedDetail.status as MediaAssetStatus} />
                      <MediaAssetOriginBadge origin={selectedDetail.origin} />
                      <MediaAssetLicenseBadge status={selectedDetail.licenseStatus} />
                      <RiskBadge level={selectedDetail.riskLevel} />
                    </div>

                    <dl className="grid gap-3 text-[12px]">
                      <DetailRow
                        label="URI interna"
                        value={selectedDetail.internalUri ?? "—"}
                        mono
                      />
                      <DetailRow
                        label="Path relativo"
                        value={selectedDetail.storagePath ?? "—"}
                        mono
                      />
                      <DetailRow label="Mime type" value={selectedDetail.mimeType ?? "—"} />
                      <DetailRow
                        label="Tamanho"
                        value={formatBytes(selectedDetail.sizeBytes ?? 0)}
                      />
                      <DetailRow
                        label="Checksum"
                        value={formatChecksum(selectedDetail.checksum)}
                        mono
                      />
                      <DetailRow label="Proveniencia" value={selectedDetail.provenance ?? "—"} />
                      <DetailRow label="Fornecedor" value={selectedDetail.providerName ?? "—"} />
                      <DetailRow label="Modelo" value={selectedDetail.modelName ?? "—"} />
                      <DetailRow label="Prompt" value={selectedDetail.prompt ?? "—"} />
                      <DetailRow
                        label="Custo"
                        value={formatCurrencyCents(selectedDetail.costActualCents)}
                      />
                      <DetailRow label="Conteudo" value={selectedDetail.contentId ?? "—"} mono />
                      <DetailRow
                        label="Workflow"
                        value={selectedDetail.workflowRunId ?? "—"}
                        mono
                      />
                      <DetailRow
                        label="Criado em"
                        value={formatDateTime(selectedDetail.createdAt)}
                      />
                      <DetailRow
                        label="Atualizado em"
                        value={formatDateTime(selectedDetail.updatedAt)}
                      />
                    </dl>

                    {selectedDetail.integrity ? (
                      <Card className="bg-surface-muted/50">
                        <SectionHeader eyebrow="Integridade" title="Checksum e tamanho" />
                        <dl className="grid gap-2 text-[12px]">
                          <DetailRow
                            label="Checksum ok"
                            value={
                              selectedDetail.integrity.checksumMatches === false ? "nao" : "sim"
                            }
                          />
                          <DetailRow
                            label="Tamanho ok"
                            value={selectedDetail.integrity.sizeMatches === false ? "nao" : "sim"}
                          />
                          <DetailRow
                            label="Ultima validacao"
                            value={
                              selectedDetail.integrity.lastValidatedAt
                                ? formatRelative(selectedDetail.integrity.lastValidatedAt)
                                : "—"
                            }
                          />
                        </dl>
                      </Card>
                    ) : null}

                    {selectedDetail.status !== "available" ? (
                      <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                        Este ativo nao esta liberado para uso operacional.
                      </div>
                    ) : null}

                    {usageRows.length > 0 ? (
                      <div className="space-y-2">
                        <SectionHeader eyebrow="Usos" title="Ligacoes operacionais" />
                        <div className="space-y-2">
                          {usageRows.map((usage) => (
                            <div
                              key={usage.id}
                              className="rounded-md border border-border bg-surface p-3 text-[12px]"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-foreground">
                                  {usage.referenceLabel}
                                </span>
                                <StatusBadge tone="muted">{usage.usageType}</StatusBadge>
                              </div>
                              <div className="mt-1 text-muted-foreground">{usage.summary}</div>
                              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                                {usage.referenceId}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <EmptyState
                        title="Sem usos registrados"
                        description="O ativo ainda nao esta vinculado a conteudos ou workflows."
                      />
                    )}
                  </div>
                )}
              </Card>

              <Card>
                <SectionHeader eyebrow="Canal" title="Resumo operacional" />
                <dl className="grid gap-2 text-[12px]">
                  <DetailRow label="Canal" value={activeChannel?.name ?? activeChannelId} />
                  <DetailRow label="ID do canal" value={activeChannelId} mono />
                  <DetailRow label="Ativos carregados" value={rows.length.toString()} />
                  <DetailRow label="Filtro ativo" value={describeFilters(filters)} />
                </dl>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  },
});

function buildDefaultDraft(type: MediaAssetType, channelId?: string): AssetDraft {
  const defaults = typeDefaults(type, channelId);
  return {
    type,
    name: "",
    title: "",
    description: "",
    storagePath: defaults.storagePath,
    provenance: "",
    origin: defaults.origin,
    licenseStatus: defaults.licenseStatus,
    licenseName: "",
    mimeType: defaults.mimeType,
    extension: defaults.extension,
    sizeBytes: "1024",
    checksum: "0000000000000000000000000000000000000000000000000000000000000000",
    providerName: "",
    modelName: "",
    prompt: "",
    usageSummary: "",
    costActualCents: "0",
    riskLevel: "ok",
    status: "available",
  };
}

function typeDefaults(
  type: MediaAssetType,
  channelId?: string,
): Pick<AssetDraft, "storagePath" | "mimeType" | "extension" | "origin" | "licenseStatus"> {
  const slug = channelId ?? "channel";
  if (type === "narration") {
    return {
      storagePath: `${slug}/narration/${slug}-narration.wav`,
      mimeType: "audio/wav",
      extension: "wav",
      origin: "generated",
      licenseStatus: "confirmed",
    };
  }

  if (type === "video" || type === "intermediate_video") {
    return {
      storagePath: `${slug}/video/${slug}-${type}.mp4`,
      mimeType: "video/mp4",
      extension: "mp4",
      origin: "generated",
      licenseStatus: "known",
    };
  }

  return {
    storagePath: `${slug}/image/${slug}-asset.png`,
    mimeType: "image/png",
    extension: "png",
    origin: "generated",
    licenseStatus: "known",
  };
}

function buildPayload(draft: AssetDraft, channelId: string) {
  return {
    channelId,
    type: draft.type,
    category: deriveCategory(draft.type),
    name: draft.name.trim(),
    title: draft.title.trim() || undefined,
    description: draft.description.trim(),
    mimeType: draft.mimeType.trim(),
    extension: draft.extension.trim().replace(/^\./, ""),
    sizeBytes: Number.parseInt(draft.sizeBytes, 10) || 0,
    checksum: draft.checksum.trim(),
    storagePath: draft.storagePath.trim(),
    origin: draft.origin,
    provenance: draft.provenance.trim(),
    licenseStatus: draft.licenseStatus,
    licenseName: draft.licenseName.trim() || undefined,
    status: draft.status,
    riskLevel: draft.riskLevel,
    costActualCents: Number.parseInt(draft.costActualCents, 10) || 0,
    providerName: draft.providerName.trim() || undefined,
    modelName: draft.modelName.trim() || undefined,
    prompt: draft.prompt.trim() || undefined,
    usageSummary: draft.usageSummary.trim() || undefined,
  };
}

function omitChannelId<T extends { channelId: string }>(payload: T): Omit<T, "channelId"> {
  const { channelId: _channelId, ...rest } = payload;
  return rest;
}

function assetToDraft(asset: MediaAssetBase): AssetDraft {
  return {
    type: asset.type,
    name: asset.name ?? "",
    title: asset.title ?? asset.name ?? "",
    description: asset.description ?? "",
    storagePath: asset.storagePath ?? "",
    provenance: asset.provenance ?? "",
    origin: asset.origin,
    licenseStatus: asset.licenseStatus,
    licenseName: asset.licenseName ?? "",
    mimeType: asset.mimeType ?? typeDefaults(asset.type, asset.channelId).mimeType,
    extension: asset.extension ?? typeDefaults(asset.type, asset.channelId).extension,
    sizeBytes: String(asset.sizeBytes ?? 1024),
    checksum: asset.checksum ?? "0000000000000000000000000000000000000000000000000000000000000000",
    providerName: asset.providerName ?? "",
    modelName: asset.modelName ?? "",
    prompt: asset.prompt ?? "",
    usageSummary: asset.usageSummary ?? "",
    costActualCents: String(asset.costActualCents ?? 0),
    riskLevel: asset.riskLevel,
    status: asset.status,
  };
}

function deriveCategory(type: MediaAssetType) {
  if (type === "narration") {
    return "audio";
  }

  if (
    type === "image" ||
    type === "video" ||
    type === "thumbnail" ||
    type === "intermediate_video"
  ) {
    return "visual";
  }

  if (type === "brand_asset") {
    return "brand";
  }

  return "other";
}

function FilterField({
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "attention" | "warning" | "critical";
}) {
  return (
    <Card className="p-3">
      <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div
        className={
          tone === "ok"
            ? "mt-1 text-xl font-semibold text-ok"
            : tone === "attention"
              ? "mt-1 text-xl font-semibold text-attention"
              : tone === "warning"
                ? "mt-1 text-xl font-semibold text-warning"
                : "mt-1 text-xl font-semibold text-critical"
        }
      >
        {value}
      </div>
    </Card>
  );
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function countStatuses(rows: MediaAssetBase[]) {
  return rows.reduce(
    (acc, row) => {
      if (row.status === "available") {
        acc.available += 1;
      }

      if (row.status === "pending" || row.status === "blocked") {
        acc.blockedLike += 1;
      }

      if (row.status === "processing" || row.status === "failed") {
        acc.blockedLike += 1;
      }

      if (row.status === "invalid" || row.status === "corrupted" || row.status === "missing") {
        acc.blockedLike += 1;
      }

      if (row.riskLevel === "critical" || row.riskLevel === "blocked") {
        acc.highRisk += 1;
      }

      if (
        row.licenseStatus === "pending" ||
        row.licenseStatus === "unconfirmed" ||
        row.licenseStatus === "unknown"
      ) {
        acc.pendingLicense += 1;
      }

      return acc;
    },
    {
      available: 0,
      blockedLike: 0,
      highRisk: 0,
      pendingLicense: 0,
    },
  );
}

function describeFilters(filters: Filters): string {
  const active = Object.entries(filters).filter(([, value]) => value.trim().length > 0);
  if (active.length === 0) {
    return "Nenhum filtro";
  }

  return active.map(([key, value]) => `${key}:${value}`).join(" | ");
}
