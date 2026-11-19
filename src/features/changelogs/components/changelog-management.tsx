"use client";

import { useState } from "react";
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/providers/auth-provider";
import type { Changelog } from "@/interface/changelog.interface";
import { useChangelogs } from "../changelog.query";
import { getChangelogError } from "../changelog.api";
import { CHANGELOG_PAGE_SIZE } from "../changelog.constants";
import {
  ChangelogToolbar,
  defaultChangelogFilters,
  type ChangelogFilters,
} from "./changelog-toolbar";
import { ChangelogCard } from "./changelog-card";
import { ChangelogFormSheet } from "./changelog-form-sheet";
import { ChangelogDetail } from "./changelog-detail";

type SheetState =
  { action: "create" } | { action: "detail"; id: string } | { action: "edit"; entry: Changelog };

export function ChangelogManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [filters, setFilters] = useState<ChangelogFilters>(defaultChangelogFilters);
  const [offset, setOffset] = useState(0);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const query = useChangelogs(
    {
      q: filters.q.trim() || undefined,
      project_id: filters.project?.id,
      limit: CHANGELOG_PAGE_SIZE,
      offset,
    },
    Boolean(user),
  );
  const entries = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const page = Math.floor(offset / CHANGELOG_PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / CHANGELOG_PAGE_SIZE));
  function changeFilters(next: ChangelogFilters) {
    setFilters(next);
    setOffset(0);
  }
  function inspect(id: string) {
    setSheet({ action: "detail", id });
  }
  function close() {
    setSheet(null);
  }
  function saved(id: string) {
    setOffset(0);
    inspect(id);
  }
  function deleted() {
    setOffset(0);
    close();
  }
  return (
    <div className="space-y-4">
      <PageHeader
        title="Changelog"
        description="Track application releases and changes."
        actions={
          isAdmin ? (
            <Button onClick={() => setSheet({ action: "create" })}>
              <PlusIcon /> New release
            </Button>
          ) : undefined
        }
      />
      <ChangelogToolbar filters={filters} onChange={changeFilters} />
      {query.isError ? (
        <div role="alert" className="space-y-3 rounded-lg border-2 border-border p-6 text-center">
          <p className="text-sm text-destructive">{getChangelogError(query.error)}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {query.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-40 w-full" />
              ))}
            </div>
          ) : entries.length ? (
            <div className="space-y-3">
              {entries.map((entry) => (
                <ChangelogCard key={entry.id} entry={entry} onSelect={inspect} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No releases found.
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {query.isPending
                ? "Loading releases..."
                : entries.length
                  ? `Showing ${offset + 1}–${offset + entries.length} of ${total} releases`
                  : `0 releases on this page (${total} total)`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous releases"
                disabled={query.isPending || offset === 0}
                onClick={() => setOffset(Math.max(0, offset - CHANGELOG_PAGE_SIZE))}
              >
                <ChevronLeftIcon />
              </Button>
              <span className="text-sm tabular-nums">
                {query.isPending ? `Page ${page}` : `${page} / ${pageCount}`}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next releases"
                disabled={query.isPending || offset + CHANGELOG_PAGE_SIZE >= total}
                onClick={() => setOffset(offset + CHANGELOG_PAGE_SIZE)}
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </>
      )}
      {isAdmin && sheet?.action === "create" && (
        <ChangelogFormSheet
          initialProject={filters.project ?? undefined}
          onClose={close}
          onSaved={saved}
        />
      )}
      {sheet?.action === "detail" && (
        <ChangelogDetail
          key={sheet.id}
          id={sheet.id}
          isAdmin={isAdmin}
          onClose={close}
          onEdit={(entry) => {
            if (isAdmin) setSheet({ action: "edit", entry });
          }}
          onDeleted={deleted}
        />
      )}
      {isAdmin && sheet?.action === "edit" && (
        <ChangelogFormSheet
          key={sheet.entry.id}
          entry={sheet.entry}
          onClose={() => inspect(sheet.entry.id)}
          onSaved={saved}
        />
      )}
    </div>
  );
}
