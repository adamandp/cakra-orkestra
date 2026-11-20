"use client";

import { useState, useRef, useEffect } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import { toast } from "sonner";
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
import type { TaskDetail } from "@/interface/task.interface";
import { useTask, taskKeys } from "../task.query";
import { useUpdateTaskDescription } from "../task.mutation";
import { getTaskError } from "../task.api";
import { getTaskPermissions, taskTypeLabels, taskCategoryLabels } from "../task.constants";
import { TaskStatusBadge } from "./task-table";
import { TaskChecklistPanel } from "./task-checklist";
import { TaskWorkflow } from "./task-workflow";
import { TaskEvidencePanel } from "./task-evidence";
import { TaskStatusHistoryPanel } from "./task-status-history";
import { TaskAIAssessment } from "./task-ai-assessment";

export function TaskInspector({
  taskId,
  isAdmin,
  actorId,
  onClose,
  initialPanel,
  initialSection,
  personal = false,
}: {
  personal?: boolean;
  taskId: string;
  isAdmin: boolean;
  actorId: string;
  onClose: () => void;
  onEdit: (task: TaskDetail) => void;
  onReassign: (task: TaskDetail) => void;
  onDeleted: () => void;
  initialSection?: "review" | "assessment";
  initialPanel?: "block" | "submit";
}) {
  const lifecycle = useSheetLifecycle(onClose);
  const query = useTask(taskId);
  const descriptionMutation = useUpdateTaskDescription(taskId);
  const [descriptionDraft, setDescriptionDraft] = useState<string | null>(null);
  const busy = useIsMutating({ mutationKey: taskKeys.mutations(taskId) }) > 0;
  const task = query.data;
  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!task || !initialSection) return;
    const timer = window.setTimeout(() => sectionRef.current?.scrollIntoView({ block: "start", behavior: "instant" }), 0);
    return () => window.clearTimeout(timer);
  }, [task?.id, initialSection]);
  const permissions = task ? getTaskPermissions(task, actorId, isAdmin) : null;
  const editable = Boolean(permissions?.execute);
  const canEditDescription = Boolean(permissions?.editDescription);
  return (
    <Sheet
      open={lifecycle.open}
      onOpenChangeComplete={lifecycle.onOpenChangeComplete}
      onOpenChange={(open) => {
        if (!open && !busy) lifecycle.close();
      }}
    >
      <SheetContent
        showCloseButton={false}
        className="w-full gap-0 border-l-2 border-border sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle><span className="system-copy">Task inspector</span></SheetTitle>
          <SheetDescription>{task?.code ?? "Task details"}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
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
              <div className="space-y-2 border-b border-border/30 pb-4">
                <TaskStatusBadge status={task.task_status} />
                <h2 className="break-words text-xl font-bold">{task.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {task.project.code} — {task.project.name}
                </p>
                {descriptionDraft !== null ? (
                  <form
                    className="space-y-2"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      if (!canEditDescription || !descriptionDraft.trim()) return;
                      try {
                        await descriptionMutation.mutateAsync({
                          description: descriptionDraft.trim(),
                        });
                        setDescriptionDraft(null);
                        toast.success("Description updated");
                      } catch (error) {
                        toast.error(getTaskError(error));
                      }
                    }}
                  >
                    <textarea
                      className="min-h-24 w-full border-2 border-border bg-background p-2 text-sm"
                      aria-label="Task description"
                      value={descriptionDraft}
                      disabled={busy}
                      onChange={(event) => setDescriptionDraft(event.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => setDescriptionDraft(null)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={busy || !descriptionDraft.trim()}><span className="system-copy">
                        Save
                      </span></Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start gap-2">
                    <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm">
                      {task.description}
                    </p>
                    {canEditDescription && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit description"
                        disabled={busy}
                        onClick={() => setDescriptionDraft(task.description)}
                      >
                        <PencilIcon />
                      </Button>
                    )}
                  </div>
                )}
                {task.blocker_reason && (
                  <p className="text-sm text-destructive">Blocker: {task.blocker_reason}</p>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-4 border-2 border-border bg-muted/30 p-3 text-sm [&_dd]:mt-1 [&_dd]:font-medium [&_dd]:break-words">
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
              </dl>
              <div ref={initialSection === "assessment" ? sectionRef : undefined}>
              <TaskAIAssessment
                key={`assessment:${task.id}`}
                task={task}
                isAdmin={isAdmin}
                actorId={actorId}
                busy={busy}
              />
              </div>
              {task.approved_at && (
                <p className="text-xs text-muted-foreground">
                  Human approval: {new Date(task.approved_at).toLocaleString()}
                </p>
              )}
              <TaskChecklistPanel
                canDelete={Boolean(permissions?.manageChecklist)}
                canComplete={editable}
                key={task.id}
                task={task}
                editable={Boolean(permissions?.manageChecklist)}
                busy={busy}
              />
              {personal && <TaskEvidencePanel
                key={`evidence:${task.id}`}
                task={task}
                editable={editable}
                busy={busy}
              />}
              {!editable && !canEditDescription && !permissions?.review && (
                <p className="text-xs text-muted-foreground"><span className="system-copy">This task is read-only.</span></p>
              )}
              <div ref={initialSection === "review" ? sectionRef : undefined}>
              <TaskWorkflow
                key={`${task.id}:${task.task_status}`}
                task={task}
                editable={editable}
                busy={busy}
                initialPanel={initialPanel}
                canBlock={Boolean(permissions?.block)}
                isAdmin={Boolean(permissions?.review)}
              />
              </div>
              <TaskStatusHistoryPanel task={task} />
            </>
          )}
        </div>
        <SheetFooter>
          <Button variant="outline" disabled={busy} onClick={lifecycle.close}><span className="system-copy">
            Close
          </span></Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
