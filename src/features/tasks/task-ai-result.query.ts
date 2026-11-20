import { useQuery } from "@tanstack/react-query";
import { getAssessmentRubric, getTaskAIResult, getTaskAIResults } from "./task-ai-result.api";
import { AI_RESULT_POLL_INTERVAL, isAssessmentRunning } from "./task-ai-result.constants";
import { taskKeys } from "./task.query";

export const assessmentRubricKey = ["assessment-rubric"] as const;

export function useTaskAIResults(id: string) {
  return useQuery({
    queryKey: taskKeys.aiResults(id),
    queryFn: ({ signal }) => getTaskAIResults(id, signal),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data?.some(isAssessmentRunning) ? AI_RESULT_POLL_INTERVAL : false,
  });
}

export function useTaskAIResult(id: string, resultId: string) {
  return useQuery({
    queryKey: taskKeys.aiResult(id, resultId),
    queryFn: ({ signal }) => getTaskAIResult(id, resultId, signal),
    enabled: Boolean(id && resultId),
    refetchInterval: (query) =>
      isAssessmentRunning(query.state.data) ? AI_RESULT_POLL_INTERVAL : false,
  });
}

export function useAssessmentRubric() {
  return useQuery({
    queryKey: assessmentRubricKey,
    queryFn: ({ signal }) => getAssessmentRubric(signal),
  });
}
