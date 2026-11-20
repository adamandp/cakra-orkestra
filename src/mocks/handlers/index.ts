import { attendanceHandlers } from "./attendance";
import { wallHandlers } from "./wall";
import { notificationHandlers } from "./notifications";
import { activityLogHandlers } from "./activity-logs";
import type { RequestHandler } from "msw";
import { authHandlers } from "./auth";
import { userHandlers } from "./users";
import { roleHandlers } from "./roles";
import { projectHandlers } from "./projects";
import { taskHandlers } from "./tasks";
import { taskEvidenceHandlers } from "./task-evidences";
import { taskAIResultHandlers } from "./task-ai-results";
import { changelogHandlers } from "./changelogs";
import { scoreHandlers } from "./scores";
import { dashboardHandlers } from "./dashboards";

export const handlers: RequestHandler[] = [
  ...attendanceHandlers,
  ...wallHandlers,
  ...activityLogHandlers,
  ...notificationHandlers,
  ...authHandlers,
  ...userHandlers,
  ...roleHandlers,
  ...projectHandlers,
  ...taskHandlers,
  ...taskEvidenceHandlers,
  ...taskAIResultHandlers,
  ...changelogHandlers,
  ...scoreHandlers,
  ...dashboardHandlers,
];
