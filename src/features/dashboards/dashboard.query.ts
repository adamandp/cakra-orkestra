import { useQuery } from "@tanstack/react-query";
import { taskKeys } from "@/features/tasks/task.query";
import { getTasks } from "@/features/tasks/task.api";
import { useAuth } from "@/providers/auth-provider";
import type { TaskListParams } from "@/interface/task.interface";
import { getMyFocus, getTeamSummary, getMemberWorkloads } from "./dashboard.api";

// These are task-derived read models. Nest under taskKeys.lists so that
// Commit 8's existing syncTask/deleteTask and project invalidation refresh them.
export const dashboardKeys = {
  all: [...taskKeys.lists, "dashboards"] as const,
  myFocus: (userId: string) => [...dashboardKeys.all, "my-focus", userId] as const,
  teamSummary: () => [...dashboardKeys.all, "team-pulse", "summary"] as const,
  workloads: () => [...dashboardKeys.all, "team-pulse", "workloads"] as const,
};

const DASHBOARD_POLL_INTERVAL = 5000;
const liveOptions = {
  refetchInterval: DASHBOARD_POLL_INTERVAL,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  refetchOnMount: "always" as const,
};

export function useMyFocus() {
  const { user } = useAuth();
  return useQuery({
    ...liveOptions,
    queryKey: dashboardKeys.myFocus(user?.id ?? ""),
    queryFn: ({ signal }) => getMyFocus(signal),
    enabled: Boolean(user),
  });
}

export function useTeamSummary() {
  const { user } = useAuth();
  return useQuery({
    ...liveOptions,
    queryKey: dashboardKeys.teamSummary(),
    queryFn: ({ signal }) => getTeamSummary(signal),
    enabled: user?.role === "ADMIN",
  });
}

export function useMemberWorkloads() {
  const { user } = useAuth();
  return useQuery({
    ...liveOptions,
    queryKey: dashboardKeys.workloads(),
    queryFn: ({ signal }) => getMemberWorkloads(signal),
    enabled: user?.role === "ADMIN",
  });
}

export function useDashboardTasks(params: TaskListParams, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    ...liveOptions,
    queryKey: taskKeys.list(params),
    queryFn: ({ signal }) => getTasks(params, signal),
    enabled: Boolean(user) && enabled && (params.scope === "me" || user?.role === "ADMIN"),
  });
}
