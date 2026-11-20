"use client";

import type { ReactNode } from "react";

import { useState } from "react";
import { SearchIcon, SlidersHorizontalIcon, ChevronDownIcon } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Project, ProjectUser } from "@/interface/project.interface";
import type { TaskStatus, TaskType, TaskCategory } from "@/interface/task.interface";
import { ProjectUserPicker } from "@/features/projects/components/project-user-picker";
import { taskStatusSchema, taskTypeSchema, taskCategorySchema } from "../task.schema";
import { taskStatusLabels, taskTypeLabels, taskCategoryLabels } from "../task.constants";
import { TaskSelect } from "./task-select";
import { TaskProjectPicker } from "./task-project-picker";

export interface TaskFilters {
  q: string;
  project: Project | null;
  assignee: ProjectUser | null;
  status: TaskStatus | "all";
  type: TaskType | "all";
  category: TaskCategory | "all";
  scope: "all" | "me";
}
export const defaultTaskFilters: TaskFilters = {
  q: "",
  project: null,
  assignee: null,
  status: "all",
  type: "all",
  category: "all",
  scope: "all",
};

export function TaskToolbar({
  filters,
  onChange,
  actions,
  isAdmin,
  fixedProject,
}: {
  actions?: ReactNode;
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  isAdmin: boolean;
  fixedProject?: Project;
}) {
  const [expanded, setExpanded] = useState(false);
  const dirty = Boolean(
    filters.q ||
    filters.project ||
    filters.assignee ||
    filters.scope !== "all" ||
    filters.status !== "all" ||
    filters.type !== "all" ||
    filters.category !== "all",
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative min-w-0 basis-full sm:min-w-40 sm:basis-0 sm:flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search tasks"
            placeholder="Search tasks..."
            maxLength={255}
            value={filters.q}
            className="pl-9"
            onChange={(event) => onChange({ ...filters, q: event.target.value })}
          />
        </div>
        <Button variant="outline" pressAnimation={false} className="h-10 gap-1.5 px-2.5 font-normal !shadow-none" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          <SlidersHorizontalIcon /> Filters
        </Button>
        {dirty && (
          <Button variant="ghost" onClick={() => onChange(defaultTaskFilters)}>
            Reset
          </Button>
        )}
        {actions && (
          <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {expanded && (
        <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-2 lg:grid-cols-4 rounded-lg border-2 border-border p-3 sm:gap-3">
          <TaskSelect
            label="Task type"
            value={filters.type}
            options={[
              { value: "all", label: "All types" },
              ...taskTypeSchema.options.map((value) => ({ value, label: taskTypeLabels[value] })),
            ]}
            onChange={(value) =>
              onChange({ ...filters, type: value === "all" ? "all" : taskTypeSchema.parse(value) })
            }
          />
          <TaskSelect
            label="Task category"
            value={filters.category}
            options={[
              { value: "all", label: "All categories" },
              ...taskCategorySchema.options.map((value) => ({
                value,
                label: taskCategoryLabels[value],
              })),
            ]}
            onChange={(value) =>
              onChange({
                ...filters,
                category: value === "all" ? "all" : taskCategorySchema.parse(value),
              })
            }
          />
        <div className="min-w-0">
          <TaskSelect
            label="Status"
            value={filters.status}
            options={[
              { value: "all", label: "All statuses" },
              ...taskStatusSchema.options.map((value) => ({
                value,
                label: taskStatusLabels[value],
              })),
            ]}
            onChange={(value) => {
              const status = taskStatusSchema.safeParse(value);
              if (value === "all" || status.success)
                onChange({
                  ...filters,
                  status: value === "all" ? "all" : taskStatusSchema.parse(value),
                });
            }}
          />
        </div>
          {!fixedProject && (
            <Popover.Root>
              <Popover.Trigger render={<Button type="button" variant="outline" pressAnimation={false} className="h-10 w-full min-w-0 justify-between font-normal !shadow-none" />}>
                <span className="truncate">{filters.project?.name ?? "All projects"}</span><ChevronDownIcon />
              </Popover.Trigger>
              <Popover.Portal><Popover.Positioner align="start" sideOffset={6} className="z-50"><Popover.Popup data-slot="popover-content" className="w-80 max-w-[var(--available-width)] max-h-[var(--available-height)] overflow-y-auto bg-popover">
                <TaskProjectPicker selected={filters.project} onChange={(project) => onChange({ ...filters, project })} />
              </Popover.Popup></Popover.Positioner></Popover.Portal>
            </Popover.Root>
          )}
          {isAdmin && (
            <Popover.Root>
              <Popover.Trigger render={<Button type="button" variant="outline" pressAnimation={false} className="h-10 w-full min-w-0 justify-between font-normal !shadow-none" />}>
                <span className="truncate">{filters.assignee?.name ?? "All assignees"}</span><ChevronDownIcon />
              </Popover.Trigger>
              <Popover.Portal><Popover.Positioner align="start" sideOffset={6} className="z-50"><Popover.Popup data-slot="popover-content" className="w-80 max-w-[var(--available-width)] max-h-[var(--available-height)] overflow-y-auto bg-popover">
                <ProjectUserPicker label="Filter assignee" activeOnly={false} selected={filters.assignee ? [filters.assignee] : []} onChange={(users) => onChange({ ...filters, scope: "all", assignee: users[0] ?? null })} />
              </Popover.Popup></Popover.Positioner></Popover.Portal>
            </Popover.Root>
          )}
        </div>
      )}
      {(filters.project ||
        filters.assignee ||
        filters.scope === "me" ||
        filters.type !== "all" ||
        filters.category !== "all") && (
        <p className="text-xs text-muted-foreground">
          {[
            filters.project?.name,
            filters.assignee?.name,
            filters.scope === "me" ? "My tasks" : null,
            filters.type === "all" ? null : taskTypeLabels[filters.type],
            filters.category === "all" ? null : taskCategoryLabels[filters.category],
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}
