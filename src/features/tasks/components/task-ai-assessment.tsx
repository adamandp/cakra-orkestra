"use client";

import { getTaskPermissions } from "../task.constants";

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
  const { retryInitial: canRetryInitial, retryFinal: canRetryFinal } = getTaskPermissions(task, actorId, isAdmin);
  async function run(resultId: string) {
    try {
      await retry.mutateAsync(resultId);
      toast.success("Assessment queued for retry");
    } catch {
      /* Render the error below and retain the failed result. */
    }
  }
  return (
    <section className="border-2 border-border bg-card" aria-label="AI assessment">
      <div className="space-y-1 border-b-2 border-border bg-muted/40 p-3">
        <h3 className="flex items-center gap-2 font-bold">
          <SparklesIcon className="size-4" /> AI assessment
        </h3>
        <p className="text-xs text-muted-foreground"><span className="system-copy">
          The initial result estimates task complexity. Only the successful final result of a
          completed task counts toward contribution.
        </span></p>
      </div>
      <div className="space-y-3 p-3 pb-4">
        <div className="grid grid-cols-1 gap-3">
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
      </div>
    </section>
  );
}
