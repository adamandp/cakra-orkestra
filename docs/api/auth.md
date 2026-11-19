# Auth — 5 endpoint

| Method  | Endpoint                                       |
| ------- | ---------------------------------------------- |
| `POST`  | [`/api/auth/login`](#post-apiauthlogin)        |
| `POST`  | [`/api/auth/refresh`](#post-apiauthrefresh)    |
| `GET`   | [`/api/auth/me`](#get-apiauthme)               |
| `POST`  | [`/api/auth/logout`](#post-apiauthlogout)      |
| `PATCH` | [`/api/auth/password`](#patch-apiauthpassword) |

Sumber: [handler](../../src/mocks/handlers/auth.ts), [schema](../../src/features/auth/auth.schema.ts). Model: [AuthUser](models.md).

## POST /api/auth/login

Akses publik. Body wajib:

```json
{ "username": "admin", "password": "admin" }
```

Username di-trim, panjang 1–100; password 1–100. User harus aktif.

200:

```json
{ "message": "Login successful", "data": { "accessToken": "<accessToken>" } }
```

Header `Set-Cookie: refreshToken=<refreshToken>; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=<detik tersisa>`. Access token berlaku 15 menit, refresh token 7 hari. Login membuat satu session aktif per browser origin dan menggantikan session sebelumnya.

Error: 400 `Invalid login details`; 401 `Invalid username or password`.

## POST /api/auth/refresh

Tanpa body/Bearer; membutuhkan cookie `refreshToken`.

200:

```json
{ "message": "Session refreshed", "data": { "accessToken": "<accessToken baru>" } }
```

Refresh hanya mengganti access token beserta masa berlakunya; refresh token dan batas 7 harinya tetap. Error: 401 `Session expired`.

## GET /api/auth/me

Bearer wajib; tanpa body/query. 200: `{ "data": AuthUser }`.

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "username": "admin",
    "name": "Admin",
    "role": "ADMIN",
    "avatar_url": null,
    "is_active": true
  }
}
```

Nilai nama pada contoh hanya ilustrasi. Error: 401 `Unauthorized`.

## POST /api/auth/logout

Tanpa body/Bearer. Cookie `refreshToken` dipakai untuk mencabut session yang cocok. Tetap 200 jika cookie tidak ada/tidak cocok:

```json
{ "message": "Logged out" }
```

Mengirim `Set-Cookie` dengan atribut yang sama seperti login dan `Max-Age=0`.

## PATCH /api/auth/password

Bearer wajib. Body:

```json
{ "current_password": "admin", "new_password": "password-baru-123" }
```

`current_password` wajib, 1–100 karakter. `new_password` wajib, 8–100 karakter dan harus berbeda dari password lama. `confirm_password` hanya dipakai form frontend, bukan field API.

200:

```json
{ "message": "Password updated" }
```

Error: 401 `Unauthorized`; 400 `Invalid password details`, `Current password is incorrect`, atau `Choose a different password`. Mock menyimpan perubahan password di browser storage dan tidak mencabut session saat password diganti.
