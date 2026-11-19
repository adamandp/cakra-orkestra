# Cakra Orkestra

Workspace untuk mengelola project, tugas, dan anggota tim, dengan arah pengembangan ke workflow dan penilaian kontribusi berbasis AI.

Saat ini project berfokus pada frontend dengan mock API menggunakan MSW. Backend dan pemrosesan AI sungguhan belum terintegrasi.

## Fitur & status

- **Autentikasi:** login, logout, refresh session, ubah password, dan akses berdasarkan role ADMIN / MEMBER.
- **Projects:** daftar dan detail project, buat/edit project, ubah status, serta kelola anggota.
- **Manage Tasks:** daftar dan detail tugas, buat/edit/hapus tugas, pengaturan assignee, dan checklist.
- **User Management:** pengelolaan user, status, dan role; khusus ADMIN.
- **Workspace UI:** sidebar responsif, tema terang/gelap, dan tampilan neubrutalism.

My Focus, PM & Team Pulse, Scores, Changelog, dan Guideline & Flow masih berupa halaman placeholder. Data dan hasil AI pada demo disimulasikan oleh mock API; data demo disimpan di browser.

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
- `src/features/` — modul auth, projects, tasks, dan users beserta UI dan akses datanya.
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
