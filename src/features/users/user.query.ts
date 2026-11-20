import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { UserListParams } from "@/interface/user.interface";
import { getRole, getRoles, getUser, getUsers } from "./user.api";

export const userKeys = {
  all: ["users"] as const,
  lists: ["users", "list"] as const,
  list: (params: UserListParams) => ["users", "list", params] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

export const roleKeys = {
  all: ["roles"] as const,
  list: ["roles", "list"] as const,
  detail: (id: string) => ["roles", "detail", id] as const,
};

export function useUsers(params: UserListParams, options?: { keepPreviousData?: boolean }) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: ({ signal }) => getUsers(params, signal),
    placeholderData: options?.keepPreviousData ? keepPreviousData : undefined,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: ({ signal }) => getUser(id, signal),
    enabled: Boolean(id),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.list,
    queryFn: ({ signal }) => getRoles(signal),
    staleTime: Infinity,
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: ({ signal }) => getRole(id, signal),
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}
