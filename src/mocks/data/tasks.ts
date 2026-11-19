import type { AuthUser } from "@/interface/auth.interface";
import type { ProjectUser } from "@/interface/project.interface";
import type {
  CreateTaskInput,
  Task,
  TaskAIResult,
  TaskChecklist,
  TaskDetail,
  TaskStatusHistory,
} from "@/interface/task.interface";
import { findMockProject, canViewMockProject } from "./projects";
import { findMockUser } from "./users";

const TASKS_KEY = "cakra-orkestra:mock-tasks:v1";
const adminId = "00000000-0000-4000-8000-000000000001";
const memberId = "00000000-0000-4000-8000-000000000002";
const project1Id = "00000000-0000-4000-8000-000000000201";
const project2Id = "00000000-0000-4000-8000-000000000202";
const timestamp = "2026-11-19T00:00:00.000Z";

export type MockTask = Omit<
  TaskDetail,
  "project" | "assignee" | "checklist_total" | "checklist_completed"
>;

function makeChecklist(taskId: string, title: string, order: number, now: string): TaskChecklist {
  return {
    id: crypto.randomUUID(),
    task_id: taskId,
    title,
    is_completed: false,
    sort_order: order,
    completed_at: null,
    created_at: now,
    updated_at: now,
  };
}

function makeHistory(taskId: string, actor: string, now: string): TaskStatusHistory {
  return {
    id: crypto.randomUUID(),
    task_id: taskId,
    previous_status: null,
    current_status: "OPEN",
    reason: null,
    changed_by: actor,
    created_at: now,
  };
}

function makeInitial(
  taskId: string,
  input: Pick<MockTask, "title" | "description" | "checklists">,
  now: string,
): TaskAIResult {
  return {
    id: crypto.randomUUID(),
    task_id: taskId,
    type: "INITIAL",
    status: "PENDING",
    tier: null,
    points: null,
    reasoning: null,
    model_name: null,
    error_message: null,
    evaluated_at: null,
    input_snapshot: {
      title: input.title,
      description: input.description,
      checklists: input.checklists.map(({ title, is_completed }) => ({ title, is_completed })),
    },
    created_at: now,
    updated_at: now,
  };
}

function buildTask(
  input: CreateTaskInput,
  creator: string,
  assignee: string,
  code: string,
  now: string,
  id: string = crypto.randomUUID(),
): MockTask {
  const checklists = input.checklists.map((item, i) => makeChecklist(id, item.title, i, now));
  const fields = { title: input.title, description: input.description, checklists };
  return {
    id,
    code,
    ...fields,
    project_id: input.project_id,
    assignee_id: assignee,
    created_by: creator,
    task_status: "OPEN",
    task_type: input.task_type,
    task_category: input.task_category,
    blocker_reason: null,
    due_date: input.due_date,
    status_changed_at: now,
    approved_at: null,
    approved_by: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    status_histories: [makeHistory(id, creator, now)],
    evidences: [],
    ai_results: { initial: makeInitial(id, fields, now), final: null },
  };
}

function seedTasks(): MockTask[] {
  const make = (
    n: number,
    project_id: string,
    assignee: string,
    title: string,
    description: string,
    items: string[],
  ) =>
    buildTask(
      {
        project_id,
        title,
        description,
        task_type: "REGULAR",
        task_category: "CLIENT",
        due_date: null,
        checklists: items.map((title) => ({ title })),
      },
      adminId,
      assignee,
      `TSK-${String(n).padStart(3, "0")}`,
      timestamp,
      `00000000-0000-4000-8000-00000000030${n}`,
    );
  return [
    make(1, project1Id, memberId, "Implement session API", "Build session management endpoints.", [
      "Create session",
      "Delete session",
      "Get session detail",
    ]),
    make(
      2,
      project1Id,
      adminId,
      "Fix authentication flow",
      "Review token refresh and error handling.",
      ["Audit token refresh", "Handle expired sessions"],
    ),
    make(
      3,
      project2Id,
      adminId,
      "Improve evaluation pipeline",
      "Review the agent evaluation pipeline.",
      ["Review inputs", "Update evaluation contract"],
    ),
  ];
}

