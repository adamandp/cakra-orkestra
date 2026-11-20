# Cakra Orkestra

Workspace untuk mengelola project, tugas, dan anggota tim, dengan arah pengembangan ke workflow dan penilaian kontribusi berbasis AI.

Saat ini project berfokus pada frontend dengan mock API menggunakan MSW. Backend dan pemrosesan AI sungguhan belum terintegrasi.

## Fitur & status

- **Autentikasi:** login, logout, refresh session, ubah password, dan akses berdasarkan role ADMIN / MEMBER.
- **Projects:** daftar dan detail project, buat/edit project, ubah status, serta kelola anggota.
- **Manage Tasks:** daftar dan detail tugas, buat/edit/hapus tugas, pengaturan assignee, checklist, workflow status, evidence link/file, serta approval/revisi.
- **User Management:** pengelolaan user, status, dan role; khusus ADMIN.
- **Workspace UI:** sidebar responsif, tema terang/gelap, dan tampilan neubrutalism.

My Focus dan PM & Team Pulse menampilkan ringkasan tugas serta beban kerja. Scores menampilkan kontribusi bulanan; Changelog mendokumentasikan rilis per project; Guideline & Flow menjelaskan alur kerja dan rubrik penilaian. Assessment INITIAL/FINAL disimulasikan oleh mock API, termasuk retry saat gagal. Data demo disimpan di browser, dengan file evidence di IndexedDB.

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui + Base UI, TanStack Query, Axios, React Hook Form + Zod, dan MSW. Package manager menggunakan Bun.

## Menjalankan project

```sh
bun install
cp .env.example .env.local
bun run dev
```

Buka [localhost:3000](http://localhost:3000). Konfigurasi default di `.env.example` memakai `/api` sebagai base URL dan mengaktifkan MSW.

Akun demo (hanya untuk mock API):

| Username | Password | Role   |
| -------- | -------- | ------ |
| admin    | admin    | ADMIN  |
| member   | member   | MEMBER |

Untuk memakai backend sungguhan, set `NEXT_PUBLIC_ENABLE_MSW=false` dan sesuaikan `NEXT_PUBLIC_API_BASE_URL`. Hapus site storage di browser untuk mereset data demo.

## Struktur singkat

- `src/app/` — halaman, routing, dan layout.
- `src/features/` — modul fitur beserta UI, schema, dan akses datanya.
- `src/components/` — komponen UI dan layout bersama.
- `src/providers/` — provider autentikasi, query, dan mock API.
- `src/interface/` — tipe data dan kontrak API.
- `src/mocks/` — handler API dan data demo.

## Quality checks

```sh
bun run format:check
bun run lint
bun run typecheck
bun run build
```

## Dokumentasi API

Lihat [docs/api](docs/api/README.md) untuk daftar endpoint, request, response, validasi, dan aturan akses per path.
