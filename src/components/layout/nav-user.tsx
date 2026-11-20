"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  EllipsisVerticalIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  LockKeyholeIcon,
  UserRoundPenIcon,
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
import { UserFormSheet } from "@/features/users/components/user-form-sheet";
import { getAuthError } from "@/features/auth/auth.api";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
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
                  className="flex h-14 items-center gap-3 rounded-none border-0 shadow-none aria-expanded:bg-muted group-data-[collapsible=icon]:mr-auto group-data-[collapsible=icon]:justify-start"
                />
              }
            >
              <Avatar className="size-10 rounded-none border-2 border-border bg-yellow group-data-[collapsible=icon]:size-8">
                {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                <AvatarFallback className="rounded-none bg-yellow font-bold text-[#10121a]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.role === "ADMIN" ? "Administrator" : "Member"}
                </span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 min-w-0 max-w-[calc(100vw-24px)] border-2 border-border p-3 shadow-neo-card ring-0"
              side={isMobile ? "top" : "right"}
              align={isMobile ? "start" : "end"}
              sideOffset={isMobile ? 12 : 24}
              showArrow
            >
              <DropdownMenuGroup className="flex flex-col gap-2">
                <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                  <UserRoundPenIcon /> Edit information
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
                  <LockKeyholeIcon /> Change password
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="mx-0 my-3" />
              <DropdownMenuGroup className="flex flex-col gap-2">
                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={(event) => {
                    event.preventDefault();
                    setTheme(dark ? "light" : "dark");
                  }}
                >
                  {dark ? <MoonIcon /> : <SunIcon />} Dark mode
                  <span
                    role="switch"
                    aria-label="Dark mode"
                    aria-checked={dark}
                    className={`ml-auto flex h-5 w-9 items-center border-2 border-border p-0.5 ${dark ? "bg-primary" : "bg-muted"}`}
                  >
                    <span
                      className={`size-3 border border-border bg-background transition-transform ${dark ? "translate-x-3" : ""}`}
                    />
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="mx-0 my-3" />
              <DropdownMenuItem disabled={mutation.isPending} onClick={() => mutation.mutate()}>
                <LogOutIcon /> {mutation.isPending ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {profileOpen && (
        <UserFormSheet
          modal
          userId={user.id}
          roles={[]}
          onClose={() => setProfileOpen(false)}
          onSaved={() => setProfileOpen(false)}
        />
      )}
      <ChangePasswordSheet open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
