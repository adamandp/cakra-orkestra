"use client";

import { ActivityIcon, CheckCircle2Icon, ClockIcon, SparklesIcon } from "lucide-react";
import { useMyFocus } from "@/features/dashboards/dashboard.query";
import { DashboardState } from "@/features/dashboards/components/dashboard-state";
import { DashboardStatCards } from "@/features/dashboards/components/dashboard-stat-cards";

export function FocusSummary() {
  const query = useMyFocus();
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
              label: "Active tasks",
              value: data.active_tasks,
              description: `${data.waiting_approval_tasks} awaiting approval · ${data.blocked_tasks} blocked`,
              icon: ActivityIcon,
            },
            {
              label: "Potential points",
              value: `${data.potential_points} pts`,
              description: `${data.pending_points} awaiting approval · ${data.unestimated_tasks} not estimated`,
              icon: ClockIcon,
            },
            {
              label: "Approved points",
              value: `${data.approved_points} pts`,
              description: "Completed final assessments · All time",
              icon: SparklesIcon,
            },
            {
              label: "Completed tasks",
              value: data.completed_tasks,
              description: `${data.final_assessment_tasks} awaiting final AI resolution`,
              icon: CheckCircle2Icon,
            },
          ]}
        />
      )}
    </DashboardState>
  );
}
