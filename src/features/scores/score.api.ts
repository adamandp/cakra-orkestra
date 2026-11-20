import axios from "axios";
import { axiosInstance } from "@/lib/axios";
import type { WebResponse } from "@/interface/common.interface";
import type {
  LeaderboardEntry,
  ScoreHistoryParams,
  ScoreHistoryResponse,
  ScorePeriodParams,
  ScoreSummary,
  UserScoreResponse,
} from "@/interface/score.interface";

export async function getMyScore(params: ScorePeriodParams, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<ScoreSummary>>("/scores/me", {
    params,
    signal,
  });
  return data.data;
}

export async function getMyScoreHistory(params: ScoreHistoryParams, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<ScoreHistoryResponse>>("/scores/me/history", {
    params,
    signal,
  });
  return data.data;
}

export async function getUserScore(id: string, params: ScoreHistoryParams, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<UserScoreResponse>>(`/scores/users/${id}`, {
    params,
    signal,
  });
  return data.data;
}

export function getScoreError(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || "Unable to reach the server. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export async function getLeaderboard(params: ScorePeriodParams, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<LeaderboardEntry[]>>("/scores/leaderboard", { params, signal });
  return data.data;
}
