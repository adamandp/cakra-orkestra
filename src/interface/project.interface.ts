import type { User } from "@/interface/user.interface";

export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

export type ProjectUser = Pick<User, "id" | "name" | "username" | "avatar_url" | "is_active">;

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  owner_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  owner: ProjectUser;
  members: ProjectUser[];
}

export interface ProjectListParams {
  q?: string;
  status?: ProjectStatus;
  limit: number;
  offset: number;
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateProjectInput {
  name: string;
  description: string | null;
  owner_id: string;
  member_ids: string[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  owner_id?: string;
}

export interface UpdateProjectStatusInput {
  status: ProjectStatus;
}

export interface AddProjectMembersInput {
  member_ids: string[];
}
