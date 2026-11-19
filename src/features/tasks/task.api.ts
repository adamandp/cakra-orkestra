import axios from "axios";
import { axiosInstance } from "@/lib/axios";
import type { WebResponse } from "@/interface/common.interface";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskDetail,
  TaskListParams,
  TaskListResponse,
  UpdateTaskAssigneeInput,
  TaskChecklist,
  CreateTaskChecklistInput,
  UpdateTaskChecklistInput,
  OrderTaskChecklistsInput,
} from "@/interface/task.interface";

export async function getTasks(params: TaskListParams, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<TaskListResponse>>("/tasks", {
    params,
    signal,
  });
  return data.data;
}
export async function getTask(id: string, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<TaskDetail>>(`/tasks/${id}`, { signal });
  return data.data;
}
export async function createTask(input: CreateTaskInput) {
  const { data } = await axiosInstance.post<WebResponse<TaskDetail>>("/tasks", input);
  return data.data;
}
export async function updateTask(id: string, input: UpdateTaskInput) {
  const { data } = await axiosInstance.patch<WebResponse<TaskDetail>>(`/tasks/${id}`, input);
  return data.data;
}
export async function deleteTask(id: string) {
  await axiosInstance.delete<WebResponse<null>>(`/tasks/${id}`);
}
export async function updateTaskAssignee(id: string, input: UpdateTaskAssigneeInput) {
  const { data } = await axiosInstance.patch<WebResponse<TaskDetail>>(
    `/tasks/${id}/assignee`,
    input,
  );
  return data.data;
}
export async function getTaskChecklists(id: string, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<TaskChecklist[]>>(
    `/tasks/${id}/checklists`,
    { signal },
  );
  return data.data;
}
export async function createTaskChecklist(id: string, input: CreateTaskChecklistInput) {
  const { data } = await axiosInstance.post<WebResponse<TaskDetail>>(
    `/tasks/${id}/checklists`,
    input,
  );
  return data.data;
}
export async function updateTaskChecklist(
  id: string,
  itemId: string,
  input: UpdateTaskChecklistInput,
) {
  const { data } = await axiosInstance.patch<WebResponse<TaskDetail>>(
    `/tasks/${id}/checklists/${itemId}`,
    input,
  );
  return data.data;
}
export async function deleteTaskChecklist(id: string, itemId: string) {
  const { data } = await axiosInstance.delete<WebResponse<TaskDetail>>(
    `/tasks/${id}/checklists/${itemId}`,
  );
  return data.data;
}
export async function orderTaskChecklists(id: string, input: OrderTaskChecklistsInput) {
  const { data } = await axiosInstance.put<WebResponse<TaskDetail>>(
    `/tasks/${id}/checklists/order`,
    input,
  );
  return data.data;
}
export function getTaskError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || "Unable to reach the server. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
