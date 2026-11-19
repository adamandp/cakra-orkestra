import { http, HttpResponse } from "msw";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskAssigneeSchema,
  taskListSchema,
  createTaskChecklistSchema,
  updateTaskChecklistSchema,
  orderTaskChecklistsSchema,
  blockTaskSchema,
  emptyTaskActionSchema,
} from "@/features/tasks/task.schema";
import { isEditableTask, taskWorkflowTransitions } from "@/features/tasks/task.constants";
import { getMockUser } from "../data/auth-store";
import { findMockProject, canViewMockProject } from "../data/projects";
import { findMockUser } from "../data/users";
import {
  appendMockChecklist,
  canAssignMockTask,
  canViewMockTask,
  createMockTask,
  findMockTask,
  getMockTasks,
  orderMockChecklists,
  toPublicTask,
  toPublicTaskDetail,
  updateMockTask,
  transitionMockTask,
} from "../data/tasks";
import type { TaskWorkflowAction } from "@/interface/task.interface";
import type { AuthUser } from "@/interface/auth.interface";
import { requireMockAdmin } from "./authorization";

export function failure(message: string, status: number) {
  return HttpResponse.json({ message }, { status });
}

export function requireTask(request: Request, id: string, writing = false) {
  const user = getMockUser(request);
  if (!user) return { task: null, user: null, error: failure("Unauthorized", 401) } as const;
  const task = findMockTask(id);
  if (!task || !canViewMockTask(task, user)) {
    return { task: null, user: null, error: failure("Task not found", 404) } as const;
  }
  if (
    writing &&
    (!isEditableTask(task.task_status) || findMockProject(task.project_id)?.status !== "ACTIVE")
  ) {
    return { task: null, user: null, error: failure("Task is locked", 409) } as const;
  }
  return { task, user, error: null } as const;
}

function validateAssignment(projectId: string, assigneeId: string, actor: AuthUser) {
  const project = findMockProject(projectId);
  if (!project || !canViewMockProject(project, actor)) return failure("Project not found", 404);
  if (project.status !== "ACTIVE")
    return failure("Only active projects accept new assignments", 409);
  if (actor.role !== "ADMIN" && assigneeId !== actor.id) return failure("Forbidden", 403);
  const assignee = findMockUser(assigneeId);
  if (!assignee) return failure("Assignee not found", 404);
  if (!canAssignMockTask(projectId, assigneeId, actor))
    return failure("Select an active project participant or yourself as admin", 409);
  return null;
}

export function taskResponse(
  task: ReturnType<typeof updateMockTask>,
  message: string,
  status = 200,
) {
  return task
    ? HttpResponse.json({ message, data: toPublicTaskDetail(task) }, { status })
    : failure("Task not found", 404);
}

function workflowHandler(action: TaskWorkflowAction) {
  return http.post(`*/api/tasks/:id/${action}`, async ({ request, params }) => {
    const raw = await request.json().catch(() => null);
    const id = String(params.id);
    const result = requireTask(request, id, true);
    if (result.error) return result.error;
    const parsed =
      action === "block" ? blockTaskSchema.safeParse(raw) : emptyTaskActionSchema.safeParse(raw);
    if (!parsed.success) return failure(parsed.error.issues[0].message, 400);
    if (result.task.task_status !== taskWorkflowTransitions[action].from)
      return failure("Invalid task status transition", 409);
    if (action === "submit" && !result.task.evidences.length)
      return failure("Add at least one evidence before submitting", 409);
    const reason = "reason" in parsed.data ? String(parsed.data.reason) : null;
    const messages: Record<TaskWorkflowAction, string> = {
      start: "Task started",
      block: "Task blocked",
      resume: "Task resumed",
      submit: "Task submitted for approval",
    };
    return taskResponse(transitionMockTask(id, action, result.user.id, reason), messages[action]);
  });
}

