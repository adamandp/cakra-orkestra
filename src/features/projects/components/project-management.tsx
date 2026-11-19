"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/providers/auth-provider";
import type { Project } from "@/interface/project.interface";
import { getProjectError } from "../project.api";
import { useProjects } from "../project.query";
import { ProjectCard, type ProjectAction } from "./project-card";
import { ProjectToolbar, defaultProjectFilters, type ProjectFilters } from "./project-toolbar";
import { ProjectFormSheet } from "./project-form-sheet";
import { ProjectStatusSheet } from "./project-status-sheet";
import { ProjectMembersSheet } from "./project-members-sheet";

const PAGE_SIZE = 10;

type ActiveSheet = { action: "create" } | { action: ProjectAction; project: Project };

export function ProjectManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [filters, setFilters] = useState<ProjectFilters>(defaultProjectFilters);
  const [offset, setOffset] = useState(0);
  const [sheet, setSheet] = useState<ActiveSheet | null>(null);
  const query = useProjects({
    q: filters.q.trim() || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    limit: PAGE_SIZE,
    offset,
  });
  const projects = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleFilterChange(next: ProjectFilters) {
    setFilters(next);
    setOffset(0);
  }

  function handleAction(action: ProjectAction, project: Project) {
    if (isAdmin) setSheet({ action, project });
  }

  function closeSheet() { setSheet(null); }
  function handleSaved() { setOffset(0); }

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description={isAdmin ? "Manage projects and team members." : "View your assigned and owned projects."} actions={isAdmin ? <Button onClick={() => setSheet({ action: "create" })}><PlusIcon /> New Project</Button> : undefined} />
      <ProjectToolbar filters={filters} onChange={handleFilterChange} />
      {query.isError ? (
        <div role="alert" className="space-y-3 rounded-lg border-2 border-border p-6 text-center">
          <p className="text-sm text-destructive">{getProjectError(query.error)}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>Retry</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {query.isPending ? Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-44 rounded-lg" />) : !projects.length ? (
              <div className="col-span-full rounded-lg border-2 border-border bg-card p-8 text-center text-sm text-muted-foreground">No projects found.</div>
            ) : projects.map((project) => <ProjectCard key={project.id} project={project} isAdmin={isAdmin} onAction={handleAction} />)}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">{query.isPending ? "Loading projects..." : projects.length ? `Showing ${offset + 1}–${offset + projects.length} of ${total} projects` : `0 projects on this page (${total} total)`}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={query.isPending || offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}><ChevronLeftIcon /></Button>
              <span className="text-sm tabular-nums">{query.isPending ? `Page ${page}` : `${page} / ${pageCount}`}</span>
              <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={query.isPending || offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}><ChevronRightIcon /></Button>
            </div>
          </div>
        </>
      )}
      {isAdmin && sheet?.action === "create" && <ProjectFormSheet onClose={closeSheet} onSaved={handleSaved} />}
      {isAdmin && sheet?.action === "edit" && <ProjectFormSheet key={sheet.project.id} projectId={sheet.project.id} onClose={closeSheet} onSaved={handleSaved} />}
      {isAdmin && sheet?.action === "status" && <ProjectStatusSheet key={sheet.project.id} project={sheet.project} onClose={closeSheet} onSaved={handleSaved} />}
      {isAdmin && sheet?.action === "members" && <ProjectMembersSheet key={sheet.project.id} project={sheet.project} onClose={closeSheet} />}
    </div>
  );
}
