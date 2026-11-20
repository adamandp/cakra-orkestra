import type {
  MemberWorkload,
  MyFocusSummary,
  TeamPulseSummary,
  WorkloadStatus,
} from "@/interface/dashboard.interface";
import type { TaskListItem } from "@/interface/task.interface";
import { getMockTasks, toPublicTask, type MockTask } from "./tasks";
import { getMockUsers } from "./users";

function liveTasks() {
  return getMockTasks().filter((task) => !task.deleted_at);
}
function activeTasks(tasks: MockTask[]) {
  return tasks.filter((task) => task.task_status !== "DONE");
}
function waitingApproval(task: MockTask) {
  return (
    task.task_status === "PENDING" &&
    !task.approved_at &&
    !task.approved_by &&
    !task.ai_results.final
  );
}
function finalAssessment(task: MockTask) {
  return task.task_status === "PENDING" && !waitingApproval(task);
}
function initialPoints(task: MockTask): number | null {
  const result = task.ai_results.initial;
  return result.status === "COMPLETED" ? result.points : null;
}
function potentialPoints(tasks: MockTask[]) {
  return tasks.reduce((sum, task) => sum + (initialPoints(task) ?? 0), 0);
}
function approvedPoints(tasks: MockTask[]) {
  return tasks.reduce((sum, task) => {
    const result = task.ai_results.final;
    return task.task_status === "DONE" && result?.status === "COMPLETED"
      ? sum + (result.points ?? 0)
      : sum;
  }, 0);
}
function unestimatedTasks(tasks: MockTask[]) {
  return tasks.filter((task) => initialPoints(task) === null).length;
}
function workloadStatus(points: number): WorkloadStatus {
  return points >= 13 ? "HIGH_LOAD" : points >= 6 ? "BALANCED" : "AVAILABLE";
}

export function getMockMyFocus(userId: string): MyFocusSummary {
  const tasks = liveTasks().filter((task) => task.assignee_id === userId);
  const active = activeTasks(tasks);
  const waiting = tasks.filter(waitingApproval);
  return {
    active_tasks: active.length,
    completed_tasks: tasks.length - active.length,
    blocked_tasks: tasks.filter((task) => task.task_status === "BLOCKED").length,
    pending_tasks: tasks.filter((task) => task.task_status === "PENDING").length,
    waiting_approval_tasks: waiting.length,
    final_assessment_tasks: tasks.filter(finalAssessment).length,
    potential_points: potentialPoints(active),
    pending_points: potentialPoints(waiting),
    approved_points: approvedPoints(tasks),
    unestimated_tasks: unestimatedTasks(active),
  };
}

export function getMockTeamSummary(): TeamPulseSummary {
  const tasks = liveTasks();
  const active = activeTasks(tasks);
  const waiting = tasks.filter(waitingApproval);
  const final = tasks.filter(finalAssessment);
  const completed = tasks.length - active.length;
  return {
    waiting_approval_tasks: waiting.length,
    waiting_approval_points: potentialPoints(waiting),
    blocked_tasks: tasks.filter((task) => task.task_status === "BLOCKED").length,
    completed_tasks: completed,
    total_tasks: tasks.length,
    active_tasks: active.length,
    active_projects: new Set(active.map((task) => task.project_id)).size,
    completion_rate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    final_assessment_tasks: final.length,
    failed_final_assessments: final.filter((task) => task.ai_results.final?.status === "FAILED")
      .length,
  };
}

export function getMockMemberWorkloads(): MemberWorkload[] {
  const tasks = liveTasks();
  const byMember = new Map<string, MockTask[]>();
  for (const task of tasks) {
    const group = byMember.get(task.assignee_id) ?? [];
    group.push(task);
    byMember.set(task.assignee_id, group);
  }
  return getMockUsers()
    .filter((member) => member.is_active || byMember.has(member.id))
    .map((member) => {
      const assigned = byMember.get(member.id) ?? [];
      const active = activeTasks(assigned);
      const points = potentialPoints(active);
      const active_tasks: TaskListItem[] = active.map(toPublicTask);
      const { id, name, username, avatar_url, is_active } = member;
      return {
        member: { id, name, username, avatar_url, is_active },
        active_tasks,
        active_points: points,
        approved_points: approvedPoints(assigned),
        unestimated_tasks: unestimatedTasks(active),
        status: workloadStatus(points),
      };
    })
    .sort(
      (a, b) => b.active_points - a.active_points || a.member.name.localeCompare(b.member.name),
    );
}
