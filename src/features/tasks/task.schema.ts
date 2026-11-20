import { z } from "zod";
import { TASK_EVIDENCE_MAX_BYTES } from "./task.constants";

export const taskStatusSchema = z.enum(["OPEN", "BLOCKED", "PROGRESS", "PENDING", "DONE"]);
export const taskTypeSchema = z.enum(["REGULAR", "OVERTIME"]);
export const taskCategorySchema = z.enum(["CLIENT", "INITIATIVE", "FIXING"]);
const title = z.string().trim().min(1, "Task title is required").max(255);
const description = z.string().trim().min(1, "Description is required");
const checklistTitle = z.string().trim().min(1, "Checklist title is required");
const id = z.uuid("Select a valid item");
const dueDate = z.iso.date().nullable();

export const createTaskChecklistSchema = z.object({ title: checklistTitle }).strict();
export const updateTaskChecklistSchema = z
  .object({
    title: checklistTitle.optional(),
    is_completed: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field");
export const orderTaskChecklistsSchema = z
  .object({
    item_ids: z
      .array(id)
      .refine((ids) => new Set(ids).size === ids.length, "Duplicate checklist IDs"),
  })
  .strict();

const taskFields = z.object({
  title,
  description,
  task_type: taskTypeSchema,
  task_category: taskCategorySchema,
  due_date: dueDate,
});
export const createTaskSchema = taskFields
  .extend({
    project_id: id,
    assignee_id: id.optional(),
    task_type: taskTypeSchema.default("REGULAR"),
    task_category: taskCategorySchema.default("CLIENT"),
    due_date: dueDate.default(null),
    checklists: z.array(createTaskChecklistSchema).default([]),
  })
  .strict();
export const updateTaskSchema = taskFields
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field");
export const updateTaskAssigneeSchema = z.object({ assignee_id: id }).strict();
export const taskListSchema = z.object({
  q: z.string().trim().max(255).optional(),
  scope: z.literal("me").optional(),
  project_id: id.optional(),
  assignee_id: id.optional(),
  status: taskStatusSchema.optional(),
  type: taskTypeSchema.optional(),
  category: taskCategorySchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const taskFormSchema = taskFields.extend({
  project_id: id,
  assignee_id: id,
  checklists: z.array(createTaskChecklistSchema),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;

const evidenceTitle = z.string().trim().min(1).max(255).optional();
export const blockTaskSchema = z
  .object({ reason: z.string().trim().min(1, "Blocker reason is required").max(2000) })
  .strict();
export const emptyTaskActionSchema = z.object({}).strict();
export const rejectTaskSchema = z
  .object({ reason: z.string().trim().min(1, "Revision reason is required").max(2000) })
  .strict();
export const createTaskLinkSchema = z
  .object({
    title: evidenceTitle,
    url: z
      .string()
      .trim()
      .max(2048)
      .url()
      .refine((value) => {
        try {
          return ["http:", "https:"].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      }, "Use an HTTP or HTTPS URL"),
  })
  .strict();
export const presignTaskEvidenceSchema = z
  .object({
    file_name: z
      .string()
      .min(1)
      .max(255)
      .refine(
        (name) =>
          !name.includes("/") &&
          !name.includes("\\") &&
          !Array.from(name).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) &&
          Boolean(name.trim()),
        "Invalid file name",
      ),
    mime_type: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/),
    file_size: z
      .number()
      .int()
      .positive()
      .max(TASK_EVIDENCE_MAX_BYTES, "File must be 20 MiB or smaller"),
  })
  .strict();
export const confirmTaskEvidenceSchema = z
  .object({
    object_key: z.string().min(1).max(512),
    title: evidenceTitle,
  })
  .strict();
