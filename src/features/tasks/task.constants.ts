import type {
  TaskStatus,
  TaskType,
  TaskCategory,
  TaskWorkflowAction,
} from "@/interface/task.interface";

export const taskStatusLabels: Record<TaskStatus, string> = {
  OPEN: "Open",
  BLOCKED: "Blocked",
  PROGRESS: "In progress",
  PENDING: "Waiting approval",
  DONE: "Done",
};
export const taskTypeLabels: Record<TaskType, string> = {
  REGULAR: "Regular",
  OVERTIME: "Overtime",
};
export const taskCategoryLabels: Record<TaskCategory, string> = {
  CLIENT: "Client",
  INITIATIVE: "Initiative",
  FIXING: "Fixing",
};
export const TASK_PAGE_SIZE = 20;
export function isEditableTask(status: TaskStatus) {
  return status === "OPEN" || status === "PROGRESS" || status === "BLOCKED";
}

export const taskWorkflowTransitions = {
  start: { from: "OPEN", to: "PROGRESS" },
  block: { from: "PROGRESS", to: "BLOCKED" },
  resume: { from: "BLOCKED", to: "PROGRESS" },
  submit: { from: "PROGRESS", to: "PENDING" },
} as const satisfies Record<TaskWorkflowAction, { from: TaskStatus; to: TaskStatus }>;

export const TASK_EVIDENCE_MAX_BYTES = 20 * 1024 * 1024;
export const TASK_EVIDENCE_UPLOAD_TTL_MS = 10 * 60 * 1000;
