import type { AuthUser } from "@/interface/auth.interface";
import type {
  CreateProjectInput, Project, ProjectStatus, ProjectUser, UpdateProjectInput,
} from "@/interface/project.interface";
import { getMockUsers } from "./users";

const PROJECTS_KEY = "cakra-orkestra:mock-projects:v1";
const adminId = "00000000-0000-4000-8000-000000000001";
const memberId = "00000000-0000-4000-8000-000000000002";
const timestamp = "2026-11-19T00:00:00.000Z";

type MockProject = Omit<Project, "owner" | "members"> & { member_ids: string[] };

const seedProjects: MockProject[] = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    code: "PRJ-001",
    name: "Smart Search Studio",
    description: "AI-powered search application",
    status: "ACTIVE",
    owner_id: adminId,
    member_ids: [memberId],
    created_by: adminId,
    created_at: timestamp,
    updated_at: timestamp,
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    code: "PRJ-002",
    name: "Agent Quality",
    description: "Agent evaluation and quality management",
    status: "ACTIVE",
    owner_id: adminId,
    member_ids: [],
    created_by: adminId,
    created_at: timestamp,
    updated_at: timestamp,
  },
  {
    id: "00000000-0000-4000-8000-000000000203",
    code: "PRJ-003",
    name: "Internal Dashboard",
    description: "Internal reporting system",
    status: "COMPLETED",
    owner_id: adminId,
    member_ids: [memberId],
    created_by: adminId,
    created_at: timestamp,
    updated_at: timestamp,
  },
];

export function getMockProjects(): MockProject[] {
  const stored = localStorage.getItem(PROJECTS_KEY);
  return stored === null
    ? seedProjects.map((project) => ({ ...project, member_ids: [...project.member_ids] }))
    : JSON.parse(stored) as MockProject[];
}

function saveMockProjects(projects: MockProject[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function findMockProject(id: string) {
  return getMockProjects().find((project) => project.id === id);
}

export function canViewMockProject(project: MockProject, user: AuthUser) {
  return user.role === "ADMIN" || project.owner_id === user.id || project.member_ids.includes(user.id);
}

function toProjectUser(user: ProjectUser): ProjectUser {
  const { id, name, username, avatar_url, is_active } = user;
  return { id, name, username, avatar_url, is_active };
}

export function toPublicProject(project: MockProject): Project {
  const users = new Map(getMockUsers().map((user) => [user.id, user]));
  const owner = users.get(project.owner_id);
  if (!owner) throw new Error("Project owner does not exist in the mock database");
  const members = project.member_ids.map((id) => {
    const member = users.get(id);
    if (!member) throw new Error("Project member does not exist in the mock database");
    return toProjectUser(member);
  });
  return {
    id: project.id, code: project.code, name: project.name, description: project.description,
    status: project.status, owner_id: project.owner_id, created_by: project.created_by,
    created_at: project.created_at, updated_at: project.updated_at,
    owner: toProjectUser(owner), members,
  };
}

export function createMockProject(input: CreateProjectInput, creatorId: string) {
  const projects = getMockProjects();
  const next = Math.max(0, ...projects.map((project) => Number(project.code.slice(4)))) + 1;
  const now = new Date().toISOString();
  const project: MockProject = {
    id: crypto.randomUUID(),
    code: `PRJ-${String(next).padStart(3, "0")}`,
    name: input.name,
    description: input.description,
    owner_id: input.owner_id,
    member_ids: [...input.member_ids],
    status: "ACTIVE",
    created_by: creatorId,
    created_at: now,
    updated_at: now,
  };
  saveMockProjects([project, ...projects]);
  return project;
}

export function updateMockProject(
  id: string,
  patch: UpdateProjectInput & { status?: ProjectStatus; member_ids?: string[] },
) {
  const projects = getMockProjects();
  const index = projects.findIndex((project) => project.id === id);
  if (index < 0) return null;
  const updated = { ...projects[index], ...patch, updated_at: new Date().toISOString() };
  projects[index] = updated;
  saveMockProjects(projects);
  return updated;
}
