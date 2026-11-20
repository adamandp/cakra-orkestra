"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardTaskSheet } from "@/features/dashboards/components/dashboard-task-sheet";
import { FocusSummary } from "./focus-summary";
import { FocusTaskList } from "./focus-task-list";

export function MyFocus() {
  const [taskId, setTaskId] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Focus"
        description="Manage your own tasks and track your contributions."
        actions={
          <Link className={buttonVariants({ variant: "outline" })} href="/tasks">
            Manage Tasks
          </Link>
        }
      />
      <FocusSummary />
      <FocusTaskList onInspect={setTaskId} />
      {taskId && (
        <DashboardTaskSheet key={taskId} taskId={taskId} onClose={() => setTaskId(null)} />
      )}
    </div>
  );
}
