"use client";

import type { ReactNode } from "react";

import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectStatus } from "@/interface/project.interface";
import { projectStatusSchema } from "../project.schema";

export interface ProjectFilters {
  q: string;
  status: ProjectStatus | "all";
}

export const defaultProjectFilters: ProjectFilters = { q: "", status: "all" };
export const projectStatusLabels: Record<ProjectStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export function ProjectToolbar({
  filters,
  onChange,
  actions,
}: {
  actions?: ReactNode;
  filters: ProjectFilters;
  onChange: (filters: ProjectFilters) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="relative min-w-0 basis-full sm:min-w-40 sm:basis-0 sm:flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search projects"
          placeholder="Search projects..."
          value={filters.q}
          maxLength={255}
          className="pl-9"
          onChange={(event) => onChange({ ...filters, q: event.target.value })}
        />
      </div>
      <Select
        value={filters.status}
        onValueChange={(value) => {
          if (value === "all") onChange({ ...filters, status: value });
          else {
            const parsed = projectStatusSchema.safeParse(value);
            if (parsed.success) onChange({ ...filters, status: parsed.data });
          }
        }}
      >
        <SelectTrigger
          aria-label="Filter by status"
          className="min-w-0 flex-1 border-2 border-border sm:flex-none sm:min-w-36"
        >
          <SelectValue>
            {filters.status === "all" ? "All statuses" : projectStatusLabels[filters.status]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {projectStatusSchema.options.map((status) => (
            <SelectItem key={status} value={status}>
              {projectStatusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(filters.q || filters.status !== "all") && (
        <Button variant="ghost" onClick={() => onChange(defaultProjectFilters)}>
          Reset
        </Button>
      )}
      {actions && (
        <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
