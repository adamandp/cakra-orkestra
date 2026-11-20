import { http, HttpResponse } from "msw";
import { assessmentRubric } from "@/features/tasks/task-ai-result.constants";
import { emptyTaskActionSchema, rejectTaskSchema } from "@/features/tasks/task.schema";
import { getMockUser } from "../data/auth-store";
import { findMockProject } from "../data/projects";
import { updateMockTask } from "../data/tasks";
import {
  approveMockTask,
  listMockAIResults,
  rejectMockTask,
  retryMockAssessment,
} from "../data/task-ai-results";
import { requireMockAdmin } from "./authorization";
import { failure, requireTask, taskResponse } from "./tasks";

export const taskAIResultHandlers = [
  http.get("*/api/assessment-rubric", ({ request }) => {
    if (!getMockUser(request)) return failure("Unauthorized", 401);
    return HttpResponse.json({ data: assessmentRubric });
  }),

  http.get("*/api/tasks/:id/ai-results", ({ request, params }) => {
    const result = requireTask(request, String(params.id));
    if (result.error) return result.error;
    return HttpResponse.json({ data: listMockAIResults(result.task) });
  }),

  http.get("*/api/tasks/:id/ai-results/:resultId", ({ request, params }) => {
    const result = requireTask(request, String(params.id));
    if (result.error) return result.error;
    const assessment = listMockAIResults(result.task).find(
      (item) => item.id === String(params.resultId),
    );
    return assessment
      ? HttpResponse.json({ data: assessment })
      : failure("Assessment not found", 404);
  }),

  http.post("*/api/tasks/:id/approve", async ({ request, params }) => {
    const body = emptyTaskActionSchema.safeParse(await request.json().catch(() => null));
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    if (!body.success) return failure("Invalid approval payload", 400);
    const id = String(params.id);
    // PENDING is locked for ordinary writes; approval has its own status/role guard.
    const result = requireTask(request, id);
    if (result.error) return result.error;
    const { task } = result;
    if (findMockProject(task.project_id)?.status !== "ACTIVE")
      return failure("Task project is not active", 409);
    if (
      task.task_status !== "PENDING" ||
      task.approved_at ||
      task.approved_by ||
      task.ai_results.final
    )
      return failure("Task is not awaiting approval", 409);
    if (!task.evidences.length) return failure("Evidence is required before approval", 409);
    return taskResponse(
      updateMockTask(id, (current, now) => approveMockTask(current, admin.user.id, now)),
      "Task approved; final assessment queued",
    );
  }),

  http.post("*/api/tasks/:id/reject", async ({ request, params }) => {
    const body = rejectTaskSchema.safeParse(await request.json().catch(() => null));
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    if (!body.success) return failure(body.error.issues[0].message, 400);
    const id = String(params.id);
    const result = requireTask(request, id);
    if (result.error) return result.error;
    const { task } = result;
    if (findMockProject(task.project_id)?.status !== "ACTIVE")
      return failure("Task project is not active", 409);
    if (
      task.task_status !== "PENDING" ||
      task.approved_at ||
      task.approved_by ||
      task.ai_results.final
    )
      return failure("Only unapproved pending tasks can be rejected", 409);
    return taskResponse(
      updateMockTask(id, (current, now) =>
        rejectMockTask(current, admin.user.id, body.data.reason, now),
      ),
      "Revision requested",
    );
  }),

  http.post("*/api/tasks/:id/ai-results/:resultId/retry", async ({ request, params }) => {
    const body = emptyTaskActionSchema.safeParse(await request.json().catch(() => null));
    const id = String(params.id);
    const result = requireTask(request, id);
    if (result.error) return result.error;
    if (!body.success) return failure("Invalid retry payload", 400);
    const { task, user } = result;
    const assessment = listMockAIResults(task).find((item) => item.id === String(params.resultId));
    if (!assessment) return failure("Assessment not found", 404);
    if (assessment.type === "FINAL" && user.role !== "ADMIN") return failure("Forbidden", 403);
    if (findMockProject(task.project_id)?.status !== "ACTIVE")
      return failure("Task project is not active", 409);
    if (assessment.status !== "FAILED")
      return failure("Only failed assessments can be retried", 409);
    if (
      assessment.type === "FINAL" &&
      (task.task_status !== "PENDING" || !task.approved_at || !task.approved_by)
    )
      return failure("Final assessment requires human approval", 409);
    return taskResponse(
      updateMockTask(id, (current, now) => retryMockAssessment(current, assessment, now)),
      "Assessment queued for retry",
    );
  }),
];
