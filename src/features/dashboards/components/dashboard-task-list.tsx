"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardTasks } from "../dashboard.query";
import { DashboardState } from "./dashboard-state";
import { DashboardTaskPoints, DashboardTaskStatus } from "./dashboard-task-status";
import type { TaskListItem, TaskListParams } from "@/interface/task.interface";
import { TASK_PAGE_SIZE } from "@/features/tasks/task.constants";

export function DashboardTaskList({
  filters,
  emptyMessage,
  showAssignee = false,
  renderContext,
  renderActions,
}: {
  filters: Omit<TaskListParams, "limit" | "offset">;
  emptyMessage: string;
  showAssignee?: boolean;
  renderContext?: (task: TaskListItem) => ReactNode;
  renderActions: (task: TaskListItem) => ReactNode;
}) {
  const [offset, setOffset] = useState(0);
  const query = useDashboardTasks({ ...filters, limit: TASK_PAGE_SIZE, offset });
  const tasks = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  return (
    <DashboardState
      pending={query.isPending}
      error={query.error}
      onRetry={() => void query.refetch()}
    >
      {tasks.length ? (
        <div className="overflow-x-auto rounded-lg border-2 border-border bg-card shadow-neo-sm">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b-2 border-border bg-muted text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Task & project
                </th>
                {showAssignee && (
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Assignee
                  </th>
                )}
                <th scope="col" className="px-3 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Points
                </th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-muted/50">
                  <td className="min-w-48 px-3 py-3">
                    <p className="font-mono text-xs text-muted-foreground">{task.code}</p>
                    <p className="break-words font-semibold">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.project.name}</p>
                    {renderContext?.(task)}
                  </td>
                  {showAssignee && (
                    <td className="px-3 py-3">
                      {task.assignee.name}
                      {!task.assignee.is_active && (
                        <p className="text-xs text-muted-foreground">Inactive</p>
                      )}
                    </td>
                  )}
                  <td className="px-3 py-3">
                    <DashboardTaskStatus task={task} />
                  </td>
                  <td className="px-3 py-3">
                    <DashboardTaskPoints task={task} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap justify-end gap-2">{renderActions(task)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg border-2 border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {total ? "No tasks on this page. Return to the previous page." : emptyMessage}
        </p>
      )}
      {(total > TASK_PAGE_SIZE || offset > 0) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {tasks.length
              ? `${offset + 1}–${offset + tasks.length} of ${total}`
              : `0 on this page (${total} total)`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              disabled={offset === 0 || query.isFetching}
              onClick={() => setOffset((value) => Math.max(0, value - TASK_PAGE_SIZE))}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next page"
              disabled={query.isFetching || offset + TASK_PAGE_SIZE >= total}
              onClick={() => setOffset((value) => value + TASK_PAGE_SIZE)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}
    </DashboardState>
  );
}
