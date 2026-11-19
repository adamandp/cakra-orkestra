"use client";

import { useState } from "react";
import {
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  LinkIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { TaskDetail, TaskEvidence } from "@/interface/task.interface";
import { useCreateTaskLink, useUploadTaskEvidence, useDeleteTaskEvidence } from "../task.mutation";
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
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pending = busy || add.isPending || upload.isPending || remove.isPending;
  async function run(action: () => Promise<unknown>, message: string) {
    setError(null);
    try {
      await action();
      setAdding(false);
      setDeleting(null);
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
    <section className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold">Evidence ({task.evidences.length})</h3>
        {editable && (
          <Button
            variant="outline"
            size="sm"
            disabled={pending || adding || Boolean(deleting)}
            onClick={() => {
              setAdding(true);
              setError(null);
            }}
          >
            <PlusIcon /> Add evidence
          </Button>
        )}
      </div>
      {!task.evidences.length && (
        <p className="text-sm text-muted-foreground">No evidence attached.</p>
      )}
      {task.evidences.map((item) => {
        const link =
          item.type === "LINK" && createTaskLinkSchema.safeParse({ url: item.url }).success
            ? item.url
            : null;
        return (
          <div key={item.id} className="space-y-2 rounded-md border p-3">
            <div className="flex items-start gap-2">
              {item.type === "FILE" ? (
                <FileIcon className="mt-1 size-4 shrink-0" />
              ) : (
                <LinkIcon className="mt-1 size-4 shrink-0" />
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
                  className="rounded-md p-2 hover:bg-muted focus-visible:outline-2"
                >
                  <ExternalLinkIcon className="size-4" />
                </a>
              )}
              {item.type === "FILE" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
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
                  disabled={pending || adding || Boolean(deleting) || Boolean(downloading)}
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
            {editable && deleting === item.id && (
              <div className="space-y-2 border-t pt-2">
                <p className="text-sm">Remove this evidence?</p>
                <div className="flex justify-end gap-2">
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
                    onClick={() => void run(() => remove.mutateAsync(item.id), "Evidence removed")}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {editable && adding && (
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
    </section>
  );
}
