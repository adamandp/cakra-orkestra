"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Project, ProjectStatus } from "@/interface/project.interface";
import { getProjectError } from "../project.api";
import { useUpdateProjectStatus } from "../project.mutation";
import { projectStatusSchema } from "../project.schema";
import { projectStatusLabels } from "./project-toolbar";

export function ProjectStatusSheet({ project, onClose, onSaved }: {
  project: Project;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const mutation = useUpdateProjectStatus();
  const pending = mutation.isPending;

  async function confirm() {
    try {
      await mutation.mutateAsync({ id: project.id, input: { status } });
      toast.success("Project status updated");
      onSaved();
      onClose();
    } catch {
      // Keep the sheet open for retry.
    }
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <SheetContent className="w-full border-l-2 border-border sm:max-w-md">
        <SheetHeader><SheetTitle>Change project status</SheetTitle><SheetDescription>{project.code} — {project.name}</SheetDescription></SheetHeader>
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="project-status">New status</Label>
            <Select value={status} disabled={pending} onValueChange={(value) => { const parsed = projectStatusSchema.safeParse(value); if (parsed.success) setStatus(parsed.data); }}>
              <SelectTrigger id="project-status" className="w-full border-2 border-border"><SelectValue>{projectStatusLabels[status]}</SelectValue></SelectTrigger>
              <SelectContent>{projectStatusSchema.options.map((option) => <SelectItem key={option} value={option}>{projectStatusLabels[option]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">Archiving retains project information and membership. The project is not deleted.</p>
          {mutation.isError && <p role="alert" className="text-sm text-destructive">{getProjectError(mutation.error)}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="outline" disabled={pending} onClick={onClose}>Cancel</Button>
            <Button disabled={pending || status === project.status} onClick={() => void confirm()}>{pending ? "Saving..." : "Save status"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
