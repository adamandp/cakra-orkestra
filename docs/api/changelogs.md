# Changelogs — 5 endpoint

| Method   | Endpoint                                         |
| -------- | ------------------------------------------------ |
| `GET`    | [`/api/changelogs`](#get-apichangelogs)          |
| `GET`    | [`/api/changelogs/:id`](#get-apichangelogsid)    |
| `POST`   | [`/api/changelogs`](#post-apichangelogs)         |
| `PATCH`  | [`/api/changelogs/:id`](#patch-apichangelogsid)  |
| `DELETE` | [`/api/changelogs/:id`](#delete-apichangelogsid) |

Bearer wajib. ADMIN dapat membaca semua; MEMBER hanya changelog project yang boleh dilihat (owner/anggota). Mutasi khusus ADMIN (403 `Forbidden`). Tanpa session: 401 `Unauthorized`. Sumber: [handler](../../src/mocks/handlers/changelogs.ts), [schema](../../src/features/changelogs/changelog.schema.ts). Model: [Changelog](models.md).

## GET /api/changelogs

Query opsional: q (trim, maksimal 255), project_id (UUID), limit (integer 1–100, default 20), offset (integer ≥ 0, default 0). Pencarian case-insensitive pada version, description, commit_url, nama/kode project, dan deskripsi changes.

200: `{ "data": { "items": Changelog[], "total": number, "limit": number, "offset": number } }`.
Urutan released_at terbaru, lalu created_at terbaru, lalu ID ascending. Error: 400 `Invalid changelog filters`.

## GET /api/changelogs/:id

Tanpa body/query. 200: `{ "data": Changelog }`. Error: 404 `Changelog not found`, termasuk jika tidak boleh dilihat.

## POST /api/changelogs

```json
{
  "project_id": "<projectId>",
  "version": "1.0.0",
  "description": null,
  "commit_url": null,
  "released_at": "2026-11-20T10:00:00+07:00",
  "changes": [{ "description": "Add team dashboard" }]
}
```

| Field       | Validasi / default                                        |
| ----------- | --------------------------------------------------------- |
| project_id  | Wajib UUID project yang ada                               |
| version     | Wajib, trim, 1–30 karakter; unik per project              |
| description | String trim atau null; default null                       |
| commit_url  | URL HTTP/HTTPS trim atau null; default null               |
| released_at | ISO datetime dengan Z/offset; default waktu create        |
| changes     | Default []; tiap item hanya description trim tidak kosong |

Field lain ditolak. Tidak mensyaratkan project ACTIVE. 201: `{ "message": "Changelog created", "data": Changelog }`.
Error: 400 pesan validasi; 404 `Project not found`; 409 `This version already exists for the project`.

## PATCH /api/changelogs/:id

Subset version, description, commit_url, released_at, changes dengan validasi seperti create, minimal satu field. project_id tidak dapat diubah; field lain ditolak. Contoh `{ "version": "1.0.1", "changes": [{ "description": "Fix login" }] }`. changes menggantikan seluruh daftar item.

200: `{ "message": "Changelog updated", "data": Changelog }`.
Error: 400 pesan validasi; 404 `Changelog not found`; 409 `This version already exists for the project`.

## DELETE /api/changelogs/:id

Tanpa body/query. 200: `{ "message": "Changelog deleted", "data": null }`. Error: 404 `Changelog not found`.
