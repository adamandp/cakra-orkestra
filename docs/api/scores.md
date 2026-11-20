# Scores — 3 endpoint

| Method | Endpoint                                            |
| ------ | --------------------------------------------------- |
| `GET`  | [`/api/scores/me`](#get-apiscoresme)                |
| `GET`  | [`/api/scores/me/history`](#get-apiscoresmehistory) |
| `GET`  | [`/api/scores/users/:id`](#get-apiscoresusersid)    |

Bearer wajib (401 `Unauthorized`). Sumber: [handler](../../src/mocks/handlers/scores.ts), [schema](../../src/features/scores/score.schema.ts). Model: [ScoreSummary, ScoreHistoryItem, UserScoreResponse](models.md).

Query month opsional memakai `YYYY-MM` (bulan 01–12); default bulan saat request menurut Asia/Jakarta. History memakai limit integer 1–100 (default 10), offset integer ≥ 0 (default 0). Filter invalid: 400 `Invalid score filters`.

## GET /api/scores/me

ADMIN/MEMBER; tanpa body. Query month saja, contoh `/api/scores/me?month=2026-11`.
200: `{ "data": ScoreSummary }`.

```json
{
  "data": {
    "user_id": "<userId>",
    "month": "2026-11",
    "approved_points": 5,
    "completed_tasks": 1,
    "potential_points": 2,
    "active_tasks": 1,
    "has_running_assessments": false
  }
}
```

## GET /api/scores/me/history

ADMIN/MEMBER; tanpa body. Query month, limit, offset. 200: `{ "data": ScoreHistoryResponse }` berisi items ScoreHistoryItem[], total, limit, offset.

```json
{
  "data": {
    "items": [
      {
        "task_id": "<taskId>",
        "code": "TSK-001",
        "title": "Implement API",
        "project_name": "Project A",
        "tier": "CORE",
        "points": 5,
        "completed_at": "2026-11-20T03:00:00.000Z"
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

## GET /api/scores/users/:id

ADMIN; tanpa body. Query month, limit, offset. 200: `{ "data": { "summary": ScoreSummary, "history": ScoreHistoryResponse } }`.
Error tambahan: 403 `Forbidden`; 404 `User not found`.

## Perhitungan

History hanya task non-deleted DONE dengan FINAL COMPLETED dan tier/points tidak null. Bulan mengikuti history transisi DONE terbaru dalam timezone Asia/Jakarta. Urutan completed_at terbaru, lalu task_id ascending. approved_points dan completed_tasks berasal dari history bulan tersebut.

potential_points dan active_tasks memakai seluruh task non-deleted yang belum DONE, tidak dibatasi bulan: potential_points hanya menjumlah INITIAL COMPLETED. has_running_assessments true jika ada INITIAL/FINAL PENDING atau PROCESSING pada task aktif.
