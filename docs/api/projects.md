# Projects — 8 endpoint

| Method   | Endpoint                                                                  |
| -------- | ------------------------------------------------------------------------- |
| `GET`    | [`/api/projects`](#get-apiprojects)                                       |
| `GET`    | [`/api/projects/:id`](#get-apiprojectsid)                                 |
| `POST`   | [`/api/projects`](#post-apiprojects)                                      |
| `PATCH`  | [`/api/projects/:id`](#patch-apiprojectsid)                               |
| `PATCH`  | [`/api/projects/:id/status`](#patch-apiprojectsidstatus)                  |
| `GET`    | [`/api/projects/:id/members`](#get-apiprojectsidmembers)                  |
| `POST`   | [`/api/projects/:id/members`](#post-apiprojectsidmembers)                 |
| `DELETE` | [`/api/projects/:id/members/:userId`](#delete-apiprojectsidmembersuserid) |

Sumber: [handler](../../src/mocks/handlers/projects.ts), [schema](../../src/features/projects/project.schema.ts). Model: [Project dan ProjectUser](models.md).

Semua endpoint membutuhkan Bearer (401 `Unauthorized`). GET tersedia untuk ADMIN atau MEMBER yang merupakan owner/anggota project. Project yang tidak dapat dilihat dikembalikan sebagai 404 `Project not found`. Semua mutasi khusus ADMIN (403 `Forbidden` untuk MEMBER).

## GET /api/projects

Query opsional: `q` (trim, maksimal 255; pencarian case-insensitive pada name/code/description), `status` (`ACTIVE`, `COMPLETED`, `ARCHIVED`), `limit` (1–100, default 10), `offset` (≥ 0, default 0).

200: `{ "data": { "items": Project[], "total": number, "limit": number, "offset": number } }`.
Hanya project yang boleh dilihat yang masuk list. Error: 400 `Invalid project filters`.

## GET /api/projects/:id

Tanpa body/query. 200: `{ "data": Project }`. Error: 404 `Project not found`.

## POST /api/projects

```json
{
  "name": "Project Baru",
  "description": null,
  "owner_id": "<userId>",
  "member_ids": ["<memberId>"]
}
```

| Field         | Validasi                                              |
| ------------- | ----------------------------------------------------- |
| `name`        | Wajib; trim, 1–255 karakter                           |
| `description` | Wajib; string di-trim atau null                       |
| `owner_id`    | Wajib; UUID user aktif                                |
| `member_ids`  | Opsional; default []; UUID user aktif, tanpa duplikat |

Field lain ditolak. Owner tidak otomatis dimasukkan ke array members. `id`, `code` (`PRJ-...`), `created_by`, timestamp, dan status awal `ACTIVE` dibuat mock.

201: `{ "message": "Project created", "data": Project }`.
Error: 400 pesan validasi; 404 `Selected user not found`; 409 `Only active users can be assigned`.

## PATCH /api/projects/:id

Subset dari `name`, `description`, `owner_id`, dengan validasi seperti create. Minimal satu field; field lain ditolak.

```json
{ "name": "Nama baru", "owner_id": "<userId>" }
```

200: `{ "message": "Project updated", "data": Project }`.
Error: 400 pesan validasi; 404 `Project not found` / `Selected user not found`; 409 `Only active users can be assigned`.

Mengganti owner juga dapat menghasilkan 409 `Reassign the previous owner's unfinished tasks or retain them as a member first` jika owner lama tidak ada di members dan masih punya task belum DONE.

## PATCH /api/projects/:id/status

```json
{ "status": "COMPLETED" }
```

Status wajib: `ACTIVE`, `COMPLETED`, atau `ARCHIVED`; field lain ditolak.
200: `{ "message": "Project status updated", "data": Project }`.
Error: 400 pesan validasi; 404 `Project not found`; 409 `Finish or remove unfinished tasks before closing the project` jika status berubah ke selain ACTIVE dan masih ada task belum DONE yang tidak dihapus.

## GET /api/projects/:id/members

Tanpa body/query. 200: `{ "data": ProjectUser[] }`. Mengembalikan anggota eksplisit, bukan otomatis owner. Error: 404 `Project not found`.

## POST /api/projects/:id/members

```json
{ "member_ids": ["<userId>"] }
```

Array UUID wajib, minimal satu, tanpa duplikat; field lain ditolak. 200: `{ "message": "Members added", "data": Project }` (seluruh project, bukan hanya anggota baru).

Error: 400 pesan validasi; 404 `Project not found` / `Selected user not found`; 409 `A selected user is already a project member` / `Only active users can be assigned`.

## DELETE /api/projects/:id/members/:userId

Tanpa body/query. 200: `{ "message": "Member removed", "data": Project }`.
Error: 404 `Project not found` / `Project member not found`; 409 `Reassign this member's unfinished tasks before removing them`.

Pemeriksaan task belum selesai berlaku jika anggota yang dihapus bukan owner. Menghapus owner dari array members tidak mengubah `owner_id` atau menghilangkan akses owner.
