"use client";

import { useState } from "react";
import { BanIcon, CheckIcon, PlayIcon, SendIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { TaskDetail } from "@/interface/task.interface";
import { useStartTask, useBlockTask, useResumeTask, useSubmitTask } from "../task.mutation";
import { getTaskError } from "../task.api";
import { TaskBlockDialog } from "./task-block-dialog";
import { TaskSubmitDialog } from "./task-submit-dialog";
import { useApproveTask, useRejectTask } from "../task-ai-result.mutation";
import { TaskApproveDialog } from "./task-approve-dialog";
import { TaskRejectDialog } from "./task-reject-dialog";

type WorkflowPanel = "block" | "submit" | "approve" | "reject" | null;

export function TaskWorkflow({
  task,
  editable,
  busy,
  isAdmin,
}: {
  task: TaskDetail;
  editable: boolean;
  busy: boolean;
  isAdmin: boolean;
}) {
  const start = useStartTask(task.id);
  const block = useBlockTask(task.id);
  const resume = useResumeTask(task.id);
  const submit = useSubmitTask(task.id);
  const approve = useApproveTask(task.id);
  const reject = useRejectTask(task.id);
  const [panel, setPanel] = useState<WorkflowPanel>(null);
  const [error, setError] = useState<string | null>(null);
  const pending =
    busy ||
    start.isPending ||
    block.isPending ||
    resume.isPending ||
    submit.isPending ||
    approve.isPending ||
    reject.isPending;
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
  function open(next: WorkflowPanel) {
    setPanel(next);
    setError(null);
  }
  if (task.task_status === "PENDING") {
    const approved = Boolean(task.approved_at || task.approved_by || task.ai_results.final);
    if (approved)
      return (
        <p className="rounded-md border p-3 text-sm text-muted-foreground">
          {task.ai_results.final?.status === "FAILED"
            ? "Approved — final assessment failed. Awaiting admin retry."
            : "Approved — waiting for final assessment."}
        </p>
      );
    const canReview = isAdmin && task.project.status === "ACTIVE";
    if (!canReview)
      return (
        <p className="rounded-md border p-3 text-sm text-muted-foreground">
          Waiting for admin approval.
        </p>
      );
    return (
      <section className="space-y-3 rounded-lg border-2 border-border p-3">
        <h3 className="font-bold">Admin approval</h3>
        <p className="text-sm text-muted-foreground">
          Verify the attached evidence before approving.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={pending || panel !== null}
            onClick={() => open("reject")}
          >
            <XIcon /> Reject
          </Button>
          <Button
            disabled={pending || panel !== null || !task.evidences.length}
            onClick={() => open("approve")}
          >
            <CheckIcon /> Approve task
          </Button>
        </div>
        {panel === "approve" && (
          <TaskApproveDialog
            task={task}
            busy={pending}
            onCancel={() => open(null)}
            onConfirm={() =>
              void run(() => approve.mutateAsync(), "Task approved; final assessment queued")
            }
          />
        )}
        {panel === "reject" && (
          <TaskRejectDialog
            busy={pending}
            onCancel={() => open(null)}
            onConfirm={(reason) => run(() => reject.mutateAsync({ reason }), "Revision requested")}
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
