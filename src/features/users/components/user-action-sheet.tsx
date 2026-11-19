"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { UserRole } from "@/interface/role.interface";
import type { User } from "@/interface/user.interface";
import { getUserError } from "../user.api";
import { useUpdateUserRole, useUpdateUserStatus } from "../user.mutation";

export function UserActionSheet({
  action,
  user,
  roles,
  onClose,
  onSaved,
}: {
  action: "role" | "status";
  user: User;
  roles: UserRole[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [roleId, setRoleId] = useState(user.role_id);
  const roleMutation = useUpdateUserRole();
  const statusMutation = useUpdateUserStatus();
  const isRole = action === "role";
  const mutation = isRole ? roleMutation : statusMutation;
  const pending = mutation.isPending;
  const title = isRole ? "Change role" : user.is_active ? "Deactivate user" : "Activate user";

  async function handleConfirm() {
    try {
      if (isRole) {
        await roleMutation.mutateAsync({ id: user.id, input: { role_id: roleId } });
        toast.success("Role updated");
      } else {
        await statusMutation.mutateAsync({ id: user.id, input: { is_active: !user.is_active } });
        toast.success(user.is_active ? "User deactivated" : "User activated");
      }
      onSaved();
      onClose();
    } catch {
      // Keep the confirmation sheet open and show the API error.
    }
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <SheetContent className="w-full border-l-2 border-border sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {user.name} (@{user.username})
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 p-4">
          {isRole ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="change-user-role">New role</Label>
                <Select
                  value={roleId}
                  disabled={pending}
                  onValueChange={(value) => {
                    if (value !== null) setRoleId(value);
                  }}
                >
                  <SelectTrigger id="change-user-role" className="w-full border-2 border-border">
                    <SelectValue>
                      {roles.find((role) => role.id === roleId)?.name ?? "Select role"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Changing this role will apply the new access permissions and revoke the user&apos;s
                existing session.
              </p>
            </>
          ) : (
            <p className="text-sm">
              {user.is_active
                ? "This user will no longer be able to sign in. Their existing data will be retained."
                : "This user will be able to sign in again."}
            </p>
          )}
          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getUserError(mutation.error)}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" disabled={pending} onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant={!isRole && user.is_active ? "destructive" : "default"}
              disabled={
                pending ||
                (isRole && (roleId === user.role_id || !roles.some((role) => role.id === roleId)))
              }
              onClick={() => void handleConfirm()}
            >
              {pending ? "Saving..." : title}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
