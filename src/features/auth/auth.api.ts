import axios from "axios";
import { axiosInstance, refreshAccessToken, setAccessToken } from "@/lib/axios";
import type {
  AccessTokenResponse,
  AuthUser,
  ChangePasswordInput,
  LoginCredentials,
} from "@/interface/auth.interface";
import type { WebResponse } from "@/interface/common.interface";

export async function getProfile(): Promise<AuthUser> {
  const { data } = await axiosInstance.get<WebResponse<AuthUser>>("/auth/me");
  return data.data;
}

export async function login(input: LoginCredentials): Promise<AuthUser> {
  const { data } = await axiosInstance.post<WebResponse<AccessTokenResponse>>("/auth/login", input);
  setAccessToken(data.data.accessToken);
  try {
    return await getProfile();
  } catch (error) {
    try {
      await logout();
    } catch {
      setAccessToken(null);
    }
    throw error;
  }
}

export async function bootstrapAuth(): Promise<AuthUser | null> {
  if (!(await refreshAccessToken())) return null;
  try {
    return await getProfile();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      setAccessToken(null);
      return null;
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await axiosInstance.post("/auth/logout");
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error;
  }
  setAccessToken(null);
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await axiosInstance.patch("/auth/password", input);
}

export function getAuthError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || "Unable to reach the server. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
