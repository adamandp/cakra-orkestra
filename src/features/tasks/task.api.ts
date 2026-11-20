import axios from "axios";
import { axiosInstance } from "@/lib/axios";
import type { WebResponse } from "@/interface/common.interface";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskDescriptionInput,
  TaskDetail,
  TaskListParams,
  TaskListResponse,
  UpdateTaskAssigneeInput,
  TaskChecklist,
  CreateTaskChecklistInput,
  UpdateTaskChecklistInput,
  OrderTaskChecklistsInput,
  BlockTaskInput,
  TaskEvidence,
  TaskStatusHistory,
  CreateTaskLinkInput,
  UpdateTaskEvidenceInput,
  PresignTaskEvidenceInput,
  PresignTaskEvidenceResponse,
  ConfirmTaskEvidenceInput,
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
export async function updateTaskDescription(id: string, input: UpdateTaskDescriptionInput) {
  const { data } = await axiosInstance.patch<WebResponse<TaskDetail>>(`/tasks/${id}/description`, input);
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

export async function startTask(id: string) {
  const { data } = await axiosInstance.post<WebResponse<TaskDetail>>(`/tasks/${id}/start`, {});
  return data.data;
}
export async function blockTask(id: string, input: BlockTaskInput) {
  const { data } = await axiosInstance.post<WebResponse<TaskDetail>>(`/tasks/${id}/block`, input);
  return data.data;
}
export async function resumeTask(id: string) {
  const { data } = await axiosInstance.post<WebResponse<TaskDetail>>(`/tasks/${id}/resume`, {});
  return data.data;
}
export async function submitTask(id: string) {
  const { data } = await axiosInstance.post<WebResponse<TaskDetail>>(`/tasks/${id}/submit`, {});
  return data.data;
}
export async function getTaskStatusHistories(id: string, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<TaskStatusHistory[]>>(
    `/tasks/${id}/status-histories`,
    { signal },
  );
  return data.data;
}
export async function getTaskEvidences(id: string, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<TaskEvidence[]>>(`/tasks/${id}/evidences`, {
    signal,
  });
  return data.data;
}
export async function createTaskLink(id: string, input: CreateTaskLinkInput) {
  const { data } = await axiosInstance.post<WebResponse<TaskDetail>>(
    `/tasks/${id}/evidences/link`,
    input,
  );
  return data.data;
}
export async function presignTaskEvidence(id: string, input: PresignTaskEvidenceInput) {
  const { data } = await axiosInstance.post<WebResponse<PresignTaskEvidenceResponse>>(
    `/tasks/${id}/evidences/presign`,
    input,
  );
  return data.data;
}
export async function confirmTaskEvidence(id: string, input: ConfirmTaskEvidenceInput) {
  const { data } = await axiosInstance.post<WebResponse<TaskDetail>>(
    `/tasks/${id}/evidences/confirm`,
    input,
  );
  return data.data;
}
export async function uploadTaskEvidence(id: string, file: File, title?: string) {
  const mime = file.type || "application/octet-stream";
  const presigned = await presignTaskEvidence(id, {
    file_name: file.name,
    mime_type: mime,
    file_size: file.size,
  });
  // Use a separate HTTP client: never forward API access tokens to object storage.
  await axios.put(presigned.upload_url, file, {
    headers: { "Content-Type": mime, Authorization: null },
    withCredentials: false,
  });
  return confirmTaskEvidence(id, { object_key: presigned.object_key, title });
}
export async function updateTaskEvidence(id: string, evidenceId: string, input: UpdateTaskEvidenceInput) {
  const { data } = await axiosInstance.patch<WebResponse<TaskDetail>>(`/tasks/${id}/evidences/${evidenceId}`, input);
  return data.data;
}
export async function deleteTaskEvidence(id: string, evidenceId: string) {
  const { data } = await axiosInstance.delete<WebResponse<TaskDetail>>(
    `/tasks/${id}/evidences/${evidenceId}`,
  );
  return data.data;
}
export async function downloadTaskEvidence(id: string, evidenceId: string) {
  try {
    const { data } = await axiosInstance.get<Blob>(
      `/tasks/${id}/evidences/${evidenceId}/download`,
      { responseType: "blob" },
    );
    return data;
  } catch (error) {
    // Blob response mode also applies to error bodies. Restore the JSON message for existing error handling.
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text());
      } catch {
        /* fallback */
      }
    }
    throw error;
  }
}
