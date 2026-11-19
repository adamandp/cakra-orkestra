# Model response

Bentuk data response ditulis sebagai TypeScript agar field, enum, array, dan nullability eksplisit. Ini adalah shape JSON, bukan kode yang perlu dijalankan. `number` berarti angka JSON; `string` berarti string JSON. ID berupa UUID, tanggal dan timestamp mengikuti konvensi di [index](README.md).

`User` mewarisi seluruh field `AuthUser`. `ProjectUser` berisi hanya `id`, `name`, `username`, `avatar_url`, dan `is_active` dari User. `TaskDetail` mewarisi seluruh field Task lalu menambahkan child collections. Field response di bawah wajib hadir, kecuali ditandai `?`.

Response sukses yang menyebut `{ "data": User }` berarti objek User ditempatkan pada field data. Response mutasi dapat menambahkan `message` sesuai dokumentasi endpoint. Password/hash tidak pernah termasuk model publik.

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

export interface TaskAIResult {
  id: string;
  task_id: string;
  type: "INITIAL" | "FINAL";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  tier: "SPARK" | "PULSE" | "CORE" | "SURGE" | "APEX" | null;
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

export interface TaskDetail extends Task {
  checklists: TaskChecklist[];
  status_histories: TaskStatusHistory[];
  evidences: TaskEvidence[];
  ai_results: { initial: TaskAIResult; final: TaskAIResult | null };
}
```

## Kondisi mock saat ini

- Task baru: task_status OPEN; blocker_reason, approved_at, approved_by, dan deleted_at null.
- TaskDetail baru: evidences kosong; ai_results.initial bertipe INITIAL dan status PENDING, final null. Field hasil evaluasi (tier, points, reasoning, model_name, error_message, evaluated_at) null. Mock tidak menjalankan evaluasi AI.
- Status history awal memakai previous_status null, current_status OPEN, reason null, dan changed_by ID pembuat.
- AI input_snapshot merekam input saat task dibuat; edit task/checklist tidak menyinkronkannya.
- Evidence dan status history dapat berubah melalui endpoint yang terdokumentasi. Evaluasi AI dan approval belum memiliki endpoint.
