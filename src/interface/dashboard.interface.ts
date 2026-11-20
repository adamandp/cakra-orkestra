import type { TaskListItem } from "@/interface/task.interface";
import type { ProjectUser } from "@/interface/project.interface";

export interface MyFocusSummary {
  active_tasks: number;
  completed_tasks: number;
  blocked_tasks: number;
  pending_tasks: number;
  waiting_approval_tasks: number;
  final_assessment_tasks: number;
  potential_points: number;
  pending_points: number;
  approved_points: number;
  unestimated_tasks: number;
}

export interface TeamPulseSummary {
  waiting_approval_tasks: number;
  waiting_approval_points: number;
  blocked_tasks: number;
  completed_tasks: number;
  total_tasks: number;
  active_tasks: number;
  active_projects: number;
  completion_rate: number;
  final_assessment_tasks: number;
  failed_final_assessments: number;
}

export type WorkloadStatus = "AVAILABLE" | "BALANCED" | "HIGH_LOAD";

export interface MemberWorkload {
  member: ProjectUser;
  active_tasks: TaskListItem[];
  active_points: number;
  approved_points: number;
  unestimated_tasks: number;
  status: WorkloadStatus;
}
