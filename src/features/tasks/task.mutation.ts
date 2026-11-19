import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  TaskDetail,
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskAssigneeInput,
  CreateTaskChecklistInput,
  UpdateTaskChecklistInput,
  OrderTaskChecklistsInput,
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
} from "./task.api";
import { taskKeys } from "./task.query";

async function syncTask(queryClient: QueryClient, task: TaskDetail) {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: taskKeys.detail(task.id) }),
    queryClient.cancelQueries({ queryKey: taskKeys.checklists(task.id) }),
  ]);
  queryClient.setQueryData(taskKeys.detail(task.id), task);
  queryClient.setQueryData(taskKeys.checklists(task.id), task.checklists);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: taskKeys.lists }),
    queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) }),
    queryClient.invalidateQueries({ queryKey: taskKeys.checklists(task.id) }),
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
    mutationFn: (input: UpdateTaskInput) => updateTask(id, input),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useDeleteTask(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => deleteTask(id),
    onSuccess: async () => {
      await Promise.all([
        client.cancelQueries({ queryKey: taskKeys.detail(id) }),
        client.cancelQueries({ queryKey: taskKeys.checklists(id) }),
      ]);
      client.removeQueries({ queryKey: taskKeys.detail(id) });
      client.removeQueries({ queryKey: taskKeys.checklists(id) });
      await client.invalidateQueries({ queryKey: taskKeys.lists });
    },
  });
}
export function useUpdateTaskAssignee(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTaskAssigneeInput) => updateTaskAssignee(id, input),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useCreateTaskChecklist(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskChecklistInput) => createTaskChecklist(id, input),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useUpdateTaskChecklist(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: UpdateTaskChecklistInput }) =>
      updateTaskChecklist(id, itemId, input),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useDeleteTaskChecklist(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteTaskChecklist(id, itemId),
    onSuccess: (task) => syncTask(client, task),
  });
}
export function useOrderTaskChecklists(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: OrderTaskChecklistsInput) => orderTaskChecklists(id, input),
    onSuccess: (task) => syncTask(client, task),
  });
}
