import type { UserRole } from "@/interface/role.interface";

const createdAt = "2026-11-19T00:00:00.000Z";

export const mockRoles: UserRole[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    name: "ADMIN",
    description: "Manage users, projects, and task approvals.",
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    name: "MEMBER",
    description: "Manage personal tasks and view personal scores.",
    created_at: createdAt,
    updated_at: createdAt,
  },
];

export function findMockRole(id: string) {
  return mockRoles.find((role) => role.id === id);
}
