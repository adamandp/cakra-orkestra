"use client";

import { useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { PencilIcon, Trash2Icon, UserRoundIcon } from "lucide-react";
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
import type { TaskDetail } from "@/interface/task.interface";
import { useTask, taskKeys } from "../task.query";
import { useDeleteTask } from "../task.mutation";
import { getTaskError } from "../task.api";
import { isEditableTask, taskTypeLabels, taskCategoryLabels } from "../task.constants";
import { TaskStatusBadge } from "./task-table";
import { TaskChecklistPanel } from "./task-checklist";
import { TaskWorkflow } from "./task-workflow";
import { TaskEvidencePanel } from "./task-evidence";
import { TaskStatusHistoryPanel } from "./task-status-history";

export function TaskInspector({
  taskId,
  isAdmin,
  actorId,
  onClose,
  onEdit,
  onReassign,
  onDeleted,
}: {
  taskId: string;
  isAdmin: boolean;
  actorId: string;
  onClose: () => void;
  onEdit: (task: TaskDetail) => void;
  onReassign: (task: TaskDetail) => void;
  onDeleted: () => void;
}) {
  const query = useTask(taskId);
  const mutation = useDeleteTask(taskId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const busy = useIsMutating({ mutationKey: taskKeys.mutations(taskId) }) > 0;
  const task = query.data;
  const editable = Boolean(
    task &&
    (isAdmin || task.assignee_id === actorId) &&
    isEditableTask(task.task_status) &&
    task.project.status === "ACTIVE",
  );
  async function confirm() {
    try {
      await mutation.mutateAsync();
      toast.success("Task deleted");
      onDeleted();
    } catch {
      /* Preserve confirmation. */
    }
  }
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <SheetContent className="w-full border-l-2 border-border sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Task inspector</SheetTitle>
          <SheetDescription>{task?.code ?? "Task details"}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {query.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : query.isError || !task ? (
            <div role="alert" className="space-y-2">
              <p className="text-sm text-destructive">{getTaskError(query.error)}</p>
              <Button variant="outline" onClick={() => void query.refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <TaskStatusBadge status={task.task_status} />
                <h2 className="break-words text-xl font-bold">{task.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {task.project.code} — {task.project.name}
                </p>
              </div>
              <dl className="grid gap-3 rounded-lg border-2 border-border p-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Assignee</dt>
                  <dd className="break-words">
                    {task.assignee.name}
                    {!task.assignee.is_active && " (inactive)"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Due date</dt>
                  <dd>{task.due_date ?? "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Type</dt>
                  <dd>{taskTypeLabels[task.task_type]}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Category</dt>
                  <dd>{taskCategoryLabels[task.task_category]}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Created at</dt>
                  <dd>{new Date(task.created_at).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Updated at</dt>
                  <dd>{new Date(task.updated_at).toLocaleString()}</dd>
                </div>
              </dl>
              <section className="space-y-2">
                <h3 className="font-bold">Description</h3>
                <p className="whitespace-pre-wrap break-words text-sm">{task.description}</p>
                {task.blocker_reason && (
                  <p className="text-sm text-destructive">Blocker: {task.blocker_reason}</p>
                )}
              </section>
              {editable ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={busy || confirmDelete}
                    onClick={() => onEdit(task)}
                  >
                    <PencilIcon /> Edit task
                  </Button>
                  {isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        disabled={busy || confirmDelete}
                        onClick={() => onReassign(task)}
                      >
                        <UserRoundIcon /> Reassign
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={busy || confirmDelete}
                        onClick={() => setConfirmDelete(true)}
                      >
                        <Trash2Icon /> Delete
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">This task is read-only.</p>
              )}
              {confirmDelete && isAdmin && editable && (
                <div className="space-y-3 rounded-md border-2 border-border p-3">
                  <p className="text-sm">
                    Soft-delete this task? It will no longer appear in task lists.
                  </p>
                  {mutation.isError && (
                    <p role="alert" className="text-sm text-destructive">
                      {getTaskError(mutation.error)}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      disabled={busy || mutation.isPending}
                      onClick={() => {
                        setConfirmDelete(false);
                        mutation.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={busy || mutation.isPending}
                      onClick={() => void confirm()}
                    >
                      {mutation.isPending ? "Deleting..." : "Confirm delete"}
                    </Button>
                  </div>
                </div>
              )}
              <TaskWorkflow
                key={`${task.id}:${task.task_status}`}
                task={task}
                editable={editable && !confirmDelete}
                busy={busy}
              />
              <TaskChecklistPanel
                key={task.id}
                task={task}
                editable={editable && !confirmDelete}
                busy={busy}
              />
              <TaskEvidencePanel
                key={`evidence:${task.id}`}
                task={task}
                editable={editable && !confirmDelete}
                busy={busy}
              />
              <TaskStatusHistoryPanel task={task} />
            </>
          )}
        </div>
        <div className="flex justify-end border-t p-4">
          <Button variant="outline" disabled={busy || mutation.isPending} onClick={onClose}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
