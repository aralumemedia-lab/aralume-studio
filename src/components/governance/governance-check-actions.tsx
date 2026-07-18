import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { GovernanceEntityType } from "@/contracts/types";
import { Card, SectionHeader } from "@/components/ui/data-card";
import {
  createComplianceCheck,
  createQualityCheck,
  describeComplianceApiError,
  describeQualityApiError,
} from "@/services/api-client";

const operatorName = "Ana Ribeiro";

const entityTypeOptions: Array<{ value: GovernanceEntityType; label: string }> = [
  { value: "content_idea", label: "Ideia editorial" },
  { value: "production_item", label: "Item de producao" },
  { value: "research_session", label: "Sessao de pesquisa" },
  { value: "script", label: "Roteiro" },
  { value: "visual_plan", label: "Plano visual" },
];

export function GovernanceCheckActions({ channelId }: { channelId?: string }) {
  const queryClient = useQueryClient();
  const [entityType, setEntityType] = useState<GovernanceEntityType>("script");
  const [entityId, setEntityId] = useState("");

  const qualityMutation = useMutation({
    mutationFn: () =>
      createQualityCheck({
        channelId: channelId!,
        entityType,
        entityId: entityId.trim(),
        requestedBy: operatorName,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["approvals-quality"] }),
        queryClient.invalidateQueries({ queryKey: ["quality"] }),
        queryClient.invalidateQueries({ queryKey: ["approvals"] }),
      ]);
    },
  });

  const complianceMutation = useMutation({
    mutationFn: () =>
      createComplianceCheck({
        channelId: channelId!,
        entityType,
        entityId: entityId.trim(),
        requestedBy: operatorName,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["approvals-compliance"] }),
        queryClient.invalidateQueries({ queryKey: ["compliance"] }),
        queryClient.invalidateQueries({ queryKey: ["approvals"] }),
      ]);
    },
  });

  const error = qualityMutation.error ?? complianceMutation.error;
  const errorMessage = qualityMutation.error
    ? describeQualityApiError(qualityMutation.error)
    : complianceMutation.error
      ? describeComplianceApiError(complianceMutation.error)
      : undefined;
  const canSubmit = !!channelId && entityId.trim().length > 0;
  const isPending = qualityMutation.isPending || complianceMutation.isPending;

  return (
    <Card>
      <SectionHeader
        title="Executar verificacoes"
        description="Registre qualidade e conformidade para um artefato do canal ativo."
      />
      {!channelId ? (
        <div className="rounded-md border border-warning/40 bg-warning-soft p-3 text-[12px] text-warning">
          Selecione um canal ativo antes de executar uma verificacao.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                Tipo de artefato
              </span>
              <select
                aria-label="Tipo de artefato da verificacao"
                value={entityType}
                onChange={(event) => setEntityType(event.target.value as GovernanceEntityType)}
                className="h-8 w-full rounded-sm border border-border bg-surface px-2 text-[12px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              >
                {entityTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                ID do artefato
              </span>
              <input
                aria-label="ID do artefato da verificacao"
                value={entityId}
                onChange={(event) => setEntityId(event.target.value)}
                placeholder="Ex.: sc_01"
                className="h-8 w-full rounded-sm border border-border bg-surface px-2 text-[12px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canSubmit || isPending}
              onClick={() => qualityMutation.mutate()}
              className={actionButtonClass(!canSubmit || isPending, "ok")}
            >
              {qualityMutation.isPending ? "Executando qualidade..." : "Executar qualidade"}
            </button>
            <button
              type="button"
              disabled={!canSubmit || isPending}
              onClick={() => complianceMutation.mutate()}
              className={actionButtonClass(!canSubmit || isPending, "warning")}
            >
              {complianceMutation.isPending ? "Executando compliance..." : "Executar compliance"}
            </button>
          </div>
          {error && errorMessage && (
            <div
              role="alert"
              className="rounded-md border border-critical/40 bg-critical-soft p-3 text-[12px] text-critical"
            >
              {errorMessage}
            </div>
          )}
          {(qualityMutation.isSuccess || complianceMutation.isSuccess) && !error && (
            <div
              role="status"
              className="rounded-md border border-ok/40 bg-ok-soft p-3 text-[12px] text-ok"
            >
              Verificacao registrada e disponivel para consulta no canal ativo.
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function actionButtonClass(disabled: boolean, tone: "ok" | "warning"): string {
  const base =
    "inline-flex items-center justify-center h-8 rounded-sm px-3 text-[12px] font-medium transition-colors";

  if (disabled) {
    return `${base} border border-border bg-surface text-muted-foreground opacity-60`;
  }

  return `${base} ${tone === "ok" ? "bg-ok" : "bg-warning"} text-primary-foreground hover:opacity-95`;
}
