"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/auth-provider";
import { getProjectError } from "../project.api";
import { useProjects } from "../project.query";
import { ProjectCard } from "./project-card";
import { ProjectToolbar, defaultProjectFilters, type ProjectFilters } from "./project-toolbar";
import { ProjectFormSheet } from "./project-form-sheet";

const PAGE_SIZE = 10;

type ActiveSheet = { action: "create" };

export function ProjectManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [filters, setFilters] = useState<ProjectFilters>(defaultProjectFilters);
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [sheet, setSheet] = useState<ActiveSheet | null>(null);
  const query = useProjects({
    q: filters.q.trim() || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    limit: pageSize,
    offset,
  });
  const projects = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  function handleFilterChange(next: ProjectFilters) {
    setFilters(next);
    setOffset(0);
  }

  function closeSheet() { setSheet(null); }
  function handleSaved() { setOffset(0); }

  return (
    <div className="space-y-6">
      <PageHeader title="Projects Management" description={isAdmin ? "Manage projects and team members." : "View your assigned and owned projects."} actions={isAdmin ? <Button onClick={() => setSheet({ action: "create" })}><PlusIcon /> New Project</Button> : undefined} />

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
            ) : projects.map((project) => <ProjectCard key={project.id} project={project} />)}
          </div>
          <Pagination total={total} limit={pageSize} offset={offset} count={projects.length} disabled={query.isFetching} onOffsetChange={setOffset} onLimitChange={(size) => { setPageSize(size); setOffset(0); }} />
        </>
      )}
      {isAdmin && sheet?.action === "create" && <ProjectFormSheet onClose={closeSheet} onSaved={handleSaved} />}
    </div>
  );
}
