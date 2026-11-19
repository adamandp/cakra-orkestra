import { useQuery } from "@tanstack/react-query";
import type { ChangelogListParams } from "@/interface/changelog.interface";
import { getChangelog, getChangelogs } from "./changelog.api";

export const changelogKeys = {
  all: ["changelogs"] as const,
  lists: ["changelogs", "list"] as const,
  list: (params: ChangelogListParams) => ["changelogs", "list", params] as const,
  detail: (id: string) => ["changelogs", "detail", id] as const,
};

export function useChangelogs(params: ChangelogListParams, enabled = true) {
  return useQuery({
    queryKey: changelogKeys.list(params),
    queryFn: ({ signal }) => getChangelogs(params, signal),
    enabled,
  });
}

export function useChangelog(id: string) {
  return useQuery({
    queryKey: changelogKeys.detail(id),
    queryFn: ({ signal }) => getChangelog(id, signal),
    enabled: Boolean(id),
  });
}
