import { useQuery } from "@tanstack/react-query";
import type { TaskListParams } from "@/interface/task.interface";
import {
  getTask,
  getTaskChecklists,
  getTasks,
  getTaskEvidences,
  getTaskStatusHistories,
} from "./task.api";

export const taskKeys = {
  all: ["tasks"] as const,
  lists: ["tasks", "list"] as const,
  list: (params: TaskListParams) => ["tasks", "list", params] as const,
  detail: (id: string) => ["tasks", "detail", id] as const,
  mutations: (id: string) => ["tasks", "mutation", id] as const,
  evidences: (id: string) => ["tasks", "evidences", id] as const,
  statusHistories: (id: string) => ["tasks", "status-histories", id] as const,
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

export function useTaskEvidences(id: string) {
  return useQuery({
    queryKey: taskKeys.evidences(id),
    queryFn: ({ signal }) => getTaskEvidences(id, signal),
    enabled: Boolean(id),
  });
}
export function useTaskStatusHistories(id: string) {
  return useQuery({
    queryKey: taskKeys.statusHistories(id),
    queryFn: ({ signal }) => getTaskStatusHistories(id, signal),
    enabled: Boolean(id),
  });
}
