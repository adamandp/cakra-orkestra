import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  TaskDetail,
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskAssigneeInput,
  CreateTaskChecklistInput,
  UpdateTaskChecklistInput,
  OrderTaskChecklistsInput,
  BlockTaskInput,
  CreateTaskLinkInput,
} from "@/interface/task.interface";
import {
  createTask,
  updateTask,
  deleteTask,
  updateTaskAssignee,
  createTaskChecklist,
  updateTaskChecklist,
  deleteTaskChecklist,
  orderTaskChecklists,
  startTask,
  blockTask,
  resumeTask,
  submitTask,
  createTaskLink,
  uploadTaskEvidence,
  deleteTaskEvidence,
} from "./task.api";
import { taskKeys } from "./task.query";

async function syncTask(queryClient: QueryClient, task: TaskDetail) {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: taskKeys.detail(task.id) }),
    queryClient.cancelQueries({ queryKey: taskKeys.checklists(task.id) }),
    queryClient.cancelQueries({ queryKey: taskKeys.evidences(task.id) }),
    queryClient.cancelQueries({ queryKey: taskKeys.statusHistories(task.id) }),
  ]);
  queryClient.setQueryData(taskKeys.detail(task.id), task);
  queryClient.setQueryData(taskKeys.checklists(task.id), task.checklists);
  queryClient.setQueryData(taskKeys.evidences(task.id), task.evidences);
  queryClient.setQueryData(taskKeys.statusHistories(task.id), task.status_histories);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: taskKeys.lists }),
    queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) }),
    queryClient.invalidateQueries({ queryKey: taskKeys.checklists(task.id) }),
    queryClient.invalidateQueries({ queryKey: taskKeys.evidences(task.id) }),
    queryClient.invalidateQueries({ queryKey: taskKeys.statusHistories(task.id) }),
  ]);
}

export function useCreateTask() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useUpdateTask(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: (input: UpdateTaskInput) => updateTask(id, input),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useDeleteTask(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: () => deleteTask(id),
    onSuccess: async () => {
      await Promise.all([
        client.cancelQueries({ queryKey: taskKeys.detail(id) }),
        client.cancelQueries({ queryKey: taskKeys.checklists(id) }),
        client.cancelQueries({ queryKey: taskKeys.evidences(id) }),
        client.cancelQueries({ queryKey: taskKeys.statusHistories(id) }),
      ]);
      client.removeQueries({ queryKey: taskKeys.detail(id) });
      client.removeQueries({ queryKey: taskKeys.checklists(id) });
      client.removeQueries({ queryKey: taskKeys.evidences(id) });
      client.removeQueries({ queryKey: taskKeys.statusHistories(id) });
      await client.invalidateQueries({ queryKey: taskKeys.lists });
    },
  });
}
export function useUpdateTaskAssignee(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: (input: UpdateTaskAssigneeInput) => updateTaskAssignee(id, input),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useCreateTaskChecklist(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: (input: CreateTaskChecklistInput) => createTaskChecklist(id, input),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useUpdateTaskChecklist(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: ({ itemId, input }: { itemId: string; input: UpdateTaskChecklistInput }) =>
      updateTaskChecklist(id, itemId, input),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useDeleteTaskChecklist(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: (itemId: string) => deleteTaskChecklist(id, itemId),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useOrderTaskChecklists(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: (input: OrderTaskChecklistsInput) => orderTaskChecklists(id, input),
    onSuccess: (task) => syncTask(client, task),
  });
}

export function useStartTask(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: () => startTask(id),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useBlockTask(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: (input: BlockTaskInput) => blockTask(id, input),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useResumeTask(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: () => resumeTask(id),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useSubmitTask(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: () => submitTask(id),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useCreateTaskLink(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: (input: CreateTaskLinkInput) => createTaskLink(id, input),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useUploadTaskEvidence(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: ({ file, title }: { file: File; title?: string }) =>
      uploadTaskEvidence(id, file, title),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useDeleteTaskEvidence(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: taskKeys.mutations(id),
    mutationFn: (evidenceId: string) => deleteTaskEvidence(id, evidenceId),
    onSuccess: (task) => syncTask(client, task),
  });
}
