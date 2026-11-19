"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { AudioLinesIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/providers/auth-provider";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { getNavigationForRole } from "./navigation";

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { user } = useAuth();
  const groups = user ? getNavigationForRole(user.role) : [];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b-2 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/my-focus" />}
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
              className="h-14 gap-3 hover:bg-transparent"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border-2 border-border bg-secondary text-secondary-foreground shadow-neo-sm">
                <AudioLinesIcon className="size-6!" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-lg font-black tracking-tight">Cakra Orkestra</span>
                <span className="truncate text-xs text-muted-foreground">Team Workflow Hub</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1 py-2">
        {groups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t-2 p-3">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
