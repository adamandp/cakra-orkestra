"use client";

import { BanIcon, CheckIcon, ClockIcon, PlayIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { useStartTask, useResumeTask } from "@/features/tasks/task.mutation";
import { getTaskError } from "@/features/tasks/task.api";
import type { TaskListItem } from "@/interface/task.interface";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { DashboardTaskList } from "@/features/dashboards/components/dashboard-task-list";

type Inspect = (id: string, panel?: "block" | "submit") => void;

export function FocusTaskActions({ task, onInspect }: { task: TaskListItem; onInspect: Inspect }) {
  const { user } = useAuth();
  const start = useStartTask(task.id);
  const resume = useResumeTask(task.id);
  const pending = start.isPending || resume.isPending;
  if (task.task_status === "PENDING")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        <ClockIcon className="size-3.5" />
        {task.final_assessment?.status === "FAILED"
          ? "Final AI failed"
          : task.approved_at || task.approved_by || task.final_assessment
            ? "Final assessment"
            : "Awaiting approval"}
      </span>
    );
  if (task.task_status === "DONE")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        <CheckIcon className="size-3.5" />
        Completed
      </span>
    );
  if (
    task.project.status !== "ACTIVE" ||
    !(user?.role === "ADMIN" || user?.id === task.assignee_id)
  )
    return null;
  if (task.task_status === "PROGRESS")
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive"
          onClick={() => onInspect(task.id, "block")}
        >
          <BanIcon /> Block
        </Button>
        <Button
          size="sm"
          data-retain-disabled-shadow
          disabled={task.checklist_completed !== task.checklist_total || task.evidence_count === 0}
          onClick={() => onInspect(task.id, "submit")}
        >
          <SendIcon /> Submit
        </Button>
      </>
    );
  const blocked = task.task_status === "BLOCKED";
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={async () => {
        try {
          await (blocked ? resume : start).mutateAsync();
          toast.success(blocked ? "Task resumed" : "Task started");
        } catch (error) {
          toast.error(getTaskError(error));
        }
      }}
    >
      <PlayIcon />
      {pending ? "Working..." : blocked ? "Resume" : "Start"}
    </Button>
  );
}

export function FocusTaskList({ onInspect }: { onInspect: Inspect }) {
  return (
    <DashboardTaskList
      title="Active tasks"
      filters={{ scope: "me", exclude_status: "DONE", sort: "due_asc" }}
      personalFilters
      filterable
      initialPageSize={10}
      actionLabel="Actions"
      onInspect={onInspect}
      emptyMessage="No active tasks assigned to you."
      renderContext={(task) => (
        <>
          <FocusTaskMetadata task={task} />
          {task.revision_reason && (
            <p className="mt-1 break-words text-xs text-destructive">
              Revision: {task.revision_reason}
            </p>
          )}
          {task.blocker_reason && (
            <p className="mt-1 break-words text-xs text-destructive">
              Blocker: {task.blocker_reason}
            </p>
          )}
        </>
      )}
      renderActions={(task) => <FocusTaskActions task={task} onInspect={onInspect} />}
    />
  );
}

export function FocusTaskMetadata({ task }: { task: TaskListItem }) {
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const overdue =
    task.task_status !== "DONE" && task.due_date && task.due_date.slice(0, 10) < today;
  const minutes = Math.floor((task.work_duration_seconds ?? 0) / 60);
  const duration =
    minutes < 60 ? minutes + "m" : Math.floor(minutes / 60) + "h " + (minutes % 60) + "m";
  return (
    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
      <div className="flex flex-wrap gap-2">
        <span className={overdue ? "font-bold text-destructive" : ""}>
          {task.due_date
            ? (overdue ? "Overdue · " : "Due · ") + task.due_date.slice(0, 10)
            : "No deadline"}
        </span>
        <span>· {duration} in progress</span>
        {Boolean(task.revision_count) && <span>· {task.revision_count} revision(s)</span>}
        {task.project.status !== "ACTIVE" && (
          <span className="font-bold text-destructive">
            Project {task.project.status.toLowerCase()}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <progress
          aria-label="Checklist progress"
          className="h-2 w-24 accent-emerald-600"
          value={task.checklist_completed}
          max={Math.max(1, task.checklist_total)}
        />
        <span>
          {task.checklist_completed}/{task.checklist_total} checklist · {task.evidence_count}{" "}
          evidence
        </span>
      </div>
    </div>
  );
}
