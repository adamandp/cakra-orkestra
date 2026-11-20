"use client";

import { useEffect, useRef, useState } from "react";
import { FocusTaskMetadata } from "./focus-task-list";
import { useMyFocus } from "@/features/dashboards/dashboard.query";
import { celebrateHistory } from "@/lib/celebration";
import { getScoreMonth } from "@/features/scores/score.constants";
import { useAuth } from "@/providers/auth-provider";
import { DashboardStatCards } from "@/features/dashboards/components/dashboard-stat-cards";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { taskKeys } from "@/features/tasks/task.query";
import { getTasks } from "@/features/tasks/task.api";
import {
  ArrowRightIcon,
  FolderCheckIcon,
  CheckCircle2Icon,
  SparklesIcon,
  ChartNoAxesCombinedIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardTaskList } from "@/features/dashboards/components/dashboard-task-list";
import { DashboardTaskSheet } from "@/features/dashboards/components/dashboard-task-sheet";

export function TaskHistory() {
  const [month, setMonth] = useState(getScoreMonth);
  const { user } = useAuth();
  const completedQuery = useQuery({
    queryKey: [...taskKeys.lists, "history-summary", user?.id, month],
    enabled: Boolean(user),
    placeholderData: keepPreviousData,
    refetchInterval: 5000,
    queryFn: async ({ signal }) => {
      const params = {
        scope: "me" as const,
        status: "DONE" as const,
        completed_month: month || undefined,
        limit: 100,
      };
      const first = await getTasks({ ...params, offset: 0 }, signal);
      const pages = await Promise.all(
        Array.from({ length: Math.max(0, Math.ceil(first.total / 100) - 1) }, (_, index) =>
          getTasks({ ...params, offset: (index + 1) * 100 }, signal),
        ),
      );
      return [first, ...pages].flatMap((page) => page.items);
    },
  });
  const completedProjects = new Set(
    completedQuery.data
      ?.filter((task) => task.project.status === "COMPLETED")
      .map((task) => task.project_id),
  );
  const completedTasks = completedQuery.data ?? [];
  const points = completedTasks.reduce(
    (sum, task) =>
      sum +
      (task.final_assessment?.status === "COMPLETED" ? (task.final_assessment.points ?? 0) : 0),
    0,
  );
  const average = completedTasks.length ? Number((points / completedTasks.length).toFixed(1)) : 0;
  const [selected, setSelected] = useState<string | null>(null);
  const summary = useMyFocus();
  const checked = useRef(false);
  const completed = summary.data?.completed_tasks;
  const ready = summary.isSuccess && summary.isFetchedAfterMount && !summary.isFetching;
  useEffect(() => {
    if (!ready || checked.current || completed === undefined) return;
    if (completed === 0) {
      checked.current = true;
      return;
    }
    const timer = window.setTimeout(() => {
      checked.current = true;
      celebrateHistory();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [ready, completed]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Task History"
        description="Review your completed tasks and final assessments."
      />
      {completedQuery.data && (
        <DashboardStatCards
          stats={[
            {
              label: "Completed projects",
              value: completedProjects.size,
              description: "Completed projects with your tasks in this period",
              icon: FolderCheckIcon,
              tone: "blue",
            },
            {
              label: "Completed tasks",
              value: completedTasks.length,
              description: "Your completed tasks in selected period",
              icon: CheckCircle2Icon,
              tone: "purple",
            },
            {
              label: "Approved points",
              value: `${points} pts`,
              description: "Final assessment points in selected period",
              icon: SparklesIcon,
              tone: "mint",
            },
            {
              label: "Avg. points / task",
              value: `${average} pts`,
              description: "Average final points per completed task",
              icon: ChartNoAxesCombinedIcon,
              tone: "yellow",
            },
          ]}
        />
      )}
      <DashboardTaskList
        title="Completed tasks"
        filters={{ scope: "me", status: "DONE", sort: "recent" }}
        month={month}
        onMonthChange={setMonth}
        personalFilters
        filterable
        renderContext={(task) => <FocusTaskMetadata task={task} />}
        initialPageSize={10}
        emptyMessage="No completed tasks yet."
        onInspect={setSelected}
        renderActions={(task) => (
          <Button size="icon-sm" variant="ghost" className="!size-8" aria-label="View task details" onClick={() => setSelected(task.id)}>
            <ArrowRightIcon />
          </Button>
        )}
      />
      {selected && (
        <DashboardTaskSheet
          personal
          key={selected}
          taskId={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
