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

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "OPERATION_BLOCKED"
  | "BUDGET_EXCEEDED"
  | "COMPLIANCE_BLOCKED";

export type ApiError = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: ApiMeta;
};
