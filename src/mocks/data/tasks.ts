import { notify } from "./notifications";
import type { AuthUser } from "@/interface/auth.interface";
import type { ProjectUser } from "@/interface/project.interface";
import type {
  CreateTaskInput,
  Task,
  TaskAIResult,
  TaskAssessmentSummary,
  TaskChecklist,
  TaskDetail,
  TaskListItem,
  TaskStatusHistory,
  TaskWorkflowAction,
} from "@/interface/task.interface";
import { taskWorkflowTransitions } from "@/features/tasks/task.constants";
import { findMockProject, canViewMockProject } from "./projects";
import { findMockUser } from "./users";
import { advanceMockTaskAssessments, makeMockAIResult } from "./task-ai-results";

const TASKS_KEY = "cakra-orkestra:mock-tasks:v1";
const adminId = "00000000-0000-4000-8000-000000000001";
const memberId = "00000000-0000-4000-8000-000000000002";
const project1Id = "00000000-0000-4000-8000-000000000201";
const project2Id = "00000000-0000-4000-8000-000000000202";
const timestamp = "2026-11-19T00:00:00.000Z";

export type MockTask = Omit<
  TaskDetail,
  "project" | "assignee" | "checklist_total" | "checklist_completed"
> & { retired_evidence_ids?: string[] };

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
    ai_results: { initial: makeMockAIResult(id, "INITIAL", fields, now), final: null },
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

function extraDemoTasks(existing: MockTask[], team = false): MockTask[] {
  const baseExamples = [
    ["Design responsive navigation", "OPEN"],
    ["Implement document upload", "PROGRESS"],
    ["Resolve vector indexing timeout", "BLOCKED"],
    ["Review search relevance", "PENDING"],
    ["Complete API integration", "DONE"],
    ["Build status history timeline", "OPEN"],
    ["Add accessibility coverage", "PROGRESS"],
    ["Investigate deployment failures", "BLOCKED"],
    ["Validate evaluation results", "PENDING"],
    ["Finalize dashboard metrics", "DONE"],
    ["Review logging configuration", "OPEN"],
    ["Improve retrieval latency", "PROGRESS"],
  ] as const;
  const members = team ? findMockProject(project1Id)?.member_ids ?? [] : [];
  const topics = ["Search results", "Query parser", "Ranking pipeline", "Filter panel", "Intent resolver", "API gateway", "Search analytics", "Document index", "Audit log", "Session cache", "Access control", "Error handling", "Mobile view", "Evaluation suite", "Retrieval service", "Data pipeline", "Monitoring", "Release workflow", "Result cards", "Search suggestions"];
  const examples = team ? members.flatMap((_, i) => Array.from({length: 3 + i % 3}, (_, j) => [
    `${["Implement", "Test", "Review", "Optimize", "Document"][j]} ${topics[i % topics.length]}`,
    baseExamples[(i + j) % baseExamples.length][1],
  ] as const)) : baseExamples;
  const assignments = members.flatMap((id, i) => Array.from({length: 3 + i % 3}, () => id));
  let next = Math.max(0, ...existing.map((task) => Number(task.code.slice(4)))) + 1;
  return examples.flatMap(([title, status], index) => {
    const id = `00000000-0000-4000-8000-${String((team ? 1000 : 410) + index).padStart(12, "0")}`;
    if (existing.some((task) => task.id === id)) return [];
    const projectId = team ? project1Id :
      index % 2 === 0
        ? "00000000-0000-4000-8000-000000000204"
        : "00000000-0000-4000-8000-000000000205";
    if (!findMockProject(projectId)) return [];
    const task = buildTask(
      {
        project_id: projectId,
        title,
        description: `Demo task: ${title}. Validate the implementation and document the result before submission.`,
        task_type: "REGULAR",
        task_category: "CLIENT",
        due_date: "2026-11-30",
        checklists: [
          { title: "Implement changes" },
          { title: "Verify behavior" },
          { title: "Document results" },
        ],
      },
      adminId,
      team ? assignments[index] : index < 10 ? adminId : memberId,
      `TSK-${String(next++).padStart(3, "0")}`,
      timestamp,
      id,
    );
    if (status !== "OPEN") {
      task.task_status = status;
      task.status_histories.push({
        ...makeHistory(id, task.assignee_id, timestamp),
        previous_status: "OPEN",
        current_status: "PROGRESS",
      });
      if (status !== "PROGRESS")
        task.status_histories.push({
          ...makeHistory(id, task.assignee_id, timestamp),
          previous_status: "PROGRESS",
          current_status: status === "DONE" ? "PENDING" : status,
        });
      if (status === "BLOCKED") task.blocker_reason = "Waiting for the integration environment.";
      if (status === "PENDING" || status === "DONE") {
        task.checklists = task.checklists.map((item) => ({
          ...item,
          is_completed: true,
          completed_at: timestamp,
        }));
        task.evidences = [
          {
            id: crypto.randomUUID(),
            task_id: id,
            type: "LINK",
            title: "Example review evidence",
            url: "https://example.com/",
            object_key: null,
            file_name: null,
            mime_type: null,
            file_size: null,
            created_at: timestamp,
            updated_at: timestamp,
          },
        ];
      }
      if (status === "DONE") {
        task.approved_at = timestamp;
        task.approved_by = adminId;
        task.ai_results.final = {
          ...makeMockAIResult(id, "FINAL", task, timestamp),
          status: "COMPLETED",
          tier: "CORE",
          points: 5,
          reasoning: "Simulated demo assessment.",
          model_name: "mock-rubric-v1",
          evaluated_at: timestamp,
        };
        task.status_histories.push({
          ...makeHistory(id, adminId, timestamp),
          previous_status: "PENDING",
          current_status: "DONE",
        });
      }
    }
    return [task];
  });
}

