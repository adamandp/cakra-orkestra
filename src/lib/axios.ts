import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AccessTokenResponse } from "@/interface/auth.interface";
import type { WebResponse } from "@/interface/common.interface";

const config = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  timeout: 15_000,
  withCredentials: true,
  headers: { Accept: "application/json" },
};

let accessToken: string | null = null;
let refreshing: Promise<string | null> | null = null;
let generation = 0;
const sessionExpiredListeners = new Set<() => void>();

export const axiosInstance = axios.create(config);
const refreshClient = axios.create(config);

export function setAccessToken(token: string | null) {
  generation += 1;
  accessToken = token;
  refreshing = null;
}

export function onSessionExpired(listener: () => void) {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function expireSession() {
  setAccessToken(null);
  sessionExpiredListeners.forEach((listener) => listener());
}

export function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  const currentGeneration = generation;
  const pending = refreshClient
    .post<WebResponse<AccessTokenResponse>>("/auth/refresh")
    .then(({ data }) => {
      if (generation !== currentGeneration) return null;
      accessToken = data.data.accessToken;
      return accessToken;
    })
    .catch((error: unknown) => {
      if (generation !== currentGeneration) return null;
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        expireSession();
        return null;
      }
      throw error;
    })
    .finally(() => {
      if (refreshing === pending) refreshing = null;
    });
  refreshing = pending;
  return pending;
}

type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean; _authGeneration?: number };

axiosInstance.interceptors.request.use((request: RetryConfig) => {
  request._authGeneration ??= generation;
  if (accessToken) request.headers.set("Authorization", "Bearer " + accessToken);
  return request;
});

axiosInstance.interceptors.response.use(undefined, async (error: AxiosError) => {
  const request = error.config as RetryConfig | undefined;
  if (
    error.response?.status !== 401 ||
    !request ||
    request._authGeneration !== generation ||
    /\/auth\/(login|logout|refresh)(?:\?|$)/.test(request.url ?? "")
  )
    throw error;

  if (request._retried) {
    if (request.headers.get("Authorization") === "Bearer " + accessToken) expireSession();
    throw error;
  }

  request._retried = true;
  const previous = request.headers.get("Authorization");
  const token =
    accessToken && previous !== "Bearer " + accessToken ? accessToken : await refreshAccessToken();

  if (!token || request._authGeneration !== generation) throw error;
  request.headers.set("Authorization", "Bearer " + token);
  return axiosInstance(request);
});
