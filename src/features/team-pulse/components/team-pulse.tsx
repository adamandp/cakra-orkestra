"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { UsersRoundIcon, ClipboardCheckIcon, ShieldAlertIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/providers/auth-provider";
import { DashboardTaskSheet } from "@/features/dashboards/components/dashboard-task-sheet";
import { TeamSummary } from "./team-summary";
import { ApprovalQueue } from "./approval-queue";
import { BlockerRadar } from "./blocker-radar";
import { MemberWorkloads } from "./member-workload";

export function TeamPulse() {
  return <Suspense fallback={null}><TeamPulseContent /></Suspense>;
}

function TeamPulseContent() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = requestedTab === "approval" || requestedTab === "blockers" ? requestedTab : "workload";
  useEffect(() => {
    if (requestedTab === activeTab) return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    window.history.replaceState(null, "", url);
  }, [requestedTab, activeTab]);
  function changeTab(value: unknown) {
    if (value !== "workload" && value !== "approval" && value !== "blockers") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") === value) return;
    url.searchParams.set("tab", value);
    window.history.pushState(null, "", url);
  }
  const { user } = useAuth();
  const [selection, setSelection] = useState<{ id: string; section?: "review" | "assessment" } | null>(null);
  const taskId = selection?.id;
  const setTaskId = (id: string | null) => setSelection(id ? { id } : null);
  if (user?.role !== "ADMIN") return null; // existing RouteAccessGate presents the forbidden state
  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Management"
        description="Monitor team progress, review approvals, and identify blockers."
      />
      <TeamSummary />
      <Tabs value={activeTab} onValueChange={changeTab} className="min-w-0 gap-4">
        <TabsList aria-label="Task management views" className="team-pulse-tabs relative isolate grid w-full grid-cols-3 gap-1 rounded-md border-2 border-border bg-muted/40 p-1.5 group-data-horizontal/tabs:h-auto sm:w-fit sm:gap-2">
          {[
            { value: "workload", label: "Member Workload", icon: UsersRoundIcon },
            { value: "approval", label: "Approval Queue", icon: ClipboardCheckIcon },
            { value: "blockers", label: "Blocker Radar", icon: ShieldAlertIcon },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="z-10 h-auto min-w-0 flex-col gap-1.5 rounded-[3px] border-2 border-transparent px-2 py-2.5 text-center text-xs font-semibold whitespace-normal text-muted-foreground hover:bg-background/60 hover:text-foreground data-active:text-foreground sm:flex-row sm:gap-2 sm:px-4 sm:text-sm">
              <Icon className="size-4 shrink-0" />
              {label}
            </TabsTrigger>
          ))}
          <TabsPrimitive.Indicator className="pointer-events-none absolute left-0 top-0 -z-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) translate-y-(--active-tab-top) rounded-[3px] border-2 border-border bg-[var(--yellow)] shadow-[2px_2px_0_var(--shadow-color)] transition-[translate,width,height] duration-250 ease-out motion-reduce:transition-none" />
        </TabsList>
        <TabsContent value="workload" className="team-pulse-panel min-w-0" keepMounted><MemberWorkloads onInspect={setTaskId} /></TabsContent>
        <TabsContent value="approval" className="team-pulse-panel min-w-0" keepMounted><ApprovalQueue onInspect={setTaskId} onAction={(id, section) => setSelection({ id, section })} /></TabsContent>
        <TabsContent value="blockers" className="team-pulse-panel min-w-0" keepMounted><BlockerRadar onInspect={setTaskId} /></TabsContent>
      </Tabs>
      {taskId && (
        <DashboardTaskSheet key={taskId + (selection?.section ?? "")} taskId={taskId} initialSection={selection?.section} onClose={() => setTaskId(null)} />
      )}
    </div>
  );
}
