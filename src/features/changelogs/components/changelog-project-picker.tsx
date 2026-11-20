"use client";

import { Pagination } from "@/components/shared/pagination";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon, SearchIcon, FolderIcon } from "lucide-react";
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
  compact = false,
}: {
  selected: Project | null;
  onChange: (project: Project | null) => void;
  disabled?: boolean;
  optional?: boolean;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!expanded) return;
    function handleOutside(event: PointerEvent) {
      if (event.target instanceof Node && !pickerRef.current?.contains(event.target)) {
        setExpanded(false);
      }
    }
    document.addEventListener("pointerdown", handleOutside, true);
    return () => document.removeEventListener("pointerdown", handleOutside, true);
  }, [expanded]);
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const query = useProjects({ q: q.trim() || undefined, limit: PAGE_SIZE, offset });
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  return (
    <div
      ref={pickerRef}
      role="group"
      aria-label="Select project"
      className={compact ? "relative min-w-40 max-w-full" : "space-y-2 rounded-lg border-2 border-border p-3"}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" disabled={disabled} aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className={compact ? "flex h-10 w-full min-w-0 cursor-pointer items-center gap-2 border-2 border-border bg-background px-3 text-left text-sm" : "flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left text-sm"}>
          <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium" title={selected?.name}>{selected?.name ?? (optional ? "All projects" : "Select a project")}</span>
            {selected && !compact && <span className="block truncate text-xs text-muted-foreground">{selected.code}</span>}
          </span>
          <ChevronDownIcon className={`size-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        {selected && !compact && <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onChange(null)}>Clear</Button>}
      </div>
      {expanded && <div className={compact ? "absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-32px)] space-y-2 border-2 border-border bg-popover p-3 shadow-neo-card" : "space-y-2 border-t border-border pt-3"}>
      {compact && optional && <Button type="button" variant="ghost" pressAnimation={false} className="w-full justify-start" onClick={() => { onChange(null); setExpanded(false); }}>All projects {!selected && <CheckIcon />}</Button>}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9"
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
      </div>
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
        <p className="text-sm text-muted-foreground"><span className="system-copy">Loading projects...</span></p>
      ) : (
        <div className="max-h-60 space-y-1 overflow-y-auto p-0.5">
          {!items.length && <p className="text-sm text-muted-foreground"><span className="system-copy">No projects found.</span></p>}
          {items.map((project) => (
            <Button
              key={project.id}
              type="button"
              variant="ghost"
              aria-pressed={selected?.id === project.id}
              disabled={disabled}
              className={`h-auto min-h-11 w-full justify-start gap-2 px-2 py-2 text-left ${selected?.id === project.id ? "bg-muted" : ""}`}
              onClick={() => { onChange(project); setExpanded(false); }}
            >
              <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1"><span className="block truncate font-medium" title={project.name}>{project.name}</span><span className="block truncate text-xs font-normal text-muted-foreground">{project.code}</span></span>
              {selected?.id === project.id && <CheckIcon />}
            </Button>
          ))}
        </div>
      )}
      <Pagination compact total={total} limit={PAGE_SIZE} offset={offset} count={items.length} disabled={disabled || query.isFetching} onOffsetChange={setOffset} />
      </div>}
    </div>
  );
}
