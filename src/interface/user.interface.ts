import type { AuthUser } from "@/interface/auth.interface";

export interface User extends AuthUser {
  role_id: string;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserListParams {
  q?: string;
  role_id?: string;
  is_active?: boolean;
  limit: number;
  offset: number;
}

export interface UserListResponse {
  items: User[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateUserInput {
  username: string;
  name: string;
  password: string;
  role_id: string;
  avatar_url: string | null;
  birth_date: string | null;
}

export interface UpdateUserInput {
  username?: string;
  name?: string;
  avatar_url?: string | null;
  birth_date?: string | null;
}

export interface UpdateUserStatusInput {
  is_active: boolean;
}

export interface UpdateUserRoleInput {
  role_id: string;
}
