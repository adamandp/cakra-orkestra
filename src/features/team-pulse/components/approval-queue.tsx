"use client";

import { Button } from "@/components/ui/button";
import { DashboardTaskList } from "@/features/dashboards/components/dashboard-task-list";

export function ApprovalQueue({ onInspect }: { onInspect: (id: string) => void }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Task approval queue</h2>
        <p className="text-sm text-muted-foreground">
          Review submitted evidence or follow up on final AI assessments.
        </p>
      </div>
      <DashboardTaskList
        filters={{ status: "PENDING" }}
        showAssignee
        emptyMessage="No tasks awaiting approval or final assessment."
        renderContext={(task) => (
          <p className="mt-1 text-xs text-muted-foreground">
            {task.evidence_count} evidence item(s)
          </p>
        )}
        renderActions={(task) => (
          <Button size="sm" variant="outline" onClick={() => onInspect(task.id)}>
            {task.approved_at || task.approved_by || task.final_assessment
              ? "View assessment"
              : "Review"}
          </Button>
        )}
      />
    </section>
  );
}
