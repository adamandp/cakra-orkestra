# Assessment rubric — 1 endpoint

| Method | Endpoint                                              |
| ------ | ----------------------------------------------------- |
| `GET`  | [`/api/assessment-rubric`](#get-apiassessment-rubric) |

## GET /api/assessment-rubric

Bearer wajib, ADMIN/MEMBER. Tanpa body/query. Error: 401 `{ "message": "Unauthorized" }`.

200:

```json
{
  "data": [
    { "tier": "SPARK", "points": 1, "description": "Small or simple changes" },
    { "tier": "PULSE", "points": 2, "description": "Routine, low-risk work" },
    { "tier": "CORE", "points": 5, "description": "Standard feature development or integration" },
    { "tier": "SURGE", "points": 8, "description": "Complex or cross-service work" },
    { "tier": "APEX", "points": 13, "description": "Architectural or high-impact work" }
  ]
}
```

Sumber: [handler](../../src/mocks/handlers/task-ai-results.ts), [rubrik](../../src/features/tasks/task-ai-result.constants.ts). Response `AssessmentRubricItem[]` memakai nilai mock statis saat ini.
