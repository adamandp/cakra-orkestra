"use client";

import type { ReactNode } from "react";

import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Project } from "@/interface/project.interface";
import { ChangelogProjectPicker } from "./changelog-project-picker";

export interface ChangelogFilters {
  q: string;
  project: Project | null;
}

export const defaultChangelogFilters: ChangelogFilters = { q: "", project: null };

export function ChangelogToolbar({
  filters,
  onChange,
  actions,
}: {
  actions?: ReactNode;
  filters: ChangelogFilters;
  onChange: (filters: ChangelogFilters) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative min-w-0 basis-full sm:min-w-40 sm:basis-0 sm:flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search releases"
            placeholder="Search releases..."
            maxLength={255}
            className="pl-9"
            value={filters.q}
            onChange={(event) => onChange({ ...filters, q: event.target.value })}
          />
        </div>
        <ChangelogProjectPicker optional compact selected={filters.project} onChange={(project) => onChange({ ...filters, project })} />
        {(filters.q || filters.project) && (
          <Button variant="ghost" onClick={() => onChange(defaultChangelogFilters)}>
            Reset
          </Button>
        )}
        {actions && (
          <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
