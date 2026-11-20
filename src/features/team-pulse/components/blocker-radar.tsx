"use client";

import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardTaskList } from "@/features/dashboards/components/dashboard-task-list";

export function BlockerRadar({ onInspect }: { onInspect: (id: string) => void }) {
  return (
      <DashboardTaskList
        title="Blocker radar"
        description="Tasks that need assistance from the team."
        filters={{ status: "BLOCKED" }}
        onInspect={onInspect}
        showAssignee
        emptyMessage="No blocked tasks."
        renderContext={(task) => (
          <p className="mt-1 break-words text-xs text-destructive">
            {task.blocker_reason ?? "No blocker reason provided"}
          </p>
        )}
        renderActions={(task) => (
          <Button size="icon-sm" variant="ghost" className="!size-8" aria-label="Inspect task" onClick={() => onInspect(task.id)}>
            <ArrowRightIcon />
          </Button>
        )}
      />
  );
}
