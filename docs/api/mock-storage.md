# Mock storage — 1 endpoint

| Method | Endpoint                                                                       |
| ------ | ------------------------------------------------------------------------------ |
| `PUT`  | [`/api/mock-storage/evidence/:uploadId`](#put-apimock-storageevidenceuploadid) |

Endpoint khusus simulasi object storage, bukan API bisnis. Sumber: [handler evidence](../../src/mocks/handlers/task-evidences.ts), [storage IndexedDB](../../src/mocks/data/task-evidences.ts).

## PUT /api/mock-storage/evidence/:uploadId

Gunakan upload_url dari [presign](task-evidences.md) secara utuh. Tidak membutuhkan Bearer; query `token` wajib dan harus cocok dengan upload record.

Header Content-Type harus sama persis dengan mime_type pada presign. Body berupa binary file mentah, bukan JSON atau multipart. Ukuran binary harus sama dengan file_size pada presign dan maksimal 20 MiB.

200 body kosong. Upload satu kali; tidak dapat menimpa binary yang sudah ada. Setelah upload, panggil endpoint confirm untuk menambahkan evidence ke task.

| Status | Message                                                                           |
| ------ | --------------------------------------------------------------------------------- |
| 400    | `Upload size or type does not match`                                              |
| 403    | `Invalid upload token` (query token hilang)                                       |
| 403    | `Invalid or expired upload URL` (record/token tidak cocok atau sudah kedaluwarsa) |
| 409    | `Object already uploaded`                                                         |
| 413    | `File too large`                                                                  |
| 500    | `Unable to store evidence file`                                                   |
