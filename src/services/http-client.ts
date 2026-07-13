import type { ApiErrorCode, ApiListSuccess, ApiMeta, ApiSuccess } from "@/contracts/api-contracts";

export type ApiRequestErrorKind = "network" | "timeout" | "invalid_json" | "unexpected_envelope";

export type ApiRequestErrorInit = {
  kind: ApiRequestErrorKind;
  url: string;
  message: string;
  status?: number;
  code?: ApiErrorCode;
  details?: Record<string, unknown>;
  requestId?: string;
  cause?: unknown;
};

export class ApiRequestError extends Error {
  readonly kind: ApiRequestErrorKind;
  readonly url: string;
  readonly status?: number;
  readonly code?: ApiErrorCode;
  readonly details?: Record<string, unknown>;
  readonly requestId?: string;

  constructor(init: ApiRequestErrorInit) {
    super(init.message);
    this.name = "ApiRequestError";
    this.kind = init.kind;
    this.url = init.url;
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.requestId = init.requestId;
    if (init.cause) {
      this.cause = init.cause;
    }
  }
}

type ViteEnv = {
  VITE_ARALUME_API_BASE_URL?: string;
};

function readViteEnv(): ViteEnv {
  return (import.meta as ImportMeta & { env?: ViteEnv }).env ?? {};
}

export function getApiBaseUrl(): string {
  const configured = readViteEnv().VITE_ARALUME_API_BASE_URL?.trim();
  return configured ? configured.replace(/\/+$/, "") : "/api";
}

export function buildApiUrl(path: string, baseUrl = getApiBaseUrl()): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function requestApiEnvelope<T>(
  path: string,
  init: RequestInit = {},
  options: { baseUrl?: string; timeoutMs?: number } = {},
): Promise<T> {
  const url = buildApiUrl(path, options.baseUrl);
  const timeoutMs = options.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: init.signal ?? controller.signal,
      headers: {
        accept: "application/json",
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...(init.headers ?? {}),
      },
    });

    const text = await response.text();
    const payload = parseJson(text, url, response.status);

    if (!response.ok) {
      throw buildHttpError(url, response.status, payload);
    }

    return assertSuccessEnvelope<T>(payload, url);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (isAbortError(error)) {
      throw new ApiRequestError({
        kind: "timeout",
        url,
        message: "A requisicao para a API de Canais expirou.",
        cause: error,
      });
    }

    throw new ApiRequestError({
      kind: "network",
      url,
      message: "Nao foi possivel conectar ao backend.",
      cause: error,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseJson(text: string, url: string, status: number): unknown {
  if (!text.trim()) {
    throw new ApiRequestError({
      kind: "invalid_json",
      url,
      status,
      message: "O backend retornou uma resposta vazia.",
    });
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new ApiRequestError({
      kind: "invalid_json",
      url,
      status,
      message: "O backend retornou um payload nao-JSON.",
      cause: error,
    });
  }
}

function buildHttpError(url: string, status: number, payload: unknown): ApiRequestError {
  if (isApiErrorEnvelope(payload)) {
    return new ApiRequestError({
      kind: "unexpected_envelope",
      url,
      status,
      code: payload.error.code,
      details: payload.error.details,
      requestId: payload.meta.requestId,
      message: payload.error.message,
    });
  }

  return new ApiRequestError({
    kind: "unexpected_envelope",
    url,
    status,
    message: `O backend respondeu com status ${status} em formato inesperado.`,
  });
}

function assertSuccessEnvelope<T>(payload: unknown, url: string): T {
  if (!isApiSuccessEnvelope<T>(payload) && !isApiListSuccessEnvelope<T>(payload)) {
    throw new ApiRequestError({
      kind: "unexpected_envelope",
      url,
      message: "O backend retornou um envelope inesperado.",
    });
  }

  return payload as T;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasMeta(value: unknown): value is { meta: ApiMeta } {
  return (
    isObject(value) &&
    isObject(value.meta) &&
    typeof value.meta.requestId === "string" &&
    typeof value.meta.generatedAt === "string"
  );
}

function isApiSuccessEnvelope<T>(value: unknown): value is ApiSuccess<T> {
  return isObject(value) && "data" in value && hasMeta(value);
}

function isApiListSuccessEnvelope<T>(value: unknown): value is ApiListSuccess<T> {
  return isObject(value) && Array.isArray(value.data) && hasMeta(value);
}

function isApiErrorEnvelope(value: unknown): value is {
  error: { code: ApiErrorCode; message: string; details?: Record<string, unknown> };
  meta: ApiMeta;
} {
  return (
    isObject(value) &&
    isObject(value.error) &&
    typeof value.error.code === "string" &&
    typeof value.error.message === "string" &&
    hasMeta(value)
  );
}

function isAbortError(error: unknown): boolean {
  return isObject(error) && typeof error.name === "string" && error.name === "AbortError";
}
