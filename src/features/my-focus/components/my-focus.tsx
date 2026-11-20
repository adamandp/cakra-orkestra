"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardTaskSheet } from "@/features/dashboards/components/dashboard-task-sheet";
import { FocusReviews } from "./focus-reviews";
import { FocusSummary } from "./focus-summary";
import { FocusTaskList } from "./focus-task-list";

export function MyFocus() {
  const [selection, setSelection] = useState<{ id: string; panel?: "block" | "submit" } | null>(
    null,
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Focus"
        description="Manage your own tasks and track your contributions."
      />
      <FocusSummary />
      <FocusTaskList onInspect={(id, panel) => setSelection({ id, panel })} />
      <FocusReviews />
      {selection && (
        <DashboardTaskSheet
          personal
          key={selection.id}
          taskId={selection.id}
          initialPanel={selection.panel}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  );
}
