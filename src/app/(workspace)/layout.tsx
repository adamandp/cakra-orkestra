import type { CSSProperties, ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RouteAccessGate, WorkspaceAuthGate } from "@/features/auth/components/auth-gate";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceAuthGate>
      <TooltipProvider>
        <SidebarProvider
          className="h-svh overflow-hidden"
          style={{ "--header-height": "5rem" } as CSSProperties}
        >
          <AppSidebar variant="sidebar" />
          <SidebarInset className="min-w-0 overflow-hidden">
            <SiteHeader />
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="@container/main flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:px-8 lg:py-5">
                <RouteAccessGate>{children}</RouteAccessGate>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </WorkspaceAuthGate>
  );
}
