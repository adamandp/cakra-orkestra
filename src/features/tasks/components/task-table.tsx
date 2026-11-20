"use client";

import { ChevronRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Task, TaskStatus } from "@/interface/task.interface";
import { taskStatusLabels, taskTypeLabels, taskCategoryLabels } from "../task.constants";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge
      className={`h-6 w-28 justify-center text-[11px] ${status === "PROGRESS" ? "bg-[#e0effc] text-[#10121a] dark:bg-blue" : ""}`}
      variant={
        status === "DONE"
          ? "success"
          : status === "BLOCKED"
            ? "destructive"
            : status === "OPEN"
              ? "neutral"
              : status === "PROGRESS"
                ? "default"
                : "secondary"
      }
    >
      {status === "PENDING" ? "Awaiting approval" : taskStatusLabels[status]}
    </Badge>
  );
}

export function TaskTable({ tasks, onSelect }: { tasks: Task[]; onSelect: (id: string) => void }) {
  return (
    <div className="overflow-x-auto bg-card">
      <table className="w-full min-w-[740px] text-left text-sm">
        <thead className="border-b-2 border-border bg-muted text-xs text-muted-foreground">
          <tr>
            {["Task", "Project", "Assignee", "Status", "Checklist", "Due date", ""].map(
              (label, index) => (
                <th key={index} scope="col" className="px-3 py-3 font-semibold">
                  {label || <span className="sr-only"><span className="system-copy">Open</span></span>}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.map((task) => (
            <tr
              key={task.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => onSelect(task.id)}
            >
              <td className="min-w-48 px-3 py-3">
                <p className="font-mono text-xs text-muted-foreground">{task.code}</p>
                <button
                  type="button"
                  className="break-words text-left font-semibold hover:underline focus-visible:underline"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(task.id);
                  }}
                >
                  {task.title}
                </button>
                <p className="text-xs text-muted-foreground">
                  {taskTypeLabels[task.task_type]} · {taskCategoryLabels[task.task_category]}
                </p>
              </td>
              <td className="px-3 py-3">{task.project.name}</td>
              <td className="px-3 py-3">
                {task.assignee.name}
                {!task.assignee.is_active && (
                  <span className="block text-xs text-muted-foreground"><span className="system-copy">Inactive</span></span>
                )}
              </td>
              <td className="px-3 py-3">
                <TaskStatusBadge status={task.task_status} />
              </td>
              <td className="px-3 py-3 tabular-nums">
                {task.checklist_completed}/{task.checklist_total}
              </td>
              <td className="px-3 py-3 whitespace-nowrap">{task.due_date ?? "—"}</td>
              <td className="px-3 py-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Open ${task.code}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(task.id);
                  }}
                >
                  <ChevronRightIcon />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
