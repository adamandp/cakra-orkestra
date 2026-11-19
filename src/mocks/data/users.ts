import type { AuthUser } from "@/interface/auth.interface";

export interface MockUser extends AuthUser {
  password: string;
}

export const mockUsers: MockUser[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    username: "admin",
    name: "Administrator",
    role: "ADMIN",
    avatar_url: null,
    is_active: true,
    password: "admin",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    username: "member",
    name: "Member",
    role: "MEMBER",
    avatar_url: null,
    is_active: true,
    password: "member",
  },
];
