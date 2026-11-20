import { HttpResponse } from "msw";
import { http } from "./audited-http";
import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  userListSchema,
} from "@/features/users/user.schema";
import type { UserListResponse } from "@/interface/user.interface";
import { revokeMockSessionForUser } from "../data/auth-store";
import { findMockRole } from "../data/roles";
import {
  createMockUser,
  findMockUser,
  getMockUsers,
  toPublicUser,
  updateMockUser,
} from "../data/users";
import { getMockUser } from "../data/auth-store";
import { requireMockAdmin } from "./authorization";

function badRequest(message: string) {
  return HttpResponse.json({ message }, { status: 400 });
}

function notFound(message = "User not found") {
  return HttpResponse.json({ message }, { status: 404 });
}

function conflict(message: string) {
  return HttpResponse.json({ message }, { status: 409 });
}

export const userHandlers = [
  http.get("*/api/users", ({ request }) => {
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;

    const search = new URL(request.url).searchParams;
    const result = userListSchema.safeParse({
      q: search.get("q") ?? undefined,
      role_id: search.get("role_id") ?? undefined,
      is_active: search.get("is_active") ?? undefined,
      limit: search.get("limit") ?? undefined,
      offset: search.get("offset") ?? undefined,
    });
    if (!result.success) return badRequest("Invalid user filters");

    const { q, role_id, is_active, limit, offset } = result.data;
    const keyword = q?.toLowerCase();
    const users = getMockUsers().filter((user) => {
      const matchSearch =
        !keyword ||
        user.name.toLowerCase().includes(keyword) ||
        user.username.toLowerCase().includes(keyword);
      const matchRole = !role_id || user.role_id === role_id;
      const matchStatus = is_active === undefined || user.is_active === (is_active === "true");
      return matchSearch && matchRole && matchStatus;
    });

    const data: UserListResponse = {
      items: users.slice(offset, offset + limit).map(toPublicUser),
      total: users.length,
      limit,
      offset,
    };
    return HttpResponse.json({ data });
  }),

  http.get("*/api/users/:id", ({ request, params }) => {
    const actor = getMockUser(request);
    if (!actor) return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (actor.role !== "ADMIN" && actor.id !== String(params.id)) return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
    const user = findMockUser(String(params.id));
    return user ? HttpResponse.json({ data: toPublicUser(user) }) : notFound();
  }),

  http.post("*/api/users", async ({ request }) => {
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    const result = createUserSchema.safeParse(await request.json().catch(() => null));
    if (!result.success) return badRequest(result.error.issues[0].message);
    const role = findMockRole(result.data.role_id);
    if (!role) return notFound("Role not found");

    // The shared store checks uniqueness immediately before inserting.
    const user = await createMockUser(result.data, role);
    if (!user) return conflict("Username is already taken");
    return HttpResponse.json(
      { message: "User created", data: toPublicUser(user) },
      { status: 201 },
    );
  }),

  http.patch("*/api/users/:id", async ({ request, params }) => {
    const actor = getMockUser(request);
    if (!actor) return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (actor.role !== "ADMIN" && actor.id !== String(params.id)) return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
    const result = updateUserSchema.safeParse(await request.json().catch(() => null));
    if (!result.success) return badRequest(result.error.issues[0].message);

    const id = String(params.id);
    if (!findMockUser(id)) return notFound();
    const { username } = result.data;
    if (
      username !== undefined &&
      getMockUsers().some((user) => user.id !== id && user.username === username)
    ) {
      return conflict("Username is already taken");
    }
    const updated = updateMockUser(id, result.data);
    return updated
      ? HttpResponse.json({ message: "User updated", data: toPublicUser(updated) })
      : notFound();
  }),

  http.patch("*/api/users/:id/status", async ({ request, params }) => {
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    const result = updateUserStatusSchema.safeParse(await request.json().catch(() => null));
    if (!result.success) return badRequest(result.error.issues[0].message);
    const id = String(params.id);
    const user = findMockUser(id);
    if (!user) return notFound();
    if (id === admin.user.id && !result.data.is_active) {
      return conflict("You cannot deactivate your own account");
    }
    const updated = updateMockUser(id, result.data);
    if (!updated) return notFound();
    if (!updated.is_active) revokeMockSessionForUser(id);
    return HttpResponse.json({
      message: updated.is_active ? "User activated" : "User deactivated",
      data: toPublicUser(updated),
    });
  }),

  http.patch("*/api/users/:id/role", async ({ request, params }) => {
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    const result = updateUserRoleSchema.safeParse(await request.json().catch(() => null));
    if (!result.success) return badRequest(result.error.issues[0].message);
    const id = String(params.id);
    const user = findMockUser(id);
    if (!user) return notFound();
    const role = findMockRole(result.data.role_id);
    if (!role) return notFound("Role not found");
    if (id === admin.user.id && role.name !== "ADMIN") {
      return conflict("You cannot change your own role");
    }
    const updated = updateMockUser(id, { role: role.name, role_id: role.id });
    if (!updated) return notFound();
    if (user.role_id !== updated.role_id) revokeMockSessionForUser(id);
    return HttpResponse.json({ message: "Role updated", data: toPublicUser(updated) });
  }),
];
