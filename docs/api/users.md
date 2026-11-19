# Users — 6 endpoint

| Method  | Endpoint                                           |
| ------- | -------------------------------------------------- |
| `GET`   | [`/api/users`](#get-apiusers)                      |
| `GET`   | [`/api/users/:id`](#get-apiusersid)                |
| `POST`  | [`/api/users`](#post-apiusers)                     |
| `PATCH` | [`/api/users/:id`](#patch-apiusersid)              |
| `PATCH` | [`/api/users/:id/status`](#patch-apiusersidstatus) |
| `PATCH` | [`/api/users/:id/role`](#patch-apiusersidrole)     |

Semua endpoint khusus ADMIN: 401 jika tidak terautentikasi, 403 jika bukan ADMIN. Sumber: [handler](../../src/mocks/handlers/users.ts), [schema](../../src/features/users/user.schema.ts). Model: [User](models.md).

## GET /api/users

Query opsional:

| Field       | Format / default                                                           |
| ----------- | -------------------------------------------------------------------------- |
| `q`         | String di-trim, maksimal 255; mencari nama atau username, case-insensitive |
| `role_id`   | UUID role                                                                  |
| `is_active` | String `true` atau `false`                                                 |
| `limit`     | Integer 1–100; default 10                                                  |
| `offset`    | Integer ≥ 0; default 0                                                     |

Contoh: `/api/users?q=admin&is_active=true&limit=10&offset=0`.

200: `{ "data": { "items": User[], "total": number, "limit": number, "offset": number } }`.
Error: 400 `Invalid user filters`.

## GET /api/users/:id

Tanpa body/query. 200: `{ "data": User }`. Error: 404 `User not found`.

## POST /api/users

Body (semua field wajib; nullable tetap harus dikirim):

```json
{
  "username": "budi",
  "name": "Budi",
  "password": "password123",
  "role_id": "00000000-0000-4000-8000-000000000102",
  "avatar_url": null,
  "birth_date": null
}
```

| Field        | Validasi                                   |
| ------------ | ------------------------------------------ |
| `username`   | Trim, 1–100 karakter; unik, case-sensitive |
| `name`       | Trim, 1–150 karakter                       |
| `password`   | 8–100 karakter                             |
| `role_id`    | UUID role yang ada                         |
| `avatar_url` | URL HTTP/HTTPS yang valid atau null        |
| `birth_date` | `YYYY-MM-DD` atau null                     |

201: `{ "message": "User created", "data": User }`. User baru aktif secara default. Password tidak dikembalikan.
Error: 400 pesan validasi; 404 `Role not found`; 409 `Username is already taken`.

## PATCH /api/users/:id

Body menerima subset `username`, `name`, `avatar_url`, `birth_date`, dengan validasi seperti create. Minimal satu field; field lain ditolak.

```json
{ "name": "Budi Santoso", "avatar_url": null }
```

200: `{ "message": "User updated", "data": User }`.
Error: 400 pesan validasi; 404 `User not found`; 409 `Username is already taken`.

## PATCH /api/users/:id/status

```json
{ "is_active": false }
```

`is_active` boolean wajib; field lain ditolak. 200: `{ "message": "User deactivated", "data": User }` atau pesan `User activated` ketika true. Menonaktifkan user mencabut session mock miliknya.

Error: 400 pesan validasi; 404 `User not found`; 409 `You cannot deactivate your own account`.

## PATCH /api/users/:id/role

```json
{ "role_id": "00000000-0000-4000-8000-000000000102" }
```

UUID role wajib; field lain ditolak. 200: `{ "message": "Role updated", "data": User }`. Perubahan role mencabut session mock user tersebut.

Error: 400 pesan validasi; 404 `User not found` / `Role not found`; 409 `You cannot change your own role` jika ADMIN mengganti role sendiri ke selain ADMIN.
