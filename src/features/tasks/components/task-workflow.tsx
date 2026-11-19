"use client";

import { useState } from "react";
import { BanIcon, PlayIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { TaskDetail } from "@/interface/task.interface";
import { useStartTask, useBlockTask, useResumeTask, useSubmitTask } from "../task.mutation";
import { getTaskError } from "../task.api";
import { TaskBlockDialog } from "./task-block-dialog";
import { TaskSubmitDialog } from "./task-submit-dialog";

export function TaskWorkflow({
  task,
  editable,
  busy,
}: {
  task: TaskDetail;
  editable: boolean;
  busy: boolean;
}) {
  const start = useStartTask(task.id);
  const block = useBlockTask(task.id);
  const resume = useResumeTask(task.id);
  const submit = useSubmitTask(task.id);
  const [panel, setPanel] = useState<"block" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pending =
    busy || start.isPending || block.isPending || resume.isPending || submit.isPending;
  async function run(action: () => Promise<unknown>, message: string) {
    setError(null);
    try {
      await action();
      setPanel(null);
      toast.success(message);
      return true;
    } catch (error) {
      setError(getTaskError(error));
      return false;
    }
  }
  function open(next: "block" | "submit" | null) {
    setPanel(next);
    setError(null);
  }
  if (task.task_status === "PENDING")
    return (
      <p className="rounded-md border p-3 text-sm text-muted-foreground">
        {task.approved_at ? "Approved — final assessment pending." : "Waiting for admin approval."}
      </p>
    );
  if (task.task_status === "DONE")
    return <p className="rounded-md border p-3 text-sm text-muted-foreground">Task completed.</p>;
  if (!editable) return null;
  return (
    <section className="space-y-3 rounded-lg border-2 border-border p-3">
      <h3 className="font-bold">Workflow</h3>
      <div className="flex flex-wrap gap-2">
        {task.task_status === "OPEN" && (
          <Button
            disabled={pending}
            onClick={() => void run(() => start.mutateAsync(), "Task started")}
          >
            <PlayIcon /> Start task
          </Button>
        )}
        {task.task_status === "BLOCKED" && (
          <Button
            disabled={pending}
            onClick={() => void run(() => resume.mutateAsync(), "Task resumed")}
          >
            <PlayIcon /> Resume task
          </Button>
        )}
        {task.task_status === "PROGRESS" && (
          <>
            <Button
              variant="outline"
              disabled={pending || panel !== null}
              onClick={() => open("block")}
            >
              <BanIcon /> Block
            </Button>
            <Button disabled={pending || panel !== null} onClick={() => open("submit")}>
              <SendIcon /> Submit for approval
            </Button>
          </>
        )}
      </div>
      {task.task_status === "PROGRESS" && panel === "block" && (
        <TaskBlockDialog
          busy={pending}
          onCancel={() => open(null)}
          onConfirm={(reason) => run(() => block.mutateAsync({ reason }), "Task blocked")}
        />
      )}
      {task.task_status === "PROGRESS" && panel === "submit" && (
        <TaskSubmitDialog
          task={task}
          busy={pending}
          onCancel={() => open(null)}
          onConfirm={() => void run(() => submit.mutateAsync(), "Task submitted for approval")}
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
