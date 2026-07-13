import { z } from "zod";

import type { ChannelStatus } from "./channel.types.js";

export const channelStatusValues = [
  "active",
  "paused",
  "draft",
  "archived",
  "blocked",
  "warning",
] as const satisfies readonly ChannelStatus[];

export const channelStatusSchema = z.enum(channelStatusValues);

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(96)
  .transform((value) => value.toLowerCase())
  .refine((value) => slugPattern.test(value), {
    message: "Slug must contain only lowercase letters, numbers, and single hyphens",
  });

export const timezoneSchema = z.string().trim().min(1).refine(isValidTimeZone, {
  message: "Timezone must be a valid IANA timezone",
});

export const createChannelBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    slug: slugSchema,
    status: channelStatusSchema,
    timezone: timezoneSchema,
    language: z.string().trim().min(2).max(16),
  })
  .strict();

export const updateChannelBodySchema = createChannelBodySchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const channelIdParamsSchema = z
  .object({
    id: z.string().trim().min(1),
  })
  .strict();

export function formatValidationIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    code: issue.code,
    message: issue.message,
  }));
}

function isValidTimeZone(value: string): boolean {
  try {
    const resolvedTimeZone = new Intl.DateTimeFormat("en-US", { timeZone: value }).resolvedOptions()
      .timeZone;
    return resolvedTimeZone === value;
  } catch {
    return false;
  }
}
