import { z } from "zod";

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
