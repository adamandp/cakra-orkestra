"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  EllipsisVerticalIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  LockKeyholeIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/providers/auth-provider";
import { ChangePasswordSheet } from "@/features/auth/components/change-password-sheet";
import { getAuthError } from "@/features/auth/auth.api";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: logout,
    onError: (error) => toast.error(getAuthError(error)),
  });

  if (!user) return null;
  const initials = user.name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="h-14 rounded-lg border-2 border-sidebar-border aria-expanded:bg-muted"
                />
              }
            >
              <Avatar className="size-9 rounded-lg border-2 border-border bg-primary">
                {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                <AvatarFallback className="rounded-md bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.role}</span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-56 border-2 border-border shadow-neo-card ring-0"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={8}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
                  <LockKeyholeIcon /> Change password
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <SunIcon /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <MoonIcon /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <MonitorIcon /> System
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={mutation.isPending} onClick={() => mutation.mutate()}>
                <LogOutIcon /> {mutation.isPending ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {passwordOpen && <ChangePasswordSheet open={passwordOpen} onOpenChange={setPasswordOpen} />}
    </>
  );
}
