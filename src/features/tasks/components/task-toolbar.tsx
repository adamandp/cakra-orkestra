"use client";

import { useState } from "react";
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";
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
  isAdmin,
  fixedProject,
}: {
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1 sm:max-w-sm">
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
        <div className="min-w-36">
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
        <Button variant="outline" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          <SlidersHorizontalIcon /> Filters
        </Button>
        {dirty && (
          <Button variant="ghost" onClick={() => onChange(defaultTaskFilters)}>
            Reset
          </Button>
        )}
      </div>
      {expanded && (
        <div className="grid gap-3 rounded-lg border-2 border-border p-3 sm:grid-cols-2">
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
          {isAdmin && (
            <TaskSelect
              label="Task scope"
              value={filters.scope}
              options={[
                { value: "all", label: "All tasks" },
                { value: "me", label: "My tasks" },
              ]}
              onChange={(value) =>
                onChange({ ...filters, scope: value === "me" ? "me" : "all", assignee: null })
              }
            />
          )}
          {!fixedProject && (
            <TaskProjectPicker
              selected={filters.project}
              onChange={(project) => onChange({ ...filters, project })}
            />
          )}
          {isAdmin && (
            <ProjectUserPicker
              label="Filter assignee"
              activeOnly={false}
              selected={filters.assignee ? [filters.assignee] : []}
              disabled={filters.scope === "me"}
              onChange={(users) => onChange({ ...filters, assignee: users[0] ?? null })}
            />
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
