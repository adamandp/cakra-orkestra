import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RejectTaskInput } from "@/interface/task.interface";
import { approveTask, rejectTask, retryTaskAIResult } from "./task-ai-result.api";
import { taskKeys } from "./task.query";
import { syncTask } from "./task.mutation";

export function useApproveTask(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: () => approveTask(id),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useRejectTask(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: (input: RejectTaskInput) => rejectTask(id, input),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useRetryTaskAIResult(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: (resultId: string) => retryTaskAIResult(id, resultId),
    onSuccess: (task) => syncTask(client, task),
  });
}
