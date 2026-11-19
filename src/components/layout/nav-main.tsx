"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { isNavigationActive, type NavigationItem } from "./navigation";

interface NavMainProps {
  label: string;
  items: NavigationItem[];
}

export function NavMain({ label, items }: NavMainProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const isActive = isNavigationActive(pathname, item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  render={<Link href={item.url} />}
                  tooltip={item.title}
                  isActive={isActive}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                  className="h-10 rounded-lg border-2 border-transparent font-semibold data-active:border-sidebar-border data-active:font-bold data-active:shadow-neo-sm"
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
