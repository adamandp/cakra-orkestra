import type { AuthUser } from "@/interface/auth.interface";
import type { ProjectUser } from "@/interface/project.interface";
import type {
  Changelog,
  ChangelogItem,
  CreateChangelogInput,
  UpdateChangelogInput,
} from "@/interface/changelog.interface";
import { canViewMockProject, findMockProject } from "./projects";
import { findMockUser } from "./users";

const CHANGELOGS_KEY = "cakra-orkestra:mock-changelogs:v1";
const ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const PROJECT_1_ID = "00000000-0000-4000-8000-000000000201";
const PROJECT_2_ID = "00000000-0000-4000-8000-000000000202";

export type MockChangelog = Omit<Changelog, "project" | "creator">;

function makeChanges(id: string, input: { description: string }[]): ChangelogItem[] {
  return input.map(({ description }) => ({
    id: crypto.randomUUID(),
    changelog_id: id,
    description,
  }));
}

function buildChangelog(
  input: CreateChangelogInput,
  actorId: string,
  now: string,
  id = crypto.randomUUID(),
): MockChangelog {
  return {
    id,
    project_id: input.project_id,
    created_by: actorId,
    version: input.version,
    description: input.description ?? null,
    commit_url: input.commit_url ?? null,
    released_at: input.released_at ? new Date(input.released_at).toISOString() : now,
    created_at: now,
    updated_at: now,
    changes: makeChanges(id, input.changes ?? []),
  };
}

function seedChangelogs(): MockChangelog[] {
  return [
    buildChangelog(
      {
        project_id: PROJECT_1_ID,
        version: "v2.4.0",
        description: "Session management release",
        changes: [
          { description: "Add create session API" },
          { description: "Fix delete session API" },
        ],
      },
      ADMIN_ID,
      "2026-11-19T02:00:00.000Z",
      "00000000-0000-4000-8000-000000000401",
    ),
    buildChangelog(
      {
        project_id: PROJECT_2_ID,
        version: "v1.8.2",
        description: "Infrastructure improvements",
        changes: [
          { description: "Optimize GPU allocation" },
          { description: "Improve monitoring configuration" },
        ],
      },
      ADMIN_ID,
      "2026-11-17T02:00:00.000Z",
      "00000000-0000-4000-8000-000000000402",
    ),
  ].filter((entry) => Boolean(findMockProject(entry.project_id) && findMockUser(entry.created_by)));
}

function saveMockChangelogs(entries: MockChangelog[]) {
  localStorage.setItem(CHANGELOGS_KEY, JSON.stringify(entries));
}

export function getMockChangelogs(): MockChangelog[] {
  const raw = localStorage.getItem(CHANGELOGS_KEY);
  if (raw !== null) return JSON.parse(raw) as MockChangelog[];
  const entries = seedChangelogs();
  saveMockChangelogs(entries);
  return entries;
}

export function findMockChangelog(id: string) {
  return getMockChangelogs().find((entry) => entry.id === id);
}

export function canViewMockChangelog(entry: MockChangelog, actor: AuthUser) {
  const project = findMockProject(entry.project_id);
  return Boolean(project && canViewMockProject(project, actor));
}

export function hasMockChangelogVersion(projectId: string, version: string, exceptId?: string) {
  return getMockChangelogs().some(
    (entry) => entry.project_id === projectId && entry.version === version && entry.id !== exceptId,
  );
}

export function toPublicChangelog(entry: MockChangelog): Changelog {
  const project = findMockProject(entry.project_id);
  const user = findMockUser(entry.created_by);
  if (!project || !user) throw new Error("Changelog references a missing project or user");
  const creator: ProjectUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    avatar_url: user.avatar_url,
    is_active: user.is_active,
  };
  return {
    ...entry,
    project: { id: project.id, code: project.code, name: project.name, status: project.status },
    creator,
  };
}

export function createMockChangelog(input: CreateChangelogInput, actorId: string) {
  const entries = getMockChangelogs();
  const entry = buildChangelog(input, actorId, new Date().toISOString());
  saveMockChangelogs([entry, ...entries]);
  return entry;
}

export function updateMockChangelog(id: string, input: UpdateChangelogInput) {
  const entries = getMockChangelogs();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index < 0) return null;
  const current = entries[index];
  const { changes, released_at, ...fields } = input;
  const updated: MockChangelog = {
    ...current,
    ...fields,
    released_at:
      released_at === undefined ? current.released_at : new Date(released_at).toISOString(),
    changes: changes === undefined ? current.changes : makeChanges(id, changes),
    updated_at: new Date().toISOString(),
  };
  entries[index] = updated;
  saveMockChangelogs(entries);
  return updated;
}

export function deleteMockChangelog(id: string) {
  const entries = getMockChangelogs();
  if (!entries.some((entry) => entry.id === id)) return false;
  saveMockChangelogs(entries.filter((entry) => entry.id !== id));
  return true;
}
