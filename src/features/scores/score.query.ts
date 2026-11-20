import { useQuery } from "@tanstack/react-query";
import type { ScoreHistoryParams, ScorePeriodParams } from "@/interface/score.interface";
import { getMyScore, getMyScoreHistory, getUserScore } from "./score.api";
import { SCORE_POLL_INTERVAL } from "./score.constants";

export const scoreKeys = {
  all: ["scores"] as const,
  me: (viewerId: string, params: ScorePeriodParams) =>
    ["scores", "me", viewerId, params] as const,
  history: (viewerId: string, params: ScoreHistoryParams) =>
    ["scores", "history", viewerId, params] as const,
  user: (viewerId: string, id: string, params: ScoreHistoryParams) =>
    ["scores", "user", viewerId, id, params] as const,
};

export function useMyScore(viewerId: string, params: ScorePeriodParams, enabled = true) {
  return useQuery({
    queryKey: scoreKeys.me(viewerId, params),
    queryFn: ({ signal }) => getMyScore(params, signal),
    enabled: Boolean(viewerId) && enabled,
    refetchOnMount: "always",
    refetchInterval: (query) =>
      query.state.data?.has_running_assessments ? SCORE_POLL_INTERVAL : false,
  });
}

export function useMyScoreHistory(
  viewerId: string,
  params: ScoreHistoryParams,
  enabled: boolean,
  running: boolean,
) {
  return useQuery({
    queryKey: scoreKeys.history(viewerId, params),
    queryFn: ({ signal }) => getMyScoreHistory(params, signal),
    enabled: Boolean(viewerId) && enabled,
    refetchOnMount: "always",
    refetchInterval: running ? SCORE_POLL_INTERVAL : false,
  });
}

export function useUserScore(
  viewerId: string,
  id: string,
  params: ScoreHistoryParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: scoreKeys.user(viewerId, id, params),
    queryFn: ({ signal }) => getUserScore(id, params, signal),
    enabled: Boolean(viewerId && id) && enabled,
    refetchOnMount: "always",
    refetchInterval: (query) =>
      query.state.data?.summary.has_running_assessments ? SCORE_POLL_INTERVAL : false,
  });
}
