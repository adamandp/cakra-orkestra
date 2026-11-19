import axios from "axios";
import { axiosInstance } from "@/lib/axios";
import type { WebResponse } from "@/interface/common.interface";
import type {
  AddProjectMembersInput, CreateProjectInput, Project, ProjectListParams,
  ProjectListResponse, ProjectUser, UpdateProjectInput, UpdateProjectStatusInput,
} from "@/interface/project.interface";

export async function getProjects(params: ProjectListParams, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<ProjectListResponse>>("/projects", { params, signal });
  return data.data;
}

export async function getProject(id: string, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<Project>>(`/projects/${id}`, { signal });
  return data.data;
}

export async function createProject(input: CreateProjectInput) {
  const { data } = await axiosInstance.post<WebResponse<Project>>("/projects", input);
  return data.data;
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  const { data } = await axiosInstance.patch<WebResponse<Project>>(`/projects/${id}`, input);
  return data.data;
}

export async function updateProjectStatus(id: string, input: UpdateProjectStatusInput) {
  const { data } = await axiosInstance.patch<WebResponse<Project>>(`/projects/${id}/status`, input);
  return data.data;
}

export async function getProjectMembers(id: string, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<ProjectUser[]>>(`/projects/${id}/members`, { signal });
  return data.data;
}

export async function addProjectMembers(id: string, input: AddProjectMembersInput) {
  const { data } = await axiosInstance.post<WebResponse<Project>>(`/projects/${id}/members`, input);
  return data.data;
}

export async function removeProjectMember(id: string, userId: string) {
  const { data } = await axiosInstance.delete<WebResponse<Project>>(`/projects/${id}/members/${userId}`);
  return data.data;
}

export function getProjectError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || "Unable to reach the server. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
