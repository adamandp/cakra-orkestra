# Roles — 2 endpoint

| Method | Endpoint                            |
| ------ | ----------------------------------- |
| `GET`  | [`/api/roles`](#get-apiroles)       |
| `GET`  | [`/api/roles/:id`](#get-apirolesid) |

Semua endpoint khusus ADMIN: 401 `Unauthorized`, 403 `Forbidden`. Tidak ada request body atau query. Sumber: [handler](../../src/mocks/handlers/roles.ts), [data](../../src/mocks/data/roles.ts). Model lengkap: [UserRole](models.md).

## GET /api/roles

200:

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000101",
      "name": "ADMIN",
      "description": "Manage users, projects, and task approvals.",
      "created_at": "2026-11-19T00:00:00.000Z",
      "updated_at": "2026-11-19T00:00:00.000Z"
    },
    {
      "id": "00000000-0000-4000-8000-000000000102",
      "name": "MEMBER",
      "description": "Manage personal tasks and view personal scores.",
      "created_at": "2026-11-19T00:00:00.000Z",
      "updated_at": "2026-11-19T00:00:00.000Z"
    }
  ]
}
```

## GET /api/roles/:id

200: `{ "data": UserRole }` dengan satu objek seperti pada list. Error: 404 `{ "message": "Role not found" }`.

Role saat ini statis; belum ada endpoint create/update/delete role.