export const taskHandlers = [
  workflowHandler("start"),
  workflowHandler("block"),
  workflowHandler("resume"),
  workflowHandler("submit"),
  http.get("*/api/tasks/:id/status-histories", ({ request, params }) => {
    const result = requireTask(request, String(params.id));
    if (result.error) return result.error;
    return HttpResponse.json({ data: result.task.status_histories });
  }),
  http.get("*/api/tasks", ({ request }) => {
    const user = getMockUser(request);
    if (!user) return failure("Unauthorized", 401);
    const params = new URL(request.url).searchParams;
    const parsed = taskListSchema.safeParse(Object.fromEntries(params));
    if (!parsed.success) return failure("Invalid task filters", 400);
    const { q, scope, project_id, assignee_id, status, type, category, limit, offset } =
      parsed.data;
    if (user.role !== "ADMIN" && assignee_id && assignee_id !== user.id)
      return failure("Forbidden", 403);
    const tasks = getMockTasks().filter(
      (task) =>
        !task.deleted_at &&
        canViewMockTask(task, user) &&
        (!scope || task.assignee_id === user.id) &&
        (!project_id || task.project_id === project_id) &&
        (!assignee_id || task.assignee_id === assignee_id) &&
        (!status || task.task_status === status) &&
        (!type || task.task_type === type) &&
        (!category || task.task_category === category) &&
        (!q ||
          [task.code, task.title, task.description].some((value) =>
            value.toLowerCase().includes(q.toLowerCase()),
          )),
    );
    return HttpResponse.json({
      data: {
        items: tasks.slice(offset, offset + limit).map(toPublicTask),
        total: tasks.length,
        limit,
        offset,
      },
    });
  }),

  http.post("*/api/tasks", async ({ request }) => {
    const user = getMockUser(request);
    if (!user) return failure("Unauthorized", 401);
    const body = createTaskSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return failure(body.error.issues[0].message, 400);
    // Read the actor again after the asynchronous body parse.
    const actor = getMockUser(request);
    if (!actor) return failure("Unauthorized", 401);
    const assigneeId = body.data.assignee_id ?? actor.id;
    const error = validateAssignment(body.data.project_id, assigneeId, actor);
    if (error) return error;
    return taskResponse(createMockTask(body.data, actor.id, assigneeId), "Task created", 201);
  }),

  http.get("*/api/tasks/:id", ({ request, params }) => {
    const result = requireTask(request, String(params.id));
    if (result.error) return result.error;
    return HttpResponse.json({ data: toPublicTaskDetail(result.task) });
  }),

  http.patch("*/api/tasks/:id", async ({ request, params }) => {
    const body = updateTaskSchema.safeParse(await request.json().catch(() => null));
    const id = String(params.id);
    const result = requireTask(request, id, true);
    if (result.error) return result.error;
    if (!body.success) return failure(body.error.issues[0].message, 400);
    return taskResponse(
      updateMockTask(id, (task) => ({ ...task, ...body.data })),
      "Task updated",
    );
  }),

  http.delete("*/api/tasks/:id", ({ request, params }) => {
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    const id = String(params.id);
    const result = requireTask(request, id, true);
    if (result.error) return result.error;
    const task = updateMockTask(id, (current, now) => ({ ...current, deleted_at: now }));
    return task
      ? HttpResponse.json({ message: "Task deleted", data: null })
      : failure("Task not found", 404);
  }),

  http.patch("*/api/tasks/:id/assignee", async ({ request, params }) => {
    const body = updateTaskAssigneeSchema.safeParse(await request.json().catch(() => null));
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    const id = String(params.id);
    const result = requireTask(request, id, true);
    if (result.error) return result.error;
    if (!body.success) return failure(body.error.issues[0].message, 400);
    const error = validateAssignment(result.task.project_id, body.data.assignee_id, result.user);
    if (error) return error;
    return taskResponse(
      updateMockTask(id, (task) => ({ ...task, assignee_id: body.data.assignee_id })),
      "Assignee updated",
    );
  }),

  http.get("*/api/tasks/:id/checklists", ({ request, params }) => {
    const result = requireTask(request, String(params.id));
    if (result.error) return result.error;
    return HttpResponse.json({ data: toPublicTaskDetail(result.task).checklists });
  }),

  http.post("*/api/tasks/:id/checklists", async ({ request, params }) => {
    const body = createTaskChecklistSchema.safeParse(await request.json().catch(() => null));
    const id = String(params.id);
    const result = requireTask(request, id, true);
    if (result.error) return result.error;
    if (!body.success) return failure(body.error.issues[0].message, 400);
    return taskResponse(
      updateMockTask(id, (task, now) => ({
        ...task,
        checklists: appendMockChecklist(task, body.data.title, now),
      })),
      "Checklist added",
      201,
    );
  }),

  http.patch("*/api/tasks/:id/checklists/:itemId", async ({ request, params }) => {
    const body = updateTaskChecklistSchema.safeParse(await request.json().catch(() => null));
    const id = String(params.id);
    const itemId = String(params.itemId);
    const result = requireTask(request, id, true);
    if (result.error) return result.error;
    if (!body.success) return failure(body.error.issues[0].message, 400);
    if (!result.task.checklists.some((item) => item.id === itemId))
      return failure("Checklist not found", 404);
    return taskResponse(
      updateMockTask(id, (task, now) => ({
        ...task,
        checklists: task.checklists.map((item) => {
          if (item.id !== itemId) return item;
          const completed = body.data.is_completed;
          return {
            ...item,
            ...body.data,
            completed_at:
              completed === undefined || completed === item.is_completed
                ? item.completed_at
                : completed
                  ? now
                  : null,
            updated_at: now,
          };
        }),
      })),
      "Checklist updated",
    );
  }),

  http.delete("*/api/tasks/:id/checklists/:itemId", ({ request, params }) => {
    const id = String(params.id);
    const itemId = String(params.itemId);
    const result = requireTask(request, id, true);
    if (result.error) return result.error;
    if (!result.task.checklists.some((item) => item.id === itemId))
      return failure("Checklist not found", 404);
    return taskResponse(
      updateMockTask(id, (task, now) => {
        const items = task.checklists
          .filter((item) => item.id !== itemId)
          .sort((a, b) => a.sort_order - b.sort_order);
        return {
          ...task,
          checklists: orderMockChecklists(
            items,
            items.map((item) => item.id),
            now,
          ),
        };
      }),
      "Checklist removed",
    );
  }),

  http.put("*/api/tasks/:id/checklists/order", async ({ request, params }) => {
    const body = orderTaskChecklistsSchema.safeParse(await request.json().catch(() => null));
    const id = String(params.id);
    const result = requireTask(request, id, true);
    if (result.error) return result.error;
    if (!body.success) return failure(body.error.issues[0].message, 400);
    const ids = body.data.item_ids;
    const currentIds = new Set(result.task.checklists.map((item) => item.id));
    if (ids.length !== currentIds.size || ids.some((item) => !currentIds.has(item))) {
      return failure("Provide every checklist ID exactly once", 400);
    }
    return taskResponse(
      updateMockTask(id, (task, now) => ({
        ...task,
        checklists: orderMockChecklists(task.checklists, ids, now),
      })),
      "Checklist order updated",
    );
  }),
];
