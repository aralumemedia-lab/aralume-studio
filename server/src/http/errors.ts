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

type AppErrorInit = {
  code: ApiErrorCode;
  status: number;
  message: string;
  details?: Record<string, unknown>;
};

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details: Record<string, unknown>;

  constructor(init: AppErrorInit) {
    super(init.message);
    this.name = "AppError";
    this.code = init.code;
    this.status = init.status;
    this.details = init.details ?? {};
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (status === 413) {
      return new AppError({
        code: "VALIDATION_ERROR",
        status: 413,
        message: "Request payload exceeds the allowed limit",
      });
    }
  }

  if (error instanceof SyntaxError && "status" in error) {
    const status = (error as { status?: unknown }).status;

    if (status === 400) {
      return new AppError({
        code: "VALIDATION_ERROR",
        status: 400,
        message: "Invalid JSON payload",
      });
    }
  }

  return new AppError({
    code: "INTERNAL_ERROR",
    status: 500,
    message: "Internal server error",
  });
}
