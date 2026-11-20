"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSheetLifecycle, Sheet, SheetContent, SheetFooter, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project, ProjectUser } from "@/interface/project.interface";
import { getProjectError } from "../project.api";
import { useCreateProject, useUpdateProject } from "../project.mutation";
import { useProject } from "../project.query";
import { projectFormSchema, type ProjectFormValues } from "../project.schema";
import { ProjectUserPicker } from "./project-user-picker";

export function ProjectFormSheet({ projectId, onClose, onSaved }: {
  projectId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const detail = useProject(projectId ?? "");
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const editing = Boolean(projectId);
  const mutation = editing ? updateMutation : createMutation;
  const lifecycle = useSheetLifecycle(onClose);
  const pending = mutation.isPending;

  async function save(values: ProjectFormValues) {
    const fields = { name: values.name, description: values.description || null, owner_id: values.owner_id };
    try {
      if (projectId) {
        await updateMutation.mutateAsync({ id: projectId, input: fields });
        toast.success("Project updated");
      } else {
        await createMutation.mutateAsync({ ...fields, member_ids: values.member_ids });
        toast.success("Project created");
      }
      lifecycle.closeThen(() => { onSaved(); onClose(); });
    } catch {
      // Preserve form state and display the API error.
    }
  }

  return (
    <Sheet open={lifecycle.open} onOpenChangeComplete={lifecycle.onOpenChangeComplete} onOpenChange={(open) => { if (!open && !pending) lifecycle.close(); }}>
      <SheetContent className="w-full border-l-2 border-border sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit project" : "New project"}</SheetTitle>
          <SheetDescription>{editing ? "Update project information." : "Create a project with an owner and optional members."}</SheetDescription>
        </SheetHeader>
        {editing && detail.isPending ? <div className="space-y-4 p-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /></div> : editing && (detail.isError || !detail.data) ? (
          <div role="alert" className="space-y-3 p-4"><p className="text-sm text-destructive">{getProjectError(detail.error)}</p><Button variant="outline" onClick={() => void detail.refetch()}>Retry</Button></div>
        ) : <ProjectForm key={projectId ?? "create"} project={detail.data} pending={pending} error={mutation.error} onSave={save} onClose={lifecycle.close} />}
      </SheetContent>
    </Sheet>
  );
}

function ProjectForm({ project, pending, error, onSave, onClose }: {
  project?: Project;
  pending: boolean;
  error: unknown;
  onSave: (values: ProjectFormValues) => Promise<void>;
  onClose: () => void;
}) {
  const [owners, setOwners] = useState<ProjectUser[]>(project ? [project.owner] : []);
  const [members, setMembers] = useState<ProjectUser[]>([]);
  const { register, setValue, handleSubmit, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { name: project?.name ?? "", description: project?.description ?? "", owner_id: project?.owner_id ?? "", member_ids: [] },
  });

  return (
    <form noValidate onSubmit={handleSubmit(onSave)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="space-y-2">
          <Label htmlFor="project-name">Project name</Label>
          <Input id="project-name" required maxLength={255} disabled={pending} aria-invalid={Boolean(errors.name)} {...register("name")} />
          {errors.name && <p role="alert" className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-description">Description (optional)</Label>
          <textarea id="project-description" rows={4} disabled={pending} className="w-full rounded-md border-2 border-border bg-background p-3 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50" {...register("description")} />
          {errors.description && <p role="alert" className="text-sm text-destructive">{errors.description.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Project owner</Label>
          <ProjectUserPicker label="Project owner" selected={owners} disabled={pending} onChange={(users) => { setOwners(users); setValue("owner_id", users[0]?.id ?? "", { shouldValidate: true }); }} />
          {errors.owner_id && <p role="alert" className="text-sm text-destructive">{errors.owner_id.message}</p>}
        </div>
        {!project && (
          <div className="space-y-2">
            <Label>Members (optional)</Label>
            <ProjectUserPicker label="Project members" multiple selected={members} disabled={pending} onChange={(users) => { setMembers(users); setValue("member_ids", users.map((user) => user.id), { shouldValidate: true }); }} />
            {errors.member_ids && <p role="alert" className="text-sm text-destructive">{errors.member_ids.message}</p>}
            <p className="text-xs text-muted-foreground"><span className="system-copy">You can add members later.</span></p>
          </div>
        )}
        {error != null && <p role="alert" className="text-sm text-destructive">{getProjectError(error)}</p>}
      </div>
      <SheetFooter>
        <Button type="button" variant="outline" disabled={pending} onClick={onClose}><span className="system-copy">Cancel</span></Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : project ? "Save changes" : "Create project"}</Button>
      </SheetFooter>
    </form>
  );
}
