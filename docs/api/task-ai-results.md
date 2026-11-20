# Assessment & approval — 5 endpoint

| Method | Endpoint                                                                               |
| ------ | -------------------------------------------------------------------------------------- |
| `GET`  | [`/api/tasks/:id/ai-results`](#get-apitasksidai-results)                               |
| `GET`  | [`/api/tasks/:id/ai-results/:resultId`](#get-apitasksidai-resultsresultid)             |
| `POST` | [`/api/tasks/:id/approve`](#post-apitasksidapprove)                                    |
| `POST` | [`/api/tasks/:id/reject`](#post-apitasksidreject)                                      |
| `POST` | [`/api/tasks/:id/ai-results/:resultId/retry`](#post-apitasksidai-resultsresultidretry) |

Bearer wajib. Read dan retry INITIAL tersedia untuk ADMIN atau MEMBER assignee task; task yang tidak terlihat menghasilkan 404 `Task not found`. Retry FINAL dan approve/reject khusus ADMIN (403 `Forbidden`). Tanpa session: 401 `Unauthorized`. Sumber: [handler](../../src/mocks/handlers/task-ai-results.ts), [worker mock](../../src/mocks/data/task-ai-results.ts). Model: [TaskAIResult dan TaskDetail](models.md).

## GET /api/tasks/:id/ai-results

Tanpa body/query. 200: `{ "data": TaskAIResult[] }`, INITIAL dahulu lalu FINAL jika ada. Tidak berupa history semua percobaan; retry mempertahankan ID hasil.

## GET /api/tasks/:id/ai-results/:resultId

Tanpa body/query. 200: `{ "data": TaskAIResult }`. Error tambahan: 404 `Assessment not found`.

## POST /api/tasks/:id/approve

ADMIN. Body wajib `{}` tanpa field tambahan. Project harus ACTIVE dan task PENDING, belum punya approved_at/approved_by maupun FINAL result, serta memiliki minimal satu evidence.

200: `{ "message": "Task approved; final assessment queued", "data": TaskDetail }`.
Mengisi approved_at/approved_by dan membuat FINAL PENDING dari snapshot task saat approval. Task tetap PENDING hingga FINAL COMPLETED; setelah itu mock mengubahnya ke DONE dan menambahkan status history.

Error: 400 `Invalid approval payload`; 404 `Task not found`; 409 `Task project is not active`, `Task is not awaiting approval`, atau `Evidence is required before approval`.

## POST /api/tasks/:id/reject

ADMIN. Body `{ "reason": "Tambahkan pengujian" }`; reason wajib, di-trim, 1–2000 karakter; field lain ditolak.

200: `{ "message": "Revision requested", "data": TaskDetail }`.
Hanya task PENDING belum disetujui dan tanpa FINAL, pada project ACTIVE. Task kembali PROGRESS, menambahkan history dengan reason, membersihkan blocker_reason dan approval.

Error: 400 pesan validasi; 404 `Task not found`; 409 `Task project is not active` / `Only unapproved pending tasks can be rejected`.

## POST /api/tasks/:id/ai-results/:resultId/retry

Body wajib `{}` tanpa field tambahan. Hanya assessment FAILED pada project ACTIVE. INITIAL dapat diulang assignee/ADMIN; FINAL khusus ADMIN dan task harus masih PENDING dengan approved_at/approved_by.

200: `{ "message": "Assessment queued for retry", "data": TaskDetail }`.
Mengembalikan hasil ke PENDING, membersihkan output/error. ID, created_at, dan input_snapshot dipertahankan.

Error: 400 `Invalid retry payload`; 404 `Assessment not found`; 403 `Forbidden`; 409 `Task project is not active`, `Only failed assessments can be retried`, atau `Final assessment requires human approval`.

## Perilaku simulasi

INITIAL dibuat saat create task. Worker bergerak secara lazy saat data task dibaca: PENDING → PROCESSING setelah sekitar 800 ms → COMPLETED setelah sekitar 3 detik. Penilaian memakai heuristic kata/checklist dengan model_name `mock-rubric-v1`, tanpa LLM sungguhan. Rubrik tersedia di [assessment rubric](assessment-rubric.md).

Untuk simulasi kegagalan development, set localStorage key `cakra-orkestra:mock-ai-fail-next` ke `INITIAL` atau `FINAL` sebelum hasil selesai. Hasil menjadi FAILED dengan error_message `Simulated assessment failure. Retry the assessment.`; key dikonsumsi satu kali. Polling frontend memakai interval 1500 ms.
