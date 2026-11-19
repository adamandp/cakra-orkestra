import type { Project, ProjectUser } from "@/interface/project.interface";

export interface ChangelogItem {
  id: string;
  changelog_id: string;
  description: string;
}

export interface Changelog {
  id: string;
  version: string;
  description: string | null;
  commit_url: string | null;
  released_at: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  created_by: string;
  project: Pick<Project, "id" | "code" | "name" | "status">;
  creator: ProjectUser;
  changes: ChangelogItem[];
}

export interface ChangelogListParams {
  q?: string;
  project_id?: string;
  limit: number;
  offset: number;
}

export interface ChangelogListResponse {
  items: Changelog[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateChangelogInput {
  project_id: string;
  version: string;
  description?: string | null;
  commit_url?: string | null;
  released_at?: string;
  changes?: { description: string }[];
}

export type UpdateChangelogInput = Partial<Omit<CreateChangelogInput, "project_id">>;
