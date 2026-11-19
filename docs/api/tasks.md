# Tasks — 16 endpoint

| Method   | Endpoint                                                                  |
| -------- | ------------------------------------------------------------------------- |
| `GET`    | [`/api/tasks`](#get-apitasks)                                             |
| `POST`   | [`/api/tasks`](#post-apitasks)                                            |
| `GET`    | [`/api/tasks/:id`](#get-apitasksid)                                       |
| `PATCH`  | [`/api/tasks/:id`](#patch-apitasksid)                                     |
| `DELETE` | [`/api/tasks/:id`](#delete-apitasksid)                                    |
| `PATCH`  | [`/api/tasks/:id/assignee`](#patch-apitasksidassignee)                    |
| `GET`    | [`/api/tasks/:id/checklists`](#get-apitasksidchecklists)                  |
| `POST`   | [`/api/tasks/:id/checklists`](#post-apitasksidchecklists)                 |
| `PATCH`  | [`/api/tasks/:id/checklists/:itemId`](#patch-apitasksidchecklistsitemid)  |
| `DELETE` | [`/api/tasks/:id/checklists/:itemId`](#delete-apitasksidchecklistsitemid) |
| `PUT`    | [`/api/tasks/:id/checklists/order`](#put-apitasksidchecklistsorder)       |
| `POST`   | [`/api/tasks/:id/start`](#post-apitasksidstart)                           |
| `POST`   | [`/api/tasks/:id/block`](#post-apitasksidblock)                           |
| `POST`   | [`/api/tasks/:id/resume`](#post-apitasksidresume)                         |
| `POST`   | [`/api/tasks/:id/submit`](#post-apitasksidsubmit)                         |
| `GET`    | [`/api/tasks/:id/status-histories`](#get-apitasksidstatus-histories)      |

Sumber: [handler](../../src/mocks/handlers/tasks.ts), [schema](../../src/features/tasks/task.schema.ts), [data](../../src/mocks/data/tasks.ts). Model lengkap: [Task, TaskDetail, dan child collections](models.md).

## Akses dan aturan umum

- Semua endpoint membutuhkan Bearer; kegagalan auth menghasilkan 401 `Unauthorized`.
- ADMIN dapat melihat semua task; MEMBER hanya task dengan `assignee_id` miliknya, termasuk untuk mutasi/checklist yang diizinkan. Task hilang, soft-deleted, atau tidak boleh dilihat menghasilkan 404 `Task not found`.
- Edit, delete, reassignment, dan mutasi checklist hanya tersedia ketika task berstatus `OPEN`, `PROGRESS`, atau `BLOCKED`, dan project masih `ACTIVE`. Selain itu: 409 `Task is locked`.
- Delete task dan reassignment khusus ADMIN (403 `Forbidden` untuk MEMBER).
- Body create/update/checklist bersifat strict: field yang tidak didukung ditolak. Update minimal satu field.

## GET /api/tasks

| Query opsional | Format / perilaku                                                    |
| -------------- | -------------------------------------------------------------------- |
| `q`            | Trim, maksimal 255; mencari code/title/description, case-insensitive |
| `scope`        | Hanya `me`, membatasi assignee ke pemanggil                          |
| `project_id`   | UUID project                                                         |
| `assignee_id`  | UUID user; MEMBER hanya boleh memakai ID sendiri                     |
| `status`       | `OPEN`, `BLOCKED`, `PROGRESS`, `PENDING`, `DONE`                     |
| `type`         | `REGULAR`, `OVERTIME`                                                |
| `category`     | `CLIENT`, `INITIATIVE`, `FIXING`                                     |
| `limit`        | Integer 1–100; default 20                                            |
| `offset`       | Integer ≥ 0; default 0                                               |

200: `{ "data": { "items": Task[], "total": number, "limit": number, "offset": number } }`. Items tidak menyertakan child collections dari TaskDetail.
Error: 400 `Invalid task filters`; 403 `Forbidden` jika MEMBER memfilter assignee lain.

## POST /api/tasks

```json
{
  "project_id": "<projectId>",
  "assignee_id": "<userId>",
  "title": "Implement session API",
  "description": "Build session management endpoints.",
  "task_type": "REGULAR",
  "task_category": "CLIENT",
  "due_date": null,
  "checklists": [{ "title": "Create session" }]
}
```

| Field           | Validasi / default                                                     |
| --------------- | ---------------------------------------------------------------------- |
| `project_id`    | Wajib; UUID project yang boleh dilihat                                 |
| `assignee_id`   | UUID; default pemanggil                                                |
| `title`         | Wajib; trim, 1–255 karakter                                            |
| `description`   | Wajib; trim, minimal 1 karakter                                        |
| `task_type`     | `REGULAR` (default) atau `OVERTIME`                                    |
| `task_category` | `CLIENT` (default), `INITIATIVE`, atau `FIXING`                        |
| `due_date`      | `YYYY-MM-DD` atau null (default)                                       |
| `checklists`    | Default []; item hanya `{ "title": string }`, di-trim dan tidak kosong |

Project harus ACTIVE. MEMBER hanya dapat assign ke diri sendiri. Assignee harus aktif dan merupakan owner/anggota project; ADMIN juga boleh assign ke dirinya sendiri walaupun bukan peserta project.

201: `{ "message": "Task created", "data": TaskDetail }`.
Task awal `OPEN`, kode `TSK-...`, history awal dibuat, evidence kosong, AI initial `PENDING`, AI final null.

Error: 400 pesan validasi; 403 `Forbidden`; 404 `Project not found` / `Assignee not found`; 409 `Only active projects accept new assignments` / `Select an active project participant or yourself as admin`.

## GET /api/tasks/:id

Tanpa body/query. 200: `{ "data": TaskDetail }`. Mengembalikan checklist terurut, history, evidence, dan AI results. Error mengikuti aturan akses umum.

## PATCH /api/tasks/:id

Subset `title`, `description`, `task_type`, `task_category`, `due_date`, dengan validasi seperti create. Tidak menerima project_id, assignee_id, task_status, atau checklists.

```json
{ "title": "Update session API", "due_date": "2026-12-01" }
```

200: `{ "message": "Task updated", "data": TaskDetail }`.
Error: aturan umum dan 400 pesan validasi. Mock hanya memperbarui field beserta updated_at; AI input snapshot tidak dihitung ulang.

## DELETE /api/tasks/:id

ADMIN, tanpa body/query. Soft delete mengisi deleted_at; task kemudian tidak muncul pada list/detail.

200:

```json
{ "message": "Task deleted", "data": null }
```

Error mengikuti aturan umum, termasuk task harus editable.

## PATCH /api/tasks/:id/assignee

ADMIN. Body wajib:

```json
{ "assignee_id": "<userId>" }
```

200: `{ "message": "Assignee updated", "data": TaskDetail }`.
Error: aturan umum, 400 pesan validasi, serta kegagalan assignment yang sama seperti POST tasks.

## GET /api/tasks/:id/checklists

Tanpa body/query. 200: `{ "data": TaskChecklist[] }`, diurutkan berdasarkan sort_order. Read tetap tersedia ketika task terkunci. Error mengikuti aturan akses umum.

## POST /api/tasks/:id/checklists

```json
{ "title": "Handle expired sessions" }
```

Title wajib, trim, tidak kosong. 201: `{ "message": "Checklist added", "data": TaskDetail }`.
Item baru memiliki is_completed false, completed_at null, dan sort_order setelah item terakhir. Response adalah seluruh task detail.
Error: aturan umum dan 400 pesan validasi.

## PATCH /api/tasks/:id/checklists/:itemId

Minimal salah satu field berikut:

```json
{ "title": "Review session expiry", "is_completed": true }
```

Title trim dan tidak kosong; is_completed boolean. 200: `{ "message": "Checklist updated", "data": TaskDetail }`.
Berubah ke completed mengisi completed_at; dibuka kembali mengosongkannya. Mengirim nilai completion yang sama mempertahankan timestamp completion.
Error: aturan umum; 400 pesan validasi; 404 `Checklist not found`.

## DELETE /api/tasks/:id/checklists/:itemId

Tanpa body/query. 200: `{ "message": "Checklist removed", "data": TaskDetail }`. Urutan item tersisa dinomori ulang mulai 0.
Error: aturan umum; 404 `Checklist not found`.

## PUT /api/tasks/:id/checklists/order

```json
{ "item_ids": ["<checklistId-2>", "<checklistId-1>"] }
```

Array UUID wajib dan unik, harus memuat seluruh ID checklist task tepat sekali. Array kosong valid jika task tidak punya checklist. Urutan array menjadi sort_order mulai 0.

200: `{ "message": "Checklist order updated", "data": TaskDetail }`.
Error: aturan umum; 400 pesan validasi (termasuk `Duplicate checklist IDs`) atau `Provide every checklist ID exactly once` jika set ID tidak cocok.

## Workflow status — 4 endpoint POST

ADMIN atau assignee MEMBER; project harus ACTIVE dan task editable. Setiap aksi menambahkan status history, memperbarui status_changed_at dan updated_at. Block mengisi blocker_reason; aksi lain mengosongkannya. Body harus JSON, termasuk `{}` untuk aksi tanpa parameter.

### POST /api/tasks/:id/start

Body `{}`. OPEN → PROGRESS. 200: `{ "message": "Task started", "data": TaskDetail }`.

### POST /api/tasks/:id/block

Body `{ "reason": "Menunggu akses API" }`. Reason wajib, di-trim, 1–2000 karakter. PROGRESS → BLOCKED.
200: `{ "message": "Task blocked", "data": TaskDetail }`.

### POST /api/tasks/:id/resume

Body `{}`. BLOCKED → PROGRESS. 200: `{ "message": "Task resumed", "data": TaskDetail }`.

### POST /api/tasks/:id/submit

Body `{}`. PROGRESS → PENDING; minimal satu evidence FILE atau LINK. Tidak ada pemeriksaan semua checklist harus selesai pada handler saat ini.
200: `{ "message": "Task submitted for approval", "data": TaskDetail }`.

Semua aksi: error aturan umum, 400 pesan validasi, 409 `Invalid task status transition` jika status asal salah. Submit juga dapat menghasilkan 409 `Add at least one evidence before submitting`. Setelah PENDING, task terkunci untuk mutasi biasa; belum ada endpoint approve/reject.

## GET /api/tasks/:id/status-histories

Tanpa body/query, akses seperti detail task. 200: `{ "data": TaskStatusHistory[] }`. Urutan mengikuti penambahan history (terlama dahulu). Error: 401 `Unauthorized`, 404 `Task not found`.

Endpoint evidence dijelaskan terpisah di [Task evidence](task-evidences.md).
