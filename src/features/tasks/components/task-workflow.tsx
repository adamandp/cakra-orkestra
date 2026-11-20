"use client";

import { useState } from "react";
import {
  InfoIcon,
  BanIcon,
  CheckIcon,
  PlayIcon,
  SendIcon,
  WorkflowIcon,
  XIcon,
} from "lucide-react";
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

function WorkflowCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="border-2 border-border bg-card">
      <div className="border-b-2 border-border bg-muted/40 p-3">
        <h3 className="flex items-center gap-2 font-bold">
          <WorkflowIcon className="size-4" /> Workflow
        </h3>
      </div>
      <div className="space-y-3 p-3 pb-4">{children}</div>
    </section>
  );
}

type WorkflowPanel = "block" | "submit" | "approve" | "reject" | null;

export function TaskWorkflow({
  task,
  editable,
  canBlock,
  busy,
  isAdmin,
  initialPanel = null,
}: {
  task: TaskDetail;
  editable: boolean;
  canBlock: boolean;
  busy: boolean;
  isAdmin: boolean;
  initialPanel?: "block" | "submit" | null;
}) {
  const start = useStartTask(task.id);
  const block = useBlockTask(task.id);
  const resume = useResumeTask(task.id);
  const submit = useSubmitTask(task.id);
  const approve = useApproveTask(task.id);
  const reject = useRejectTask(task.id);
  const [panel, setPanel] = useState<WorkflowPanel>(
    task.task_status === "PROGRESS" ? initialPanel : null,
  );
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
    const canReview = isAdmin && task.project.status === "ACTIVE";
    if (approved || !canReview) return null;
    return (
      <WorkflowCard>
        {panel === null && (
          <div className="flex flex-wrap gap-3 pr-1 pb-1 [&>button]:flex-1">
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
        )}
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
      </WorkflowCard>
    );
  }
  if (task.task_status === "DONE" || (!editable && !canBlock)) return null;
  const missingChecklist = task.checklist_completed !== task.checklist_total;
  const missingEvidence = task.evidences.length === 0;
  const submitHint =
    missingChecklist && missingEvidence
      ? "Complete all checklist items and add at least one evidence before submitting."
      : missingChecklist
        ? "Complete all checklist items before submitting."
        : missingEvidence
          ? "Add at least one evidence before submitting."
          : null;
  return (
    <WorkflowCard>
      {task.task_status === "PROGRESS" && panel === null && editable && submitHint && (
        <div
          className="flex items-start gap-2 border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground"
          role="status"
        >
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          <span>{submitHint}</span>
        </div>
      )}
      {panel === null && (
        <div className="flex flex-wrap gap-3 pr-1 pb-1 [&>button]:flex-1">
          {editable && task.task_status === "OPEN" && (
            <Button
              disabled={pending}
              onClick={() => void run(() => start.mutateAsync(), "Task started")}
            >
              <PlayIcon /> Start task
            </Button>
          )}
          {editable && task.task_status === "BLOCKED" && (
            <Button
              disabled={pending}
              onClick={() => void run(() => resume.mutateAsync(), "Task resumed")}
            >
              <PlayIcon /> Resume task
            </Button>
          )}
          {task.task_status === "PROGRESS" && (
            <>
              {canBlock && <Button
                variant="outline"
                className="text-destructive"
                disabled={pending || panel !== null}
                onClick={() => open("block")}
              >
                <BanIcon /> Block
              </Button>}
              {editable && <Button
                data-retain-disabled-shadow
                disabled={pending || panel !== null || Boolean(submitHint)}
                onClick={() => open("submit")}
              >
                <SendIcon /> Submit for approval
              </Button>}
            </>
          )}
        </div>
      )}
      {task.task_status === "PROGRESS" && canBlock && panel === "block" && (
        <TaskBlockDialog
          busy={pending}
          onCancel={() => open(null)}
          onConfirm={(reason) => run(() => block.mutateAsync({ reason }), "Task blocked")}
        />
      )}
      {task.task_status === "PROGRESS" && editable && panel === "submit" && (
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
    </WorkflowCard>
  );
}
