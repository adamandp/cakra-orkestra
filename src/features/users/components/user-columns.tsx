"use client";

import { EllipsisIcon, PencilIcon, ShieldIcon, UserCheckIcon, UserXIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import type { User } from "@/interface/user.interface";

export type UserAction = "edit" | "role" | "status";

export const userColumns = ["Name", "Username", "Role", "Status", "Actions"];

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
    <TableRow>
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar>
            {user.avatar_url && <AvatarImage src={user.avatar_url} alt="" />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <span className="font-medium">{user.name}</span>
            {isSelf && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
          </div>
        </div>
      </TableCell>
      <TableCell>{user.username}</TableCell>
      <TableCell>
        <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>{user.role}</Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant={user.is_active ? "outline" : "secondary"}
          className={
            user.is_active ? "border-emerald-600 text-emerald-700 dark:text-emerald-400" : ""
          }
        >
          {user.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="pr-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.name}`} />
            }
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onClick={() => onAction("edit", user)}>
              <PencilIcon /> Edit user
            </DropdownMenuItem>
            <DropdownMenuItem disabled={isSelf} onClick={() => onAction("role", user)}>
              <ShieldIcon /> Change role
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isSelf}
              variant={user.is_active ? "destructive" : "default"}
              onClick={() => onAction("status", user)}
            >
              {user.is_active ? <UserXIcon /> : <UserCheckIcon />}
              {user.is_active ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
