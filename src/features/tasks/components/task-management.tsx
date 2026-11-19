"use client";

import { useState } from "react";
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/providers/auth-provider";
import type { Project } from "@/interface/project.interface";
import type { TaskDetail } from "@/interface/task.interface";
import { useTasks } from "../task.query";
import { getTaskError } from "../task.api";
import { TASK_PAGE_SIZE } from "../task.constants";
import { TaskToolbar, defaultTaskFilters, type TaskFilters } from "./task-toolbar";
import { TaskTable } from "./task-table";
import { TaskFormSheet } from "./task-form-sheet";
import { TaskInspector } from "./task-inspector";
import { TaskAssigneeSheet } from "./task-assignee-sheet";

type SheetState =
  | { action: "create" }
  | { action: "inspect"; id: string }
  | { action: "edit" | "reassign"; task: TaskDetail };

export function TaskManagement({ project }: { project?: Project }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const actorId = user?.id ?? "";
  const [filters, setFilters] = useState<TaskFilters>(defaultTaskFilters);
  const [offset, setOffset] = useState(0);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const query = useTasks({
    q: filters.q.trim() || undefined,
    scope: !isAdmin || filters.scope === "me" ? "me" : undefined,
    project_id: project?.id ?? filters.project?.id,
    assignee_id: isAdmin && filters.scope !== "me" ? filters.assignee?.id : undefined,
    status: filters.status === "all" ? undefined : filters.status,
    type: filters.type === "all" ? undefined : filters.type,
    category: filters.category === "all" ? undefined : filters.category,
    limit: TASK_PAGE_SIZE,
    offset,
  });
  const tasks = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const page = Math.floor(offset / TASK_PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / TASK_PAGE_SIZE));
  const canCreate = Boolean(actorId && (!project || project.status === "ACTIVE"));
  function changeFilters(next: TaskFilters) {
    setFilters(next);
    setOffset(0);
  }
  function inspect(id: string) {
    setSheet({ action: "inspect", id });
  }
  function close() {
    setSheet(null);
  }
  function saved(id: string) {
    setOffset(0);
    inspect(id);
  }
  function deleted() {
    setOffset(0);
    close();
  }
  const createButton = canCreate ? (
    <Button onClick={() => setSheet({ action: "create" })}>
      <PlusIcon /> New Task
    </Button>
  ) : undefined;
  return (
    <div className="space-y-4">
      {project ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Tasks</h2>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "All project tasks" : "Your tasks in this project"}
            </p>
          </div>
          {createButton}
        </div>
      ) : (
        <PageHeader
          title="Manage Tasks"
          description={
            isAdmin ? "Manage tasks across projects." : "Manage and track your own tasks."
          }
          actions={createButton}
        />
      )}
      <TaskToolbar
        filters={filters}
        onChange={changeFilters}
        isAdmin={isAdmin}
        fixedProject={project}
      />
      {query.isError ? (
        <div role="alert" className="space-y-3 rounded-lg border-2 border-border p-6 text-center">
          <p className="text-sm text-destructive">{getTaskError(query.error)}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {query.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : tasks.length ? (
            <TaskTable tasks={tasks} onSelect={inspect} />
          ) : (
            <div className="rounded-lg border-2 border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No tasks found.
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {query.isPending
                ? "Loading tasks..."
                : tasks.length
                  ? `Showing ${offset + 1}–${offset + tasks.length} of ${total} tasks`
                  : `0 tasks on this page (${total} total)`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous tasks"
                disabled={query.isPending || offset === 0}
                onClick={() => setOffset(Math.max(0, offset - TASK_PAGE_SIZE))}
              >
                <ChevronLeftIcon />
              </Button>
              <span className="text-sm tabular-nums">
                {query.isPending ? `Page ${page}` : `${page} / ${pageCount}`}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next tasks"
                disabled={query.isPending || offset + TASK_PAGE_SIZE >= total}
                onClick={() => setOffset(offset + TASK_PAGE_SIZE)}
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </>
      )}
      {canCreate && sheet?.action === "create" && (
        <TaskFormSheet
          fixedProject={project}
          actorId={actorId}
          isAdmin={isAdmin}
          onClose={close}
          onSaved={saved}
        />
      )}
      {sheet?.action === "inspect" && (
        <TaskInspector
          key={sheet.id}
          taskId={sheet.id}
          actorId={actorId}
          isAdmin={isAdmin}
          onClose={close}
          onDeleted={deleted}
          onEdit={(task) => setSheet({ action: "edit", task })}
          onReassign={(task) => {
            if (isAdmin) setSheet({ action: "reassign", task });
          }}
        />
      )}
      {sheet?.action === "edit" && (
        <TaskFormSheet
          key={sheet.task.id}
          task={sheet.task}
          actorId={actorId}
          isAdmin={isAdmin}
          onClose={() => inspect(sheet.task.id)}
          onSaved={saved}
        />
      )}
      {isAdmin && sheet?.action === "reassign" && (
        <TaskAssigneeSheet
          key={sheet.task.id}
          task={sheet.task}
          actorId={actorId}
          onClose={() => inspect(sheet.task.id)}
          onSaved={saved}
        />
      )}
    </div>
  );
}
