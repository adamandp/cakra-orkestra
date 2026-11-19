"use client";

import { useState } from "react";
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
import { useProject } from "@/features/projects/project.query";
import { getProjectError } from "@/features/projects/project.api";
import type { TaskDetail } from "@/interface/task.interface";
import { useUpdateTaskAssignee } from "../task.mutation";
import { getTaskError } from "../task.api";
import { TaskSelect } from "./task-select";
import { taskAssigneeOptions } from "./task-project-picker";

export function TaskAssigneeSheet({
  task,
  actorId,
  onClose,
  onSaved,
}: {
  task: TaskDetail;
  actorId: string;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [assigneeId, setAssigneeId] = useState(task.assignee_id);
  const project = useProject(task.project_id);
  const mutation = useUpdateTaskAssignee(task.id);
  const options = taskAssigneeOptions(project.data ?? null, actorId);
  const valid = options.some((option) => option.value === assigneeId);
  const pending = mutation.isPending;
  async function save() {
    try {
      const result = await mutation.mutateAsync({ assignee_id: assigneeId });
      toast.success("Assignee updated");
      onSaved(result.id);
    } catch {
      /* Display error below. */
    }
  }
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <SheetContent className="w-full border-l-2 border-border sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Change assignee</SheetTitle>
          <SheetDescription>
            {task.code} — {task.title}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 p-4">
          <p className="text-sm">
            Current assignee: {task.assignee.name}
            {!task.assignee.is_active && " (inactive)"}
          </p>
          {project.isPending ? (
            <Skeleton className="h-10 w-full" />
          ) : project.isError ? (
            <div role="alert" className="space-y-2 text-sm text-destructive">
              <p>{getProjectError(project.error)}</p>
              <Button variant="outline" onClick={() => void project.refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <TaskSelect
              label="New assignee"
              value={valid ? assigneeId : "unselected"}
              options={
                valid
                  ? options
                  : [{ value: "unselected", label: "Select an active assignee" }, ...options]
              }
              disabled={pending}
              onChange={setAssigneeId}
            />
          )}
          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getTaskError(mutation.error)}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" disabled={pending} onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={
                pending ||
                project.isError ||
                project.isPending ||
                project.data?.status !== "ACTIVE" ||
                !valid ||
                assigneeId === task.assignee_id
              }
              onClick={() => void save()}
            >
              {pending ? "Saving..." : "Save assignee"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
