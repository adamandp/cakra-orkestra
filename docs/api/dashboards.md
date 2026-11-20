# Dashboards — 3 endpoint

| Method | Endpoint                                                                        |
| ------ | ------------------------------------------------------------------------------- |
| `GET`  | [`/api/dashboards/my-focus`](#get-apidashboardsmy-focus)                        |
| `GET`  | [`/api/dashboards/team-pulse/summary`](#get-apidashboardsteam-pulsesummary)     |
| `GET`  | [`/api/dashboards/team-pulse/workloads`](#get-apidashboardsteam-pulseworkloads) |

Semua memakai Bearer, tanpa request body atau query. Tidak ada pagination/filter bulan. Sumber: [handler](../../src/mocks/handlers/dashboards.ts), [agregasi](../../src/mocks/data/dashboards.ts). Model lengkap: [MyFocusSummary, TeamPulseSummary, MemberWorkload](models.md). Error: 401 `Unauthorized`; endpoint team-pulse juga 403 `Forbidden` untuk MEMBER.

## GET /api/dashboards/my-focus

ADMIN/MEMBER; hanya task assignee pemanggil. 200: `{ "data": MyFocusSummary }`.

```json
{
  "data": {
    "active_tasks": 0,
    "completed_tasks": 0,
    "blocked_tasks": 0,
    "pending_tasks": 0,
    "waiting_approval_tasks": 0,
    "final_assessment_tasks": 0,
    "potential_points": 0,
    "pending_points": 0,
    "approved_points": 0,
    "unestimated_tasks": 0
  }
}
```

## GET /api/dashboards/team-pulse/summary

ADMIN. 200: `{ "data": TeamPulseSummary }`.

```json
{
  "data": {
    "waiting_approval_tasks": 0,
    "waiting_approval_points": 0,
    "blocked_tasks": 0,
    "completed_tasks": 0,
    "total_tasks": 0,
    "active_tasks": 0,
    "active_projects": 0,
    "completion_rate": 0,
    "final_assessment_tasks": 0,
    "failed_final_assessments": 0
  }
}
```

## GET /api/dashboards/team-pulse/workloads

ADMIN. 200: `{ "data": MemberWorkload[] }`. Tiap item berisi member ProjectUser, active_tasks TaskListItem[], active_points, approved_points, unestimated_tasks, dan status. Semua user aktif disertakan; user nonaktif tetap disertakan jika punya task non-deleted. Termasuk user ADMIN. Urutan active_points terbesar, lalu nama ascending.

## Arti agregasi

- Task soft-deleted diabaikan. Active = belum DONE; completed = DONE.
- Waiting approval = PENDING tanpa approved_at, approved_by, maupun FINAL. Final assessment = PENDING selain waiting approval, termasuk hasil FAILED.
- Potential/active/pending points menggunakan INITIAL COMPLETED dari kelompok task terkait. Approved points memakai FINAL COMPLETED pada task DONE, sepanjang waktu.
- Unestimated = INITIAL belum COMPLETED atau points null pada task aktif.
- active_projects adalah jumlah project unik pada task aktif, bukan jumlah semua project berstatus ACTIVE.
- completion_rate = pembulatan persentase DONE / seluruh task, atau 0 ketika kosong.
- Workload status berdasarkan active_points: AVAILABLE < 6; BALANCED 6–12; HIGH_LOAD ≥ 13.
