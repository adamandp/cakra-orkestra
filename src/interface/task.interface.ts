import type { ProjectStatus, ProjectUser } from "@/interface/project.interface";

export type TaskStatus = "OPEN" | "BLOCKED" | "PROGRESS" | "PENDING" | "DONE";
export type TaskType = "REGULAR" | "OVERTIME";
export type TaskCategory = "CLIENT" | "INITIATIVE" | "FIXING";
export type TaskProject = { id: string; code: string; name: string; status: ProjectStatus };

export interface TaskChecklist {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskStatusHistory {
  id: string;
  task_id: string;
  previous_status: TaskStatus | null;
  current_status: TaskStatus;
  reason: string | null;
  changed_by: string;
  created_at: string;
}

export interface TaskEvidence {
  id: string;
  task_id: string;
  type: "FILE" | "LINK";
  title: string | null;
  url: string | null;
  object_key: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export type TaskAIResultType = "INITIAL" | "FINAL";
export type TaskAIResultStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type TaskAIResultTier = "SPARK" | "PULSE" | "CORE" | "SURGE" | "APEX";

export interface AssessmentRubricItem {
  tier: TaskAIResultTier;
  points: number;
  description: string;
}

export interface RejectTaskInput {
  reason: string;
}

export interface TaskAIResult {
  id: string;
  task_id: string;
  type: TaskAIResultType;
  status: TaskAIResultStatus;
  tier: TaskAIResultTier | null;
  points: number | null;
  reasoning: string | null;
  input_snapshot: {
    title: string;
    description: string;
    checklists: { title: string; is_completed: boolean }[];
  };
  model_name: string | null;
  error_message: string | null;
  evaluated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  code: string;
  title: string;
  description: string;
  task_status: TaskStatus;
  task_type: TaskType;
  task_category: TaskCategory;
  blocker_reason: string | null;
  due_date: string | null;
  status_changed_at: string;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  project_id: string;
  assignee_id: string;
  created_by: string;
  project: TaskProject;
  assignee: ProjectUser;
  checklist_total: number;
  checklist_completed: number;
}

export type TaskAssessmentSummary = Pick<TaskAIResult, "status" | "tier" | "points">;

export interface TaskListItem extends Task {
  initial_assessment: TaskAssessmentSummary;
  final_assessment: TaskAssessmentSummary | null;
  evidence_count: number;
  revision_reason: string | null;
}

export interface TaskDetail extends Task {
  checklists: TaskChecklist[];
  status_histories: TaskStatusHistory[];
  evidences: TaskEvidence[];
  ai_results: { initial: TaskAIResult; final: TaskAIResult | null };
}

export interface TaskListParams {
  q?: string;
  scope?: "me";
  project_id?: string;
  assignee_id?: string;
  status?: TaskStatus;
  type?: TaskType;
  category?: TaskCategory;
  limit: number;
  offset: number;
}

export interface TaskListResponse {
  items: TaskListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateTaskInput {
  project_id: string;
  assignee_id?: string;
  title: string;
  description: string;
  task_type: TaskType;
  task_category: TaskCategory;
  due_date: string | null;
  checklists: { title: string }[];
}

export type UpdateTaskInput = Partial<
  Pick<CreateTaskInput, "title" | "description" | "task_type" | "task_category" | "due_date">
>;
export interface UpdateTaskAssigneeInput {
  assignee_id: string;
}
export interface CreateTaskChecklistInput {
  title: string;
}
export interface UpdateTaskChecklistInput {
  title?: string;
  is_completed?: boolean;
}
export interface OrderTaskChecklistsInput {
  item_ids: string[];
}

export type TaskWorkflowAction = "start" | "block" | "resume" | "submit";
export interface BlockTaskInput {
  reason: string;
}
export interface CreateTaskLinkInput {
  title?: string;
  url: string;
}
export interface PresignTaskEvidenceInput {
  file_name: string;
  mime_type: string;
  file_size: number;
}
export interface PresignTaskEvidenceResponse {
  upload_url: string;
  object_key: string;
  expires_at: string;
}
export interface ConfirmTaskEvidenceInput {
  object_key: string;
  title?: string;
}
