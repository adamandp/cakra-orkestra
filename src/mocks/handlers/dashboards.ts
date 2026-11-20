import { http, HttpResponse } from "msw";
import { getMockUser } from "../data/auth-store";
import { getMockMyFocus, getMockTeamSummary, getMockMemberWorkloads } from "../data/dashboards";
import { getMockTasks } from "../data/tasks";
import type { FocusReviewEvent } from "@/interface/dashboard.interface";
import { requireMockAdmin } from "./authorization";

export const dashboardHandlers = [
  http.get("*/api/dashboards/my-focus/reviews", ({ request }) => {
    const actor = getMockUser(request);
    if (!actor) return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    const events: FocusReviewEvent[] = [];
    for (const task of getMockTasks().filter((t) => !t.deleted_at && t.assignee_id === actor.id)) {
      if (task.approved_at)
        events.push({
          id: task.id + ":" + task.approved_at,
          title: task.title,
          kind: "approved",
          reason: null,
          created_at: task.approved_at,
        });
      for (const h of task.status_histories) {
        if (h.previous_status === "PENDING" && h.current_status === "PROGRESS")
          events.push({
            id: h.id,
            title: task.title,
            kind: "rejected",
            reason: h.reason,
            created_at: h.created_at,
          });
      }
    }
    return HttpResponse.json({
      data: events.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    });
  }),
  http.get("*/api/dashboards/my-focus", ({ request }) => {
    const actor = getMockUser(request);
    if (!actor) return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    return HttpResponse.json({ data: getMockMyFocus(actor.id) });
  }),
  http.get("*/api/dashboards/team-pulse/summary", ({ request }) => {
    const actor = requireMockAdmin(request);
    if (actor.error) return actor.error;
    return HttpResponse.json({ data: getMockTeamSummary() });
  }),
  http.get("*/api/dashboards/team-pulse/workloads", ({ request }) => {
    const actor = requireMockAdmin(request);
    if (actor.error) return actor.error;
    return HttpResponse.json({ data: getMockMemberWorkloads() });
  }),
];
