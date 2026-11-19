import { HttpResponse } from "msw";
import { getMockUser } from "../data/auth-store";

export function requireMockAdmin(request: Request) {
  const user = getMockUser(request);
  if (!user) {
    return {
      user: null,
      error: HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  if (user.role !== "ADMIN") {
    return {
      user: null,
      error: HttpResponse.json({ message: "Forbidden" }, { status: 403 }),
    } as const;
  }
  return { user, error: null } as const;
}
