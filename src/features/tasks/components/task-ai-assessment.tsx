"use client";

import { SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import type { TaskDetail } from "@/interface/task.interface";
import { useRetryTaskAIResult } from "../task-ai-result.mutation";
import { getTaskError } from "../task.api";
import { TaskAIResultCard } from "./task-ai-result-card";

export function TaskAIAssessment({
  task,
  isAdmin,
  actorId,
  busy,
}: {
  task: TaskDetail;
  isAdmin: boolean;
  actorId: string;
  busy: boolean;
}) {
  const retry = useRetryTaskAIResult(task.id);
  const active = task.project.status === "ACTIVE";
  const canRetryInitial = active && (isAdmin || task.assignee_id === actorId);
  const canRetryFinal =
    active &&
    isAdmin &&
    task.task_status === "PENDING" &&
    Boolean(task.approved_at && task.approved_by);
  async function run(resultId: string) {
    try {
      await retry.mutateAsync(resultId);
      toast.success("Assessment queued for retry");
    } catch {
      /* Render the error below and retain the failed result. */
    }
  }
  return (
    <section className="space-y-3" aria-label="AI assessment">
      <h3 className="flex items-center gap-2 font-bold">
        <SparklesIcon className="size-4" /> AI assessment
      </h3>
      <p className="text-xs text-muted-foreground">
        The initial result estimates task complexity. Only the successful final result of a
        completed task counts toward contribution.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <TaskAIResultCard
          type="INITIAL"
          result={task.ai_results.initial}
          canRetry={canRetryInitial}
          busy={busy || retry.isPending}
          onRetry={(id) => void run(id)}
        />
        <TaskAIResultCard
          type="FINAL"
          result={task.ai_results.final}
          canRetry={canRetryFinal}
          busy={busy || retry.isPending}
          onRetry={(id) => void run(id)}
        />
      </div>
      {retry.isError && (
        <p role="alert" className="text-sm text-destructive">
          {getTaskError(retry.error)}
        </p>
      )}
    </section>
  );
}
