"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useProjects } from "@/features/projects/project.query";
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/shared/month-picker";
import { Input } from "@/components/ui/input";
import { TaskSelect } from "@/features/tasks/components/task-select";
import { taskStatusLabels, TASK_PAGE_SIZE } from "@/features/tasks/task.constants";
import { taskStatusSchema } from "@/features/tasks/task.schema";
import { useDashboardTasks } from "../dashboard.query";
import { DashboardState } from "./dashboard-state";
import { DashboardTaskPoints, DashboardTaskStatus } from "./dashboard-task-status";
import type { TaskListItem, TaskListParams, TaskStatus } from "@/interface/task.interface";

export function DashboardTaskList({
  title,
  description,
  filters,
  emptyMessage,
  showAssignee = false,
  filterable = false,
  personalFilters = false,
  month,
  onMonthChange,
  initialPageSize = TASK_PAGE_SIZE,
  actionLabel = "Actions",
  onInspect,
  renderContext,
  renderActions,
}: {
  title: string;
  description?: string;
  filters: Omit<TaskListParams, "limit" | "offset">;
  emptyMessage: string;
  showAssignee?: boolean;
  filterable?: boolean;
  personalFilters?: boolean;
  month?: string;
  onMonthChange?: (month: string) => void;
  initialPageSize?: number;
  actionLabel?: string;
  onInspect?: (id: string) => void;
  renderContext?: (task: TaskListItem) => ReactNode;
  renderActions: (task: TaskListItem) => ReactNode;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [project, setProject] = useState("all");
  const [sort, setSort] = useState<"due_asc" | "due_desc" | "recent">(filters.sort ?? "due_asc");
  const projects = useProjects({ limit: 100, offset: 0 }, personalFilters);
  const query = useDashboardTasks({
    ...filters,
    completed_month: month || undefined,
    ...(filterable
      ? {
          q: search.trim() || undefined,
          status: filters.status ?? (status === "all" ? undefined : status),
        }
      : {}),
    ...(personalFilters ? { project_id: project === "all" ? undefined : project, sort } : {}),
    limit: pageSize,
    offset,
  });
  const tasks = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  useEffect(() => {
    if (
      !query.data ||
      query.isPlaceholderData ||
      query.isFetching ||
      offset === 0 ||
      offset < total
    )
      return;
    const timer = setTimeout(
      () => setOffset(Math.max(0, Math.floor((total - 1) / pageSize) * pageSize)),
      0,
    );
    return () => clearTimeout(timer);
  }, [query.data, query.isPlaceholderData, query.isFetching, offset, total, pageSize]);

  return (
    <section className="explorer-panel">
      <div className="explorer-panel-heading">
        <div className="min-w-0">
          <h2 className="text-2xl leading-tight font-black tracking-tight">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        <span className="shrink-0 text-xs font-bold tabular-nums">
          {query.data ? `${total} ${total === 1 ? "task" : "tasks"}` : "Tasks"}
        </span>
      </div>
      {filterable && (
        <div className="@container/task-toolbar dashboard-task-toolbar border-b-2 border-border p-3 sm:p-4">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 @min-[760px]/task-toolbar:flex">
            <div className="relative min-w-0 @min-[760px]/task-toolbar:flex-1">
              <SearchIcon
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                aria-label="Search tasks"
                placeholder="Search tasks..."
                maxLength={255}
                className="h-10 border-border pl-9 text-sm"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setOffset(0);
                }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-10 shrink-0 rounded-[3px] !shadow-none @min-[760px]/task-toolbar:hidden"
              aria-expanded={filtersOpen}
              aria-controls="dashboard-task-filters"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <SlidersHorizontalIcon /> Filters
              {project !== "all" || status !== "all" || sort !== (filters.sort ?? "due_asc")
                ? " •"
                : ""}
            </Button>
            <div
              id="dashboard-task-filters"
              className={`${filtersOpen ? "grid" : "hidden"} col-span-2 min-w-0 grid-cols-2 gap-2 @min-[760px]/task-toolbar:col-span-1 @min-[760px]/task-toolbar:flex @min-[760px]/task-toolbar:shrink-0 @min-[760px]/task-toolbar:items-center`}
            >
              {personalFilters && (
                <>
                  <div className="min-w-0 @min-[760px]/task-toolbar:w-44">
                    <TaskSelect
                      label="Filter by project"
                      value={project}
                      options={[
                        { value: "all", label: "All projects" },
                        ...(projects.data?.items ?? []).map((p) => ({
                          value: p.id,
                          label: p.name,
                        })),
                      ]}
                      onChange={(v) => {
                        setProject(v);
                        setOffset(0);
                      }}
                    />
                  </div>
                  <div className="min-w-0 @min-[760px]/task-toolbar:w-44">
                    <TaskSelect
                      label="Sort tasks"
                      value={sort}
                      options={[
                        { value: "due_asc", label: "Deadline: earliest" },
                        { value: "due_desc", label: "Deadline: latest" },
                        { value: "recent", label: "Latest status change" },
                      ]}
                      onChange={(v) => {
                        if (v === "due_asc" || v === "due_desc" || v === "recent") {
                          setSort(v);
                          setOffset(0);
                        }
                      }}
                    />
                  </div>
                </>
              )}
              {!filters.status && (
                <div className="min-w-0 @min-[760px]/task-toolbar:w-36">
                  <TaskSelect
                    label="Filter by status"
                    value={status}
                    options={[
                      { value: "all", label: "All statuses" },
                      ...taskStatusSchema.options
                        .filter((value) => value !== filters.exclude_status)
                        .map((value) => ({ value, label: taskStatusLabels[value] })),
                    ]}
                    onChange={(value) => {
                      if (value === "all") setStatus(value);
                      else {
                        const parsed = taskStatusSchema.safeParse(value);
                        if (!parsed.success) return;
                        setStatus(parsed.data);
                      }
                      setOffset(0);
                    }}
                  />
                </div>
              )}
              {onMonthChange && (
                <div className="col-start-2 min-w-0 @min-[760px]/task-toolbar:w-36">
                  <MonthPicker
                    value={month ?? ""}
                    onChange={(value) => {
                      onMonthChange(value);
                      setOffset(0);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <DashboardState
        pending={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        <ul className="divide-y-2 divide-border lg:hidden">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="min-w-0 space-y-2 p-3 text-sm even:bg-muted/55 hover:bg-muted/70"
              onClick={() => onInspect?.(task.id)}
            >
              <div className="min-w-0 space-y-1">
                <p className="text-xs text-muted-foreground">{task.code}</p>
                <button
                  type="button"
                  className="block text-left break-words font-bold [overflow-wrap:anywhere] hover:underline"
                  onClick={(event) => {
                    event.stopPropagation();
                    onInspect?.(task.id);
                  }}
                >
                  {task.title}
                </button>
                <p className="break-words text-xs text-muted-foreground">{task.project.name}</p>
                {renderContext?.(task)}
                {showAssignee && (
                  <p className="break-words text-xs">
                    Assignee: {task.assignee.name}
                    {!task.assignee.is_active && " (Inactive)"}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 [&_[data-slot=badge]]:h-auto [&_[data-slot=badge]]:whitespace-normal">
                  <DashboardTaskStatus task={task} />
                </div>
                <DashboardTaskPoints task={task} />
              </div>
              <div
                className="flex flex-wrap items-center justify-end gap-2 border-t border-border/40 pt-2 [&_[data-slot=button]]:h-8 [&_[data-slot=button]]:w-24"
                onClick={(event) => event.stopPropagation()}
              >
                {renderActions(task)}
              </div>
            </li>
          ))}
          {!tasks.length && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              {total
                ? "No tasks on this page. Return to the previous page."
                : filterable && (search || status !== "all" || project !== "all")
                  ? "No tasks match your filters."
                  : emptyMessage}
            </li>
          )}
        </ul>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[570px] text-left text-sm">
            <thead className="border-b-2 border-border bg-muted text-xs uppercase tracking-wide">
              <tr>
                <th scope="col" className="w-[40%] px-4 py-3">
                  Task &amp; project
                </th>
                {showAssignee && (
                  <th scope="col" className="px-4 py-3">
                    Assignee
                  </th>
                )}
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Points
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {actionLabel}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onInspect?.(task.id)}
                >
                  <td className="min-w-48 space-y-1 px-4 py-4">
                    <p className="text-xs text-muted-foreground">{task.code}</p>
                    <button
                      type="button"
                      className="block break-words text-left font-bold hover:underline"
                      onClick={(event) => {
                        event.stopPropagation();
                        onInspect?.(task.id);
                      }}
                    >
                      {task.title}
                    </button>
                    <p className="text-xs text-muted-foreground">{task.project.name}</p>
                    {renderContext?.(task)}
                  </td>
                  {showAssignee && (
                    <td className="px-4 py-4">
                      {task.assignee.name}
                      {!task.assignee.is_active && (
                        <p className="text-xs text-muted-foreground"><span className="system-copy">Inactive</span></p>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <DashboardTaskStatus task={task} />
                  </td>
                  <td className="px-4 py-4">
                    <DashboardTaskPoints task={task} />
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className="flex flex-wrap items-center justify-end gap-2 [&_[data-slot=button]]:h-8 [&_[data-slot=button]]:w-24"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {renderActions(task)}
                    </div>
                  </td>
                </tr>
              ))}
              {!tasks.length && (
                <tr>
                  <td
                    colSpan={showAssignee ? 5 : 4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {total
                      ? "No tasks on this page. Return to the previous page."
                      : filterable && (search || status !== "all" || project !== "all")
                        ? "No tasks match your filters."
                        : emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="explorer-panel-footer">
          <Pagination
            total={total}
            limit={pageSize}
            offset={offset}
            count={tasks.length}
            disabled={query.isFetching}
            onOffsetChange={setOffset}
            onLimitChange={(size) => {
              setPageSize(size);
              setOffset(0);
            }}
          />
        </div>
      </DashboardState>
    </section>
  );
}
