"use client";

import { useState } from "react";
import { ClockIcon, RotateCcwIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TaskDetail } from "@/interface/task.interface";
import { taskStatusLabels } from "../task.constants";

const PREVIEW_COUNT = 3;

function HistorySection({ task, revision = false }: { task: TaskDetail; revision?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const histories = [...task.status_histories].reverse().filter(
    (history) => !revision || (history.previous_status === "PENDING" && history.current_status === "PROGRESS"),
  );
  const Icon = revision ? RotateCcwIcon : ClockIcon;
  if (revision && !histories.length) return null;
  return (
    <section className="border-2 border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b-2 border-border bg-muted/40 p-3">
        <h3 className="font-bold">{revision ? "Revision history" : "Status history"}</h3>
        <span className="text-xs tabular-nums text-muted-foreground">{histories.length} {histories.length === 1 ? "event" : "events"}</span>
      </div>
      <div className="space-y-3 p-3 pb-4">
        {!histories.length && <p className="text-sm text-muted-foreground"><span className="system-copy">No status history.</span></p>}
        <ol className={expanded ? "max-h-80 space-y-3 overflow-y-auto overscroll-contain pr-2" : "space-y-3"}>
          {(expanded ? histories : histories.slice(0, PREVIEW_COUNT)).map((history) => (
            <li key={history.id} className="flex gap-3 border-b border-border/20 pb-3 last:border-b-0 last:pb-0">
              <Icon className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">
                  {revision ? "Revision requested" : history.previous_status
                    ? `${taskStatusLabels[history.previous_status]} → ${taskStatusLabels[history.current_status]}`
                    : "Task created"}
                </p>
                <p className="text-xs text-muted-foreground">
                  <time dateTime={history.created_at}>{new Date(history.created_at).toLocaleString()}</time>
                </p>
                <p className="break-all text-xs text-muted-foreground">
                  By {history.changed_by === task.assignee_id ? task.assignee.name : history.changed_by}
                </p>
                {history.reason && <p className="mt-1 whitespace-pre-wrap break-words">{history.reason}</p>}
              </div>
            </li>
          ))}
        </ol>
        {histories.length > PREVIEW_COUNT && (
          <Button type="button" variant="ghost" size="sm" className="w-full" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
            {expanded ? "Show less" : `Show all ${histories.length} events`}
            {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Button>
        )}
      </div>
    </section>
  );
}

export function TaskStatusHistoryPanel({ task }: { task: TaskDetail }) {
  return (
    <>
      <HistorySection key={`${task.id}:revision`} task={task} revision />
      <HistorySection key={`${task.id}:status`} task={task} />
    </>
  );
}
