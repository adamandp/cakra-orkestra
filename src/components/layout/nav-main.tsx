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
    <SidebarGroup className="px-0 py-2">
      <SidebarGroupLabel className="h-7 min-w-0 truncate px-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground group-data-[collapsible=icon]:hidden">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0">
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
                  className="orkestra-nav-link flex h-10 w-full items-center gap-2.5 rounded-none px-3 text-[12px] font-bold uppercase tracking-[0.035em] data-active:font-extrabold group-data-[collapsible=icon]:mr-auto group-data-[collapsible=icon]:justify-start"
                >
                  <item.icon className="size-4! shrink-0" />
                  <span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
                    {item.title}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
