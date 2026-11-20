# Model response

Bentuk response menggunakan TypeScript untuk menunjukkan field, enum, array, pewarisan dan nullability. Ini shape JSON. ID adalah UUID, timestamp ISO 8601; tanggal YYYY-MM-DD. Model `Pick` hanya menyertakan field yang disebut. `TaskDetail` mewarisi Task; list task memakai TaskListItem dengan ringkasan assessment, evidence_count, dan revision_reason. Password/hash tidak dikembalikan.

Model di bawah mengikuti `src/interface/`. Response endpoint membungkusnya dalam data, dengan message sesuai dokumentasi modul. Snapshot AI disimpan pada pembuatan assessment, bukan disinkronkan pada setiap edit task. AI mock dapat berubah PENDING/PROCESSING/COMPLETED/FAILED saat dibaca; lihat [perilaku assessment](task-ai-results.md).

## Auth

```ts
export type Role = "ADMIN" | "MEMBER";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: Role;
  avatar_url: string | null;
  is_active: boolean;
}
```

## User

```ts
export interface User extends AuthUser {
  role_id: string;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
}
```

## Role

```ts
export interface UserRole {
  id: string;
  name: Role;
  description: string | null;
  created_at: string;
  updated_at: string;
}
```

## Project

```ts
export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

export type ProjectUser = Pick<User, "id" | "name" | "username" | "avatar_url" | "is_active">;

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  owner_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  owner: ProjectUser;
  members: ProjectUser[];
}
```

## Task

```ts
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
```

## Changelog

```ts
export interface ChangelogItem {
  id: string;
  changelog_id: string;
  description: string;
}

export interface Changelog {
  id: string;
  version: string;
  description: string | null;
  commit_url: string | null;
  released_at: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  created_by: string;
  project: Pick<Project, "id" | "code" | "name" | "status">;
  creator: ProjectUser;
  changes: ChangelogItem[];
}
```

## Score

```ts
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
```

## Dashboard

```ts
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
```
