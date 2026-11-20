import type { TaskAIResult, TaskAIResultType, TaskStatusHistory } from "@/interface/task.interface";
import { assessmentRubric } from "@/features/tasks/task-ai-result.constants";
import type { MockTask } from "./tasks";

const PROCESSING_AFTER_MS = 800;
const COMPLETE_AFTER_MS = 3000;
// Dev-only failure injection. Set to INITIAL or FINAL before the result settles.
const FAIL_NEXT_KEY = "cakra-orkestra:mock-ai-fail-next";
const MODEL_NAME = "mock-rubric-v1";

export function makeMockAIResult(
  taskId: string,
  type: TaskAIResultType,
  input: Pick<MockTask, "title" | "description" | "checklists">,
  now: string,
): TaskAIResult {
  return {
    id: crypto.randomUUID(),
    task_id: taskId,
    type,
    status: "PENDING",
    tier: null,
    points: null,
    reasoning: null,
    input_snapshot: {
      title: input.title,
      description: input.description,
      checklists: input.checklists.map(({ title, is_completed }) => ({ title, is_completed })),
    },
    model_name: null,
    error_message: null,
    evaluated_at: null,
    created_at: now,
    updated_at: now,
  };
}

export function resetMockAIResult(result: TaskAIResult, now: string): TaskAIResult {
  // Retain the same result ID, creation date and assessment input.
  return {
    ...result,
    status: "PENDING",
    tier: null,
    points: null,
    reasoning: null,
    model_name: null,
    error_message: null,
    evaluated_at: null,
    updated_at: now,
  };
}

function evaluateMockSnapshot(result: TaskAIResult) {
  const { title, description, checklists } = result.input_snapshot;
  const words = `${title} ${description} ${checklists.map((item) => item.title).join(" ")}`
    .trim()
    .split(/\s+/).length;
  // Deterministic demo heuristic only. No LLM call or real complexity judgment.
  const weight = words + checklists.length * 8;
  const index = weight <= 8 ? 0 : weight <= 20 ? 1 : weight <= 60 ? 2 : weight <= 110 ? 3 : 4;
  const rubric = assessmentRubric[index]!;
  return {
    tier: rubric.tier,
    points: rubric.points,
    reasoning: `Simulated assessment: ${rubric.description}. Based on the saved title, description and checklist scope (demo heuristic).`,
  };
}

function advanceResult(result: TaskAIResult, nowMs: number): TaskAIResult {
  if (result.status !== "PENDING" && result.status !== "PROCESSING") return result;
  const queuedOrProcessingAt = Date.parse(result.updated_at);
  // Use the persisted processing-start boundary, preserving elapsed time across reloads.
  const queuedAt =
    result.status === "PROCESSING"
      ? queuedOrProcessingAt - PROCESSING_AFTER_MS
      : queuedOrProcessingAt;
  const elapsed = nowMs - queuedAt;
  if (elapsed >= COMPLETE_AFTER_MS) {
    const now = new Date(nowMs).toISOString();
    if (localStorage.getItem(FAIL_NEXT_KEY) === result.type) {
      localStorage.removeItem(FAIL_NEXT_KEY);
      return {
        ...result,
        status: "FAILED",
        tier: null,
        points: null,
        reasoning: null,
        model_name: MODEL_NAME,
        error_message: "Simulated assessment failure. Retry the assessment.",
        evaluated_at: null,
        updated_at: now,
      };
    }
    return {
      ...result,
      ...evaluateMockSnapshot(result),
      status: "COMPLETED",
      model_name: MODEL_NAME,
      error_message: null,
      evaluated_at: now,
      updated_at: now,
    };
  }
  if (result.status === "PENDING" && elapsed >= PROCESSING_AFTER_MS) {
    return {
      ...result,
      status: "PROCESSING",
      model_name: MODEL_NAME,
      updated_at: new Date(queuedAt + PROCESSING_AFTER_MS).toISOString(),
    };
  }
  return result;
}

// Lazy worker simulation: called by the mock task store on reads. No timers or API calls.
export function advanceMockTaskAssessments(task: MockTask, nowMs: number): MockTask {
  if (task.deleted_at) return task;
  const initial = advanceResult(task.ai_results.initial, nowMs);
  const final =
    task.ai_results.final && task.task_status === "PENDING" && task.approved_by && task.approved_at
      ? advanceResult(task.ai_results.final, nowMs)
      : task.ai_results.final;
  if (initial === task.ai_results.initial && final === task.ai_results.final) return task;
  const updated = { ...task, ai_results: { initial, final } };
  if (
    task.task_status !== "PENDING" ||
    !task.approved_by ||
    !task.approved_at ||
    final?.status !== "COMPLETED"
  )
    return updated;
  const now = new Date(nowMs).toISOString();
  const history: TaskStatusHistory = {
    id: crypto.randomUUID(),
    task_id: task.id,
    previous_status: "PENDING",
    current_status: "DONE",
    reason: "Approved — final assessment completed",
    changed_by: task.approved_by,
    created_at: now,
  };
  return {
    ...updated,
    task_status: "DONE",
    status_changed_at: now,
    updated_at: now,
    status_histories: [...task.status_histories, history],
  };
}

export function listMockAIResults(task: MockTask): TaskAIResult[] {
  return task.ai_results.final
    ? [task.ai_results.initial, task.ai_results.final]
    : [task.ai_results.initial];
}

export function approveMockTask(task: MockTask, actorId: string, now: string): MockTask {
  return {
    ...task,
    approved_by: actorId,
    approved_at: now,
    ai_results: { ...task.ai_results, final: makeMockAIResult(task.id, "FINAL", task, now) },
  };
}

export function rejectMockTask(
  task: MockTask,
  actorId: string,
  reason: string,
  now: string,
): MockTask {
  const history: TaskStatusHistory = {
    id: crypto.randomUUID(),
    task_id: task.id,
    previous_status: "PENDING",
    current_status: "PROGRESS",
    reason,
    changed_by: actorId,
    created_at: now,
  };
  return {
    ...task,
    task_status: "PROGRESS",
    status_changed_at: now,
    blocker_reason: null,
    approved_by: null,
    approved_at: null,
    status_histories: [...task.status_histories, history],
  };
}

export function retryMockAssessment(task: MockTask, result: TaskAIResult, now: string): MockTask {
  const key = result.type === "INITIAL" ? "initial" : "final";
  return { ...task, ai_results: { ...task.ai_results, [key]: resetMockAIResult(result, now) } };
}
