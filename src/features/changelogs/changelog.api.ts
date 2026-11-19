import axios from "axios";
import { axiosInstance } from "@/lib/axios";
import type { WebResponse } from "@/interface/common.interface";
import type {
  Changelog,
  ChangelogListParams,
  ChangelogListResponse,
  CreateChangelogInput,
  UpdateChangelogInput,
} from "@/interface/changelog.interface";

export async function getChangelogs(params: ChangelogListParams, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<ChangelogListResponse>>("/changelogs", {
    params,
    signal,
  });
  return data.data;
}

export async function getChangelog(id: string, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<Changelog>>(`/changelogs/${id}`, { signal });
  return data.data;
}

export async function createChangelog(input: CreateChangelogInput) {
  const { data } = await axiosInstance.post<WebResponse<Changelog>>("/changelogs", input);
  return data.data;
}

export async function updateChangelog(id: string, input: UpdateChangelogInput) {
  const { data } = await axiosInstance.patch<WebResponse<Changelog>>(`/changelogs/${id}`, input);
  return data.data;
}

export async function deleteChangelog(id: string) {
  await axiosInstance.delete<WebResponse<null>>(`/changelogs/${id}`);
}

export function getChangelogError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || "Unable to reach the server. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
