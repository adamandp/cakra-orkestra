"use client";

import { Pagination } from "@/components/shared/pagination";

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
  onLimitChange,
  onAction,
}: {
  data?: UserListResponse;
  loading: boolean;
  currentUserId: string;
  limit: number;
  offset: number;
  onOffsetChange: (offset: number) => void;
  onLimitChange: (limit: number) => void;
  onAction: (action: UserAction, user: User) => void;
}) {
  const users = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="min-w-0 bg-card">
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
      <div className="explorer-panel-footer"><Pagination total={total} limit={limit} offset={offset} count={users.length} disabled={loading} onOffsetChange={onOffsetChange} onLimitChange={onLimitChange} /></div>
    </div>
  );
}
