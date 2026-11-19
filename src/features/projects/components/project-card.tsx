"use client";

import Link from "next/link";
import { EllipsisIcon, PencilIcon, UserIcon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Project, ProjectStatus } from "@/interface/project.interface";
import { projectStatusLabels } from "./project-toolbar";

export type ProjectAction = "edit" | "status" | "members";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={status === "ACTIVE" ? "default" : status === "COMPLETED" ? "outline" : "secondary"}>{projectStatusLabels[status]}</Badge>;
}

export function ProjectCard({ project, isAdmin, onAction }: {
  project: Project;
  isAdmin: boolean;
  onAction: (action: ProjectAction, project: Project) => void;
}) {
  return (
    <article className="space-y-3 rounded-lg border-2 border-border bg-card p-4 shadow-neo-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground">{project.code}</span>
        <div className="flex items-center gap-2">
          <ProjectStatusBadge status={project.status} />
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${project.name}`} />}><EllipsisIcon /></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuItem onClick={() => onAction("edit", project)}><PencilIcon /> Edit project</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("status", project)}>Change status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("members", project)}><UsersIcon /> Manage members</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <Link href={`/projects/${project.id}`} className="break-words text-lg font-bold hover:underline focus-visible:underline">{project.name}</Link>
        <p className="break-words text-sm text-muted-foreground">{project.description || "No description."}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-2"><UserIcon className="size-4" /> {project.owner.name}{!project.owner.is_active && " (inactive)"}</span>
        <span className="flex items-center gap-2"><UsersIcon className="size-4" /> {project.members.length} {project.members.length === 1 ? "member" : "members"}</span>
      </div>
    </article>
  );
}
