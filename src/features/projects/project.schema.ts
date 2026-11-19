import { z } from "zod";

const name = z.string().trim().min(1, "Project name is required").max(255);
const description = z.string().trim();
const userId = z.uuid("Select a user");
const memberIds = z.array(userId).refine(
  (ids) => new Set(ids).size === ids.length,
  "Duplicate members are not allowed",
);

export const projectStatusSchema = z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]);

const projectFieldsSchema = z.object({
  name,
  description: description.nullable(),
  owner_id: userId,
});

export const createProjectSchema = projectFieldsSchema.extend({
  member_ids: memberIds.default([]),
}).strict();

export const updateProjectSchema = projectFieldsSchema.partial().strict().refine(
  (value) => Object.keys(value).length > 0,
  "Provide at least one field to update",
);

export const updateProjectStatusSchema = z.object({ status: projectStatusSchema }).strict();
export const addProjectMembersSchema = z.object({
  member_ids: memberIds.refine((ids) => ids.length > 0, "Select at least one member"),
}).strict();

export const projectListSchema = z.object({
  q: z.string().trim().max(255).optional(),
  status: projectStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export const projectFormSchema = z.object({
  name,
  description,
  owner_id: userId,
  member_ids: memberIds,
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
