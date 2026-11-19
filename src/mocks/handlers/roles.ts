import { http, HttpResponse } from "msw";
import { findMockRole, mockRoles } from "../data/roles";
import { requireMockAdmin } from "./authorization";

export const roleHandlers = [
  http.get("*/api/roles", ({ request }) => {
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    return HttpResponse.json({ data: mockRoles });
  }),

  http.get("*/api/roles/:id", ({ request, params }) => {
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    const role = findMockRole(String(params.id));
    return role
      ? HttpResponse.json({ data: role })
      : HttpResponse.json({ message: "Role not found" }, { status: 404 });
  }),
];
