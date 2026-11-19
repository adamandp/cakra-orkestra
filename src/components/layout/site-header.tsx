"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { isNavigationActive, navigation } from "./navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const currentPage = navigation
    .flatMap((group) => group.items)
    .find((item) => isNavigationActive(pathname, item.url));

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b-2 border-border transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-5 data-vertical:self-auto" />
        <span className="text-sm font-bold">{currentPage?.title ?? "Cakra Orkestra"}</span>
      </div>
    </header>
  );
}
