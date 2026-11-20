"use client";

import type { ReactNode } from "react";

import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/interface/role.interface";

export interface UserFilters {
  q: string;
  role_id: string;
  status: "all" | "active" | "inactive";
}

export const defaultUserFilters: UserFilters = {
  q: "",
  role_id: "all",
  status: "all",
};

export function UserToolbar({
  filters,
  roles,
  onChange,
  actions,
}: {
  actions?: ReactNode;
  filters: UserFilters;
  roles: UserRole[];
  onChange: (filters: UserFilters) => void;
}) {
  const statusLabel =
    filters.status === "active"
      ? "Active"
      : filters.status === "inactive"
        ? "Inactive"
        : "All statuses";
  const roleLabel = roles.find((role) => role.id === filters.role_id)?.name ?? "All roles";
  const isFiltered = Boolean(filters.q || filters.role_id !== "all" || filters.status !== "all");

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="relative min-w-0 basis-full sm:min-w-40 sm:basis-0 sm:flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search users"
          placeholder="Search users..."
          value={filters.q}
          maxLength={255}
          className="pl-9"
          onChange={(event) => onChange({ ...filters, q: event.target.value })}
        />
      </div>
      <Select
        value={filters.role_id}
        onValueChange={(value) => {
          if (value !== null) onChange({ ...filters, role_id: value });
        }}
      >
        <SelectTrigger
          aria-label="Filter by role"
          className="min-w-0 flex-1 border-2 border-border sm:flex-none sm:min-w-32"
        >
          <SelectValue>{roleLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          {roles.map((role) => (
            <SelectItem key={role.id} value={role.id}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.status}
        onValueChange={(value) => {
          if (value === "all" || value === "active" || value === "inactive") {
            onChange({ ...filters, status: value });
          }
        }}
      >
        <SelectTrigger
          aria-label="Filter by status"
          className="min-w-0 flex-1 border-2 border-border sm:flex-none sm:min-w-36"
        >
          <SelectValue>{statusLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      {isFiltered && (
        <Button variant="ghost" onClick={() => onChange(defaultUserFilters)}>
          Reset
        </Button>
      )}
      {actions && (
        <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
