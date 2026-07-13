import { randomUUID } from "node:crypto";

import type { ApiErrorCode } from "./errors.js";

export type ApiMeta = {
  requestId: string;
  generatedAt: string;
  page?: number;
  pageSize?: number;
  total?: number;
};

export type ApiSuccess<T> = {
  data: T;
  meta: ApiMeta;
};

export type ApiListSuccess<T> = {
  data: T[];
  meta: ApiMeta;
};

export type ApiErrorEnvelope = {
  error: {
    code: ApiErrorCode;
    message: string;
    details: Record<string, unknown>;
  };
  meta: ApiMeta;
};

export type ApiMetaInput = Partial<ApiMeta>;

export function createApiMeta(input: ApiMetaInput = {}): ApiMeta {
  const meta: ApiMeta = {
    requestId: input.requestId ?? randomUUID(),
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  };

  if (input.page !== undefined) {
    meta.page = input.page;
  }

  if (input.pageSize !== undefined) {
    meta.pageSize = input.pageSize;
  }

  if (input.total !== undefined) {
    meta.total = input.total;
  }

  return meta;
}

export function createSuccessResponse<T>(data: T, meta: ApiMetaInput = {}): ApiSuccess<T> {
  return {
    data,
    meta: createApiMeta(meta),
  };
}

export function createListSuccessResponse<T>(
  data: T[],
  meta: ApiMetaInput = {},
): ApiListSuccess<T> {
  return {
    data,
    meta: createApiMeta({
      ...meta,
      total: meta.total ?? data.length,
      page: meta.page ?? 1,
      pageSize: meta.pageSize ?? data.length,
    }),
  };
}

export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  details: Record<string, unknown> = {},
  meta: ApiMetaInput = {},
): ApiErrorEnvelope {
  return {
    error: {
      code,
      message,
      details,
    },
    meta: createApiMeta(meta),
  };
}
