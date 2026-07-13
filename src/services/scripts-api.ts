import type { ID, Script, ScriptVersion } from "@/contracts/types";
import type { ApiListSuccess, ApiSuccess } from "@/contracts/api-contracts";

import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

const SCRIPTS_PATH = "/scripts";

export type ScriptFilters = {
  channelId?: ID;
  status?: Script["status"];
  contentId?: ID;
};

export type CreateScriptInput = Pick<
  Script,
  | "channelId"
  | "contentId"
  | "title"
  | "status"
  | "estimatedDurationSeconds"
  | "hook"
  | "promise"
  | "cta"
  | "riskLevel"
> & {
  initialVersion: {
    title?: string;
    narrationText: string;
    sceneCount: number;
    estimatedDurationSeconds?: number;
    changeSummary: string;
  };
};

export type UpdateScriptInput = Partial<
  Pick<
    Script,
    "title" | "status" | "estimatedDurationSeconds" | "hook" | "promise" | "cta" | "riskLevel"
  >
>;

export type CreateScriptVersionInput = {
  title?: string;
  narrationText: string;
  sceneCount: number;
  estimatedDurationSeconds?: number;
  changeSummary: string;
  versionNumber?: number;
};

export async function getScripts(filters: ScriptFilters = {}): Promise<ApiListSuccess<Script>> {
  return requestApiEnvelope<ApiListSuccess<Script>>(withQuery(SCRIPTS_PATH, filters));
}

export async function getScript(id: ID): Promise<ApiSuccess<Script>> {
  return requestApiEnvelope<ApiSuccess<Script>>(`${SCRIPTS_PATH}/${id}`);
}

export async function createScript(input: CreateScriptInput): Promise<ApiSuccess<Script>> {
  return requestApiEnvelope<ApiSuccess<Script>>(SCRIPTS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateScript(id: ID, input: UpdateScriptInput): Promise<ApiSuccess<Script>> {
  return requestApiEnvelope<ApiSuccess<Script>>(`${SCRIPTS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function getScriptVersions(id: ID): Promise<ApiListSuccess<ScriptVersion>> {
  return requestApiEnvelope<ApiListSuccess<ScriptVersion>>(`${SCRIPTS_PATH}/${id}/versions`);
}

export async function createScriptVersion(
  id: ID,
  input: CreateScriptVersionInput,
): Promise<ApiSuccess<ScriptVersion>> {
  return requestApiEnvelope<ApiSuccess<ScriptVersion>>(`${SCRIPTS_PATH}/${id}/versions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function describeScriptsApiError(error: unknown) {
  if (!(error instanceof ApiRequestError)) {
    return "Nao foi possivel carregar os roteiros.";
  }

  if (error.kind === "network") {
    return "Backend indisponivel. Tente novamente.";
  }

  if (error.kind === "timeout") {
    return "A requisicao de roteiros expirou. Tente novamente.";
  }

  if (error.kind === "invalid_json") {
    return "O backend respondeu com um formato invalido.";
  }

  if (error.kind === "unexpected_envelope") {
    if (error.status === 404) {
      return "Roteiro nao encontrado.";
    }

    if (error.status === 400) {
      return "Os dados de roteiro enviados sao invalidos.";
    }

    if (error.status === 409) {
      return "O roteiro entrou em conflito.";
    }

    return "O backend respondeu de forma inesperada.";
  }

  return "Nao foi possivel carregar os roteiros.";
}

function withQuery(path: string, query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}
