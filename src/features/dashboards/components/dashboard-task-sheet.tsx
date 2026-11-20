"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import type { TaskDetail } from "@/interface/task.interface";
import { TaskInspector } from "@/features/tasks/components/task-inspector";
import { TaskFormSheet } from "@/features/tasks/components/task-form-sheet";
import { TaskAssigneeSheet } from "@/features/tasks/components/task-assignee-sheet";

type SheetState =
  | { action: "inspect"; id: string }
  | { action: "edit"; task: TaskDetail }
  | { action: "reassign"; task: TaskDetail };

export function DashboardTaskSheet({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { user } = useAuth();
  const [sheet, setSheet] = useState<SheetState>({ action: "inspect", id: taskId });
  if (!user) return null;
  const actorId = user.id;
  const isAdmin = user.role === "ADMIN";
  function inspect(id: string) {
    setSheet({ action: "inspect", id });
  }

  if (sheet.action === "edit")
    return (
      <TaskFormSheet
        key={sheet.task.id}
        task={sheet.task}
        actorId={actorId}
        isAdmin={isAdmin}
        onClose={() => inspect(sheet.task.id)}
        onSaved={inspect}
      />
    );
  if (sheet.action === "reassign")
    return isAdmin ? (
      <TaskAssigneeSheet
        key={sheet.task.id}
        task={sheet.task}
        actorId={actorId}
        onClose={() => inspect(sheet.task.id)}
        onSaved={inspect}
      />
    ) : null;
  return (
    <TaskInspector
      key={sheet.id}
      taskId={sheet.id}
      actorId={actorId}
      isAdmin={isAdmin}
      onClose={onClose}
      onDeleted={onClose}
      onEdit={(task) => setSheet({ action: "edit", task })}
      onReassign={(task) => {
        if (isAdmin) setSheet({ action: "reassign", task });
      }}
    />
  );
}
