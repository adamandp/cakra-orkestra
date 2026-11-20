"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemberWorkloads } from "@/features/dashboards/dashboard.query";
import { DashboardState } from "@/features/dashboards/components/dashboard-state";
import {
  DashboardTaskPoints,
  DashboardTaskStatus,
} from "@/features/dashboards/components/dashboard-task-status";
import type { WorkloadStatus } from "@/interface/dashboard.interface";

const workloadLabels: Record<WorkloadStatus, string> = {
  AVAILABLE: "Available",
  BALANCED: "Balanced",
  HIGH_LOAD: "High load",
};

export function MemberWorkloads({ onInspect }: { onInspect: (id: string) => void }) {
  const query = useMemberWorkloads();
  const workloads = query.data ?? [];
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Member workload</h2>
        <p className="text-sm text-muted-foreground">
          Estimated active points; provisional thresholds: 0–5 available, 6–12 balanced, 13+ high
          load.
        </p>
      </div>
      <DashboardState
        pending={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {!workloads.length ? (
          <p className="rounded-lg border-2 border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No members found.
          </p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {workloads.map(
              ({
                member,
                active_tasks,
                active_points,
                approved_points,
                status,
                unestimated_tasks,
              }) => (
                <Card key={member.id}>
                  <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar>
                        {member.avatar_url && <AvatarImage src={member.avatar_url} alt="" />}
                        <AvatarFallback>
                          {member.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part.charAt(0))
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <CardTitle className="break-words">
                          {member.name}
                          {!member.is_active && " (inactive)"}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {active_tasks.length} active · {active_points} estimated pts ·{" "}
                          {approved_points} approved pts
                        </p>
                        {unestimated_tasks > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {unestimated_tasks} unestimated — workload may be understated
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        status === "HIGH_LOAD"
                          ? "destructive"
                          : status === "BALANCED"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {workloadLabels[status]}
                    </Badge>
                  </CardHeader>
                  <CardContent className="max-h-80 overflow-y-auto">
                    {active_tasks.length ? (
                      <ul className="divide-y divide-border">
                        {active_tasks.map((task) => (
                          <li
                            key={task.id}
                            className="flex flex-wrap items-center justify-between gap-3 py-3"
                          >
                            <button
                              type="button"
                              className="min-w-0 flex-1 break-words text-left text-sm font-semibold hover:underline focus-visible:underline"
                              onClick={() => onInspect(task.id)}
                            >
                              <span className="block font-mono text-xs text-muted-foreground">
                                {task.code}
                              </span>
                              {task.title}
                            </button>
                            <div className="flex flex-wrap items-center gap-2">
                              <DashboardTaskStatus task={task} />
                              <DashboardTaskPoints task={task} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="py-2 text-sm text-muted-foreground">No active tasks.</p>
                    )}
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        )}
      </DashboardState>
    </section>
  );
}
