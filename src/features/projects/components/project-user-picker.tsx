"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useEffect, useState } from "react";
import { CheckIcon, XIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
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
  simple = false,
}: {
  selected: ProjectUser[];
  onChange: (users: ProjectUser[]) => void;
  multiple?: boolean;
  excludedIds?: string[];
  disabled?: boolean;
  activeOnly?: boolean;
  label: string;
  simple?: boolean;
}) {
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(q.trim()); setOffset(0); }, 300);
    return () => clearTimeout(timer);
  }, [q]);
  const query = useUsers({
    q: search || undefined,
    is_active: activeOnly ? true : undefined,
    limit: PAGE_SIZE,
    offset,
  }, { keepPreviousData: true });
  const searching = q.trim() !== search || query.isFetching;
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const visibleItems = simple && !q.trim() && offset === 0
    ? [...selected, ...items.filter(item => !selected.some(value => value.id === item.id))]
    : items;

  function toggle(user: ProjectUser) {
    const exists = selected.some((item) => item.id === user.id);
    if (multiple) {
      onChange(exists ? selected.filter((item) => item.id !== user.id) : [...selected, user]);
    } else {
      onChange(simple ? [user] : exists ? [] : [user]);
    }
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={simple ? "min-w-0 overflow-hidden" : "min-w-0 overflow-hidden rounded-md border-2 border-border bg-background"}
    >
      {!simple && <div className="space-y-2 border-b border-border/30 p-3"><p className="text-xs font-semibold text-muted-foreground">{multiple ? selected.length + " selected" : label === "Filter assignee" ? "Selected assignee" : "Selected owner"}</p><div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
        {selected.map((user) => (
          <div
            key={user.id}
            className="flex max-w-full items-center gap-1 rounded-md border border-border/30 bg-muted pl-2 text-xs"
          >
            {user.name}
            {!user.is_active && " (inactive)"}
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              disabled={disabled}
              aria-label={`Remove ${user.name} from selection`}
              onClick={() => toggle(user)}
            >
              <XIcon />
            </Button>
          </div>
        ))}
        {!selected.length && <p className="text-xs text-muted-foreground"><span className="system-copy">No users selected.</span></p>}
      </div></div>}
      <div className={simple ? "relative p-1" : "relative p-3"}><SearchIcon className={`pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ${simple ? "left-4" : "left-6"}`} /><Input className="pl-9"
        aria-label={`Search ${label.toLowerCase()}`}
        placeholder="Search name or username..."
        value={q}
        maxLength={255}
        disabled={disabled}
        onChange={(event) => {
          setQ(event.target.value);
        }}
      /></div>
      <div className={simple ? "max-h-72 overflow-y-auto px-1" : "min-h-[17rem] px-3"} aria-busy={searching}>
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
        <p className="text-sm text-muted-foreground"><span className="system-copy">Loading users...</span></p>
      ) : (
        <div className="divide-y divide-border/20">
          {!items.length && (
            <p className="text-sm text-muted-foreground">
              {activeOnly ? "No active users found." : "No users found."}
            </p>
          )}
          {visibleItems.map((user) => {
            const checked = selected.some((item) => item.id === user.id);
            const excluded = excludedIds.includes(user.id);
            return (
              <Button
                key={user.id}
                type="button"
                variant="ghost"
                pressAnimation={!simple}
                className={`min-h-[54px] w-full justify-start gap-3 rounded-sm px-2 py-2 text-left font-normal whitespace-normal ${simple ? (checked ? "!bg-[var(--yellow)] border-border text-black hover:!bg-[var(--yellow)]" : "") : checked ? "bg-muted" : ""} ${simple ? "!min-h-10 !h-auto !gap-2 !py-1.5" : ""}`}
                aria-pressed={checked}
                disabled={disabled || excluded || searching}
                onClick={() => toggle(user)}
              >
                <Avatar className="size-8 shrink-0">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} alt="" />}
                  <AvatarFallback>{user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{user.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">@{user.username}</span>
                </span>
                {simple ? null : excluded ? <span className="shrink-0 text-xs text-muted-foreground"><span className="system-copy">Added</span></span> : (
                  <span className={`flex size-5 shrink-0 items-center justify-center border-2 border-border ${multiple ? "rounded-sm" : "rounded-full"} ${checked ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                    {checked && <CheckIcon className="size-3" />}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      )}
      </div>
      <div className={`flex items-center justify-between gap-2 border-t border-border/30 ${simple ? "p-1.5" : "p-3"}`}>
        <span className="text-xs text-muted-foreground">{items.length ? offset + 1 : 0}–{Math.min(offset + items.length, total)} of {total} users</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon-xs" aria-label="Previous page" disabled={disabled || searching || offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}><ChevronLeftIcon /></Button>
          <Button type="button" variant="outline" size="icon-xs" aria-label="Next page" disabled={disabled || searching || offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}><ChevronRightIcon /></Button>
        </div>
      </div>
    </div>
  );
}
