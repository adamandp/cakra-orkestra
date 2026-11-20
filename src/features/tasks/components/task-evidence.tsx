"use client";

import { useState } from "react";
import {
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  LinkIcon,
  PlusIcon,
  PaperclipIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TaskDetail, TaskEvidence } from "@/interface/task.interface";
import {
  useCreateTaskLink,
  useUploadTaskEvidence,
  useDeleteTaskEvidence,
  useUpdateTaskEvidence,
} from "../task.mutation";
import { downloadTaskEvidence, getTaskError } from "../task.api";
import { createTaskLinkSchema } from "../task.schema";
import { TaskEvidenceDialog } from "./task-evidence-dialog";

function evidenceLabel(item: TaskEvidence) {
  return item.title || item.file_name || item.url || "Evidence";
}
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}
export function TaskEvidencePanel({
  task,
  editable,
  busy,
}: {
  task: TaskDetail;
  editable: boolean;
  busy: boolean;
}) {
  const add = useCreateTaskLink(task.id);
  const upload = useUploadTaskEvidence(task.id);
  const remove = useDeleteTaskEvidence(task.id);
  const update = useUpdateTaskEvidence(task.id);
  const [editing, setEditing] = useState<{ id: string; title: string; url: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pending = busy || add.isPending || upload.isPending || remove.isPending || update.isPending;
  async function run(action: () => Promise<unknown>, message: string) {
    setError(null);
    try {
      await action();
      setAdding(false);
      setDeleting(null);
      setEditing(null);
      toast.success(message);
      return true;
    } catch (error) {
      setError(getTaskError(error));
      return false;
    }
  }
  async function download(item: TaskEvidence) {
    setDownloading(item.id);
    setError(null);
    let url: string | undefined;
    try {
      const blob = await downloadTaskEvidence(task.id, item.id);
      url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = item.file_name ?? "evidence";
      document.body.appendChild(anchor);
      try {
        anchor.click();
      } finally {
        anchor.remove();
      }
    } catch (error) {
      setError(getTaskError(error));
    } finally {
      if (url) {
        const objectUrl = url;
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
      }
      setDownloading(null);
    }
  }
  return (
    <section className="border-2 border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-border bg-muted/40 p-3 pb-4">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-bold">
            <PaperclipIcon className="size-4" /> Evidence ({task.evidences.length})
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {task.task_status === "BLOCKED"
              ? "Resume the task to add evidence."
              : "Attach files or links to verify your work."}
          </p>
        </div>
        {editable && !adding && (
          <span
            className={
              task.task_status === "BLOCKED" ? "inline-flex cursor-not-allowed" : "inline-flex"
            }
            onClick={() => {
              if (task.task_status === "BLOCKED")
                toast.info("Resume the task before adding evidence.", {
                  id: "evidence-blocked-hint",
                });
            }}
          >
            <Button
              className={task.task_status === "BLOCKED" ? "!pointer-events-none" : undefined}
              variant="outline"
              size="sm"
              data-retain-disabled-shadow
              disabled={
                task.task_status === "BLOCKED" ||
                pending ||
                adding ||
                Boolean(deleting) ||
                Boolean(editing)
              }
              onClick={() => {
                setAdding(true);
                setError(null);
              }}
            >
              <PlusIcon /> Add evidence
            </Button>
          </span>
        )}
      </div>
      <div className="space-y-3 p-3 pb-4">
        {!task.evidences.length && !adding && (
          <div className="flex flex-col items-center gap-2 border border-dashed border-border p-5 text-center">
            <PaperclipIcon className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium"><span className="system-copy">No evidence attached</span></p>
            <p className="text-xs text-muted-foreground"><span className="system-copy">
              Add a file or link when your work is ready.
            </span></p>
          </div>
        )}
        {task.evidences.map((item) => {
          const link =
            item.type === "LINK" && createTaskLinkSchema.safeParse({ url: item.url }).success
              ? item.url
              : null;
          return (
            <div key={item.id} className="space-y-2 border border-border bg-background p-3">
              <div className="flex items-center gap-2">
                {item.type === "FILE" ? (
                  <FileIcon className="size-4 shrink-0" />
                ) : (
                  <LinkIcon className="size-4 shrink-0" />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="break-words text-sm font-semibold">{evidenceLabel(item)}</p>
                  <p className="break-all text-xs text-muted-foreground">
                    {item.type === "FILE"
                      ? [
                          item.file_name,
                          item.file_size === null ? null : formatBytes(item.file_size),
                          item.mime_type,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : item.url}
                  </p>
                </div>
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${evidenceLabel(item)}`}
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-2"
                  >
                    <ExternalLinkIcon className="size-4" />
                  </a>
                )}
                {item.type === "FILE" && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 shrink-0"
                    disabled={Boolean(downloading)}
                    aria-label={`Download ${evidenceLabel(item)}`}
                    onClick={() => void download(item)}
                  >
                    <DownloadIcon />
                  </Button>
                )}
                {editable && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 shrink-0"
                    disabled={pending || adding || Boolean(deleting) || Boolean(editing)}
                    aria-label={`Edit ${evidenceLabel(item)}`}
                    onClick={() => {
                      setEditing({ id: item.id, title: item.title ?? "", url: item.url ?? "" });
                      setError(null);
                    }}
                  >
                    <PencilIcon />
                  </Button>
                )}
                {editable && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 shrink-0"
                    disabled={
                      pending ||
                      adding ||
                      Boolean(deleting) ||
                      Boolean(editing) ||
                      Boolean(downloading)
                    }
                    aria-label={`Remove ${evidenceLabel(item)}`}
                    onClick={() => {
                      setDeleting(item.id);
                      setError(null);
                    }}
                  >
                    <Trash2Icon />
                  </Button>
                )}
              </div>
              {editable && editing?.id === item.id && (
                <form
                  className="space-y-3 border-t border-dashed border-border/50 pt-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (pending) return;
                    void run(
                      () =>
                        update.mutateAsync({
                          evidenceId: item.id,
                          input: {
                            title: editing.title.trim() || null,
                            ...(item.type === "LINK" ? { url: editing.url.trim() } : {}),
                          },
                        }),
                      "Evidence updated",
                    );
                  }}
                >
                  <label className="block space-y-1 text-sm">
                    <span><span className="system-copy">Title (optional)</span></span>
                    <Input
                      value={editing.title}
                      maxLength={255}
                      disabled={pending}
                      onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                    />
                  </label>
                  {item.type === "LINK" && (
                    <label className="block space-y-1 text-sm">
                      <span><span className="system-copy">Link</span></span>
                      <Input
                        type="url"
                        required
                        value={editing.url}
                        disabled={pending}
                        onChange={(event) => setEditing({ ...editing, url: event.target.value })}
                      />
                    </label>
                  )}
                  <div className="flex flex-wrap justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending}
                      onClick={() => {
                        setEditing(null);
                        setError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={pending || (item.type === "LINK" && !editing.url.trim())}
                    ><span className="system-copy">
                      Save
                    </span></Button>
                  </div>
                </form>
              )}
              {editable && deleting === item.id && (
                <div className="space-y-2 border-t border-dashed border-border/50 pt-2">
                  <p className="text-sm"><span className="system-copy">Remove this evidence?</span></p>
                  <div className="flex flex-wrap justify-end gap-3 pb-1 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => setDeleting(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        void run(() => remove.mutateAsync(item.id), "Evidence removed")
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {editable && adding && task.task_status !== "BLOCKED" && (
          <TaskEvidenceDialog
            busy={pending}
            onCancel={() => {
              setAdding(false);
              setError(null);
            }}
            onLink={(input) => run(() => add.mutateAsync(input), "Link added")}
            onFile={(file, title) => run(() => upload.mutateAsync({ file, title }), "File added")}
          />
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
