import { Button } from "@/components/ui/button";
import type { TaskDetail } from "@/interface/task.interface";

export function TaskApproveDialog({
  task,
  busy,
  onCancel,
  onConfirm,
}: {
  task: TaskDetail;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <section
      aria-label="Confirm task approval"
      className="space-y-3 rounded-md border-2 border-border p-3"
    >
      <h4 className="font-bold"><span className="system-copy">Confirm approval</span></h4>
      <p className="break-words text-sm">
        {task.code} — {task.title}
      </p>
      <p className="text-sm text-muted-foreground">Assignee: {task.assignee.name}</p>
      <p className="text-sm">
        Review the {task.evidences.length} attached evidence item(s) in the Evidence section.
        Approval queues the final assessment; points are awarded only when it succeeds.
      </p>
      {!task.evidences.length && (
        <p role="alert" className="text-sm text-destructive"><span className="system-copy">
          Evidence is required before approval.
        </span></p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={busy} onClick={onCancel}><span className="system-copy">
          Cancel
        </span></Button>
        <Button disabled={busy || !task.evidences.length} onClick={onConfirm}>
          {busy ? "Please wait..." : "Confirm approval"}
        </Button>
      </div>
    </section>
  );
}
