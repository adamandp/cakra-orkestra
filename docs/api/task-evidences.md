# Task evidence — 6 endpoint

| Method   | Endpoint                                                                                      |
| -------- | --------------------------------------------------------------------------------------------- |
| `GET`    | [`/api/tasks/:id/evidences`](#get-apitasksidevidences)                                        |
| `POST`   | [`/api/tasks/:id/evidences/link`](#post-apitasksidevidenceslink)                              |
| `POST`   | [`/api/tasks/:id/evidences/presign`](#post-apitasksidevidencespresign)                        |
| `POST`   | [`/api/tasks/:id/evidences/confirm`](#post-apitasksidevidencesconfirm)                        |
| `GET`    | [`/api/tasks/:id/evidences/:evidenceId/download`](#get-apitasksidevidencesevidenceiddownload) |
| `DELETE` | [`/api/tasks/:id/evidences/:evidenceId`](#delete-apitasksidevidencesevidenceid)               |

Sumber: [handler](../../src/mocks/handlers/task-evidences.ts), [schema](../../src/features/tasks/task.schema.ts). Semua endpoint membutuhkan Bearer; ADMIN atau MEMBER assignee task. Error umum: 401 `Unauthorized`, 404 `Task not found`. Mutasi hanya pada task OPEN/PROGRESS/BLOCKED dan project ACTIVE; selain itu 409 `Task is locked`. Body JSON bersifat strict.

Model: [TaskEvidence dan TaskDetail](models.md). Alur file: presign → PUT binary ke upload_url → confirm. Upload saja belum menambahkan evidence pada task.

## GET /api/tasks/:id/evidences

Tanpa body/query. 200: `{ "data": TaskEvidence[] }`. Dapat dibaca walaupun task terkunci.

## POST /api/tasks/:id/evidences/link

```json
{ "url": "https://example.com/pull/123", "title": "Pull request" }
```

URL wajib, di-trim, URL HTTP/HTTPS valid, maksimal 2048 karakter. Title opsional, trim, 1–255 karakter; jika tidak dikirim disimpan null.
201: `{ "message": "Link added", "data": TaskDetail }`.
Evidence bertipe LINK, url terisi; object_key/file_name/mime_type/file_size null. Error: aturan umum dan 400 pesan validasi.

## POST /api/tasks/:id/evidences/presign

```json
{ "file_name": "proof.png", "mime_type": "image/png", "file_size": 1024 }
```

Semua field wajib. File name 1–255 karakter, tidak boleh hanya whitespace, mengandung slash/backslash atau karakter kontrol. MIME 1–100 karakter, format type/subtype tanpa parameter. File size integer > 0, maksimal 20 MiB (20,971,520 byte).

200:

```json
{
  "data": {
    "upload_url": "https://example.com/api/mock-storage/evidence/<uploadId>?token=<token>",
    "object_key": "tasks/<taskId>/<uploadId>",
    "expires_at": "2026-11-19T01:10:00.000Z"
  }
}
```

Host upload_url mengikuti origin request; URL berlaku 10 menit. Belum menambahkan metadata evidence. Error: aturan umum; 400 pesan validasi; 500 `Unable to prepare evidence storage`.

## POST /api/tasks/:id/evidences/confirm

```json
{ "object_key": "tasks/<taskId>/<uploadId>", "title": "Screenshot hasil" }
```

object_key wajib, panjang 1–512. Title opsional, trim, 1–255. Upload harus milik task dan pemanggil, belum kedaluwarsa, serta binary sudah cocok ukuran dan MIME-nya.
201: `{ "message": "File added", "data": TaskDetail }`.
FILE evidence memakai ID upload, url null, metadata file dari presign. Konfirmasi ulang evidence yang sudah ada: 200 `{ "message": "Evidence already confirmed", "data": TaskDetail }`.

Error: aturan umum; 400 pesan validasi / `Invalid object key`; 404 `Upload not found`; 409 `Evidence was removed` / `Upload expired` / `Uploaded file not verified`; 500 `Unable to verify evidence upload`.

## GET /api/tasks/:id/evidences/:evidenceId/download

Tanpa body/query. Hanya FILE. 200 body binary (bukan JSON), header Content-Type `application/octet-stream`, Content-Disposition `attachment`, Cache-Control `no-store`.
Error: aturan umum; 404 `File evidence not found` / `Evidence not found` / `File unavailable`; 500 `Unable to read evidence file`.

## DELETE /api/tasks/:id/evidences/:evidenceId

Tanpa body/query. 200: `{ "message": "Evidence removed", "data": TaskDetail }`.
Menghapus metadata; cleanup file di IndexedDB bersifat best-effort. File evidence yang sudah dihapus tidak dapat dikonfirmasi ulang.
Error: aturan umum; 404 `Evidence not found`.
