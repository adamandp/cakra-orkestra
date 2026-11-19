"use client";

import { Button } from "@/components/ui/button";
import type { TaskDetail } from "@/interface/task.interface";

export function TaskSubmitDialog({
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
  const hasEvidence = task.evidences.length > 0;
  return (
    <section
      aria-label="Confirm task submission"
      className="space-y-3 rounded-md border-2 border-border p-3"
    >
      <h4 className="font-semibold">Submit for approval?</h4>
      <p className="text-sm text-muted-foreground">
        Your task becomes read-only while waiting for admin approval.
      </p>
      <p className="text-sm">Evidence attached: {task.evidences.length}</p>
      <p className="text-sm">
        Checklist: {task.checklist_completed}/{task.checklist_total} complete
      </p>
      {task.checklist_completed < task.checklist_total && (
        <p className="text-xs text-muted-foreground">
          Some checklist items are incomplete. You can still submit.
        </p>
      )}
      {!hasEvidence && (
        <p role="alert" className="text-sm text-destructive">
          Add at least one evidence before submitting.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={busy || !hasEvidence} onClick={onConfirm}>
          {busy ? "Submitting..." : "Confirm submit"}
        </Button>
      </div>
    </section>
  );
}
