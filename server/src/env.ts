import path from "node:path";
import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (value === "") {
    return undefined;
  }

  return value;
}, z.string().min(1).optional());

const optionalBooleanText = z.preprocess(
  (value) => {
    if (value === "") {
      return undefined;
    }

    return value;
  },
  z.enum(["true", "false"]).optional(),
);

const runtimeEnvSchema = z
  .object({
    ARALUME_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
    ARALUME_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    ARALUME_AUTH_TEST_BYPASS: optionalBooleanText,
    ARALUME_E2E_RUN_ID: optionalText,
    ARALUME_E2E_STARTUP_NONCE: optionalText,
    ARALUME_E2E_IDENTITY_SECRET: optionalText,
    ARALUME_AUTH_SIGNING_SECRET: optionalText,
    ARALUME_ASSET_STORAGE_ROOT: optionalText,
    DATABASE_URL: optionalText,
    TEST_DATABASE_URL: optionalText,
    ARALUME_YOUTUBE_CLIENT_ID: optionalText,
    ARALUME_YOUTUBE_CLIENT_SECRET: optionalText,
    ARALUME_YOUTUBE_REDIRECT_URI: optionalText,
    ARALUME_PUBLICATION_TOKEN_SECRET: optionalText,
  })
  .superRefine((value, ctx) => {
    const productionLike = value.ARALUME_ENV === "staging" || value.ARALUME_ENV === "production";

    if (productionLike && !value.ARALUME_AUTH_SIGNING_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ARALUME_AUTH_SIGNING_SECRET"],
        message: "Authentication signing secret is required in production-like environments",
      });
    }

    if (productionLike && !value.ARALUME_ASSET_STORAGE_ROOT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ARALUME_ASSET_STORAGE_ROOT"],
        message: "Asset storage root is required in production-like environments",
      });
    }

    if (
      productionLike &&
      value.ARALUME_ASSET_STORAGE_ROOT &&
      !path.isAbsolute(value.ARALUME_ASSET_STORAGE_ROOT)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ARALUME_ASSET_STORAGE_ROOT"],
        message: "Asset storage root must be absolute in production-like environments",
      });
    }

    if (
      productionLike &&
      value.ARALUME_AUTH_SIGNING_SECRET &&
      value.ARALUME_AUTH_SIGNING_SECRET.length < 32
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ARALUME_AUTH_SIGNING_SECRET"],
        message:
          "Authentication signing secret must be at least 32 characters in production-like environments",
      });
    }

    const productionRejectedKeys = [
      "ARALUME_AUTH_TEST_BYPASS",
      "ARALUME_E2E_RUN_ID",
      "ARALUME_E2E_STARTUP_NONCE",
      "ARALUME_E2E_IDENTITY_SECRET",
      "TEST_DATABASE_URL",
    ] as const;

    if (productionLike) {
      for (const key of productionRejectedKeys) {
        if ((value as Record<string, string | undefined>)[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is not allowed in production-like environments`,
          });
        }
      }
    }

    if (value.DATABASE_URL && !isValidUrlLike(value.DATABASE_URL)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "DATABASE_URL must be a valid URL when provided",
      });
    }

    if (value.ARALUME_YOUTUBE_REDIRECT_URI && !isValidUrlLike(value.ARALUME_YOUTUBE_REDIRECT_URI)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ARALUME_YOUTUBE_REDIRECT_URI"],
        message: "ARALUME_YOUTUBE_REDIRECT_URI must be a valid URL when provided",
      });
    }
  });

export type RuntimeEnv = z.infer<typeof runtimeEnvSchema>;

export type EnvIssue = {
  path: string;
  code: string;
};

export class EnvValidationError extends Error {
  readonly issues: EnvIssue[];

  constructor(issues: EnvIssue[]) {
    super("Invalid server environment");
    this.name = "EnvValidationError";
    this.issues = issues;
  }
}

function sanitizeIssues(error: z.ZodError): EnvIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
    code: issue.code,
  }));
}

function isValidUrlLike(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): RuntimeEnv {
  const result = runtimeEnvSchema.safeParse({
    ARALUME_ENV: source.ARALUME_ENV,
    ARALUME_LOG_LEVEL: source.ARALUME_LOG_LEVEL,
    ARALUME_AUTH_TEST_BYPASS: source.ARALUME_AUTH_TEST_BYPASS,
    ARALUME_E2E_RUN_ID: source.ARALUME_E2E_RUN_ID,
    ARALUME_E2E_STARTUP_NONCE: source.ARALUME_E2E_STARTUP_NONCE,
    ARALUME_E2E_IDENTITY_SECRET: source.ARALUME_E2E_IDENTITY_SECRET,
    ARALUME_AUTH_SIGNING_SECRET: source.ARALUME_AUTH_SIGNING_SECRET,
    ARALUME_ASSET_STORAGE_ROOT: source.ARALUME_ASSET_STORAGE_ROOT,
    DATABASE_URL: source.DATABASE_URL,
    TEST_DATABASE_URL: source.TEST_DATABASE_URL,
    ARALUME_YOUTUBE_CLIENT_ID: source.ARALUME_YOUTUBE_CLIENT_ID,
    ARALUME_YOUTUBE_CLIENT_SECRET: source.ARALUME_YOUTUBE_CLIENT_SECRET,
    ARALUME_YOUTUBE_REDIRECT_URI: source.ARALUME_YOUTUBE_REDIRECT_URI,
    ARALUME_PUBLICATION_TOKEN_SECRET: source.ARALUME_PUBLICATION_TOKEN_SECRET,
  });

  if (!result.success) {
    throw new EnvValidationError(sanitizeIssues(result.error));
  }

  return result.data;
}