function focusDemoTasks(existing: MockTask[]): MockTask[] {
  const examples = [
    ["Fix overdue upload validation", "PROGRESS", -2, 204],
    ["Review revised search results", "PROGRESS", 1, 205],
    ["Resolve final assessment failure", "PENDING", 2, 204],
    ["Follow up on completed project", "OPEN", 3, 203],
    ["Prepare next sprint documentation", "OPEN", 7, 205],
    ["Ship completed accessibility fixes", "DONE", -1, 204],
  ] as const;
  let next = Math.max(0, ...existing.map((t) => Number(t.code.slice(4)))) + 1;
  const now = Date.now();
  const date = (days: number) => new Date(now + days * 86400000).toISOString();
  return [adminId, memberId].flatMap((actor, group) =>
    examples.flatMap(([title, status, due, project], i) => {
      const id = `00000000-0000-4000-8000-000000000${450 + group * 10 + i}`;
      const projectId = `00000000-0000-4000-8000-000000000${project}`;
      if (existing.some((t) => t.id === id) || !findMockProject(projectId)) return [];
      const task = buildTask(
        {
          project_id: projectId,
          title: "[Demo] " + title,
          description: "Example My Focus workflow for testing.",
          task_type: "REGULAR",
          task_category: "CLIENT",
          due_date: date(due).slice(0, 10),
          checklists: [
            { title: "Implement changes" },
            { title: "Verify behavior" },
            { title: "Document results" },
          ],
        },
        adminId,
        actor,
        `TSK-${String(next++).padStart(3, "0")}`,
        date(-4),
        id,
      );
      task.task_status = status;
      task.status_changed_at = date(-1);
      if (status !== "OPEN")
        task.status_histories.push({
          ...makeHistory(id, actor, date(-3)),
          previous_status: "OPEN",
          current_status: "PROGRESS",
        });
      if (status === "PROGRESS")
        task.checklists[0] = { ...task.checklists[0], is_completed: true, completed_at: date(-2) };
      if (i === 1) {
        task.status_histories.push({
          ...makeHistory(id, actor, date(-2)),
          previous_status: "PROGRESS",
          current_status: "PENDING",
        });
        task.status_histories.push({
          ...makeHistory(id, adminId, date(-1)),
          previous_status: "PENDING",
          current_status: "PROGRESS",
          reason: "Add stronger regression coverage and attach the test results.",
        });
      }
      if (status === "PENDING" || status === "DONE") {
        task.status_histories.push({
          ...makeHistory(id, actor, date(-2)),
          previous_status: "PROGRESS",
          current_status: "PENDING",
        });
        task.checklists = task.checklists.map((c) => ({
          ...c,
          is_completed: true,
          completed_at: date(-2),
        }));
        task.evidences = [
          {
            id: crypto.randomUUID(),
            task_id: id,
            type: "LINK",
            title: "Demo test report",
            url: "https://example.com/",
            object_key: null,
            file_name: null,
            mime_type: null,
            file_size: null,
            created_at: date(-2),
            updated_at: date(-2),
          },
        ];
        task.approved_at = date(-1);
        task.approved_by = adminId;
        task.ai_results.final = {
          ...makeMockAIResult(id, "FINAL", task, date(-1)),
          status: status === "DONE" ? "COMPLETED" : "FAILED",
          tier: status === "DONE" ? "CORE" : null,
          points: status === "DONE" ? 5 : null,
          error_message: status === "DONE" ? null : "Demo assessment timeout",
          evaluated_at: date(-1),
        };
        if (status === "DONE")
          task.status_histories.push({
            ...makeHistory(id, adminId, date(-1)),
            previous_status: "PENDING",
            current_status: "DONE",
          });
      }
      return [task];
    }),
  );
}

