import { useQuery } from "@tanstack/react-query";
import type { TaskListParams } from "@/interface/task.interface";
import { getTask, getTaskChecklists, getTasks } from "./task.api";

export const taskKeys = {
  all: ["tasks"] as const,
  lists: ["tasks", "list"] as const,
  list: (params: TaskListParams) => ["tasks", "list", params] as const,
  detail: (id: string) => ["tasks", "detail", id] as const,
  checklists: (id: string) => ["tasks", "checklists", id] as const,
};
export function useTasks(params: TaskListParams) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: ({ signal }) => getTasks(params, signal),
  });
}
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: ({ signal }) => getTask(id, signal),
    enabled: Boolean(id),
  });
}
export function useTaskChecklists(id: string) {
  return useQuery({
    queryKey: taskKeys.checklists(id),
    queryFn: ({ signal }) => getTaskChecklists(id, signal),
    enabled: Boolean(id),
  });
}
