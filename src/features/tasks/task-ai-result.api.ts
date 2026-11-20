import { axiosInstance } from "@/lib/axios";
import type { WebResponse } from "@/interface/common.interface";
import type {
  AssessmentRubricItem,
  RejectTaskInput,
  TaskAIResult,
  TaskDetail,
} from "@/interface/task.interface";

export async function getTaskAIResults(id: string, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<TaskAIResult[]>>(`/tasks/${id}/ai-results`, {
    signal,
  });
  return data.data;
}
export async function getTaskAIResult(id: string, resultId: string, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<TaskAIResult>>(
    `/tasks/${id}/ai-results/${resultId}`,
    { signal },
  );
  return data.data;
}
export async function getAssessmentRubric(signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<AssessmentRubricItem[]>>(
    "/assessment-rubric",
    { signal },
  );
  return data.data;
}
export async function approveTask(id: string) {
  const { data } = await axiosInstance.post<WebResponse<TaskDetail>>(`/tasks/${id}/approve`, {});
  return data.data;
}
export async function rejectTask(id: string, input: RejectTaskInput) {
  const { data } = await axiosInstance.post<WebResponse<TaskDetail>>(`/tasks/${id}/reject`, input);
  return data.data;
}
export async function retryTaskAIResult(id: string, resultId: string) {
  const { data } = await axiosInstance.post<WebResponse<TaskDetail>>(
    `/tasks/${id}/ai-results/${resultId}/retry`,
    {},
  );
  return data.data;
}
