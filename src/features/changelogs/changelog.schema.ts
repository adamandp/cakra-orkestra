import { z } from "zod";
import { isHttpUrl, toLocalDateTime } from "./changelog.constants";

const version = z.string().trim().min(1, "Version is required").max(30);
const description = z.string().trim();
const commitUrl = z.string().trim().refine(isHttpUrl, "Enter a valid HTTP or HTTPS URL");
const releasedAt = z.iso.datetime({ offset: true });
const changeItem = z
  .object({
    description: z.string().trim().min(1, "Change description is required"),
  })
  .strict();

const changelogFields = z.object({
  version,
  description: description.nullable(),
  commit_url: commitUrl.nullable(),
  released_at: releasedAt,
  changes: z.array(changeItem),
});

export const createChangelogSchema = changelogFields
  .extend({
    project_id: z.uuid("Select a project"),
    description: description.nullable().default(null),
    commit_url: commitUrl.nullable().default(null),
    released_at: releasedAt.optional(),
    changes: z.array(changeItem).default([]),
  })
  .strict();

export const updateChangelogSchema = changelogFields
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field");

export const changelogListSchema = z.object({
  q: z.string().trim().max(255).optional(),
  project_id: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const changelogFormSchema = z.object({
  project_id: z.uuid("Select a project"),
  version,
  description,
  commit_url: z
    .string()
    .trim()
    .refine((value) => !value || isHttpUrl(value), "Enter a valid HTTP or HTTPS URL"),
  released_at: z.string().refine((value) => {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) && toLocalDateTime(date) === value;
  }, "Select a valid release date and time"),
  changes: z.array(changeItem),
});

export type ChangelogFormValues = z.infer<typeof changelogFormSchema>;
