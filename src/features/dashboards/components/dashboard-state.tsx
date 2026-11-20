import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getTaskError } from "@/features/tasks/task.api";

export function DashboardState({
  pending,
  error,
  onRetry,
  children,
}: {
  pending: boolean;
  error: unknown;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (pending)
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        className="space-y-3 rounded-lg border-2 border-border bg-card p-6 text-center"
      >
        <p className="text-sm text-destructive">{getTaskError(error)}</p>
        <Button variant="outline" onClick={onRetry}><span className="system-copy">
          Retry
        </span></Button>
      </div>
    );
  return <>{children}</>;
}
