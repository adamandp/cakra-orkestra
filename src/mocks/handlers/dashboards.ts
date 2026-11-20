import { http, HttpResponse } from "msw";
import { getMockUser } from "../data/auth-store";
import { getMockMyFocus, getMockTeamSummary, getMockMemberWorkloads } from "../data/dashboards";
import { requireMockAdmin } from "./authorization";

export const dashboardHandlers = [
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
