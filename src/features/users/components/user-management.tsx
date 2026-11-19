"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import type { User } from "@/interface/user.interface";
import { useAuth } from "@/providers/auth-provider";
import { useRoles, useUsers } from "../user.query";
import { getUserError } from "../user.api";
import { UserTable } from "./user-table";
import { UserToolbar, defaultUserFilters, type UserFilters } from "./user-toolbar";
import { UserFormSheet } from "./user-form-sheet";
import { UserActionSheet } from "./user-action-sheet";
import type { UserAction } from "./user-columns";

const PAGE_SIZE = 10;

type ActiveSheet = { action: "create" } | { action: UserAction; user: User };

export function UserManagement() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<UserFilters>(defaultUserFilters);
  const [offset, setOffset] = useState(0);
  const [sheet, setSheet] = useState<ActiveSheet | null>(null);

  const usersQuery = useUsers({
    q: filters.q.trim() || undefined,
    role_id: filters.role_id === "all" ? undefined : filters.role_id,
    is_active: filters.status === "all" ? undefined : filters.status === "active",
    limit: PAGE_SIZE,
    offset,
  });
  const rolesQuery = useRoles();
  const roles = rolesQuery.data ?? [];

  function handleFilterChange(next: UserFilters) {
    setFilters(next);
    setOffset(0);
  }

  function handleAction(action: UserAction, selectedUser: User) {
    if (selectedUser.id === user?.id && action !== "edit") return;
    setSheet({ action, user: selectedUser });
  }

  function handleSaved() {
    setOffset(0);
  }

  function closeSheet() {
    setSheet(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage team members and their roles."
        actions={
          <Button
            disabled={rolesQuery.isPending || rolesQuery.isError || roles.length === 0}
            onClick={() => setSheet({ action: "create" })}
          >
            <PlusIcon /> Add User
          </Button>
        }
      />
      {rolesQuery.isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-destructive p-4"
        >
          <p className="text-sm text-destructive">{getUserError(rolesQuery.error)}</p>
          <Button variant="outline" onClick={() => void rolesQuery.refetch()}>
            Retry roles
          </Button>
        </div>
      )}
      <UserToolbar filters={filters} roles={roles} onChange={handleFilterChange} />
      {usersQuery.isError ? (
        <div role="alert" className="space-y-3 rounded-lg border-2 border-border p-6 text-center">
          <p className="text-sm text-destructive">{getUserError(usersQuery.error)}</p>
          <Button variant="outline" onClick={() => void usersQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <UserTable
          data={usersQuery.data}
          loading={usersQuery.isPending}
          currentUserId={user?.id ?? ""}
          limit={PAGE_SIZE}
          offset={offset}
          onOffsetChange={setOffset}
          onAction={handleAction}
        />
      )}
      {sheet?.action === "create" && (
        <UserFormSheet roles={roles} onClose={closeSheet} onSaved={handleSaved} />
      )}
      {sheet?.action === "edit" && (
        <UserFormSheet
          key={sheet.user.id}
          userId={sheet.user.id}
          roles={roles}
          onClose={closeSheet}
          onSaved={handleSaved}
        />
      )}
      {sheet && (sheet.action === "role" || sheet.action === "status") && (
        <UserActionSheet
          key={`${sheet.action}-${sheet.user.id}`}
          action={sheet.action}
          user={sheet.user}
          roles={roles}
          onClose={closeSheet}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
