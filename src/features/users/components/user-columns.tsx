"use client";

import { ArrowRightIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { User } from "@/interface/user.interface";

export type UserAction = "detail";

export const userColumns = ["Name", "Username", "Role", "Status", ""];

export function UserTableRow({
  user,
  currentUserId,
  onAction,
}: {
  user: User;
  currentUserId: string;
  onAction: (action: UserAction, user: User) => void;
}) {
  const isSelf = user.id === currentUserId;
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <TableRow className="cursor-pointer" onClick={() => onAction("detail", user)}>
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar>
            {user.avatar_url && <AvatarImage src={user.avatar_url} alt="" />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <span className="font-medium">{user.name}</span>
            {isSelf && <span className="ml-2 text-xs text-muted-foreground"><span className="system-copy">(You)</span></span>}
          </div>
        </div>
      </TableCell>
      <TableCell>{user.username}</TableCell>
      <TableCell>
        <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>{user.role}</Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant={user.is_active ? "success" : "neutral"}
          className={
            user.is_active ? "border-emerald-600 text-emerald-700 dark:text-emerald-400" : ""
          }
        >
          {user.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="pr-4 text-right">
        <Button variant="ghost" size="icon-sm" pressAnimation={false} aria-label={`View ${user.name}`} onClick={event => { event.stopPropagation(); onAction("detail", user); }}><ArrowRightIcon /></Button>
      </TableCell>
    </TableRow>
  );
}
