# Dokumentasi API

Kontrak berdasarkan implementasi MSW saat ini, bukan backend produksi. Base path: `/api`. Sumber: `src/mocks/handlers/`, schema di `src/features/`, dan tipe di `src/interface/`.

| Path                               | Endpoint | Dokumentasi                                 |
| ---------------------------------- | -------: | ------------------------------------------- |
| `/auth`                            |        5 | [Auth](auth.md)                             |
| `/users`                           |        6 | [Users](users.md)                           |
| `/roles`                           |        2 | [Roles](roles.md)                           |
| `/projects`                        |        8 | [Projects](projects.md)                     |
| `/tasks`                           |       17 | [Tasks](tasks.md)                           |
| `/tasks/:id/evidences`             |        7 | [Task evidence](task-evidences.md)          |
| `/mock-storage/evidence`           |        1 | [Mock storage](mock-storage.md)             |
| `/tasks/:id/ai-results` + approval |        5 | [Assessment & approval](task-ai-results.md) |
| `/assessment-rubric`               |        1 | [Rubric](assessment-rubric.md)              |
| `/changelogs`                      |        5 | [Changelogs](changelogs.md)                 |
| `/scores`                          |        3 | [Scores](scores.md)                         |
| `/dashboards`                      |        3 | [Dashboards](dashboards.md)                 |
| **Total**                          |   **63** |                                             |

Satu endpoint dihitung sebagai kombinasi HTTP method dan path. Semua path pada halaman modul sudah menyertakan `/api`.

## Konvensi

- Request body berupa JSON (`Content-Type: application/json`). GET dan DELETE tidak memakai body. Upload mock storage memakai body binary, bukan JSON.
- Endpoint terproteksi membutuhkan `Authorization: Bearer <accessToken>`. Pengecualian dijelaskan di halaman auth dan mock storage.
- ID body/filter yang divalidasi schema harus UUID. Parameter path dipakai untuk lookup; ID yang tidak ditemukan menghasilkan 404.
- Tanggal memakai `YYYY-MM-DD`; timestamp memakai ISO 8601. `null` berbeda dengan field yang tidak dikirim.
- Contoh memakai placeholder `<userId>`, `<projectId>`, dan sejenisnya; ganti dengan UUID resource sebenarnya.
- Response sukses default 200, kecuali dinyatakan 201. Notasi `User`, `Project`, dan `TaskDetail` merujuk ke [model response](models.md), bukan string literal JSON.

Response list:

```json
{ "data": { "items": [], "total": 0, "limit": 10, "offset": 0 } }
```

`total` adalah jumlah setelah filter dan pembatasan akses, sebelum pagination. Sorting ditetapkan handler pada modul tertentu (lihat changelogs dan scores); tidak ada parameter sorting. Default limit tasks/changelogs adalah 20; users/projects/scores 10. Limit 1–100, offset integer ≥ 0.

Response error:

```json
{ "message": "Unauthorized" }
```

| Status | Makna                                                                            |
| ------ | -------------------------------------------------------------------------------- |
| 400    | Body atau query tidak valid; pesan validasi dapat berasal dari issue pertama Zod |
| 401    | Token/session tidak valid, kedaluwarsa, atau user nonaktif                       |
| 403    | Role/aksi tidak diizinkan (`Forbidden`)                                          |
| 404    | Resource tidak ditemukan atau disembunyikan dari pemanggil                       |
| 409    | Konflik dengan kondisi resource saat ini                                         |

## Batas implementasi

MSW mengintersep request di browser, dengan data dan session simulasi di browser storage. Ini bukan server HTTP mandiri. Refresh cookie juga disimulasikan MSW. Workflow task dan upload evidence tersedia. Approval/rejection dan retry assessment tersedia. Evaluasi AI disimulasikan secara lazy saat membaca data task, tanpa LLM sungguhan. File evidence disimpan di IndexedDB pada mock.

Error tambahan pada evidence/storage: 413 untuk file terlalu besar dan 500 untuk kegagalan penyimpanan.

- [Notifications](notifications.md)

- [Team Wall](wall.md)

- [Attendance](attendance.md)
