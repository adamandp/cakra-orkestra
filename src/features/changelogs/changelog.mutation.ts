import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  Changelog,
  CreateChangelogInput,
  UpdateChangelogInput,
} from "@/interface/changelog.interface";
import { createChangelog, updateChangelog, deleteChangelog } from "./changelog.api";
import { changelogKeys } from "./changelog.query";

async function syncChangelog(client: QueryClient, entry: Changelog) {
  await client.cancelQueries({ queryKey: changelogKeys.detail(entry.id) });
  client.setQueryData(changelogKeys.detail(entry.id), entry);
  await Promise.all([
    client.invalidateQueries({ queryKey: changelogKeys.lists }),
    client.invalidateQueries({ queryKey: changelogKeys.detail(entry.id) }),
  ]);
}

export function useCreateChangelog() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChangelogInput) => createChangelog(input),
    onSuccess: (entry) => syncChangelog(client, entry),
  });
}

export function useUpdateChangelog(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateChangelogInput) => updateChangelog(id, input),
    onSuccess: (entry) => syncChangelog(client, entry),
  });
}

export function useDeleteChangelog(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => deleteChangelog(id),
    onSuccess: async () => {
      await client.cancelQueries({ queryKey: changelogKeys.detail(id) });
      client.removeQueries({ queryKey: changelogKeys.detail(id) });
      await client.invalidateQueries({ queryKey: changelogKeys.lists });
    },
  });
}
