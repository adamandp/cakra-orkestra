import type { TaskStatus, TaskType, TaskCategory } from "@/interface/task.interface";

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
