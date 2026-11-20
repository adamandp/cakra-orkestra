"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { blockTaskSchema } from "../task.schema";

// Inline confirmation panel inside the existing inspector Sheet.
export function TaskBlockDialog({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<boolean>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      reasonRef.current?.focus({ preventScroll: true });
      formRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
        inline: "nearest",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    const parsed = blockTaskSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(null);
    await onConfirm(parsed.data.reason);
  }
  return (
    <form
      ref={formRef}
      className="scroll-mt-4 space-y-3 border-t border-dashed border-border pt-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy) void submit();
      }}
    >
      <Label htmlFor="task-block-reason">Blocker reason</Label>
      <textarea
        ref={reasonRef}
        id="task-block-reason"
        rows={3}
        maxLength={2000}
        value={reason}
        disabled={busy}
        onChange={(event) => setReason(event.target.value)}
        className="w-full rounded-md border-2 border-border bg-background p-3 text-sm"
        placeholder="What is preventing progress?"
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4 pb-2 pr-1">
        <Button type="button" variant="outline" disabled={busy} onClick={onCancel}><span className="system-copy">
          Cancel
        </span></Button>
        <Button
          data-retain-disabled-shadow
          type="submit"
          variant="destructive"
          disabled={busy || !reason.trim()}
        >
          {busy ? "Please wait..." : "Confirm block"}
        </Button>
      </div>
    </form>
  );
}
