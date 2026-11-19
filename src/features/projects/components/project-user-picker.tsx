"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUsers } from "@/features/users/user.query";
import { getUserError } from "@/features/users/user.api";
import type { ProjectUser } from "@/interface/project.interface";

const PAGE_SIZE = 5;

export function ProjectUserPicker({
  selected,
  onChange,
  multiple = false,
  excludedIds = [],
  disabled = false,
  activeOnly = true,
  label,
}: {
  selected: ProjectUser[];
  onChange: (users: ProjectUser[]) => void;
  multiple?: boolean;
  excludedIds?: string[];
  disabled?: boolean;
  activeOnly?: boolean;
  label: string;
}) {
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const query = useUsers({
    q: q.trim() || undefined,
    is_active: activeOnly ? true : undefined,
    limit: PAGE_SIZE,
    offset,
  });
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  function toggle(user: ProjectUser) {
    const exists = selected.some((item) => item.id === user.id);
    if (multiple) {
      onChange(exists ? selected.filter((item) => item.id !== user.id) : [...selected, user]);
    } else {
      onChange(exists ? [] : [user]);
    }
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="space-y-2 rounded-lg border-2 border-border p-3"
    >
      <div className="flex flex-wrap gap-2">
        {selected.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs"
          >
            {user.name}
            {!user.is_active && " (inactive)"}
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={disabled}
              aria-label={`Remove ${user.name} from selection`}
              onClick={() => toggle(user)}
            >
              <XIcon />
            </Button>
          </div>
        ))}
        {!selected.length && <p className="text-xs text-muted-foreground">No users selected.</p>}
      </div>
      <Input
        aria-label={`Search ${label.toLowerCase()}`}
        placeholder="Search name or username..."
        value={q}
        maxLength={255}
        disabled={disabled}
        onChange={(event) => {
          setQ(event.target.value);
          setOffset(0);
        }}
      />
      {query.isError ? (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{getUserError(query.error)}</p>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => void query.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : query.isPending ? (
        <p className="text-sm text-muted-foreground">Loading users...</p>
      ) : (
        <div className="space-y-1">
          {!items.length && (
            <p className="text-sm text-muted-foreground">
              {activeOnly ? "No active users found." : "No users found."}
            </p>
          )}
          {items.map((user) => {
            const checked = selected.some((item) => item.id === user.id);
            const excluded = excludedIds.includes(user.id);
            return (
              <Button
                key={user.id}
                type="button"
                variant={checked ? "secondary" : "ghost"}
                className="h-auto w-full justify-start whitespace-normal text-left"
                aria-pressed={checked}
                disabled={disabled || excluded}
                onClick={() => toggle(user)}
              >
                <span className="min-w-0 flex-1 break-words">
                  {user.name}{" "}
                  <span className="text-xs text-muted-foreground">@{user.username}</span>
                </span>
                {excluded ? (
                  <span className="text-xs">Already added</span>
                ) : checked ? (
                  <CheckIcon />
                ) : null}
              </Button>
            );
          })}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {total} {activeOnly ? "active users" : "users"}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous users"
            disabled={disabled || query.isPending || offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next users"
            disabled={disabled || query.isPending || offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
