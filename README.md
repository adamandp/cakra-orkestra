# Cakra Orkestra

AI-powered team workflow and performance management.

## Development

Requires Bun. Install dependencies, configure the environment, and start Next.js:

```sh
bun install
cp .env.example .env.local
bun run dev
```

Open http://localhost:3000.

| Variable                   | Development value |
| -------------------------- | ----------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `/api`            |
| `NEXT_PUBLIC_ENABLE_MSW`   | `true`            |

## Authentication demo

With MSW enabled, the following development-only accounts are available:

| Username | Password | Role   |
| -------- | -------- | ------ |
| admin    | admin    | ADMIN  |
| member   | member   | MEMBER |

Invalid credentials return HTTP 401. The access token lives in memory and expires after 15 minutes. The refresh token is delivered through a mocked Set-Cookie header, expires after seven days, and is validated against the mock session on refresh. Axios automatically refreshes and retries unauthorized requests once. Logout revokes the mock session and expires the cookie.

MSW stores its virtual cookies and simulated backend session in browser storage. Password changes also persist in browser storage. Clear the site's storage to reset the demo. The mock supports one active session per browser origin; it is not a real security boundary.

### Authentication endpoints

| Method | Path                 | Purpose                                       |
| ------ | -------------------- | --------------------------------------------- |
| POST   | `/api/auth/login`    | Validate credentials and create a session     |
| POST   | `/api/auth/refresh`  | Refresh access token using the refresh cookie |
| GET    | `/api/auth/me`       | Return current user and role                  |
| POST   | `/api/auth/logout`   | Revoke session                                |
| PATCH  | `/api/auth/password` | Change password                               |

### Role-based access

ADMIN can access all workspace pages. MEMBER cannot access Team Pulse or User Management. Navigation and direct-route guards use the same role configuration. Task and score ownership must be enforced by the future backend.

For real API integration, disable MSW and configure the backend URL. The backend must implement real token validation, secure HttpOnly cookies, authorization, session revocation and password hashing. Never use the mock credentials in production.

## Verification

```sh
bun run format:check
bun run lint
bun run typecheck
bun run build
```

## Implementation status

Frontend initialization, neubrutalism workspace shell, and authentication/RBAC are implemented. Business feature pages remain placeholders until their respective implementation stages.
