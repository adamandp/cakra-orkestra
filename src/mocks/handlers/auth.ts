import { HttpResponse } from "msw";
import { http } from "./audited-http";
import { loginSchema, passwordSchema } from "@/features/auth/auth.schema";
import { getMockUsers, matchesMockPassword, updateMockPassword } from "../data/users";
import {
  revokeMockSession,
  createMockSession,
  getMockUser,
  refreshMockSession,
} from "../data/auth-store";

const REFRESH_COOKIE = "refreshToken";
const COOKIE_ATTRIBUTES = "HttpOnly; SameSite=Lax; Path=/api/auth";

function unauthorized(message = "Unauthorized") {
  return HttpResponse.json({ message }, { status: 401 });
}

export const authHandlers = [
  http.post("*/api/auth/login", async ({ request }) => {
    const result = loginSchema.safeParse(await request.json().catch(() => null));
    if (!result.success)
      return HttpResponse.json({ message: "Invalid login details" }, { status: 400 });
    const { username, password } = result.data;
    const user = getMockUsers().find((item) => item.username === username && item.is_active);
    if (!user || !(await matchesMockPassword(user.id, password))) {
      return unauthorized("Invalid username or password");
    }
    // Recheck after asynchronous password validation.
    if (
      !getMockUsers().some(
        (item) => item.id === user.id && item.username === username && item.is_active,
      )
    ) {
      return unauthorized("Invalid username or password");
    }
    const session = createMockSession(user.id);
    return HttpResponse.json(
      { message: "Login successful", data: { accessToken: session.accessToken } },
      {
        headers: {
          "Set-Cookie": `${REFRESH_COOKIE}=${session.refreshToken}; ${COOKIE_ATTRIBUTES}; Max-Age=${Math.ceil((session.refreshExpiresAt - Date.now()) / 1000)}`,
        },
      },
    );
  }),

  http.post("*/api/auth/refresh", ({ cookies }) => {
    const session = refreshMockSession(cookies[REFRESH_COOKIE]);
    return session
      ? HttpResponse.json({
          message: "Session refreshed",
          data: { accessToken: session.accessToken },
        })
      : unauthorized("Session expired");
  }),

  http.get("*/api/auth/me", ({ request }) => {
    const user = getMockUser(request);
    return user ? HttpResponse.json({ data: user }) : unauthorized();
  }),

  http.post("*/api/auth/logout", ({ cookies }) => {
    revokeMockSession(cookies[REFRESH_COOKIE]);
    return HttpResponse.json(
      { message: "Logged out" },
      { headers: { "Set-Cookie": `${REFRESH_COOKIE}=; ${COOKIE_ATTRIBUTES}; Max-Age=0` } },
    );
  }),

  http.patch("*/api/auth/password", async ({ request }) => {
    const user = getMockUser(request);
    if (!user) return unauthorized();
    const result = passwordSchema.safeParse(await request.json().catch(() => null));
    if (!result.success)
      return HttpResponse.json({ message: "Invalid password details" }, { status: 400 });
    const { current_password, new_password } = result.data;
    if (!(await matchesMockPassword(user.id, current_password))) {
      return HttpResponse.json({ message: "Current password is incorrect" }, { status: 400 });
    }
    if (current_password === new_password) {
      return HttpResponse.json({ message: "Choose a different password" }, { status: 400 });
    }
    await updateMockPassword(user.id, new_password);
    return HttpResponse.json({ message: "Password updated" });
  }),
];
