"use client";

import { useState, useRef } from "react";
import { PencilIcon, Trash2Icon, CalendarDaysIcon, GitCommitHorizontalIcon, ExternalLinkIcon, ListChecksIcon, FileTextIcon, HistoryIcon, FolderIcon, PlusIcon, XIcon } from "lucide-react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProjectStatusBadge } from "@/features/projects/components/project-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSheetLifecycle,
  Sheet,
  SheetContent, SheetFooter,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DateTimePicker } from "@/components/shared/date-time-picker";
import { Input } from "@/components/ui/input";
import { changelogFormSchema, type ChangelogFormValues } from "../changelog.schema";
import type { Changelog, UpdateChangelogInput } from "@/interface/changelog.interface";
import { useChangelog } from "../changelog.query";
import { useDeleteChangelog, useUpdateChangelog } from "../changelog.mutation";
import { getChangelogError } from "../changelog.api";
import { formatReleaseDate, isHttpUrl, toLocalDateTime } from "../changelog.constants";

type EditSection = "overview" | "summary" | "changes" | "source";

export function ChangelogDetail({
  id,
  isAdmin,
  onClose,
  onDeleted,
}: {
  id: string;
  isAdmin: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const lifecycle = useSheetLifecycle(onClose);
  const query = useChangelog(id);
  const mutation = useDeleteChangelog(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const entry = query.data;
  const update = useUpdateChangelog(id);
  const [editing, setEditing] = useState<EditSection | null>(null);
  const [draft, setDraft] = useState<ChangelogFormValues | null>(null);
  const [editError, setEditError] = useState("");
  const busy = mutation.isPending || update.isPending;
  const [discardAction, setDiscardAction] = useState<"cancel" | "close" | null>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const dirty = Boolean(draft && entry && (
    draft.version !== entry.version ||
    draft.description !== (entry.description ?? "") ||
    draft.commit_url !== (entry.commit_url ?? "") ||
    draft.released_at !== toLocalDateTime(entry.released_at) ||
    draft.changes.length !== entry.changes.length ||
    draft.changes.some((change, index) => change.description !== entry.changes[index]?.description)
  ));
  function discard(action: "cancel" | "close") {
    setEditing(null);
    setDraft(null);
    setEditError("");
    setDiscardAction(null);
    if (action === "close") lifecycle.close();
  }
  function requestDiscard(action: "cancel" | "close") {
    if (busy) return;
    if (dirty) setDiscardAction(action);
    else discard(action);
  }
  function beginEdit(entry: Changelog, section: EditSection) {
    setEditing(section);
    setEditError("");
    setDraft({ project_id: entry.project_id, version: entry.version, description: entry.description ?? "", commit_url: entry.commit_url ?? "", released_at: toLocalDateTime(entry.released_at), changes: entry.changes.map(({ description }) => ({ description })) });
  }
  function patch(values: Partial<ChangelogFormValues>) {
    setDraft((current) => current ? { ...current, ...values } : current);
  }
  async function saveEdit() {
    if (!draft || !entry || !isAdmin) return;
    const parsed = changelogFormSchema.safeParse(draft);
    if (!parsed.success) { setEditError(parsed.error.issues[0]?.message ?? "Invalid release"); return; }
    const values = parsed.data;
    const input: UpdateChangelogInput = {};
    if (editing === "overview" && values.version !== entry.version) input.version = values.version;
    if (editing === "summary" && (values.description || null) !== entry.description) input.description = values.description || null;
    if (editing === "source" && (values.commit_url || null) !== entry.commit_url) input.commit_url = values.commit_url || null;
    if (editing === "overview" && values.released_at !== toLocalDateTime(entry.released_at)) input.released_at = new Date(values.released_at).toISOString();
    if (editing === "changes" && (values.changes.length !== entry.changes.length || values.changes.some((change, index) => change.description !== entry.changes[index]?.description))) input.changes = values.changes;
    try {
      if (Object.keys(input).length) { await update.mutateAsync(input); toast.success("Changelog updated"); }
      setEditing(null);
    setDraft(null);
      setEditError("");
    } catch (error) { setEditError(getChangelogError(error)); }
  }
  function editButton(section: EditSection, label: string, content: React.ReactNode) {
    if (!isAdmin || !entry || editing === section) return content;
    return <button type="button" aria-label={label} title={label} disabled={busy || Boolean(editing) || confirmDelete} onClick={() => beginEdit(entry, section)} className="relative inline-grid shrink-0 place-items-center cursor-pointer disabled:cursor-default">
      <span className="inline-flex items-center transition-opacity [@media(hover:none)]:opacity-0 group-hover/release-card:opacity-0 group-focus-within/release-card:opacity-0">{content}</span>
      <span className="absolute inset-0 flex items-center justify-end opacity-0 transition-opacity [@media(hover:none)]:opacity-100 group-hover/release-card:opacity-100 group-focus-within/release-card:opacity-100"><PencilIcon className="size-4" /></span>
    </button>;
  }
  function editControls(section: EditSection) {
    if (editing !== section) return null;
    return <div className="space-y-2 border-t border-border pt-3">
      {editError && <p role="alert" className="text-sm text-destructive">{editError}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" disabled={busy} onClick={() => requestDiscard("cancel")}>Cancel</Button>
        <Button size="sm" disabled={busy} onClick={() => void saveEdit()}>{update.isPending ? "Saving..." : "Save changes"}</Button>
      </div>
    </div>;
  }
  async function confirm() {
    try {
      await mutation.mutateAsync();
      toast.success("Changelog deleted");
      lifecycle.closeThen(onDeleted);
    } catch {
      /* Keep confirmation open and show the error. */
    }
  }
  return (
    <Sheet
      open={lifecycle.open}
      onOpenChangeComplete={lifecycle.onOpenChangeComplete}
      onOpenChange={(open) => {
        if (!open) requestDiscard("close");
      }}
    >
      <SheetContent preventDragDismiss={Boolean(draft) || busy} className="w-full border-l-2 border-border gap-0 sm:max-w-xl">
        <SheetHeader>
          <SheetTitle><span className="system-copy">Release details</span></SheetTitle>
          <SheetDescription>Release notes, source reference and activity</SheetDescription>
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
              <section className="group/release-card space-y-4 rounded-md border-2 border-border bg-card p-4 shadow-neo-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {editing === "overview" && draft ? <Input aria-label="Version" value={draft.version} maxLength={30} disabled={busy} className="w-36 font-mono" onChange={(e) => patch({ version: e.target.value })} /> : <Badge className="font-mono">{entry.version}</Badge>}
                  {editButton("overview", "Edit release overview", <ProjectStatusBadge status={entry.project.status} />)}
                </div>
                <h2 className="break-words text-2xl font-black tracking-tight">{entry.project.name}</h2>
                <p className="flex items-center gap-2 text-xs text-muted-foreground"><FolderIcon className="size-4" />{entry.project.code}</p>
                <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                  <div className="min-w-0"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDaysIcon className="size-4" /> Released at</p>{editing === "overview" && draft ? <DateTimePicker ariaLabel="Release date" value={draft.released_at} disabled={busy} className="mt-1 w-full min-w-0 text-xs" onChange={(value) => patch({ released_at: value })} /> : <p className="mt-1 break-words text-sm font-semibold">{formatReleaseDate(entry.released_at)}</p>}</div>
                  <div><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ListChecksIcon className="size-4" /> Change items</p><p className="mt-1 text-xl font-black tabular-nums">{draft ? draft.changes.length : entry.changes.length}</p></div>
                </div>
                {editControls("overview")}
              </section>
              <section className="group/release-card space-y-3 rounded-md border-2 border-border p-4">
                <div className="flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 font-bold"><FileTextIcon className="size-4" /> Release summary</h3>{editButton("summary", "Edit release summary", <span className="size-4" aria-hidden="true" />)}</div>
                {editing === "summary" && draft ? <textarea aria-label="Release summary" rows={4} value={draft.description} disabled={busy} className="w-full rounded-md border-2 border-border bg-background p-3 text-sm" onChange={(e) => patch({ description: e.target.value })} /> : <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{entry.description || "No description."}</p>}
                {editControls("summary")}
              </section>
              <section className="group/release-card space-y-3 rounded-md border-2 border-border p-4">
                <div className="flex items-center gap-2"><h3 className="flex flex-1 items-center gap-2 font-bold"><ListChecksIcon className="size-4" /> What's changed <span className="ml-auto text-xs font-medium text-muted-foreground">{editButton("changes", "Edit change items", <>{draft ? draft.changes.length : entry.changes.length} items</>)}</span></h3></div>
                {editing === "changes" && draft ? (
                  <div className="space-y-2">
                    {draft.changes.map((change, index) => <div key={index} className="flex items-start gap-2">
                      <span className="pt-2 text-xs font-mono">{String(index + 1).padStart(2, "0")}</span>
                      <textarea aria-label={`Change ${index + 1}`} rows={2} value={change.description} disabled={busy} className="min-w-0 flex-1 rounded-md border-2 border-border bg-background p-2 text-sm" onChange={(e) => patch({ changes: draft.changes.map((item, i) => i === index ? { description: e.target.value } : item) })} />
                      <Button variant="ghost" size="icon" aria-label={`Remove change ${index + 1}`} disabled={busy} onClick={() => patch({ changes: draft.changes.filter((_, i) => i !== index) })}><XIcon /></Button>
                    </div>)}
                    <Button variant="outline" size="sm" disabled={busy} aria-disabled={busy} className={draft.changes.some((change) => !change.description.trim()) ? "cursor-not-allowed opacity-60" : undefined} onClick={() => { if (draft.changes.some((change) => !change.description.trim())) { toast.error("Fill in all existing changes before adding a new one."); return; } patch({ changes: [...draft.changes, { description: "" }] }); }}><PlusIcon /> Add change</Button>
                  </div>
                ) : entry.changes.length ? (
                  <ol className="divide-y divide-border">
                    {entry.changes.map((change, index) => (
                      <li key={change.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-border bg-muted font-mono text-xs font-bold">{String(index + 1).padStart(2, "0")}</span>
                        <p className="min-w-0 whitespace-pre-wrap break-words pt-1 text-sm leading-relaxed">{change.description}</p>
                      </li>
                    ))}
                  </ol>
                ) : <p className="text-sm text-muted-foreground"><span className="system-copy">No change items recorded.</span></p>}
                {editControls("changes")}
              </section>
              <section className="group/release-card space-y-3 rounded-md border-2 border-border p-4">
                <div className="flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 font-bold"><GitCommitHorizontalIcon className="size-4" /> Source reference</h3>{editButton("source", "Edit source reference", <span className="size-4" aria-hidden="true" />)}</div>
                {editing === "source" && draft ? <Input aria-label="Commit URL" type="url" value={draft.commit_url} disabled={busy} placeholder="https://..." onChange={(e) => patch({ commit_url: e.target.value })} /> : entry.commit_url && isHttpUrl(entry.commit_url) ? (
                  <a href={entry.commit_url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-sm border border-border bg-muted/30 p-3 hover:bg-muted">
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold"><span className="system-copy">View commit</span></p><p className="mt-1 break-all text-xs text-muted-foreground">{entry.commit_url}</p></div>
                    <ExternalLinkIcon className="size-4 shrink-0" />
                  </a>
                ) : <p className="text-sm text-muted-foreground"><span className="system-copy">No commit URL attached.</span></p>}
                {editControls("source")}
              </section>
              <section className="space-y-3 rounded-md border-2 border-border p-4">
                <h3 className="flex items-center gap-2 font-bold"><HistoryIcon className="size-4" /> Release metadata</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="shrink-0"><AvatarImage src={entry.creator.avatar_url ?? undefined} alt="" /><AvatarFallback>{entry.creator.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</AvatarFallback></Avatar>
                  <div className="min-w-0"><p className="text-xs text-muted-foreground"><span className="system-copy">Recorded by</span></p><p className="break-words text-sm font-semibold">{entry.creator.name}</p><p className="break-words text-xs text-muted-foreground">@{entry.creator.username}</p></div>
                </div>
                <dl className="grid gap-3 border-t border-border pt-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-muted-foreground">Created at</dt><dd className="mt-1">{formatReleaseDate(entry.created_at)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Last updated</dt><dd className="mt-1">{formatReleaseDate(entry.updated_at)}</dd></div>
                </dl>
              </section>
              {isAdmin && !draft && (
                <div className="flex flex-wrap gap-2">
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
                  <p className="text-sm"><span className="system-copy">
                    Permanently delete this release and its change items? This cannot be undone.
                  </span></p>
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
        <SheetFooter>
          <Button variant="outline" disabled={busy} onClick={() => requestDiscard("close")}>Close</Button>
        </SheetFooter>
        <AlertDialog.Root open={discardAction !== null} onOpenChange={(open) => { if (!open) setDiscardAction(null); }}>
          <AlertDialog.Portal>
            <AlertDialog.Backdrop className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-sm" />
            <AlertDialog.Popup initialFocus={keepEditingRef} className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-lg border-2 border-border bg-card p-5 shadow-neo-sm">
              <AlertDialog.Title className="text-lg font-bold">Unsaved changes</AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-muted-foreground">Your release has unsaved changes. Discard them or keep editing?</AlertDialog.Description>
              <div className="flex flex-wrap justify-end gap-2">
                <AlertDialog.Close render={<Button ref={keepEditingRef} variant="outline" className="focus-visible:border-border focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border" />}>Keep editing</AlertDialog.Close>
                <Button variant="destructive" onClick={() => { if (discardAction) discard(discardAction); }}>Discard changes</Button>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </SheetContent>
    </Sheet>
  );
}
