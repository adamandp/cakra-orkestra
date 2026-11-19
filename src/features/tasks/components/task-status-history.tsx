"use client";

import { ClockIcon } from "lucide-react";
import type { TaskDetail } from "@/interface/task.interface";
import { taskStatusLabels } from "../task.constants";

export function TaskStatusHistoryPanel({ task }: { task: TaskDetail }) {
  // Stored in chronological insertion order; reverse a copy for newest-first display.
  const histories = [...task.status_histories].reverse();
  return (
    <section className="space-y-3 border-t pt-4">
      <h3 className="font-bold">Status history</h3>
      {!histories.length && <p className="text-sm text-muted-foreground">No status history.</p>}
      <ol className="space-y-3">
        {histories.map((history) => (
          <li key={history.id} className="flex gap-3">
            <ClockIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 border-b pb-3 text-sm last:border-b-0">
              <p className="font-semibold">
                {history.previous_status
                  ? `${taskStatusLabels[history.previous_status]} → ${taskStatusLabels[history.current_status]}`
                  : "Task created"}
              </p>
              <p className="text-xs text-muted-foreground">
                <time dateTime={history.created_at}>
                  {new Date(history.created_at).toLocaleString()}
                </time>
              </p>
              <p className="break-all text-xs text-muted-foreground">
                By{" "}
                {history.changed_by === task.assignee_id ? task.assignee.name : history.changed_by}
              </p>
              {history.reason && (
                <p className="mt-1 whitespace-pre-wrap break-words">{history.reason}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
