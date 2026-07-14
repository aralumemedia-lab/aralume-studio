import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Layers3, Search, ShieldAlert } from "lucide-react";

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
import {
  formatBytes,
  formatChecksum,
  formatCurrencyCents,
  formatDateTime,
  formatRelative,
} from "@/lib/format";
import type { MediaAssetBase, MediaAssetStatus } from "@/contracts/types";
import {
  describeMediaAssetsApiError,
  getMediaAsset,
  getMediaAssetUsages,
  getMediaAssets,
} from "@/services/api-client";

type Filters = {
  search: string;
  type: string;
  status: string;
  riskLevel: string;
  origin: string;
};

const emptyFilters: Filters = {
  search: "",
  type: "",
  status: "",
  riskLevel: "",
  origin: "",
};

export const Route = createFileRoute("/media-assets")({
  head: () => ({
    meta: [
      { title: "Ativos de Midia - Aralume" },
      { name: "description", content: "Registry operacional de ativos de midia por canal." },
    ],
  }),
  component: function MediaAssetsPage() {
    const { activeChannelId, activeChannel } = useChannelContext();
    const [filters, setFilters] = useState<Filters>(emptyFilters);
    const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>(undefined);

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

    const selectedAsset = useMemo(() => {
      if (!filteredRows.length) {
        return undefined;
      }

      return filteredRows.find((asset) => asset.id === selectedAssetId) ?? filteredRows[0];
    }, [filteredRows, selectedAssetId]);

    const detailQuery = useQuery({
      queryKey: ["media-assets", activeChannelId, selectedAsset?.id],
      enabled: Boolean(activeChannelId && selectedAsset?.id),
      queryFn: () => getMediaAsset(activeChannelId as string, selectedAsset?.id as string),
    });

    const usagesQuery = useQuery({
      queryKey: ["media-assets-usages", activeChannelId, selectedAsset?.id],
      enabled: Boolean(activeChannelId && selectedAsset?.id),
      queryFn: () => getMediaAssetUsages(activeChannelId as string, selectedAsset?.id as string),
    });

    const selectedDetail = detailQuery.data?.data ?? selectedAsset;
    const usageRows = usagesQuery.data?.data ?? [];
    const counts = useMemo(() => countStatuses(filteredRows), [filteredRows]);

    const columns: Column<MediaAssetBase>[] = [
      {
        key: "asset",
        header: "Ativo",
        render: (row) => (
          <button
            type="button"
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

    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Editorial"
          title="Ativos de Midia"
          description="Registry operacional para narracoes, imagens, videos, thumbnails, trilhas, legendas e auxiliares."
        />

        <div className="px-4 pb-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.95fr)]">
            <div className="space-y-4">
              <Card>
                <SectionHeader
                  eyebrow="Canal"
                  title={activeChannel?.name ?? activeChannelId}
                  description="Filtros locais sobre os ativos carregados do backend real."
                  action={
                    <StatusBadge tone="info" dot>
                      {filteredRows.length} itens
                    </StatusBadge>
                  }
                />

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
                    options={[
                      "",
                      "narration",
                      "audio",
                      "image",
                      "video",
                      "intermediate_video",
                      "thumbnail",
                      "soundtrack",
                      "sound_effect",
                      "subtitle",
                      "caption",
                      "auxiliary",
                      "brand_asset",
                      "music",
                      "other",
                    ]}
                  />
                  <SelectField
                    label="Status"
                    value={filters.status}
                    onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
                    options={[
                      "",
                      "available",
                      "pending",
                      "blocked",
                      "invalid",
                      "corrupted",
                      "missing",
                      "replaced",
                      "archived",
                      "processing",
                      "failed",
                    ]}
                  />
                  <SelectField
                    label="Risco"
                    value={filters.riskLevel}
                    onChange={(value) =>
                      setFilters((current) => ({ ...current, riskLevel: value }))
                    }
                    options={["", "ok", "attention", "warning", "critical", "blocked"]}
                  />
                  <SelectField
                    label="Origem"
                    value={filters.origin}
                    onChange={(value) => setFilters((current) => ({ ...current, origin: value }))}
                    options={[
                      "",
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

              {listQuery.isLoading ? (
                <Card>
                  <LoadingState label="Carregando ativos de midia" />
                </Card>
              ) : listQuery.isError ? (
                <Card>
                  <ErrorState message={describeMediaAssetsApiError(listQuery.error)} />
                </Card>
              ) : filteredRows.length === 0 ? (
                <Card>
                  <EmptyState
                    title="Nenhum ativo encontrado"
                    description="Ajuste os filtros ou verifique se o canal possui ativos registrados."
                    icon={<Layers3 size={18} />}
                  />
                </Card>
              ) : (
                <Card padded={false}>
                  <CompactTable
                    rows={filteredRows}
                    columns={columns}
                    onRowClick={(row) => setSelectedAssetId(row.id)}
                    empty="Sem ativos para exibir."
                    className="border-0 rounded-none"
                  />
                </Card>
              )}

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

                    {selectedDetail.integrity && (
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
                    )}

                    {selectedDetail.status !== "available" && (
                      <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                        Este ativo nao esta liberado para uso operacional.
                      </div>
                    )}

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
        {options.filter(Boolean).map((option) => (
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
