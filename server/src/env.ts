import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (value === "") {
    return undefined;
  }

  return value;
}, z.string().min(1).optional());

const runtimeEnvSchema = z.object({
  ARALUME_ENV: z.enum(["development", "test", "production"]).default("development"),
  ARALUME_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  ARALUME_ASSET_STORAGE_ROOT: optionalText,
  DATABASE_URL: optionalText,
  TEST_DATABASE_URL: optionalText,
  ARALUME_YOUTUBE_CLIENT_ID: optionalText,
  ARALUME_YOUTUBE_CLIENT_SECRET: optionalText,
  ARALUME_YOUTUBE_REDIRECT_URI: optionalText,
  ARALUME_PUBLICATION_TOKEN_SECRET: optionalText,
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

export function loadEnv(source: NodeJS.ProcessEnv = process.env): RuntimeEnv {
  const result = runtimeEnvSchema.safeParse({
    ARALUME_ENV: source.ARALUME_ENV,
    ARALUME_LOG_LEVEL: source.ARALUME_LOG_LEVEL,
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
