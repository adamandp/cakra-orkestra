import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
} from "@/interface/user.interface";
import { useAuth } from "@/providers/auth-provider";
import { createUser, updateUser, updateUserRole, updateUserStatus } from "./user.api";
import { userKeys } from "./user.query";

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: async (user) => {
      queryClient.setQueryData(userKeys.detail(user.id), user);
      await queryClient.invalidateQueries({ queryKey: userKeys.lists });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { syncProfile } = useAuth();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => updateUser(id, input),
    onSuccess: async (user) => {
      syncProfile(user);
      queryClient.setQueryData(userKeys.detail(user.id), user);
      await queryClient.invalidateQueries({ queryKey: userKeys.lists });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserStatusInput }) =>
      updateUserStatus(id, input),
    onSuccess: async (user) => {
      queryClient.setQueryData(userKeys.detail(user.id), user);
      await queryClient.invalidateQueries({ queryKey: userKeys.lists });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserRoleInput }) =>
      updateUserRole(id, input),
    onSuccess: async (user) => {
      queryClient.setQueryData(userKeys.detail(user.id), user);
      await queryClient.invalidateQueries({ queryKey: userKeys.lists });
    },
  });
}
