"use client";

import { Fragment, type ComponentProps } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarHeader,
  SidebarSeparator,
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-(--header-height) shrink-0 justify-center border-b-2 px-3 py-0 group-data-[collapsible=icon]:px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/my-focus" />}
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
              className="flex h-14 items-center gap-2.5 px-1 rounded-none hover:bg-transparent group-data-[collapsible=icon]:mr-auto group-data-[collapsible=icon]:justify-start"
            >
              <Image
                src="/cakra-logo.png"
                alt=""
                width={40}
                height={40}
                className="size-10 shrink-0 object-contain group-data-[collapsible=icon]:size-8"
              />
              <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-black uppercase tracking-[0.035em]">Cakra Orkestra</span>
                <span className="truncate text-[10px] font-semibold uppercase tracking-[0.045em] text-muted-foreground">Team Workflow Hub</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        {groups.map((group, index) => (
          <Fragment key={group.label}>
            {index > 0 && (
              <SidebarSeparator className="!mx-[-8px] my-1 shrink-0 self-stretch !w-auto !h-px !bg-sidebar-foreground/30" />
            )}
            <NavMain label={group.label} items={group.items} />
          </Fragment>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t-2 p-3 group-data-[collapsible=icon]:p-2">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
