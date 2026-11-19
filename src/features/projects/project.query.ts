import { useQuery } from "@tanstack/react-query";
import type { ProjectListParams } from "@/interface/project.interface";
import { getProject, getProjectMembers, getProjects } from "./project.api";

export const projectKeys = {
  all: ["projects"] as const,
  lists: ["projects", "list"] as const,
  list: (params: ProjectListParams) => ["projects", "list", params] as const,
  detail: (id: string) => ["projects", "detail", id] as const,
  members: (id: string) => ["projects", "members", id] as const,
};

export function useProjects(params: ProjectListParams) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: ({ signal }) => getProjects(params, signal),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: ({ signal }) => getProject(id, signal),
    enabled: Boolean(id),
  });
}

export function useProjectMembers(id: string) {
  return useQuery({
    queryKey: projectKeys.members(id),
    queryFn: ({ signal }) => getProjectMembers(id, signal),
    enabled: Boolean(id),
  });
}
