import { Badge } from "@/components/ui/badge";
import { TaskStatusBadge } from "@/features/tasks/components/task-table";
import type { TaskListItem } from "@/interface/task.interface";

export function DashboardTaskStatus({ task }: { task: TaskListItem }) {
  const approved = Boolean(task.approved_at || task.approved_by || task.final_assessment);
  if (task.task_status === "PENDING" && approved) {
    const status = task.final_assessment?.status;
    const label =
      status === "FAILED"
        ? "Final AI failed"
        : status === "PROCESSING"
          ? "Final AI processing"
          : status === "COMPLETED"
            ? "Final AI completed — awaiting DONE"
            : "Final AI queued";
    return <Badge variant={status === "FAILED" ? "destructive" : "secondary"}>{label}</Badge>;
  }
  return <TaskStatusBadge status={task.task_status} />;
}

export function DashboardTaskPoints({ task }: { task: TaskListItem }) {
  const done = task.task_status === "DONE";
  const result = done ? task.final_assessment : task.initial_assessment;
  if (result?.status === "COMPLETED" && result.points !== null) {
    return (
      <div className="space-y-1">
        <Badge variant="outline">
          {result.tier ?? "Unclassified"} · {result.points} pts
        </Badge>
        <p className="text-xs text-muted-foreground">{done ? "Approved" : "Estimated"}</p>
      </div>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">
      {result?.status === "FAILED" ? "Assessment failed" : "Not estimated yet"}
    </span>
  );
}
