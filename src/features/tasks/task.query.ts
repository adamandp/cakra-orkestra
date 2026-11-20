import { useEffect } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { scoreKeys } from "@/features/scores/score.query";
import { AI_RESULT_POLL_INTERVAL, isAssessmentRunning } from "./task-ai-result.constants";
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
  aiResults: (id: string) => ["tasks", "ai-results", id] as const,
  aiResult: (id: string, resultId: string) => ["tasks", "ai-results", id, resultId] as const,
};
export function useTasks(params: TaskListParams) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryKey: taskKeys.list(params),
    queryFn: ({ signal }) => getTasks(params, signal),
    // No new list-response fields; approved pending rows may still be processing or failed.
    refetchInterval: (query) =>
      query.state.data?.items.some((task) => task.task_status === "PENDING" && task.approved_at)
        ? 5000
        : false,
  });
}
export function useTask(id: string) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: ({ signal }) => getTask(id, signal),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const results = query.state.data?.ai_results;
      return isAssessmentRunning(results?.initial) || isAssessmentRunning(results?.final)
        ? AI_RESULT_POLL_INTERVAL
        : false;
    },
  });
  const initialUpdatedAt = query.data?.ai_results.initial.updated_at;
  const finalUpdatedAt = query.data?.ai_results.final?.updated_at;
  const doneAt = query.data?.task_status === "DONE" ? query.data.status_changed_at : undefined;
  useEffect(() => {
    if (initialUpdatedAt || finalUpdatedAt) {
      void client.invalidateQueries({ queryKey: taskKeys.aiResults(id) });
      void client.invalidateQueries({ queryKey: scoreKeys.all });
    }
  }, [client, id, initialUpdatedAt, finalUpdatedAt]);
  useEffect(() => {
    if (doneAt) {
      void client.invalidateQueries({ queryKey: taskKeys.lists });
      void client.invalidateQueries({ queryKey: taskKeys.statusHistories(id) });
      void client.invalidateQueries({ queryKey: scoreKeys.all });
    }
  }, [client, id, doneAt]);
  return query;
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
