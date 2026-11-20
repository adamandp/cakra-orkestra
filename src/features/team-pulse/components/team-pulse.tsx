"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/providers/auth-provider";
import { DashboardTaskSheet } from "@/features/dashboards/components/dashboard-task-sheet";
import { TeamSummary } from "./team-summary";
import { ApprovalQueue } from "./approval-queue";
import { BlockerRadar } from "./blocker-radar";
import { MemberWorkloads } from "./member-workload";

export function TeamPulse() {
  const { user } = useAuth();
  const [taskId, setTaskId] = useState<string | null>(null);
  if (user?.role !== "ADMIN") return null; // existing RouteAccessGate presents the forbidden state
  return (
    <div className="space-y-6">
      <PageHeader
        title="PM & Team Pulse"
        description="Monitor team progress, review approvals, and identify blockers."
      />
      <TeamSummary />
      <ApprovalQueue onInspect={setTaskId} />
      <BlockerRadar onInspect={setTaskId} />
      <MemberWorkloads onInspect={setTaskId} />
      {taskId && (
        <DashboardTaskSheet key={taskId} taskId={taskId} onClose={() => setTaskId(null)} />
      )}
    </div>
  );
}
