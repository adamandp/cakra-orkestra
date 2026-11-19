import axios from "axios";
import { axiosInstance } from "@/lib/axios";
import type { WebResponse } from "@/interface/common.interface";
import type { UserRole } from "@/interface/role.interface";
import type {
  User,
  UserListParams,
  UserListResponse,
  CreateUserInput,
  UpdateUserInput,
  UpdateUserStatusInput,
  UpdateUserRoleInput,
} from "@/interface/user.interface";

export async function getUsers(params: UserListParams, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<UserListResponse>>("/users", {
    params,
    signal,
  });
  return data.data;
}

export async function getUser(id: string, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<User>>(`/users/${id}`, { signal });
  return data.data;
}

export async function createUser(input: CreateUserInput) {
  const { data } = await axiosInstance.post<WebResponse<User>>("/users", input);
  return data.data;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const { data } = await axiosInstance.patch<WebResponse<User>>(`/users/${id}`, input);
  return data.data;
}

export async function updateUserStatus(id: string, input: UpdateUserStatusInput) {
  const { data } = await axiosInstance.patch<WebResponse<User>>(`/users/${id}/status`, input);
  return data.data;
}

export async function updateUserRole(id: string, input: UpdateUserRoleInput) {
  const { data } = await axiosInstance.patch<WebResponse<User>>(`/users/${id}/role`, input);
  return data.data;
}

export async function getRoles(signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<UserRole[]>>("/roles", { signal });
  return data.data;
}

export async function getRole(id: string, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<UserRole>>(`/roles/${id}`, { signal });
  return data.data;
}

export function getUserError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || "Unable to reach the server. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
