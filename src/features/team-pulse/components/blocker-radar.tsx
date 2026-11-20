"use client";

import { Button } from "@/components/ui/button";
import { DashboardTaskList } from "@/features/dashboards/components/dashboard-task-list";

export function BlockerRadar({ onInspect }: { onInspect: (id: string) => void }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Blocker radar</h2>
        <p className="text-sm text-muted-foreground">Tasks that need assistance from the team.</p>
      </div>
      <DashboardTaskList
        filters={{ status: "BLOCKED" }}
        showAssignee
        emptyMessage="No blocked tasks."
        renderContext={(task) => (
          <p className="mt-1 break-words text-xs text-destructive">
            {task.blocker_reason ?? "No blocker reason provided"}
          </p>
        )}
        renderActions={(task) => (
          <Button size="sm" variant="outline" onClick={() => onInspect(task.id)}>
            Inspect
          </Button>
        )}
      />
    </section>
  );
}
