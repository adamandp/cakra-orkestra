"use client";

import { useIsMutating } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardTaskList } from "@/features/dashboards/components/dashboard-task-list";
import { getTaskError } from "@/features/tasks/task.api";
import { useStartTask, useResumeTask } from "@/features/tasks/task.mutation";
import { taskKeys } from "@/features/tasks/task.query";
import type { TaskListItem } from "@/interface/task.interface";

function FocusActions({
  task,
  onInspect,
}: {
  task: TaskListItem;
  onInspect: (id: string) => void;
}) {
  const start = useStartTask(task.id);
  const resume = useResumeTask(task.id);
  const busy =
    useIsMutating({ mutationKey: taskKeys.mutations(task.id) }) > 0 ||
    start.isPending ||
    resume.isPending;
  const activeProject = task.project.status === "ACTIVE";
  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      toast.success(message);
    } catch (error) {
      toast.error(getTaskError(error));
    }
  }
  return (
    <>
      {activeProject && task.task_status === "OPEN" && (
        <Button
          size="sm"
          disabled={busy}
          onClick={() => void run(() => start.mutateAsync(), "Task started")}
        >
          Start
        </Button>
      )}
      {activeProject && task.task_status === "BLOCKED" && (
        <Button
          size="sm"
          disabled={busy}
          onClick={() => void run(() => resume.mutateAsync(), "Task resumed")}
        >
          Resume
        </Button>
      )}
      <Button size="sm" variant="outline" disabled={busy} onClick={() => onInspect(task.id)}>
        {activeProject && task.task_status === "PROGRESS" ? "Block / Submit" : "Details"}
      </Button>
    </>
  );
}

export function FocusTaskList({ onInspect }: { onInspect: (id: string) => void }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">My tasks</h2>
      <DashboardTaskList
        filters={{ scope: "me" }}
        emptyMessage="No tasks assigned to you."
        renderContext={(task) => (
          <>
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
        renderActions={(task) => <FocusActions task={task} onInspect={onInspect} />}
      />
    </section>
  );
}
