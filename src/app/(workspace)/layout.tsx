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
          style={{ "--sidebar-width": "18rem", "--header-height": "3.5rem" } as CSSProperties}
        >
          <AppSidebar variant="inset" />
          <SidebarInset className="min-w-0 overflow-hidden border-border md:border-2 md:shadow-none">
            <SiteHeader />
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:p-6">
                <RouteAccessGate>{children}</RouteAccessGate>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </WorkspaceAuthGate>
  );
}
