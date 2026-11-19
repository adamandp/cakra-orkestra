"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectUser, Project } from "@/interface/project.interface";
import { getProjectError } from "../project.api";
import { useAddProjectMembers, useRemoveProjectMember } from "../project.mutation";
import { useProjectMembers } from "../project.query";
import { ProjectUserPicker } from "./project-user-picker";

export function ProjectMembersSheet({ project, onClose }: { project: Project; onClose: () => void }) {
  const query = useProjectMembers(project.id);
  const addMutation = useAddProjectMembers();
  const removeMutation = useRemoveProjectMember();
  const [selected, setSelected] = useState<ProjectUser[]>([]);
  const [removing, setRemoving] = useState<ProjectUser | null>(null);
  const members = query.data ?? [];
  const pending = addMutation.isPending || removeMutation.isPending;
  const available = selected.filter((user) => !members.some((member) => member.id === user.id));

  async function add() {
    if (!available.length) return;
    removeMutation.reset();
    try {
      await addMutation.mutateAsync({ id: project.id, input: { member_ids: available.map((user) => user.id) } });
      setSelected([]);
      toast.success("Members added");
    } catch { /* Display mutation error below. */ }
  }

  async function remove(userId: string) {
    addMutation.reset();
    try {
      await removeMutation.mutateAsync({ id: project.id, userId });
      setRemoving(null);
      toast.success("Member removed");
    } catch { /* Preserve the confirmation for retry. */ }
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <SheetContent className="w-full border-l-2 border-border sm:max-w-lg">
        <SheetHeader><SheetTitle>Manage members</SheetTitle><SheetDescription>{project.code} — {project.name}</SheetDescription></SheetHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          {query.isPending ? <Skeleton className="h-24 w-full" /> : query.isError ? (
            <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{getProjectError(query.error)}</p><Button variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>
          ) : (
            <>
              <section className="space-y-2">
                <h3 className="font-semibold">Current members ({members.length})</h3>
                {!members.length && <p className="text-sm text-muted-foreground">No project members yet.</p>}
                {members.map((member) => (
                  <div key={member.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                    <div className="min-w-0 break-words text-sm"><p className="font-medium">{member.name}{!member.is_active && " (inactive)"}</p><p className="text-xs text-muted-foreground">@{member.username}</p></div>
                    <Button variant="outline" size="sm" disabled={pending || Boolean(removing)} onClick={() => { removeMutation.reset(); setRemoving(member); }}>Remove</Button>
                  </div>
                ))}
                {removing && (
                  <div className="space-y-3 rounded-md border-2 border-border p-3">
                    <p className="text-sm">Remove {removing.name} from this project? Their user account will be retained.</p>
                    {removeMutation.isError && <p role="alert" className="text-sm text-destructive">{getProjectError(removeMutation.error)}</p>}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" disabled={pending} onClick={() => { setRemoving(null); removeMutation.reset(); }}>Cancel</Button>
                      <Button variant="destructive" disabled={pending} onClick={() => void remove(removing.id)}>{pending ? "Removing..." : "Confirm remove"}</Button>
                    </div>
                  </div>
                )}
              </section>
              <section className="space-y-3 border-t pt-4">
                <h3 className="font-semibold">Add members</h3>
                <ProjectUserPicker label="Add project members" multiple selected={available} excludedIds={members.map((member) => member.id)} disabled={pending || Boolean(removing)} onChange={setSelected} />
                {addMutation.isError && <p role="alert" className="text-sm text-destructive">{getProjectError(addMutation.error)}</p>}
                <Button disabled={pending || Boolean(removing) || !available.length} onClick={() => void add()}>{addMutation.isPending ? "Adding..." : `Add members (${available.length})`}</Button>
              </section>
            </>
          )}
        </div>
        <div className="flex justify-end border-t p-4"><Button variant="outline" disabled={pending} onClick={onClose}>Close</Button></div>
      </SheetContent>
    </Sheet>
  );
}
