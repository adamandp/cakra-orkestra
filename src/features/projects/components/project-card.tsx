"use client";

import Link from "next/link";
import { UserIcon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Project, ProjectStatus } from "@/interface/project.interface";
import { projectStatusLabels } from "./project-toolbar";

export type ProjectAction = "edit" | "status" | "members";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={status === "ACTIVE" ? "success" : status === "COMPLETED" ? "outline" : "neutral"}>{projectStatusLabels[status]}</Badge>;
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`} className="block cursor-pointer space-y-3 rounded-lg border-2 border-border bg-card p-4 shadow-neo-sm transition-colors hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground">{project.code}</span>
        <div className="flex items-center gap-2">
          <ProjectStatusBadge status={project.status} />

        </div>
      </div>
      <div className="space-y-1">
        <h2 className="break-words text-lg font-bold">{project.name}</h2>
        <p className="break-words text-sm text-muted-foreground">{project.description || "No description."}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-2"><UserIcon className="size-4" /> {project.owner.name}{!project.owner.is_active && " (inactive)"}</span>
        <span className="flex items-center gap-2"><UsersIcon className="size-4" /> {project.members.length} {project.members.length === 1 ? "member" : "members"}</span>
      </div>
    </Link>
  );
}
