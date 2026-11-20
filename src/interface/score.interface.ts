import type { TaskAIResultTier } from "@/interface/task.interface";

export interface ScorePeriodParams {
  month: string; // YYYY-MM, Asia/Jakarta
}

export interface ScoreHistoryParams extends ScorePeriodParams {
  limit: number;
  offset: number;
}

export interface ScoreSummary {
  user_id: string;
  month: string;
  approved_points: number;
  completed_tasks: number;
  potential_points: number;
  active_tasks: number;
  has_running_assessments: boolean;
}

export interface ScoreHistoryItem {
  task_id: string;
  code: string;
  title: string;
  project_name: string;
  tier: TaskAIResultTier;
  points: number;
  completed_at: string;
}

export interface ScoreHistoryResponse {
  items: ScoreHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface UserScoreResponse {
  summary: ScoreSummary;
  history: ScoreHistoryResponse;
}

export interface LeaderboardEntry extends ScoreSummary {
  rank: number;
  name: string;
  username: string;
  avatar_url: string | null;
}
