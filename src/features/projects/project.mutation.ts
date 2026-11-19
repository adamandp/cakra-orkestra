import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  AddProjectMembersInput,
  CreateProjectInput,
  Project,
  UpdateProjectInput,
  UpdateProjectStatusInput,
} from "@/interface/project.interface";
import {
  addProjectMembers,
  createProject,
  removeProjectMember,
  updateProject,
  updateProjectStatus,
} from "./project.api";
import { projectKeys } from "./project.query";
import { taskKeys } from "@/features/tasks/task.query";

async function syncProject(queryClient: QueryClient, project: Project) {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: projectKeys.detail(project.id) }),
    queryClient.cancelQueries({ queryKey: projectKeys.members(project.id) }),
  ]);
  queryClient.setQueryData(projectKeys.detail(project.id), project);
  queryClient.setQueryData(projectKeys.members(project.id), project.members);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: projectKeys.lists }),
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(project.id) }),
    queryClient.invalidateQueries({ queryKey: projectKeys.members(project.id) }),
    queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  ]);
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: (project) => syncProject(queryClient, project),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectInput }) =>
      updateProject(id, input),
    onSuccess: (project) => syncProject(queryClient, project),
  });
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectStatusInput }) =>
      updateProjectStatus(id, input),
    onSuccess: (project) => syncProject(queryClient, project),
  });
}

export function useAddProjectMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddProjectMembersInput }) =>
      addProjectMembers(id, input),
    onSuccess: (project) => syncProject(queryClient, project),
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => removeProjectMember(id, userId),
    onSuccess: (project) => syncProject(queryClient, project),
  });
}
