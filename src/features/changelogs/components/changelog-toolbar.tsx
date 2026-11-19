"use client";

import { useState } from "react";
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";
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
}: {
  filters: ChangelogFilters;
  onChange: (filters: ChangelogFilters) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1 sm:max-w-sm">
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
        <Button variant="outline" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          <SlidersHorizontalIcon /> {filters.project?.name ?? "All projects"}
        </Button>
        {(filters.q || filters.project) && (
          <Button variant="ghost" onClick={() => onChange(defaultChangelogFilters)}>
            Reset
          </Button>
        )}
      </div>
      {expanded && (
        <div className="max-w-md">
          <ChangelogProjectPicker
            optional
            selected={filters.project}
            onChange={(project) => {
              onChange({ ...filters, project });
              setExpanded(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
