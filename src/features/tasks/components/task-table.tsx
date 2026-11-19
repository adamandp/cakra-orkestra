"use client";

import { ChevronRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Task, TaskStatus } from "@/interface/task.interface";
import { taskStatusLabels, taskTypeLabels, taskCategoryLabels } from "../task.constants";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge
      variant={
        status === "DONE"
          ? "default"
          : status === "BLOCKED"
            ? "destructive"
            : status === "OPEN"
              ? "outline"
              : "secondary"
      }
    >
      {taskStatusLabels[status]}
    </Badge>
  );
}

export function TaskTable({ tasks, onSelect }: { tasks: Task[]; onSelect: (id: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-lg border-2 border-border bg-card shadow-neo-sm">
      <table className="w-full min-w-[740px] text-left text-sm">
        <thead className="border-b-2 border-border bg-muted text-xs text-muted-foreground">
          <tr>
            {["Task", "Project", "Assignee", "Status", "Checklist", "Due date", ""].map(
              (label, index) => (
                <th key={index} scope="col" className="px-3 py-3 font-semibold">
                  {label || <span className="sr-only">Open</span>}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-muted/50">
              <td className="min-w-48 px-3 py-3">
                <p className="font-mono text-xs text-muted-foreground">{task.code}</p>
                <button
                  type="button"
                  className="break-words text-left font-semibold hover:underline focus-visible:underline"
                  onClick={() => onSelect(task.id)}
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
                  <span className="block text-xs text-muted-foreground">Inactive</span>
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
                  onClick={() => onSelect(task.id)}
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
