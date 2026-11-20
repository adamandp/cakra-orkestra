import { HttpResponse } from "msw";
import { http } from "./audited-http";
import {
  changelogListSchema,
  createChangelogSchema,
  updateChangelogSchema,
} from "@/features/changelogs/changelog.schema";
import { getMockUser } from "../data/auth-store";
import { findMockProject } from "../data/projects";
import { requireMockAdmin } from "./authorization";
import {
  canViewMockChangelog,
  createMockChangelog,
  deleteMockChangelog,
  findMockChangelog,
  getMockChangelogs,
  hasMockChangelogVersion,
  toPublicChangelog,
  updateMockChangelog,
} from "../data/changelogs";

function failure(message: string, status: number) {
  return HttpResponse.json({ message }, { status });
}

export const changelogHandlers = [
  http.get("*/api/changelogs", ({ request }) => {
    const actor = getMockUser(request);
    if (!actor) return failure("Unauthorized", 401);
    const parsed = changelogListSchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return failure("Invalid changelog filters", 400);
    const { q, project_id, limit, offset } = parsed.data;
    const keyword = q?.toLowerCase();
    const entries = getMockChangelogs()
      .filter(
        (entry) =>
          canViewMockChangelog(entry, actor) && (!project_id || entry.project_id === project_id),
      )
      .map(toPublicChangelog)
      .filter(
        (entry) =>
          !keyword ||
          [
            entry.version,
            entry.description ?? "",
            entry.commit_url ?? "",
            entry.project.name,
            entry.project.code,
            ...entry.changes.map((item) => item.description),
          ].some((value) => value.toLowerCase().includes(keyword)),
      )
      .sort(
        (a, b) =>
          Date.parse(b.released_at) - Date.parse(a.released_at) ||
          Date.parse(b.created_at) - Date.parse(a.created_at) ||
          a.id.localeCompare(b.id),
      );
    return HttpResponse.json({
      data: { items: entries.slice(offset, offset + limit), total: entries.length, limit, offset },
    });
  }),

  http.get("*/api/changelogs/:id", ({ request, params }) => {
    const actor = getMockUser(request);
    if (!actor) return failure("Unauthorized", 401);
    const entry = findMockChangelog(String(params.id));
    if (!entry || !canViewMockChangelog(entry, actor)) return failure("Changelog not found", 404);
    return HttpResponse.json({ data: toPublicChangelog(entry) });
  }),

  http.post("*/api/changelogs", async ({ request }) => {
    const parsed = createChangelogSchema.safeParse(await request.json().catch(() => null));
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    if (!parsed.success) return failure(parsed.error.issues[0].message, 400);
    const input = parsed.data;
    if (!findMockProject(input.project_id)) return failure("Project not found", 404);
    if (hasMockChangelogVersion(input.project_id, input.version))
      return failure("This version already exists for the project", 409);
    const entry = createMockChangelog(input, admin.user.id);
    return HttpResponse.json(
      { message: "Changelog created", data: toPublicChangelog(entry) },
      { status: 201 },
    );
  }),

  http.patch("*/api/changelogs/:id", async ({ request, params }) => {
    const parsed = updateChangelogSchema.safeParse(await request.json().catch(() => null));
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    if (!parsed.success) return failure(parsed.error.issues[0].message, 400);
    const id = String(params.id);
    const existing = findMockChangelog(id);
    if (!existing) return failure("Changelog not found", 404);
    if (
      parsed.data.version !== undefined &&
      hasMockChangelogVersion(existing.project_id, parsed.data.version, id)
    )
      return failure("This version already exists for the project", 409);
    const entry = updateMockChangelog(id, parsed.data);
    return entry
      ? HttpResponse.json({ message: "Changelog updated", data: toPublicChangelog(entry) })
      : failure("Changelog not found", 404);
  }),

  http.delete("*/api/changelogs/:id", ({ request, params }) => {
    const admin = requireMockAdmin(request);
    if (admin.error) return admin.error;
    return deleteMockChangelog(String(params.id))
      ? HttpResponse.json({ message: "Changelog deleted", data: null })
      : failure("Changelog not found", 404);
  }),
];
