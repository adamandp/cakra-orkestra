"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, PencilIcon, UsersIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/providers/auth-provider";
import type { ProjectUser } from "@/interface/project.interface";
import { getProjectError } from "../project.api";
import { useProject } from "../project.query";
import { ProjectStatusBadge, type ProjectAction } from "./project-card";
import { ProjectFormSheet } from "./project-form-sheet";
import { ProjectStatusSheet } from "./project-status-sheet";
import { ProjectMembersSheet } from "./project-members-sheet";
import { TaskManagement } from "@/features/tasks/components/task-management";

function ProjectPerson({ user }: { user: ProjectUser }) {
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        {user.avatar_url && <AvatarImage src={user.avatar_url} alt="" />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 break-words text-sm">
        <p className="font-medium">
          {user.name}
          {!user.is_active && " (inactive)"}
        </p>
        <p className="text-xs text-muted-foreground">@{user.username}</p>
      </div>
    </div>
  );
}

export function ProjectDetail({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const query = useProject(projectId);
  const [action, setAction] = useState<ProjectAction | null>(null);
  const project = query.data;
  function closeSheet() {
    setAction(null);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
      >
        <ArrowLeftIcon className="size-4" /> Back to projects
      </Link>
      {query.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : query.isError || !project ? (
        <div role="alert" className="space-y-3 rounded-lg border-2 border-border p-6 text-center">
          <p className="text-sm text-destructive">{getProjectError(query.error)}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <PageHeader
            title={project.name}
            description={project.code}
            actions={
              isAdmin ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setAction("status")}>
                    Change status
                  </Button>
                  <Button onClick={() => setAction("edit")}>
                    <PencilIcon /> Edit project
                  </Button>
                </div>
              ) : undefined
            }
          />
          <section className="space-y-4 rounded-lg border-2 border-border bg-card p-5 shadow-neo-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">Overview</h2>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
              {project.description || "No description."}
            </p>
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs font-semibold text-muted-foreground">Project owner</p>
              <ProjectPerson user={project.owner} />
            </div>
            <dl className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Created at</dt>
                <dd>{new Date(project.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Updated at</dt>
                <dd>{new Date(project.updated_at).toLocaleString()}</dd>
              </div>
            </dl>
          </section>
          <section className="space-y-4 rounded-lg border-2 border-border bg-card p-5 shadow-neo-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">Members ({project.members.length})</h2>
              {isAdmin && (
                <Button variant="outline" onClick={() => setAction("members")}>
                  <UsersIcon /> Manage members
                </Button>
              )}
            </div>
            {!project.members.length ? (
              <p className="text-sm text-muted-foreground">No project members yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {project.members.map((member) => (
                  <div key={member.id} className="rounded-md border p-3">
                    <ProjectPerson user={member} />
                  </div>
                ))}
              </div>
            )}
          </section>
          <TaskManagement key={project.id} project={project} />
          {isAdmin && action === "edit" && (
            <ProjectFormSheet projectId={project.id} onClose={closeSheet} onSaved={closeSheet} />
          )}
          {isAdmin && action === "status" && (
            <ProjectStatusSheet project={project} onClose={closeSheet} onSaved={closeSheet} />
          )}
          {isAdmin && action === "members" && (
            <ProjectMembersSheet project={project} onClose={closeSheet} />
          )}
        </>
      )}
    </div>
  );
}
