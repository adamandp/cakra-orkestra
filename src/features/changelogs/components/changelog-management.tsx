"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/auth-provider";
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
  { action: "create" } | { action: "detail"; id: string };

export function ChangelogManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [filters, setFilters] = useState<ChangelogFilters>(defaultChangelogFilters);
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState(CHANGELOG_PAGE_SIZE);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const query = useChangelogs(
    {
      q: filters.q.trim() || undefined,
      project_id: filters.project?.id,
      limit: pageSize,
      offset,
    },
    Boolean(user),
  );
  const entries = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
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
      <PageHeader title="Changelog" description="Track application releases and changes." actions={
          isAdmin ? (
            <Button onClick={() => setSheet({ action: "create" })}>
              <PlusIcon /> New release
            </Button>
          ) : undefined
        } />

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
          <Pagination total={total} limit={pageSize} offset={offset} count={entries.length} disabled={query.isFetching} onOffsetChange={setOffset} onLimitChange={(size) => { setPageSize(size); setOffset(0); }} />
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
          onDeleted={deleted}
        />
      )}
    </div>
  );
}
