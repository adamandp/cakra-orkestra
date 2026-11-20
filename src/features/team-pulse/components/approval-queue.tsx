"use client";

import { Button } from "@/components/ui/button";
import { DashboardTaskList } from "@/features/dashboards/components/dashboard-task-list";

export function ApprovalQueue({ onInspect, onAction }: { onInspect: (id: string) => void; onAction: (id: string, section: "review" | "assessment") => void }) {
  return (
      <DashboardTaskList
        title="Task approval queue"
        description="Review submitted evidence or follow up on final AI assessments."
        filters={{ status: "PENDING" }}
        onInspect={onInspect}
        showAssignee
        emptyMessage="No tasks awaiting approval or final assessment."
        renderContext={(task) => (
          <p className="mt-1 text-xs text-muted-foreground">
            {task.evidence_count} evidence item(s)
          </p>
        )}
        renderActions={(task) => (
          <Button size="sm" variant="outline" onClick={() => onAction(task.id, task.approved_at || task.approved_by || task.final_assessment ? "assessment" : "review")}>
            {task.approved_at || task.approved_by || task.final_assessment
              ? "Assessment"
              : "Review"}
          </Button>
        )}
      />
  );
}
