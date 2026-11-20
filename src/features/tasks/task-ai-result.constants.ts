import type { AssessmentRubricItem, TaskAIResult } from "@/interface/task.interface";

// Shared mock rubric; production values are supplied by GET /assessment-rubric.
export const assessmentRubric: readonly AssessmentRubricItem[] = [
  { tier: "SPARK", points: 1, description: "Small or simple changes" },
  { tier: "PULSE", points: 2, description: "Routine, low-risk work" },
  { tier: "CORE", points: 5, description: "Standard feature development or integration" },
  { tier: "SURGE", points: 8, description: "Complex or cross-service work" },
  { tier: "APEX", points: 13, description: "Architectural or high-impact work" },
];

export const AI_RESULT_POLL_INTERVAL = 1500;

export function isAssessmentRunning(result: TaskAIResult | null | undefined) {
  return result?.status === "PENDING" || result?.status === "PROCESSING";
}
