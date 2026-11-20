import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoaderCircleIcon, RotateCwIcon } from "lucide-react";
import type { TaskAIResult, TaskAIResultType } from "@/interface/task.interface";
import { isAssessmentRunning } from "../task-ai-result.constants";

export function TaskAIResultCard({
  type,
  result,
  canRetry,
  busy,
  onRetry,
}: {
  type: TaskAIResultType;
  result: TaskAIResult | null;
  canRetry: boolean;
  busy: boolean;
  onRetry: (resultId: string) => void;
}) {
  const initial = type === "INITIAL";
  const running = isAssessmentRunning(result);
  return (
    <article className="min-w-0 space-y-3 border border-border bg-background p-3">
      <h4 className="text-sm font-bold">{initial ? "Initial assessment" : "Final assessment"}</h4>
      <div aria-live="polite" className="space-y-2">
        {result?.status === "COMPLETED" ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl font-bold tabular-nums">{result.points ?? "—"} pts</span>
              <Badge variant="outline">{result.tier ?? "—"}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {initial ? "Estimated points" : "Approved contribution"}
            </p>
          </>
        ) : running ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircleIcon className="size-4 shrink-0 animate-spin" />{" "}
            {result?.status === "PENDING" ? "Queued for assessment" : "Evaluating task..."}
          </p>
        ) : result?.status === "FAILED" ? (
          <p role="alert" className="text-sm text-destructive">
            {result.error_message || "Assessment failed."}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground"><span className="system-copy">Awaiting admin approval</span></p>
        )}
      </div>
      {result?.status === "FAILED" && canRetry && (
        <Button variant="outline" size="sm" disabled={busy} onClick={() => onRetry(result.id)}>
          <RotateCwIcon /> Retry assessment
        </Button>
      )}
      {result?.reasoning && (
        <p className="whitespace-pre-wrap break-words text-sm">
          <span className="font-medium"><span className="system-copy">AI reasoning: </span></span>
          {result.reasoning}
        </p>
      )}
    </article>
  );
}
