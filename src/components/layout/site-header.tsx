"use client";

import { NotificationBell } from "@/features/notifications/components/notification-center";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject } from "@/features/projects/project.query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { isNavigationActive, navigation } from "./navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const projectId = pathname.match(/^\/projects\/([^/]+)\/?$/)?.[1] ?? "";
  const project = useProject(projectId);
  const group = navigation.find((group) =>
    group.items.some((item) => isNavigationActive(pathname, item.url)),
  );
  const item = group?.items.find((item) => isNavigationActive(pathname, item.url));
  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b-2 border-border bg-background px-4 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-3 text-xs font-extrabold uppercase tracking-[0.06em]">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Link href={group?.items[0]?.url ?? "/my-focus"} className="truncate text-muted-foreground hover:underline focus-visible:underline">{group?.label ?? "Workspace"}</Link>
        <span aria-hidden className="text-muted-foreground">/</span>
        {projectId ? (
          <>
            <Link href="/projects" className="min-w-0 shrink truncate hover:underline focus-visible:underline">{item?.title ?? "Projects Management"}</Link>
            <span aria-hidden className="shrink-0 text-muted-foreground">/</span>
            <span aria-current="page" className="min-w-0 truncate" title={project.data?.name}>{project.data?.name ?? (project.isPending ? "Loading..." : "Project details")}</span>
          </>
        ) : <span aria-current="page" className="truncate">{item?.title ?? "Cakra Orkestra"}</span>}
      </nav>
      <div className="ml-auto pl-3"><NotificationBell /></div>
    </header>
  );
}
