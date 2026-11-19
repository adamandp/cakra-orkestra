"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User, UserListResponse } from "@/interface/user.interface";
import { userColumns, UserTableRow, type UserAction } from "./user-columns";

export function UserTable({
  data,
  loading,
  currentUserId,
  limit,
  offset,
  onOffsetChange,
  onAction,
}: {
  data?: UserListResponse;
  loading: boolean;
  currentUserId: string;
  limit: number;
  offset: number;
  onOffsetChange: (offset: number) => void;
  onAction: (action: UserAction, user: User) => void;
}) {
  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const page = Math.floor(offset / limit) + 1;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="overflow-hidden rounded-lg border-2 border-border bg-card shadow-neo-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {userColumns.map((column) => (
              <TableHead
                key={column}
                className={
                  column === "Name"
                    ? "pl-4 font-bold"
                    : column === "Actions"
                      ? "pr-4 text-right font-bold"
                      : "font-bold"
                }
              >
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }, (_, index) => (
              <TableRow key={index}>
                {userColumns.map((column) => (
                  <TableCell key={column}>
                    <Skeleton className="h-7 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={userColumns.length}
                className="h-28 text-center text-muted-foreground"
              >
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                onAction={onAction}
              />
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {loading
            ? "Loading users..."
            : users.length
              ? `Showing ${offset + 1}–${offset + users.length} of ${total} users`
              : total
                ? `0 users on this page (${total} total)`
                : "0 users"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={loading || offset === 0}
            onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          >
            <ChevronLeftIcon />
          </Button>
          <span className="text-sm tabular-nums">
            {loading ? `Page ${page}` : `${page} / ${pageCount}`}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={loading || offset + limit >= total}
            onClick={() => onOffsetChange(offset + limit)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
