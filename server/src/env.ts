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
  DATABASE_URL: optionalText,
  TEST_DATABASE_URL: optionalText,
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
    DATABASE_URL: source.DATABASE_URL,
    TEST_DATABASE_URL: source.TEST_DATABASE_URL,
  });

  if (!result.success) {
    throw new EnvValidationError(sanitizeIssues(result.error));
  }

  return result.data;
}