export function getMockTasks(): MockTask[] {
  const raw = localStorage.getItem(TASKS_KEY);
  if (raw !== null) return JSON.parse(raw) as MockTask[];
  const tasks = seedTasks();
  saveMockTasks(tasks); // persist generated child IDs on the first read
  return tasks;
}

function saveMockTasks(tasks: MockTask[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function findMockTask(id: string) {
  return getMockTasks().find((task) => task.id === id && !task.deleted_at);
}

export function canViewMockTask(task: MockTask, user: AuthUser) {
  return user.role === "ADMIN" || task.assignee_id === user.id;
}

export function canAssignMockTask(projectId: string, assigneeId: string, actor: AuthUser) {
  const project = findMockProject(projectId);
  const user = findMockUser(assigneeId);
  if (!project || !user || !user.is_active || project.status !== "ACTIVE") return false;
  if (actor.role !== "ADMIN" && (assigneeId !== actor.id || !canViewMockProject(project, actor)))
    return false;
  return (
    (actor.role === "ADMIN" && actor.id === assigneeId) ||
    project.owner_id === assigneeId ||
    project.member_ids.includes(assigneeId)
  );
}

export function hasUnfinishedMockTasks(projectId: string, assigneeId?: string) {
  return getMockTasks().some(
    (task) =>
      !task.deleted_at &&
      task.project_id === projectId &&
      task.task_status !== "DONE" &&
      (!assigneeId || task.assignee_id === assigneeId),
  );
}

function publicUser(user: ProjectUser): ProjectUser {
  const { id, name, username, avatar_url, is_active } = user;
  return { id, name, username, avatar_url, is_active };
}

export function toPublicTask(task: MockTask): Task {
  const project = findMockProject(task.project_id);
  const assignee = findMockUser(task.assignee_id);
  if (!project || !assignee) throw new Error("Task references a missing project or user");
  const {
    checklists,
    status_histories: _histories,
    evidences: _evidences,
    ai_results: _results,
    ...fields
  } = task;
  // Explicitly omit child collections without returning internal user data.
  void _histories;
  void _evidences;
  void _results;
  return {
    ...fields,
    project: { id: project.id, code: project.code, name: project.name, status: project.status },
    assignee: publicUser(assignee),
    checklist_total: checklists.length,
    checklist_completed: checklists.filter((item) => item.is_completed).length,
  };
}

export function toPublicTaskDetail(task: MockTask): TaskDetail {
  return {
    ...toPublicTask(task),
    checklists: [...task.checklists].sort((a, b) => a.sort_order - b.sort_order),
    status_histories: task.status_histories,
    evidences: task.evidences,
    ai_results: task.ai_results,
  };
}

export function createMockTask(input: CreateTaskInput, creator: string, assignee: string) {
  const tasks = getMockTasks();
  const next = Math.max(0, ...tasks.map((task) => Number(task.code.slice(4)))) + 1;
  const task = buildTask(
    input,
    creator,
    assignee,
    `TSK-${String(next).padStart(3, "0")}`,
    new Date().toISOString(),
  );
  saveMockTasks([task, ...tasks]);
  return task;
}

export function updateMockTask(id: string, updater: (task: MockTask, now: string) => MockTask) {
  const tasks = getMockTasks();
  const index = tasks.findIndex((task) => task.id === id && !task.deleted_at);
  if (index < 0) return null;
  const now = new Date().toISOString();
  const updated = { ...updater(tasks[index], now), updated_at: now };
  tasks[index] = updated;
  saveMockTasks(tasks);
  return updated;
}

export function appendMockChecklist(task: MockTask, title: string, now: string) {
  const nextOrder = Math.max(-1, ...task.checklists.map((item) => item.sort_order)) + 1;
  return [...task.checklists, makeChecklist(task.id, title, nextOrder, now)];
}

export function orderMockChecklists(
  items: TaskChecklist[],
  ids: string[],
  now: string,
): TaskChecklist[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids.map((id, sort_order) => {
    const item = byId.get(id);
    if (!item) throw new Error("Invalid checklist order");
    return item.sort_order === sort_order ? item : { ...item, sort_order, updated_at: now };
  });
}
