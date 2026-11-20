"use client";

import { ActivityIcon, BanIcon, CheckCircle2Icon, ClockIcon } from "lucide-react";
import { useTeamSummary } from "@/features/dashboards/dashboard.query";
import { DashboardState } from "@/features/dashboards/components/dashboard-state";
import { DashboardStatCards } from "@/features/dashboards/components/dashboard-stat-cards";

export function TeamSummary() {
  const query = useTeamSummary();
  const data = query.data;
  return (
    <DashboardState
      pending={query.isPending}
      error={query.error}
      onRetry={() => void query.refetch()}
    >
      {data && (
        <DashboardStatCards
          stats={[
            {
              label: "Waiting approval",
              value: data.waiting_approval_tasks,
              description: `${data.waiting_approval_points} estimated pts awaiting approval`,
              icon: ClockIcon,
            },
            {
              label: "Blocked tasks",
              value: data.blocked_tasks,
              description: "Need follow-up",
              icon: BanIcon,
            },
            {
              label: "Completion rate",
              value: `${data.completion_rate}%`,
              description: `${data.completed_tasks} of ${data.total_tasks} tasks`,
              icon: CheckCircle2Icon,
            },
            {
              label: "Active tasks",
              value: data.active_tasks,
              description: `Across ${data.active_projects} projects with active tasks`,
              icon: ActivityIcon,
            },
          ]}
        />
      )}
      {data && data.final_assessment_tasks > 0 && (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {data.final_assessment_tasks} approved and awaiting final AI resolution ·{" "}
          {data.failed_final_assessments} failed (admin retry required)
        </p>
      )}
    </DashboardState>
  );
}
