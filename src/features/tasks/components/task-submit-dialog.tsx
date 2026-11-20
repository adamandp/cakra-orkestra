"use client";

import { useEffect, useRef } from "react";
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
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const section = sectionRef.current;
      if (!section) return;
      section.focus({ preventScroll: true });
      section.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
        inline: "nearest",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const hasEvidence = task.evidences.length > 0;
  const checklistComplete = task.checklist_completed === task.checklist_total;
  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-label="Confirm task submission"
      className="scroll-mt-4 space-y-3 border-t border-dashed border-border pt-3 outline-none"
    >
      <h4 className="font-semibold"><span className="system-copy">Submit for approval?</span></h4>
      <p className="text-sm text-muted-foreground"><span className="system-copy">
        Your task becomes read-only while waiting for admin approval.
      </span></p>
      <p className="text-sm">Evidence attached: {task.evidences.length}</p>
      <p className="text-sm">
        Checklist: {task.checklist_completed}/{task.checklist_total} complete
      </p>
      {!checklistComplete && (
        <p role="alert" className="text-sm text-destructive"><span className="system-copy">
          Complete all checklist items before submitting.
        </span></p>
      )}
      {!hasEvidence && (
        <p role="alert" className="text-sm text-destructive"><span className="system-copy">
          Add at least one evidence before submitting.
        </span></p>
      )}
      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4 pb-2 pr-1">
        <Button variant="outline" disabled={busy} onClick={onCancel}><span className="system-copy">
          Cancel
        </span></Button>
        <Button
          data-retain-disabled-shadow
          disabled={busy || !hasEvidence || !checklistComplete}
          onClick={onConfirm}
        >
          {busy ? "Submitting..." : "Confirm submit"}
        </Button>
      </div>
    </section>
  );
}
