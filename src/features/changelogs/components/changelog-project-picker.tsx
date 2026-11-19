"use client";

import { useState } from "react";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjects } from "@/features/projects/project.query";
import { getProjectError } from "@/features/projects/project.api";
import type { Project } from "@/interface/project.interface";

const PAGE_SIZE = 5;

export function ChangelogProjectPicker({
  selected,
  onChange,
  disabled = false,
  optional = false,
}: {
  selected: Project | null;
  onChange: (project: Project | null) => void;
  disabled?: boolean;
  optional?: boolean;
}) {
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const query = useProjects({ q: q.trim() || undefined, limit: PAGE_SIZE, offset });
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  return (
    <div
      role="group"
      aria-label="Select project"
      className="space-y-2 rounded-lg border-2 border-border p-3"
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 break-words">
          {selected
            ? `${selected.code} — ${selected.name}`
            : optional
              ? "All projects"
              : "No project selected"}
        </span>
        {selected && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            Clear
          </Button>
        )}
      </div>
      <Input
        aria-label="Search projects"
        placeholder="Search projects..."
        maxLength={255}
        value={q}
        disabled={disabled}
        onChange={(event) => {
          setQ(event.target.value);
          setOffset(0);
        }}
      />
      {query.isError ? (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{getProjectError(query.error)}</p>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => void query.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : query.isPending ? (
        <p className="text-sm text-muted-foreground">Loading projects...</p>
      ) : (
        <div className="space-y-1">
          {!items.length && <p className="text-sm text-muted-foreground">No projects found.</p>}
          {items.map((project) => (
            <Button
              key={project.id}
              type="button"
              variant={selected?.id === project.id ? "secondary" : "ghost"}
              aria-pressed={selected?.id === project.id}
              disabled={disabled}
              className="h-auto w-full justify-start whitespace-normal text-left"
              onClick={() => onChange(project)}
            >
              <span className="min-w-0 flex-1 break-words">
                {project.code} — {project.name}
              </span>
              {selected?.id === project.id && <CheckIcon />}
            </Button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{total} projects</span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Previous projects"
            disabled={disabled || query.isPending || offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Next projects"
            disabled={disabled || query.isPending || offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
