import { http, HttpResponse } from "msw";
import {
  addProjectMembersSchema,
  createProjectSchema,
  projectListSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
} from "@/features/projects/project.schema";
import { getMockUser } from "../data/auth-store";
import { findMockUser } from "../data/users";
import {
  canViewMockProject,
  createMockProject,
  findMockProject,
  getMockProjects,
  toPublicProject,
  updateMockProject,
} from "../data/projects";
import { requireMockAdmin } from "./authorization";
import { hasUnfinishedMockTasks } from "../data/tasks";

function failure(message: string, status: number) {
  return HttpResponse.json({ message }, { status });
}

function requireProject(request: Request, id: string) {
  const user = getMockUser(request);
  if (!user) return { project: null, error: failure("Unauthorized", 401) } as const;
  const project = findMockProject(id);
  if (!project || !canViewMockProject(project, user)) {
    return { project: null, error: failure("Project not found", 404) } as const;
  }
  return { project, error: null } as const;
}

function validateActiveUsers(ids: string[]) {
  for (const id of new Set(ids)) {
    const user = findMockUser(id);
    if (!user) return failure("Selected user not found", 404);
    if (!user.is_active) return failure("Only active users can be assigned", 409);
  }
  return null;
}

function projectResponse(project: ReturnType<typeof updateMockProject>, message: string) {
  return project
    ? HttpResponse.json({ message, data: toPublicProject(project) })
    : failure("Project not found", 404);
}

export const projectHandlers = [
  http.get("*/api/projects", ({ request }) => {
    const user = getMockUser(request);
    if (!user) return failure("Unauthorized", 401);
    const search = new URL(request.url).searchParams;
    const result = projectListSchema.safeParse({
      q: search.get("q") ?? undefined,
      status: search.get("status") ?? undefined,
      limit: search.get("limit") ?? undefined,
      offset: search.get("offset") ?? undefined,
    });
    if (!result.success) return failure("Invalid project filters", 400);
    const { q, status, limit, offset } = result.data;
    const keyword = q?.toLowerCase();
    const projects = getMockProjects().filter(
      (project) =>
        canViewMockProject(project, user) &&
        (!status || project.status === status) &&
        (!keyword ||
          [project.name, project.code, project.description ?? ""].some((value) =>
            value.toLowerCase().includes(keyword),
          )),
    );
    return HttpResponse.json({
      data: {
        items: projects.slice(offset, offset + limit).map(toPublicProject),
        total: projects.length,
        limit,
        offset,
      },
    });
  }),

  http.get("*/api/projects/:id", ({ request, params }) => {
    const result = requireProject(request, String(params.id));
    if (result.error) return result.error;
    return HttpResponse.json({ data: toPublicProject(result.project) });
  }),

  http.post("*/api/projects", async ({ request }) => {
    const result = createProjectSchema.safeParse(await request.json().catch(() => null));
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    if (!result.success) return failure(result.error.issues[0].message, 400);
    const error = validateActiveUsers([result.data.owner_id, ...result.data.member_ids]);
    if (error) return error;
    const project = createMockProject(result.data, admin.user.id);
    return HttpResponse.json(
      { message: "Project created", data: toPublicProject(project) },
      { status: 201 },
    );
  }),

  http.patch("*/api/projects/:id", async ({ request, params }) => {
    const result = updateProjectSchema.safeParse(await request.json().catch(() => null));
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    if (!result.success) return failure(result.error.issues[0].message, 400);
    const id = String(params.id);
    const project = findMockProject(id);
    if (!project) return failure("Project not found", 404);
    if (result.data.owner_id && result.data.owner_id !== project.owner_id) {
      const error = validateActiveUsers([result.data.owner_id]);
      if (error) return error;
      if (
        !project.member_ids.includes(project.owner_id) &&
        hasUnfinishedMockTasks(id, project.owner_id)
      ) {
        return failure(
          "Reassign the previous owner's unfinished tasks or retain them as a member first",
          409,
        );
      }
    }
    return projectResponse(updateMockProject(id, result.data), "Project updated");
  }),

  http.patch("*/api/projects/:id/status", async ({ request, params }) => {
    const result = updateProjectStatusSchema.safeParse(await request.json().catch(() => null));
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    if (!result.success) return failure(result.error.issues[0].message, 400);
    const id = String(params.id);
    const project = findMockProject(id);
    if (!project) return failure("Project not found", 404);
    if (
      result.data.status !== "ACTIVE" &&
      result.data.status !== project.status &&
      hasUnfinishedMockTasks(id)
    ) {
      return failure("Finish or remove unfinished tasks before closing the project", 409);
    }
    return projectResponse(updateMockProject(id, result.data), "Project status updated");
  }),

  http.get("*/api/projects/:id/members", ({ request, params }) => {
    const result = requireProject(request, String(params.id));
    if (result.error) return result.error;
    return HttpResponse.json({ data: toPublicProject(result.project).members });
  }),

  http.post("*/api/projects/:id/members", async ({ request, params }) => {
    const result = addProjectMembersSchema.safeParse(await request.json().catch(() => null));
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    if (!result.success) return failure(result.error.issues[0].message, 400);
    const id = String(params.id);
    const project = findMockProject(id);
    if (!project) return failure("Project not found", 404);
    if (result.data.member_ids.some((userId) => project.member_ids.includes(userId))) {
      return failure("A selected user is already a project member", 409);
    }
    const error = validateActiveUsers(result.data.member_ids);
    if (error) return error;
    return projectResponse(
      updateMockProject(id, {
        member_ids: [...project.member_ids, ...result.data.member_ids],
      }),
      "Members added",
    );
  }),

  http.delete("*/api/projects/:id/members/:userId", ({ request, params }) => {
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    const id = String(params.id);
    const userId = String(params.userId);
    const project = findMockProject(id);
    if (!project) return failure("Project not found", 404);
    if (!project.member_ids.includes(userId)) return failure("Project member not found", 404);
    if (project.owner_id !== userId && hasUnfinishedMockTasks(id, userId)) {
      return failure("Reassign this member's unfinished tasks before removing them", 409);
    }
    return projectResponse(
      updateMockProject(id, {
        member_ids: project.member_ids.filter((memberId) => memberId !== userId),
      }),
      "Member removed",
    );
  }),
];
