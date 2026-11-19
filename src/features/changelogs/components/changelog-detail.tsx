"use client";

import { useState } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Changelog } from "@/interface/changelog.interface";
import { useChangelog } from "../changelog.query";
import { useDeleteChangelog } from "../changelog.mutation";
import { getChangelogError } from "../changelog.api";
import { formatReleaseDate, isHttpUrl } from "../changelog.constants";

export function ChangelogDetail({
  id,
  isAdmin,
  onClose,
  onEdit,
  onDeleted,
}: {
  id: string;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (entry: Changelog) => void;
  onDeleted: () => void;
}) {
  const query = useChangelog(id);
  const mutation = useDeleteChangelog(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const entry = query.data;
  async function confirm() {
    try {
      await mutation.mutateAsync();
      toast.success("Changelog deleted");
      onDeleted();
    } catch {
      /* Keep confirmation open and show the error. */
    }
  }
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <SheetContent className="w-full border-l-2 border-border sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Release details</SheetTitle>
          <SheetDescription>Application changelog</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {query.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : query.isError || !entry ? (
            <div role="alert" className="space-y-2">
              <p className="text-sm text-destructive">{getChangelogError(query.error)}</p>
              <Button variant="outline" onClick={() => void query.refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <h2 className="break-words text-xl font-bold">{entry.version}</h2>
              <p className="break-words text-sm text-muted-foreground">
                {entry.project.code} — {entry.project.name}
              </p>
              <dl className="grid gap-3 rounded-lg border-2 border-border p-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Released at</dt>
                  <dd>{formatReleaseDate(entry.released_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Recorded by</dt>
                  <dd className="break-words">{entry.creator.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Created at</dt>
                  <dd>{formatReleaseDate(entry.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Updated at</dt>
                  <dd>{formatReleaseDate(entry.updated_at)}</dd>
                </div>
              </dl>
              <section className="space-y-2">
                <h3 className="font-bold">Description</h3>
                <p className="whitespace-pre-wrap break-words text-sm">
                  {entry.description || "No description."}
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="font-bold">Changes ({entry.changes.length})</h3>
                {entry.changes.length ? (
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    {entry.changes.map((change) => (
                      <li key={change.id} className="whitespace-pre-wrap break-words">
                        {change.description}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No change items recorded.</p>
                )}
              </section>
              <section className="space-y-2">
                <h3 className="font-bold">Commit URL</h3>
                {entry.commit_url && isHttpUrl(entry.commit_url) ? (
                  <a
                    href={entry.commit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm underline"
                  >
                    {entry.commit_url}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">No commit URL.</p>
                )}
              </section>
              {isAdmin && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={confirmDelete} onClick={() => onEdit(entry)}>
                    <PencilIcon /> Edit release
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={confirmDelete}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2Icon /> Delete
                  </Button>
                </div>
              )}
              {confirmDelete && isAdmin && (
                <div className="space-y-3 rounded-md border-2 border-border p-3">
                  <p className="text-sm">
                    Permanently delete this release and its change items? This cannot be undone.
                  </p>
                  {mutation.isError && (
                    <p role="alert" className="text-sm text-destructive">
                      {getChangelogError(mutation.error)}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      disabled={mutation.isPending}
                      onClick={() => {
                        setConfirmDelete(false);
                        mutation.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={mutation.isPending}
                      onClick={() => void confirm()}
                    >
                      {mutation.isPending ? "Deleting..." : "Confirm delete"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end border-t p-4">
          <Button variant="outline" disabled={mutation.isPending} onClick={onClose}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