export function getMockTasks(): MockTask[] {
  const raw = localStorage.getItem(TASKS_KEY);
  const tasks = raw === null ? seedTasks() : (JSON.parse(raw) as MockTask[]);
  if (!localStorage.getItem("cakra-orkestra:demo-tasks:v2")) {
    tasks.push(...extraDemoTasks(tasks));
    saveMockTasks(tasks);
    localStorage.setItem("cakra-orkestra:demo-tasks:v2", "1");
  }
  if (!localStorage.getItem("cakra-orkestra:focus-demo:v1")) {
    tasks.push(...focusDemoTasks(tasks));
    saveMockTasks(tasks);
    localStorage.setItem("cakra-orkestra:focus-demo:v1", "1");
  }
  if (!localStorage.getItem("cakra-orkestra:demo-team-tasks:v1")) {
    tasks.push(...extraDemoTasks(tasks, true));
    saveMockTasks(tasks);
    localStorage.setItem("cakra-orkestra:demo-team-tasks:v1", "1");
  }
  const now = Date.now();
  const updated = tasks.map((task) => {
    const next = advanceMockTaskAssessments(task, now);
    if (!task.deleted_at) for (const key of ["initial", "final"] as const) {
      if (next.ai_results[key]?.status === "COMPLETED" && task.ai_results[key]?.status !== "COMPLETED") {
        notify([task.assignee_id], null, "ASSESSMENT_COMPLETED", key === "initial" ? "Initial assessment completed" : "Final assessment completed", task.title, "task", task.id);
      }
    }
    return next;
  });
  if (raw === null || updated.some((task, index) => task !== tasks[index])) saveMockTasks(updated);
  return updated;
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

function publicTaskBase(task: MockTask): Task {
  const project = findMockProject(task.project_id);
  const assignee = findMockUser(task.assignee_id);
  if (!project || !assignee) throw new Error("Task references a missing project or user");
  const {
    checklists,
    status_histories: _histories,
    evidences: _evidences,
    ai_results: _results,
    retired_evidence_ids: _retiredEvidenceIds,
    ...fields
  } = task;
  // Explicitly omit child collections without returning internal user data.
  void _histories;
  void _evidences;
  void _results;
  void _retiredEvidenceIds;
  return {
    ...fields,
    project: { id: project.id, code: project.code, name: project.name, status: project.status },
    assignee: publicUser(assignee),
    checklist_total: checklists.length,
    checklist_completed: checklists.filter((item) => item.is_completed).length,
  };
}

function assessmentSummary(result: TaskAIResult): TaskAssessmentSummary {
  const { status, tier, points } = result;
  return { status, tier, points };
}

// Existing list handler can keep tasks.map(toPublicTask).
export function toPublicTask(task: MockTask): TaskListItem {
  const { initial, final } = task.ai_results;
  const revision = [...task.status_histories]
    .reverse()
    .find((item) => item.previous_status === "PENDING" && item.current_status === "PROGRESS");
  return {
    ...publicTaskBase(task),
    initial_assessment: assessmentSummary(initial),
    final_assessment: final ? assessmentSummary(final) : null,
    evidence_count: task.evidences.length,
    revision_count: task.status_histories.filter(
      (h) => h.previous_status === "PENDING" && h.current_status === "PROGRESS",
    ).length,
    work_duration_seconds: Math.floor(
      task.status_histories.reduce((total, h, i, all) => {
        if (h.current_status !== "PROGRESS") return total;
        const end = all[i + 1]?.created_at;
        return total + Math.max(0, (end ? Date.parse(end) : Date.now()) - Date.parse(h.created_at));
      }, 0) / 1000,
    ),
    revision_reason:
      task.task_status === "PROGRESS" || task.task_status === "BLOCKED"
        ? (revision?.reason ?? null)
        : null,
  };
}

export function toPublicTaskDetail(task: MockTask): TaskDetail {
  return {
    ...publicTaskBase(task),
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

// Call only after the handler has validated authorization and the transition.
export function transitionMockTask(
  id: string,
  action: TaskWorkflowAction,
  actorId: string,
  reason: string | null = null,
) {
  return updateMockTask(id, (task, now) => {
    const { to } = taskWorkflowTransitions[action];
    const history: TaskStatusHistory = {
      id: crypto.randomUUID(),
      task_id: task.id,
      previous_status: task.task_status,
      current_status: to,
      reason,
      changed_by: actorId,
      created_at: now,
    };
    return {
      ...task,
      task_status: to,
      blocker_reason: action === "block" ? reason : null,
      status_changed_at: now,
      status_histories: [...task.status_histories, history],
    };
  });
}
