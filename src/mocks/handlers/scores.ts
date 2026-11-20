import { http, HttpResponse } from "msw";
import type {
  ScoreHistoryItem,
  ScoreHistoryParams,
  ScoreHistoryResponse,
  ScoreSummary,
} from "@/interface/score.interface";
import { getScoreMonth } from "@/features/scores/score.constants";
import { scoreHistorySchema, scorePeriodSchema } from "@/features/scores/score.schema";
import { isAssessmentRunning } from "@/features/tasks/task-ai-result.constants";
import { getMockUser } from "../data/auth-store";
import { findMockProject } from "../data/projects";
import { getMockTasks, type MockTask } from "../data/tasks";
import { findMockUser } from "../data/users";
import { requireMockAdmin } from "./authorization";

function getUserTasks(id: string) {
  return getMockTasks().filter((task) => task.assignee_id === id && !task.deleted_at);
}

function getHistory(tasks: MockTask[], month: string): ScoreHistoryItem[] {
  const items: ScoreHistoryItem[] = [];
  for (const task of tasks) {
    const final = task.ai_results.final;
    if (
      task.task_status !== "DONE" ||
      final?.type !== "FINAL" ||
      final.status !== "COMPLETED" ||
      final.points === null ||
      final.tier === null
    ) continue;

    const completed = task.status_histories
      .filter((history) => history.current_status === "DONE")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    if (!completed || getScoreMonth(new Date(completed.created_at)) !== month) continue;

    items.push({
      task_id: task.id,
      code: task.code,
      title: task.title,
      project_name: findMockProject(task.project_id)?.name ?? "Unknown project",
      tier: final.tier,
      points: final.points,
      completed_at: completed.created_at,
    });
  }
  return items.sort((a, b) =>
    b.completed_at.localeCompare(a.completed_at) || a.task_id.localeCompare(b.task_id),
  );
}

function getSummary(
  id: string,
  month: string,
  tasks: MockTask[],
  history: ScoreHistoryItem[],
): ScoreSummary {
  const active = tasks.filter((task) => task.task_status !== "DONE");
  return {
    user_id: id,
    month,
    approved_points: history.reduce((total, item) => total + item.points, 0),
    completed_tasks: history.length,
    potential_points: active.reduce((total, task) => {
      const initial = task.ai_results.initial;
      return total + (initial.status === "COMPLETED" ? (initial.points ?? 0) : 0);
    }, 0),
    active_tasks: active.length,
    has_running_assessments: active.some((task) =>
      isAssessmentRunning(task.ai_results.initial) || isAssessmentRunning(task.ai_results.final),
    ),
  };
}

function paginate(items: ScoreHistoryItem[], params: ScoreHistoryParams): ScoreHistoryResponse {
  const { limit, offset } = params;
  return { items: items.slice(offset, offset + limit), total: items.length, limit, offset };
}

function readHistoryParams(request: Request) {
  const search = new URL(request.url).searchParams;
  return scoreHistorySchema.safeParse({
    month: search.get("month") ?? undefined,
    limit: search.get("limit") ?? undefined,
    offset: search.get("offset") ?? undefined,
  });
}

function invalidFilters() {
  return HttpResponse.json({ message: "Invalid score filters" }, { status: 400 });
}

function unauthorized() {
  return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
}

export const scoreHandlers = [
  http.get("*/api/scores/me", ({ request }) => {
    const user = getMockUser(request);
    if (!user) return unauthorized();
    const result = scorePeriodSchema.safeParse({
      month: new URL(request.url).searchParams.get("month") ?? undefined,
    });
    if (!result.success) return invalidFilters();
    const { month } = result.data;
    const tasks = getUserTasks(user.id);
    return HttpResponse.json({ data: getSummary(user.id, month, tasks, getHistory(tasks, month)) });
  }),

  http.get("*/api/scores/me/history", ({ request }) => {
    const user = getMockUser(request);
    if (!user) return unauthorized();
    const result = readHistoryParams(request);
    if (!result.success) return invalidFilters();
    const history = getHistory(getUserTasks(user.id), result.data.month);
    return HttpResponse.json({ data: paginate(history, result.data) });
  }),

  http.get("*/api/scores/users/:id", ({ request, params }) => {
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    const id = String(params.id);
    if (!findMockUser(id)) return HttpResponse.json({ message: "User not found" }, { status: 404 });
    const result = readHistoryParams(request);
    if (!result.success) return invalidFilters();
    const tasks = getUserTasks(id);
    const history = getHistory(tasks, result.data.month);
    return HttpResponse.json({
      data: {
        summary: getSummary(id, result.data.month, tasks, history),
        history: paginate(history, result.data),
      },
    });
  }),
];
